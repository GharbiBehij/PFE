import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { PaymentVerifyController } from './Webhook/webhook.controller';
import { PaymentRepository } from './payment.repository';
import { PaymentVerificationService } from './payment-verification.service';
import { PrismaService } from '../../prisma/prisma.service';
import { TransactionModule } from '../transaction/transaction.module';
import { ProvisioningModule } from '../ProvisionningEvent/AuditLog.module';
import { WalletModule } from '../WalletTransaction/wallet.module';
import { PAYMENT_GATEWAY_ADAPTER } from './adapters/payment-gateway.token';
import { ClicToPayGateway } from './adapters/ClicToPayGateway';
import { ReconciliationService } from './Webhook/reconciliation.service';
import { FundingService } from './Webhook/funding.service';
import { EsimModule } from '../esim/esim.module';
import { EsimQueueModule } from '../Queue/module/esim-queue.module';
import { UserModule } from '../user/user.module';
import { EsimTopupOrchestrator } from '../Orchestrators/Esimtopup.orchestrator';
import { ClicToPayModule } from './clictopay/clictopay.module';

@Module({
  imports: [
    ConfigModule,
    HttpModule,
    ClicToPayModule,
    TransactionModule,
    ProvisioningModule,
    WalletModule,
    EsimModule,
    EsimQueueModule,
    forwardRef(() => UserModule),
  ],
  controllers: [PaymentController, PaymentVerifyController],
  providers: [
    PaymentService,
    FundingService,
    PaymentRepository,
    PrismaService,
    PaymentVerificationService,
    EsimTopupOrchestrator,
    ReconciliationService,
    {
      provide: PAYMENT_GATEWAY_ADAPTER,
      useClass: ClicToPayGateway,
    },
  ],
  exports: [PaymentService, FundingService, PAYMENT_GATEWAY_ADAPTER],
})
export class PaymentModule {}
