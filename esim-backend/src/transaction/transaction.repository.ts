import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { TransactionStatus, EsimStatus, Prisma } from '@prisma/client';
import { AuditLayer, SystemEvent } from '@prisma/client';

@Injectable()
export class TransactionRepository {
  constructor(private readonly prisma: PrismaService) {}
  async createInitial(data: Prisma.TransactionUncheckedCreateInput) {
    return this.prisma.transaction.create({
      data,
    });
  }
  async updateStatus(id: number, status: TransactionStatus) {
    return this.prisma.transaction.update({
      where: { id },
      data: { status },
    });
  }

  updateStatusTx(tx: any, id: number, status: TransactionStatus) {
    return tx.transaction.update({
      where: { id },
      data: { status },
    });
  }
  async findOne(transactionid: number) {
    return this.prisma.transaction.findUnique({
      where: { id: transactionid },
    });
  }

  async findForUser(userId: number, transactionId: number) {
    return this.prisma.transaction.findFirst({
      where: { id: transactionId, userId },
      include: { esim: true },
    });
  }

  async findManyForUser(userId: number) {
    return this.prisma.transaction.findMany({
      where: { userId },
      include: { esim: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findWithRelations(transactionId: number) {
    return this.prisma.transaction.findUnique({
      where: { id: transactionId },
      include: { esim: true, payment: true },
    });
  }

  async findLatestAuditContext(transactionId: number): Promise<{
    attemptNumber: number | null;
    durationMs: number | null;
    layer: AuditLayer;
    event: SystemEvent;
  } | null> {
    const row = await this.prisma.auditLog.findFirst({
      where: { transactionId },
      orderBy: { createdAt: 'desc' },
      select: {
        attemptNumber: true,
        durationMs: true,
        layer: true,
        event: true,
      },
    });
    return row ?? null;
  }

  // Atomically updates payment, transaction, and eSIM statuses for a refund.
  // Uses a Prisma $transaction to ensure all-or-nothing consistency.
  async applyRefundStatuses(
    paymentId: number,
    transactionId: number,
    esimId: number,
  ): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.payment.update({
        where: { id: paymentId },
        data: { status: 'FAILED' },
      }),
      this.prisma.transaction.update({
        where: { id: transactionId },
        data: { status: TransactionStatus.FAILED },
      }),
      this.prisma.esim.update({
        where: { id: esimId },
        data: { status: EsimStatus.DELETED },
      }),
    ]);
  }

  // Creates a refund record and transitions the transaction to REFUNDED status.
  async createRefund(transactionId: number, userId: number): Promise<void> {
    await this.updateStatus(transactionId, TransactionStatus.REFUNDED);
  }
}
