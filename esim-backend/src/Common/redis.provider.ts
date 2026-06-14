import { FactoryProvider } from '@nestjs/common';
import Redis from 'ioredis';
import { ConfigService } from '@nestjs/config';

export const REDIS_CLIENT = 'REDIS_CLIENT';

export const RedisProvider: FactoryProvider = {
  provide: REDIS_CLIENT,
  useFactory: (config: ConfigService) => {
    const useTls = config.get<string>('REDIS_TLS') === 'true';
    return new Redis({
      host: config.get<string>('REDIS_HOST', 'localhost'),
      port: parseInt(config.get<string>('REDIS_PORT', '6379'), 10),
      password: config.get<string>('REDIS_PASSWORD'),
      tls: useTls ? {} : undefined,
      maxRetriesPerRequest: null,
    });
  },
  inject: [ConfigService],
};
