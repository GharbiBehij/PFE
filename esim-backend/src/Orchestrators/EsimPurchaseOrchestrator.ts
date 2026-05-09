import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { CreateTransactionDto } from 'src/transaction/dto/create-transaction.dto';
import { TransactionService } from 'src/transaction/transaction.service';
import { EsimProducer } from 'src/Queue/Producer/esim.producer';
import { userService } from 'src/user/user.service';
import {
  AuditLayer,
  AuditTrigger,
  SystemEvent,
  TransactionStatus,
} from '@prisma/client';
import { AuditLogService } from 'src/ProvisionningEvent/AuditLog.service';
import {
  FundingService,
  FundingSource,
} from '../payment/Webhook/funding.service';

@Injectable()
export class EsimPurchaseOrchestrator {
  constructor(
    private readonly transactionService: TransactionService,
    @Inject(forwardRef(() => userService))
    private readonly userService: userService,
    private readonly esimProducer: EsimProducer,
    private readonly fundingService: FundingService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async purchaseEsim(dto: CreateTransactionDto, salesmanId: number) {
    const salesman = await this.userService.findById(salesmanId);
    if (!salesman) throw new Error('Salesman does not exist');

    const client = await this.resolveClient(dto);

    const transaction = await this.transactionService.createInitial(
      dto,
      client.id,
    );
    // State: PENDING ✓ (createInitial sets this)

    await this.auditLogService.log({
      transactionId: transaction.id,
      userId: client.id,
      layer: AuditLayer.PROVISIONING,
      event: SystemEvent.PURCHASE_REQUESTED,
      toStatus: 'PENDING',
      triggeredBy: AuditTrigger.USER,
      message: `Purchase initiated via ${dto.channel}`,
    });

    const fundingSource =
      dto.channel === 'B2B2C' ? FundingSource.WALLET : FundingSource.GATEWAY;

    // Transition PENDING → PROCESSING (B2B2C) or PENDING → PENDING_PAYMENT (B2C)
    await this.transactionService.transition(
      transaction.id,
      dto.channel === 'B2B2C'
        ? TransactionStatus.PROCESSING
        : TransactionStatus.PENDING_PAYMENT,
      'orchestrator',
    );

    const funding = await this.fundingService.execute(
      fundingSource,
      dto,
      transaction.id,
      client.id,
      salesmanId,
    );

    // FAILED
    if (funding.status === 'FAILED') {
      await this.transactionService.transition(
        transaction.id,
        TransactionStatus.FAILED,
        'orchestrator',
      );
      await this.auditLogService.log({
        transactionId: transaction.id,
        userId: client.id,
        layer:
          fundingSource === FundingSource.WALLET
            ? AuditLayer.WALLET
            : AuditLayer.PAYMENT,
        event:
          fundingSource === FundingSource.WALLET
            ? SystemEvent.WALLET_FAILED
            : SystemEvent.PAYMENT_FAILED,
        toStatus: 'FAILED',
        triggeredBy:
          fundingSource === FundingSource.WALLET
            ? AuditTrigger.WORKER
            : AuditTrigger.PAYMENT_GATEWAY,
        message: funding.error,
      });
      return {
        transactionId: transaction.id,
        status: 'FAILED',
        message:
          fundingSource === FundingSource.WALLET
            ? 'WALLET_FAILED'
            : 'PAYMENT_FAILED',
        error: funding.error,
      };
    }

    // PENDING — B2C gateway waiting for webhook confirmation.
    // Do NOT enqueue provisioning here; WebhookService handles that on SUCCESS.
    if (funding.status === 'PENDING') {
      await this.auditLogService.log({
        transactionId: transaction.id,
        userId: client.id,
        layer: AuditLayer.PAYMENT,
        event: SystemEvent.PAYMENT_INITIATED,
        toStatus: 'PENDING_PAYMENT',
        triggeredBy: AuditTrigger.PAYMENT_GATEWAY,
        message: 'Payment initiated — awaiting gateway webhook confirmation',
      });
      return {
        transactionId: transaction.id,
        status: 'PENDING_PAYMENT',
        paymentUrl: funding.paymentUrl,
      };
    }

    // FUNDED — B2B2C wallet reserved, transition PROCESSING → PROVISIONING
    if (dto.channel === 'B2B2C') {
      await this.transactionService.transition(
        transaction.id,
        TransactionStatus.PROVISIONING,
        'orchestrator',
      );
    }
    // Enqueue provisioning job
    try {
      await this.esimProducer.enqueuePurchase({
        transactionId: transaction.id,
        userId: client.id,
        channel: dto.channel,
        offerId: dto.offerId,
        amount: dto.amount * 1000,
        currency: dto.currency,
        paymentMethod: dto.paymentMethod,
      });
      
    } catch (error) {
      await this.fundingService.releaseWalletFunds(transaction.id);
      await this.transactionService.transition(
        transaction.id,
        TransactionStatus.FAILED,
        'orchestrator',
      );
      await this.auditLogService.log({
        transactionId: transaction.id,
        userId: client.id,
        layer: AuditLayer.PROVISIONING,
        event: SystemEvent.PROVISIONING_FAILED,
        toStatus: 'FAILED',
        triggeredBy: AuditTrigger.WORKER,
        message: `Failed to enqueue provisioning job: ${error instanceof Error ? error.message : String(error)}`,
      });
      return { transactionId: transaction.id, message: 'QUEUE_FAILED' };
    }

    return { transactionId: transaction.id, message: 'SUCCESS' };
  }
  private async resolveClient(dto: CreateTransactionDto) {
    if (dto.channel === 'B2B2C') {
      const client = await this.userService.findByEmail(dto.email);
      if (!client) {
        throw new Error('Client email not found for B2B2C transaction');
      }
      return client;
    } else {
      // B2C: create or retrieve user by email
      const user = await this.userService.findByEmail(dto.email);
      if (!user) {
        throw new Error('User email not found for B2C transaction');
      }
      return user;
    }
  }
}
