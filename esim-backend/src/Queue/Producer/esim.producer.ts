import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import {
  ESIM_QUEUE,
  JOB_ACTIVATE_ESIM,
  JOB_PURCHASE_ESIM,
  JOB_TOPUP_ESIM,
} from '../Queue/esim.queue';
import {
  ActivateJobData,
  EsimTopupJobData,
  PurchaseJobData,
} from '../Interfaces/Queue.interfaces';
@Injectable()
export class EsimProducer {
  constructor(@InjectQueue(ESIM_QUEUE) private readonly queue: Queue) {}

  async enqueueActivation(data: ActivateJobData) {
    return this.queue.add(JOB_ACTIVATE_ESIM, data, {
      jobId: `activate-${data.transactionId}`,
      attempts: 2,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
      timeout: 30_000,
      removeOnComplete: true,
      removeOnFail: false,
    } as any);
  }
  async enqueuePurchase(data: PurchaseJobData) {
    return this.queue.add(JOB_PURCHASE_ESIM, data, {
      jobId: `purchase-${data.transactionId}`,
      attempts: 2,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
      timeout: 30_000,
      removeOnComplete: true,
      removeOnFail: false,
    } as any);
  }
  async enqueueTopup(data: EsimTopupJobData) {
    return this.queue.add(JOB_TOPUP_ESIM, data, {
      jobId: `topup-${data.transactionId}`,
      attempts: 2,
      backoff: { type: 'exponential', delay: 1000 },
      timeout: 30_000,
      removeOnComplete: true,
      removeOnFail: false,
    } as any);
  }
}
