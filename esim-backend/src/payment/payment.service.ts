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
import { Transaction } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';
import { AuditLogService } from '../AuditLog/AuditLog.service';
import { EsimProducer } from '../Queue/Producer/esim.producer';
import { TransactionService } from '../transaction/transaction.service';
import { PAYMENT_GATEWAY_ADAPTER } from './adapters/payment-gateway.token';
import { PaymentGatewayAdapter } from './interfaces/payment-gateway.interface';
import { PaymentRepository } from './payment.repository';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private readonly paymentRepository: PaymentRepository,
    private readonly transactionService: TransactionService,
    private readonly prisma: PrismaService,
    private readonly auditLogService: AuditLogService,
    private readonly esimProducer: EsimProducer,
    @Inject(PAYMENT_GATEWAY_ADAPTER)
    private readonly gatewayAdapter: PaymentGatewayAdapter,
  ) {}

  // ── Payment Initiation ────────────────────────────────────────────────────
  // Called by PaymentController POST /payment.
  // called by the orchestartor while initiating a purchase or top-up transaction, to register the order with the payment gateway and get the redirect URL.
  // Registers the order with ClicToPay and returns the redirect URL.
  // Logs PAYMENT_INITIATED for traceability.
  async initiatePayment(transaction: Transaction): Promise<{
    gatewayOrderId: string;
    paymentUrl: string;//formUrl from ClicToPay response
  }> {
    try {
      this.logger.log(
        `[initiate] txId=${transaction.id} userId=${transaction.userId} amount=${transaction.amount} currency=${transaction.currency} type=${transaction.type} channel=${transaction.channel}`,
      );
      const result = await this.paymentRepository.initiatePayment(transaction);
      this.logger.log(
        `Payment initiated for tx ${transaction.id}: gateway=${result.gatewayOrderId}`,
      );

      await this.auditLogService.log({
        transactionId: transaction.id,
        userId: transaction.userId,
        layer: AuditLayer.PAYMENT,
        event: SystemEvent.PAYMENT_INITIATED,
        fromStatus: 'PENDING',
        toStatus: 'PENDING_PAYMENT',
        triggeredBy: AuditTrigger.USER,
        message: `ClicToPay order registered: gatewayOrderId=${result.gatewayOrderId}`,
      });

      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `initiatePayment failed for txId=${transaction.id}: ${message}`,
      );
      throw error;
    }
  }

  // ── Simple Payment Status Poll ────────────────────────────────────────────
  // Called by PaymentController GET /payment/verify.
  // Read-only: checks ClicToPay status without advancing transaction state.
  // Used by the mobile app to poll for payment result after redirect.
  async verifyPayment(transactionId: number): Promise<{
    paid: boolean;
    status: string;
    gatewayStatus: number;
    pan?: string;
    approvalCode?: string;
  }> {
    const transaction = await this.transactionService.findOne(transactionId);

    if (!transaction) {
      throw new Error(`Transaction ${transactionId} not found`);
    }

    const payment =
      await this.paymentRepository.findByTransactionId(transactionId);
    if (!payment?.gatewayPaymentId) {
      throw new Error(`Transaction ${transactionId} has no gateway payment ID`);
    }

    this.logger.log(
      `[verify:poll] txId=${transactionId} gatewayPaymentId=${payment.gatewayPaymentId}`,
    );

    return this.mapVerificationResult(
      await this.paymentRepository.checkPaymentStatus(payment.gatewayPaymentId),
      transactionId,
    );
  }

  // ── Full Payment Verification & Processing ────────────────────────────────
  // Called by PaymentController POST /payment/verify (after ClicToPay redirect).
  // Fetches gateway status, transitions the transaction state machine,
  // logs audit events, and enqueues the appropriate provisioning job
  // (eSIM purchase or data top-up).
 async verifyAndProcess(orderId: string) {
  this.logger.log(`[verify] start orderId=${orderId}`);

  const payment = await this.prisma.payment.findUnique({
    where: { gatewayPaymentId: orderId },
    include: { transaction: true },
  });

  if (!payment) {
    throw new NotFoundException(`No payment found for orderId=${orderId}`);
  }

  const transaction = payment.transaction;

  // ── IDEMPOTENCY ─────────────────────────────
  if (
    transaction.status === TransactionStatus.PAID ||
    transaction.status === TransactionStatus.PROVISIONING ||
    transaction.status === TransactionStatus.SUCCEEDED
  ) {
    this.logger.log(`[verify] already processed ${orderId}`);
    return { status: 'SUCCESS', transactionId: transaction.id };
  }

  if (transaction.status === TransactionStatus.FAILED) {
    this.logger.log(`[verify] already failed ${orderId}`);
    return { status: 'FAILED', transactionId: transaction.id };
  }

  // ── CHECK GATEWAY ───────────────────────────
  const { status } =
    await this.gatewayAdapter.fetchPaymentStatus(orderId);

  this.logger.log(`[verify] gateway status=${status}`);

  // ── FAILED ───────────────────────────────────
  if (status === 'FAILED') {
    await this.transactionService.transition(
      transaction.id,
      TransactionStatus.FAILED,
      'payment-verification',
    );
    await this.paymentRepository.updateStatusByGatewayPaymentId(orderId, 'FAILED');
    await this.auditLogService.log({
      transactionId: transaction.id,
      userId: transaction.userId,
      layer: AuditLayer.PAYMENT,
      event: SystemEvent.PAYMENT_FAILED,
      fromStatus: 'PENDING_PAYMENT',
      toStatus: 'FAILED',
      triggeredBy: AuditTrigger.PAYMENT_GATEWAY,
      message: `Payment declined by gateway: orderId=${orderId}`,
    });

    return { status: 'FAILED', transactionId: transaction.id };
  }

  // ── PENDING ──────────────────────────────────
  if (status === 'PENDING') {
    return { status: 'PENDING', transactionId: transaction.id };
  }

  // ── SUCCESS ──────────────────────────────────
  await this.transactionService.transition(
    transaction.id,
    TransactionStatus.PAID,
    'payment-verification',
  );
  await this.paymentRepository.updateStatusByGatewayPaymentId(orderId, 'COMPLETED');
  await this.auditLogService.log({
    transactionId: transaction.id,
    userId: transaction.userId,
    layer: AuditLayer.PAYMENT,
    event: SystemEvent.PAYMENT_CONFIRMED,
    fromStatus: 'PENDING_PAYMENT',
    toStatus: 'PAID',
    triggeredBy: AuditTrigger.PAYMENT_GATEWAY,
    message: `Payment confirmed: orderId=${orderId}`,
  });

  // TOPUP: auto-provision immediately (no user action required for data top-ups)
  const isTopup = transaction.type === 'TOPUP';
  if (isTopup) {
    await this.transactionService.transition(
      transaction.id,
      TransactionStatus.PROVISIONING,
      'payment-verification',
    );
    const raw = payment.rawResponse as Record<string, any> | null;
    await this.esimProducer.enqueueTopup({
      transactionId: transaction.id,
      userId: transaction.userId,
      esimId: Number(raw?.esimId),
      offerId: Number(transaction.offerId),
    });
  }
  // PURCHASE: stay at PAID — user explicitly activates via POST /transaction/:id/activate

  return { status: 'SUCCESS', transactionId: transaction.id };
}

  // ── Internal: Map ClicToPay numeric status to labeled result ─────────────
  private mapVerificationResult(
    result: { status: number; pan?: string; approvalCode?: string },
    transactionId: number,
  ) {
    const paid = result.status === 2;

    let statusLabel: string;
    switch (result.status) {
      case 0:
        statusLabel = 'REGISTERED';
        break;
      case 1:
        statusLabel = 'PRE_AUTH';
        break;
      case 2:
        statusLabel = 'DEPOSITED';
        break;
      case 3:
        statusLabel = 'REVERSED';
        break;
      case 4:
        statusLabel = 'REFUNDED';
        break;
      case 5:
        statusLabel = 'ACS_INITIATED';
        break;
      case 6:
        statusLabel = 'DECLINED';
        break;
      default:
        statusLabel = 'UNKNOWN';
        break;
    }

    this.logger.log(
      `Payment verification for tx ${transactionId}: ClicToPay status=${result.status} (${statusLabel})`,
    );

    return {
      paid,
      status: statusLabel,
      gatewayStatus: result.status,
      pan: result.pan,
      approvalCode: result.approvalCode,
    };
  }
}
