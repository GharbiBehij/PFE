import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { PaymentRepository } from './payment.repository';
import { PrismaService } from '../../prisma/prisma.service';
import { TransactionModule } from '../transaction/transaction.module';
import { ProvisioningModule } from '../AuditLog/AuditLog.module';
import { WalletModule } from '../WalletTransaction/wallet.module';
import { PAYMENT_GATEWAY_ADAPTER } from './adapters/payment-gateway.token';
import { ClicToPayGateway } from './adapters/ClicToPayGateway';
import { ReconciliationService } from './Webhook/reconciliation.service';
import { FundingService } from './Webhook/funding.service';
import { WebhookController } from './Webhook/webhook.controller';
import { EsimModule } from '../esim/esim.module';
import { EsimQueueModule } from '../Queue/module/esim-queue.module';
import { UserModule } from '../user/user.module';
import { ClicToPayModule } from './clictopay/clictopay.module';

@Module({
  imports: [
    ConfigModule,
    HttpModule,
    ClicToPayModule,
    forwardRef(() => TransactionModule),
    ProvisioningModule,
    forwardRef(() => WalletModule),
    forwardRef(() => EsimModule),
    forwardRef(() => EsimQueueModule),
    forwardRef(() => UserModule),
  ],
  controllers: [PaymentController, WebhookController],
  providers: [
    PaymentService,
    FundingService,
    PaymentRepository,
    PrismaService,
    ReconciliationService,
    {
      provide: PAYMENT_GATEWAY_ADAPTER,
      useClass: ClicToPayGateway,
    },
  ],
  exports: [PaymentService, FundingService, PAYMENT_GATEWAY_ADAPTER],
})
export class PaymentModule {}
