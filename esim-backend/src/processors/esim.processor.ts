// esim.processor.ts
import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Inject, forwardRef } from '@nestjs/common';
import { Job } from 'bullmq';
import { EsimGateway } from '../gateway/esim.gateway';
import {
  ESIM_QUEUE,
  JOB_ACTIVATE_ESIM,
  JOB_PURCHASE_ESIM,
  JOB_TOPUP_ESIM,
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
import { AuditLogService } from 'src/AuditLog/AuditLog.service';
import { PROVIDER_ADAPTER } from 'src/esim/adapters/provider-adapter.token';
import { ProviderAdapter } from 'src/Adapters/provider-adapter.interface';
import { NotificationService } from 'src/notification/notification.service';
import { EsimProducer } from 'src/Queue/Producer/esim.producer';

@Processor(ESIM_QUEUE, { concurrency: 2 })
export class EsimProcessor extends WorkerHost {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activationService: ActivationService,
    private readonly auditLogService: AuditLogService,
    private readonly purchaseService: PurchaseService,
    @Inject(PROVIDER_ADAPTER) private readonly providerAdapter: ProviderAdapter,
    private readonly notificationService: NotificationService,
    @Inject(forwardRef(() => TransactionService))
    private readonly transactionService: TransactionService,
    private readonly esimGateway: EsimGateway,
    private readonly esimProducer: EsimProducer,
  ) {
    super();
  }

  async process(job: Job): Promise<any> {
    switch (job.name) {
      case JOB_ACTIVATE_ESIM:
        return await this.activationService.handleActivation(job);
      case JOB_PURCHASE_ESIM:
        return await this.purchaseService.handlePurchase(job);
      case JOB_TOPUP_ESIM: {
        const { transactionId, esimId, offerId } = job.data;
        const esim = await this.prisma.esim.findUnique({
          where: { id: esimId },
        });
        if (!esim) throw new Error(`eSIM ${esimId} not found`);
        const result = await this.providerAdapter.topupEsim(
          esim.iccid,
          String(offerId),
        );
        await this.prisma.$transaction([
          this.prisma.esim.update({
            where: { id: esimId },
            data: {
              dataTotal: (esim.dataTotal ?? 0) + (result.addedData ?? 0),
            },
          }),
          this.prisma.transaction.update({
            where: { id: transactionId },
            data: { status: TransactionStatus.COMPLETED },
          }),
        ]);
        return result;
      }
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

    if (job.name === JOB_PURCHASE_ESIM || job.name === JOB_TOPUP_ESIM) {
      // User-triggered B2C flow: chain activate-esim instead of transitioning to COMPLETED.
      // The activation worker handles the final SUCCEEDED/FAILED transition.
      if (job.name === JOB_PURCHASE_ESIM && job.data.chainActivation) {
        const esim = await this.prisma.esim.findFirst({
          where: { transactionId },
        });
        if (esim) {
          await this.esimProducer.enqueueActivation({
            transactionId,
            userId,
            channel,
            iccid: esim.iccid,
          });
        }
        return;
      }

      // Deferred B2B2C activation: leave at PROVISIONING so the reseller can activate later.
      // activateNow defaults to true for backward-compatibility.
      const isDeferred = channel === 'B2B2C' && job.data.activateNow === false;
      if (!isDeferred) {
        // Standard flow (B2B2C instant-provision or top-up): PROVISIONING → COMPLETED
        await this.transactionService.transition(
          transactionId,
          TransactionStatus.COMPLETED,
          'worker',
        );
      }
      const esim = await this.prisma.esim.findFirst({
        where: { transactionId },
        include: { offer: true },
      });
      if (job.name === JOB_PURCHASE_ESIM) {
        // Push brut (rétro-compatibilité) + email templateé
        await this.notificationService.send(userId, {
          title: 'eSIM ready',
          body: `Your ${esim?.offer?.country ?? 'travel'} eSIM is ready`,
        });
        await this.notificationService.notifyUser(
          userId,
          'activation_success',
          {
            country: esim?.offer?.country ?? '',
          },
        );
        // Socket.IO temps-réel — notifie le client B2C si l'app est ouverte
        // L'eSIM est NOT_ACTIVE (provisionnée, pas encore installée sur le device)
        // Le frontend invalide le cache ['esims'] → MyEsimsScreen se rafraîchit
        if (esim) {
          this.esimGateway.emitActivated(userId, {
            iccid: esim.iccid,
            qrCode: esim.qrCode ?? null,
            activationCode: esim.activationCode,
          });
          await this.auditLogService.log({
            transactionId,
            userId,
            layer: AuditLayer.SYSTEM,
            event: SystemEvent.SOCKET_ESIM_ACTIVATED,
            triggeredBy: AuditTrigger.WORKER,
            jobId: job.id,
            message: `Socket esim:activated emitted to user-${userId}`,
            details: {
              iccid: esim.iccid,
              room: `user-${userId}`,
              event: 'esim:activated',
            },
          });
        }
      } else {
        // Top-up eSIM data : push brut + email + socket temps-réel
        const dataAdded: number = job.returnvalue?.addedData ?? 0;
        const esimId: number = job.data?.esimId;
        await this.notificationService.send(userId, {
          title: 'Top-up successful',
          body: `${dataAdded} MB added to your eSIM`,
        });
        await this.notificationService.notifyUser(userId, 'topup_success', {
          country: esim?.offer?.country ?? '',
          dataAdded,
        });
        this.esimGateway.emitTopupSuccess(userId, { esimId, dataAdded });
        await this.auditLogService.log({
          transactionId,
          userId,
          layer: AuditLayer.SYSTEM,
          event: SystemEvent.SOCKET_TOPUP_SUCCESS,
          triggeredBy: AuditTrigger.WORKER,
          jobId: job.id,
          message: `Socket esim:topup-success emitted to user-${userId}`,
          details: {
            esimId,
            dataAdded,
            room: `user-${userId}`,
            event: 'esim:topup-success',
          },
        });
      }
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
      if (job.name === JOB_PURCHASE_ESIM) {
        // Fetch country for the templated email
        const failedEsim = await this.prisma.esim.findFirst({
          where: { transactionId },
          include: { offer: true },
        });
        await this.notificationService.send(userId, {
          title: 'Purchase failed',
          body: 'Your eSIM purchase failed. Tap to retry.',
        });
        await this.notificationService.notifyUser(userId, 'activation_failed', {
          country: failedEsim?.offer?.country ?? '',
        });
      }

      // CASH flow has no wallet reservation — skip saga compensation
      if (channel === 'B2B2C' && job.data.paymentMethod !== 'CASH') {
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
