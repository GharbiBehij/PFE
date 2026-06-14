import {
  PrismaClient,
  CoverageType,
  Role,
  EsimStatus,
  TransactionStatus,
  TransactionType,
  TransactionChannel,
  WalletStatus,
  LedgerType,
  LedgerReason,
  TopUpStatus,
  AuditLayer,
  AuditTrigger,
  SystemEvent,
  statusDomain,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// ── Country metadata ────────────────────────────────────────────────────────

const LOCAL_COUNTRIES = [
  'TN','FR','DE','ES','IT','GB','MA','EG','AE','SA',
  'JP','KR','TH','US','CA','BR','TR','PL','NL','SE','PT','GR',
] as const;

const COUNTRY_NAME: Record<string, string> = {
  TN:'Tunisia', FR:'France', DE:'Germany', ES:'Spain', IT:'Italy',
  GB:'United Kingdom', MA:'Morocco', EG:'Egypt', AE:'United Arab Emirates',
  SA:'Saudi Arabia', JP:'Japan', KR:'South Korea', TH:'Thailand',
  US:'United States', CA:'Canada', BR:'Brazil', TR:'Turkey', PL:'Poland',
  NL:'Netherlands', SE:'Sweden', PT:'Portugal', GR:'Greece',
};

const COUNTRY_REGION: Record<string, string> = {
  TN:'North Africa', FR:'Europe', DE:'Europe', ES:'Europe', IT:'Europe',
  GB:'Europe', MA:'North Africa', EG:'North Africa',
  AE:'Middle East & Africa', SA:'Middle East & Africa',
  JP:'Asia Pacific', KR:'Asia Pacific', TH:'Asia Pacific',
  US:'Americas', CA:'Americas', BR:'Americas',
  TR:'Europe', PL:'Europe', NL:'Europe', SE:'Europe', PT:'Europe', GR:'Europe',
};

// Countries with 5G / 4G+5G networks
const NETWORK_TYPE: Record<string, string> = {
  JP:'5G', KR:'5G', US:'5G', GB:'5G', DE:'5G', FR:'5G', AE:'5G',
  SE:'4G/5G', NL:'4G/5G', CA:'4G/5G', IT:'4G/5G', SA:'4G/5G',
};
const networkFor = (cc: string): string => NETWORK_TYPE[cc] ?? '4G';

const PREMIUM = new Set(['FR','DE','ES','IT','GB','PL','NL','SE','PT','GR','US','CA','JP','KR','AE','SA']);

// ── Data tiers ───────────────────────────────────────────────────────────────

const DURATIONS = [7, 15, 30, 60];
const DATA_TIERS: Record<number, number[]> = {
  7:  [1, 3, 5],
  15: [3, 5, 10],
  30: [5, 10, 20],
  60: [10, 20, 50],
};
const UNLIMITED_MULT: Record<number, number> = { 7:1.0, 15:1.6, 30:2.5, 60:4.0 };

// Sentinel for unlimited eSIMs: 999 999 MB ≈ unlimited
const UNLIMITED_DATA_TOTAL = 999_999;

// ── Pricing ──────────────────────────────────────────────────────────────────

function localPrice(dataGB: number, days: number, premium: boolean): number {
  const base = dataGB * (premium ? 1.8 : 1.2) + days * 0.4;
  return Math.round(base * 10) / 10;
}
const tndToInt = (v: number) => Math.round(v * 1000);

// ── Helpers ──────────────────────────────────────────────────────────────────

const randInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const randItem = <T>(arr: T[]): T => arr[randInt(0, arr.length - 1)];

function randomIccid() {
  return `MOCK${Array.from({ length: 12 }, () => randInt(0, 9)).join('')}`;
}

function activationCode(offerId: number) {
  return `LPA:1$${offerId}.mock.netyfly.com$${Math.random().toString(16).slice(2, 12)}`;
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  // ── Cleanup ──────────────────────────────────────────────────────────────
  await prisma.auditLog.deleteMany({});
  await prisma.activationAttempt.deleteMany({});
  await prisma.usage.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.esim.deleteMany({});
  await prisma.walletLedger.deleteMany({});
  await prisma.walletTransaction.deleteMany({});
  await prisma.walletAttempt.deleteMany({});
  await prisma.topUpAttempt.deleteMany({});
  await prisma.topUpRequest.deleteMany({});
  await prisma.transaction.deleteMany({});
  await prisma.offer.deleteMany({});
  await prisma.segment.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.provider.deleteMany({});

  // ── Provider ─────────────────────────────────────────────────────────────
  const provider = await prisma.provider.create({
    data: { name: 'MockProvider', apiKey: 'mock-key', apiUrl: 'https://mock.netyfly.com' },
  });

  // ── Offers ───────────────────────────────────────────────────────────────
  const offersData: any[] = [];

  // Local offers
  for (const cc of LOCAL_COUNTRIES) {
    const isPremium = PREMIUM.has(cc);
    const netType = networkFor(cc);

    for (const days of DURATIONS) {
      for (const gb of DATA_TIERS[days]) {
        offersData.push({
          country: COUNTRY_NAME[cc],
          Region: COUNTRY_REGION[cc],
          Destination: COUNTRY_NAME[cc],
          Category: 'LOCAL',
          title: `${COUNTRY_NAME[cc]} ${gb}GB ${days}d`,
          description: `${netType} local data plan — valid ${days} days`,
          popularity: String(randInt(10, 95)),
          coverageType: CoverageType.LOCAL,
          networkType: netType,
          dataVolume: gb * 1024,
          countryCode: cc,
          validityDays: days,
          price: tndToInt(localPrice(gb, days, isPremium)),
          InternalMargin: isPremium ? 14 : 10,
          providerId: provider.id,
        });
      }
      // Unlimited plan
      const unlimitedBase = isPremium ? 22 : 14;
      offersData.push({
        country: COUNTRY_NAME[cc],
        Region: COUNTRY_REGION[cc],
        Destination: COUNTRY_NAME[cc],
        Category: 'LOCAL',
        title: `${COUNTRY_NAME[cc]} Unlimited ${days}d`,
        description: `Unlimited ${netType} local plan — valid ${days} days`,
        popularity: String(randInt(40, 95)),
        coverageType: CoverageType.LOCAL,
        networkType: netType,
        dataVolume: UNLIMITED_DATA_TOTAL,
        countryCode: cc,
        validityDays: days,
        price: tndToInt(unlimitedBase * UNLIMITED_MULT[days]),
        InternalMargin: 16,
        providerId: provider.id,
      });
    }
  }

  // Regional offers
  const regionalBundles = [
    { name: 'Europe',             code: 'EU',   net: '4G/5G' },
    { name: 'Middle East & Africa', code: 'MEA', net: '4G'   },
    { name: 'Asia Pacific',       code: 'APAC', net: '5G'    },
    { name: 'Americas',           code: 'AME',  net: '5G'    },
    { name: 'North Africa',       code: 'NAF',  net: '4G'    },
  ];
  for (const region of regionalBundles) {
    for (const days of DURATIONS) {
      for (const gb of DATA_TIERS[days]) {
        offersData.push({
          country: region.name, Region: region.name, Destination: region.name, Category: 'REGIONAL',
          title: `${region.name} ${gb}GB ${days}d`,
          description: `${region.net} regional plan covering ${region.name}`,
          popularity: String(randInt(20, 90)),
          coverageType: CoverageType.REGIONAL,
          networkType: region.net,
          dataVolume: gb * 1024,
          countryCode: region.code,
          validityDays: days,
          price: tndToInt(localPrice(gb, days, true) * 2),
          InternalMargin: 14,
          providerId: provider.id,
        });
      }
      offersData.push({
        country: region.name, Region: region.name, Destination: region.name, Category: 'REGIONAL',
        title: `${region.name} Unlimited ${days}d`,
        description: `Unlimited ${region.net} regional plan`,
        popularity: String(randInt(50, 95)),
        coverageType: CoverageType.REGIONAL,
        networkType: region.net,
        dataVolume: UNLIMITED_DATA_TOTAL,
        countryCode: region.code,
        validityDays: days,
        price: tndToInt(32 * UNLIMITED_MULT[days]),
        InternalMargin: 18,
        providerId: provider.id,
      });
    }
  }

  // Global offers
  const globalTiers: Record<number, number[]> = { 7:[5,10], 15:[10,20], 30:[20,50], 60:[50,100] };
  for (const days of DURATIONS) {
    for (const gb of globalTiers[days]) {
      offersData.push({
        country: 'Global', Region: 'Global', Destination: 'Global', Category: 'GLOBAL',
        title: `Global ${gb}GB ${days}d`,
        description: 'Multi-country global data plan',
        popularity: String(randInt(20, 80)),
        coverageType: CoverageType.GLOBAL,
        networkType: '4G/5G',
        dataVolume: gb * 1024,
        countryCode: 'GLOBAL',
        validityDays: days,
        price: tndToInt(localPrice(gb, days, true) * 3),
        InternalMargin: 20,
        providerId: provider.id,
      });
    }
    offersData.push({
      country: 'Global', Region: 'Global', Destination: 'Global', Category: 'GLOBAL',
      title: `Global Unlimited ${days}d`,
      description: 'Unlimited global connectivity',
      popularity: String(randInt(60, 95)),
      coverageType: CoverageType.GLOBAL,
      networkType: '4G/5G',
      dataVolume: UNLIMITED_DATA_TOTAL,
      countryCode: 'GLOBAL',
      validityDays: days,
      price: tndToInt(40 * UNLIMITED_MULT[days]),
      InternalMargin: 22,
      providerId: provider.id,
    });
  }

  await prisma.offer.createMany({ data: offersData });
  const offers = await prisma.offer.findMany({ where: { providerId: provider.id } });
  const limitedLocalOffers  = offers.filter(o => o.coverageType === CoverageType.LOCAL && o.dataVolume !== null && o.dataVolume < UNLIMITED_DATA_TOTAL);
  const unlimitedLocalOffers = offers.filter(o => o.coverageType === CoverageType.LOCAL && o.dataVolume === UNLIMITED_DATA_TOTAL);

  // ── Users ─────────────────────────────────────────────────────────────────
  const pwd = await bcrypt.hash('password123', 10);

  // Admin
  const admin = await prisma.user.create({
    data: { firstname: 'Admin', lastname: 'NetyFly', email: 'admin@netyfly.tn', hashedPassword: pwd, role: Role.ADMIN },
  });

  // Zone chiefs
  const zoneChief = await prisma.user.create({
    data: { firstname: 'Sofien', lastname: 'Ben Ali', email: 'zonechief@netyfly.tn', hashedPassword: pwd, role: Role.ZONE_CHIEF },
  });

  // Salesmen (SALESMAN role)
  const salesmanSeeds = [
    { firstname: 'Yassine', lastname: 'Trabelsi', email: 'yassine@netyfly.tn',  balance: 0 },
    { firstname: 'Mariem',  lastname: 'Bouaziz',  email: 'mariem@netyfly.tn',   balance: 0 },
    { firstname: 'Khalil',  lastname: 'Mansouri', email: 'khalil@netyfly.tn',   balance: 0 },
    { firstname: 'Test',    lastname: 'Salesman',  email: 'salesman@netyfly.tn', balance: 0 },
  ];
  const salesmen = await Promise.all(
    salesmanSeeds.map(s =>
      prisma.user.create({ data: { ...s, hashedPassword: pwd, role: Role.SALESMAN } })
    )
  );

  // Customers
  const customerSeeds = [
    { firstname: 'Sami',  lastname: 'Gharbi',    email: 'sami@gmail.com'  },
    { firstname: 'Ines',  lastname: 'Belhaj',    email: 'ines@gmail.com'  },
    { firstname: 'Omar',  lastname: 'Chaabane',  email: 'omar@gmail.com'  },
    { firstname: 'Lina',  lastname: 'Ferchichi', email: 'lina@gmail.com'  },
    { firstname: 'Nour',  lastname: 'Ayari',     email: 'nour@gmail.com'  },
    { firstname: 'Rami',  lastname: 'Slimani',   email: 'rami@gmail.com'  },
    { firstname: 'Fatma', lastname: 'Jemai',     email: 'fatma@gmail.com' },
    { firstname: 'Amir',  lastname: 'Khelifi',   email: 'amir@gmail.com'  },
  ];
  const customers = await Promise.all(
    customerSeeds.map(c =>
      prisma.user.create({ data: { ...c, hashedPassword: pwd, role: Role.CUSTOMER } })
    )
  );

  // ── Customer eSIMs ────────────────────────────────────────────────────────
  let failedChainCreated = false;

  for (let i = 0; i < customers.length; i++) {
    const customer = customers[i];

    // Each customer gets: 1 ACTIVE limited, 1 EXPIRED, optionally 1 ACTIVE unlimited
    const plans: { offer: typeof limitedLocalOffers[0] | typeof unlimitedLocalOffers[0]; status: EsimStatus; unlimited: boolean }[] = [
      { offer: randItem(limitedLocalOffers),  status: EsimStatus.ACTIVE,   unlimited: false },
      { offer: randItem(limitedLocalOffers),  status: EsimStatus.EXPIRED,  unlimited: false },
    ];

    // First 4 customers also get an unlimited active eSIM
    if (i < 4) {
      plans.push({ offer: randItem(unlimitedLocalOffers), status: EsimStatus.ACTIVE, unlimited: true });
    }
    // First 3 customers also get a NOT_ACTIVE one
    if (i < 3) {
      plans.push({ offer: randItem(limitedLocalOffers), status: EsimStatus.NOT_ACTIVE, unlimited: false });
    }

    for (const plan of plans) {
      const { offer, status, unlimited } = plan;
      const now = new Date();
      const expiryDate = status === EsimStatus.EXPIRED
        ? new Date(now.getTime() - randInt(1, 10) * 24 * 60 * 60 * 1000)
        : new Date(now.getTime() + randInt(60, 120) * 24 * 60 * 60 * 1000);

      const dataTotal = unlimited
        ? UNLIMITED_DATA_TOTAL
        : (offer.dataVolume ?? 0);

      const dataUsed = status === EsimStatus.NOT_ACTIVE
        ? 0
        : unlimited
          ? randInt(500, 5000)
          : Math.floor(dataTotal * randInt(10, 75) / 100);

      // NOT_ACTIVE → PAID  : payment done, user hasn't activated yet (activateAfterPayment requires PAID)
      // ACTIVE / EXPIRED / FAILED → COMPLETED : fully processed
      const txStatus = status === EsimStatus.NOT_ACTIVE
        ? TransactionStatus.PAID
        : TransactionStatus.COMPLETED;

      const tx = await prisma.transaction.create({
        data: {
          status: txStatus,
          type: TransactionType.PURCHASE,
          channel: TransactionChannel.B2C,
          amount: offer.price,
          currency: 'TND',
          userId: customer.id,
          offerId: offer.id,
        },
      });

      const esim = await prisma.esim.create({
        data: {
          iccid: randomIccid(),
          activationCode: activationCode(offer.id),
          status,
          dataTotal,
          dataUsed,
          lastUsageSync: status === EsimStatus.ACTIVE ? new Date() : null,
          expiryDate,
          userId: customer.id,
          transactionId: tx.id,
          offerId: offer.id,
          providerId: provider.id,
        },
      });

      await prisma.payment.create({
        data: {
          paymentProvider: 'CLICTOPAY',
          providerRefId: `ORD-${tx.id}`,
          gatewayPaymentId: `GW-${tx.id}-${randInt(1000, 9999)}`,
          amount: tx.amount,
          status: 'COMPLETED',
          rawResponse: { orderStatus: 2 },
          userId: customer.id,
          transactionId: tx.id,
        },
      });

      // Audit chain
      const chain: SystemEvent[] = !failedChainCreated
        ? [SystemEvent.PAYMENT_INITIATED, SystemEvent.PAYMENT_CONFIRMED, SystemEvent.PROVISIONING_STARTED, SystemEvent.PROVISIONING_FAILED]
        : [SystemEvent.PAYMENT_INITIATED, SystemEvent.PAYMENT_CONFIRMED, SystemEvent.PROVISIONING_STARTED, SystemEvent.PROVISIONING_SUCCESS, SystemEvent.ACTIVATION_REQUESTED, SystemEvent.ACTIVATION_SUCCESS];

      for (const ev of chain) {
        const evStr = ev.toString();
        await prisma.auditLog.create({
          data: {
            layer: evStr.startsWith('PAYMENT') ? AuditLayer.PAYMENT
                 : evStr.startsWith('ACTIVATION') ? AuditLayer.ACTIVATION
                 : AuditLayer.PROVISIONING,
            event: ev,
            statusDomain: statusDomain.TRANSACTION,
            triggeredBy: AuditTrigger.SYSTEM,
            toStatus: tx.status,
            userId: customer.id,
            transactionId: tx.id,
          },
        });
      }

      if (!failedChainCreated) {
        await prisma.esim.update({ where: { id: esim.id }, data: { status: EsimStatus.FAILED } });
        failedChainCreated = true;
      }
    }
  }

  // ── Salesman wallets ──────────────────────────────────────────────────────
  for (const salesman of salesmen) {
    let balance = 0;
    const anchor = await prisma.walletTransaction.create({
      data: { userId: salesman.id, amount: 0, paymentMethod: 'CASH', status: WalletStatus.COMMITTED, balanceAfter: 0 },
    });

    // 2-4 top-up credits
    const topUpCount = randInt(2, 4);
    for (let i = 0; i < topUpCount; i++) {
      const amount = randInt(300, 1000) * 1000;
      balance += amount;
      await prisma.walletTransaction.create({
        data: { userId: salesman.id, amount, paymentMethod: i % 2 === 0 ? 'CASH' : 'CARD', status: WalletStatus.COMMITTED, balanceAfter: balance },
      });
      await prisma.walletLedger.create({
        data: { walletId: anchor.id, amount, type: LedgerType.CREDIT, reason: LedgerReason.TOP_UP, referenceId: randInt(10000, 99999) },
      });
    }

    // 2-5 B2B2C purchases (debits)
    const purchaseCount = randInt(2, 5);
    for (let i = 0; i < purchaseCount; i++) {
      const amount = randInt(50, 250) * 1000;
      if (balance - amount < 0) continue;
      balance -= amount;
      await prisma.walletTransaction.create({
        data: { userId: salesman.id, amount, paymentMethod: 'WALLET', status: WalletStatus.COMMITTED, balanceAfter: balance },
      });
      await prisma.walletLedger.create({
        data: { walletId: anchor.id, amount, type: LedgerType.DEBIT, reason: LedgerReason.COMMIT, referenceId: randInt(10000, 99999) },
      });
    }

    await prisma.user.update({ where: { id: salesman.id }, data: { balance } });

    await prisma.topUpRequest.createMany({
      data: [
        { salesmanId: salesman.id, amount: randInt(300, 800) * 1000,  paymentMethod: 'CASH', status: TopUpStatus.CREDITED, reviewedBy: zoneChief.id },
        { salesmanId: salesman.id, amount: randInt(300, 800) * 1000,  paymentMethod: 'CARD', status: TopUpStatus.CREDITED, reviewedBy: zoneChief.id },
        { salesmanId: salesman.id, amount: randInt(200, 600) * 1000,  paymentMethod: 'CASH', status: TopUpStatus.PENDING  },
        { salesmanId: salesman.id, amount: randInt(100, 400) * 1000,  paymentMethod: 'CARD', status: TopUpStatus.REJECTED, reviewedBy: zoneChief.id },
      ],
    });
  }

  // ── Salesman B2B2C transactions ───────────────────────────────────────────
  const b2b2cCustomerNames = [
    'Sami Gharbi', 'Ines Belhaj', 'Omar Chaabane', 'Lina Ferchichi',
    'Nour Ayari', 'Rami Slimani', 'Fatma Jemai', 'Amir Khelifi',
    'Mehdi Zouari', 'Sara Hamdi', 'Youssef Ben Salem', 'Amira Trabelsi',
    'Karim Jebali', 'Rim Bouaziz', 'Amine Mansouri', 'Donia Chaabane',
  ];

  const b2b2cStatuses = [
    TransactionStatus.COMPLETED, TransactionStatus.COMPLETED, TransactionStatus.COMPLETED,
    TransactionStatus.COMPLETED, TransactionStatus.COMPLETED,
    TransactionStatus.PENDING, TransactionStatus.PENDING,
    TransactionStatus.FAILED,
  ];

  const now = new Date();

  for (const salesman of salesmen) {
    const txCount = randInt(8, 15);
    for (let i = 0; i < txCount; i++) {
      const offer = randItem(limitedLocalOffers);
      const status = randItem(b2b2cStatuses);
      const daysAgo = randInt(0, 29);
      const createdAt = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

      await prisma.transaction.create({
        data: {
          status,
          type: TransactionType.PURCHASE,
          channel: TransactionChannel.B2B2C,
          amount: offer.price,
          currency: 'TND',
          userId: salesman.id,
          offerId: offer.id,
          createdAt,
        },
      });
    }
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  const totalOffers = await prisma.offer.count();
  const totalEsims  = await prisma.esim.count();
  const totalTx     = await prisma.transaction.count();

  console.log('\n✅ Seed completed\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  Offers created   : ${totalOffers}`);
  console.log(`  eSIMs created    : ${totalEsims}`);
  console.log(`  Transactions     : ${totalTx}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  TEST ACCOUNTS (password: password123)');
  console.log('─────────────────────────────────────────────');
  console.log(`  [ADMIN]      admin@netyfly.tn`);
  console.log(`  [ZONE_CHIEF] zonechief@netyfly.tn`);
  console.log(`  [SALESMAN]   salesman@netyfly.tn`);
  console.log(`  [SALESMAN]   yassine@netyfly.tn`);
  console.log(`  [CUSTOMER]   sami@gmail.com`);
  console.log(`  [CUSTOMER]   ines@gmail.com`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
