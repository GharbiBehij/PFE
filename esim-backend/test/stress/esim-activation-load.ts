import { performance } from 'perf_hooks';
import { EsimStatus, TransactionChannel, TransactionStatus } from '@prisma/client';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EsimService } from '../../src/esim/esim.service';
import { AuditLogService } from '../../src/ProvisionningEvent/AuditLog.service';
import { PrismaService } from '../../prisma/prisma.service';
import { EsimRepository } from '../../src/esim/esim.repository';
import { PROVIDER_ADAPTER } from '../../src/esim/adapters/provider-adapter.token';
import { TransactionRepository } from '../../src/transaction/transaction.repository';
import { EsimProducer } from '../../src/Queue/Producer/esim.producer';

const MAX_CONCURRENCY = 5000;
const CONCURRENCY_PROFILE = [25, 100, 250, 500, 1000,2000,3000,1500, 500, 250, 100, 25];
const SYSTEM_DELAY_STEP_MS = 2;
const PROVIDER_DELAY_STEP_MS = 5;
const TEST_DATABASE_URL =
  'postgresql://test:test@localhost:5433/netyfly_test';

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

type StepMetrics = {
  level: number;
  index: number;
  systemDelayMs: number;
  providerDelayMs: number;
  dbPingMs: number;
  requestMs: number;
  processingMs: number;
  successMs: number;
  totalMs: number;
  ok: boolean;
  error?: string;
};

function summarize(values: number[]) {
  if (values.length === 0) {
    return { avg: 0, p50: 0, p95: 0, max: 0 };
  }

  const sorted = [...values].sort((a, b) => a - b);
  const sum = values.reduce((acc, v) => acc + v, 0);
  const pick = (p: number) =>
    sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))];

  return {
    avg: Math.round((sum / values.length) * 100) / 100,
    p50: pick(0.5),
    p95: pick(0.95),
    max: sorted[sorted.length - 1],
  };
}

async function ensureSafeTarget() {
  const dbUrl = process.env.DATABASE_URL ?? '';
  const allow =
    dbUrl.includes('localhost') || dbUrl.includes('netyfly_test');
  const forced = process.env.FORCE_STRESS === '1';

  if (!allow && !forced) {
    throw new Error(
      'Refusing to run stress test against non-test DB. Set FORCE_STRESS=1 to override.',
    );
  }
}

async function seedBase(prisma: PrismaService) {
  await prisma.user.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      firstname: 'Stress',
      lastname: 'Test',
      email: `stress-${Date.now()}@netyfly.com`,
      hashedPassword: 'hashed',
    },
  });

  await prisma.provider.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
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
      title: 'Stress Offer',
      description: 'Stress',
      popularity: 'HIGH',
      dataVolume: 1024,
      validityDays: 30,
      price: 1800,
      InternalMargin: 200,
      providerId: 1,
    },
  });
}

async function seedEsimBatch(prisma: PrismaService, count: number) {
  const transactions = Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    status: TransactionStatus.COMPLETED,
    channel: TransactionChannel.B2C,
    amount: 1800,
    currency: 'TND',
    userId: 1,
    offerId: 1,
  }));

  await prisma.transaction.createMany({
    data: transactions,
    skipDuplicates: true,
  });

  const esims = Array.from({ length: count }, (_, index) => ({
    status: EsimStatus.NOT_ACTIVE,
    iccid: `ICCID-STRESS-${Date.now()}-${index}`,
    activationCode: `ACT-STRESS-${Date.now()}-${index}`,
    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    userId: 1,
    transactionId: index + 1,
    providerId: 1,
  }));

  await prisma.esim.createMany({
    data: esims,
    skipDuplicates: true,
  });

  const ids = await prisma.esim.findMany({
    select: { id: true },
    orderBy: { id: 'asc' },
    take: count,
  });

  return ids.map((row) => row.id);
}

async function resetEsims(prisma: PrismaService, ids: number[]) {
  await prisma.auditLog.deleteMany({
    where: { transactionId: { in: ids } },
  });
  await prisma.activationAttempt.deleteMany({
    where: { esimId: { in: ids } },
  });

  await prisma.esim.updateMany({
    where: { id: { in: ids } },
    data: { status: EsimStatus.NOT_ACTIVE, activatedAt: null },
  });
}

async function buildModule(prisma: PrismaService) {
  const mockAuditLog = {
    log: async () => undefined,
  };

  const module: TestingModule = await Test.createTestingModule({
    providers: [
      EsimService,
      { provide: PrismaService, useValue: prisma },
      { provide: AuditLogService, useValue: mockAuditLog },
      {
        provide: ConfigService,
        useValue: {
          get: (key: string, def?: number) => {
            if (key === 'ESIM_MAX_ACTIVATION_ATTEMPTS') return 5;
            return def;
          },
        },
      },
      { provide: EsimRepository, useValue: {} },
      { provide: PROVIDER_ADAPTER, useValue: {} },
      { provide: TransactionRepository, useValue: {} },
      { provide: EsimProducer, useValue: {} },
    ],
  }).compile();

  return { module, esimService: module.get(EsimService) };
}

async function dbPing(prisma: PrismaService) {
  const start = performance.now();
  await prisma.$queryRaw`SELECT 1`;
  return Math.round((performance.now() - start) * 100) / 100;
}

async function runLevel(
  level: number,
  esimService: EsimService,
  prisma: PrismaService,
  ids: number[],
) {
  await resetEsims(prisma, ids.slice(0, level));

  const tasks = Array.from({ length: level }, (_, index) =>
    (async (): Promise<StepMetrics> => {
      const esimId = ids[index];
      const systemDelayMs = index * SYSTEM_DELAY_STEP_MS;
      const providerDelayMs = index * PROVIDER_DELAY_STEP_MS;

      const start = performance.now();
      try {
        await delay(systemDelayMs);
        const pingMs = await dbPing(prisma);

        const reqStart = performance.now();
        await esimService.requestActivation(esimId, {
          userId: 1,
          transactionId: index + 1,
          providerCode: 'AIRALO',
        });
        const requestMs = performance.now() - reqStart;

        const procStart = performance.now();
        await esimService.startProcessing(esimId, {
          userId: 1,
          transactionId: index + 1,
          providerCode: 'AIRALO',
          providerRequestId: `req-stress-${level}-${index}`,
          attemptNumber: 1,
        });
        const processingMs = performance.now() - procStart;

        await delay(providerDelayMs);

        const successStart = performance.now();
        await esimService.markActivationSuccess(esimId, {
          userId: 1,
          transactionId: index + 1,
          providerCode: 'AIRALO',
          providerRequestId: `req-stress-${level}-${index}`,
          attemptNumber: 1,
          durationMs: providerDelayMs,
          providerLatencyMs: providerDelayMs,
        });
        const successMs = performance.now() - successStart;

        const totalMs = performance.now() - start;

        return {
          level,
          index,
          systemDelayMs,
          providerDelayMs,
          dbPingMs: pingMs,
          requestMs: Math.round(requestMs * 100) / 100,
          processingMs: Math.round(processingMs * 100) / 100,
          successMs: Math.round(successMs * 100) / 100,
          totalMs: Math.round(totalMs * 100) / 100,
          ok: true,
        };
      } catch (error) {
        const totalMs = performance.now() - start;
        return {
          level,
          index,
          systemDelayMs,
          providerDelayMs,
          dbPingMs: 0,
          requestMs: 0,
          processingMs: 0,
          successMs: 0,
          totalMs: Math.round(totalMs * 100) / 100,
          ok: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    })(),
  );

  return Promise.all(tasks);
}

async function main() {
  process.env.DATABASE_URL = process.env.DATABASE_URL ?? TEST_DATABASE_URL;
  await ensureSafeTarget();

  const prisma = new PrismaService();
  await prisma.$connect();

  const { module, esimService } = await buildModule(prisma);

  try {
    await seedBase(prisma);
    const ids = await seedEsimBatch(prisma, MAX_CONCURRENCY);

    const allResults: StepMetrics[] = [];

    for (const level of CONCURRENCY_PROFILE) {
      const results = await runLevel(level, esimService, prisma, ids);
      allResults.push(...results);

      const ok = results.filter((r) => r.ok).map((r) => r.totalMs);
      const failed = results.filter((r) => !r.ok);

      const summary = summarize(ok);
      console.log(
        `level=${level} ok=${ok.length} failed=${failed.length} ` +
          `avg=${summary.avg}ms p50=${summary.p50}ms p95=${summary.p95}ms max=${summary.max}ms`,
      );
    }

    const output = {
      startedAt: new Date().toISOString(),
      maxConcurrency: MAX_CONCURRENCY,
      profile: CONCURRENCY_PROFILE,
      systemDelayStepMs: SYSTEM_DELAY_STEP_MS,
      providerDelayStepMs: PROVIDER_DELAY_STEP_MS,
      results: allResults,
    };

    const fs = await import('fs');
    const path = await import('path');
    const outPath = path.join(
      __dirname,
      `esim-activation-stress-${Date.now()}.json`,
    );
    fs.writeFileSync(outPath, JSON.stringify(output, null, 2));
    console.log(`results saved: ${outPath}`);
  } finally {
    await module.close();
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
