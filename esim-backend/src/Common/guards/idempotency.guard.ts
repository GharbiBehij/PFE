import {
  CanActivate,
  ConflictException,
  ExecutionContext,
  Inject,
  Injectable,
} from '@nestjs/common';
import * as crypto from 'crypto';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../redis.provider';

const IDEMPOTENCY_TTL_SECONDS = 30;
const PENDING_MARKER = 'PENDING';

@Injectable()
export class IdempotencyGuard implements CanActivate {
  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request  = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    const userId  = request.user?.id;
    const { offerId, amount, channel } = request.body;

    // Generate deterministic key from request fingerprint
    const key = this.generateKey(userId, offerId, amount, channel);
    const redisKey = `idempotency:${key}`;

    const existing = await this.redis.get(redisKey);

    if (existing === PENDING_MARKER) {
      // First request still processing — reject duplicate
      throw new ConflictException(
        'A request with the same parameters is already being processed.',
      );
    }

    if (existing) {
      // First request completed — return cached result
      response.status(200).json(JSON.parse(existing));
      return false;
    }

    // Atomically claim the key — NX ensures only one request wins
    // if two arrive simultaneously
    await this.redis.set(
      redisKey,
      PENDING_MARKER,
      'EX',
      IDEMPOTENCY_TTL_SECONDS,
      'NX',
    );

    // Attach key to request so controller can store result after processing
    request.idempotencyKey = redisKey;

    return true;
  }

  private generateKey(
    userId: number,
    offerId: number,
    amount: number,
    channel: string,
  ): string {
    // Time window — rounds to nearest 30 seconds
    // same request within 30s window = same key
    const timeWindow = Math.floor(Date.now() / (IDEMPOTENCY_TTL_SECONDS * 1000));
    const raw = `purchase:${userId}:${offerId}:${amount}:${channel}:${timeWindow}`;
    return crypto.createHash('sha256').update(raw).digest('hex');
  }
}