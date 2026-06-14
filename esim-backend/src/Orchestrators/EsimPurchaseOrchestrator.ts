import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
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
import { AuditLogService } from 'src/AuditLog/AuditLog.service';
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

    // Compute the actual channel before creating the transaction so the DB row
    // has the correct value. The controller always sends 'B2C' but the real
    // channel depends on the caller's role — this fixes the B2B2C wallet-commit
    // and the activation-job channel that both read transaction.channel.
    const channel = salesman.role === 'SALESMAN' ? 'B2B2C' : 'B2C';

    const transaction = await this.transactionService.createInitial(
      { ...dto, channel },
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
      message: `Purchase initiated via ${channel}`,
    });

    const fundingSource =
      channel === 'B2B2C' ? FundingSource.WALLET : FundingSource.GATEWAY;

    // Transition PENDING → PROCESSING (B2B2C) or PENDING → PENDING_PAYMENT (B2C)
    await this.transactionService.transition(
      transaction.id,
      channel === 'B2B2C'
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
        channel,
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
        channel,
        paymentUrl: funding.paymentUrl,
      };
    }

    // FUNDED — B2B2C wallet reserved, transition PROCESSING → PROVISIONING
    if (channel === 'B2B2C') {
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
        channel,
        offerId: dto.offerId,
        amount: dto.amount * 1000,
        currency: dto.currency,
        paymentMethod: dto.paymentMethod,
        activateNow: dto.activateNow,
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
      return {
        transactionId: transaction.id,
        channel,
        message: 'QUEUE_FAILED',
      };
    }

    return { transactionId: transaction.id, channel, message: 'SUCCESS' };
  }
  // ── User-triggered activation (B2C post-payment) ───────────────────────────
  // Called by POST /transaction/:id/activate after the user taps "Activer l'eSIM".
  // Transitions PAID → PROVISIONING and enqueues purchase-esim with chainActivation,
  // which causes the processor to automatically chain activate-esim after provisioning.
  async activateAfterPayment(transactionId: number, userId: number) {
    const transaction = await this.transactionService.findOne(transactionId);
    if (!transaction) {
      throw new NotFoundException(`Transaction ${transactionId} not found`);
    }
    if (transaction.userId !== userId) {
      throw new ForbiddenException();
    }
    if (transaction.status !== TransactionStatus.PAID) {
      throw new BadRequestException(
        `Transaction must be in PAID status to activate (current: ${transaction.status})`,
      );
    }

    await this.transactionService.transition(
      transactionId,
      TransactionStatus.PROVISIONING,
      'user-activation',
    );

    await this.esimProducer.enqueuePurchase({
      transactionId,
      userId,
      channel: transaction.channel as 'B2C' | 'B2B2C',
      offerId: transaction.offerId,
      amount: Number(transaction.amount),
      currency: transaction.currency,
      chainActivation: true,
    });

    await this.auditLogService.log({
      transactionId,
      userId,
      layer: AuditLayer.PROVISIONING,
      event: SystemEvent.PURCHASE_REQUESTED,
      fromStatus: 'PAID',
      toStatus: 'PROVISIONING',
      triggeredBy: AuditTrigger.USER,
      message: 'User triggered eSIM provisioning after payment confirmation',
    });

    return { transactionId, status: 'PROVISIONING' };
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
