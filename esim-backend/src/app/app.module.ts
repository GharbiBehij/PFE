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
import { EsimQueueModule } from 'src/Queue/esim-queue.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-store';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRoot([{
      ttl: 600,
      limit: 10,
    }]),
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => ({
        // Redis cache with 5-minute TTL for read-heavy endpoints.
        store: await redisStore({
          socket: {
            host: config.get<string>('REDIS_HOST', 'localhost'),
            port: config.get<number>('REDIS_PORT', 6379),
          },
          ttl: 300,
        }),
      }),
    }),
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
export class AppModule { }
