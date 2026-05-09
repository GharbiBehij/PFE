import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  AuditLayer,
  AuditTrigger,
  SystemEvent,
  TransactionStatus,
} from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';
import { AuditLogService } from '../ProvisionningEvent/AuditLog.service';
import { EsimProducer } from '../Queue/Producer/esim.producer';
import { EsimTopupOrchestrator } from '../Orchestrators/Esimtopup.orchestrator';
import { TransactionService } from '../transaction/transaction.service';
import { PAYMENT_GATEWAY_ADAPTER } from './adapters/payment-gateway.token';
import { PaymentGatewayAdapter } from './interfaces/payment-gateway.interface';

@Injectable()
export class PaymentVerificationService {
  private readonly logger = new Logger(PaymentVerificationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly transactionService: TransactionService,
    private readonly auditLogService: AuditLogService,
    private readonly esimProducer: EsimProducer,
    private readonly esimTopupOrchestrator: EsimTopupOrchestrator,
    @Inject(PAYMENT_GATEWAY_ADAPTER)
    private readonly gatewayAdapter: PaymentGatewayAdapter,
  ) {}

  async verifyAndProcess(orderId: string): Promise<{
    status: 'SUCCESS' | 'FAILED';
    transactionId: number;
  }> {
    const payment = await this.prisma.payment.findUnique({
      where: { gatewayPaymentId: orderId },
      include: { transaction: true },
    });

    if (!payment) {
      throw new NotFoundException(`No payment found for orderId=${orderId}`);
    }

    const transaction = payment.transaction;
    const transactionId = transaction.id;
    const userId = transaction.userId;

    if (
      transaction.status === TransactionStatus.PAID ||
      transaction.status === TransactionStatus.PROVISIONING ||
      transaction.status === TransactionStatus.SUCCEEDED
    ) {
      this.logger.log(
        `[verify] txId=${transactionId} already processed — status=${transaction.status}`,
      );
      return { status: 'SUCCESS', transactionId };
    }

    if (transaction.status === TransactionStatus.FAILED) {
      return { status: 'FAILED', transactionId };
    }

    const { status } = await this.gatewayAdapter.fetchPaymentStatus(orderId);

    this.logger.log(
      `[verify] txId=${transactionId} orderId=${orderId} status=${status}`,
    );

    if (status === 'FAILED') {
      await this.transactionService.transition(
        transactionId,
        TransactionStatus.FAILED,
        'payment-verification',
      );

      await this.auditLogService.log({
        transactionId,
        userId,
        layer: AuditLayer.PAYMENT,
        event: SystemEvent.PAYMENT_FAILED,
        fromStatus: 'PENDING_PAYMENT',
        toStatus: 'FAILED',
        triggeredBy: AuditTrigger.PAYMENT_GATEWAY,
        message: `ClicToPay payment failed for orderId=${orderId}`,
      });

      return { status: 'FAILED', transactionId };
    }

    if (status === 'PENDING') {
      throw new BadRequestException(
        `Payment still pending for orderId=${orderId}`,
      );
    }

    await this.transactionService.transition(
      transactionId,
      TransactionStatus.PAID,
      'payment-verification',
    );

    await this.auditLogService.log({
      transactionId,
      userId,
      layer: AuditLayer.PAYMENT,
      event: SystemEvent.PAYMENT_CONFIRMED,
      fromStatus: 'PENDING_PAYMENT',
      toStatus: 'PAID',
      triggeredBy: AuditTrigger.PAYMENT_GATEWAY,
      message: `ClicToPay payment confirmed for orderId=${orderId}`,
    });

    const isTopup = this.esimTopupOrchestrator.isTopupPayment(
      payment.rawResponse,
    );

    if (isTopup) {
      await this.transactionService.transition(
        transactionId,
        TransactionStatus.PROVISIONING,
        'payment-verification',
      );

      await this.auditLogService.log({
        transactionId,
        userId,
        layer: AuditLayer.PROVISIONING,
        event: SystemEvent.PROVISIONING_ENQUEUED,
        fromStatus: 'PAID',
        toStatus: 'PROVISIONING',
        triggeredBy: AuditTrigger.WORKER,
        message: 'Routing to eSIM top-up handler',
      });

      await this.esimTopupOrchestrator.handlePaidTopup(transactionId, userId);
    } else {
      await this.transactionService.transition(
        transactionId,
        TransactionStatus.PROVISIONING,
        'payment-verification',
      );

      await this.auditLogService.log({
        transactionId,
        userId,
        layer: AuditLayer.PROVISIONING,
        event: SystemEvent.PROVISIONING_ENQUEUED,
        fromStatus: 'PAID',
        toStatus: 'PROVISIONING',
        triggeredBy: AuditTrigger.WORKER,
        message: 'eSIM purchase job enqueued',
      });

      await this.esimProducer.enqueuePurchase({
        transactionId,
        userId,
        channel: transaction.channel as 'B2C' | 'B2B2C',
        offerId: transaction.offerId,
        amount: Number(transaction.amount),
        currency: transaction.currency,
        paymentMethod: payment.paymentProvider as 'WALLET' | 'CASH',
      });
    }

    return { status: 'SUCCESS', transactionId };
  }
}
