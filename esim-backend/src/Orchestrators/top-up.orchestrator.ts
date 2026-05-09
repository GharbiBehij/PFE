import { Injectable, Logger, Inject } from '@nestjs/common';
import { TopUpStatus } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';
import { AuditLogService } from 'src/ProvisionningEvent/AuditLog.service';
import { WalletProducer } from 'src/Queue/Producer/Wallet.producer';
import { PAYMENT_GATEWAY_ADAPTER } from 'src/payment/adapters/payment-gateway.token';
import { PaymentGatewayAdapter } from 'src/payment/interfaces/payment-gateway.interface';
import { CreateTopUpDto } from '../top-up/dto/create-top-up.dto';
import { TopUpResponseDto } from '../top-up/dto/top-up-response.dto';

const TOP_UP_TRANSITIONS: Record<TopUpStatus, TopUpStatus[]> = {
  [TopUpStatus.PENDING]: [
    TopUpStatus.PENDING_PAYMENT,
    TopUpStatus.PENDING_CASH,
    TopUpStatus.FAILED,
  ],
  [TopUpStatus.PENDING_PAYMENT]: [
    TopUpStatus.APPROVED,
    TopUpStatus.REJECTED,
    TopUpStatus.FAILED,
  ],
  [TopUpStatus.PENDING_CASH]: [
    TopUpStatus.APPROVED,
    TopUpStatus.REJECTED,
    TopUpStatus.FAILED,
  ],
  [TopUpStatus.APPROVED]: [TopUpStatus.CREDITED, TopUpStatus.FAILED],
  [TopUpStatus.CREDITED]: [],
  [TopUpStatus.REJECTED]: [],
  [TopUpStatus.FAILED]: [],
};

@Injectable()
export class TopUpOrchestrator {
  private readonly logger = new Logger(TopUpOrchestrator.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly walletProducer: WalletProducer,
    private readonly auditLogService: AuditLogService,
    @Inject(PAYMENT_GATEWAY_ADAPTER)
    private readonly gatewayAdapter: PaymentGatewayAdapter,
  ) {}

  async transition(
    topUpRequestId: number,
    target: TopUpStatus,
    triggeredBy: string,
  ): Promise<void> {
    const current = await this.prisma.topUpRequest.findUnique({
      where: { id: topUpRequestId },
      select: { status: true },
    });

    if (!current) {
      throw new Error(`TopUpRequest ${topUpRequestId} not found`);
    }

    const allowed = TOP_UP_TRANSITIONS[current.status] ?? [];
    if (!allowed.includes(target)) {
      throw new Error(
        `Invalid TopUp transition: ${current.status} -> ${target} (triggeredBy: ${triggeredBy})`,
      );
    }

    await this.prisma.topUpRequest.update({
      where: { id: topUpRequestId },
      data: { status: target },
    });

    this.logger.log(
      `TopUpRequest #${topUpRequestId}: ${current.status} -> ${target} (by: ${triggeredBy})`,
    );
  }

  async initiateTopUp(
    dto: CreateTopUpDto,
    salesmanId: number,
  ): Promise<TopUpResponseDto> {
    const topUpRequest = await this.prisma.topUpRequest.create({
      data: {
        salesmanId,
        amount: dto.amount,
        currency: 'TND',
        paymentMethod: dto.paymentMethod,
        status: TopUpStatus.PENDING,
      },
    });

    this.logger.log(
      `TopUpRequest #${topUpRequest.id} created - salesman: ${salesmanId} amount: ${dto.amount} TND method: ${dto.paymentMethod}`,
    );

    if (dto.paymentMethod === 'CASH') {
      await this.transition(
        topUpRequest.id,
        TopUpStatus.PENDING_CASH,
        'orchestrator',
      );

      return {
        topUpRequestId: topUpRequest.id,
        status: 'PENDING_CASH',
        message:
          'Votre demande de recharge en especes est en attente de confirmation par votre responsable de zone',
      };
    }

    await this.transition(
      topUpRequest.id,
      TopUpStatus.PENDING_PAYMENT,
      'orchestrator',
    );

    let paymentResponse: {
      gatewayPaymentId: string;
      paymentUrl?: string;
      clientSecret?: string;
      type: 'REDIRECT' | 'INTENT';
    };
    try {
      paymentResponse = await this.gatewayAdapter.createPayment({
        amount: dto.amount,
        currency: 'TND',
        transactionId: topUpRequest.id,
        userId: salesmanId,
      });
    } catch (err: unknown) {
      await this.transition(
        topUpRequest.id,
        TopUpStatus.FAILED,
        'orchestrator',
      );
      await this.prisma.topUpRequest.update({
        where: { id: topUpRequest.id },
        data: {
          failureReason: err instanceof Error ? err.message : String(err),
        },
      });
      throw err;
    }

    await this.prisma.topUpRequest.update({
      where: { id: topUpRequest.id },
      data: {
        gatewayPaymentId: paymentResponse.gatewayPaymentId,
        paymentUrl: paymentResponse.paymentUrl,
      },
    });

    return {
      topUpRequestId: topUpRequest.id,
      status: 'PENDING_PAYMENT',
      paymentUrl: paymentResponse.paymentUrl,
      message: 'Procedez au paiement pour recharger votre portefeuille',
    };
  }

  async confirmCash(
    topUpRequestId: number,
    zoneChiefId: number,
  ): Promise<void> {
    const topUpRequest = await this.prisma.topUpRequest.findUnique({
      where: { id: topUpRequestId },
    });

    if (!topUpRequest) {
      throw new Error(`TopUpRequest ${topUpRequestId} not found`);
    }

    if (topUpRequest.status !== TopUpStatus.PENDING_CASH) {
      throw new Error(
        `Cannot confirm cash - TopUpRequest ${topUpRequestId} is in status ${topUpRequest.status}`,
      );
    }

    await this.prisma.topUpRequest.update({
      where: { id: topUpRequestId },
      data: { reviewedBy: zoneChiefId },
    });

    await this.transition(topUpRequestId, TopUpStatus.APPROVED, 'zone-chief');

    await this.walletProducer.enqueueTopUpCredit({
      topUpRequestId,
      salesmanId: topUpRequest.salesmanId,
      amount: topUpRequest.amount,
      currency: 'TND',
      paymentMethod: 'CASH',
    });

    this.logger.log(
      `Cash top-up confirmed by zone chief ${zoneChiefId} - TopUpRequest #${topUpRequestId} enqueued for credit`,
    );
  }

  async handleGatewayConfirmed(gatewayPaymentId: string): Promise<void> {
    const topUpRequest = await this.prisma.topUpRequest.findFirst({
      where: { gatewayPaymentId },
    });

    if (!topUpRequest) {
      throw new Error(
        `TopUpRequest not found for gatewayPaymentId=${gatewayPaymentId}`,
      );
    }

    if (topUpRequest.status !== TopUpStatus.PENDING_PAYMENT) {
      this.logger.log(
        `TopUpRequest #${topUpRequest.id} already in ${topUpRequest.status} - skipping webhook`,
      );
      return;
    }

    await this.transition(
      topUpRequest.id,
      TopUpStatus.APPROVED,
      'gateway-webhook',
    );

    await this.walletProducer.enqueueTopUpCredit({
      topUpRequestId: topUpRequest.id,
      salesmanId: topUpRequest.salesmanId,
      amount: topUpRequest.amount,
      currency: 'TND',
      paymentMethod: 'CARD',
    });

    this.logger.log(
      `Card top-up confirmed by gateway - TopUpRequest #${topUpRequest.id} enqueued for credit`,
    );
  }

  async handleGatewayFailed(
    gatewayPaymentId: string,
    reason: string,
  ): Promise<void> {
    const topUpRequest = await this.prisma.topUpRequest.findFirst({
      where: { gatewayPaymentId },
    });

    if (!topUpRequest) {
      throw new Error(
        `TopUpRequest not found for gatewayPaymentId=${gatewayPaymentId}`,
      );
    }

    await this.transition(
      topUpRequest.id,
      TopUpStatus.REJECTED,
      'gateway-webhook',
    );
    await this.prisma.topUpRequest.update({
      where: { id: topUpRequest.id },
      data: { failureReason: reason },
    });

    this.logger.warn(
      `Card top-up rejected by gateway - TopUpRequest #${topUpRequest.id} reason: ${reason}`,
    );
  }
}
