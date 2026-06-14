// test/financial-critical-path.spec.ts
// Run: npx jest --config test/jest-e2e.json --testPathPattern financial-critical-path
//
// Combined unit test suite covering the critical financial path across:
//   PurchaseService  · ActivationService  · WebhookService

import { Test, TestingModule } from '@nestjs/testing';
import { Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  TransactionStatus,
  EsimStatus,
  SystemEvent,
  AuditLayer,
  AuditTrigger,
  LedgerType,
  LedgerReason,
  ActivationAttemptStatus,
} from '@prisma/client';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { PurchaseService } from '../src/workers/Purchase.service';
import { ActivationService } from '../src/workers/activation.service';
import { WebhookService } from '../src/workers/webhook.service';
import {
  TransactionService,
  TERMINAL_STATUSES,
} from '../src/transaction/transaction.service';
import { TransactionRepository } from '../src/transaction/transaction.repository';
import { PaymentRepository } from '../src/payment/payment.repository';
import { EsimRepository } from '../src/esim/esim.repository';
import { AuditLogService } from '../src/AuditLog/AuditLog.service';
import { EsimProducer } from '../src/Queue/Producer/esim.producer';
import { PaymentEventProducer } from '../src/Queue/Producer/payment-event.producer';
import { PROVIDER_ADAPTER } from '../src/esim/adapters/provider-adapter.token';
import { PAYMENT_GATEWAY_ADAPTER } from '../src/payment/adapters/payment-gateway.token';
import { WalletService } from '../src/WalletTransaction/wallet.service';
import { RetryableError, TerminalError } from '../src/Queue/utils/errors';
import {
  PurchaseJobData,
  ActivateJobData,
} from '../src/Queue/Interfaces/Queue.interfaces';
import { PaymentEventJobData } from '../src/Queue/Interfaces/Queue.interfaces';
import { OfferService } from '../src/offer/offer.service';
import { mock } from 'node:test';

// ── Logger suppression ────────────────────────────────────────────────────────

beforeAll(() => {
  jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
  jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
  jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
});

afterAll(() => jest.restoreAllMocks());

// ══════════════════════════════════════════════════════════════════════════════
// MOCK FACTORIES
// ══════════════════════════════════════════════════════════════════════════════

function buildMockTransactionRepository() {
  return {
    findOne: jest.fn(),
    createInitial: jest.fn(),
    updateStatus: jest.fn(),
    findManyForUser: jest.fn(),
    findForUser: jest.fn(),
    updateStatusTx: jest.fn(),
    findLatestAuditContext: jest.fn().mockResolvedValue(null),
  };
}

function buildMockPaymentRepository() {
  return {
    findByGatewayPaymentId: jest.fn(),
    updateStatusByGatewayPaymentId: jest.fn(),
    updatePaymentStatus: jest.fn(),
    initiatePayment: jest.fn(),
    findStalePayments: jest.fn(),
    findExpiredCandidates: jest.fn(),
  };
}

function buildMockEsimRepository() {
  return {
    findOne: jest.fn(),
    updateStatus: jest.fn(),
    updateStatusTx: jest.fn(),
    findByUserId: jest.fn(),
    findByTransactionId: jest.fn(),
  };
}

function buildMockAuditLogService() {
  return {
    log: jest.fn().mockResolvedValue(undefined),
  };
}

function buildMockEsimProducer() {
  return {
    enqueuePurchase: jest.fn().mockResolvedValue(undefined),
    enqueueActivation: jest.fn().mockResolvedValue(undefined),
  };
}

function buildMockPaymentEventProducer() {
  return {
    enqueuePaymentEvent: jest.fn().mockResolvedValue(undefined),
  };
}

function buildMockProviderAdapter() {
  return {
    createEsim: jest.fn(),
    getStatus: jest.fn(),
    cancelEsim: jest.fn(),
  };
}

function buildMockWalletService() {
  return {
    reserveFunds: jest.fn().mockResolvedValue(undefined),
    commitReservedFunds: jest.fn().mockResolvedValue(undefined),
    releaseReservedFunds: jest.fn().mockResolvedValue(undefined),
    logLedger: jest.fn().mockResolvedValue(undefined),
  };
}

function buildMockGatewayAdapter() {
  return {
    fetchPaymentStatus: jest.fn(),
    initiatePayment: jest.fn(),
    refundPayment: jest.fn(),
  };
}

function buildMockPrismaService() {
  return {
    $transaction: jest.fn().mockImplementation(async (fn: any) =>
      fn({
        esim: {
          create: jest.fn().mockResolvedValue(undefined),
          update: jest.fn().mockResolvedValue(undefined),
          findUnique: jest.fn(),
          findFirst: jest.fn(),
        },
        transaction: {
          update: jest.fn().mockResolvedValue(undefined),
          findUnique: jest.fn(),
        },
        walletTransaction: {
          update: jest.fn().mockResolvedValue({ id: 1, amount: 1800 }),
          findUnique: jest.fn().mockResolvedValue({ id: 1, amount: 1800 }),
        },
        walletLedger: {
          create: jest.fn().mockResolvedValue(undefined),
        },
        activationAttempt: {
          findFirst: jest.fn().mockResolvedValue(null),
          create: jest.fn().mockResolvedValue({
            id: 1,
            attemptNumber: 1,
            providerRequestId: 'req-001',
            status: ActivationAttemptStatus.STARTED,
            startedAt: new Date(),
          }),
          count: jest.fn().mockResolvedValue(0),
          update: jest.fn().mockResolvedValue(undefined),
        },
        payment: {
          findUnique: jest.fn(),
          update: jest.fn().mockResolvedValue(undefined),
        },
      }),
    ),
    transaction: {
      findUnique: jest.fn(),
    },
    payment: {
      findUnique: jest.fn(),
    },
    esim: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
    },
    walletTransaction: {
      findUnique: jest.fn(),
    },
    activationAttempt: {
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn(),
      count: jest.fn().mockResolvedValue(0),
      update: jest.fn().mockResolvedValue(undefined),
    },
  };
}

function buildMockConfigService() {
  return {
    get: jest.fn().mockImplementation((key: string, def?: number) => {
      if (key === 'ESIM_MAX_ACTIVATION_ATTEMPTS') return 5;
      return def;
    }),
  };
}

function buildMockOfferService() {
  return {
    findbyId: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// DATA HELPERS
// ══════════════════════════════════════════════════════════════════════════════

function makeTx(
  overrides: Partial<{
    id: number;
    status: TransactionStatus;
    userId: number;
    offerId: number;
    amount: number;
    currency: string;
    channel: 'B2C' | 'B2B2C';
  }> = {},
) {
  return {
    id: overrides.id ?? 1,
    status: overrides.status ?? TransactionStatus.PROVISIONING,
    userId: overrides.userId ?? 10,
    offerId: overrides.offerId ?? 101,
    amount: overrides.amount ?? 1800,
    currency: overrides.currency ?? 'TND',
    channel: overrides.channel ?? 'B2C',
    createdAt: new Date(),
    updatedAt: new Date(),
    offer: {
      id: 101,
      country: 'France',
      Region: 'Europe',
      dataVolume: 5120,
      validityDays: 30,
      price: 1800,
      providerId: 1,
    },
  };
}

function makeEsim(
  overrides: Partial<{
    id: number;
    status: EsimStatus;
    iccid: string;
    transactionId: number;
    userId: number;
    activatedAt: Date | null;
  }> = {},
) {
  return {
    id: overrides.id ?? 1,
    status: overrides.status ?? EsimStatus.NOT_ACTIVE,
    iccid: overrides.iccid ?? 'ICCID-TEST-001',
    activationCode: 'ACT-001',
    transactionId: overrides.transactionId ?? 1,
    userId: overrides.userId ?? 10,
    providerId: 1,
    activatedAt: overrides.activatedAt ?? null,
    dataTotal: 5120,
    dataUsed: 0,
    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

function makePaymentRecord(
  txStatus: TransactionStatus = TransactionStatus.PENDING_PAYMENT,
  overrides: Partial<{
    gatewayPaymentId: string;
    transactionId: number;
  }> = {},
) {
  const transactionId = overrides.transactionId ?? 1;
  return {
    id: 999,
    gatewayPaymentId: overrides.gatewayPaymentId ?? 'gw-pay-001',
    transactionId,
    paymentProvider: 'FLOUCI',
    status: 'PENDING',
    transaction: makeTx({ id: transactionId, status: txStatus }),
  };
}

function makePurchaseJob(
  overrides: Partial<{
    id: string;
    attemptsMade: number;
    data: Partial<PurchaseJobData>;
  }> = {},
): Job<PurchaseJobData> {
  return {
    id: overrides.id ?? `job-${Math.random().toString(36).slice(2)}`,
    attemptsMade: overrides.attemptsMade ?? 0,
    name: 'purchase-esim',
    data: {
      transactionId: overrides.data?.transactionId ?? 1,
      userId: overrides.data?.userId ?? 10,
      offerId: overrides.data?.offerId ?? 101,
      channel: overrides.data?.channel ?? 'B2C',
      amount: overrides.data?.amount ?? 1800,
      currency: overrides.data?.currency ?? 'TND',
      ...overrides.data,
    },
  } as unknown as Job<PurchaseJobData>;
}

function makeActivationJob(
  overrides: Partial<{
    id: string;
    attemptsMade: number;
    data: Partial<ActivateJobData>;
  }> = {},
): Job<ActivateJobData> {
  return {
    id: overrides.id ?? `job-${Math.random().toString(36).slice(2)}`,
    attemptsMade: overrides.attemptsMade ?? 0,
    name: 'activate-esim',
    data: {
      transactionId: overrides.data?.transactionId ?? 1,
      userId: overrides.data?.userId ?? 10,
      iccid: overrides.data?.iccid ?? 'ICCID-TEST-001',
      channel: overrides.data?.channel ?? 'B2C',
      ...overrides.data,
    },
  } as unknown as Job<ActivateJobData>;
}

function makeWebhookJob(
  data: Partial<PaymentEventJobData> & {
    gatewayPaymentId: string;
    webhookStatus: PaymentEventJobData['webhookStatus'];
  },
): Job<PaymentEventJobData> {
  return {
    id: `job-${Math.random().toString(36).slice(2)}`,
    attemptsMade: 0,
    name: 'process-payment-event',
    data: {
      gatewayPaymentId: data.gatewayPaymentId,
      webhookStatus: data.webhookStatus,
      rawPayload: data.rawPayload ?? {},
      correlationId: data.correlationId ?? 'test-cid',
    },
  } as unknown as Job<PaymentEventJobData>;
}

// ══════════════════════════════════════════════════════════════════════════════
// MODULE BUILDER
// ══════════════════════════════════════════════════════════════════════════════

async function buildModule(
  overrides: {
    txRepo?: any;
    paymentRepo?: any;
    esimRepo?: any;
    auditLog?: any;
    esimProducer?: any;
    paymentEventProducer?: any;
    providerAdapter?: any;
    walletService?: any;
    gatewayAdapter?: any;
    prisma?: any;
    config?: any;
  } = {},
) {
  const txRepo = overrides.txRepo ?? buildMockTransactionRepository();
  const paymentRepo = overrides.paymentRepo ?? buildMockPaymentRepository();
  const esimRepo = overrides.esimRepo ?? buildMockEsimRepository();
  const auditLog = overrides.auditLog ?? buildMockAuditLogService();
  const esimProducer = overrides.esimProducer ?? buildMockEsimProducer();
  const paymentEventProducer =
    overrides.paymentEventProducer ?? buildMockPaymentEventProducer();
  const providerAdapter =
    overrides.providerAdapter ?? buildMockProviderAdapter();
  const walletService = overrides.walletService ?? buildMockWalletService();
  const gatewayAdapter = overrides.gatewayAdapter ?? buildMockGatewayAdapter();
  const prisma = overrides.prisma ?? buildMockPrismaService();
  const config = overrides.config ?? buildMockConfigService();

  const module: TestingModule = await Test.createTestingModule({
    providers: [
      PurchaseService,
      ActivationService,
      WebhookService,
      TransactionService,
      { provide: TransactionRepository, useValue: txRepo },
      { provide: PaymentRepository, useValue: paymentRepo },
      { provide: EsimRepository, useValue: esimRepo },
      { provide: AuditLogService, useValue: auditLog },
      { provide: EsimProducer, useValue: esimProducer },
      { provide: PaymentEventProducer, useValue: paymentEventProducer },
      { provide: PROVIDER_ADAPTER, useValue: providerAdapter },
      { provide: PAYMENT_GATEWAY_ADAPTER, useValue: gatewayAdapter },
      { provide: WalletService, useValue: walletService },
      { provide: PrismaService, useValue: prisma },
      { provide: ConfigService, useValue: config },
      // TransactionService dependency — never called in these test paths
      { provide: OfferService, useValue: buildMockOfferService() },
    ],
  }).compile();

  return {
    purchaseService: module.get(PurchaseService),
    activationService: module.get(ActivationService),
    webhookService: module.get(WebhookService),
    txRepo,
    paymentRepo,
    esimRepo,
    auditLog,
    esimProducer,
    paymentEventProducer,
    providerAdapter,
    walletService,
    gatewayAdapter,
    prisma,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// SUITE 1 — PurchaseService B2C happy path
// ══════════════════════════════════════════════════════════════════════════════

describe('PurchaseService — B2C happy path', () => {
  afterEach(() => jest.clearAllMocks());

  it('B2C-HP1 — provider returns eSIM, persists atomically, logs PROVISIONING_SUCCESS', async () => {
    const { purchaseService, providerAdapter, auditLog, prisma } =
      await buildModule();

    const job = makePurchaseJob({ data: { channel: 'B2C' } });

    prisma.transaction.findUnique.mockResolvedValue(
      makeTx({ status: TransactionStatus.PROVISIONING, channel: 'B2C' }),
    );
    prisma.payment.findUnique.mockResolvedValue({ id: 1, transactionId: 1 });
    // PurchaseService calls prisma.esim.findUnique (not findFirst) for idempotency
    prisma.esim.findUnique.mockResolvedValue(null);

    providerAdapter.createEsim.mockResolvedValue({
      iccid: 'ICCID-B2C-001',
      activationCode: 'ACT-B2C-001',
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    await purchaseService.handlePurchase(job);

    expect(providerAdapter.createEsim).toHaveBeenCalledTimes(1);
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(auditLog.log).toHaveBeenCalledWith(
      expect.objectContaining({
        event: SystemEvent.PROVISIONING_SUCCESS,
        layer: AuditLayer.PROVISIONING,
        fromStatus: 'PROVISIONING',
        toStatus: 'PROVISIONING',
        triggeredBy: AuditTrigger.PROVIDER,
      }),
    );
  });

  it('B2C-HP2 — already COMPLETED: job is no-op (idempotency)', async () => {
    const { purchaseService, providerAdapter, prisma } = await buildModule();

    const job = makePurchaseJob({ data: { channel: 'B2C' } });

    prisma.transaction.findUnique.mockResolvedValue(
      makeTx({ status: TransactionStatus.COMPLETED }),
    );

    await purchaseService.handlePurchase(job);

    expect(providerAdapter.createEsim).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('B2C-HP3 — already FAILED: job is no-op (idempotency)', async () => {
    const { purchaseService, providerAdapter, prisma } = await buildModule();

    const job = makePurchaseJob({ data: { channel: 'B2C' } });

    prisma.transaction.findUnique.mockResolvedValue(
      makeTx({ status: TransactionStatus.FAILED }),
    );

    await purchaseService.handlePurchase(job);

    expect(providerAdapter.createEsim).not.toHaveBeenCalled();
  });

  it('B2C-HP4 — eSIM already exists (retry after failed wallet commit): skips provider call', async () => {
    const { purchaseService, providerAdapter, auditLog, prisma } =
      await buildModule();

    const job = makePurchaseJob({ data: { channel: 'B2C' } });

    prisma.transaction.findUnique.mockResolvedValue(
      makeTx({ status: TransactionStatus.PROVISIONING, channel: 'B2C' }),
    );
    prisma.payment.findUnique.mockResolvedValue({ id: 1, transactionId: 1 });
    // eSIM already exists from previous attempt
    prisma.esim.findUnique.mockResolvedValue(
      makeEsim({ iccid: 'ICCID-EXISTING-001' }),
    );

    await purchaseService.handlePurchase(job);

    // Provider must NOT be called — eSIM already exists
    expect(providerAdapter.createEsim).not.toHaveBeenCalled();
    // But atomic write still happens (wallet commit etc.)
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(auditLog.log).toHaveBeenCalledWith(
      expect.objectContaining({ event: SystemEvent.PROVISIONING_SUCCESS }),
    );
  });

  it('B2C-HP5 — wrong status (not PROVISIONING): throws TerminalError', async () => {
    const { purchaseService, prisma } = await buildModule();

    const job = makePurchaseJob({ data: { channel: 'B2C' } });

    prisma.transaction.findUnique.mockResolvedValue(
      makeTx({ status: TransactionStatus.PENDING_PAYMENT }),
    );

    await expect(purchaseService.handlePurchase(job)).rejects.toThrow(
      TerminalError,
    );
  });

  it('B2C-HP6 — transaction not found: throws TerminalError', async () => {
    const { purchaseService, prisma } = await buildModule();

    const job = makePurchaseJob({ data: { channel: 'B2C' } });

    prisma.transaction.findUnique.mockResolvedValue(null);

    await expect(purchaseService.handlePurchase(job)).rejects.toThrow(
      TerminalError,
    );
  });

  it('B2C-HP7 — payment record not found: throws TerminalError', async () => {
    const { purchaseService, prisma } = await buildModule();

    const job = makePurchaseJob({ data: { channel: 'B2C' } });

    prisma.transaction.findUnique.mockResolvedValue(
      makeTx({ status: TransactionStatus.PROVISIONING, channel: 'B2C' }),
    );
    prisma.payment.findUnique.mockResolvedValue(null); // missing payment

    await expect(purchaseService.handlePurchase(job)).rejects.toThrow(
      TerminalError,
    );
  });

  it('B2C-HP8 — provider infra error (5xx): throws RetryableError', async () => {
    const { purchaseService, providerAdapter, prisma } = await buildModule();

    const job = makePurchaseJob({ data: { channel: 'B2C' } });

    prisma.transaction.findUnique.mockResolvedValue(
      makeTx({ status: TransactionStatus.PROVISIONING, channel: 'B2C' }),
    );
    prisma.payment.findUnique.mockResolvedValue({ id: 1 });
    prisma.esim.findUnique.mockResolvedValue(null);

    const infraError = Object.assign(new Error('Gateway timeout'), {
      status: 503,
    });
    providerAdapter.createEsim.mockRejectedValue(infraError);

    await expect(purchaseService.handlePurchase(job)).rejects.toThrow(
      RetryableError,
    );
  });

  it('B2C-HP9 — provider business error (4xx): throws TerminalError, logs PROVISIONING_FAILED', async () => {
    const { purchaseService, providerAdapter, auditLog, prisma } =
      await buildModule();

    const job = makePurchaseJob({ data: { channel: 'B2C' } });

    prisma.transaction.findUnique.mockResolvedValue(
      makeTx({ status: TransactionStatus.PROVISIONING, channel: 'B2C' }),
    );
    prisma.payment.findUnique.mockResolvedValue({ id: 1 });
    prisma.esim.findUnique.mockResolvedValue(null);

    const businessError = Object.assign(new Error('Plan not available'), {
      status: 422,
    });
    providerAdapter.createEsim.mockRejectedValue(businessError);

    await expect(purchaseService.handlePurchase(job)).rejects.toThrow(
      TerminalError,
    );

    expect(auditLog.log).toHaveBeenCalledWith(
      expect.objectContaining({
        event: SystemEvent.PROVISIONING_FAILED,
        fromStatus: 'PROVISIONING',
        toStatus: 'FAILED',
        triggeredBy: AuditTrigger.PROVIDER,
      }),
    );
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// SUITE 2 — PurchaseService B2B2C happy path
// ══════════════════════════════════════════════════════════════════════════════

describe('PurchaseService — B2B2C happy path', () => {
  afterEach(() => jest.clearAllMocks());

  it('B2B2C-HP1 — wallet RESERVED, provider succeeds, wallet committed atomically', async () => {
    const {
      purchaseService,
      providerAdapter,
      auditLog,
      walletService,
      prisma,
    } = await buildModule();

    const job = makePurchaseJob({ data: { channel: 'B2B2C' } });

    prisma.transaction.findUnique.mockResolvedValue(
      makeTx({ status: TransactionStatus.PROVISIONING, channel: 'B2B2C' }),
    );
    prisma.esim.findUnique.mockResolvedValue(null);
    prisma.walletTransaction.findUnique.mockResolvedValue({
      id: 1,
      transactionId: 1,
      status: 'RESERVED',
      amount: 1800,
    });

    providerAdapter.createEsim.mockResolvedValue({
      iccid: 'ICCID-B2B2C-001',
      activationCode: 'ACT-B2B2C-001',
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    await purchaseService.handlePurchase(job);

    expect(providerAdapter.createEsim).toHaveBeenCalledTimes(1);
    // Wallet commit must happen inside $transaction — not via walletService
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    // WalletService.commitReservedFunds must NOT be called outside transaction
    expect(walletService.commitReservedFunds).not.toHaveBeenCalled();
    expect(auditLog.log).toHaveBeenCalledWith(
      expect.objectContaining({ event: SystemEvent.PROVISIONING_SUCCESS }),
    );
  });

  it('B2B2C-HP2 — wallet already COMMITTED: throws TerminalError (idempotency)', async () => {
    const { purchaseService, providerAdapter, prisma } = await buildModule();

    const job = makePurchaseJob({ data: { channel: 'B2B2C' } });

    prisma.transaction.findUnique.mockResolvedValue(
      makeTx({ status: TransactionStatus.PROVISIONING, channel: 'B2B2C' }),
    );
    prisma.walletTransaction.findUnique.mockResolvedValue({
      id: 1,
      status: 'COMMITTED', // already committed
    });

    await expect(purchaseService.handlePurchase(job)).rejects.toThrow(
      TerminalError,
    );

    expect(providerAdapter.createEsim).not.toHaveBeenCalled();
  });

  it('B2B2C-HP3 — wallet already RELEASED: throws TerminalError', async () => {
    const { purchaseService, prisma } = await buildModule();

    const job = makePurchaseJob({ data: { channel: 'B2B2C' } });

    prisma.transaction.findUnique.mockResolvedValue(
      makeTx({ status: TransactionStatus.PROVISIONING, channel: 'B2B2C' }),
    );
    prisma.walletTransaction.findUnique.mockResolvedValue({
      id: 1,
      status: 'RELEASED', // already released
    });

    await expect(purchaseService.handlePurchase(job)).rejects.toThrow(
      TerminalError,
    );
  });

  it('B2B2C-HP4 — provider business error: wallet released atomically with FAILED', async () => {
    const {
      purchaseService,
      providerAdapter,
      auditLog,
      walletService,
      prisma,
    } = await buildModule();

    const job = makePurchaseJob({ data: { channel: 'B2B2C' } });

    prisma.transaction.findUnique.mockResolvedValue(
      makeTx({ status: TransactionStatus.PROVISIONING, channel: 'B2B2C' }),
    );
    prisma.esim.findUnique.mockResolvedValue(null);
    prisma.walletTransaction.findUnique.mockResolvedValue({
      id: 1,
      status: 'RESERVED',
      amount: 1800,
    });

    const businessError = Object.assign(new Error('Out of stock'), {
      status: 404,
    });
    providerAdapter.createEsim.mockRejectedValue(businessError);

    await expect(purchaseService.handlePurchase(job)).rejects.toThrow(
      TerminalError,
    );

    // Wallet release must happen inside $transaction — not via walletService
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(walletService.releaseReservedFunds).not.toHaveBeenCalled();

    expect(auditLog.log).toHaveBeenCalledWith(
      expect.objectContaining({
        event: SystemEvent.PROVISIONING_FAILED,
        toStatus: 'FAILED',
      }),
    );
  });

  it('B2B2C-HP5 — wallet transaction not found: throws TerminalError', async () => {
    const { purchaseService, prisma } = await buildModule();

    const job = makePurchaseJob({ data: { channel: 'B2B2C' } });

    prisma.transaction.findUnique.mockResolvedValue(
      makeTx({ status: TransactionStatus.PROVISIONING, channel: 'B2B2C' }),
    );
    prisma.walletTransaction.findUnique.mockResolvedValue(null);

    await expect(purchaseService.handlePurchase(job)).rejects.toThrow(
      TerminalError,
    );
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// SUITE 3 — ActivationService B2C happy path
// ══════════════════════════════════════════════════════════════════════════════

describe('ActivationService — B2C happy path', () => {
  afterEach(() => jest.clearAllMocks());

  it('ACT-B2C-HP1 — provider SUCCESS: eSIM ACTIVE + transaction SUCCEEDED atomically', async () => {
    const {
      activationService,
      providerAdapter,
      auditLog,
      walletService,
      prisma,
    } = await buildModule();

    const job = makeActivationJob({ data: { channel: 'B2C' } });

    prisma.transaction.findUnique.mockResolvedValue(
      makeTx({ status: TransactionStatus.PROCESSING, channel: 'B2C' }),
    );
    prisma.esim.findFirst.mockResolvedValue(
      makeEsim({ status: EsimStatus.NOT_ACTIVE }),
    );

    providerAdapter.getStatus.mockResolvedValue({
      status: 'SUCCESS',
      message: 'Activated',
    });

    await activationService.handleActivation(job);

    expect(prisma.$transaction).toHaveBeenCalledTimes(2); // claimAttempt + handleSuccess
    // B2C — wallet must NOT be touched
    expect(walletService.commitReservedFunds).not.toHaveBeenCalled();
    expect(auditLog.log).toHaveBeenCalledWith(
      expect.objectContaining({
        event: SystemEvent.ACTIVATION_SUCCESS,
        layer: AuditLayer.ACTIVATION,
        fromStatus: 'PROCESSING',
        toStatus: 'SUCCEEDED',
        triggeredBy: AuditTrigger.PROVIDER,
      }),
    );
  });

  it('ACT-B2C-HP2 — already SUCCEEDED: no-op (duplicate job)', async () => {
    const { activationService, providerAdapter, prisma } = await buildModule();

    const job = makeActivationJob({ data: { channel: 'B2C' } });

    prisma.transaction.findUnique.mockResolvedValue(
      makeTx({ status: TransactionStatus.SUCCEEDED }),
    );

    await activationService.handleActivation(job);

    expect(providerAdapter.getStatus).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('ACT-B2C-HP3 — already ACTIVE eSIM: no-op (duplicate job)', async () => {
    const { activationService, providerAdapter, prisma } = await buildModule();

    const job = makeActivationJob({ data: { channel: 'B2C' } });

    prisma.transaction.findUnique.mockResolvedValue(
      makeTx({ status: TransactionStatus.PROCESSING }),
    );
    prisma.esim.findFirst.mockResolvedValue(
      makeEsim({ status: EsimStatus.ACTIVE }),
    );

    await activationService.handleActivation(job);

    expect(providerAdapter.getStatus).not.toHaveBeenCalled();
  });

  it('ACT-B2C-HP4 — provider PENDING: logs PROVIDER_TIMEOUT, throws RetryableError', async () => {
    const { activationService, providerAdapter, auditLog, prisma } =
      await buildModule();

    const job = makeActivationJob({ data: { channel: 'B2C' } });

    prisma.transaction.findUnique.mockResolvedValue(
      makeTx({ status: TransactionStatus.PROCESSING }),
    );
    prisma.esim.findFirst.mockResolvedValue(makeEsim());

    providerAdapter.getStatus.mockResolvedValue({ status: 'PENDING' });

    await expect(activationService.handleActivation(job)).rejects.toThrow(
      RetryableError,
    );

    expect(auditLog.log).toHaveBeenCalledWith(
      expect.objectContaining({
        event: SystemEvent.PROVIDER_TIMEOUT,
        fromStatus: 'PROCESSING',
        toStatus: 'PROCESSING',
      }),
    );
  });

  it('ACT-B2C-HP5 — provider FAILED: eSIM FAILED + transaction FAILED atomically', async () => {
    const {
      activationService,
      providerAdapter,
      auditLog,
      walletService,
      prisma,
    } = await buildModule();

    const job = makeActivationJob({ data: { channel: 'B2C' } });

    prisma.transaction.findUnique.mockResolvedValue(
      makeTx({ status: TransactionStatus.PROCESSING, channel: 'B2C' }),
    );
    prisma.esim.findFirst.mockResolvedValue(makeEsim());

    providerAdapter.getStatus.mockResolvedValue({
      status: 'FAILED',
      message: 'Provider rejected',
    });

    await expect(activationService.handleActivation(job)).rejects.toThrow(
      TerminalError,
    );

    expect(prisma.$transaction).toHaveBeenCalledTimes(2); // claimAttempt + handleFailure
    // B2C — wallet must NOT be touched on failure
    expect(walletService.releaseReservedFunds).not.toHaveBeenCalled();
    expect(auditLog.log).toHaveBeenCalledWith(
      expect.objectContaining({
        event: SystemEvent.ACTIVATION_FAILED,
        fromStatus: 'PROCESSING',
        toStatus: 'FAILED',
      }),
    );
  });

  it('ACT-B2C-HP6 — eSIM not yet created: throws RetryableError', async () => {
    const { activationService, providerAdapter, prisma } = await buildModule();

    const job = makeActivationJob({ data: { channel: 'B2C' } });

    prisma.transaction.findUnique.mockResolvedValue(
      makeTx({ status: TransactionStatus.PROCESSING }),
    );
    prisma.esim.findFirst.mockResolvedValue(null); // PurchaseService not done yet

    await expect(activationService.handleActivation(job)).rejects.toThrow(
      RetryableError,
    );

    expect(providerAdapter.getStatus).not.toHaveBeenCalled();
  });

  it('ACT-B2C-HP7 — provider infra error: logs PROVIDER_TIMEOUT, throws RetryableError', async () => {
    const { activationService, providerAdapter, auditLog, prisma } =
      await buildModule();

    const job = makeActivationJob({ data: { channel: 'B2C' } });

    prisma.transaction.findUnique.mockResolvedValue(
      makeTx({ status: TransactionStatus.PROCESSING }),
    );
    prisma.esim.findFirst.mockResolvedValue(makeEsim());

    const infraError = Object.assign(new Error('Connection reset'), {
      code: 'ECONNRESET',
    });
    providerAdapter.getStatus.mockRejectedValue(infraError);

    await expect(activationService.handleActivation(job)).rejects.toThrow(
      RetryableError,
    );

    expect(auditLog.log).toHaveBeenCalledWith(
      expect.objectContaining({ event: SystemEvent.PROVIDER_TIMEOUT }),
    );
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// SUITE 4 — ActivationService B2B2C happy path
// ══════════════════════════════════════════════════════════════════════════════

describe('ActivationService — B2B2C happy path', () => {
  afterEach(() => jest.clearAllMocks());

  it('ACT-B2B2C-HP1 — SUCCESS: eSIM ACTIVE + wallet COMMITTED atomically', async () => {
    const {
      activationService,
      providerAdapter,
      auditLog,
      walletService,
      prisma,
    } = await buildModule();

    const job = makeActivationJob({ data: { channel: 'B2B2C' } });

    prisma.transaction.findUnique.mockResolvedValue(
      makeTx({ status: TransactionStatus.PROCESSING, channel: 'B2B2C' }),
    );
    prisma.esim.findFirst.mockResolvedValue(makeEsim());

    providerAdapter.getStatus.mockResolvedValue({ status: 'SUCCESS' });

    await activationService.handleActivation(job);

    expect(prisma.$transaction).toHaveBeenCalledTimes(2); // claimAttempt + handleSuccess
    // Wallet commit must be inside $transaction, NOT via walletService
    expect(walletService.commitReservedFunds).not.toHaveBeenCalled();
    expect(auditLog.log).toHaveBeenCalledWith(
      expect.objectContaining({
        event: SystemEvent.ACTIVATION_SUCCESS,
        toStatus: 'SUCCEEDED',
      }),
    );
  });

  it('ACT-B2B2C-HP2 — FAILED: eSIM FAILED + wallet RELEASED atomically', async () => {
    const {
      activationService,
      providerAdapter,
      auditLog,
      walletService,
      prisma,
    } = await buildModule();

    const job = makeActivationJob({ data: { channel: 'B2B2C' } });

    prisma.transaction.findUnique.mockResolvedValue(
      makeTx({ status: TransactionStatus.PROCESSING, channel: 'B2B2C' }),
    );
    prisma.esim.findFirst.mockResolvedValue(makeEsim());

    providerAdapter.getStatus.mockResolvedValue({
      status: 'FAILED',
      message: 'Provider rejected',
    });

    await expect(activationService.handleActivation(job)).rejects.toThrow(
      TerminalError,
    );

    expect(prisma.$transaction).toHaveBeenCalledTimes(2); // claimAttempt + handleFailure
    // Wallet release must be inside $transaction, NOT via walletService
    expect(walletService.releaseReservedFunds).not.toHaveBeenCalled();
    expect(auditLog.log).toHaveBeenCalledWith(
      expect.objectContaining({
        event: SystemEvent.ACTIVATION_FAILED,
        toStatus: 'FAILED',
      }),
    );
  });

  it('ACT-B2B2C-HP3 — in-flight attempt detected: throws RetryableError', async () => {
    const { activationService, providerAdapter, prisma } = await buildModule();

    const job = makeActivationJob({ data: { channel: 'B2B2C' } });

    prisma.transaction.findUnique.mockResolvedValue(
      makeTx({ status: TransactionStatus.PROCESSING, channel: 'B2B2C' }),
    );
    prisma.esim.findFirst.mockResolvedValue(makeEsim());

    // Simulate in-flight attempt inside $transaction
    prisma.$transaction.mockImplementationOnce(async (fn: any) => {
      const tx = {
        activationAttempt: {
          findFirst: jest.fn().mockResolvedValue({
            id: 99,
            status: ActivationAttemptStatus.STARTED,
            startedAt: new Date(), // within 60s window
          }),
          create: jest.fn(),
          count: jest.fn().mockResolvedValue(1),
          update: jest.fn(),
        },
      };
      return fn(tx);
    });

    await expect(activationService.handleActivation(job)).rejects.toThrow(
      RetryableError,
    );

    expect(providerAdapter.getStatus).not.toHaveBeenCalled();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// SUITE 5 — Atomicity guarantees
// ══════════════════════════════════════════════════════════════════════════════

describe('Atomicity — financial writes must be in same transaction', () => {
  afterEach(() => jest.clearAllMocks());

  it('ATOM1 — PurchaseService B2B2C: eSIM create + wallet commit in ONE $transaction call', async () => {
    const { purchaseService, providerAdapter, walletService, prisma } =
      await buildModule();

    const job = makePurchaseJob({ data: { channel: 'B2B2C' } });

    prisma.transaction.findUnique.mockResolvedValue(
      makeTx({ status: TransactionStatus.PROVISIONING, channel: 'B2B2C' }),
    );
    prisma.walletTransaction.findUnique.mockResolvedValue({
      id: 1,
      status: 'RESERVED',
      amount: 1800,
    });
    prisma.esim.findUnique.mockResolvedValue(null);
    providerAdapter.createEsim.mockResolvedValue({
      iccid: 'ICCID-ATOM-001',
      activationCode: 'ACT-ATOM-001',
      expiryDate: new Date(),
    });

    await purchaseService.handlePurchase(job);

    // Exactly ONE $transaction call — eSIM and wallet in same atomic unit
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    // WalletService bypassed — writes go directly via prismaTx
    expect(walletService.commitReservedFunds).not.toHaveBeenCalled();
    expect(walletService.logLedger).not.toHaveBeenCalled();
  });

  it('ATOM2 — ActivationService B2B2C SUCCESS: eSIM + tx + wallet in ONE $transaction call', async () => {
    const { activationService, providerAdapter, walletService, prisma } =
      await buildModule();

    const job = makeActivationJob({ data: { channel: 'B2B2C' } });

    prisma.transaction.findUnique.mockResolvedValue(
      makeTx({ status: TransactionStatus.PROCESSING, channel: 'B2B2C' }),
    );
    prisma.esim.findFirst.mockResolvedValue(makeEsim());
    providerAdapter.getStatus.mockResolvedValue({ status: 'SUCCESS' });

    await activationService.handleActivation(job);

    // claimAttempt (1) + handleSuccess (1) = 2 $transaction calls total
    // both are within distinct $transaction calls — each is atomic
    expect(prisma.$transaction).toHaveBeenCalledTimes(2);
    expect(walletService.commitReservedFunds).not.toHaveBeenCalled();
  });

  it('ATOM3 — ActivationService B2B2C FAILED: eSIM + tx + wallet release in ONE $transaction call', async () => {
    const { activationService, providerAdapter, walletService, prisma } =
      await buildModule();

    const job = makeActivationJob({ data: { channel: 'B2B2C' } });

    prisma.transaction.findUnique.mockResolvedValue(
      makeTx({ status: TransactionStatus.PROCESSING, channel: 'B2B2C' }),
    );
    prisma.esim.findFirst.mockResolvedValue(makeEsim());
    providerAdapter.getStatus.mockResolvedValue({ status: 'FAILED' });

    await expect(activationService.handleActivation(job)).rejects.toThrow(
      TerminalError,
    );

    // claimAttempt (1) + handleFailure (1) = 2 $transaction calls total
    expect(prisma.$transaction).toHaveBeenCalledTimes(2);
    expect(walletService.releaseReservedFunds).not.toHaveBeenCalled();
  });

  it('ATOM4 — PurchaseService B2B2C failure: tx FAILED + wallet RELEASED in ONE $transaction call', async () => {
    const { purchaseService, providerAdapter, walletService, prisma } =
      await buildModule();

    const job = makePurchaseJob({ data: { channel: 'B2B2C' } });

    prisma.transaction.findUnique.mockResolvedValue(
      makeTx({ status: TransactionStatus.PROVISIONING, channel: 'B2B2C' }),
    );
    prisma.walletTransaction.findUnique.mockResolvedValue({
      id: 1,
      status: 'RESERVED',
      amount: 1800,
    });
    prisma.esim.findUnique.mockResolvedValue(null);

    const businessError = Object.assign(new Error('Rejected'), { status: 400 });
    providerAdapter.createEsim.mockRejectedValue(businessError);

    await expect(purchaseService.handlePurchase(job)).rejects.toThrow(
      TerminalError,
    );

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(walletService.releaseReservedFunds).not.toHaveBeenCalled();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// SUITE 6 — AuditLog written after commit, never inside transaction
// ══════════════════════════════════════════════════════════════════════════════

describe('AuditLog — written after commit, never inside transaction', () => {
  afterEach(() => jest.clearAllMocks());

  it('AUDIT1 — PurchaseService: AuditLog written after $transaction resolves', async () => {
    const { purchaseService, providerAdapter, auditLog, prisma } =
      await buildModule();

    const callOrder: string[] = [];

    prisma.$transaction.mockImplementationOnce(async (fn: any) => {
      await fn({
        esim: {
          create: jest.fn().mockImplementation(() => {
            callOrder.push('esim.create');
          }),
        },
        walletTransaction: {
          update: jest.fn().mockResolvedValue({ id: 1, amount: 1800 }),
        },
        walletLedger: {
          create: jest.fn().mockResolvedValue(undefined),
        },
      });
    });

    auditLog.log.mockImplementation(async () => {
      callOrder.push('auditLog.log');
    });

    const job = makePurchaseJob({ data: { channel: 'B2C' } });
    prisma.transaction.findUnique.mockResolvedValue(
      makeTx({ status: TransactionStatus.PROVISIONING, channel: 'B2C' }),
    );
    prisma.payment.findUnique.mockResolvedValue({ id: 1 });
    prisma.esim.findUnique.mockResolvedValue(null);
    providerAdapter.createEsim.mockResolvedValue({
      iccid: 'ICCID-ORDER-001',
      activationCode: 'ACT-001',
      expiryDate: new Date(),
    });

    await purchaseService.handlePurchase(job);

    // esim.create must happen before auditLog.log
    const esimIdx = callOrder.indexOf('esim.create');
    const auditIdx = callOrder.lastIndexOf('auditLog.log');
    expect(esimIdx).toBeGreaterThanOrEqual(0);
    expect(auditIdx).toBeGreaterThan(esimIdx);
  });

  it('AUDIT2 — ActivationService: AuditLog written after $transaction resolves', async () => {
    const { activationService, providerAdapter, auditLog, prisma } =
      await buildModule();

    const callOrder: string[] = [];

    prisma.$transaction
      // First call → claimAttempt
      .mockImplementationOnce(async (fn: any) => {
        return fn({
          activationAttempt: {
            findFirst: jest.fn().mockResolvedValue(null),
            count: jest.fn().mockResolvedValue(0),
            create: jest.fn().mockResolvedValue({
              id: 1,
              attemptNumber: 1,
              providerRequestId: 'req-audit-001',
              status: ActivationAttemptStatus.STARTED,
              startedAt: new Date(),
              esimId: 1,
              completedAt: null,
              errorCode: null,
              errorMessage: null,
            }),
            update: jest.fn().mockResolvedValue({
              id: 1,
              status: ActivationAttemptStatus.SUCCESS,
            }),
          },
        });
      })
      // Second call → handleSuccess
      .mockImplementationOnce(async (fn: any) => {
        return fn({
          esim: {
            update: jest.fn().mockImplementation(async () => {
              callOrder.push('esim.update');
              return makeEsim({
                status: EsimStatus.ACTIVE,
                activatedAt: new Date(),
              });
            }),
          },
          transaction: {
            update: jest
              .fn()
              .mockResolvedValue(
                makeTx({ status: TransactionStatus.SUCCEEDED }),
              ),
          },
          activationAttempt: {
            update: jest.fn().mockResolvedValue({
              id: 1,
              attemptNumber: 1,
              status: ActivationAttemptStatus.SUCCESS,
              completedAt: new Date(),
              providerResponse: { status: 'SUCCESS' },
              providerRequestId: 'req-audit-001',
              startedAt: new Date(),
              esimId: 1,
              errorCode: null,
              errorMessage: null,
            }),
          },
          walletTransaction: {
            update: jest.fn().mockResolvedValue({ id: 1, amount: 1800 }),
            findUnique: jest.fn().mockResolvedValue({ id: 1, amount: 1800 }),
          },
          walletLedger: {
            create: jest.fn().mockResolvedValue({ id: 1 }),
          },
        });
      });

    auditLog.log.mockImplementation(async () => {
      callOrder.push('auditLog.log');
    });

    const job = makeActivationJob({ data: { channel: 'B2C' } });

    prisma.transaction.findUnique.mockResolvedValue(
      makeTx({ status: TransactionStatus.PROCESSING }),
    );
    prisma.esim.findFirst.mockResolvedValue(makeEsim());
    providerAdapter.getStatus.mockResolvedValue({ status: 'SUCCESS' });

    await activationService.handleActivation(job);

    const esimIdx = callOrder.indexOf('esim.update');
    const auditIdx = callOrder.lastIndexOf('auditLog.log');

    expect(esimIdx).toBeGreaterThanOrEqual(0);
    expect(auditIdx).toBeGreaterThan(esimIdx);
  });

  // ══════════════════════════════════════════════════════════════════════════════
  // SUITE 7 — WebhookService financial path
  // ══════════════════════════════════════════════════════════════════════════════

  describe('WebhookService — financial path', () => {
    afterEach(() => jest.clearAllMocks());

    it('WH-B2C-HP1 — SUCCESS: PENDING_PAYMENT → PAID → PROVISIONING, enqueues eSIM job', async () => {
      const {
        webhookService,
        txRepo,
        paymentRepo,
        esimProducer,
        auditLog,
        gatewayAdapter,
      } = await buildModule();

      paymentRepo.findByGatewayPaymentId.mockResolvedValue(
        makePaymentRecord(TransactionStatus.PENDING_PAYMENT),
      );
      paymentRepo.updateStatusByGatewayPaymentId.mockResolvedValue({});
      // Gateway confirms payment is SUCCESS
      gatewayAdapter.fetchPaymentStatus.mockResolvedValue({
        status: 'SUCCESS',
      });

      const paidTx = makeTx({ status: TransactionStatus.PAID });
      const provTx = makeTx({ status: TransactionStatus.PROVISIONING });
      txRepo.findOne
        .mockResolvedValueOnce(
          makeTx({ status: TransactionStatus.PENDING_PAYMENT }),
        )
        .mockResolvedValueOnce(paidTx);
      txRepo.updateStatus
        .mockResolvedValueOnce(paidTx)
        .mockResolvedValueOnce(provTx);

      const job = makeWebhookJob({
        gatewayPaymentId: 'gw-001',
        webhookStatus: 'SUCCESS',
      });
      await webhookService.handleWebhookEvent(job);

      expect(txRepo.updateStatus).toHaveBeenCalledWith(
        1,
        TransactionStatus.PAID,
      );
      expect(txRepo.updateStatus).toHaveBeenCalledWith(
        1,
        TransactionStatus.PROVISIONING,
      );
      expect(esimProducer.enqueuePurchase).toHaveBeenCalledTimes(1);
      expect(auditLog.log).toHaveBeenCalledWith(
        expect.objectContaining({ event: SystemEvent.PAYMENT_CONFIRMED }),
      );
      expect(auditLog.log).toHaveBeenCalledWith(
        expect.objectContaining({ event: SystemEvent.PROVISIONING_ENQUEUED }),
      );
    });

    it('WH-B2C-HP2 — FAILED: PENDING_PAYMENT → FAILED, no eSIM job enqueued', async () => {
      const {
        webhookService,
        txRepo,
        paymentRepo,
        esimProducer,
        auditLog,
        gatewayAdapter,
      } = await buildModule();

      paymentRepo.findByGatewayPaymentId.mockResolvedValue(
        makePaymentRecord(TransactionStatus.PENDING_PAYMENT),
      );
      paymentRepo.updateStatusByGatewayPaymentId.mockResolvedValue({});
      gatewayAdapter.fetchPaymentStatus.mockResolvedValue({ status: 'FAILED' });

      txRepo.findOne.mockResolvedValue(
        makeTx({ status: TransactionStatus.PENDING_PAYMENT }),
      );
      txRepo.updateStatus.mockResolvedValue(
        makeTx({ status: TransactionStatus.FAILED }),
      );

      const job = makeWebhookJob({
        gatewayPaymentId: 'gw-001',
        webhookStatus: 'FAILED',
      });
      await webhookService.handleWebhookEvent(job);

      expect(txRepo.updateStatus).toHaveBeenCalledWith(
        1,
        TransactionStatus.FAILED,
      );
      expect(esimProducer.enqueuePurchase).not.toHaveBeenCalled();
      expect(auditLog.log).toHaveBeenCalledWith(
        expect.objectContaining({ event: SystemEvent.PAYMENT_FAILED }),
      );
    });

    it('WH-B2C-HP3 — duplicate SUCCESS (already PROVISIONING): idempotent no-op', async () => {
      const { webhookService, txRepo, paymentRepo, esimProducer } =
        await buildModule();

      paymentRepo.findByGatewayPaymentId.mockResolvedValue(
        makePaymentRecord(TransactionStatus.PROVISIONING),
      );

      const job = makeWebhookJob({
        gatewayPaymentId: 'gw-001',
        webhookStatus: 'SUCCESS',
      });
      await webhookService.handleWebhookEvent(job);

      expect(txRepo.updateStatus).not.toHaveBeenCalled();
      expect(esimProducer.enqueuePurchase).not.toHaveBeenCalled();
    });

    it('WH-B2C-HP4 — no payment record: throws TerminalError', async () => {
      const { webhookService, paymentRepo } = await buildModule();

      paymentRepo.findByGatewayPaymentId.mockResolvedValue(null);

      const job = makeWebhookJob({
        gatewayPaymentId: 'gw-unknown',
        webhookStatus: 'SUCCESS',
      });

      await expect(webhookService.handleWebhookEvent(job)).rejects.toThrow(
        'No payment found',
      );
    });

    it('WH-B2C-HP5 — PENDING status: throws retryable error for BullMQ retry', async () => {
      const { webhookService, paymentRepo, txRepo, gatewayAdapter } =
        await buildModule();

      paymentRepo.findByGatewayPaymentId.mockResolvedValue(
        makePaymentRecord(TransactionStatus.PENDING_PAYMENT),
      );
      // Gateway still reports PENDING
      gatewayAdapter.fetchPaymentStatus.mockResolvedValue({
        status: 'PENDING',
      });

      const job = makeWebhookJob({
        gatewayPaymentId: 'gw-001',
        webhookStatus: 'PENDING',
      });

      await expect(webhookService.handleWebhookEvent(job)).rejects.toThrow(
        'still PENDING',
      );

      expect(txRepo.updateStatus).not.toHaveBeenCalled();
    });
  });

  // ══════════════════════════════════════════════════════════════════════════════
  // SUITE 8 — Full E2E financial flow
  // ══════════════════════════════════════════════════════════════════════════════

  describe('Full E2E — purchase → webhook → activation financial flow', () => {
    afterEach(() => jest.clearAllMocks());

    it('E2E-B2C-FULL — complete B2C flow: provision → webhook → activate', async () => {
      const {
        purchaseService,
        webhookService,
        activationService,
        providerAdapter,
        txRepo,
        paymentRepo,
        esimProducer,
        auditLog,
        gatewayAdapter,
        prisma,
      } = await buildModule();

      // ── Phase 1: Purchase ────────────────────────────────────────────────────
      const purchaseJob = makePurchaseJob({ data: { channel: 'B2C' } });

      prisma.transaction.findUnique.mockResolvedValue(
        makeTx({ status: TransactionStatus.PROVISIONING, channel: 'B2C' }),
      );
      prisma.payment.findUnique.mockResolvedValue({ id: 1, transactionId: 1 });
      prisma.esim.findUnique.mockResolvedValue(null);
      providerAdapter.createEsim.mockResolvedValue({
        iccid: 'ICCID-E2E-001',
        activationCode: 'ACT-E2E-001',
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });

      await purchaseService.handlePurchase(purchaseJob);
      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(auditLog.log).toHaveBeenCalledWith(
        expect.objectContaining({ event: SystemEvent.PROVISIONING_SUCCESS }),
      );

      jest.clearAllMocks();
      auditLog.log.mockResolvedValue(undefined);

      // ── Phase 2: Webhook SUCCESS ─────────────────────────────────────────────
      paymentRepo.findByGatewayPaymentId.mockResolvedValue(
        makePaymentRecord(TransactionStatus.PENDING_PAYMENT, {
          gatewayPaymentId: 'gw-e2e-001',
          transactionId: 1,
        }),
      );
      paymentRepo.updateStatusByGatewayPaymentId.mockResolvedValue({});
      gatewayAdapter.fetchPaymentStatus.mockResolvedValue({
        status: 'SUCCESS',
      });

      const paidTx = makeTx({ status: TransactionStatus.PAID });
      const provTx = makeTx({ status: TransactionStatus.PROVISIONING });
      txRepo.findOne
        .mockResolvedValueOnce(
          makeTx({ status: TransactionStatus.PENDING_PAYMENT }),
        )
        .mockResolvedValueOnce(paidTx);
      txRepo.updateStatus
        .mockResolvedValueOnce(paidTx)
        .mockResolvedValueOnce(provTx);

      const webhookJob = makeWebhookJob({
        gatewayPaymentId: 'gw-e2e-001',
        webhookStatus: 'SUCCESS',
      });
      await webhookService.handleWebhookEvent(webhookJob);

      expect(esimProducer.enqueuePurchase).toHaveBeenCalledTimes(1);
      expect(auditLog.log).toHaveBeenCalledWith(
        expect.objectContaining({ event: SystemEvent.PAYMENT_CONFIRMED }),
      );

      jest.clearAllMocks();
      auditLog.log.mockResolvedValue(undefined);

      // ── Phase 3: Activation ──────────────────────────────────────────────────
      const activationJob = makeActivationJob({ data: { channel: 'B2C' } });

      prisma.transaction.findUnique.mockResolvedValue(
        makeTx({ status: TransactionStatus.PROCESSING, channel: 'B2C' }),
      );
      prisma.esim.findFirst.mockResolvedValue(
        makeEsim({ iccid: 'ICCID-E2E-001', status: EsimStatus.NOT_ACTIVE }),
      );
      providerAdapter.getStatus.mockResolvedValue({ status: 'SUCCESS' });

      await activationService.handleActivation(activationJob);

      expect(prisma.$transaction).toHaveBeenCalledTimes(2); // claimAttempt + handleSuccess
      expect(auditLog.log).toHaveBeenCalledWith(
        expect.objectContaining({
          event: SystemEvent.ACTIVATION_SUCCESS,
          toStatus: 'SUCCEEDED',
        }),
      );
    });

    it('E2E-B2B2C-FULL — complete B2B2C flow: wallet reserved → provision → activate → committed', async () => {
      const {
        purchaseService,
        activationService,
        providerAdapter,
        walletService,
        auditLog,
        prisma,
      } = await buildModule();

      // ── Phase 1: Purchase (B2B2C — no webhook, wallet funded directly) ───────
      const purchaseJob = makePurchaseJob({ data: { channel: 'B2B2C' } });

      prisma.transaction.findUnique.mockResolvedValue(
        makeTx({ status: TransactionStatus.PROVISIONING, channel: 'B2B2C' }),
      );
      prisma.walletTransaction.findUnique.mockResolvedValue({
        id: 1,
        status: 'RESERVED',
        amount: 1800,
      });
      prisma.esim.findUnique.mockResolvedValue(null);
      providerAdapter.createEsim.mockResolvedValue({
        iccid: 'ICCID-B2B2C-E2E',
        activationCode: 'ACT-B2B2C-E2E',
        expiryDate: new Date(),
      });

      await purchaseService.handlePurchase(purchaseJob);

      expect(walletService.commitReservedFunds).not.toHaveBeenCalled();
      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(auditLog.log).toHaveBeenCalledWith(
        expect.objectContaining({ event: SystemEvent.PROVISIONING_SUCCESS }),
      );

      jest.clearAllMocks();
      auditLog.log.mockResolvedValue(undefined);

      // ── Phase 2: Activation (B2B2C — wallet committed inside transaction) ────
      const activationJob = makeActivationJob({ data: { channel: 'B2B2C' } });

      prisma.transaction.findUnique.mockResolvedValue(
        makeTx({ status: TransactionStatus.PROCESSING, channel: 'B2B2C' }),
      );
      prisma.esim.findFirst.mockResolvedValue(
        makeEsim({ iccid: 'ICCID-B2B2C-E2E', status: EsimStatus.NOT_ACTIVE }),
      );
      providerAdapter.getStatus.mockResolvedValue({ status: 'SUCCESS' });

      await activationService.handleActivation(activationJob);

      expect(walletService.commitReservedFunds).not.toHaveBeenCalled();
      expect(prisma.$transaction).toHaveBeenCalledTimes(2); // claimAttempt + handleSuccess
      expect(auditLog.log).toHaveBeenCalledWith(
        expect.objectContaining({
          event: SystemEvent.ACTIVATION_SUCCESS,
          toStatus: 'SUCCEEDED',
        }),
      );
    });

    it('E2E-B2B2C-FAILURE — activation failure releases wallet atomically', async () => {
      const {
        activationService,
        providerAdapter,
        walletService,
        auditLog,
        prisma,
      } = await buildModule();

      const job = makeActivationJob({ data: { channel: 'B2B2C' } });

      prisma.transaction.findUnique.mockResolvedValue(
        makeTx({ status: TransactionStatus.PROCESSING, channel: 'B2B2C' }),
      );
      prisma.esim.findFirst.mockResolvedValue(makeEsim());
      providerAdapter.getStatus.mockResolvedValue({
        status: 'FAILED',
        message: 'Provider rejected activation',
      });

      await expect(activationService.handleActivation(job)).rejects.toThrow(
        TerminalError,
      );

      // Wallet release must be inside $transaction — not via walletService
      expect(walletService.releaseReservedFunds).not.toHaveBeenCalled();
      expect(prisma.$transaction).toHaveBeenCalledTimes(2); // claimAttempt + handleFailure
      expect(auditLog.log).toHaveBeenCalledWith(
        expect.objectContaining({
          event: SystemEvent.ACTIVATION_FAILED,
          toStatus: 'FAILED',
        }),
      );
    });
  });
});
