// src/common/common.module.ts
import { Global, Module } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { IdempotencyGuard } from './guards/idempotency.guard';
import { RedisProvider } from './redis.provider';
import { ConfigModule } from '@nestjs/config';
@Global() //redisProvider is everywhere to prevent circualr dependency between workers and controllers (e.g. top-up.controller needs to enqueue a job after payment, which requires redis client, but we don't want to inject the entire queue module in the controller just for that)
@Module({
  imports: [ConfigModule],
  providers: [PrismaService, RedisProvider, IdempotencyGuard],
  exports: [IdempotencyGuard, RedisProvider],
})
export class CommonModule {}
