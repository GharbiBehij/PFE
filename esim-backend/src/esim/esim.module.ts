import { Module, forwardRef } from '@nestjs/common';
import { EsimService } from './esim.service';
import { EsimController } from './esim.controller';
import { EsimRepository } from './esim.repository';
import { MockProviderAdapter } from './adapters/mock-provider.adapter';
import { PrismaService } from '../../prisma/prisma.service';
import { TransactionModule } from '../transaction/transaction.module';

@Module({
  imports: [forwardRef(() => TransactionModule)],
  controllers: [EsimController],
  providers: [EsimService, EsimRepository, MockProviderAdapter, PrismaService],
  exports: [EsimService],
})
export class EsimModule {}
