import { Injectable } from "@nestjs/common";
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { ESIM_QUEUE, JOB_ACTIVATE_ESIM, JOB_PURCHASE_ESIM } from "./esim.queue";
import { ActivateJobData, PurchaseJobData } from "./Interfaces/Queue.interfaces";
@Injectable()
export class EsimProducer {
    constructor(@InjectQueue(ESIM_QUEUE) private readonly queue: Queue) { }

    async enqueueActivation(data: ActivateJobData) {
        return this.queue.add(JOB_ACTIVATE_ESIM, data, {
            jobId: `activate-${data.transactionId}`,
            backoff: {
                type: 'exponential',
                delay: 3000,
            },
            removeOnComplete: true,
            removeOnFail: false,
        });
    }
    async enqueuePurchase(data: PurchaseJobData) {
        return this.queue.add(JOB_PURCHASE_ESIM, data, {
            jobId: `purchase-${data.transactionId}`,
            backoff: {
                type: 'exponential',
                delay: 3000,
            },
            removeOnComplete: true, //when job gets completed remove it from the queue
            removeOnFail: false,// when job fails dont fail over 
        });
    }
}
