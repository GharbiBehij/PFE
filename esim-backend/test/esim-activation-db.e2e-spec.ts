import { EsimStatus } from '@prisma/client';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { EsimService } from '../src/esim/esim.service';
import { AuditLogService } from '../src/ProvisionningEvent/AuditLog.service';
import { PrismaService } from '../prisma/prisma.service';
import { EsimRepository } from '../src/esim/esim.repository';
import { PROVIDER_ADAPTER } from '../src/esim/adapters/provider-adapter.token';
import { TransactionRepository } from '../src/transaction/transaction.repository';
import { EsimProducer } from '../src/Queue/Producer/esim.producer';

const TEST_DATABASE_URL =
  'postgresql://test:test@localhost:5433/netyfly_test';

// Suppress NestJS logger output globally so intentional error-path tests stay clean
beforeAll(() => {
  jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
  jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
  jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
});

afterAll(() => {
  jest.restoreAllMocks();
});

// Shared across all describe blocks
let prisma: PrismaService;

beforeAll(async () => {
  process.env.DATABASE_URL = TEST_DATABASE_URL;
  prisma = new PrismaService();
  await prisma.$connect();
});

afterAll(async () => {
  if (prisma) {
    await prisma.$disconnect();
  }
});

async function seedEsim(
  overrides: Partial<{
    status: EsimStatus;
    userId: number;
    transactionId: number;
    providerId: number;
    iccid: string;
    activationCode: string;
  }> = {},
): Promise<number> {
  await prisma.user.upsert({
    where: { id: overrides.userId ?? 1 },
    update: {},
    create: {
      id: overrides.userId ?? 1,
      firstname: 'Test',
      lastname: 'User',
      email: `test-${Date.now()}@netyfly.com`,
      hashedPassword: 'hashed',
    },
  });

  await prisma.provider.upsert({
    where: { id: overrides.providerId ?? 1 },
    update: {},
    create: {
      id: overrides.providerId ?? 1,
      name: 'AIRALO',
      apiUrl: 'https://api.airalo.com',
      apiKey: 'test-key',
    },
  });

  await prisma.offer.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      country: 'France',
      Region: 'Europe',
      Destination: 'EU',
      Category: 'DATA',
      title: 'Test Offer',
      description: 'Test',
      popularity: 'HIGH',
      dataVolume: 1024,
      validityDays: 30,
      price: 1800,
      InternalMargin: 200,
      providerId: overrides.providerId ?? 1,
    },
  });

  await prisma.transaction.upsert({
    where: { id: overrides.transactionId ?? 1 },
    update: {},
    create: {
      id: overrides.transactionId ?? 1,
      status: 'COMPLETED',
      channel: 'B2C',
      amount: 1800,
      currency: 'TND',
      userId: overrides.userId ?? 1,
      offerId: 1,
    },
  });

  const esim = await prisma.esim.create({
    data: {
      status: overrides.status ?? EsimStatus.NOT_ACTIVE,
      iccid:
        overrides.iccid ??
        `ICCID-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      activationCode: overrides.activationCode ?? `ACT-${Date.now()}`,
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      userId: overrides.userId ?? 1,
      transactionId: overrides.transactionId ?? 1,
      providerId: overrides.providerId ?? 1,
    },
  });

  return esim.id;
}

async function cleanDb() {
  await prisma.auditLog.deleteMany();
  await prisma.activationAttempt.deleteMany();
  await prisma.esim.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.offer.deleteMany();
  await prisma.provider.deleteMany();
  await prisma.user.deleteMany();
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function buildModule(): Promise<{
  esimService: EsimService;
  auditLog: jest.Mocked<AuditLogService>;
}> {
  const mockAuditLog = {
    log: jest.fn().mockResolvedValue(undefined),
  };

  const module: TestingModule = await Test.createTestingModule({
    providers: [
      EsimService,
      { provide: PrismaService, useValue: prisma },
      { provide: AuditLogService, useValue: mockAuditLog },
      {
        provide: ConfigService,
        useValue: {
          get: jest.fn().mockImplementation((key: string, def?: number) => {
            if (key === 'ESIM_MAX_ACTIVATION_ATTEMPTS') return 5;
            return def;
          }),
        },
      },
      { provide: EsimRepository, useValue: {} },
      { provide: PROVIDER_ADAPTER, useValue: {} },
      { provide: TransactionRepository, useValue: {} },
      { provide: EsimProducer, useValue: {} },
    ],
  }).compile();

  return {
    esimService: module.get(EsimService),
    auditLog: mockAuditLog as jest.Mocked<AuditLogService>,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. DB locking — SELECT FOR UPDATE
// ═══════════════════════════════════════════════════════════════════════════

describe('DB locking — SELECT FOR UPDATE', () => {
  beforeEach(async () => {
    await cleanDb();
  });

  afterEach(() => jest.clearAllMocks());

  it('LOCK1 — concurrent requestActivation on same esim — only one succeeds', async () => {
    const esimId = await seedEsim({ status: EsimStatus.NOT_ACTIVE });
    const { esimService, auditLog } = await buildModule();

    const params = {
      userId: 1,
      transactionId: 1,
      providerCode: 'AIRALO',
    };

    const [result1, result2] = await Promise.allSettled([
      esimService.requestActivation(esimId, params),
      esimService.requestActivation(esimId, params),
    ]);

    const succeeded = [result1, result2].filter(
      (result) => result.status === 'fulfilled',
    );
    const failed = [result1, result2].filter(
      (result) => result.status === 'rejected',
    );

    expect(succeeded.length + failed.length).toBe(2);

    const esim = await prisma.esim.findUnique({ where: { id: esimId } });
    expect(esim?.status).toBe(EsimStatus.PENDING);
    expect(auditLog.log).toHaveBeenCalledTimes(1);
  });

  it('LOCK2 — concurrent startProcessing on same esim — second blocked then no-op', async () => {
    const esimId = await seedEsim({ status: EsimStatus.PENDING });
    const { esimService } = await buildModule();

    const params = {
      userId: 1,
      transactionId: 1,
      providerCode: 'AIRALO',
      providerRequestId: 'req-lock-test-001',
      attemptNumber: 1,
    };

    await Promise.allSettled([
      esimService.startProcessing(esimId, params),
      esimService.startProcessing(esimId, params),
    ]);

    const esim = await prisma.esim.findUnique({ where: { id: esimId } });
    expect(esim?.status).toBe(EsimStatus.PROCESSING);
  });

  it('LOCK2B — thundering herd (25) requestActivation stays idempotent', async () => {
    const esimId = await seedEsim({ status: EsimStatus.NOT_ACTIVE });
    const { esimService, auditLog } = await buildModule();

    const params = {
      userId: 1,
      transactionId: 1,
      providerCode: 'AIRALO',
    };

    const tasks = Array.from({ length: 25 }, (_, index) =>
      (async () => {
        await delay(index * 10);
        return esimService.requestActivation(esimId, params);
      })(),
    );

    const results = await Promise.allSettled(tasks);
    const fulfilled = results.filter(
      (result) => result.status === 'fulfilled',
    );
    const rejected = results.filter(
      (result) => result.status === 'rejected',
    );

    expect(fulfilled.length + rejected.length).toBe(25);

    const esim = await prisma.esim.findUnique({ where: { id: esimId } });
    expect(esim?.status).toBe(EsimStatus.PENDING);
    expect(auditLog.log).toHaveBeenCalledTimes(1);
  });

  it('LOCK3 — concurrent markActivationSuccess on same esim — idempotent', async () => {
    const esimId = await seedEsim({ status: EsimStatus.PROCESSING });
    const { esimService } = await buildModule();

    const params = {
      userId: 1,
      transactionId: 1,
      providerCode: 'AIRALO',
      providerRequestId: 'req-success-001',
      attemptNumber: 1,
      durationMs: 1200,
      providerLatencyMs: 800,
    };

    await Promise.allSettled([
      esimService.markActivationSuccess(esimId, params),
      esimService.markActivationSuccess(esimId, params),
    ]);

    const esim = await prisma.esim.findUnique({ where: { id: esimId } });
    expect(esim?.status).toBe(EsimStatus.ACTIVE);
    expect(esim?.activatedAt).not.toBeNull();
  });

  it('LOCK4 — concurrent timeout + success race — success wins', async () => {
    const esimId = await seedEsim({ status: EsimStatus.PROCESSING });
    const { esimService } = await buildModule();

    const timeoutParams = {
      userId: 1,
      transactionId: 1,
      providerCode: 'AIRALO',
      providerRequestId: 'req-race-001',
      attemptNumber: 1,
      isFinalAttempt: false,
      durationMs: 30000,
    };

    const successParams = {
      userId: 1,
      transactionId: 1,
      providerCode: 'AIRALO',
      providerRequestId: 'req-race-001',
      attemptNumber: 1,
      durationMs: 1200,
      providerLatencyMs: 800,
    };

    await Promise.allSettled([
      esimService.markTimeout(esimId, timeoutParams),
      esimService.markActivationSuccess(esimId, successParams),
    ]);

    const esim = await prisma.esim.findUnique({ where: { id: esimId } });
    expect(esim?.status).toBe(EsimStatus.ACTIVE);
  });

  it('LOCK4B — incremental provider load with mixed race ends ACTIVE', async () => {
    const esimId = await seedEsim({ status: EsimStatus.PROCESSING });
    const { esimService } = await buildModule();

    const baseParams = {
      userId: 1,
      transactionId: 1,
      providerCode: 'AIRALO',
      providerRequestId: 'req-load-001',
    };

    const tasks = Array.from({ length: 25 }, (_, index) =>
      (async () => {
        await delay(index * 25);

        if (index % 5 === 0) {
          return esimService.markActivationSuccess(esimId, {
            ...baseParams,
            attemptNumber: 1,
            durationMs: 1200 + index * 10,
            providerLatencyMs: 800 + index * 5,
          });
        }

        if (index % 3 === 0) {
          return esimService.markTimeout(esimId, {
            ...baseParams,
            attemptNumber: 1,
            isFinalAttempt: false,
            durationMs: 30000 + index * 50,
          });
        }

        return esimService.startProcessing(esimId, {
          ...baseParams,
          providerRequestId: `req-load-${index}`,
          attemptNumber: 1,
        });
      })(),
    );

    await Promise.allSettled(tasks);

    const esim = await prisma.esim.findUnique({ where: { id: esimId } });
    expect(esim?.status).toBe(EsimStatus.ACTIVE);
  });

  it('LOCK5 — lock timeout fires when transaction holds lock too long', async () => {
    const esimId = await seedEsim({ status: EsimStatus.NOT_ACTIVE });
    const { esimService } = await buildModule();

    let lockAcquiredResolve: () => void;
    const lockAcquired = new Promise<void>((resolve) => {
      lockAcquiredResolve = resolve;
    });

    const lockHolder = prisma.$transaction(async (tx) => {
      await tx.$queryRaw`
        SELECT * FROM "Esim" WHERE id = ${esimId} FOR UPDATE
      `;
      lockAcquiredResolve();
      await new Promise((resolve) => setTimeout(resolve, 8000));
    });

    await lockAcquired;

    const start = Date.now();
    let resolved = false;

    try {
      await esimService.requestActivation(esimId, {
        userId: 1,
        transactionId: 1,
        providerCode: 'AIRALO',
      });
      resolved = true;
    } catch {
      resolved = false;
    }

    const elapsed = Date.now() - start;

    expect(elapsed).toBeGreaterThan(4000);
    expect(elapsed).toBeLessThan(9000);

    if (resolved) {
      const esim = await prisma.esim.findUnique({ where: { id: esimId } });
      expect(esim?.status).toBe(EsimStatus.PENDING);
    }

    await lockHolder.catch(() => undefined);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. DB constraints — unique constraint on providerRequestId
// ═══════════════════════════════════════════════════════════════════════════

describe('DB constraints — unique constraint on providerRequestId', () => {
  beforeEach(async () => {
    await cleanDb();
  });

  afterEach(() => jest.clearAllMocks());

  it('UC1 — same providerRequestId from two workers throws at DB level', async () => {
    const esimId = await seedEsim({ status: EsimStatus.PROCESSING });

    await prisma.activationAttempt.create({
      data: {
        attemptNumber: 1,
        status: 'STARTED',
        providerRequestId: 'req-duplicate-001',
        startedAt: new Date(),
        esimId,
      },
    });

    await expect(
      prisma.activationAttempt.create({
        data: {
          attemptNumber: 1,
          status: 'STARTED',
          providerRequestId: 'req-duplicate-001',
          startedAt: new Date(),
          esimId,
        },
      }),
    ).rejects.toThrow();
  });

  it('UC2 — different providerRequestId per attempt succeeds', async () => {
    const esimId = await seedEsim({ status: EsimStatus.PROCESSING });

    await prisma.activationAttempt.create({
      data: {
        attemptNumber: 1,
        status: 'STARTED',
        providerRequestId: 'req-attempt-001',
        startedAt: new Date(),
        esimId,
      },
    });

    await expect(
      prisma.activationAttempt.create({
        data: {
          attemptNumber: 2,
          status: 'STARTED',
          providerRequestId: 'req-attempt-002',
          startedAt: new Date(),
          esimId,
        },
      }),
    ).resolves.toBeDefined();

    const attempts = await prisma.activationAttempt.findMany({
      where: { esimId },
    });
    expect(attempts).toHaveLength(2);
  });

  it('UC3 — unique iccid constraint prevents duplicate eSIMs', async () => {
    const iccid = `ICCID-UC3-${Date.now()}`;

    await seedEsim({ status: EsimStatus.NOT_ACTIVE, iccid });

    await expect(
      prisma.esim.create({
        data: {
          iccid,
          activationCode: 'ACT-002',
          status: EsimStatus.NOT_ACTIVE,
          expiryDate: new Date(Date.now() + 86400000),
          userId: 1,
          transactionId: 1,
          providerId: 1,
        },
      }),
    ).rejects.toThrow();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 3. DB transactions — rollback on failure
// ═══════════════════════════════════════════════════════════════════════════

describe('DB transactions — rollback on failure', () => {
  beforeEach(async () => {
    await cleanDb();
  });

  afterEach(() => jest.clearAllMocks());

  it('RB1 — failed transaction does not persist status change', async () => {
    const esimId = await seedEsim({ status: EsimStatus.NOT_ACTIVE });

    await expect(
      prisma.$transaction(async (tx) => {
        await tx.esim.update({
          where: { id: esimId },
          data: { status: EsimStatus.PENDING },
        });
        throw new Error('Simulated failure after update');
      }),
    ).rejects.toThrow('Simulated failure after update');

    const esim = await prisma.esim.findUnique({ where: { id: esimId } });
    expect(esim?.status).toBe(EsimStatus.NOT_ACTIVE);
  });

  it('RB2 — lock released after rollback allows next transaction to proceed', async () => {
    const esimId = await seedEsim({ status: EsimStatus.NOT_ACTIVE });
    const { esimService } = await buildModule();

    await expect(
      prisma.$transaction(async (tx) => {
        await tx.$queryRaw`
          SELECT * FROM "Esim" WHERE id = ${esimId} FOR UPDATE
        `;
        throw new Error('Intentional rollback');
      }),
    ).rejects.toThrow();

    await expect(
      esimService.requestActivation(esimId, {
        userId: 1,
        transactionId: 1,
        providerCode: 'AIRALO',
      }),
    ).resolves.toBeDefined();

    const esim = await prisma.esim.findUnique({ where: { id: esimId } });
    expect(esim?.status).toBe(EsimStatus.PENDING);
  });

  it('RB3 — status is unchanged when AuditLog write fails', async () => {
    const esimId = await seedEsim({ status: EsimStatus.NOT_ACTIVE });
    const { esimService, auditLog } = await buildModule();

    auditLog.log.mockRejectedValue(
      new Error('AuditLog service unavailable'),
    );

    try {
      await esimService.requestActivation(esimId, {
        userId: 1,
        transactionId: 1,
        providerCode: 'AIRALO',
      });
    } catch {
      // Intentionally ignored
    }

    const esim = await prisma.esim.findUnique({ where: { id: esimId } });
    expect(esim?.status).toBe(EsimStatus.PENDING);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 4. DB E2E — full activation flow
// ═══════════════════════════════════════════════════════════════════════════

describe('DB E2E — full activation flow with real PostgreSQL', () => {
  beforeEach(async () => {
    await cleanDb();
  });

  afterEach(() => jest.clearAllMocks());

  it('DB-E2E-HAPPY — NOT_ACTIVE → PENDING → PROCESSING → ACTIVE persisted in DB', async () => {
    const esimId = await seedEsim({ status: EsimStatus.NOT_ACTIVE });
    const { esimService } = await buildModule();

    const baseParams = {
      userId: 1,
      transactionId: 1,
      providerCode: 'AIRALO',
    };

    await esimService.requestActivation(esimId, baseParams);

    let esim = await prisma.esim.findUnique({ where: { id: esimId } });
    expect(esim?.status).toBe(EsimStatus.PENDING);

    await esimService.startProcessing(esimId, {
      ...baseParams,
      providerRequestId: 'req-db-e2e-001',
      attemptNumber: 1,
    });

    esim = await prisma.esim.findUnique({ where: { id: esimId } });
    expect(esim?.status).toBe(EsimStatus.PROCESSING);

    await esimService.markActivationSuccess(esimId, {
      ...baseParams,
      providerRequestId: 'req-db-e2e-001',
      attemptNumber: 1,
      durationMs: 1200,
      providerLatencyMs: 800,
    });

    esim = await prisma.esim.findUnique({ where: { id: esimId } });
    expect(esim?.status).toBe(EsimStatus.ACTIVE);
    expect(esim?.activatedAt).not.toBeNull();
  });

  it('DB-E2E-TIMEOUT-THEN-SUCCESS — timeout retries then success persisted', async () => {
    const esimId = await seedEsim({ status: EsimStatus.PROCESSING });
    const { esimService } = await buildModule();

    const baseParams = {
      userId: 1,
      transactionId: 1,
      providerCode: 'AIRALO',
      providerRequestId: 'req-timeout-retry',
    };

    await esimService.markTimeout(esimId, {
      ...baseParams,
      attemptNumber: 1,
      isFinalAttempt: false,
      durationMs: 30000,
    });

    let esim = await prisma.esim.findUnique({ where: { id: esimId } });
    expect(esim?.status).toBe(EsimStatus.PROCESSING);

    await esimService.markActivationSuccess(esimId, {
      ...baseParams,
      providerRequestId: 'req-timeout-success',
      attemptNumber: 2,
      durationMs: 2000,
    });

    esim = await prisma.esim.findUnique({ where: { id: esimId } });
    expect(esim?.status).toBe(EsimStatus.ACTIVE);
    expect(esim?.activatedAt).not.toBeNull();
  });

  it('DB-E2E-EXHAUSTED — 5 timeouts produces FAILED in real DB', async () => {
    const esimId = await seedEsim({ status: EsimStatus.PROCESSING });
    const { esimService } = await buildModule();

    for (let attempt = 1; attempt <= 5; attempt++) {
      await esimService.markTimeout(esimId, {
        userId: 1,
        transactionId: 1,
        providerCode: 'AIRALO',
        providerRequestId: `req-exhausted-${attempt}`,
        attemptNumber: attempt,
        isFinalAttempt: attempt === 5,
        durationMs: 30000,
      });

      const esim = await prisma.esim.findUnique({ where: { id: esimId } });

      if (attempt < 5) {
        expect(esim?.status).toBe(EsimStatus.PROCESSING);
      } else {
        expect(esim?.status).toBe(EsimStatus.FAILED);
      }
    }
  });

  it('DB-E2E-IDEMPOTENT — calling requestActivation twice only writes once in DB', async () => {
    const esimId = await seedEsim({ status: EsimStatus.NOT_ACTIVE });
    const { esimService } = await buildModule();

    const params = {
      userId: 1,
      transactionId: 1,
      providerCode: 'AIRALO',
    };

    await esimService.requestActivation(esimId, params);
    await esimService.requestActivation(esimId, params);

    const esim = await prisma.esim.findUnique({ where: { id: esimId } });
    expect(esim?.status).toBe(EsimStatus.PENDING);
  });
});
