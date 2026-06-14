import { Module, forwardRef } from '@nestjs/common';
import { TopUpController } from './top-up.controller';
import { TopUpOrchestrator } from '../Orchestrators/top-up.orchestrator';
import { PrismaService } from 'prisma/prisma.service';
import { ProvisioningModule } from 'src/AuditLog/AuditLog.module';
import { PaymentModule } from 'src/payment/payment.module';
import { PAYMENT_GATEWAY_ADAPTER } from 'src/payment/adapters/payment-gateway.token';
import { MockPaymentGatewayAdapter } from 'src/payment/adapters/mock-payment-gateway.adapter';
import { WalletModule } from 'src/Queue/module/wallet.module';
import { UserModule } from 'src/user/user.module';
import { EsimModule } from 'src/esim/esim.module';
import { TransactionModule } from 'src/transaction/transaction.module';
import { TopUpService } from './top-up.service';
@Module({
  imports: [
    ProvisioningModule,
    PaymentModule,
    forwardRef(() => WalletModule),
    forwardRef(() => UserModule),
    forwardRef(() => EsimModule),
    forwardRef(() => TransactionModule),
  ],
  controllers: [TopUpController],
  providers: [
    TopUpOrchestrator,
    TopUpService,
    PrismaService,
    {
      provide: PAYMENT_GATEWAY_ADAPTER,
      useClass: MockPaymentGatewayAdapter,
    },
  ],
  exports: [TopUpOrchestrator, TopUpService],
})
export class TopUpModule {}
