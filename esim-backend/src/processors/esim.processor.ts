// esim.processor.ts
import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { ESIM_QUEUE, JOB_ACTIVATE_ESIM, JOB_PURCHASE_ESIM } from '../Queue/esim.queue';
import { ActivationService } from '../workers/activation.service';
import { PurchaseService } from '../workers/Purchase.service'
import { PrismaService } from 'prisma/prisma.service';
import { EsimEventStatus, EsimStatus, WalletStatus } from '@prisma/client';
import { EsimAuditLogService } from 'src/ProvisionningEvent/EsimAuditLog.service';

@Processor(ESIM_QUEUE, { concurrency: 10 })
export class EsimProcessor extends WorkerHost {
    constructor(
        private readonly prisma: PrismaService,
        private readonly activationService: ActivationService,
        private readonly esimAuditLogService: EsimAuditLogService,
        private readonly PurchaseService: PurchaseService
    ) {
        super();
    }
    // queue job for both functions 
    async process(job: Job): Promise<any> {
        switch (job.name) {
            case JOB_ACTIVATE_ESIM:
                return await this.activationService.handleActivation(job);
            case JOB_PURCHASE_ESIM:
                return await this.PurchaseService.handlePurchase(job);
            default:
                throw new Error(`Unknown job name: ${job.name}`);
        }
    }

    @OnWorkerEvent('completed')
    async onCompleted(job: Job) {
        const { transactionId, userId, channel } = job.data;

        await this.esimAuditLogService.log({
            transactionId,
            userId,
            jobId: job.id,
            event: job.name === JOB_PURCHASE_ESIM
                ? EsimEventStatus.PROVISIONING_SUCCESS
                : EsimEventStatus.ACTIVATION_SUCCESS,
            status: EsimStatus.ACTIVE,
            message: `Job ${job.name} completed via ${channel}`,
            metadata: job.returnvalue || {},
        });

        if (channel === 'B2B2C') {
            await this.prisma.walletTransaction.update({
                where: { transactionId },
                data: { status: WalletStatus.COMMITTED },
            });
        }
    }
    @OnWorkerEvent('failed')
    async onFailed(job: Job, err: Error) {
        if (!job) return;

        const { transactionId, userId, channel } = job.data;
        const isFinalAttempt = job.attemptsMade === job.opts.attempts;

        // ✅ only log terminal failure — not every retry attempt
        if (isFinalAttempt) {
            await this.esimAuditLogService.log({
                transactionId,
                userId,
                jobId: job.id,
                event: job.name === JOB_PURCHASE_ESIM
                    ? EsimEventStatus.PROVISIONING_FAILED
                    : EsimEventStatus.ACTIVATION_FAILED,
                status: EsimStatus.NOT_ACTIVE,
                message: err.message,
                metadata: {
                    channel,
                    attempts: job.attemptsMade,
                    stack: err.stack,
                    failedReason: job.failedReason,
                },
            });

            // ✅ mark transaction failed only on final attempt
            await this.prisma.transaction.update({
                where: { id: transactionId },
                data: { status: 'FAILED' },
            });

            if (channel === 'B2B2C') {
                await this.prisma.walletTransaction.update({
                    where: { transactionId },
                    data: { status: WalletStatus.RELEASED },
                });
            }
        }
    }
}