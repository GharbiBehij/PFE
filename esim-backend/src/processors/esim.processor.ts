// esim.processor.ts
import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Inject, forwardRef } from '@nestjs/common';
import { Job } from 'bullmq';
import {
  ESIM_QUEUE,
  JOB_ACTIVATE_ESIM,
  JOB_PURCHASE_ESIM,
} from '../Queue/Queue/esim.queue';
import { ActivationService } from '../workers/activation.service';
import { PurchaseService } from '../workers/Purchase.service';
import { PrismaService } from 'prisma/prisma.service';
import { TransactionService } from '../transaction/transaction.service';
import {
  AuditLayer,
  AuditTrigger,
  SystemEvent,
  LedgerReason,
  LedgerType,
  TransactionStatus,
  WalletStatus,
} from '@prisma/client';
import { AuditLogService } from 'src/ProvisionningEvent/AuditLog.service';

@Processor(ESIM_QUEUE, { concurrency: 10 })
export class EsimProcessor extends WorkerHost {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activationService: ActivationService,
    private readonly auditLogService: AuditLogService,
    private readonly purchaseService: PurchaseService,
    @Inject(forwardRef(() => TransactionService))
    private readonly transactionService: TransactionService,
  ) {
    super();
  }

  async process(job: Job): Promise<any> {
    switch (job.name) {
      case JOB_ACTIVATE_ESIM:
        return await this.activationService.handleActivation(job);
      case JOB_PURCHASE_ESIM:
        return await this.purchaseService.handlePurchase(job);
      default:
        throw new Error(`Unknown job name: ${job.name}`);
    }
  }

  @OnWorkerEvent('completed')
  async onCompleted(job: Job) {
    const { transactionId, userId, channel } = job.data;

    await this.auditLogService.log({
      transactionId,
      userId,
      layer:
        job.name === JOB_PURCHASE_ESIM
          ? AuditLayer.PROVISIONING
          : AuditLayer.ACTIVATION,
      event:
        job.name === JOB_PURCHASE_ESIM
          ? SystemEvent.PROVISIONING_SUCCESS
          : SystemEvent.ACTIVATION_SUCCESS,
      toStatus: job.name === JOB_PURCHASE_ESIM ? 'COMPLETED' : 'SUCCEEDED',
      triggeredBy: AuditTrigger.WORKER,
      jobId: job.id,
      attemptNumber: job.attemptsMade,
      message: `Job ${job.name} completed via ${channel}`,
      details: job.returnvalue || {},
    });

    if (job.name === JOB_PURCHASE_ESIM) {
      if (channel === 'B2B2C') {
        await this.prisma.walletTransaction.update({
          where: { transactionId },
          data: { status: WalletStatus.COMMITTED },
        });
      }
      // Use the state machine for both channels — PROVISIONING → COMPLETED
      await this.transactionService.transition(
        transactionId,
        TransactionStatus.COMPLETED,
        'worker',
      );
    }
  }

  @OnWorkerEvent('failed')
  async onFailed(job: Job, err: Error) {
    if (!job) return;

    const { transactionId, userId, channel } = job.data;
    const isFinalAttempt = job.attemptsMade === job.opts.attempts;

    if (isFinalAttempt) {
      const event =
        job.name === JOB_PURCHASE_ESIM
          ? SystemEvent.PROVISIONING_FAILED
          : SystemEvent.ACTIVATION_FAILED;

      await this.auditLogService.log({
        transactionId,
        userId,
        layer:
          job.name === JOB_PURCHASE_ESIM
            ? AuditLayer.PROVISIONING
            : AuditLayer.ACTIVATION,
        event,
        toStatus: 'FAILED',
        triggeredBy: AuditTrigger.WORKER,
        jobId: job.id,
        attemptNumber: job.attemptsMade,
        message: err.message,
        details: {
          channel,
          attempts: job.attemptsMade,
          stack: err.stack,
          failedReason: job.failedReason,
        },
      });

      // Compensation: use state machine — PROVISIONING → FAILED
      await this.transactionService.transition(
        transactionId,
        TransactionStatus.FAILED,
        'worker',
      );

      if (channel === 'B2B2C') {
        // Saga compensation: release reserved wallet funds on failure
        await this.prisma.walletTransaction.update({
          where: { transactionId },
          data: { status: WalletStatus.RELEASED },
        });

        const walletTx = await this.prisma.walletTransaction.findUnique({
          where: { transactionId },
        });

        if (walletTx) {
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
      }

      // Compensation hook: trigger refund if adapter supports it (future)
      // if (channel === 'B2C' && this.paymentAdapter.supportsRefund?.()) {
      //   await this.paymentAdapter.refund(transactionId);
      //   await this.transactionService.transition(transactionId, TransactionStatus.REFUNDED, 'worker');
      // }
    }
  }
}
