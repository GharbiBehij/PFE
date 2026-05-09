// prisma/seed.ts

import { PrismaClient, CoverageType, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// ── Pricing tables by region ────────────────────────────────────────────────
// Price in TND · dataVolume in MB

type OfferTier = {
  validityDays: number;
  dataVolume: number;  // MB
  price: number;       // TND
};

// Base tiers — adjusted per region below
const europeTiers: OfferTier[] = [
  { validityDays: 7,  dataVolume: 1024,  price: 5  },
  { validityDays: 7,  dataVolume: 3072,  price: 9  },
  { validityDays: 15, dataVolume: 3072,  price: 12 },
  { validityDays: 15, dataVolume: 5120,  price: 16 },
  { validityDays: 15, dataVolume: 10240, price: 24 },
  { validityDays: 30, dataVolume: 5120,  price: 19 },
  { validityDays: 30, dataVolume: 10240, price: 32 },
  { validityDays: 30, dataVolume: 20480, price: 49 },
];

const asiaTiers: OfferTier[] = [
  { validityDays: 7,  dataVolume: 1024,  price: 6  },
  { validityDays: 7,  dataVolume: 3072,  price: 11 },
  { validityDays: 15, dataVolume: 3072,  price: 14 },
  { validityDays: 15, dataVolume: 5120,  price: 18 },
  { validityDays: 15, dataVolume: 10240, price: 27 },
  { validityDays: 30, dataVolume: 5120,  price: 22 },
  { validityDays: 30, dataVolume: 10240, price: 36 },
  { validityDays: 30, dataVolume: 20480, price: 55 },
];

const middleEastTiers: OfferTier[] = [
  { validityDays: 7,  dataVolume: 1024,  price: 7  },
  { validityDays: 7,  dataVolume: 3072,  price: 12 },
  { validityDays: 15, dataVolume: 3072,  price: 16 },
  { validityDays: 15, dataVolume: 5120,  price: 21 },
  { validityDays: 15, dataVolume: 10240, price: 30 },
  { validityDays: 30, dataVolume: 5120,  price: 25 },
  { validityDays: 30, dataVolume: 10240, price: 40 },
  { validityDays: 30, dataVolume: 20480, price: 60 },
];

const northAmericaTiers: OfferTier[] = [
  { validityDays: 7,  dataVolume: 1024,  price: 8  },
  { validityDays: 7,  dataVolume: 3072,  price: 13 },
  { validityDays: 15, dataVolume: 3072,  price: 17 },
  { validityDays: 15, dataVolume: 5120,  price: 22 },
  { validityDays: 15, dataVolume: 10240, price: 32 },
  { validityDays: 30, dataVolume: 5120,  price: 26 },
  { validityDays: 30, dataVolume: 10240, price: 42 },
  { validityDays: 30, dataVolume: 20480, price: 65 },
];

const oceaniaTiers: OfferTier[] = [
  { validityDays: 7,  dataVolume: 1024,  price: 7  },
  { validityDays: 7,  dataVolume: 3072,  price: 12 },
  { validityDays: 15, dataVolume: 3072,  price: 15 },
  { validityDays: 15, dataVolume: 5120,  price: 20 },
  { validityDays: 15, dataVolume: 10240, price: 29 },
  { validityDays: 30, dataVolume: 5120,  price: 24 },
  { validityDays: 30, dataVolume: 10240, price: 38 },
  { validityDays: 30, dataVolume: 20480, price: 58 },
];

const regionalTiers: OfferTier[] = [
  { validityDays: 7,  dataVolume: 3072,  price: 18 },
  { validityDays: 7,  dataVolume: 5120,  price: 25 },
  { validityDays: 15, dataVolume: 5120,  price: 30 },
  { validityDays: 15, dataVolume: 10240, price: 42 },
  { validityDays: 15, dataVolume: 20480, price: 58 },
  { validityDays: 30, dataVolume: 10240, price: 55 },
  { validityDays: 30, dataVolume: 20480, price: 79 },
];

const globalTiers: OfferTier[] = [
  { validityDays: 7,  dataVolume: 3072,  price: 25 },
  { validityDays: 7,  dataVolume: 5120,  price: 35 },
  { validityDays: 15, dataVolume: 5120,  price: 42 },
  { validityDays: 15, dataVolume: 10240, price: 59 },
  { validityDays: 15, dataVolume: 20480, price: 79 },
  { validityDays: 30, dataVolume: 10240, price: 75 },
  { validityDays: 30, dataVolume: 20480, price: 99 },
];

// ── Countries per region ────────────────────────────────────────────────────

const europeCountries = [
  'France', 'Allemagne', 'Italie', 'Espagne', 'Grèce',
  'Portugal', 'Pays-Bas', 'Belgique', 'Suisse', 'Autriche',
  'Pologne', 'Croatie', 'Tchéquie', 'Hongrie',
];

const asiaCountries = [
  'Japon', 'Chine', 'Singapour', 'Thaïlande',
  'Corée du Sud', 'Inde', 'Indonésie', 'Malaisie',
];

const middleEastCountries = [
  'Émirats Arabes', 'Arabie Saoudite',
];

const northAmericaCountries = [
  'États-Unis', 'Canada', 'Mexique',
  'Costa Rica', 'Panama', 'Rép. Dominicaine',
];

const oceaniaCountries = [
  'Australie', 'Nouvelle-Zélande',
];

// ── Build offer records ─────────────────────────────────────────────────────

type OfferCreate = {
  country: string;
  Region: string;
  Destination: string;
  Category: string;
  title: string;
  description: string;
  popularity: string;
  coverageType: CoverageType;
  dataVolume: number;
  validityDays: number;
  price: number;
  InternalMargin: number;
  providerId: number;
  isDeleted: boolean;
};

const buildOffersForCountry = (
  country: string,
  region: string,
  coverageType: CoverageType,
  tiers: OfferTier[],
  providerId: number,
  popularity: 'HIGH' | 'MEDIUM' | 'LOW',
): OfferCreate[] => {
  return tiers.map((tier) => {
    const gbLabel = tier.dataVolume >= 1024
      ? `${tier.dataVolume / 1024}GB`
      : `${tier.dataVolume}MB`;

    return {
      country,
      Region: region,
      Destination: country,
      Category:
        coverageType === CoverageType.LOCAL
          ? 'Local'
          : coverageType === CoverageType.REGIONAL
            ? 'Regional'
            : 'Global',
      title: `${country} ${gbLabel} · ${tier.validityDays}j`,
      description: `Forfait eSIM ${country} — ${gbLabel} de données valable ${tier.validityDays} jours.`,
      popularity,
      coverageType,
      dataVolume: tier.dataVolume,
      validityDays: tier.validityDays,
      price: tier.price,
      InternalMargin: 20,
      providerId,
      isDeleted: false,
    };
  });
};

// ── Main seed ───────────────────────────────────────────────────────────────

async function main() {
  console.log('🌱 Seeding NetyFly database...\n');

  // ── 1. Provider ───────────────────────────────────────────────────────────

  const provider = await prisma.provider.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: 'Mock Provider',
      apiUrl: 'https://mock.provider.netyfly.com',
      apiKey: 'mock-api-key-for-testing',
    },
  });

  console.log(`✓ Provider: ${provider.name} (id=${provider.id})`);

  // ── 2. Users ──────────────────────────────────────────────────────────────

  const hashedPassword = await bcrypt.hash('Test1234!', 10);

  const client = await prisma.user.upsert({
    where: { email: 'client@netyfly.com' },
    update: {},
    create: {
      firstname: 'Hama',
      lastname: 'Gharbi',
      email: 'client@netyfly.com',
      hashedPassword,
      role: Role.CLIENT,
      balance: 0,
    },
  });

  const reseller = await prisma.user.upsert({
    where: { email: 'reseller@netyfly.com' },
    update: {},
    create: {
      firstname: 'Sami',
      lastname: 'Ben Ali',
      email: 'reseller@netyfly.com',
      hashedPassword,
      role: Role.SALESMAN,
      balance: 500,
    },
  });

  const zoneChief = await prisma.user.upsert({
    where: { email: 'chief@netyfly.com' },
    update: {},
    create: {
      firstname: 'Zone',
      lastname: 'Chief',
      email: 'chief@netyfly.com',
      hashedPassword,
      role: Role.ZONE_CHIEF,
      balance: 0,
    },
  });

  console.log(`✓ Users created:`);
  console.log(`  Client:     ${client.email}`);
  console.log(`  Reseller:   ${reseller.email}`);
  console.log(`  Zone Chief: ${zoneChief.email}`);

  // ── 3. Offers — clear and recreate ───────────────────────────────────────

  // Clean slate for offers — safe since no transactions exist yet
  await prisma.offer.deleteMany({});
  console.log(`\n✓ Cleared existing offers`);

  const allOffers: OfferCreate[] = [];

  // ── LOCAL — 8 tiers per country ──────────────────────────────────────────

  for (const country of europeCountries) {
    const popularity = ['France', 'Allemagne', 'Italie', 'Espagne', 'Grèce'].includes(country)
      ? 'HIGH' : 'MEDIUM';
    allOffers.push(
      ...buildOffersForCountry(country, 'Europe', CoverageType.LOCAL, europeTiers, provider.id, popularity as any),
    );
  }

  for (const country of asiaCountries) {
    const popularity = ['Japon', 'Singapour', 'Thaïlande'].includes(country)
      ? 'HIGH' : 'MEDIUM';
    allOffers.push(
      ...buildOffersForCountry(country, 'Asia', CoverageType.LOCAL, asiaTiers, provider.id, popularity as any),
    );
  }

  for (const country of middleEastCountries) {
    allOffers.push(
      ...buildOffersForCountry(country, 'Middle East', CoverageType.LOCAL, middleEastTiers, provider.id, 'HIGH'),
    );
  }

  for (const country of northAmericaCountries) {
    const popularity = ['États-Unis', 'Canada'].includes(country) ? 'HIGH' : 'MEDIUM';
    allOffers.push(
      ...buildOffersForCountry(country, 'North America', CoverageType.LOCAL, northAmericaTiers, provider.id, popularity as any),
    );
  }

  for (const country of oceaniaCountries) {
    allOffers.push(
      ...buildOffersForCountry(country, 'Oceania', CoverageType.LOCAL, oceaniaTiers, provider.id, 'MEDIUM'),
    );
  }

  // ── REGIONAL — 7 tiers per region ────────────────────────────────────────

  const regions = [
    { name: 'Europe',        region: 'Europe' },
    { name: 'Asia',          region: 'Asia' },
    { name: 'Middle East',   region: 'Middle East' },
    { name: 'North America', region: 'North America' },
    { name: 'Oceania',       region: 'Oceania' },
  ];

  for (const r of regions) {
    allOffers.push(
      ...buildOffersForCountry(r.name, r.region, CoverageType.REGIONAL, regionalTiers, provider.id, 'HIGH'),
    );
  }

  // ── GLOBAL — 7 tiers for Mondial ─────────────────────────────────────────

  allOffers.push(
    ...buildOffersForCountry('Mondial', 'Global', CoverageType.GLOBAL, globalTiers, provider.id, 'HIGH'),
  );

  // ── Insert all offers ─────────────────────────────────────────────────────

  await prisma.offer.createMany({ data: allOffers });

  // ── Summary ───────────────────────────────────────────────────────────────

  const localCount    = allOffers.filter((o) => o.coverageType === CoverageType.LOCAL).length;
  const regionalCount = allOffers.filter((o) => o.coverageType === CoverageType.REGIONAL).length;
  const globalCount   = allOffers.filter((o) => o.coverageType === CoverageType.GLOBAL).length;

  console.log(`\n✓ Offers created: ${allOffers.length} total`);
  console.log(`  LOCAL:    ${localCount} offers (${europeCountries.length + asiaCountries.length + middleEastCountries.length + northAmericaCountries.length + oceaniaCountries.length} countries × 8 tiers)`);
  console.log(`  REGIONAL: ${regionalCount} offers (5 regions × 7 tiers)`);
  console.log(`  GLOBAL:   ${globalCount} offers (Mondial × 7 tiers)`);

  console.log(`\n✅ Seed complete!\n`);
  console.log('Test credentials:');
  console.log('  Client:     client@netyfly.com   / Test1234!');
  console.log('  Reseller:   reseller@netyfly.com / Test1234!');
  console.log('  Zone Chief: chief@netyfly.com    / Test1234!');
  console.log('\nOffer tiers per destination:');
  console.log('  7 days:  1GB (5 TND), 3GB (9 TND)');
  console.log('  15 days: 3GB (12 TND), 5GB (16 TND), 10GB (24 TND)');
  console.log('  30 days: 5GB (19 TND), 10GB (32 TND), 20GB (49 TND)');
  console.log('  (Europe pricing — other regions vary slightly higher)');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });