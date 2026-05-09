import { Injectable, Inject, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { randomUUID } from 'crypto';
import { PAYMENT_GATEWAY_ADAPTER } from '../adapters/payment-gateway.token';
import { PaymentGatewayAdapter } from '../interfaces/payment-gateway.interface';
import { PaymentRepository } from '../payment.repository';
import { AuditLogService } from '../../ProvisionningEvent/AuditLog.service';
import {
  AuditLayer,
  AuditTrigger,
  SystemEvent,
  TransactionStatus,
} from '@prisma/client';
import { TransactionService } from '../../transaction/transaction.service';

const STALE_THRESHOLD_MS = 10 * 60 * 1000;
const EXPIRY_THRESHOLD_MS = 15 * 60 * 1000;

// Statuses that indicate the payment is already resolved — no re-enqueue needed
const POST_PAYMENT_STATUSES = new Set([
  'PAID',
  'PROVISIONING',
  'COMPLETED',
]);
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
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async reconcileStalePayments(): Promise<void> {
    this.logger.log(
      'Reconciliation: scanning for stale payment transactions...',
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
              `dbStatus=${currentTxStatus} gatewayStatus=${status} cid=${correlationId} — re-enqueuing`,
          );

          await this.auditLogService.log({
            transactionId,
            userId: payment.transaction.userId,
            layer: AuditLayer.SYSTEM,
            event: SystemEvent.RECONCILIATION_TRIGGERED,
            triggeredBy: AuditTrigger.SCHEDULER,
            message: `Reconciliation: dbStatus=${currentTxStatus} gatewayStatus=${status} cid=${correlationId}`,
          });

          // Verification endpoint handles transitions; reconciliation only logs mismatch.
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

    for (const tx of candidates) {
      try {
        await this.transactionService.transition(
          tx.id,
          TransactionStatus.EXPIRED,
          'reconciliation',
        );
        this.logger.log(
          `Reconciliation: expired txId=${tx.id} (PENDING_PAYMENT > 30 min)`,
        );
        await this.auditLogService.log({
          transactionId: tx.id,
          userId: tx.userId,
          layer: AuditLayer.PAYMENT,
          event: SystemEvent.PAYMENT_EXPIRED,
          fromStatus: 'PENDING_PAYMENT',
          toStatus: 'EXPIRED',
          triggeredBy: AuditTrigger.SCHEDULER,
          message: 'Transaction expired: no payment received within 30 minutes',
        });
      } catch (err: any) {
        this.logger.error(`Failed to expire txId=${tx.id}: ${err.message}`);
      }
    }
  }
}
