import { Module } from '@nestjs/common';
import { EsimTopUpController, TopUpController } from './top-up.controller';
import { TopUpOrchestrator } from '../Orchestrators/top-up.orchestrator';
import { PrismaService } from 'prisma/prisma.service';
import { ProvisioningModule } from 'src/ProvisionningEvent/AuditLog.module';
import { PaymentModule } from 'src/payment/payment.module';
import { PAYMENT_GATEWAY_ADAPTER } from 'src/payment/adapters/payment-gateway.token';
import { MockPaymentGatewayAdapter } from 'src/payment/adapters/mock-payment-gateway.adapter';
import { WalletModule } from 'src/Queue/module/wallet.module';
import { UserModule } from 'src/user/user.module';
import { EsimModule } from 'src/esim/esim.module';
import { TransactionModule } from 'src/transaction/transaction.module';
import { EsimTopupOrchestrator } from '../Orchestrators/Esimtopup.orchestrator';

@Module({
  imports: [
    ProvisioningModule,
    PaymentModule,
    WalletModule,
    UserModule,
    EsimModule,
    TransactionModule,
  ],
  controllers: [TopUpController, EsimTopUpController],
  providers: [
    TopUpOrchestrator,
    EsimTopupOrchestrator,
    PrismaService,
    {
      provide: PAYMENT_GATEWAY_ADAPTER,
      useClass: MockPaymentGatewayAdapter,
    },
  ],
  exports: [TopUpOrchestrator],
})
export class TopUpModule {}
