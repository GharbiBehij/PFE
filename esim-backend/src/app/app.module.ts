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
import { ProvisioningModule } from 'src/AuditLog/AuditLog.module';
import { EsimQueueModule } from 'src/Queue/module/esim-queue.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import Redis from 'ioredis';
import { BullBoardModule } from '@bull-board/nestjs';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { ScheduleModule } from '@nestjs/schedule';
import { ZoneChiefModule } from '../zone-chief/zone-chief.module';
import { TopUpModule } from 'src/top-up/top-up.module';
import { WalletModule } from 'src/WalletTransaction/wallet.module';
import { ESIM_QUEUE } from 'src/Queue/Queue/esim.queue';
import { SupportModule } from '../support/support.module';
import { NotificationModule } from '../notification/notification.module';
import { GatewayModule } from '../gateway/gateway.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([{ ttl: 600, limit: 10 }]),

    // ── BullMQ root config — no route here ──────────────────────
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: new Redis({
          host: config.get<string>('REDIS_HOST', 'localhost'),
          port: parseInt(config.get<string>('REDIS_PORT', '6379'), 10),
          password: config.get<string>('REDIS_PASSWORD'),
          tls: config.get<string>('REDIS_TLS') === 'true' ? {} : undefined,
          maxRetriesPerRequest: null,
        }),
        defaultJobOptions: { attempts: 2 },
      }),
    }),

    // ── Bull Board UI — visual queue inspector ───────────────────
    BullBoardModule.forRoot({
      route: '/queues',
      adapter: ExpressAdapter,
    }),
    BullBoardModule.forFeature({
      name: ESIM_QUEUE,
      adapter: BullMQAdapter,
    }),

    // ── Feature modules ──────────────────────────────────────────
    AuthModule,
    UserModule,
    EsimModule,
    TransactionModule,
    OfferModule,
    ZoneChiefModule,
    TopUpModule,
    WalletModule,
    NotificationModule,
    SupportModule,
    PaymentModule,
    ProvisioningModule,
    GatewayModule,
    EsimQueueModule,
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
export class AppModule {}
