import { Module, forwardRef } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { TransactionController } from './transaction.controller';
import { TransactionRepository } from './transaction.repository';
import { PrismaService } from '../../prisma/prisma.service';
import { OfferModule } from '../offer/offer.module';
import { EsimModule } from '../esim/esim.module';

@Module({
  imports: [OfferModule, forwardRef(() => EsimModule)],
  controllers: [TransactionController],
  providers: [TransactionService, TransactionRepository, PrismaService],
  exports: [TransactionService],
})
export class TransactionModule {}
