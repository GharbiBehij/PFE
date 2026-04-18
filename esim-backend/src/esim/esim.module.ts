import { Module, forwardRef } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { EsimService } from './esim.service';
import { EsimController } from './esim.controller';
import { EsimRepository } from './esim.repository';
import { MockProviderAdapter } from './adapters/mock-provider.adapter';
import { PROVIDER_ADAPTER } from './adapters/provider-adapter.token';
import { PrismaService } from '../../prisma/prisma.service';
import { TransactionModule } from '../transaction/transaction.module';

@Module({
  imports: [
    HttpModule,
    forwardRef(() => TransactionModule),
  ],
  controllers: [EsimController],
  providers: [
    EsimService,
    EsimRepository,
    PrismaService,
    {
      provide: PROVIDER_ADAPTER,
      useClass: MockProviderAdapter,
    },
  ],
  exports: [EsimService, EsimRepository, PROVIDER_ADAPTER],
})
export class EsimModule {}
