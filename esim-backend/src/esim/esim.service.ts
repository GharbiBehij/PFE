import { Injectable, NotFoundException, Inject, ForbiddenException, BadRequestException, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { plainToInstance } from 'class-transformer';
import { CreateEsimDto } from './adapters/create-esim.dto';
import { UpdateEsimDto } from './dto/update-esim.dto';
import { EsimResponseDto, EsimListResponseDto } from './dto/esim-response.dto';
import { DestinationResponseDto } from './dto/destination-response.dto';
import { EsimRepository } from './esim.repository';
import { ProviderAdapter } from './interfaces/provider-adapter.interface';
import { PROVIDER_ADAPTER } from './adapters/provider-adapter.token';
import { TransactionRepository } from 'src/transaction/transaction.repository';
import { EsimStatus, EsimEventStatus, TransactionStatus } from '@prisma/client';
import { getCountryImage } from './constants/country-images';

@Injectable()
export class EsimService {
  private readonly logger = new Logger(EsimService.name);
  private static readonly DESTINATIONS_CACHE_KEY = 'destinations:list:v2';
  private static readonly DESTINATIONS_CACHE_TTL_SECONDS = 300;

  constructor(
    private readonly esimRepository: EsimRepository,
    @Inject(PROVIDER_ADAPTER) private readonly providerAdapter: ProviderAdapter,
    private readonly transactionRepository: TransactionRepository,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) { }

  async getDestinations(): Promise<DestinationResponseDto[]> {
    try {
      // Cache strategy: read-through cache with a 5-minute TTL to reduce groupBy DB load.
      const cached = await this.cacheManager.get<DestinationResponseDto[]>(
        EsimService.DESTINATIONS_CACHE_KEY,
      );
      if (cached !== undefined && cached !== null) {
        return cached;
      }

      const aggregated =
        await this.esimRepository.aggregateDestinationsByCountryAndCoverageType();
      const destinations: DestinationResponseDto[] = aggregated
        .map((destination) => {
          const minPrice = destination._min?.price ?? 0;
          const maxPrice = destination._max?.price ?? 0;
          const offerCount = destination._count?._all ?? 0;

          return {
            country: destination.country,
            region: destination.Region,
            coverageType: destination.coverageType,
            offerCount,
            priceRange: {
              min: minPrice,
              max: maxPrice,
            },
            imageUrl: getCountryImage(destination.country),
            lowestPrice: minPrice,
          };
        })
        .sort((a, b) => b.offerCount - a.offerCount);

      await this.cacheManager.set(
        EsimService.DESTINATIONS_CACHE_KEY,
        destinations,
        EsimService.DESTINATIONS_CACHE_TTL_SECONDS,
      );

      return destinations;
    } catch (error: unknown) {
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error('Failed to aggregate destinations; returning empty list.', stack);
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
      const transaction = await this.transactionRepository.findOne(transactionId);
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
          event: EsimEventStatus.PROVISIONING_STARTED,
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

      await this.transactionRepository.updateStatus(transactionId, TransactionStatus.FAILED);
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
      .filter(e => e.status === EsimStatus.ACTIVE)
      .map(e => this.toResponseDto(e));

    const expired = esims
      .filter(e => e.status === EsimStatus.EXPIRED || e.status === EsimStatus.DELETED)
      .map(e => this.toResponseDto(e));

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
    const newDataUsed = Math.min((esim.dataUsed ?? 0) + increment, esim.dataTotal ?? 0);

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

  async deleteEsim(userId: number, esimId: number): Promise<{ message: string }> {
    this.assertValidEsimId(esimId);
    const esim = await this.esimRepository.findByIdWithOffer(esimId);

    if (!esim) throw new NotFoundException('eSIM not found');
    if (esim.userId !== userId) throw new ForbiddenException();

    const dataRemaining = (esim.dataTotal ?? 0) - (esim.dataUsed ?? 0);
    if (esim.status === EsimStatus.ACTIVE && dataRemaining > 0) {
      throw new BadRequestException('Cannot delete an active eSIM with remaining data');
    }

    await this.esimRepository.softDelete(esimId);
    return { message: 'eSIM deleted successfully' };
  }

  private toResponseDto(esim: any): EsimResponseDto {
    return plainToInstance(EsimResponseDto, esim, { excludeExtraneousValues: true });
  }

  private assertValidEsimId(id: number) {
    if (!Number.isInteger(id) || id <= 0) {
      throw new BadRequestException('Invalid eSIM id');
    }
  }
}
