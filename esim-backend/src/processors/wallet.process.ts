import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from 'prisma/prisma.service';
import { AuditLogService } from 'src/ProvisionningEvent/AuditLog.service';
import { TopUpOrchestrator } from 'src/Orchestrators/top-up.orchestrator';
import { WalletWorkerService } from 'src/workers/wallet.service';
import { TopUpWorkerService } from 'src/workers/top-up.service';
import {
  AuditLayer,
  AuditTrigger,
  SystemEvent,
  LedgerReason,
  LedgerType,
  TopUpStatus,
  WalletStatus,
} from '@prisma/client';
import {
  WALLET_QUEUE,
  JOB_WALLET_DEBIT,
  JOB_TOPUP_CREDIT,
} from '../Queue/Queue/Wallet.queue';

@Processor(WALLET_QUEUE, { concurrency: 5 })
export class WalletProcessor extends WorkerHost {
  private readonly logger = new Logger(WalletProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly walletWorkerService: WalletWorkerService,
    private readonly topUpWorkerService: TopUpWorkerService,
    private readonly topUpOrchestrator: TopUpOrchestrator,
    private readonly auditLogService: AuditLogService,
  ) {
    super();
  }

  async process(job: Job): Promise<any> {
    switch (job.name) {
      case JOB_WALLET_DEBIT:
        return await this.walletWorkerService.handleWalletDebit(job);
      case JOB_TOPUP_CREDIT:
        return await this.topUpWorkerService.handleTopUpCredit(job);
      default:
        throw new Error(`Unknown job name: ${job.name}`);
    }
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(
      `Wallet job completed - name: ${job.name} jobId: ${job.id}`,
    );
  }

  @OnWorkerEvent('failed')
  async onFailed(job: Job, err: Error) {
    if (!job) return;

    const isFinalAttempt = job.attemptsMade === job.opts.attempts;
    if (!isFinalAttempt) return;

    this.logger.error(
      `Wallet job failed permanently - name: ${job.name} jobId: ${job.id} error: ${err.message}`,
    );

    if (job.name === JOB_WALLET_DEBIT) {
      const { transactionId, userId } = job.data;

      const walletTx = await this.prisma.walletTransaction.findUnique({
        where: { transactionId },
      });

      if (walletTx) {
        await this.prisma.walletTransaction.update({
          where: { transactionId },
          data: { status: WalletStatus.RELEASED },
        });

        await this.prisma.walletLedger.create({
          data: {
            amount: walletTx.amount,
            type: LedgerType.CREDIT,
            reason: LedgerReason.RELEASE,
            referenceId: transactionId,
            walletId: walletTx.id,
          },
        });

        await this.prisma.user.update({
          where: { id: userId },
          data: { balance: { increment: walletTx.amount } },
        });
      }

      await this.auditLogService.log({
        transactionId,
        userId,
        layer: AuditLayer.WALLET,
        event: SystemEvent.WALLET_FAILED,
        toStatus: 'FAILED',
        triggeredBy: AuditTrigger.WORKER,
        jobId: job.id,
        attemptNumber: job.attemptsMade,
        message: `Wallet debit failed permanently: ${err.message}`,
        details: {
          attempts: job.attemptsMade,
          stack: err.stack,
        },
      });
    }

    if (job.name === JOB_TOPUP_CREDIT) {
      const { topUpRequestId } = job.data;

      await this.topUpOrchestrator.transition(
        topUpRequestId,
        TopUpStatus.FAILED,
        'wallet-processor',
      );

      this.logger.error(
        `TopUp credit failed permanently - TopUpRequest #${topUpRequestId}: ${err.message}`,
      );
    }
  }
}
