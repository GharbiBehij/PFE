// activation.service.ts
// Responsibility: Verify eSIM was created by PurchaseService → poll provider status → commit or rollback

import { Injectable, Inject, Logger } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { AuditLogService } from 'src/ProvisionningEvent/AuditLog.service';
import { RetryableError, TerminalError } from '../Queue/utils/errors';
import { ActivateJobData } from 'src/Queue/Interfaces/Queue.interfaces';
import {
  ActivationAttempt,
  ActivationAttemptStatus,
  AuditLayer,
  AuditTrigger,
  Esim,
  EsimStatus,
  LedgerReason,
  LedgerType,
  Offer,
  SystemEvent,
  Transaction,
  providerStatus

} from '@prisma/client';
import { ProviderAdapter } from '../esim/interfaces/provider-adapter.interface';
import { PROVIDER_ADAPTER } from '../esim/adapters/provider-adapter.token';
import { Job } from 'bullmq';

// ── Types ──────────────────────────────────────────────────────────────────

type TransactionWithOffer = Transaction & { offer: Offer };

type ProviderStatusResult = {
  status: providerStatus;
  message?: string;
};

// ── Constants ──────────────────────────────────────────────────────────────

/** Window within which an in-flight attempt blocks a new one */
const IN_FLIGHT_WINDOW_MS = 60 * 1_000;

// ── Helpers ────────────────────────────────────────────────────────────────

function isInfraError(err: unknown): boolean {
  const e = err as any;
  return (
    e?.status >= 500 ||
    e?.code === 'ECONNRESET' ||
    e?.code === 'ETIMEDOUT'
  );
}

// ── Service ────────────────────────────────────────────────────────────────

@Injectable()
export class ActivationService {
  private readonly logger = new Logger(ActivationService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(PROVIDER_ADAPTER) private readonly providerAdapter: ProviderAdapter,
    private readonly auditLogService: AuditLogService,
  ) {}

  // ══════════════════════════════════════════════════════════════════════════
  // PUBLIC ENTRY POINT
  // ══════════════════════════════════════════════════════════════════════════

  async handleActivation(job: Job<ActivateJobData>): Promise<void> {
    const { transactionId, userId, channel } = job.data;

    // ── Phase 1: Preconditions (read-only, outside transaction) ───────────
    const { tx, esim } = await this.fetchAndValidate(transactionId);
    //idempotency check: if transaction already SUCCEEDED or FAILED, skip processing (e.g. duplicate job delivery) — prevents changing eSIM status back to ACTIVE after a successful activation
    if (tx.status === 'SUCCEEDED' || tx.status === 'FAILED') {
    return;
  }
    if (!esim || esim.status === EsimStatus.ACTIVE) {
    return;
  }
    // ── Phase 2: Claim activation attempt (atomic) ────────────────────────
    const attempt = await this.claimAttempt(esim, job);

    // ── Phase 3: Poll provider (outside transaction — slow I/O) ───────────
    const providerResult = await this.pollProvider(
      esim,
      attempt,
      transactionId,
      userId,
      job,
    );

    // ── Phase 4: Act on provider result ───────────────────────────────────
    if (providerResult.status === 'PENDING') {
      await this.handlePending(esim, attempt, transactionId, userId, job);
    }

    if (providerResult.status === 'FAILED') {
      await this.handleFailure(
        esim,
        attempt,
        tx,
        transactionId,
        userId,
        channel,
        providerResult,
        job,
      );
    }

    if (providerResult.status === 'SUCCESS') {
      await this.handleSuccess(
        esim,
        attempt,
        tx,
        transactionId,
        userId,
        channel,
        providerResult,
        job,
      );
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PHASE 1 — FETCH AND VALIDATE
  // ══════════════════════════════════════════════════════════════════════════

  private async fetchAndValidate(
    transactionId: number,
  ): Promise<{ tx: TransactionWithOffer; esim: Esim }> {
    // Fetch transaction
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
    if (tx.status === 'SUCCEEDED') {
      this.logger.log(
        `[activation] txId=${transactionId} already SUCCEEDED — skipping`,
      );
      return { tx, esim: null as any }; // caller checks SUCCEEDED upstream
    }
    if (tx.status === 'FAILED') {
      throw new TerminalError('Transaction already failed — will not activate');
    }
    if (tx.status !== 'PROCESSING') {
      throw new TerminalError(
        `Unexpected transaction status: ${tx.status}. Expected PROCESSING.`,
      );
    }

    // Fetch eSIM — must exist (created by PurchaseService)
    let esim: Esim | null;
    try {
      esim = await this.prisma.esim.findFirst({
        where: { transactionId },
      });
    } catch (err: unknown) {
      throw new RetryableError(
        `DB error fetching eSIM record: ${(err as Error).message}`,
      );
    }

    if (!esim) {
      // PurchaseService hasn't finished yet — enqueued too early
      throw new RetryableError(
        'eSIM record not yet created — PurchaseService may still be running',
      );
    }

    // Already ACTIVE — duplicate job delivery
    if (esim.status === EsimStatus.ACTIVE) {
      this.logger.log(
        `[activation] esimId=${esim.id} already ACTIVE — skipping`,
      );
      return { tx, esim };
    }

    return { tx, esim };
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PHASE 2 — CLAIM ACTIVATION ATTEMPT (atomic)
  // In-flight detection + attempt creation in one transaction
  // to prevent two workers activating the same eSIM simultaneously
  // ══════════════════════════════════════════════════════════════════════════

  private async claimAttempt(
    esim: Esim,
    job: Job<ActivateJobData>,
  ): Promise<ActivationAttempt> {
    try {
      return await this.prisma.$transaction(async (prismaTx) => {
        // Check for an in-flight attempt within the cooldown window
        const inFlight = await prismaTx.activationAttempt.findFirst({
          where: {
            esimId: esim.id,
            status: ActivationAttemptStatus.STARTED,
            startedAt: { gte: new Date(Date.now() - IN_FLIGHT_WINDOW_MS) },
          },
        });

        if (inFlight) {
          throw new Error('IN_FLIGHT');
        }

        // Compute next attempt number inside the transaction
        const count = await prismaTx.activationAttempt.count({
          where: { esimId: esim.id },
        });
        const attemptNumber = count + 1;
        const providerRequestId = `${esim.id}-${attemptNumber}-${job.id}`;

        return prismaTx.activationAttempt.create({
          data: {
            esimId: esim.id,
            attemptNumber,
            status: ActivationAttemptStatus.STARTED,
            providerRequestId,
            startedAt: new Date(),
          },
        });
      });
    } catch (err: unknown) {
      const e = err as any;

      if (e?.message === 'IN_FLIGHT') {
        throw new RetryableError(
          'In-flight activation attempt detected — will retry after cooldown',
        );
      }

      // P2002 = unique constraint violation on providerRequestId
      // Two workers collided — safe to retry
      if (e?.code === 'P2002') {
        throw new RetryableError(
          'Concurrent attempt claim detected — will retry after cooldown',
        );
      }

      throw new RetryableError(
        `DB error creating activation attempt: ${e?.message}`,
      );
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PHASE 3 — POLL PROVIDER (outside transaction)
  // ══════════════════════════════════════════════════════════════════════════

  private async pollProvider(
    esim: Esim,
    attempt: ActivationAttempt,
    transactionId: number,
    userId: number,
    job: Job<ActivateJobData>,
  ): Promise<ProviderStatusResult> {
    try {
      return await this.providerAdapter.getStatus(esim.iccid);
    } catch (err: unknown) {
      const e = err as any;

      // Mark attempt as failed before throwing
      await this.prisma.activationAttempt.update({
        where: { id: attempt.id },
        data: {
          status: ActivationAttemptStatus.FAILED,
          completedAt: new Date(),
          errorCode: e?.code ?? 'PROVIDER_ERROR',
          errorMessage: e?.message,
        },
      });

      await this.auditLogService.log({
        transactionId,
        userId,
        layer: AuditLayer.ACTIVATION,
        event: SystemEvent.PROVIDER_TIMEOUT,
        fromStatus: 'PROCESSING',
        toStatus: 'PROCESSING',
        triggeredBy: AuditTrigger.PROVIDER,
        jobId: job.id,
        attemptNumber: job.attemptsMade,
        message: `Provider unreachable for eSIM ${esim.iccid}: ${e?.message}`,
      });

      if (isInfraError(err)) {
        throw new RetryableError(`Provider unreachable: ${e?.message}`);
      }

      throw new TerminalError(
        `Provider returned unexpected error: ${e?.message}`,
      );
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PHASE 4A — HANDLE PENDING
  // Provider still processing — log and retry
  // ══════════════════════════════════════════════════════════════════════════

  private async handlePending(
    esim: Esim,
    attempt: ActivationAttempt,
    transactionId: number,
    userId: number,
    job: Job<ActivateJobData>,
  ): Promise<never> {
    // Mark attempt as timed out
    await this.prisma.activationAttempt.update({
      where: { id: attempt.id },
      data: {
        status: ActivationAttemptStatus.TIMED_OUT,
        completedAt: new Date(),
        errorMessage: 'Provider still processing',
      },
    });

    // Log retry attempt — important for AuditLog timeline
    await this.auditLogService.log({
      transactionId,
      userId,
      layer: AuditLayer.ACTIVATION,
      event: SystemEvent.PROVIDER_TIMEOUT,
      fromStatus: 'PROCESSING',
      toStatus: 'PROCESSING',
      triggeredBy: AuditTrigger.PROVIDER,
      jobId: job.id,
      attemptNumber: job.attemptsMade,
      message: `Provider still processing eSIM ${esim.iccid} — scheduling retry`,
      details: { attemptNumber: attempt.attemptNumber },
    });

    throw new RetryableError(
      `Provider still processing eSIM ${esim.iccid} — will retry`,
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PHASE 4B — HANDLE FAILURE
  // eSIM FAILED + wallet RELEASED must be atomic
  // ══════════════════════════════════════════════════════════════════════════

  private async handleFailure(
    esim: Esim,
    attempt: ActivationAttempt,
    tx: TransactionWithOffer,
    transactionId: number,
    userId: number,
    channel: string,
    providerResult: ProviderStatusResult,
    job: Job<ActivateJobData>,
  ): Promise<never> {
    try {
      await this.prisma.$transaction(async (prismaTx) => {
        // Mark eSIM as FAILED — terminal, cannot be re-activated
        await prismaTx.esim.update({
          where: { id: esim.id },
          data: { status: EsimStatus.FAILED },
        });

        // Fail the transaction
        await prismaTx.transaction.update({
          where: { id: transactionId },
          data: { status: 'FAILED' },
        });

        // Mark attempt as failed
        await prismaTx.activationAttempt.update({
          where: { id: attempt.id },
          data: {
            status: ActivationAttemptStatus.FAILED,
            completedAt: new Date(),
            errorCode: 'PROVIDER_FAILED',
            errorMessage: providerResult.message,
          },
        });

        // B2B2C: release wallet funds atomically with failure writes
        // so eSIM FAILED ↔ wallet RELEASED are always in sync
        if (channel === 'B2B2C') {
          const wallet = await prismaTx.walletTransaction.update({
            where: { transactionId },
            data: { status: 'RELEASED' },
          });
          await prismaTx.walletLedger.create({
            data: {
              walletId: wallet.id,
              amount: wallet.amount,
              type: LedgerType.CREDIT,
              reason: LedgerReason.RELEASE,
              referenceId: transactionId,
            },
          });
        }
      });
    } catch (err: unknown) {
      throw new RetryableError(
        `DB error recording activation failure: ${(err as Error).message}`,
      );
    }

    // Audit after atomic write committed
    await this.auditLogService.log({
      transactionId,
      userId,
      layer: AuditLayer.ACTIVATION,
      event: SystemEvent.ACTIVATION_FAILED,
      fromStatus: 'PROCESSING',
      toStatus: 'FAILED',
      triggeredBy: AuditTrigger.PROVIDER,
      jobId: job.id,
      attemptNumber: job.attemptsMade,
      message: `Provider reported failure for eSIM ${esim.iccid}: ${providerResult.message}`,
      details: { iccid: esim.iccid, reason: providerResult.message, channel },
    });

    throw new TerminalError(
      `eSIM activation failed: ${providerResult.message}`,
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PHASE 4C — HANDLE SUCCESS
  // eSIM ACTIVE + transaction SUCCEEDED + wallet COMMITTED must be atomic
  // ══════════════════════════════════════════════════════════════════════════

  private async handleSuccess(
    esim: Esim,
    attempt: ActivationAttempt,
    tx: TransactionWithOffer,
    transactionId: number,
    userId: number,
    channel: string,
    providerResult: ProviderStatusResult,
    job: Job<ActivateJobData>,
  ): Promise<void> {
    try {
      await this.prisma.$transaction(async (prismaTx) => {
        const now = new Date();

        // Update eSIM — single update merging status + activation fields
        await prismaTx.esim.update({
          where: { id: esim.id },
          data: {
            status: EsimStatus.ACTIVE,
            activatedAt: now,
            dataTotal: tx.offer.dataVolume,
            dataUsed: 0,
            lastUsageSync: now,
            expiryDate: new Date(
              now.getTime() + tx.offer.validityDays * 24 * 60 * 60 * 1000,
            ),
          },
        });

        // Mark transaction as SUCCEEDED
        await prismaTx.transaction.update({
          where: { id: transactionId },
          data: { status: 'SUCCEEDED' },
        });

        // Mark attempt as SUCCESS
        await prismaTx.activationAttempt.update({
          where: { id: attempt.id },
          data: {
            status: ActivationAttemptStatus.SUCCESS,
            completedAt: now,
            providerResponse: providerResult as any,
          },
        });

        // B2B2C: commit wallet funds atomically with success writes
        // so eSIM ACTIVE ↔ wallet COMMITTED are always in sync
        if (channel === 'B2B2C') {
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
      throw new RetryableError(
        `DB error committing activation: ${(err as Error).message}`,
      );
    }

    // Audit after atomic write committed
    await this.auditLogService.log({
      transactionId,
      userId,
      layer: AuditLayer.ACTIVATION,
      event: SystemEvent.ACTIVATION_SUCCESS,
      fromStatus: 'PROCESSING',
      toStatus: 'SUCCEEDED',
      triggeredBy: AuditTrigger.PROVIDER,
      jobId: job.id,
      attemptNumber: job.attemptsMade,
      message: `eSIM ${esim.iccid} successfully activated`,
      details: { iccid: esim.iccid, channel },
    });
  }
}