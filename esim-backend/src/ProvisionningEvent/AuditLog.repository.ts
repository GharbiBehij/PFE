import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class AuditLogRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createEvent(data: Prisma.AuditLogUncheckedCreateInput) {
    return this.prisma.auditLog.create({
      data,
    });
  }

  // Transaction-safe version for use within Prisma $transaction
  async createEventTx(
    tx: Prisma.TransactionClient,
    data: Prisma.AuditLogUncheckedCreateInput,
  ) {
    return tx.auditLog.create({
      data,
    });
  }
}
