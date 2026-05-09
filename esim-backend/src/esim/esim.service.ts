import {
  Injectable,
  NotFoundException,
  Inject,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { CreateEsimDto } from './adapters/create-esim.dto';
import { UpdateEsimDto } from './dto/update-esim.dto';
import { EsimResponseDto, EsimListResponseDto } from './dto/esim-response.dto';
import { DestinationResponseDto } from './dto/destination-response.dto';
import { EsimRepository } from './esim.repository';
import { ProviderAdapter } from './interfaces/provider-adapter.interface';
import { PROVIDER_ADAPTER } from './adapters/provider-adapter.token';
import { TransactionRepository } from 'src/transaction/transaction.repository';
import {
  EsimStatus,
  TransactionStatus,
  AuditLayer,
  AuditTrigger,
  SystemEvent,
  statusDomain,
  Esim,
} from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { AuditLogService } from '../ProvisionningEvent/AuditLog.service';
import { PrismaService } from '../../prisma/prisma.service';

const ESIM_TRANSITIONS: Record<EsimStatus, EsimStatus[]> = {
  [EsimStatus.NOT_ACTIVE]: [EsimStatus.PENDING],
  [EsimStatus.PENDING]: [EsimStatus.PROCESSING],
  [EsimStatus.PROCESSING]: [EsimStatus.ACTIVE, EsimStatus.FAILED],
  [EsimStatus.ACTIVE]: [],
  [EsimStatus.FAILED]: [],
  [EsimStatus.EXPIRED]: [],
  [EsimStatus.DELETED]: [],
};

export const TERMINAL_ESIM_STATUSES = new Set<EsimStatus>([
  EsimStatus.ACTIVE,
  EsimStatus.FAILED,
  EsimStatus.EXPIRED,
  EsimStatus.DELETED,
]);

export function assertValidEsimTransition(
  from: EsimStatus,
  to: EsimStatus,
  esimId: number,
): void {
  if (from === EsimStatus.DELETED) {
    throw new BadRequestException(
      `eSIM ${esimId} is deleted and cannot be transitioned`,
    );
  }

  const allowed = ESIM_TRANSITIONS[from] ?? [];

  if (!allowed.includes(to)) {
    throw new BadRequestException(
      `Invalid eSIM transition: ${from} → ${to} for esimId=${esimId}`,
    );
  }
}

@Injectable()
export class EsimService {
  private readonly logger = new Logger(EsimService.name);

  constructor(
    private readonly esimRepository: EsimRepository,
    @Inject(PROVIDER_ADAPTER) private readonly providerAdapter: ProviderAdapter,
    private readonly transactionRepository: TransactionRepository,
    private readonly prisma: PrismaService,
    private readonly auditLogService: AuditLogService,
    private readonly config: ConfigService,
  ) {}

  async getDestinations() {
    const pickBestNetwork = (types: Set<string>): string => {
      if (types.has('5G')) return '5G';
      if (types.has('4G/5G')) return '4G/5G';
      return '4G';
    };
    try {
      const offers = await this.prisma.offer.findMany({
        where: { isDeleted: false },
        select: {
          country: true,
          coverageType: true,
          networkType: true,
          Region: true,
          price: true,
        },
      });

      const localMap = new Map<string, {
        country: string;
        prices: number[];
        count: number;
        Region: string;
        networkTypes: Set<string>;
      }>();

      const regionalMap = new Map<string, {
        region: string;
        prices: number[];
        count: number;
        networkTypes: Set<string>;
      }>();

      const globalAcc: { prices: number[]; count: number; networkTypes: Set<string> } = {
        prices: [],
        count: 0,
        networkTypes: new Set(),
      };

      for (const offer of offers) {
        const net = offer.networkType ?? '4G';

        if (offer.coverageType === 'LOCAL') {
          if (!localMap.has(offer.country)) {
            localMap.set(offer.country, {
              country: offer.country,
              prices: [],
              count: 0,
              Region: offer.Region,
              networkTypes: new Set(),
            });
          }
          const entry = localMap.get(offer.country)!;
          entry.prices.push(offer.price);
          entry.networkTypes.add(net);
          entry.count++;
        }

        if (offer.coverageType === 'REGIONAL') {
          if (!regionalMap.has(offer.Region)) {
            regionalMap.set(offer.Region, {
              region: offer.Region,
              prices: [],
              count: 0,
              networkTypes: new Set(),
            });
          }
          const entry = regionalMap.get(offer.Region)!;
          entry.prices.push(offer.price);
          entry.networkTypes.add(net);
          entry.count++;
        }

        if (offer.coverageType === 'GLOBAL') {
          globalAcc.prices.push(offer.price);
          globalAcc.networkTypes.add(net);
          globalAcc.count++;
        }
      }

      const local = Array.from(localMap.values()).map((entry) => ({
        id: entry.country,
        country: entry.country,
        countryCode: '',
        coverageType: 'LOCAL' as const,
        startingPrice: Math.min(...entry.prices),
        offerCount: entry.count,
        networkType: pickBestNetwork(entry.networkTypes),
        Region: entry.Region,
      }));

      const regionCodeMap: Record<string, string> = {
        'Europe':        'eu',
        'Asia':          'jp',
        'Middle East':   'ae',
        'North America': 'us',
        'Oceania':       'au',
      };

      const regional = Array.from(regionalMap.values()).map((entry) => ({
        id: entry.region,
        country: entry.region,
        countryCode: regionCodeMap[entry.region] ?? 'eu',
        coverageType: 'REGIONAL' as const,
        startingPrice: Math.min(...entry.prices),
        offerCount: entry.count,
        networkType: pickBestNetwork(entry.networkTypes),
        Region: entry.region,
      }));

      const global = globalAcc.count > 0
        ? [{
            id: 'mondial',
            country: 'Mondial',
            countryCode: 'world',
            coverageType: 'GLOBAL' as const,
            startingPrice: Math.min(...globalAcc.prices),
            offerCount: globalAcc.count,
            networkType: pickBestNetwork(globalAcc.networkTypes),
            Region: 'Global',
          }]
        : [];

      return [...local, ...regional, ...global];
    } catch (error: unknown) {
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        'Failed to aggregate destinations; returning empty list.',
        stack,
      );
      return [];
    }
  }

  async create(
    dto: CreateEsimDto,
    userId: number,
    transactionId: number,
    providerId: number,
  ) {
    try {
      const transaction =
        await this.transactionRepository.findOne(transactionId);
      if (!transaction) {
        throw new NotFoundException('Transaction Not found');
      }

      // Idempotency: if eSIM already created for this transaction, return it
      const existingEsim = await this.esimRepository.findById(transactionId);
      if (existingEsim) {
        return { success: true, esim: existingEsim };
      }

      const esimData = await this.providerAdapter.createEsim(dto);

      const esim = await this.esimRepository.createAndLinkTransaction(
        {
          iccid: esimData.iccid,
          activationCode: esimData.activationCode,
          transactionId,
          expiryDate: esimData.expiryDate,
          status: EsimStatus.NOT_ACTIVE,
          userId,
          providerId,
        },
        transactionId,
      );

      return { success: true, esim };
    } catch (error: any) {
      if (error.isTimeout || error?.status >= 500) {
        throw new Error('Transient Provider Error');
      }

      await this.transactionRepository.updateStatus(
        transactionId,
        TransactionStatus.FAILED,
      );
      return { success: false, terminal: true, error: error?.message };
    }
  }

  findById(id: number) {
    this.assertValidEsimId(id);
    return this.esimRepository.findById(id);
  }

  findAll() {
    return `This action returns all esim`;
  }

  findOne(id: number) {
    return `This action returns a #${id} esim`;
  }

  UpdateEsim(id: number, dto: UpdateEsimDto) {
    return this.esimRepository.UpdateEsim(id, dto);
  }

  remove(id: number) {
    return `This action removes a #${id} esim`;
  }

  async getUserEsims(userId: number): Promise<EsimListResponseDto> {
    const esims = await this.esimRepository.findByUserId(userId);

    const active = esims
      .filter((e) => e.status === EsimStatus.ACTIVE)
      .map((e) => this.toResponseDto(e));

    const expired = esims
      .filter(
        (e) =>
          e.status === EsimStatus.EXPIRED || e.status === EsimStatus.DELETED,
      )
      .map((e) => this.toResponseDto(e));

    return { active, expired };
  }

  async getEsimById(userId: number, esimId: number): Promise<EsimResponseDto> {
    this.assertValidEsimId(esimId);
    const esim = await this.esimRepository.findByIdWithOffer(esimId);

    if (!esim) throw new NotFoundException('eSIM not found');
    if (esim.userId !== userId) throw new ForbiddenException();

    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    if (!esim.lastUsageSync || esim.lastUsageSync < fiveMinutesAgo) {
      const synced = await this.syncUsage(esimId);
      return this.toResponseDto(synced);
    }

    return this.toResponseDto(esim);
  }

  async syncUsage(esimId: number) {
    this.assertValidEsimId(esimId);
    const esim = await this.esimRepository.findByIdWithOffer(esimId);
    if (!esim) throw new NotFoundException('eSIM not found');

    // TODO: integrate real provider API
    const increment = Math.floor(Math.random() * 41) + 10; // mock: 10–50 MB
    const newDataUsed = Math.min(
      (esim.dataUsed ?? 0) + increment,
      esim.dataTotal ?? 0,
    );

    return this.esimRepository.updateUsage(esimId, newDataUsed);
  }

  async markPending(id: number) {
    return this.esimRepository.updateStatus(id, EsimStatus.PENDING);
  }
  async markNotActive(id: number) {
    return this.esimRepository.updateStatus(id, EsimStatus.NOT_ACTIVE);
  }
  async markProcessing(id: number) {
    return this.esimRepository.updateStatus(id, EsimStatus.PROCESSING);
  }
  async markActive(id: number) {
    return this.esimRepository.updateStatus(id, EsimStatus.ACTIVE);
  }
  async markExpired(id: number) {
    return this.esimRepository.updateStatus(id, EsimStatus.EXPIRED);
  }
  async markDeleted(id: number) {
    return this.esimRepository.updateStatus(id, EsimStatus.DELETED);
  }

  async deleteEsim(
    userId: number,
    esimId: number,
  ): Promise<{ message: string }> {
    this.assertValidEsimId(esimId);
    const esim = await this.esimRepository.findByIdWithOffer(esimId);

    if (!esim) throw new NotFoundException('eSIM not found');
    if (esim.userId !== userId) throw new ForbiddenException();

    const dataRemaining = (esim.dataTotal ?? 0) - (esim.dataUsed ?? 0);
    if (esim.status === EsimStatus.ACTIVE && dataRemaining > 0) {
      throw new BadRequestException(
        'Cannot delete an active eSIM with remaining data',
      );
    }

    await this.esimRepository.softDelete(esimId);
    return { message: 'eSIM deleted successfully' };
  }

  private toResponseDto(esim: any): EsimResponseDto {
    return plainToInstance(EsimResponseDto, esim, {
      excludeExtraneousValues: true,
    });
  }

  private assertValidEsimId(id: number): void {
    if (!Number.isInteger(id) || id <= 0) {
      throw new BadRequestException('Invalid eSIM id');
    }
  }

  // ─── Activation state machine ────────────────────────────────────────────

  async requestActivation(
    esimId: number,
    params: {
      userId: number;
      transactionId: number;
      providerCode: string;
    },
  ): Promise<Esim> {
    const targetStatus = EsimStatus.PENDING;
    let isIdempotent = false;

    const esim = await this.prisma.$transaction(
      async (tx) => {
        await tx.$executeRaw`SET LOCAL lock_timeout = '5s'`;

        const [locked] = await tx.$queryRaw<any[]>`
          SELECT * FROM "Esim" WHERE id = ${esimId} FOR UPDATE
        `;

        if (!locked) {
          throw new NotFoundException(`eSIM ${esimId} not found`);
        }

        const currentStatus = locked.status as EsimStatus;

        if (currentStatus === targetStatus) {
          isIdempotent = true;
          return tx.esim.findUnique({ where: { id: esimId } });
        }

        if (currentStatus === EsimStatus.DELETED) {
          throw new BadRequestException(
            `eSIM ${esimId} is deleted and cannot be transitioned`,
          );
        }

        try {
          assertValidEsimTransition(currentStatus, targetStatus, esimId);
        } catch (error) {
          await this.auditLogService.log({
            layer: AuditLayer.ACTIVATION,
            event: SystemEvent.ILLEGAL_TRANSITION_ATTEMPTED,
            fromStatus: String(currentStatus),
            toStatus: String(targetStatus),
            statusDomain: statusDomain.ESIM,
            triggeredBy: AuditTrigger.SYSTEM,
            trigger: undefined,
            userId: params.userId,
            transactionId: params.transactionId,
            attemptNumber: undefined,
            providerCode: params.providerCode ?? undefined,
            message: `Invalid transition: ${currentStatus} → ${targetStatus}`,
            details: { esimId },
          });
          throw error;
        }

        return tx.esim.update({
          where: { id: esimId },
          data: { status: targetStatus },
        });
      },
      { timeout: 10000 },
    );

    if (isIdempotent) {
      return esim as Esim;
    }

    await this.auditLogService.log({
      layer: AuditLayer.ACTIVATION,
      event: SystemEvent.ACTIVATION_REQUESTED,
      fromStatus: String(EsimStatus.NOT_ACTIVE),
      toStatus: String(targetStatus),
      statusDomain: statusDomain.ESIM,
      triggeredBy: AuditTrigger.SYSTEM,
      trigger: undefined,
      userId: params.userId,
      transactionId: params.transactionId,
      attemptNumber: undefined,
      providerCode: params.providerCode,
      message: undefined,
      details: null,
    });

    return esim as Esim;
  }

  async startProcessing(
    esimId: number,
    params: {
      userId: number;
      transactionId: number;
      providerRequestId: string;
      attemptNumber: number;
      providerCode: string;
    },
  ): Promise<Esim> {
    const targetStatus = EsimStatus.PROCESSING;
    let isIdempotent = false;

    const esim = await this.prisma.$transaction(
      async (tx) => {
        await tx.$executeRaw`SET LOCAL lock_timeout = '5s'`;

        const [locked] = await tx.$queryRaw<any[]>`
          SELECT * FROM "Esim" WHERE id = ${esimId} FOR UPDATE
        `;

        if (!locked) {
          throw new NotFoundException(`eSIM ${esimId} not found`);
        }

        const currentStatus = locked.status as EsimStatus;

        if (currentStatus === targetStatus) {
          isIdempotent = true;
          return tx.esim.findUnique({ where: { id: esimId } });
        }

        if (currentStatus === EsimStatus.DELETED) {
          throw new BadRequestException(
            `eSIM ${esimId} is deleted and cannot be transitioned`,
          );
        }

        try {
          assertValidEsimTransition(currentStatus, targetStatus, esimId);
        } catch (error) {
          await this.auditLogService.log({
            layer: AuditLayer.ACTIVATION,
            event: SystemEvent.ILLEGAL_TRANSITION_ATTEMPTED,
            fromStatus: String(currentStatus),
            toStatus: String(targetStatus),
            statusDomain: statusDomain.ESIM,
            triggeredBy: AuditTrigger.WORKER,
            trigger: params.providerRequestId,
            userId: params.userId,
            transactionId: params.transactionId,
            attemptNumber: params.attemptNumber,
            providerCode: params.providerCode,
            message: `Invalid transition: ${currentStatus} → ${targetStatus}`,
            details: { esimId },
          });
          throw error;
        }

        return tx.esim.update({
          where: { id: esimId },
          data: { status: targetStatus },
        });
      },
      { timeout: 10000 },
    );

    if (isIdempotent) {
      return esim as Esim;
    }

    await this.auditLogService.log({
      layer: AuditLayer.ACTIVATION,
      event: SystemEvent.ACTIVATION_PROCESSING,
      fromStatus: String(EsimStatus.PENDING),
      toStatus: String(targetStatus),
      statusDomain: statusDomain.ESIM,
      triggeredBy: AuditTrigger.WORKER,
      trigger: params.providerRequestId,
      userId: params.userId,
      transactionId: params.transactionId,
      attemptNumber: params.attemptNumber,
      providerCode: params.providerCode,
      message: undefined,
      details: null,
    });

    return esim as Esim;
  }

  async markActivationSuccess(
    esimId: number,
    params: {
      userId: number;
      transactionId: number;
      providerRequestId: string;
      attemptNumber: number;
      durationMs: number;
      providerCode: string;
      providerLatencyMs?: number;
    },
  ): Promise<Esim> {
    const targetStatus = EsimStatus.ACTIVE;
    let isIdempotent = false;

    const esim = await this.prisma.$transaction(
      async (tx) => {
        await tx.$executeRaw`SET LOCAL lock_timeout = '5s'`;

        const [locked] = await tx.$queryRaw<any[]>`
          SELECT * FROM "Esim" WHERE id = ${esimId} FOR UPDATE
        `;

        if (!locked) {
          throw new NotFoundException(`eSIM ${esimId} not found`);
        }

        const currentStatus = locked.status as EsimStatus;

        if (currentStatus === targetStatus) {
          isIdempotent = true;
          return tx.esim.findUnique({ where: { id: esimId } });
        }

        if (currentStatus === EsimStatus.DELETED) {
          throw new BadRequestException(
            `eSIM ${esimId} is deleted and cannot be transitioned`,
          );
        }

        try {
          assertValidEsimTransition(currentStatus, targetStatus, esimId);
        } catch (error) {
          await this.auditLogService.log({
            layer: AuditLayer.ACTIVATION,
            event: SystemEvent.ILLEGAL_TRANSITION_ATTEMPTED,
            fromStatus: String(currentStatus),
            toStatus: String(targetStatus),
            statusDomain: statusDomain.ESIM,
            triggeredBy: AuditTrigger.WORKER,
            trigger: params.providerRequestId,
            userId: params.userId,
            transactionId: params.transactionId,
            attemptNumber: params.attemptNumber,
            providerCode: params.providerCode,
            message: `Invalid transition: ${currentStatus} → ${targetStatus}`,
            details: { esimId },
          });
          throw error;
        }

        return tx.esim.update({
          where: { id: esimId },
          data: { status: targetStatus, activatedAt: new Date() },
        });
      },
      { timeout: 10000 },
    );

    if (isIdempotent) {
      return esim as Esim;
    }

    await this.auditLogService.log({
      layer: AuditLayer.ACTIVATION,
      event: SystemEvent.ACTIVATION_SUCCESS,
      fromStatus: String(EsimStatus.PROCESSING),
      toStatus: String(targetStatus),
      statusDomain: statusDomain.ESIM,
      triggeredBy: AuditTrigger.WORKER,
      trigger: params.providerRequestId,
      userId: params.userId,
      transactionId: params.transactionId,
      attemptNumber: params.attemptNumber,
      startedAt: Date.now() - params.durationMs,
      providerLatencyMs: params.providerLatencyMs ?? undefined,
      providerCode: params.providerCode,
      message: undefined,
      details: null,
    });

    return esim as Esim;
  }

  async markActivationFailure(
    esimId: number,
    params: {
      userId: number;
      transactionId: number;
      providerRequestId: string;
      attemptNumber: number;
      errorCode?: string;
      errorMessage?: string;
      durationMs: number;
      providerCode: string;
      isFinalAttempt: boolean;
    },
  ): Promise<Esim> {
    const targetStatus = EsimStatus.FAILED;
    let skipAuditLog = false;

    const esim = await this.prisma.$transaction(
      async (tx) => {
        await tx.$executeRaw`SET LOCAL lock_timeout = '5s'`;

        const [locked] = await tx.$queryRaw<any[]>`
          SELECT * FROM "Esim" WHERE id = ${esimId} FOR UPDATE
        `;

        if (!locked) {
          throw new NotFoundException(`eSIM ${esimId} not found`);
        }

        if (!params.isFinalAttempt) {
          // Non-final attempt — keep PROCESSING, no status change
          return tx.esim.findUnique({ where: { id: esimId } });
        }

        const currentStatus = locked.status as EsimStatus;

        if (currentStatus === targetStatus) {
          skipAuditLog = true;
          return tx.esim.findUnique({ where: { id: esimId } });
        }

        if (currentStatus === EsimStatus.DELETED) {
          throw new BadRequestException(
            `eSIM ${esimId} is deleted and cannot be transitioned`,
          );
        }

        try {
          assertValidEsimTransition(currentStatus, targetStatus, esimId);
        } catch (error) {
          await this.auditLogService.log({
            layer: AuditLayer.ACTIVATION,
            event: SystemEvent.ILLEGAL_TRANSITION_ATTEMPTED,
            fromStatus: String(currentStatus),
            toStatus: String(targetStatus),
            statusDomain: statusDomain.ESIM,
            triggeredBy: AuditTrigger.WORKER,
            trigger: params.providerRequestId,
            userId: params.userId,
            transactionId: params.transactionId,
            attemptNumber: params.attemptNumber,
            providerCode: params.providerCode,
            message: `Invalid transition: ${currentStatus} → ${targetStatus}`,
            details: { esimId },
          });
          throw error;
        }

        return tx.esim.update({
          where: { id: esimId },
          data: { status: targetStatus },
        });
      },
      { timeout: 10000 },
    );

    if (!skipAuditLog) {
      await this.auditLogService.log({
        layer: AuditLayer.ACTIVATION,
        event: SystemEvent.ACTIVATION_FAILED,
        fromStatus: String(EsimStatus.PROCESSING),
        toStatus: params.isFinalAttempt
          ? String(targetStatus)
          : String(EsimStatus.PROCESSING),
        statusDomain: statusDomain.ESIM,
        triggeredBy: AuditTrigger.WORKER,
        trigger: params.providerRequestId,
        userId: params.userId,
        transactionId: params.transactionId,
        attemptNumber: params.attemptNumber,
        startedAt: Date.now() - params.durationMs,
        providerLatencyMs: undefined,
        providerCode: params.providerCode,
        message: params.errorMessage ?? undefined,
        details: {
          errorCode: params.errorCode ?? null,
          errorMessage: params.errorMessage ?? null,
          isFinalAttempt: params.isFinalAttempt,
        },
      });
    }

    return esim as Esim;
  }

  async markTimeout(
    esimId: number,
    params: {
      userId: number;
      transactionId: number;
      providerRequestId: string;
      attemptNumber: number;
      durationMs: number;
      providerCode: string;
      isFinalAttempt: boolean;
    },
  ): Promise<Esim> {
    const targetStatus = EsimStatus.FAILED;
    let skipAuditLog = false;

    const esim = await this.prisma.$transaction(
      async (tx) => {
        await tx.$executeRaw`SET LOCAL lock_timeout = '5s'`;

        const [locked] = await tx.$queryRaw<any[]>`
          SELECT * FROM "Esim" WHERE id = ${esimId} FOR UPDATE
        `;

        if (!locked) {
          throw new NotFoundException(`eSIM ${esimId} not found`);
        }

        if (!params.isFinalAttempt) {
          // Non-final timeout — keep PROCESSING, no status change
          return tx.esim.findUnique({ where: { id: esimId } });
        }

        const currentStatus = locked.status as EsimStatus;

        if (currentStatus === targetStatus) {
          skipAuditLog = true;
          return tx.esim.findUnique({ where: { id: esimId } });
        }

        if (currentStatus === EsimStatus.DELETED) {
          throw new BadRequestException(
            `eSIM ${esimId} is deleted and cannot be transitioned`,
          );
        }

        try {
          assertValidEsimTransition(currentStatus, targetStatus, esimId);
        } catch (error) {
          await this.auditLogService.log({
            layer: AuditLayer.ACTIVATION,
            event: SystemEvent.ILLEGAL_TRANSITION_ATTEMPTED,
            fromStatus: String(currentStatus),
            toStatus: String(targetStatus),
            statusDomain: statusDomain.ESIM,
            triggeredBy: AuditTrigger.WORKER,
            trigger: params.providerRequestId,
            userId: params.userId,
            transactionId: params.transactionId,
            attemptNumber: params.attemptNumber,
            providerCode: params.providerCode,
            message: `Invalid transition: ${currentStatus} → ${targetStatus}`,
            details: { esimId },
          });
          throw error;
        }

        return tx.esim.update({
          where: { id: esimId },
          data: { status: targetStatus },
        });
      },
      { timeout: 10000 },
    );

    if (!skipAuditLog) {
      await this.auditLogService.log({
        layer: AuditLayer.ACTIVATION,
        event: SystemEvent.PROVIDER_TIMEOUT,
        fromStatus: String(EsimStatus.PROCESSING),
        toStatus: params.isFinalAttempt
          ? String(targetStatus)
          : String(EsimStatus.PROCESSING),
        statusDomain: statusDomain.ESIM,
        triggeredBy: AuditTrigger.WORKER,
        trigger: params.providerRequestId,
        userId: params.userId,
        transactionId: params.transactionId,
        attemptNumber: params.attemptNumber,
        startedAt: Date.now() - params.durationMs,
        providerLatencyMs: undefined,
        providerCode: params.providerCode,
        message: undefined,
        details: {
          isFinalAttempt: params.isFinalAttempt,
          timedOutAfterMs: params.durationMs,
        },
      });
    }

    return esim as Esim;
  }
}
