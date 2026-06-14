import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import {
  WALLET_QUEUE,
  JOB_TOPUP_CREDIT,
  JOB_WALLET_DEBIT,
} from '../Queue/Wallet.queue';
import { TopUpJobData } from '../Interfaces/Queue.interfaces';
import { WalletDebitJobData } from '../Interfaces/Queue.interfaces';
@Injectable()
export class WalletProducer {
  constructor(@InjectQueue(WALLET_QUEUE) private readonly queue: Queue) {}
  async enqueueDebit(data: WalletDebitJobData) {
    return this.queue.add(JOB_TOPUP_CREDIT, data, {
      jobId: `wallet-debit-${data.transactionId}`,
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
  async enqueueTopUpCredit(data: TopUpJobData) {
    return this.queue.add(JOB_WALLET_DEBIT, data, {
      jobId: `wallet-credit-${data.topUpRequestId}`,
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
}
