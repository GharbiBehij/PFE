import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { Prisma, Transaction } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';
import { ClicToPayService } from './clictopay/clictopay.service';

@Injectable()
export class PaymentRepository {
  private readonly logger = new Logger(PaymentRepository.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly clicToPayService: ClicToPayService,
  ) {}

  async initiatePayment(transaction: Transaction): Promise<{
    gatewayOrderId: string;
    paymentUrl: string;
  }> {
    const existing = await this.prisma.payment.findUnique({
      where: { transactionId: transaction.id },
    });

    if (existing && existing.status !== 'FAILED') {
      throw new ConflictException('Order already processed');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: transaction.userId },
      select: { email: true },
    });

    const orderNumber = `NF-${transaction.id}-${Date.now()}`;

    const result = await this.clicToPayService.registerOrder({
      orderNumber,
      amount: transaction.amount *1000,
      currency: 788,
      returnUrl: `${process.env.CLICTOPAY_SUCCESS_URL}`,
      failUrl: `${process.env.CLICTOPAY_FAIL_URL}`,
      language: 'fr',
      pageView: 'MOBILE',
      description: `NetyFly eSIM - Commande #${transaction.id}`,
      email: user?.email ?? undefined,
    });
    this.logger.log(`[DEBUG] formUrl = "${result.formUrl}"`);

    if (!result.orderId || !result.formUrl) {
      const code = result.errorCode ?? 'unknown';
      const msg = result.errorMessage ?? 'Unknown ClicToPay error';
      this.logger.error(`ClicToPay register failed for tx ${transaction.id}: [${code}] ${msg}`);

      if (result.errorCode === 1) {
        throw new ConflictException('Order already processed');
      }

      throw new Error(`ClicToPay registration failed: [${code}] ${msg}`);
    }

    const paymentData: Prisma.PaymentUncheckedCreateInput = {
      transactionId: transaction.id,
      userId: transaction.userId,
      amount: transaction.amount,
      paymentProvider: 'CLICTOPAY',
      providerRefId: result.orderId,
      gatewayPaymentId: result.orderId,
      status: 'PENDING',
      paymentUrl: result.formUrl,
      rawResponse: result as unknown as Prisma.InputJsonValue,
    };

    if (existing?.status === 'FAILED') {
      await this.prisma.payment.update({
        where: { transactionId: transaction.id },
        data: {
          paymentProvider: paymentData.paymentProvider,
          providerRefId: paymentData.providerRefId,
          gatewayPaymentId: paymentData.gatewayPaymentId,
          status: paymentData.status,
          paymentUrl: paymentData.paymentUrl,
          rawResponse: paymentData.rawResponse,
          rawPayload: Prisma.JsonNull,
          clientSecret: null,
        },
      });
    } else {
      await this.prisma.payment.create({ data: paymentData });
    }

    return {
      gatewayOrderId: result.orderId,
      paymentUrl: result.formUrl,
    };
  }

  async checkPaymentStatus(gatewayOrderId: string): Promise<{
    status: number;
    pan?: string;
    approvalCode?: string;
    errorMessage?: string;
  }> {
    const result = await this.clicToPayService.getOrderStatus(gatewayOrderId);
    return {
      status: result.OrderStatus,
      pan: result.Pan,
      approvalCode: result.approvalCode,
      errorMessage: result.ErrorMessage,
    };
  }

  async reversePayment(gatewayOrderId: string): Promise<boolean> {
    const result = await this.clicToPayService.reverseOrder(gatewayOrderId);
    return String(result.errorCode) === '0';
  }

  async refundPayment(gatewayOrderId: string, amount: number): Promise<boolean> {
    const result = await this.clicToPayService.refundOrder(gatewayOrderId, amount);
    return String(result.errorCode) === '0';
  }

  async initiatePaymentTx(
    tx: Prisma.TransactionClient,
    data: Prisma.PaymentUncheckedCreateInput,
  ) {
    return tx.payment.create({ data });
  }

  async updatePaymentStatus(
    transactionId: number,
    status: string,
    rawResponse?: Prisma.InputJsonValue,
  ) {
    return this.prisma.payment.update({
      where: { transactionId },
      data: {
        status,
        ...(rawResponse ? { rawResponse } : {}),
      },
    });
  }

  async findByGatewayPaymentId(gatewayPaymentId: string) {
    return this.prisma.payment.findUnique({
      where: { gatewayPaymentId },
      include: { transaction: true },
    });
  }

  async findByTransactionId(transactionId: number) {
    return this.prisma.payment.findUnique({
      where: { transactionId },
      include: { transaction: true },
    });
  }

  async updateStatusByGatewayPaymentId(
    gatewayPaymentId: string,
    status: string,
    rawPayload?: Prisma.InputJsonValue,
  ) {
    return this.prisma.payment.update({
      where: { gatewayPaymentId },
      data: {
        status,
        ...(rawPayload ? { rawPayload } : {}),
      },
    });
  }

  async findStalePayments(olderThanMs: number) {
    const cutoff = new Date(Date.now() - olderThanMs);
    return this.prisma.payment.findMany({
      where: {
        gatewayPaymentId: { not: null },
        transaction: {
          status: { in: ['PENDING_PAYMENT', 'PAID', 'AUTHORIZED'] as any[] },
          updatedAt: { lt: cutoff },
        },
      },
      include: { transaction: true },
    });
  }

  async findExpiredCandidates(expiryMs: number) {
    const cutoff = new Date(Date.now() - expiryMs);
    return this.prisma.transaction.findMany({
      where: {
        status: 'PENDING_PAYMENT' as any,
        createdAt: { lt: cutoff },
      },
      select: { id: true, userId: true },
    });
  }
}
