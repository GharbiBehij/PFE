import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import {
  ESIM_QUEUE,
  JOB_ACTIVATE_ESIM,
  JOB_PURCHASE_ESIM,
} from '../Queue/esim.queue';
import {
  ActivateJobData,
  PurchaseJobData,
} from '../Interfaces/Queue.interfaces';
@Injectable()
export class EsimProducer {
  constructor(@InjectQueue(ESIM_QUEUE) private readonly queue: Queue) {}

  async enqueueActivation(data: ActivateJobData) {
    return this.queue.add(JOB_ACTIVATE_ESIM, data, {
      jobId: `activate-${data.transactionId}`,
      attempts: 5,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
      timeout: 30_000,
      removeOnComplete: true,
      removeOnFail: false,
    } as any);
  }
  async enqueuePurchase(data: PurchaseJobData) {
    return this.queue.add(JOB_PURCHASE_ESIM, data, {
      jobId: `purchase-${data.transactionId}`,
      // Retry infra failures (RetryableError) up to 5 times with exponential backoff.
      // TerminalError thrown by the worker stops retries immediately.
      attempts: 5,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
      timeout: 30_000,
      removeOnComplete: true,
      removeOnFail: false,
    } as any);
  }
}
