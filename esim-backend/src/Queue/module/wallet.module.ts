import { Module, forwardRef } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { WalletProcessor } from '../../processors/wallet.process';
import { WalletWorkerService } from 'src/workers/wallet.service';
import { TopUpWorkerService } from 'src/workers/top-up.service';
import { ProvisioningModule } from 'src/AuditLog/AuditLog.module';
import { PrismaService } from 'prisma/prisma.service';
import { WALLET_QUEUE } from '../Queue/Wallet.queue';
import { WalletProducer } from '../Producer/Wallet.producer';
import { TopUpModule } from 'src/top-up/top-up.module';

@Module({
  imports: [
    BullModule.registerQueue({ name: WALLET_QUEUE }),
    ProvisioningModule,
    forwardRef(() => TopUpModule),
  ],
  providers: [
    WalletProcessor,
    WalletWorkerService,
    TopUpWorkerService,
    WalletProducer,
    PrismaService,
  ],
  exports: [WalletWorkerService, TopUpWorkerService, WalletProducer],
})
export class WalletModule {}
