// purchase.service.ts
// Responsibility: Validate preconditions → call Provider.createEsim → persist eSIM record atomically

import { Injectable, Inject, Logger } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { TransactionRepository } from '../transaction/transaction.repository';
import { AuditLogService } from 'src/AuditLog/AuditLog.service';
import { RetryableError, TerminalError } from '../Queue/utils/errors';
import { PurchaseJobData } from 'src/Queue/Interfaces/Queue.interfaces';
import {
  AuditLayer,
  AuditTrigger,
  SystemEvent,
  EsimStatus,
  LedgerType,
  LedgerReason,
  Transaction,
  Offer,
  Payment,
  WalletTransaction,
  Esim,
} from '@prisma/client';
import { Job } from 'bullmq';
import { ProviderAdapter } from 'src/Adapters/provider-adapter.interface';
import { PROVIDER_ADAPTER } from 'src/esim/adapters/provider-adapter.token';
import { WalletService } from '../WalletTransaction/wallet.service';

// ── Types ──────────────────────────────────────────────────────────────────

type TransactionWithOffer = Transaction & { offer: Offer };

type EsimProvisionResult = {
  iccid: string;
  activationCode: string;
  expiryDate: Date;
};

// ── Helpers ────────────────────────────────────────────────────────────────

function isInfraError(err: unknown): boolean {
  const e = err as any;
  return (
    e?.status >= 500 || // Network errors DNS errors, and 5xx from provider
    e?.code === 'ECONNRESET' || // Connection reset by peer
    e?.code === 'ETIMEDOUT' || // Connection timed out
    e?.code >= 429 // rate limit errors
  );
}

// ── Service ────────────────────────────────────────────────────────────────

@Injectable()
export class PurchaseService {
  private readonly logger = new Logger(PurchaseService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly transactionRepo: TransactionRepository,
    private readonly auditLogService: AuditLogService,
    @Inject(PROVIDER_ADAPTER) private readonly providerAdapter: ProviderAdapter,
  ) {}

  // ══════════════════════════════════════════════════════════════════════════
  // PUBLIC ENTRY POINT
  // ══════════════════════════════════════════════════════════════════════════

  async handlePurchase(job: Job<PurchaseJobData>): Promise<void> {
    const { transactionId, userId, channel, offerId } = job.data;

    // ── Phase 1: Precondition checks (read-only, outside transaction) ──────
    const tx = await this.fetchAndValidateTransaction(
      transactionId,
      userId,
      channel,
      job,
    );

    if (tx.status === 'COMPLETED' || tx.status === 'FAILED') {
      return;
    }

    // ── Phase 2: eSIM idempotency check (outside transaction) ─────────────
    // If a previous attempt already created the eSIM (e.g. wallet commit
    // failed after eSIM creation), skip the provider call entirely.
    const existingEsim = await this.findExistingEsim(transactionId);

    // ── Phase 3: Call provider (outside transaction — slow I/O) ───────────
    let esimData: EsimProvisionResult;

    if (existingEsim) {
      this.logger.log(
        `[provisioning] txId=${transactionId} eSIM already exists ` +
          `(iccid=${existingEsim.iccid}) — skipping provider call`,
      );
      esimData = {
        iccid: existingEsim.iccid,
        activationCode: existingEsim.activationCode,
        expiryDate: existingEsim.expiryDate,
      };
    } else {
      esimData = await this.callProvider(tx, userId, channel, offerId, job);
    }

    // ── Phase 4: Atomic write (inside transaction — fast) ─────────────────
    // eSIM creation + wallet commit are a single atomic unit.
    // If either fails → both roll back → job retries cleanly.
    await this.persistAtomically(
      transactionId,
      userId,
      channel,
      tx,
      esimData,
      existingEsim,
      job,
    );

    // ── Phase 5: Post-commit audit (outside transaction) ──────────────────
    await this.auditLogService.log({
      transactionId,
      userId,
      layer: AuditLayer.PROVISIONING,
      event: SystemEvent.PROVISIONING_SUCCESS,
      fromStatus: 'PROVISIONING',
      toStatus: 'PROVISIONING',
      triggeredBy: AuditTrigger.PROVIDER,
      jobId: job.id,
      attemptNumber: job.attemptsMade,
      providerCode: String(tx.offer.providerId),
      message: `eSIM provisioned successfully — iccid: ${esimData.iccid}`,
      details: { iccid: esimData.iccid, channel },
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PHASE 1 — FETCH AND VALIDATE TRANSACTION
  // ══════════════════════════════════════════════════════════════════════════

  private async fetchAndValidateTransaction(
    transactionId: number,
    userId: number,
    channel: string,
    job: Job<PurchaseJobData>,
  ): Promise<TransactionWithOffer> {
    // Fetch transaction + offer in one query
    let tx: TransactionWithOffer | null;
    try {
      tx = await this.prisma.transaction.findUnique({
        where: { id: transactionId },
        include: { offer: true },
      });
    } catch (err: unknown) {
      throw new RetryableError(
        `DB error fetching transaction: ${(err as Error).message}`,
      );
    }

    if (!tx) throw new TerminalError('Transaction not found');
    if (!tx.offer) throw new TerminalError('Offer not found on transaction');

    // Idempotency guard — terminal states are safe to no-op
    if (tx.status === 'COMPLETED' || tx.status === 'FAILED') {
      this.logger.log(
        `[provisioning] txId=${transactionId} already ${tx.status} — skipping`,
      );
      return tx;
    }

    // State machine guard — must be in PROVISIONING to proceed
    if (tx.status !== 'PROVISIONING') {
      throw new TerminalError(
        `Unexpected status for provisioning: ` +
          `txId=${transactionId} status=${tx.status}`,
      );
    }

    // B2C — verify payment was recorded
    if (channel === 'B2C') {
      await this.validatePaymentExists(transactionId);
    }

    // B2B2C WALLET — verify wallet is in a processable state
    // CASH flow skips wallet reservation entirely (physical cash collected by reseller)
    if (channel === 'B2B2C' && job.data.paymentMethod !== 'CASH') {
      await this.validateWalletState(transactionId);
    }

    return tx;
  }

  // ── B2C payment validation ────────────────────────────────────────────────

  private async validatePaymentExists(transactionId: number): Promise<void> {
    let payment: Payment | null;
    try {
      payment = await this.prisma.payment.findUnique({
        where: { transactionId },
      });
    } catch (err: unknown) {
      throw new RetryableError(
        `DB error fetching payment: ${(err as Error).message}`,
      );
    }
    if (!payment) throw new TerminalError('Payment record not found');
  }

  // ── B2B2C wallet validation ───────────────────────────────────────────────

  private async validateWalletState(transactionId: number): Promise<void> {
    let wallet: WalletTransaction | null;
    try {
      wallet = await this.prisma.walletTransaction.findUnique({
        where: { transactionId },
      });
    } catch (err: unknown) {
      throw new RetryableError(
        `DB error fetching wallet: ${(err as Error).message}`,
      );
    }

    if (!wallet) throw new TerminalError('Wallet transaction not found');

    // RELEASED = funds already refunded (previous failure)
    // COMMITTED = already succeeded
    // Both mean: do not re-process
    if (wallet.status === 'RELEASED' || wallet.status === 'COMMITTED') {
      throw new TerminalError(
        `Cannot proceed — wallet already ${wallet.status}`,
      );
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PHASE 2 — ESIM IDEMPOTENCY CHECK
  // ══════════════════════════════════════════════════════════════════════════

  private async findExistingEsim(transactionId: number): Promise<Esim | null> {
    try {
      return await this.prisma.esim.findUnique({
        where: { transactionId },
      });
    } catch (err: unknown) {
      throw new RetryableError(
        `DB error checking existing eSIM: ${(err as Error).message}`,
      );
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PHASE 3 — CALL PROVIDER (outside transaction)
  // ══════════════════════════════════════════════════════════════════════════

  private async callProvider(
    tx: TransactionWithOffer,
    userId: number,
    channel: string,
    offerId: number,
    job: Job<PurchaseJobData>,
  ): Promise<EsimProvisionResult> {
    const { id: transactionId } = tx;

    // Emit PROVISIONING_STARTED before the provider call
    await this.auditLogService.log({
      transactionId,
      userId,
      layer: AuditLayer.PROVISIONING,
      event: SystemEvent.PROVISIONING_STARTED,
      fromStatus: 'PROVISIONING',
      toStatus: 'PROVISIONING',
      triggeredBy: AuditTrigger.WORKER,
      jobId: job.id,
      attemptNumber: job.attemptsMade,
      providerCode: String(tx.offer.providerId),
      message: `Provisioning job picked up — calling provider via ${channel}`,
    });

    try {
      return await this.providerAdapter.createEsim({
        transactionId,
        offerId,
        country: tx.offer.country,
        dataVolume: tx.offer.dataVolume ?? 0,
        validityDays: tx.offer.validityDays,
        providerId: tx.offer.providerId,
        userId,
      });
    } catch (err: unknown) {
      // Infrastructure error (5xx, timeout, network reset) → BullMQ retries
      if (isInfraError(err)) {
        throw new RetryableError(
          `Provider infrastructure error: ${(err as Error).message}`,
        );
      }

      // Business error (4xx, out of stock, invalid plan) → terminal failure
      // Wallet release and transaction failure must be atomic
      await this.handleProviderBusinessError(
        transactionId,
        userId,
        channel,
        tx,
        err,
        job,
      );

      // handleProviderBusinessError always throws — this is unreachable
      // but TypeScript needs it
      throw new TerminalError('Provider business error');
    }
  }

  // ── Handle provider business error atomically ─────────────────────────────

  private async handleProviderBusinessError(
    transactionId: number,
    userId: number,
    channel: string,
    tx: TransactionWithOffer,
    err: unknown,
    job: Job<PurchaseJobData>,
  ): Promise<never> {
    // Atomically: fail the transaction + release wallet (if B2B2C)
    try {
      await this.prisma.$transaction(async (prismaTx) => {
        // Fail the transaction
        await prismaTx.transaction.update({
          where: { id: transactionId },
          data: { status: 'FAILED' },
        });

        // B2B2C WALLET: release reserved funds atomically with status update
        // CASH flow has no wallet reservation — skip
        if (channel === 'B2B2C' && job.data.paymentMethod !== 'CASH') {
          await prismaTx.walletTransaction.update({
            where: { transactionId },
            data: { status: 'RELEASED' },
          });
          await prismaTx.walletLedger.create({
            data: {
              walletId: (await prismaTx.walletTransaction.findUnique({
                where: { transactionId },
                select: { id: true },
              }))!.id,
              amount: tx.offer.price,
              type: LedgerType.CREDIT,
              reason: LedgerReason.RELEASE,
              referenceId: transactionId,
            },
          });
        }
      });
    } catch (dbErr: unknown) {
      // DB write failed — retryable so BullMQ can try again
      throw new RetryableError(
        `DB error recording provider failure: ${(dbErr as Error).message}`,
      );
    }

    // Audit after atomic write committed
    await this.auditLogService.log({
      transactionId,
      userId,
      layer: AuditLayer.PROVISIONING,
      event: SystemEvent.PROVISIONING_FAILED,
      fromStatus: 'PROVISIONING',
      toStatus: 'FAILED',
      triggeredBy: AuditTrigger.PROVIDER,
      jobId: job.id,
      attemptNumber: job.attemptsMade,
      providerCode: String(tx.offer.providerId),
      message: `Provider rejected eSIM creation: ${(err as Error).message}`,
      details: { error: (err as Error).message },
    });

    throw new TerminalError(
      `Provider business error: ${(err as Error).message}`,
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PHASE 4 — ATOMIC WRITE
  // eSIM creation + wallet commit in one transaction
  // If either fails → both roll back → job retries cleanly
  // ══════════════════════════════════════════════════════════════════════════

  private async persistAtomically(
    transactionId: number,
    userId: number,
    channel: string,
    tx: TransactionWithOffer,
    esimData: EsimProvisionResult,
    existingEsim: Esim | null,
    job: Job<PurchaseJobData>,
  ): Promise<void> {
    try {
      await this.prisma.$transaction(async (prismaTx) => {
        // Only create eSIM if it does not already exist
        // (idempotency — previous attempt may have created it)
        if (!existingEsim) {
          await prismaTx.esim.create({
            data: {
              iccid: esimData.iccid,
              activationCode: esimData.activationCode,
              expiryDate: esimData.expiryDate,
              status: EsimStatus.NOT_ACTIVE,
              userId,
              providerId: tx.offer.providerId,
              transactionId,
              offerId: tx.offer.id,
              dataTotal: tx.offer.dataVolume ?? undefined,
            },
          });
        }

        // B2B2C WALLET: commit wallet in same transaction as eSIM creation
        // so eSIM exists ↔ wallet committed are always in sync
        // CASH flow has no wallet reservation — skip
        if (channel === 'B2B2C' && job.data.paymentMethod !== 'CASH') {
          const wallet = await prismaTx.walletTransaction.update({
            where: { transactionId },
            data: { status: 'COMMITTED' },
          });

          await prismaTx.walletLedger.create({
            data: {
              walletId: wallet.id,
              amount: wallet.amount,
              type: LedgerType.DEBIT,
              reason: LedgerReason.COMMIT,
              referenceId: transactionId,
            },
          });
        }
      });
    } catch (err: unknown) {
      // Retryable — eSIM creation or wallet commit failed
      // BullMQ retries → Phase 2 idempotency check skips provider call
      // → retries wallet commit only
      throw new RetryableError(
        `DB error persisting eSIM record: ${(err as Error).message}`,
      );
    }
  }
}
