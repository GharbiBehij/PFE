import { Module, forwardRef } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { TransactionController } from './transaction.controller';
import { TransactionRepository } from './transaction.repository';
import { PrismaService } from '../../prisma/prisma.service';
import { OfferModule } from '../offer/offer.module';
import { EsimModule } from '../esim/esim.module';
import { UserModule } from '../user/user.module';
import { CommonModule } from 'src/Common/common.module';
import { ClicToPayModule } from '../payment/clictopay/clictopay.module';
import { NotificationModule } from '../notification/notification.module';
import { ProvisioningModule } from '../AuditLog/AuditLog.module';

@Module({
  imports: [
    OfferModule,
    forwardRef(() => EsimModule),
    forwardRef(() => UserModule),
    CommonModule,
    ClicToPayModule,
    NotificationModule,
    forwardRef(() => ProvisioningModule),
  ],
  controllers: [TransactionController],
  providers: [TransactionService, TransactionRepository, PrismaService],
  exports: [TransactionService, TransactionRepository],
})
export class TransactionModule {}
