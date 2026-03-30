import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ESIM_QUEUE } from './esim.queue';
import { EsimProducer } from './esim.producer';

@Module({
  imports: [
    BullModule.registerQueue({ name: ESIM_QUEUE }),
  ],
  providers: [EsimProducer],
  exports: [EsimProducer],
})
export class EsimQueueModule {}
