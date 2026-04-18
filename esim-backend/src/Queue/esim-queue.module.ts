import { Module, forwardRef } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ESIM_QUEUE } from './esim.queue';
import { EsimProducer } from './esim.producer';
import { EsimProcessor } from '../processors/esim.processor';
import { PurchaseService } from '../workers/Purchase.service';
import { ActivationService } from '../workers/activation.service';
import { EsimModule } from '../esim/esim.module';
import { TransactionModule } from '../transaction/transaction.module';
import { WalletModule } from '../WalletTransaction/wallet.module';
import { ProvisioningModule } from '../ProvisionningEvent/EsimAuditLog.module';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  imports: [
    BullModule.registerQueue({ name: ESIM_QUEUE }),
    EsimModule,
    forwardRef(() => TransactionModule),
    WalletModule,
    ProvisioningModule,
  ],
  providers: [
    EsimProducer,
    EsimProcessor,
    PurchaseService,
    ActivationService,
    PrismaService,
  ],
  exports: [EsimProducer],
})
export class EsimQueueModule {}
