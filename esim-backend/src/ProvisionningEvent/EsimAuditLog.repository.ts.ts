import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class EsimAuditLogRepository {
    constructor(private readonly prisma: PrismaService) { }

    async createEvent(data: Prisma.EsimAuditLogUncheckedCreateInput) {
        return this.prisma.esimAuditLog.create({
            data,
        });
    }

    // Transaction-safe version for use within Prisma $transaction
    async createEventTx(
        tx: Prisma.TransactionClient, data: Prisma.EsimAuditLogUncheckedCreateInput) {
        return tx.esimAuditLog.create({
            data,
        });
    }
}