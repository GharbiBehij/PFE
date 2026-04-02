// activation.service.ts
// Responsibility: Verify eSIM was created by PurchaseService → poll provider status → commit or rollback
import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { EsimAuditLogService } from 'src/ProvisionningEvent/EsimAuditLog.service';
import { RetryableError, TerminalError } from './errors';
import { ActivateJobData } from 'src/Queue/Interfaces/Queue.interfaces';
import { EsimEventStatus, EsimStatus } from '@prisma/client';
import { ProviderAdapter } from '../esim/interfaces/provider-adapter.interface';
import { PROVIDER_ADAPTER } from '../esim/adapters/provider-adapter.token';
import { WalletService } from '../WalletTransaction/wallet.service';
import { Job } from 'bullmq';

@Injectable()
export class ActivationService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(PROVIDER_ADAPTER) private readonly providerAdapter: ProviderAdapter,
    private readonly esimAuditLogService: EsimAuditLogService,
    private readonly walletService: WalletService,
  ) { }

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
    if (esim.status === EsimStatus.ACTIVE)
      return;

    // ──────────────────────────────────────────────────────────────
    // 3. POLL PROVIDER FOR STATUS (no eSIM creation here)
    // ──────────────────────────────────────────────────────────────

    await this.esimAuditLogService.log({
      transactionId,
      userId,
      event: EsimEventStatus.ACTIVATION_REQUESTED,
      status: EsimStatus.NOT_ACTIVE,
      message: `Checking provider status for eSIM ${esim.iccid} via ${channel}`,
    });

    let providerStatus: { status: 'SUCCESS' | 'FAILED' | 'PENDING'; message?: string };
    try {
      providerStatus = await this.providerAdapter.getStatus(esim.iccid);
    } catch (err: any) {
      if (isInfraError(err)) {
        throw new RetryableError(`Provider unreachable: ${err.message}`);
      }
      throw new TerminalError(`Provider returned unexpected error: ${err.message}`);
    }

    // ──────────────────────────────────────────────────────────────
    // 4. ACT ON PROVIDER STATUS
    // ──────────────────────────────────────────────────────────────

    if (providerStatus.status === 'PENDING') {
      // Provider is still processing — re-queue via retry
      throw new RetryableError(`Provider still processing eSIM ${esim.iccid} — will retry`);
    }

    if (providerStatus.status === 'FAILED') {
      // eSIM provisioning failed on provider side — release funds and mark failed
      if (channel === 'B2B2C') {
        await this.walletService.releaseReservedFunds(transactionId);
      }

      await this.prisma.$transaction(async (prismaTx) => {
        await prismaTx.esim.update({
          where: { id: esim.id },
          data: {
            status: EsimStatus.NOT_ACTIVE,
            event: EsimEventStatus.ACTIVATION_FAILED,
          },
        });
        await prismaTx.transaction.update({
          where: { id: transactionId },
          data: { status: 'FAILED' },
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
    // 5. COMMIT: mark eSIM active + commit wallet funds + mark transaction succeeded
    // ──────────────────────────────────────────────────────────────

    try {
      await this.prisma.$transaction(async (prismaTx) => {
        await prismaTx.esim.update({
          where: { id: esim.id },
          data: {
            status: EsimStatus.ACTIVE,
            event: EsimEventStatus.ACTIVATION_SUCCESS,
            activatedAt: new Date(),
          },
        });

        await prismaTx.transaction.update({
          where: { id: transactionId },
          data: { status: 'SUCCEEDED' },
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
}

function isInfraError(err: any): boolean {
  return err?.status >= 500 || err?.code === 'ECONNRESET' || err?.code === 'ETIMEDOUT';
}