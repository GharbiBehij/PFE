import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { PaymentRepository } from './payment.repository';
import { PrismaService } from '../../prisma/prisma.service';
import { TransactionModule } from '../transaction/transaction.module';
import { ProvisioningModule } from '../ProvisionningEvent/EsimAuditLog.module';

@Module({
  imports: [TransactionModule, ProvisioningModule],
  controllers: [PaymentController],
  providers: [PaymentService, PaymentRepository, PrismaService],
  exports: [PaymentService],
})
export class PaymentModule { }
