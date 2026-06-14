import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  AuditLayer,
  AuditTrigger,
  EsimStatus,
  Prisma,
  SystemEvent,
  TransactionStatus,
  TransactionType,
  TopUpStatus,
} from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';
import { AuditLogService } from 'src/AuditLog/AuditLog.service';
import { WalletProducer } from 'src/Queue/Producer/Wallet.producer';
import { PAYMENT_GATEWAY_ADAPTER } from 'src/payment/adapters/payment-gateway.token';
import { PaymentGatewayAdapter } from 'src/payment/interfaces/payment-gateway.interface';
import {
  FundingService,
  FundingSource,
} from 'src/payment/Webhook/funding.service';
import { TransactionService } from 'src/transaction/transaction.service';
import { userService } from 'src/user/user.service';
import { PROVIDER_ADAPTER } from '../esim/adapters/provider-adapter.token';
import { EsimTopupDto } from '../esim/dto/esim-topup.dto';
import { ProviderAdapter } from '../Adapters/provider-adapter.interface';
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
    private readonly userService: userService,
    private readonly fundingService: FundingService,
    private readonly transactionService: TransactionService,
    @Inject(PROVIDER_ADAPTER) private readonly providerAdapter: ProviderAdapter,
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
      await this.auditLogService.log({
        userId: salesmanId,
        transactionId: topUpRequest.id,
        layer: 'TOP_UP',
        event: 'TOP_UP_PENDING_CASH',
        triggeredBy: 'SYSTEM',
        message: `Top-up of ${dto.amount} TND initiated with CASH payment method`,
      });

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
    await this.auditLogService.log({
      userId: salesmanId,
      transactionId: topUpRequest.id,
      layer: 'TOP_UP',
      event: 'TOP_UP_PENDING_PAYMENT',
      triggeredBy: 'SYSTEM',
      message: `Top-up of ${dto.amount} TND initiated using ${dto.paymentMethod}`,
    });

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
      await this.auditLogService.log({
        userId: salesmanId,
        transactionId: topUpRequest.id,
        layer: 'TOP_UP',
        event: 'TOP_UP_PAYMENT_FAILED',
        triggeredBy: 'SYSTEM',
        message: `Payment initiation failed: ${err instanceof Error ? err.message : String(err)}`,
      });
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
    await this.auditLogService.log({
      userId: zoneChiefId,
      transactionId: topUpRequestId,
      layer: 'TOP_UP',
      event: 'TOP_UP_CASH_CONFIRMED',
      triggeredBy: 'USER',
      message: `Cash top-up confirmed for TopUpRequest #${topUpRequestId} by zone chief ${zoneChiefId}`,
    });

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
    await this.auditLogService.log({
      userId: topUpRequest.salesmanId,
      transactionId: topUpRequest.id,
      layer: 'TOP_UP',
      event: 'PAYMENT_CONFIRMED',
      triggeredBy: 'WEBHOOK',
      message: `Payment confirmed by gateway for TopUpRequest #${topUpRequest.id}`,
    });

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
    await this.auditLogService.log({
      userId: topUpRequest.salesmanId,
      transactionId: topUpRequest.id,
      layer: 'TOP_UP',
      event: 'TOP_UP_PAYMENT_FAILED',
      triggeredBy: 'WEBHOOK',
      message: `Payment failed according to gateway for TopUpRequest #${topUpRequest.id} - reason: ${reason}`,
    });
    await this.prisma.topUpRequest.update({
      where: { id: topUpRequest.id },
      data: { failureReason: reason },
    });

    this.logger.warn(
      `Card top-up rejected by gateway - TopUpRequest #${topUpRequest.id} reason: ${reason}`,
    );
  }

  // ── eSIM Data Top-up Flow (B2C/B2B2C) ─────────────────────────────────────
  async topupEsim(esimId: number, dto: EsimTopupDto, userId: number) {
    const user = await this.userService.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    const channel = user.role === 'SALESMAN' ? 'B2B2C' : 'B2C';

    const esim = await this.prisma.esim.findUnique({
      where: { id: esimId },
      include: { offer: true },
    });
    if (!esim) throw new NotFoundException('eSIM not found');
    if (esim.userId !== userId) throw new BadRequestException('Not your eSIM');
    if (esim.status !== EsimStatus.ACTIVE) {
      throw new BadRequestException('eSIM must be active to top-up');
    }

    const offer = await this.prisma.offer.findUnique({
      where: { id: dto.offerId },
    });
    if (!offer) throw new NotFoundException('Offer not found');

    if (!esim.offer?.country)
      throw new BadRequestException('eSIM country is missing');
    if (offer.country !== esim.offer.country) {
      throw new BadRequestException(
        `Top-up offer must be for ${esim.offer.country}`,
      );
    }

    const transaction = await this.prisma.transaction.create({
      data: {
        userId,
        offerId: dto.offerId,
        amount: offer.price,
        currency: 'TND',
        channel,
        status: TransactionStatus.PENDING,
        type: TransactionType.TOPUP,
      },
    });

    await this.auditLogService.log({
      transactionId: transaction.id,
      userId,
      layer: AuditLayer.SYSTEM,
      event: SystemEvent.PURCHASE_REQUESTED,
      toStatus: 'PENDING',
      triggeredBy: AuditTrigger.USER,
      message: 'TOPUP_REQUESTED',
      details: {
        type: 'TOPUP',
        esimId: esim.id,
        offerId: dto.offerId,
        iccid: esim.iccid,
      },
    });

    await this.transactionService.transition(
      transaction.id,
      channel === 'B2B2C'
        ? TransactionStatus.PROCESSING
        : TransactionStatus.PENDING_PAYMENT,
      'esim-topup-orchestrator',
    );

    const fundingSource =
      channel === 'B2B2C' ? FundingSource.WALLET : FundingSource.GATEWAY;

    const funding = await this.fundingService.execute(
      fundingSource,
      {
        offerId: dto.offerId,
        amount: offer.price,
        currency: 'TND',
        channel,
        paymentMethod:
          channel === 'B2B2C'
            ? 'WALLET'
            : ((dto.paymentMethod as 'WALLET' | 'CASH') ?? 'CASH'),
        email: user.email,
        firstname: user.firstname,
        lastname: user.lastname,
        passportId: user.passportId ?? '',
        userId,
        status: TransactionStatus.PENDING,
      },
      transaction.id,
      userId,
      channel === 'B2B2C' ? userId : undefined,
    );

    if (funding.status === 'FAILED') {
      await this.transactionService.transition(
        transaction.id,
        TransactionStatus.FAILED,
        'esim-topup-orchestrator',
      );
      return {
        transactionId: transaction.id,
        status: 'FAILED',
        message:
          fundingSource === FundingSource.WALLET
            ? 'WALLET_FAILED'
            : 'PAYMENT_FAILED',
        error: funding.error,
      };
    }

    if (funding.status === 'PENDING') {
      await this.attachTopupContext(transaction.id, {
        type: 'TOPUP',
        esimId: esim.id,
        offerId: dto.offerId,
        iccid: esim.iccid,
      });

      return {
        transactionId: transaction.id,
        status: 'PENDING_PAYMENT',
        paymentUrl: funding.paymentUrl,
        clientSecret: funding.clientSecret,
        type: funding.type,
      };
    }

    return this.executeTopupNow({
      transactionId: transaction.id,
      userId,
      esimId: esim.id,
      iccid: esim.iccid,
      offerId: dto.offerId,
    });
  }

  async handlePaidTopup(transactionId: number, userId: number) {
    const payment = await this.prisma.payment.findUnique({
      where: { transactionId },
    });
    const context = this.readTopupContext(payment?.rawResponse);
    if (!context || context.type !== 'TOPUP') {
      throw new BadRequestException(
        `Missing TOPUP context for transaction ${transactionId}`,
      );
    }

    return this.executeTopupNow({
      transactionId,
      userId,
      esimId: context.esimId,
      iccid: context.iccid,
      offerId: context.offerId,
    });
  }

  isTopupPayment(rawResponse: unknown): boolean {
    const context = this.readTopupContext(rawResponse);
    return context?.type === 'TOPUP';
  }

  async getTopupOffers(esimId: number, userId: number) {
    const esim = await this.prisma.esim.findUnique({
      where: { id: esimId },
      include: { offer: true },
    });

    if (!esim) throw new NotFoundException('eSIM not found');
    if (esim.userId !== userId) throw new BadRequestException('Not your eSIM');
    if (!esim.offer?.country)
      throw new BadRequestException('eSIM country is missing');

    return this.prisma.offer.findMany({
      where: {
        country: esim.offer.country,
        isDeleted: false,
      },
      orderBy: { price: 'asc' },
    });
  }

  private async executeTopupNow(params: {
    transactionId: number;
    userId: number;
    esimId: number;
    iccid: string;
    offerId: number;
  }) {
    const { transactionId, userId, esimId, iccid, offerId } = params;

    await this.transactionService.transition(
      transactionId,
      TransactionStatus.PROVISIONING,
      'esim-topup-orchestrator',
    );

    const result = await this.providerAdapter.topupEsim(iccid, String(offerId));

    if (result.status === 'FAILED') {
      await this.transactionService.transition(
        transactionId,
        TransactionStatus.FAILED,
        'esim-topup-orchestrator',
      );

      await this.auditLogService.log({
        transactionId,
        userId,
        layer: AuditLayer.PROVISIONING,
        event: SystemEvent.PROVISIONING_FAILED,
        toStatus: 'FAILED',
        triggeredBy: AuditTrigger.PROVIDER,
        message: `Top-up failed: ${result.message ?? 'unknown error'}`,
      });

      return { transactionId, status: 'FAILED', error: result.message };
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.esim.update({
        where: { id: esimId },
        data: {
          dataTotal: { increment: result.addedData },
          ...(result.newExpiryDate ? { expiryDate: result.newExpiryDate } : {}),
        },
      });
    });

    await this.transactionService.transition(
      transactionId,
      TransactionStatus.SUCCEEDED,
      'esim-topup-orchestrator',
    );

    await this.auditLogService.log({
      transactionId,
      userId,
      layer: AuditLayer.PROVISIONING,
      event: SystemEvent.PROVISIONING_SUCCESS,
      toStatus: 'SUCCEEDED',
      triggeredBy: AuditTrigger.PROVIDER,
      message: `Top-up successful: ${result.addedData}MB added to ${iccid}`,
    });

    return {
      transactionId,
      status: 'SUCCESS',
      addedData: result.addedData,
      newExpiryDate: result.newExpiryDate,
    };
  }

  private async attachTopupContext(
    transactionId: number,
    context: { type: 'TOPUP'; esimId: number; offerId: number; iccid: string },
  ) {
    const payment = await this.prisma.payment.findUnique({
      where: { transactionId },
      select: { rawResponse: true },
    });
    if (!payment) return;

    const current =
      payment.rawResponse && typeof payment.rawResponse === 'object'
        ? (payment.rawResponse as Record<string, unknown>)
        : {};

    await this.prisma.payment.update({
      where: { transactionId },
      data: {
        rawResponse: {
          ...current,
          topup: true,
          esimId: context.esimId,
          offerId: context.offerId,
          topupContext: context,
        } as Prisma.InputJsonValue,
      },
    });
  }

  private readTopupContext(
    rawResponse: unknown,
  ): { type: 'TOPUP'; esimId: number; offerId: number; iccid: string } | null {
    if (!rawResponse || typeof rawResponse !== 'object') return null;
    const root = rawResponse as Record<string, unknown>;
    const ctx = root.topupContext as Record<string, unknown> | undefined;
    if (!ctx) return null;
    if (ctx.type !== 'TOPUP') return null;
    const esimId = Number(ctx.esimId);
    const offerId = Number(ctx.offerId);
    const iccid = String(ctx.iccid ?? '');
    if (!Number.isFinite(esimId) || !Number.isFinite(offerId) || !iccid) {
      return null;
    }
    return { type: 'TOPUP', esimId, offerId, iccid };
  }
}
