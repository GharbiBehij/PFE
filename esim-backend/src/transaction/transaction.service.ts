import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { TransactionRepository } from './transaction.repository';
import { OfferService } from '../offer/offer.service';
import {
  TransactionStatus,
  TransactionType,
  EsimStatus,
  AuditLayer,
  AuditTrigger,
  SystemEvent,
} from '@prisma/client';
import { ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ClicToPayService } from '../payment/clictopay/clictopay.service';
import { NotificationService } from '../notification/notification.service';
import { AuditLogService } from '../AuditLog/AuditLog.service';

export const TERMINAL_STATUSES = new Set<TransactionStatus>([
  TransactionStatus.FAILED,
  TransactionStatus.COMPLETED,
  TransactionStatus.SUCCEEDED,
  TransactionStatus.EXPIRED,
  TransactionStatus.REFUNDED,
]);

const transitions: Record<string, TransactionStatus[]> = {
  PENDING_PAYMENT: [
    TransactionStatus.PAID,
    TransactionStatus.FAILED,
    TransactionStatus.EXPIRED,
    TransactionStatus.AUTHORIZED,
  ],
  AUTHORIZED: [
    TransactionStatus.PAID,
    TransactionStatus.FAILED,
    TransactionStatus.EXPIRED,
  ],
  PAID: [TransactionStatus.PROVISIONING],

  PENDING: [
    TransactionStatus.PENDING_PAYMENT,
    TransactionStatus.PROCESSING,
    TransactionStatus.FAILED,
  ],
  PROCESSING: [
    TransactionStatus.PROVISIONING,
    TransactionStatus.SUCCEEDED,
    TransactionStatus.FAILED,
  ],
  PROVISIONING: [
    TransactionStatus.COMPLETED,
    TransactionStatus.SUCCEEDED,
    TransactionStatus.FAILED,
  ],

  SUCCEEDED: [],
  EXPIRED: [],
  COMPLETED: [],
  FAILED: [TransactionStatus.REFUNDED],
  REFUNDED: [],
};

@Injectable()
export class TransactionService {
  private readonly logger = new Logger(TransactionService.name);

  constructor(
    private readonly transactionRepository: TransactionRepository,
    private readonly offerService: OfferService,
    private readonly clicToPayService: ClicToPayService,
    private readonly notificationService: NotificationService,
    private readonly auditLogService: AuditLogService,
  ) {}

  private assertValidTransition(
    current: TransactionStatus,
    next: TransactionStatus,
  ) {
    if (!transitions[current]?.includes(next)) {
      throw new Error(`Invalid transition: ${current} → ${next}`);
    }
  }

  async transition(
    id: number,
    next: TransactionStatus,
    source = 'unknown',
    correlationId?: string,
  ) {
    const tx = await this.transactionRepository.findOne(id);
    if (!tx) throw new NotFoundException(`Transaction ${id} not found`);

    const tag = correlationId ? ` cid=${correlationId}` : '';

    // Idempotency: already in target state → no-op (safe for duplicate webhook/job)
    if (tx.status === next) {
      this.logger.log(`[${source}] txId=${id} already ${next} — skipped${tag}`);
      return tx;
    }

    // Terminal guard: silently absorb updates to terminal transactions
    if (TERMINAL_STATUSES.has(tx.status)) {
      this.logger.warn(
        `[${source}] txId=${id} is terminal (${tx.status}) — ignoring → ${next}${tag}`,
      );
      return tx;
    }

    this.assertValidTransition(tx.status, next);
    this.logger.log(`[${source}] txId=${id} ${tx.status} → ${next}${tag}`);
    return this.transactionRepository.updateStatus(id, next);
  }

  async createInitial(dto: CreateTransactionDto, userId: number) {
    const offer = await this.offerService.findbyId(dto.offerId);
    if (!offer) {
      throw new NotFoundException(`Offer with ID ${dto.offerId} not found`);
    }

    return this.transactionRepository.createInitial({
      offerId: offer.id,
      amount: offer.price,
      currency: 'TND',
      channel: dto.channel,
      type: TransactionType.PURCHASE,
      userId,
      status: TransactionStatus.PENDING,
    });
  }

  async requestRefund(transactionId: number, userId: number) {
    const transaction =
      await this.transactionRepository.findWithRelations(transactionId);
    if (!transaction) throw new ForbiddenException('Transaction not found.');
    if (transaction.userId !== userId) throw new ForbiddenException();
    const esim = transaction.esim?.[0];
    if (!esim || esim.status !== EsimStatus.NOT_ACTIVE) {
      throw new ForbiddenException(
        'eSIM has already been activated and cannot be refunded.',
      );
    }
    const hoursSincePurchase =
      (Date.now() - transaction.createdAt.getTime()) / 3_600_000;
    if (hoursSincePurchase > 24) {
      throw new ForbiddenException('Refund window has expired (24 hours).');
    }
    const payment = transaction.payment;
    if (!payment?.gatewayPaymentId) {
      throw new ForbiddenException('Payment reference is missing.');
    }
    const isToday =
      new Date(payment.createdAt).toDateString() === new Date().toDateString();
    if (isToday) {
      await this.clicToPayService.reverseOrder(payment.gatewayPaymentId);
    } else {
      await this.clicToPayService.refundOrder(
        payment.gatewayPaymentId,
        transaction.amount,
      );
    }

    // Atomically update payment, transaction, and eSIM statuses via repository
    await this.transactionRepository.applyRefundStatuses(
      payment.id,
      transactionId,
      esim.id,
    );

    // Transition transaction to REFUNDED and create refund record
    await this.transactionRepository.createRefund(transactionId, userId);

    await this.auditLogService.log({
      layer: AuditLayer.PAYMENT,
      event: SystemEvent.PAYMENT_REFUNDED,
      userId,
      transactionId,
      fromStatus: 'FAILED',
      toStatus: 'REFUNDED',
      triggeredBy: AuditTrigger.USER,
      message: `Refund processed for transaction ${transactionId}`,
    });

    await this.notificationService.send(userId, {
      title: 'Refund processed',
      body: `Your refund of ${transaction.amount} TND has been issued.`,
    });

    return { success: true };
  }

  async findOne(transactionId: number) {
    return this.transactionRepository.findOne(transactionId);
  }

  async getUserTransactions(userId: number) {
    const transactions =
      await this.transactionRepository.findManyForUser(userId);
    return {
      transactions: transactions.map((tx) => ({
        id: tx.id,
        status: tx.status,
        channel: tx.channel,
        amount: tx.amount,
        currency: tx.currency,
        userId: tx.userId,
        offerId: tx.offerId,
        createdAt: tx.createdAt,
        updatedAt: tx.updatedAt,
        esims: tx.esim,
      })),
    };
  }

  async findOneWithAuditContext(transactionId: number) {
    const tx = await this.transactionRepository.findOne(transactionId);
    if (!tx)
      throw new NotFoundException(`Transaction ${transactionId} not found`);

    const auditContext =
      await this.transactionRepository.findLatestAuditContext(transactionId);

    return { ...tx, auditContext };
  }

  async getTransactionDetail(userId: number, transactionId: number) {
    const tx = await this.transactionRepository.findForUser(
      userId,
      transactionId,
    );
    if (!tx) {
      throw new NotFoundException(
        `Transaction with ID ${transactionId} not found`,
      );
    }

    return {
      transaction: {
        id: tx.id,
        status: tx.status,
        channel: tx.channel,
        amount: tx.amount,
        currency: tx.currency,
        userId: tx.userId,
        offerId: tx.offerId,
        createdAt: tx.createdAt,
        updatedAt: tx.updatedAt,
      },
      esims: tx.esim.map((e: any) => ({
        id: e.id,
        status: e.status,
        qrCode: e.qrCode ?? null,
        activationCode: e.activationCode ?? null,
      })),
    };
  }
}
