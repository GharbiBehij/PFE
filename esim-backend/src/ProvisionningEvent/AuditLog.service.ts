import { Injectable } from '@nestjs/common';
import { AuditLogRepository } from './AuditLog.repository';
import { NotificationService } from '../notification/notification.service';
import { PrismaService } from '../../prisma/prisma.service';
import {
  AuditLayer,
  AuditTrigger,
  SystemEvent,
  statusDomain,
  Prisma,
} from '@prisma/client';

@Injectable()
export class AuditLogService {
  constructor(
    private readonly auditLogRepository: AuditLogRepository,
    private readonly notificationService: NotificationService,
    private readonly prisma: PrismaService,
  ) {}

  async log(data: {
    userId: number;
    transactionId: number;
    layer: AuditLayer;
    event: SystemEvent;
    fromStatus?: string;
    toStatus?: string;
    statusDomain?: statusDomain;
    triggeredBy: AuditTrigger;
    trigger?: string;
    jobId?: string;
    attemptNumber?: number;
    paymentProvider?: string;
    providerCode?: string;
    providerLatencyMs?: number;
    /** Date.now() timestamp captured before the operation — service computes durationMs automatically */
    startedAt?: number;
    message?: string;
    details?: any;
  }) {
    const { startedAt, ...rest } = data;
    const durationMs =
      startedAt !== undefined ? Date.now() - startedAt : undefined;
    const result = await this.auditLogRepository.createEvent({
      ...rest,
      toStatus: rest.toStatus ?? '',
      statusDomain: rest.statusDomain ?? statusDomain.TRANSACTION,
      ...(durationMs !== undefined && { durationMs }),
    });

    this.triggerNotification(data).catch(() => {});

    return result;
  }

  async logtx(
    tx: Prisma.TransactionClient,
    data: {
      userId: number;
      transactionId: number;
      layer: AuditLayer;
      event: SystemEvent;
      fromStatus?: string;
      toStatus?: string;
      statusDomain?: statusDomain;
      triggeredBy: AuditTrigger;
      trigger?: string;
      jobId?: string;
      attemptNumber?: number;
      paymentProvider?: string;
      providerCode?: string;
      providerLatencyMs?: number;
      startedAt?: number;
      message?: string;
      details?: any;
    },
  ) {
    const { startedAt, ...rest } = data;
    const durationMs =
      startedAt !== undefined ? Date.now() - startedAt : undefined;
    const result = await this.auditLogRepository.createEventTx(tx, {
      ...rest,
      toStatus: rest.toStatus ?? '',
      statusDomain: rest.statusDomain ?? statusDomain.TRANSACTION,
      ...(durationMs !== undefined && { durationMs }),
    });

    this.triggerNotification(data).catch(() => {});

    return result;
  }

  private async triggerNotification(data: {
    userId: number;
    event: SystemEvent;
    details?: any;
  }): Promise<void> {
    const { userId, event, details } = data;
    const context = await this.getNotificationContext(userId, details);

    switch (event) {
      case SystemEvent.PAYMENT_CONFIRMED:
        await this.notificationService.notifyUser(
          userId,
          'payment_confirmed',
          context,
        );
        break;

      case SystemEvent.ACTIVATION_SUCCESS:
        await this.notificationService.notifyUser(
          userId,
          'activation_success',
          context,
        );
        break;

      case SystemEvent.ACTIVATION_FAILED:
        await this.notificationService.notifyUser(
          userId,
          'activation_failed',
          context,
        );
        break;

      case SystemEvent.RETRY_ATTEMPT:
      case SystemEvent.PROVIDER_TIMEOUT:
        await this.notificationService.sendPushOnly(
          userId,
          'Activation en cours...',
          `Nous activons votre eSIM, merci de patienter.`,
        );
        break;

      case SystemEvent.PROVISIONING_FAILED:
        await this.notificationService.notifyUser(
          userId,
          'activation_failed',
          context,
        );
        break;

      default:
        break;
    }
  }

  private async getNotificationContext(
    userId: number,
    details?: any,
  ): Promise<{
    country?: string;
    amount?: number;
    currency?: string;
    dataAdded?: number;
  }> {
    try {
      if (details?.country) {
        return {
          country: details.country,
          amount: details.amount,
          currency: details.currency ?? 'TND',
          dataAdded: details.dataAdded,
        };
      }

      const tx = await this.prisma.transaction.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        include: { offer: true },
      });

      return {
        country: tx?.offer?.country,
        amount: tx?.amount,
        currency: tx?.currency ?? 'TND',
      };
    } catch {
      return {};
    }
  }
}
