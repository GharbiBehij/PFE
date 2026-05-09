import { Module, forwardRef } from '@nestjs/common';
import { userService } from './user.service';
import { userController } from './user.controller';
import { userRepository } from './user.repository';
import { PrismaService } from '../../prisma/prisma.service';
import { EsimPurchaseOrchestrator } from 'src/Orchestrators/EsimPurchaseOrchestrator';
import { TransactionModule } from '../transaction/transaction.module';
import { EsimQueueModule } from '../Queue/module/esim-queue.module';
import { PaymentModule } from '../payment/payment.module';
import { ProvisioningModule } from '../ProvisionningEvent/AuditLog.module';

@Module({
  imports: [
    forwardRef(() => TransactionModule),
    EsimQueueModule,
    forwardRef(() => PaymentModule),
    ProvisioningModule,
  ],
  controllers: [userController],
  providers: [
    userService,
    userRepository,
    PrismaService,
    EsimPurchaseOrchestrator,
  ],
  exports: [userService, EsimPurchaseOrchestrator],
})
export class UserModule {}
