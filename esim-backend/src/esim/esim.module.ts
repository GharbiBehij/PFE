import { Module, forwardRef } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { EsimService } from './esim.service';
import { EsimController } from './esim.controller';
import { EsimRepository } from './esim.repository';
import { MockProviderAdapter } from '../Adapters/mock-provider.adapter';
import { PROVIDER_ADAPTER } from './adapters/provider-adapter.token';
import { PrismaService } from '../../prisma/prisma.service';
import { TransactionModule } from '../transaction/transaction.module';
import { ProvisioningModule } from '../AuditLog/AuditLog.module';
import { TopUpModule } from '../top-up/top-up.module';
import { EsimQueueModule } from '../Queue/module/esim-queue.module';
import { UserModule } from '../user/user.module';
import { EsimActivationOrchestrator } from '../Orchestrators/EsimActivateOrchestrator';
import { GatewayModule } from '../gateway/gateway.module';

@Module({
  imports: [
    HttpModule,
    GatewayModule,
    forwardRef(() => TransactionModule),
    forwardRef(() => ProvisioningModule),
    forwardRef(() => TopUpModule),
    forwardRef(() => EsimQueueModule),
    forwardRef(() => UserModule),
  ],
  controllers: [EsimController],
  providers: [
    EsimService,
    EsimRepository,
    EsimActivationOrchestrator,
    PrismaService,
    {
      provide: PROVIDER_ADAPTER,
      useClass: MockProviderAdapter,
    },
  ],
  exports: [EsimService, EsimRepository, PROVIDER_ADAPTER],
})
export class EsimModule {}
