import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { WalletProcessor } from '../../processors/wallet.process';
import { WalletWorkerService } from 'src/workers/wallet.service';
import { TopUpWorkerService } from 'src/workers/top-up.service';
import { TopUpOrchestrator } from 'src/Orchestrators/top-up.orchestrator';
import { ProvisioningModule } from 'src/ProvisionningEvent/AuditLog.module';
import { PrismaService } from 'prisma/prisma.service';
import { WALLET_QUEUE } from '../Queue/Wallet.queue';
import { WalletProducer } from '../Producer/Wallet.producer';
import { PAYMENT_GATEWAY_ADAPTER } from 'src/payment/adapters/payment-gateway.token';
import { MockPaymentGatewayAdapter } from 'src/payment/adapters/mock-payment-gateway.adapter';

@Module({
  imports: [
    BullModule.registerQueue({ name: WALLET_QUEUE }),
    ProvisioningModule,
  ],
  providers: [
    WalletProcessor,
    WalletWorkerService,
    TopUpWorkerService,
    TopUpOrchestrator,
    WalletProducer,
    PrismaService,
    {
      provide: PAYMENT_GATEWAY_ADAPTER,
      useClass: MockPaymentGatewayAdapter,
    },
  ],
  exports: [WalletWorkerService, TopUpWorkerService, WalletProducer],
})
export class WalletModule {}
