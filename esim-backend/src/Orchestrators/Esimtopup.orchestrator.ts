import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AuditLayer,
  AuditTrigger,
  EsimStatus,
  Prisma,
  SystemEvent,
  TransactionStatus,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogService } from '../ProvisionningEvent/AuditLog.service';
import { PROVIDER_ADAPTER } from '../esim/adapters/provider-adapter.token';
import { ProviderAdapter } from '../esim/interfaces/provider-adapter.interface';
import { EsimTopupDto } from '../esim/dto/esim-topup.dto';
import { FundingService, FundingSource } from '../payment/Webhook/funding.service';
import { TransactionService } from '../transaction/transaction.service';
import { userService } from '../user/user.service';

@Injectable()
export class EsimTopupOrchestrator {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userService: userService,
    private readonly fundingService: FundingService,
    private readonly transactionService: TransactionService,
    private readonly auditLogService: AuditLogService,
    @Inject(PROVIDER_ADAPTER) private readonly providerAdapter: ProviderAdapter,
  ) {}

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
          topupContext: context,
        } as Prisma.InputJsonValue,
      },
    });
  }

  private readTopupContext(rawResponse: unknown):
    | { type: 'TOPUP'; esimId: number; offerId: number; iccid: string }
    | null {
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
