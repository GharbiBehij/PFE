import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from '../auth/auth.module';
import { UserModule } from '../user/user.module';
import { EsimModule } from 'src/esim/esim.module';
import { TransactionModule } from 'src/transaction/transaction.module';
import { OfferModule } from 'src/offer/offer.module';
import { PaymentModule } from 'src/payment/payment.module';
import { ProvisioningModule } from 'src/ProvisionningEvent/EsimAuditLog.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
@Module({
  imports: [
    ThrottlerModule.forRoot([{
      ttl: 600,
      limit: 10,
    }]),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get('REDIS_HOST', 'localhost'),
          port: config.get('REDIS_PORT', 6379)
        },
        maxRetriesPerRequest: null,
        defaultJobOptions: { attempts: 5, delay: 30000 }
      })
    }),
    AuthModule,
    UserModule,
    EsimModule,
    TransactionModule,
    OfferModule,
    PaymentModule,
    ProvisioningModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule { }
