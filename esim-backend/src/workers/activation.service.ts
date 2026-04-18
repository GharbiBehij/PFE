// activation.service.ts
// Responsibility: Verify eSIM was created by PurchaseService → poll provider status → commit or rollback
import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { EsimAuditLogService } from 'src/ProvisionningEvent/EsimAuditLog.service';
import { RetryableError, TerminalError } from './errors';
import { ActivateJobData } from 'src/Queue/Interfaces/Queue.interfaces';
import { ActivationAttemptStatus, EsimEventStatus, EsimStatus } from '@prisma/client';
import { ProviderAdapter } from '../esim/interfaces/provider-adapter.interface';
import { PROVIDER_ADAPTER } from '../esim/adapters/provider-adapter.token';
import { WalletService } from '../WalletTransaction/wallet.service';
import { EsimRepository } from '../esim/esim.repository';
import { Job } from 'bullmq';

const IN_FLIGHT_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

@Injectable()
export class ActivationService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(PROVIDER_ADAPTER) private readonly providerAdapter: ProviderAdapter,
    private readonly esimAuditLogService: EsimAuditLogService,
    private readonly walletService: WalletService,
    private readonly esimRepository: EsimRepository,
  ) {}

  async handleActivation(job: Job<ActivateJobData>) {
    const { transactionId, userId, channel } = job.data;

    // ──────────────────────────────────────────────────────────────
    // 1. PRECONDITIONS: transaction must exist and be in PROCESSING
    // ──────────────────────────────────────────────────────────────

    let tx: any;
    try {
      tx = await this.prisma.transaction.findUnique({
        where: { id: transactionId },
        include: { offer: true },
      });
    } catch (err: any) {
      throw new RetryableError(`DB error fetching transaction: ${err.message}`);
    }

    if (!tx) throw new TerminalError('Transaction not found');
    if (tx.status === 'SUCCEEDED') return; // idempotency: already finished
    if (tx.status === 'FAILED') throw new TerminalError('Transaction already failed — will not activate');
    if (tx.status !== 'PROCESSING') {
      throw new TerminalError(`Unexpected transaction status: ${tx.status}. Expected PROCESSING.`);
    }

    // ──────────────────────────────────────────────────────────────
    // 2. IDEMPOTENCY: eSIM must already be linked by PurchaseService
    // ──────────────────────────────────────────────────────────────

    let esim: any;
    try {
      esim = await this.prisma.esim.findFirst({
        where: { transactionId },
      });
    } catch (err: any) {
      throw new RetryableError(`DB error fetching eSIM record: ${err.message}`);
    }

    if (!esim) {
      // PurchaseService hasn't finished yet — this job was enqueued too early
      throw new RetryableError('eSIM record not yet created — PurchaseService may still be running');
    }

    // If already ACTIVE, nothing to do (duplicate job delivery)
    if (esim.status === EsimStatus.ACTIVE) return;

    // ──────────────────────────────────────────────────────────────
    // 3. CREATE ACTIVATION ATTEMPT
    //    Check in-flight + create atomically to prevent races
    // ──────────────────────────────────────────────────────────────

    let attempt: any;
    try {
      attempt = await this.prisma.$transaction(async (prismaTx) => {
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

        const attemptNumber = await this.getNextAttemptNumber(esim.id, prismaTx);
        const providerRequestId = `${esim.id}-${attemptNumber}`;

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
    } catch (err: any) {
      if (err.message === 'IN_FLIGHT') {
        throw new RetryableError('In-flight activation attempt detected — will retry after cooldown');
      }
      throw new RetryableError(`DB error creating activation attempt: ${err.message}`);
    }

    // ──────────────────────────────────────────────────────────────
    // 4. POLL PROVIDER FOR STATUS (outside transaction)
    // ──────────────────────────────────────────────────────────────

    let providerStatus: { status: 'SUCCESS' | 'FAILED' | 'PENDING'; message?: string };
    try {
      providerStatus = await this.providerAdapter.getStatus(esim.iccid);
    } catch (err: any) {
      await this.prisma.activationAttempt.update({
        where: { id: attempt.id },
        data: {
          status: ActivationAttemptStatus.FAILED,
          completedAt: new Date(),
          errorCode: err.code ?? 'PROVIDER_ERROR',
          errorMessage: err.message,
        },
      });

      if (isInfraError(err)) {
        throw new RetryableError(`Provider unreachable: ${err.message}`);
      }
      throw new TerminalError(`Provider returned unexpected error: ${err.message}`);
    }

    // ──────────────────────────────────────────────────────────────
    // 5. ACT ON PROVIDER STATUS
    // ──────────────────────────────────────────────────────────────

    if (providerStatus.status === 'PENDING') {
      // Provider still processing — mark attempt as timed out and retry
      await this.prisma.activationAttempt.update({
        where: { id: attempt.id },
        data: {
          status: ActivationAttemptStatus.TIMED_OUT,
          completedAt: new Date(),
          errorMessage: providerStatus.message ?? 'Provider still processing',
        },
      });

      throw new RetryableError(`Provider still processing eSIM ${esim.iccid} — will retry`);
    }

    if (providerStatus.status === 'FAILED') {
      // eSIM provisioning failed on provider side — release funds and mark failed
      if (channel === 'B2B2C') {
        await this.walletService.releaseReservedFunds(transactionId);
      }

      await this.prisma.$transaction(async (prismaTx) => {
        await this.esimRepository.updateStatusTx(prismaTx, esim.id, EsimStatus.NOT_ACTIVE, EsimEventStatus.ACTIVATION_FAILED);
        await prismaTx.transaction.update({
          where: { id: transactionId },
          data: { status: 'FAILED' },
        });
        await prismaTx.activationAttempt.update({
          where: { id: attempt.id },
          data: {
            status: ActivationAttemptStatus.FAILED,
            completedAt: new Date(),
            errorCode: 'PROVIDER_FAILED',
            errorMessage: providerStatus.message,
          },
        });
      });

      await this.esimAuditLogService.log({
        transactionId,
        userId,
        event: EsimEventStatus.ACTIVATION_FAILED,
        status: EsimStatus.NOT_ACTIVE,
        message: `Provider reported failure for eSIM ${esim.iccid}: ${providerStatus.message}`,
      });

      throw new TerminalError(`eSIM activation failed: ${providerStatus.message}`);
    }

    // providerStatus.status === 'SUCCESS'
    // ──────────────────────────────────────────────────────────────
    // 6. COMMIT: mark eSIM active + commit wallet funds + mark transaction succeeded
    // ──────────────────────────────────────────────────────────────

    try {
      await this.prisma.$transaction(async (prismaTx) => {
        const now = new Date();
        await this.esimRepository.updateStatusTx(prismaTx, esim.id, EsimStatus.ACTIVE, EsimEventStatus.ACTIVATION_SUCCESS);
        await prismaTx.esim.update({
          where: { id: esim.id },
          data: {
            activatedAt: now,
            dataTotal: tx.offer.dataVolume,
            dataUsed: 0,
            lastUsageSync: now,
            expiryDate: new Date(now.getTime() + tx.offer.validityDays * 24 * 60 * 60 * 1000),
          },
        });
        await prismaTx.transaction.update({
          where: { id: transactionId },
          data: { status: 'SUCCEEDED' },
        });
        await prismaTx.activationAttempt.update({
          where: { id: attempt.id },
          data: {
            status: ActivationAttemptStatus.SUCCESS,
            completedAt: now,
            providerResponse: providerStatus as any,
          },
        });
      });
    } catch (err: any) {
      throw new RetryableError(`DB error committing activation: ${err.message}`);
    }

    // Commit wallet funds after DB is clean (B2B2C only)
    if (channel === 'B2B2C') {
      await this.walletService.commitReservedFunds(transactionId);
    }

    await this.esimAuditLogService.log({
      transactionId,
      userId,
      event: EsimEventStatus.ACTIVATION_SUCCESS,
      status: EsimStatus.ACTIVE,
      message: `eSIM ${esim.iccid} successfully activated`,
    });
  }

  private async getNextAttemptNumber(esimId: number, tx?: any): Promise<number> {
    const client = tx ?? this.prisma;
    const count = await client.activationAttempt.count({ where: { esimId } });
    return count + 1;
  }
}

function isInfraError(err: any): boolean {
  return err?.status >= 500 || err?.code === 'ECONNRESET' || err?.code === 'ETIMEDOUT';
}
