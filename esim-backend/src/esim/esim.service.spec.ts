import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, BadRequestException } from '@nestjs/common';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { EsimService } from './esim.service';
import { EsimRepository } from './esim.repository';
import { TransactionRepository } from '../transaction/transaction.repository';
import { PROVIDER_ADAPTER } from './adapters/provider-adapter.token';
import { EsimStatus } from '@prisma/client';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

const mockEsimRepository = {
  findByUserId: jest.fn<() => Promise<any[]>>(),
  findByIdWithOffer: jest.fn<() => Promise<any>>(),
  updateUsage: jest.fn<() => Promise<any>>(),
  softDelete: jest.fn<(id: number) => Promise<void>>(),
  findById: jest.fn<() => Promise<any>>(),
  createAndLinkTransaction: jest.fn<() => Promise<any>>(),
  updateStatus: jest.fn<() => Promise<any>>(),
};

const mockTransactionRepository = {
  findOne: jest.fn<() => Promise<any>>(),
  updateStatus: jest.fn<() => Promise<any>>(),
};

const mockProviderAdapter = {
  createEsim: jest.fn<() => Promise<any>>(),
  getStatus: jest.fn<() => Promise<any>>(),
  cancelEsim: jest.fn<() => Promise<any>>(),
  deactivateEsim: jest.fn<() => Promise<any>>(),
};

const mockCacheManager = {
  get: jest.fn<() => Promise<any>>(),
  set: jest.fn<() => Promise<any>>(),
};

function makeEsim(overrides: Partial<any> = {}): any {
  return {
    id: 1,
    userId: 10,
    status: EsimStatus.ACTIVE,
    dataTotal: 5120,
    dataUsed: 1000,
    lastUsageSync: new Date(),
    offer: { country: 'France', Region: 'Europe' },
    qrCode: null,
    activatedAt: new Date(),
    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    createdAt: new Date(),
    ...overrides,
  };
}

describe('EsimService', () => {
  let service: EsimService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EsimService,
        { provide: EsimRepository, useValue: mockEsimRepository },
        { provide: TransactionRepository, useValue: mockTransactionRepository },
        { provide: PROVIDER_ADAPTER, useValue: mockProviderAdapter },
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
      ],
    }).compile();

    service = module.get<EsimService>(EsimService);
  });

  // ── getUserEsims ────────────────────────────────────────────────────────────

  describe('getUserEsims', () => {
    it('splits ACTIVE into active[] and EXPIRED/DELETED into expired[]', async () => {
      mockEsimRepository.findByUserId.mockResolvedValue([
        makeEsim({ id: 1, status: EsimStatus.ACTIVE }),
        makeEsim({ id: 2, status: EsimStatus.EXPIRED }),
        makeEsim({ id: 3, status: EsimStatus.DELETED }),
      ]);

      const result = await service.getUserEsims(10);

      expect(result.active).toHaveLength(1);
      expect(result.expired).toHaveLength(2);
    });
  });

  // ── getEsimById ─────────────────────────────────────────────────────────────

  describe('getEsimById', () => {
    it('throws ForbiddenException when userId does not match esim owner', async () => {
      mockEsimRepository.findByIdWithOffer.mockResolvedValue(makeEsim({ userId: 99 }));
      await expect(service.getEsimById(10, 1)).rejects.toThrow(ForbiddenException);
    });

    it('calls syncUsage when lastUsageSync is null', async () => {
      const esim = makeEsim({ lastUsageSync: null });
      mockEsimRepository.findByIdWithOffer
        .mockResolvedValueOnce(esim)   // getEsimById call
        .mockResolvedValueOnce(esim);  // inside syncUsage
      mockEsimRepository.updateUsage.mockResolvedValue(esim);

      const syncSpy = jest.spyOn(service, 'syncUsage');
      await service.getEsimById(10, 1);
      expect(syncSpy).toHaveBeenCalledWith(1);
    });

    it('calls syncUsage when lastUsageSync is older than 5 minutes', async () => {
      const stale = new Date(Date.now() - 6 * 60 * 1000);
      const esim = makeEsim({ lastUsageSync: stale });
      mockEsimRepository.findByIdWithOffer
        .mockResolvedValueOnce(esim)
        .mockResolvedValueOnce(esim);
      mockEsimRepository.updateUsage.mockResolvedValue(esim);

      const syncSpy = jest.spyOn(service, 'syncUsage');
      await service.getEsimById(10, 1);
      expect(syncSpy).toHaveBeenCalledWith(1);
    });

    it('does NOT call syncUsage when lastUsageSync is fresh', async () => {
      const fresh = new Date(Date.now() - 60 * 1000); // 1 min ago
      const esim = makeEsim({ lastUsageSync: fresh });
      mockEsimRepository.findByIdWithOffer.mockResolvedValue(esim);

      const syncSpy = jest.spyOn(service, 'syncUsage');
      await service.getEsimById(10, 1);
      expect(syncSpy).not.toHaveBeenCalled();
    });
  });

  // ── deleteEsim ──────────────────────────────────────────────────────────────

  describe('deleteEsim', () => {
    it('throws ForbiddenException when userId does not match esim owner', async () => {
      mockEsimRepository.findByIdWithOffer.mockResolvedValue(makeEsim({ userId: 99 }));
      await expect(service.deleteEsim(10, 1)).rejects.toThrow(ForbiddenException);
    });

    it('throws BadRequestException when eSIM is ACTIVE with remaining data', async () => {
      mockEsimRepository.findByIdWithOffer.mockResolvedValue(
        makeEsim({ status: EsimStatus.ACTIVE, dataTotal: 5120, dataUsed: 1000 }),
      );
      await expect(service.deleteEsim(10, 1)).rejects.toThrow(BadRequestException);
    });

    it('soft-deletes an EXPIRED eSIM and returns success message', async () => {
      mockEsimRepository.findByIdWithOffer.mockResolvedValue(
        makeEsim({ status: EsimStatus.EXPIRED }),
      );
      mockEsimRepository.softDelete.mockResolvedValue(undefined);

      const result = await service.deleteEsim(10, 1);

      expect(mockEsimRepository.softDelete).toHaveBeenCalledWith(1);
      expect(result).toEqual({ message: 'eSIM deleted successfully' });
    });
  });
});
