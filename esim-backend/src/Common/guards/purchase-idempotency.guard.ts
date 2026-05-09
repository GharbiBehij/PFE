// src/common/guards/purchase-idempotency.guard.ts
import {
  BadRequestException,
  CanActivate,
  ConflictException,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { TransactionStatus } from '@prisma/client';
import { Request } from 'express';
import { PrismaService } from '../../../prisma/prisma.service';

const TERMINAL_STATUSES: TransactionStatus[] = [
  TransactionStatus.COMPLETED,
  TransactionStatus.FAILED,
  TransactionStatus.SUCCEEDED,
  TransactionStatus.EXPIRED,
  TransactionStatus.REFUNDED,
];

@Injectable()
export class PurchaseIdempotencyGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();

    const userId: number = (req.user as { userId: number }).userId;

    const rawOfferId: unknown = (req.body as Record<string, unknown>).offerId;
    const offerId = Number(rawOfferId);

    if (!rawOfferId || isNaN(offerId)) {
      throw new BadRequestException('offerId is required');
    }

    const existing = await this.prisma.transaction.findFirst({
      where: {
        userId,
        offerId,
        status: {
          notIn: TERMINAL_STATUSES,
        },
      },
      orderBy: { createdAt: 'desc' },
      select: { id: true, status: true },
    });

    if (existing) {
      throw new ConflictException(
        `An active purchase already exists for this offer — transactionId: ${existing.id}, status: ${existing.status}`,
      );
    }

    return true;
  }
}
