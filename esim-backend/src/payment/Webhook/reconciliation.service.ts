import { Injectable, Inject, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { randomUUID } from 'crypto';
import { PAYMENT_GATEWAY_ADAPTER } from '../adapters/payment-gateway.token';
import { PaymentGatewayAdapter } from '../interfaces/payment-gateway.interface';
import { PaymentRepository } from '../payment.repository';
import { AuditLogService } from '../../AuditLog/AuditLog.service';
import {
  AuditLayer,
  AuditTrigger,
  SystemEvent,
  TransactionStatus,
} from '@prisma/client';
import { TransactionService } from '../../transaction/transaction.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { NotificationService } from '../../notification/notification.service';
import { EsimStatus } from '@prisma/client';
import { PaymentService } from '../payment.service';

const STALE_THRESHOLD_MS = Number(
  process.env.PAYMENT_RECONCILE_STALE_MS ?? 20 * 60 * 1000,
);
const EXPIRY_THRESHOLD_MS = Number(
  process.env.PAYMENT_RECONCILE_EXPIRY_MS ?? 30 * 60 * 1000,
);

// Statuses that indicate the payment is already resolved — no re-enqueue needed
const POST_PAYMENT_STATUSES = new Set(['PAID', 'PROVISIONING', 'COMPLETED']);
const TERMINAL_TX_STATUSES = new Set(['FAILED', 'REFUNDED', 'EXPIRED']);

@Injectable()
export class ReconciliationService {
  private readonly logger = new Logger(ReconciliationService.name);

  constructor(
    @Inject(PAYMENT_GATEWAY_ADAPTER)
    private readonly gatewayAdapter: PaymentGatewayAdapter,
    private readonly paymentRepository: PaymentRepository,
    private readonly auditLogService: AuditLogService,
    private readonly transactionService: TransactionService,
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
    private readonly paymentService: PaymentService,
  ) {}

  @Cron(CronExpression.EVERY_30_MINUTES)
  async reconcileStalePayments(): Promise<void> {
    this.logger.log(
      'Reconciliation: scanning for stale payment transactions...',
    );
    this.logger.log(
      `Reconciliation: thresholds staleMs=${STALE_THRESHOLD_MS} expiryMs=${EXPIRY_THRESHOLD_MS}`,
    );

    let stalePayments: Awaited<
      ReturnType<typeof this.paymentRepository.findStalePayments>
    >;
    try {
      stalePayments =
        await this.paymentRepository.findStalePayments(STALE_THRESHOLD_MS);
    } catch (err: any) {
      this.logger.error(`Reconciliation DB query failed: ${err.message}`);
      return;
    }

    if (stalePayments.length === 0) {
      this.logger.log('Reconciliation: no stale transactions found.');
      return;
    }

    this.logger.log(
      `Reconciliation: found ${stalePayments.length} stale transaction(s).`,
    );

    for (const payment of stalePayments) {
      const { gatewayPaymentId, transactionId } = payment;
      if (!gatewayPaymentId) continue;

      const currentTxStatus = payment.transaction.status as string;

      this.logger.log(
        `Reconciliation: checking txId=${transactionId} gatewayPaymentId=${gatewayPaymentId} dbStatus=${currentTxStatus}`,
      );

      // Skip if already terminal — reconciliation should not touch terminal transactions
      if (TERMINAL_TX_STATUSES.has(currentTxStatus)) continue;

      const correlationId = `reconcile-${transactionId}-${randomUUID().slice(0, 8)}`;

      try {
        const { status } =
          await this.gatewayAdapter.fetchPaymentStatus(gatewayPaymentId);

        const statusMismatch =
          (status === 'SUCCESS' &&
            !POST_PAYMENT_STATUSES.has(currentTxStatus)) ||
          (status === 'FAILED' && !TERMINAL_TX_STATUSES.has(currentTxStatus));

        if (statusMismatch) {
          this.logger.warn(
            `Reconciliation mismatch: txId=${transactionId} gatewayPaymentId=${gatewayPaymentId} ` +
              `dbStatus=${currentTxStatus} gatewayStatus=${status} cid=${correlationId} — triggering verifyAndProcess`,
          );

          await this.auditLogService.log({
            transactionId,
            userId: payment.transaction.userId,
            layer: AuditLayer.SYSTEM,
            event: SystemEvent.RECONCILIATION_TRIGGERED,
            triggeredBy: AuditTrigger.SCHEDULER,
            message: `Reconciliation: dbStatus=${currentTxStatus} gatewayStatus=${status} cid=${correlationId}`,
          });

          // Actually fix the mismatch by re-running the verification + provisioning logic.
          // verifyAndProcess is idempotent: it skips already-processed transactions.
          try {
            const result = await this.paymentService.verifyAndProcess(gatewayPaymentId);
            this.logger.log(
              `Reconciliation: verifyAndProcess result txId=${transactionId} status=${result.status} cid=${correlationId}`,
            );
          } catch (fixErr: any) {
            this.logger.error(
              `Reconciliation: verifyAndProcess failed txId=${transactionId} cid=${correlationId}: ${fixErr.message}`,
            );
          }
        }
      } catch (err: any) {
        this.logger.error(
          `Reconciliation failed for gatewayPaymentId=${gatewayPaymentId} cid=${correlationId}: ${err.message}`,
        );
      }
    }

    // Second pass: expire abandoned payment sessions (no gateway poll needed)
    await this.expireAbandonedTransactions();
  }

  /** Mark PENDING_PAYMENT transactions older than EXPIRY_THRESHOLD_MS as EXPIRED. */
  private async expireAbandonedTransactions(): Promise<void> {
    let candidates: { id: number; userId: number }[];
    try {
      candidates =
        await this.paymentRepository.findExpiredCandidates(EXPIRY_THRESHOLD_MS);
    } catch (err: any) {
      this.logger.error(`Expiration DB query failed: ${err.message}`);
      return;
    }

    if (candidates.length > 0) {
      const expiryMinutes = Math.round(EXPIRY_THRESHOLD_MS / 60000);
      this.logger.log(
        `Reconciliation: expiring ${candidates.length} transaction(s) older than ${expiryMinutes} min`,
      );
    }

    for (const tx of candidates) {
      try {
        await this.transactionService.transition(
          tx.id,
          TransactionStatus.EXPIRED,
          'reconciliation',
        );
        const expiryMinutes = Math.round(EXPIRY_THRESHOLD_MS / 60000);
        this.logger.log(
          `Reconciliation: expired txId=${tx.id} (PENDING_PAYMENT > ${expiryMinutes} min)`,
        );
        await this.auditLogService.log({
          transactionId: tx.id,
          userId: tx.userId,
          layer: AuditLayer.PAYMENT,
          event: SystemEvent.PAYMENT_EXPIRED,
          fromStatus: 'PENDING_PAYMENT',
          toStatus: 'EXPIRED',
          triggeredBy: AuditTrigger.SCHEDULER,
          message: `Transaction expired: no payment received within ${expiryMinutes} minutes`,
        });
      } catch (err: any) {
        this.logger.error(`Failed to expire txId=${tx.id}: ${err.message}`);
      }
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async notifyUpcomingExpiry(): Promise<void> {
    const now = new Date();
    const inThreeDays = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const esims = await this.prisma.esim.findMany({
      where: {
        status: EsimStatus.NOT_ACTIVE,
        expiryDate: { gte: now, lte: inThreeDays },
      },
      include: { offer: true },
    });
    for (const esim of esims) {
      await this.notificationService.send(esim.userId, {
        title: 'Your eSIM expires soon',
        body: `Your ${esim.offer?.country ?? 'travel'} eSIM expires on ${esim.expiryDate.toDateString()}. Activate it before then or access will be lost.`,
      });
    }
  }
}
