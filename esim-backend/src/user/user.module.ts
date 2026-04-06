import { Module } from '@nestjs/common';
import { userService } from './user.service';
import { userController } from './user.controller';
import { userRepository } from './user.repository';
import { PrismaService } from '../../prisma/prisma.service';
import { EsimPurchaseOrchestrator } from 'src/Orchestrators/EsimPurchaseOrchestrator';
import { TransactionModule } from '../transaction/transaction.module';
import { EsimQueueModule } from '../Queue/esim-queue.module';
import { PaymentModule } from '../payment/payment.module';
import { ProvisioningModule } from '../ProvisionningEvent/EsimAuditLog.module';
import { WalletModule } from '../WalletTransaction/wallet.module';

@Module({
  imports: [
    TransactionModule,
    EsimQueueModule,
    PaymentModule,
    ProvisioningModule,
    WalletModule,
  ],
  controllers: [userController],
  providers: [userService, userRepository, PrismaService, EsimPurchaseOrchestrator],
  exports: [userService],
})
export class UserModule {}
