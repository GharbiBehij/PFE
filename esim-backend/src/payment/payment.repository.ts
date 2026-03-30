import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class PaymentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async initiatePayment(data: Prisma.PaymentUncheckedCreateInput) {
    return this.prisma.payment.create({
      data,
    });
  }

  async initiatePaymentTx(tx: Prisma.TransactionClient, data: Prisma.PaymentUncheckedCreateInput) {
    return tx.payment.create({
      data,
    });
  }

  async updatePaymentStatus(transactionId: number, status: string, rawResponse?: any) {
    return this.prisma.payment.update({
      where: { transactionId },
      data: {
        status,
        ...(rawResponse && { rawResponse }),
      },
    });
  }
}
