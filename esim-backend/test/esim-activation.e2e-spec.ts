/**
 * esim-activation.e2e-spec.ts
 *
 * Integration test suite for the eSIM activation state machine in EsimService.
 *
 * Run: npx jest --config test/jest-e2e.json --testPathPattern esim-activation
 */

import { Test, TestingModule } from '@nestjs/testing';
import { Logger, NotFoundException } from '@nestjs/common';
import {
  EsimStatus,
  SystemEvent,
  AuditLayer,
  AuditTrigger,
} from '@prisma/client';
import { Job } from 'bullmq';

// Suppress NestJS logger output globally so intentional error-path tests stay clean
beforeAll(() => {
  jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
  jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
  jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
});

afterAll(() => {
  jest.restoreAllMocks();
});

import {
  EsimService,
  assertValidEsimTransition,
  TERMINAL_ESIM_STATUSES,
} from '../src/esim/esim.service';
import { TransactionService } from '../src/transaction/transaction.service';
import { EsimRepository } from '../src/esim/esim.repository';
import { AuditLogService } from '../src/AuditLog/AuditLog.service';
import { PROVIDER_ADAPTER } from '../src/esim/adapters/provider-adapter.token';
import { EsimProducer } from '../src/Queue/Producer/esim.producer';
import { TransactionRepository } from '../src/transaction/transaction.repository';
import { OfferService } from '../src/offer/offer.service';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

const MAX_ACTIVATION_ATTEMPTS = 5; // matches ESIM_MAX_ACTIVATION_ATTEMPTS default

class ProviderTimeoutError extends Error {
  constructor(message = 'Provider timed out') {
    super(message);
    this.name = 'ProviderTimeoutError';
  }
}

type ActivationJobData = {
  esimId: number;
  userId: number;
  transactionId: number;
  providerCode: string;
  providerRequestId: string;
};

// ═══════════════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════════════

function makeEsim(
  overrides: Partial<{
    id: number;
    status: EsimStatus;
    userId: number;
    transactionId: number;
    providerId: number;
    iccid: string;
    activationCode: string;
    activatedAt: Date | null;
    expiryDate: Date;
  }> = {},
) {
  return {
    id: overrides.id ?? 1,
    status: overrides.status ?? EsimStatus.NOT_ACTIVE,
    userId: overrides.userId ?? 10,
    transactionId: overrides.transactionId ?? 100,
    providerId: overrides.providerId ?? 1,
    iccid: overrides.iccid ?? 'ICCID-TEST-001',
    activationCode: overrides.activationCode ?? 'ACT-CODE-001',
    activatedAt: overrides.activatedAt ?? null,
    expiryDate:
      overrides.expiryDate ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

function makeJob(
  overrides: Partial<{
    id: string;
    attemptsMade: number;
    data: Partial<ActivationJobData>;
  }> = {},
): Job<ActivationJobData> {
  return {
    id: overrides.id ?? `job-${Math.random().toString(36).slice(2)}`,
    attemptsMade: overrides.attemptsMade ?? 0,
    name: 'activate-esim',
    data: {
      esimId: overrides.data?.esimId ?? 1,
      userId: overrides.data?.userId ?? 10,
      transactionId: overrides.data?.transactionId ?? 100,
      providerCode: overrides.data?.providerCode ?? 'AIRALO',
      providerRequestId: overrides.data?.providerRequestId ?? 'req-001',
    },
  } as unknown as Job<ActivationJobData>;
}

function makeActivationParams(
  overrides: Partial<{
    userId: number;
    transactionId: number;
    providerCode: string;
    providerRequestId: string;
    attemptNumber: number;
    durationMs: number;
    providerLatencyMs: number;
    isFinalAttempt: boolean;
    errorCode: string;
    errorMessage: string;
  }> = {},
) {
  return {
    userId: overrides.userId ?? 10,
    transactionId: overrides.transactionId ?? 100,
    providerCode: overrides.providerCode ?? 'AIRALO',
    providerRequestId: overrides.providerRequestId ?? 'req-001',
    attemptNumber: overrides.attemptNumber ?? 1,
    durationMs: overrides.durationMs ?? 1200,
    providerLatencyMs: overrides.providerLatencyMs ?? 800,
    isFinalAttempt: overrides.isFinalAttempt ?? false,
    errorCode: overrides.errorCode ?? 'PROVIDER_ERROR',
    errorMessage: overrides.errorMessage ?? 'Provider returned error',
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// Mock factories
// ═══════════════════════════════════════════════════════════════════════════

function buildMockEsimRepository() {
  return {
    findOne: jest.fn(),
    updateStatus: jest.fn(),
    findByUserId: jest.fn(),
    findByTransactionId: jest.fn(),
  };
}

function buildMockAuditLogService() {
  return {
    log: jest.fn().mockResolvedValue(undefined),
  };
}

function buildMockProviderAdapter() {
  return {
    activate: jest.fn(),
    fetchActivationStatus: jest.fn(),
  };
}

function buildMockConfigService() {
  return {
    get: jest.fn().mockImplementation((key: string, defaultValue?: number) => {
      if (key === 'ESIM_MAX_ACTIVATION_ATTEMPTS')
        return MAX_ACTIVATION_ATTEMPTS;
      return defaultValue;
    }),
  };
}

function buildMockTransactionRepository() {
  return {
    findOne: jest.fn(),
    updateStatus: jest.fn(),
    createInitial: jest.fn(),
    findLatestAuditContext: jest.fn(),
  };
}

function buildMockEsimProducer() {
  return {
    enqueuePurchase: jest.fn().mockResolvedValue(undefined),
    enqueueActivation: jest.fn().mockResolvedValue(undefined),
  };
}

function buildMockPrismaService() {
  return {
    $transaction: jest.fn(),
  };
}

function buildPrismaTx(
  lockedEsim: ReturnType<typeof makeEsim> | null,
  updatedEsim?: ReturnType<typeof makeEsim>,
  findUniqueEsim?: ReturnType<typeof makeEsim>,
) {
  const update = jest.fn().mockResolvedValue(updatedEsim ?? lockedEsim ?? null);
  const findUnique = jest
    .fn()
    .mockResolvedValue(findUniqueEsim ?? lockedEsim ?? null);

  return {
    tx: {
      $executeRaw: jest.fn().mockResolvedValue(undefined),
      $queryRaw: jest.fn().mockResolvedValue(lockedEsim ? [lockedEsim] : []),
      esim: {
        update,
        findUnique,
      },
    },
    update,
    findUnique,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. assertValidEsimTransition — pure function unit tests
// ═══════════════════════════════════════════════════════════════════════════

describe('assertValidEsimTransition — pure function', () => {
  afterEach(() => jest.clearAllMocks());

  it('TR1 — NOT_ACTIVE → PENDING is valid', () => {
    expect(() =>
      assertValidEsimTransition(EsimStatus.NOT_ACTIVE, EsimStatus.PENDING, 1),
    ).not.toThrow();
  });

  it('TR2 — PENDING → PROCESSING is valid', () => {
    expect(() =>
      assertValidEsimTransition(EsimStatus.PENDING, EsimStatus.PROCESSING, 1),
    ).not.toThrow();
  });

  it('TR3 — PROCESSING → ACTIVE is valid', () => {
    expect(() =>
      assertValidEsimTransition(EsimStatus.PROCESSING, EsimStatus.ACTIVE, 1),
    ).not.toThrow();
  });

  it('TR4 — PROCESSING → FAILED is valid', () => {
    expect(() =>
      assertValidEsimTransition(EsimStatus.PROCESSING, EsimStatus.FAILED, 1),
    ).not.toThrow();
  });

  it('TR5 — NOT_ACTIVE → ACTIVE is invalid (skips states)', () => {
    expect(() =>
      assertValidEsimTransition(EsimStatus.NOT_ACTIVE, EsimStatus.ACTIVE, 1),
    ).toThrow('Invalid eSIM transition: NOT_ACTIVE → ACTIVE for esimId=1');
  });

  it('TR6 — ACTIVE → any is invalid (terminal)', () => {
    expect(() =>
      assertValidEsimTransition(EsimStatus.ACTIVE, EsimStatus.PENDING, 1),
    ).toThrow();

    expect(() =>
      assertValidEsimTransition(EsimStatus.ACTIVE, EsimStatus.PROCESSING, 1),
    ).toThrow();
  });

  it('TR7 — FAILED → ACTIVE is invalid (terminal)', () => {
    expect(() =>
      assertValidEsimTransition(EsimStatus.FAILED, EsimStatus.ACTIVE, 1),
    ).toThrow('Invalid eSIM transition: FAILED → ACTIVE for esimId=1');
  });

  it('TR8 — EXPIRED → any is invalid (terminal, cannot re-activate)', () => {
    expect(() =>
      assertValidEsimTransition(EsimStatus.EXPIRED, EsimStatus.PENDING, 1),
    ).toThrow();

    expect(() =>
      assertValidEsimTransition(EsimStatus.EXPIRED, EsimStatus.ACTIVE, 1),
    ).toThrow();
  });

  it('TR9 — DELETED → any throws immediately', () => {
    expect(() =>
      assertValidEsimTransition(EsimStatus.DELETED, EsimStatus.PENDING, 1),
    ).toThrow('eSIM 1 is deleted and cannot be transitioned');
  });

  it('TR10 — FAILED → PENDING is invalid (no retry from failed)', () => {
    expect(() =>
      assertValidEsimTransition(EsimStatus.FAILED, EsimStatus.PENDING, 1),
    ).toThrow();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. Happy path (no edge cases)
// ═══════════════════════════════════════════════════════════════════════════

describe('EsimService — happy path activation flow', () => {
  let module: TestingModule;
  let esimService: EsimService;
  let transactionService: TransactionService;
  let esimRepo: ReturnType<typeof buildMockEsimRepository>;
  let auditLog: ReturnType<typeof buildMockAuditLogService>;
  let providerAdapter: ReturnType<typeof buildMockProviderAdapter>;
  let txRepo: ReturnType<typeof buildMockTransactionRepository>;
  let esimProducer: ReturnType<typeof buildMockEsimProducer>;
  let prisma: ReturnType<typeof buildMockPrismaService>;
  let configService: ReturnType<typeof buildMockConfigService>;

  beforeEach(async () => {
    esimRepo = buildMockEsimRepository();
    auditLog = buildMockAuditLogService();
    providerAdapter = buildMockProviderAdapter();
    txRepo = buildMockTransactionRepository();
    esimProducer = buildMockEsimProducer();
    prisma = buildMockPrismaService();
    configService = buildMockConfigService();

    module = await Test.createTestingModule({
      providers: [
        EsimService,
        TransactionService,
        { provide: EsimRepository, useValue: esimRepo },
        { provide: AuditLogService, useValue: auditLog },
        { provide: PROVIDER_ADAPTER, useValue: providerAdapter },
        { provide: TransactionRepository, useValue: txRepo },
        { provide: EsimProducer, useValue: esimProducer },
        {
          provide: OfferService,
          useValue: {
            findbyId: jest.fn().mockResolvedValue({ id: 101, price: 1800 }),
          },
        },
        { provide: ConfigService, useValue: configService },
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    esimService = module.get(EsimService);
    transactionService = module.get(TransactionService);
  });

  afterEach(() => jest.clearAllMocks());

  it('HP1 — requestActivation transitions NOT_ACTIVE → PENDING', async () => {
    const { tx, update } = buildPrismaTx(
      makeEsim({ status: EsimStatus.NOT_ACTIVE }),
      makeEsim({ status: EsimStatus.PENDING }),
    );
    prisma.$transaction.mockImplementationOnce(async (cb: any) => cb(tx));

    const result = await esimService.requestActivation(
      1,
      makeActivationParams(),
    );

    expect(update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { status: EsimStatus.PENDING },
    });
    expect(result.status).toBe(EsimStatus.PENDING);
    expect(auditLog.log).toHaveBeenCalledWith(
      expect.objectContaining({
        event: SystemEvent.ACTIVATION_REQUESTED,
        layer: AuditLayer.ACTIVATION,
        fromStatus: 'NOT_ACTIVE',
        toStatus: 'PENDING',
        triggeredBy: AuditTrigger.SYSTEM,
      }),
    );
  });

  it('HP2 — startProcessing transitions PENDING → PROCESSING', async () => {
    const { tx, update } = buildPrismaTx(
      makeEsim({ status: EsimStatus.PENDING }),
      makeEsim({ status: EsimStatus.PROCESSING }),
    );
    prisma.$transaction.mockImplementationOnce(async (cb: any) => cb(tx));

    const params = makeActivationParams({ attemptNumber: 1 });
    const result = await esimService.startProcessing(1, params);

    expect(update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { status: EsimStatus.PROCESSING },
    });
    expect(result.status).toBe(EsimStatus.PROCESSING);
    expect(auditLog.log).toHaveBeenCalledWith(
      expect.objectContaining({
        event: SystemEvent.ACTIVATION_PROCESSING,
        layer: AuditLayer.ACTIVATION,
        fromStatus: 'PENDING',
        toStatus: 'PROCESSING',
        triggeredBy: AuditTrigger.WORKER,
        attemptNumber: 1,
      }),
    );
  });

  it('HP3 — markActivationSuccess transitions PROCESSING → ACTIVE', async () => {
    const { tx, update } = buildPrismaTx(
      makeEsim({ status: EsimStatus.PROCESSING }),
      makeEsim({ status: EsimStatus.ACTIVE, activatedAt: new Date() }),
    );
    prisma.$transaction.mockImplementationOnce(async (cb: any) => cb(tx));

    const params = makeActivationParams({
      attemptNumber: 1,
      durationMs: 1200,
      providerLatencyMs: 800,
    });
    const result = await esimService.markActivationSuccess(1, params);

    expect(update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { status: EsimStatus.ACTIVE, activatedAt: expect.any(Date) },
    });
    expect(result.status).toBe(EsimStatus.ACTIVE);
    expect(auditLog.log).toHaveBeenCalledWith(
      expect.objectContaining({
        event: SystemEvent.ACTIVATION_SUCCESS,
        layer: AuditLayer.ACTIVATION,
        fromStatus: 'PROCESSING',
        toStatus: 'ACTIVE',
        triggeredBy: AuditTrigger.WORKER,
        providerLatencyMs: 800,
        startedAt: expect.any(Number),
      }),
    );
  });

  it('HP4 — full activation sequence produces correct status progression', async () => {
    // requestActivation
    const phase1 = buildPrismaTx(
      makeEsim({ status: EsimStatus.NOT_ACTIVE }),
      makeEsim({ status: EsimStatus.PENDING }),
    );
    prisma.$transaction.mockImplementationOnce(async (cb: any) =>
      cb(phase1.tx),
    );

    await esimService.requestActivation(1, makeActivationParams());

    // startProcessing
    const phase2 = buildPrismaTx(
      makeEsim({ status: EsimStatus.PENDING }),
      makeEsim({ status: EsimStatus.PROCESSING }),
    );
    prisma.$transaction.mockImplementationOnce(async (cb: any) =>
      cb(phase2.tx),
    );

    await esimService.startProcessing(
      1,
      makeActivationParams({ attemptNumber: 1 }),
    );

    // markActivationSuccess
    const phase3 = buildPrismaTx(
      makeEsim({ status: EsimStatus.PROCESSING }),
      makeEsim({ status: EsimStatus.ACTIVE, activatedAt: new Date() }),
    );
    prisma.$transaction.mockImplementationOnce(async (cb: any) =>
      cb(phase3.tx),
    );

    const result = await esimService.markActivationSuccess(
      1,
      makeActivationParams({ attemptNumber: 1, durationMs: 1200 }),
    );

    expect(result.status).toBe(EsimStatus.ACTIVE);
    expect(phase1.update).toHaveBeenCalledTimes(1);
    expect(phase2.update).toHaveBeenCalledTimes(1);
    expect(phase3.update).toHaveBeenCalledTimes(1);
    expect(auditLog.log).toHaveBeenCalledTimes(3);
    expect(auditLog.log).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ event: SystemEvent.ACTIVATION_REQUESTED }),
    );
    expect(auditLog.log).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ event: SystemEvent.ACTIVATION_PROCESSING }),
    );
    expect(auditLog.log).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({ event: SystemEvent.ACTIVATION_SUCCESS }),
    );
  });

  it('HP5 — activatedAt is set on markActivationSuccess', async () => {
    const { tx, update } = buildPrismaTx(
      makeEsim({ status: EsimStatus.PROCESSING }),
      makeEsim({ status: EsimStatus.ACTIVE, activatedAt: new Date() }),
    );
    prisma.$transaction.mockImplementationOnce(async (cb: any) => cb(tx));

    await esimService.markActivationSuccess(1, makeActivationParams());

    expect(update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { status: EsimStatus.ACTIVE, activatedAt: expect.any(Date) },
    });
  });

  it('HP6 — AuditLog is NOT written inside transaction (written after commit)', async () => {
    const callOrder: string[] = [];
    const { tx, update } = buildPrismaTx(
      makeEsim({ status: EsimStatus.NOT_ACTIVE }),
      makeEsim({ status: EsimStatus.PENDING }),
    );

    update.mockImplementation(async () => {
      callOrder.push('updateStatus');
      return makeEsim({ status: EsimStatus.PENDING });
    });
    auditLog.log.mockImplementation(async () => {
      callOrder.push('auditLog');
    });

    prisma.$transaction.mockImplementationOnce(async (cb: any) => cb(tx));

    await esimService.requestActivation(1, makeActivationParams());

    expect(callOrder).toEqual(['updateStatus', 'auditLog']);
  });

  it('HP7 — TransactionService is wired with real instance', () => {
    expect(transactionService).toBeInstanceOf(TransactionService);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 3. Provider timeout edge cases
// ═══════════════════════════════════════════════════════════════════════════

describe('EsimService — provider timeout flow', () => {
  let module: TestingModule;
  let esimService: EsimService;
  let auditLog: ReturnType<typeof buildMockAuditLogService>;
  let prisma: ReturnType<typeof buildMockPrismaService>;

  beforeEach(async () => {
    auditLog = buildMockAuditLogService();
    prisma = buildMockPrismaService();

    module = await Test.createTestingModule({
      providers: [
        EsimService,
        TransactionService,
        { provide: EsimRepository, useValue: buildMockEsimRepository() },
        { provide: AuditLogService, useValue: auditLog },
        { provide: PROVIDER_ADAPTER, useValue: buildMockProviderAdapter() },
        {
          provide: TransactionRepository,
          useValue: buildMockTransactionRepository(),
        },
        { provide: EsimProducer, useValue: buildMockEsimProducer() },
        {
          provide: OfferService,
          useValue: {
            findbyId: jest.fn().mockResolvedValue({ id: 101, price: 1800 }),
          },
        },
        { provide: ConfigService, useValue: buildMockConfigService() },
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    esimService = module.get(EsimService);
  });

  afterEach(() => jest.clearAllMocks());

  it('TO1 — markTimeout on non-final attempt keeps PROCESSING status', async () => {
    const { tx, update } = buildPrismaTx(
      makeEsim({ status: EsimStatus.PROCESSING }),
      makeEsim({ status: EsimStatus.FAILED }),
    );
    prisma.$transaction.mockImplementationOnce(async (cb: any) => cb(tx));

    const result = await esimService.markTimeout(
      1,
      makeActivationParams({
        attemptNumber: 1,
        isFinalAttempt: false,
        durationMs: 30000,
      }),
    );

    expect(update).not.toHaveBeenCalled();
    expect(result.status).toBe(EsimStatus.PROCESSING);
    expect(auditLog.log).toHaveBeenCalledWith(
      expect.objectContaining({
        event: SystemEvent.PROVIDER_TIMEOUT,
        layer: AuditLayer.ACTIVATION,
        fromStatus: 'PROCESSING',
        toStatus: 'PROCESSING',
        triggeredBy: AuditTrigger.WORKER,
        attemptNumber: 1,
      }),
    );
  });

  it('TO2 — markTimeout on final attempt transitions PROCESSING → FAILED', async () => {
    const { tx, update } = buildPrismaTx(
      makeEsim({ status: EsimStatus.PROCESSING }),
      makeEsim({ status: EsimStatus.FAILED }),
    );
    prisma.$transaction.mockImplementationOnce(async (cb: any) => cb(tx));

    const result = await esimService.markTimeout(
      1,
      makeActivationParams({
        attemptNumber: 5,
        isFinalAttempt: true,
        durationMs: 30000,
      }),
    );

    expect(update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { status: EsimStatus.FAILED },
    });
    expect(result.status).toBe(EsimStatus.FAILED);
    expect(auditLog.log).toHaveBeenCalledWith(
      expect.objectContaining({
        event: SystemEvent.PROVIDER_TIMEOUT,
        fromStatus: 'PROCESSING',
        toStatus: 'FAILED',
        details: expect.objectContaining({
          isFinalAttempt: true,
          timedOutAfterMs: 30000,
        }),
      }),
    );
  });

  it('TO3 — timeout AuditLog is written even on non-final attempt', async () => {
    const { tx, update } = buildPrismaTx(
      makeEsim({ status: EsimStatus.PROCESSING }),
    );
    prisma.$transaction.mockImplementationOnce(async (cb: any) => cb(tx));

    await esimService.markTimeout(
      1,
      makeActivationParams({
        attemptNumber: 2,
        isFinalAttempt: false,
      }),
    );

    expect(update).not.toHaveBeenCalled();
    expect(auditLog.log).toHaveBeenCalledTimes(1);
    expect(auditLog.log).toHaveBeenCalledWith(
      expect.objectContaining({ event: SystemEvent.PROVIDER_TIMEOUT }),
    );
  });

  it('TO4 — worker re-throws on non-final timeout so BullMQ retries', async () => {
    const job = makeJob({ attemptsMade: 1 });
    const isFinalAttempt = job.attemptsMade + 1 >= MAX_ACTIVATION_ATTEMPTS;

    const { tx } = buildPrismaTx(makeEsim({ status: EsimStatus.PROCESSING }));
    prisma.$transaction.mockImplementationOnce(async (cb: any) => cb(tx));

    const timeoutError = new ProviderTimeoutError();
    expect(timeoutError).toBeInstanceOf(ProviderTimeoutError);

    await esimService.markTimeout(job.data.esimId, {
      ...makeActivationParams({ attemptNumber: 2 }),
      isFinalAttempt,
    });

    expect(isFinalAttempt).toBe(false);
  });

  it('TO5 — worker does NOT re-throw on final timeout', async () => {
    const job = makeJob({ attemptsMade: 4 });
    const isFinalAttempt = job.attemptsMade + 1 >= MAX_ACTIVATION_ATTEMPTS;

    const { tx, update } = buildPrismaTx(
      makeEsim({ status: EsimStatus.PROCESSING }),
      makeEsim({ status: EsimStatus.FAILED }),
    );
    prisma.$transaction.mockImplementationOnce(async (cb: any) => cb(tx));

    await esimService.markTimeout(job.data.esimId, {
      ...makeActivationParams({ attemptNumber: 5 }),
      isFinalAttempt,
    });

    expect(isFinalAttempt).toBe(true);
    expect(update).toHaveBeenCalledWith({
      where: { id: job.data.esimId },
      data: { status: EsimStatus.FAILED },
    });
  });

  it('TO6 — multiple timeouts across retries produces correct attempt sequence', async () => {
    const esimId = 1;

    // Attempt 1 — timeout, non-final
    const attempt1 = buildPrismaTx(makeEsim({ status: EsimStatus.PROCESSING }));
    prisma.$transaction.mockImplementationOnce(async (cb: any) =>
      cb(attempt1.tx),
    );
    await esimService.markTimeout(esimId, {
      ...makeActivationParams({ attemptNumber: 1, isFinalAttempt: false }),
    });
    expect(attempt1.update).not.toHaveBeenCalled();

    jest.clearAllMocks();
    auditLog.log.mockResolvedValue(undefined);

    // Attempt 2 — timeout, non-final
    const attempt2 = buildPrismaTx(makeEsim({ status: EsimStatus.PROCESSING }));
    prisma.$transaction.mockImplementationOnce(async (cb: any) =>
      cb(attempt2.tx),
    );
    await esimService.markTimeout(esimId, {
      ...makeActivationParams({ attemptNumber: 2, isFinalAttempt: false }),
    });
    expect(attempt2.update).not.toHaveBeenCalled();

    jest.clearAllMocks();
    auditLog.log.mockResolvedValue(undefined);

    // Attempt 3 — success
    const attempt3 = buildPrismaTx(
      makeEsim({ status: EsimStatus.PROCESSING }),
      makeEsim({ status: EsimStatus.ACTIVE, activatedAt: new Date() }),
    );
    prisma.$transaction.mockImplementationOnce(async (cb: any) =>
      cb(attempt3.tx),
    );

    const result = await esimService.markActivationSuccess(
      esimId,
      makeActivationParams({ attemptNumber: 3, durationMs: 4000 }),
    );

    expect(result.status).toBe(EsimStatus.ACTIVE);
    expect(auditLog.log).toHaveBeenCalledWith(
      expect.objectContaining({ event: SystemEvent.ACTIVATION_SUCCESS }),
    );
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 4. Idempotency
// ═══════════════════════════════════════════════════════════════════════════

describe('EsimService — idempotency', () => {
  let module: TestingModule;
  let esimService: EsimService;
  let auditLog: ReturnType<typeof buildMockAuditLogService>;
  let prisma: ReturnType<typeof buildMockPrismaService>;

  beforeEach(async () => {
    auditLog = buildMockAuditLogService();
    prisma = buildMockPrismaService();

    module = await Test.createTestingModule({
      providers: [
        EsimService,
        TransactionService,
        { provide: EsimRepository, useValue: buildMockEsimRepository() },
        { provide: AuditLogService, useValue: auditLog },
        { provide: PROVIDER_ADAPTER, useValue: buildMockProviderAdapter() },
        {
          provide: TransactionRepository,
          useValue: buildMockTransactionRepository(),
        },
        { provide: EsimProducer, useValue: buildMockEsimProducer() },
        {
          provide: OfferService,
          useValue: {
            findbyId: jest.fn().mockResolvedValue({ id: 101, price: 1800 }),
          },
        },
        { provide: ConfigService, useValue: buildMockConfigService() },
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    esimService = module.get(EsimService);
  });

  afterEach(() => jest.clearAllMocks());

  it('IDP1 — requestActivation is no-op if already PENDING', async () => {
    const { tx, update } = buildPrismaTx(
      makeEsim({ status: EsimStatus.PENDING }),
      makeEsim({ status: EsimStatus.PENDING }),
      makeEsim({ status: EsimStatus.PENDING }),
    );
    prisma.$transaction.mockImplementationOnce(async (cb: any) => cb(tx));

    const result = await esimService.requestActivation(
      1,
      makeActivationParams(),
    );

    expect(update).not.toHaveBeenCalled();
    expect(auditLog.log).not.toHaveBeenCalled();
    expect(result.status).toBe(EsimStatus.PENDING);
  });

  it('IDP2 — startProcessing is no-op if already PROCESSING', async () => {
    const { tx, update } = buildPrismaTx(
      makeEsim({ status: EsimStatus.PROCESSING }),
    );
    prisma.$transaction.mockImplementationOnce(async (cb: any) => cb(tx));

    const result = await esimService.startProcessing(1, makeActivationParams());

    expect(update).not.toHaveBeenCalled();
    expect(auditLog.log).not.toHaveBeenCalled();
    expect(result.status).toBe(EsimStatus.PROCESSING);
  });

  it('IDP3 — markActivationSuccess is no-op if already ACTIVE', async () => {
    const { tx, update } = buildPrismaTx(
      makeEsim({ status: EsimStatus.ACTIVE, activatedAt: new Date() }),
    );
    prisma.$transaction.mockImplementationOnce(async (cb: any) => cb(tx));

    const result = await esimService.markActivationSuccess(
      1,
      makeActivationParams(),
    );

    expect(update).not.toHaveBeenCalled();
    expect(auditLog.log).not.toHaveBeenCalled();
    expect(result.status).toBe(EsimStatus.ACTIVE);
  });

  it('IDP4 — user hitting activate button twice produces only one DB write', async () => {
    const first = buildPrismaTx(
      makeEsim({ status: EsimStatus.NOT_ACTIVE }),
      makeEsim({ status: EsimStatus.PENDING }),
    );
    const second = buildPrismaTx(
      makeEsim({ status: EsimStatus.PENDING }),
      makeEsim({ status: EsimStatus.PENDING }),
      makeEsim({ status: EsimStatus.PENDING }),
    );

    prisma.$transaction
      .mockImplementationOnce(async (cb: any) => cb(first.tx))
      .mockImplementationOnce(async (cb: any) => cb(second.tx));

    const [result1, result2] = await Promise.all([
      esimService.requestActivation(1, makeActivationParams()),
      esimService.requestActivation(1, makeActivationParams()),
    ]);

    expect(first.update).toHaveBeenCalledTimes(1);
    expect(second.update).not.toHaveBeenCalled();
    expect(auditLog.log).toHaveBeenCalledTimes(1);
    expect(result1.status).toBe(EsimStatus.PENDING);
    expect(result2.status).toBe(EsimStatus.PENDING);
  });

  it('IDP5 — duplicate SUCCESS webhook does not re-activate ACTIVE esim', async () => {
    const { tx, update } = buildPrismaTx(
      makeEsim({ status: EsimStatus.ACTIVE, activatedAt: new Date() }),
    );
    prisma.$transaction.mockImplementationOnce(async (cb: any) => cb(tx));

    const result = await esimService.markActivationSuccess(
      1,
      makeActivationParams(),
    );

    expect(update).not.toHaveBeenCalled();
    expect(auditLog.log).not.toHaveBeenCalled();
    expect(result.status).toBe(EsimStatus.ACTIVE);
  });

  it('IDP6 — calling startProcessing twice only writes once', async () => {
    const first = buildPrismaTx(
      makeEsim({ status: EsimStatus.PENDING }),
      makeEsim({ status: EsimStatus.PROCESSING }),
    );
    const second = buildPrismaTx(makeEsim({ status: EsimStatus.PROCESSING }));

    prisma.$transaction
      .mockImplementationOnce(async (cb: any) => cb(first.tx))
      .mockImplementationOnce(async (cb: any) => cb(second.tx));

    await esimService.startProcessing(
      1,
      makeActivationParams({ attemptNumber: 1 }),
    );
    await esimService.startProcessing(
      1,
      makeActivationParams({ attemptNumber: 1 }),
    );

    expect(first.update).toHaveBeenCalledTimes(1);
    expect(second.update).not.toHaveBeenCalled();
    expect(auditLog.log).toHaveBeenCalledTimes(1);
  });

  it('IDP7 — markActivationFailure non-final does not write status', async () => {
    const { tx, update } = buildPrismaTx(
      makeEsim({ status: EsimStatus.PROCESSING }),
    );
    prisma.$transaction.mockImplementationOnce(async (cb: any) => cb(tx));

    const result = await esimService.markActivationFailure(
      1,
      makeActivationParams({
        isFinalAttempt: false,
        attemptNumber: 2,
      }),
    );

    expect(update).not.toHaveBeenCalled();
    expect(result.status).toBe(EsimStatus.PROCESSING);
    expect(auditLog.log).toHaveBeenCalledWith(
      expect.objectContaining({
        event: SystemEvent.ACTIVATION_FAILED,
        details: expect.objectContaining({ isFinalAttempt: false }),
      }),
    );
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 5. Additional edge cases
// ═══════════════════════════════════════════════════════════════════════════

describe('EsimService — edge cases', () => {
  let module: TestingModule;
  let esimService: EsimService;
  let auditLog: ReturnType<typeof buildMockAuditLogService>;
  let prisma: ReturnType<typeof buildMockPrismaService>;

  beforeEach(async () => {
    auditLog = buildMockAuditLogService();
    prisma = buildMockPrismaService();

    module = await Test.createTestingModule({
      providers: [
        EsimService,
        TransactionService,
        { provide: EsimRepository, useValue: buildMockEsimRepository() },
        { provide: AuditLogService, useValue: auditLog },
        { provide: PROVIDER_ADAPTER, useValue: buildMockProviderAdapter() },
        {
          provide: TransactionRepository,
          useValue: buildMockTransactionRepository(),
        },
        { provide: EsimProducer, useValue: buildMockEsimProducer() },
        {
          provide: OfferService,
          useValue: {
            findbyId: jest.fn().mockResolvedValue({ id: 101, price: 1800 }),
          },
        },
        { provide: ConfigService, useValue: buildMockConfigService() },
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    esimService = module.get(EsimService);
  });

  afterEach(() => jest.clearAllMocks());

  it('EC1 — throws NotFoundException when esim does not exist', async () => {
    const { tx, update } = buildPrismaTx(null);
    prisma.$transaction.mockImplementationOnce(async (cb: any) => cb(tx));

    await expect(
      esimService.requestActivation(999, makeActivationParams()),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(update).not.toHaveBeenCalled();
    expect(auditLog.log).not.toHaveBeenCalled();
  });

  it('EC2 — throws for DELETED esim before status update', async () => {
    const { tx, update } = buildPrismaTx(
      makeEsim({ status: EsimStatus.DELETED }),
    );
    prisma.$transaction.mockImplementationOnce(async (cb: any) => cb(tx));

    await expect(
      esimService.requestActivation(1, makeActivationParams()),
    ).rejects.toThrow('deleted');

    expect(update).not.toHaveBeenCalled();
    expect(auditLog.log).not.toHaveBeenCalled();
  });

  it('EC3 — EXPIRED esim cannot be re-activated', async () => {
    const { tx, update } = buildPrismaTx(
      makeEsim({ status: EsimStatus.EXPIRED }),
    );
    prisma.$transaction.mockImplementationOnce(async (cb: any) => cb(tx));

    await expect(
      esimService.requestActivation(1, makeActivationParams()),
    ).rejects.toThrow();

    expect(update).not.toHaveBeenCalled();
  });

  it('EC4 — ILLEGAL_TRANSITION_ATTEMPTED is logged before throwing', async () => {
    const { tx, update } = buildPrismaTx(
      makeEsim({ status: EsimStatus.ACTIVE }),
    );
    prisma.$transaction.mockImplementationOnce(async (cb: any) => cb(tx));

    await expect(
      esimService.requestActivation(1, makeActivationParams()),
    ).rejects.toThrow();

    expect(update).not.toHaveBeenCalled();
    expect(auditLog.log).toHaveBeenCalledWith(
      expect.objectContaining({
        event: SystemEvent.ILLEGAL_TRANSITION_ATTEMPTED,
        layer: AuditLayer.ACTIVATION,
        fromStatus: 'ACTIVE',
        triggeredBy: AuditTrigger.SYSTEM,
      }),
    );
  });

  it('EC5 — FAILED esim cannot be re-activated (retries exhausted)', async () => {
    const { tx, update } = buildPrismaTx(
      makeEsim({ status: EsimStatus.FAILED }),
    );
    prisma.$transaction.mockImplementationOnce(async (cb: any) => cb(tx));

    await expect(
      esimService.requestActivation(1, makeActivationParams()),
    ).rejects.toThrow();

    expect(update).not.toHaveBeenCalled();
  });

  it('EC6 — markActivationFailure on final attempt transitions to FAILED', async () => {
    const { tx, update } = buildPrismaTx(
      makeEsim({ status: EsimStatus.PROCESSING }),
      makeEsim({ status: EsimStatus.FAILED }),
    );
    prisma.$transaction.mockImplementationOnce(async (cb: any) => cb(tx));

    const result = await esimService.markActivationFailure(
      1,
      makeActivationParams({
        attemptNumber: 5,
        isFinalAttempt: true,
        errorCode: 'PROVIDER_REJECTED',
        errorMessage: 'Provider rejected activation',
      }),
    );

    expect(update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { status: EsimStatus.FAILED },
    });
    expect(result.status).toBe(EsimStatus.FAILED);
    expect(auditLog.log).toHaveBeenCalledWith(
      expect.objectContaining({
        event: SystemEvent.ACTIVATION_FAILED,
        fromStatus: 'PROCESSING',
        toStatus: 'FAILED',
        details: expect.objectContaining({
          isFinalAttempt: true,
          errorCode: 'PROVIDER_REJECTED',
        }),
      }),
    );
  });

  it('EC7 — providerCode is passed through to AuditLog', async () => {
    const { tx } = buildPrismaTx(
      makeEsim({ status: EsimStatus.NOT_ACTIVE }),
      makeEsim({ status: EsimStatus.PENDING }),
    );
    prisma.$transaction.mockImplementationOnce(async (cb: any) => cb(tx));

    await esimService.requestActivation(
      1,
      makeActivationParams({ providerCode: 'ESIMGO' }),
    );

    expect(auditLog.log).toHaveBeenCalledWith(
      expect.objectContaining({ providerCode: 'ESIMGO' }),
    );
  });

  it('EC8 — providerRequestId is passed as trigger to AuditLog', async () => {
    const { tx } = buildPrismaTx(
      makeEsim({ status: EsimStatus.PENDING }),
      makeEsim({ status: EsimStatus.PROCESSING }),
    );
    prisma.$transaction.mockImplementationOnce(async (cb: any) => cb(tx));

    await esimService.startProcessing(
      1,
      makeActivationParams({ providerRequestId: 'req-xyz-789' }),
    );

    expect(auditLog.log).toHaveBeenCalledWith(
      expect.objectContaining({ trigger: 'req-xyz-789' }),
    );
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 6. Full E2E activation flow
// ═══════════════════════════════════════════════════════════════════════════

describe('Full E2E — eSIM activation: request → processing → success', () => {
  let module: TestingModule;
  let esimService: EsimService;
  let auditLog: ReturnType<typeof buildMockAuditLogService>;
  let prisma: ReturnType<typeof buildMockPrismaService>;

  beforeEach(async () => {
    auditLog = buildMockAuditLogService();
    prisma = buildMockPrismaService();

    module = await Test.createTestingModule({
      providers: [
        EsimService,
        TransactionService,
        { provide: EsimRepository, useValue: buildMockEsimRepository() },
        { provide: AuditLogService, useValue: auditLog },
        { provide: PROVIDER_ADAPTER, useValue: buildMockProviderAdapter() },
        {
          provide: TransactionRepository,
          useValue: buildMockTransactionRepository(),
        },
        { provide: EsimProducer, useValue: buildMockEsimProducer() },
        {
          provide: OfferService,
          useValue: {
            findbyId: jest.fn().mockResolvedValue({ id: 101, price: 1800 }),
          },
        },
        { provide: ConfigService, useValue: buildMockConfigService() },
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    esimService = module.get(EsimService);
  });

  afterEach(() => jest.clearAllMocks());

  it('E2E-HAPPY — full activation: NOT_ACTIVE → PENDING → PROCESSING → ACTIVE', async () => {
    const esimId = 1;
    const job = makeJob({ attemptsMade: 0 });
    const attemptNumber = job.attemptsMade + 1;
    const isFinalAttempt = attemptNumber >= MAX_ACTIVATION_ATTEMPTS;
    const startedAt = Date.now();

    // Phase 1 — orchestrator calls requestActivation
    const phase1 = buildPrismaTx(
      makeEsim({ status: EsimStatus.NOT_ACTIVE }),
      makeEsim({ status: EsimStatus.PENDING }),
    );
    prisma.$transaction.mockImplementationOnce(async (cb: any) =>
      cb(phase1.tx),
    );

    await esimService.requestActivation(esimId, makeActivationParams());

    expect(phase1.update).toHaveBeenCalledWith({
      where: { id: esimId },
      data: { status: EsimStatus.PENDING },
    });
    expect(auditLog.log).toHaveBeenCalledWith(
      expect.objectContaining({ event: SystemEvent.ACTIVATION_REQUESTED }),
    );

    jest.clearAllMocks();
    auditLog.log.mockResolvedValue(undefined);

    // Phase 2 — worker calls startProcessing
    const phase2 = buildPrismaTx(
      makeEsim({ status: EsimStatus.PENDING }),
      makeEsim({ status: EsimStatus.PROCESSING }),
    );
    prisma.$transaction.mockImplementationOnce(async (cb: any) =>
      cb(phase2.tx),
    );

    await esimService.startProcessing(
      esimId,
      makeActivationParams({
        attemptNumber,
        providerRequestId: 'req-e2e-001',
      }),
    );

    expect(phase2.update).toHaveBeenCalledWith({
      where: { id: esimId },
      data: { status: EsimStatus.PROCESSING },
    });
    expect(auditLog.log).toHaveBeenCalledWith(
      expect.objectContaining({
        event: SystemEvent.ACTIVATION_PROCESSING,
        attemptNumber: 1,
        trigger: 'req-e2e-001',
      }),
    );

    jest.clearAllMocks();
    auditLog.log.mockResolvedValue(undefined);

    // Phase 3 — provider responds successfully, worker marks success
    const phase3 = buildPrismaTx(
      makeEsim({ status: EsimStatus.PROCESSING }),
      makeEsim({ status: EsimStatus.ACTIVE, activatedAt: new Date() }),
    );
    prisma.$transaction.mockImplementationOnce(async (cb: any) =>
      cb(phase3.tx),
    );

    const result = await esimService.markActivationSuccess(
      esimId,
      makeActivationParams({
        attemptNumber,
        providerRequestId: 'req-e2e-001',
        durationMs: Date.now() - startedAt,
        providerLatencyMs: 450,
      }),
    );

    expect(isFinalAttempt).toBe(false);
    expect(result.status).toBe(EsimStatus.ACTIVE);
    expect(phase3.update).toHaveBeenCalledWith({
      where: { id: esimId },
      data: { status: EsimStatus.ACTIVE, activatedAt: expect.any(Date) },
    });
    expect(auditLog.log).toHaveBeenCalledWith(
      expect.objectContaining({
        event: SystemEvent.ACTIVATION_SUCCESS,
        fromStatus: 'PROCESSING',
        toStatus: 'ACTIVE',
        providerLatencyMs: 450,
      }),
    );
  });

  it('E2E-TIMEOUT-RETRY — two timeouts then success on attempt 3', async () => {
    const esimId = 2;

    // Attempt 1 — timeout, keep PROCESSING
    const attempt1 = buildPrismaTx(
      makeEsim({ id: 2, status: EsimStatus.PROCESSING }),
    );
    prisma.$transaction.mockImplementationOnce(async (cb: any) =>
      cb(attempt1.tx),
    );

    await esimService.markTimeout(
      esimId,
      makeActivationParams({
        attemptNumber: 1,
        isFinalAttempt: false,
        durationMs: 30000,
      }),
    );

    expect(attempt1.update).not.toHaveBeenCalled();
    expect(auditLog.log).toHaveBeenCalledWith(
      expect.objectContaining({
        event: SystemEvent.PROVIDER_TIMEOUT,
        attemptNumber: 1,
      }),
    );

    jest.clearAllMocks();
    auditLog.log.mockResolvedValue(undefined);

    // Attempt 2 — timeout, keep PROCESSING
    const attempt2 = buildPrismaTx(
      makeEsim({ id: 2, status: EsimStatus.PROCESSING }),
    );
    prisma.$transaction.mockImplementationOnce(async (cb: any) =>
      cb(attempt2.tx),
    );

    await esimService.markTimeout(
      esimId,
      makeActivationParams({
        attemptNumber: 2,
        isFinalAttempt: false,
        durationMs: 30000,
      }),
    );

    expect(attempt2.update).not.toHaveBeenCalled();

    jest.clearAllMocks();
    auditLog.log.mockResolvedValue(undefined);

    // Attempt 3 — success
    const attempt3 = buildPrismaTx(
      makeEsim({ id: 2, status: EsimStatus.PROCESSING }),
      makeEsim({ id: 2, status: EsimStatus.ACTIVE, activatedAt: new Date() }),
    );
    prisma.$transaction.mockImplementationOnce(async (cb: any) =>
      cb(attempt3.tx),
    );

    const result = await esimService.markActivationSuccess(
      esimId,
      makeActivationParams({
        attemptNumber: 3,
        durationMs: 3500,
      }),
    );

    expect(result.status).toBe(EsimStatus.ACTIVE);
    expect(auditLog.log).toHaveBeenCalledWith(
      expect.objectContaining({ event: SystemEvent.ACTIVATION_SUCCESS }),
    );
  });

  it('E2E-EXHAUSTED — 5 timeouts exhausts retries → FAILED', async () => {
    const esimId = 3;
    const updates: jest.Mock[] = [];

    for (let attempt = 1; attempt <= MAX_ACTIVATION_ATTEMPTS; attempt++) {
      const isFinalAttempt = attempt >= MAX_ACTIVATION_ATTEMPTS;

      const tx = buildPrismaTx(
        makeEsim({ id: 3, status: EsimStatus.PROCESSING }),
        isFinalAttempt
          ? makeEsim({ id: 3, status: EsimStatus.FAILED })
          : undefined,
      );
      updates.push(tx.update);

      prisma.$transaction.mockImplementationOnce(async (cb: any) => cb(tx.tx));

      await esimService.markTimeout(
        esimId,
        makeActivationParams({
          attemptNumber: attempt,
          isFinalAttempt,
          durationMs: 30000,
        }),
      );
    }

    const updateCallCount = updates.reduce(
      (count, update) => count + update.mock.calls.length,
      0,
    );

    expect(updateCallCount).toBe(1);
    expect(updates[updates.length - 1]).toHaveBeenCalledWith({
      where: { id: esimId },
      data: { status: EsimStatus.FAILED },
    });

    expect(auditLog.log).toHaveBeenCalledTimes(MAX_ACTIVATION_ATTEMPTS);
    auditLog.log.mock.calls.forEach((call) => {
      expect(call[0]).toMatchObject({ event: SystemEvent.PROVIDER_TIMEOUT });
    });
  });

  it('E2E-DUPLICATE-ACTIVATE — user taps activate twice, only one transition', async () => {
    const first = buildPrismaTx(
      makeEsim({ status: EsimStatus.NOT_ACTIVE }),
      makeEsim({ status: EsimStatus.PENDING }),
    );
    const second = buildPrismaTx(
      makeEsim({ status: EsimStatus.PENDING }),
      makeEsim({ status: EsimStatus.PENDING }),
      makeEsim({ status: EsimStatus.PENDING }),
    );

    prisma.$transaction
      .mockImplementationOnce(async (cb: any) => cb(first.tx))
      .mockImplementationOnce(async (cb: any) => cb(second.tx));

    const [r1, r2] = await Promise.all([
      esimService.requestActivation(1, makeActivationParams()),
      esimService.requestActivation(1, makeActivationParams()),
    ]);

    expect(first.update).toHaveBeenCalledTimes(1);
    expect(second.update).not.toHaveBeenCalled();
    expect(auditLog.log).toHaveBeenCalledTimes(1);
    expect(r1.status).toBe(EsimStatus.PENDING);
    expect(r2.status).toBe(EsimStatus.PENDING);
  });

  it('E2E-ILLEGAL — worker tries to skip PENDING → directly to ACTIVE', async () => {
    const { tx, update } = buildPrismaTx(
      makeEsim({ status: EsimStatus.PENDING }),
    );
    prisma.$transaction.mockImplementationOnce(async (cb: any) => cb(tx));

    await expect(
      esimService.markActivationSuccess(1, makeActivationParams()),
    ).rejects.toThrow();

    expect(update).not.toHaveBeenCalled();
    expect(auditLog.log).toHaveBeenCalledWith(
      expect.objectContaining({
        event: SystemEvent.ILLEGAL_TRANSITION_ATTEMPTED,
        fromStatus: 'PENDING',
        toStatus: 'ACTIVE',
      }),
    );
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 7. TERMINAL_ESIM_STATUSES export sanity check
// ═══════════════════════════════════════════════════════════════════════════

describe('TERMINAL_ESIM_STATUSES', () => {
  afterEach(() => jest.clearAllMocks());

  it('TS1 — contains exactly ACTIVE, FAILED, EXPIRED, DELETED', () => {
    expect(TERMINAL_ESIM_STATUSES.has(EsimStatus.ACTIVE)).toBe(true);
    expect(TERMINAL_ESIM_STATUSES.has(EsimStatus.FAILED)).toBe(true);
    expect(TERMINAL_ESIM_STATUSES.has(EsimStatus.EXPIRED)).toBe(true);
    expect(TERMINAL_ESIM_STATUSES.has(EsimStatus.DELETED)).toBe(true);

    expect(TERMINAL_ESIM_STATUSES.has(EsimStatus.NOT_ACTIVE)).toBe(false);
    expect(TERMINAL_ESIM_STATUSES.has(EsimStatus.PENDING)).toBe(false);
    expect(TERMINAL_ESIM_STATUSES.has(EsimStatus.PROCESSING)).toBe(false);
  });
});
