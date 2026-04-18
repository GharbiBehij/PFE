import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is not set.');
}

const pool = new Pool({ connectionString: databaseUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

type CountrySeed = {
  country: string;
  region: string;
  destination: string;
};

type OfferTemplate = {
  category: 'TOURIST' | 'BUSINESS' | 'UNLIMITED' | 'STANDARD' | 'PREMIUM' | 'LITE';
  dataVolume: number;
  coverageType: 'LOCAL' | 'REGIONAL' | 'GLOBAL';
  validityDays: number;
  price: number;
  margin: number;
  title: string;
  description: string;
  popularity: 'HIGH' | 'MEDIUM' | 'LOW';
};

const countries: CountrySeed[] = [
  // Europe
  { country: 'France', region: 'Europe', destination: 'Paris' },
  { country: 'Spain', region: 'Europe', destination: 'Barcelona' },
  { country: 'Italy', region: 'Europe', destination: 'Rome' },
  { country: 'Germany', region: 'Europe', destination: 'Berlin' },
  { country: 'United Kingdom', region: 'Europe', destination: 'London' },
  { country: 'Greece', region: 'Europe', destination: 'Athens' },
  { country: 'Portugal', region: 'Europe', destination: 'Lisbon' },

  // Asia / Middle East
  { country: 'Japan', region: 'Asia', destination: 'Tokyo' },
  { country: 'Thailand', region: 'Asia', destination: 'Bangkok' },
  { country: 'Singapore', region: 'Asia', destination: 'Singapore' },
  { country: 'South Korea', region: 'Asia', destination: 'Seoul' },
  { country: 'UAE', region: 'Middle East', destination: 'Dubai' },

  // Americas
  { country: 'USA', region: 'North America', destination: 'New York' },
  { country: 'Canada', region: 'North America', destination: 'Toronto' },
  { country: 'Mexico', region: 'North America', destination: 'Cancun' },

  // Oceania
  { country: 'Australia', region: 'Oceania', destination: 'Sydney' },
];

// Exactly 8 templates so each country gets 8 offers.
// Price range target: 1500 to 7000 (millimes).
const offerTemplates: OfferTemplate[] = [
  {
    category: 'TOURIST',
    coverageType: 'LOCAL',
    dataVolume: 1000,
    validityDays: 7,
    price: 1500,
    margin: 200,
    title: '1GB Tourist Plan',
    description: 'Good for maps, chat, and light browsing on short trips.',
    popularity: 'HIGH',
  },
  {
    category: 'TOURIST',
    coverageType: 'REGIONAL',
    dataVolume: 3000,
    validityDays: 15,
    price: 2500,
    margin: 300,
    title: '3GB Tourist Plan',
    description: 'Balanced option for typical 1-2 week vacations.',
    popularity: 'HIGH',
  },
  {
    category: 'TOURIST',
    coverageType: 'GLOBAL',         
    dataVolume: 5000,
    validityDays: 30,
    price: 3500,
    margin: 450,
    title: '5GB Tourist Plan',
    description: 'Comfortable monthly allowance for frequent travelers.',
    popularity: 'MEDIUM',
  },
  {
    category: 'BUSINESS',
    coverageType: 'GLOBAL',
    dataVolume: 10000,
    validityDays: 30,
    price: 4500,
    margin: 600,
    title: '10GB Business Plan',
    description: 'Reliable plan for calls, hotspot, and remote work needs.',
    popularity: 'HIGH',
  },
  {
    category: 'UNLIMITED',
    coverageType: 'GLOBAL', 
    dataVolume: 100000,
    validityDays: 30,
    price: 7000,
    margin: 900,
    title: 'Unlimited Monthly',
    description: 'High-cap usage for streaming, uploads, and heavy browsing.',
    popularity: 'MEDIUM',
  },
  {
    category: 'STANDARD',
    coverageType: 'REGIONAL',
    dataVolume: 7000,
    validityDays: 30,
    price: 4000,
    margin: 500,
    title: '7GB Standard Plan',
    description: 'Everyday data plan with good value and stable coverage.',
    popularity: 'HIGH',
  },
  {
    category: 'PREMIUM',
    coverageType: 'GLOBAL',
    dataVolume: 20000,
    validityDays: 30,
    price: 6000,
    margin: 800,
    title: '20GB Premium Plan',
    description: 'Premium connectivity tier with strong performance.',
    popularity: 'LOW',
  },
  {
    category: 'LITE',
    coverageType: 'LOCAL',
    dataVolume: 500,
    validityDays: 7,
    price: 1800,
    margin: 180,
    title: '500MB Lite Plan',
    description: 'Minimum data package for backup and emergency usage.',
    popularity: 'LOW',
  },
];

async function main() {
  console.log('Starting seed...');

  const offerColumns = await prisma.$queryRawUnsafe<Array<{ column_name: string }>>(
    `SELECT column_name
     FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name IN ('Offer', 'offer')`,
  );
  const columnSet = new Set(offerColumns.map((col) => col.column_name));

  const hasModernOfferColumns =
    columnSet.has('Region') &&
    columnSet.has('Destination') &&
    columnSet.has('Category') &&
    columnSet.has('InternalMargin');

  const hasLegacyOfferColumns =
    columnSet.has('region') &&
    columnSet.has('destination') &&
    columnSet.has('category') &&
    columnSet.has('internalMargin');

  const pickColumn = (...candidates: string[]) =>
    candidates.find((candidate) => columnSet.has(candidate)) ?? null;

  const regionColumn = pickColumn('Region', 'region');
  const destinationColumn = pickColumn('Destination', 'destination');
  const categoryColumn = pickColumn('Category', 'category');
  const internalMarginColumn = pickColumn('InternalMargin', 'internalMargin');
  const createdAtColumn = pickColumn('createdAt', 'createdat');
  const updatedAtColumn = pickColumn('updatedAt', 'updatedat');

  const coverageColumnName = columnSet.has('coverageType')
    ? 'coverageType'
    : columnSet.has('coveragetype')
      ? 'coveragetype'
      : null;
  const hasCoverageTypeColumn = coverageColumnName !== null;

  if (!hasCoverageTypeColumn) {
    console.warn(
      'coverageType column not found in Offer table; seeding without coverageType values.',
    );
  }

  console.log('Ensuring provider exists...');
  const provider = await prisma.provider.upsert({
    where: { id: 1 },
    update: {
      name: 'GlobaleSIM',
      apiUrl: 'https://api.example.com',
      apiKey: 'seed-api-key',
    },
    create: {
      id: 1,
      name: 'GlobaleSIM',
      apiUrl: 'https://api.example.com',
      apiKey: 'seed-api-key',
    },
  });
  console.log(`Provider ready: ${provider.name}`);

  console.log('Cleaning existing offers...');
  await prisma.offer.deleteMany({});
  console.log('Existing offers cleared');

  console.log('Creating sample offers...');
  const offersData = countries.flatMap((location) =>
    offerTemplates.map((template) => ({
      country: location.country,
      Region: location.region,
      Destination: location.destination,
      Category: template.category,
      title: `${location.country} - ${template.title}`,
      description: template.description,
      popularity: template.popularity,
      ...(hasCoverageTypeColumn
        ? { coverageType: template.coverageType }
        : {}),
      dataVolume: template.dataVolume,
      validityDays: template.validityDays,
      price: template.price,
      InternalMargin: template.margin,
      providerId: provider.id,
      isDeleted: false,
    })),
  );

  let createdCount = 0;
  if (hasModernOfferColumns && hasCoverageTypeColumn) {
    const created = await prisma.offer.createMany({
      data: offersData,
    });
    createdCount = created.count;
  } else if (
    (hasModernOfferColumns || hasLegacyOfferColumns) &&
    regionColumn &&
    destinationColumn &&
    categoryColumn &&
    internalMarginColumn
  ) {
    console.warn(
      'Offer schema is not fully compatible with Prisma createMany; using raw SQL insert fallback for seed.',
    );

    for (const location of countries) {
      for (const template of offerTemplates) {
        const now = new Date();
        const columns: string[] = [
          'country',
          regionColumn,
          destinationColumn,
          categoryColumn,
          'title',
          'description',
          'popularity',
          'dataVolume',
          'validityDays',
          'price',
          internalMarginColumn,
          'providerId',
          'isDeleted',
        ];
        const values: Array<string | number | boolean> = [
          location.country,
          location.region,
          location.destination,
          template.category,
          `${location.country} - ${template.title}`,
          template.description,
          template.popularity,
          template.dataVolume,
          template.validityDays,
          template.price,
          template.margin,
          provider.id,
          false,
        ];

        if (createdAtColumn) {
          columns.push(createdAtColumn);
          values.push(now.toISOString());
        }

        if (updatedAtColumn) {
          columns.push(updatedAtColumn);
          values.push(now.toISOString());
        }

        if (coverageColumnName) {
          columns.push(coverageColumnName);
          values.push(template.coverageType);
        }

        const quotedColumns = columns.map((col) => `"${col}"`).join(', ');
        const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');

        await prisma.$executeRawUnsafe(
          `INSERT INTO "Offer" (${quotedColumns}) VALUES (${placeholders})`,
          ...values,
        );
        createdCount += 1;
      }
    }
  } else {
    throw new Error(
      'Unsupported Offer table schema. Expected either modern (Region/Destination/Category/InternalMargin) or legacy lowercase columns.',
    );
  }

  console.log(`Created ${createdCount} offers across ${countries.length} countries`);

  console.log('\nSeed summary:');
  const totalOffers = await prisma.offer.count({
    where: { isDeleted: false },
  });

  const totalCountries = await prisma.offer.groupBy({
    by: ['country'],
    where: { isDeleted: false },
  });

  const categories = hasModernOfferColumns
    ? await prisma.offer.groupBy({
        by: ['Category'],
        where: { isDeleted: false },
        _count: { id: true },
        orderBy: { Category: 'asc' },
      })
    : await prisma.$queryRawUnsafe<Array<{ Category: string; count: number }>>(
        `SELECT "category" AS "Category", COUNT(*)::int AS "count"
         FROM "Offer"
         WHERE "isDeleted" = false
         GROUP BY "category"
         ORDER BY "category" ASC`,
      );

  const minPrice = await prisma.offer.aggregate({
    where: { isDeleted: false },
    _min: { price: true },
  });

  const maxPrice = await prisma.offer.aggregate({
    where: { isDeleted: false },
    _max: { price: true },
  });

  console.log(`  Total offers: ${totalOffers}`);
  console.log(`  Total countries: ${totalCountries.length}`);
  console.log(`  Price range (millimes): ${minPrice._min.price ?? 0} -> ${maxPrice._max.price ?? 0}`);
  console.log('  Categories:');
  for (const category of categories) {
    const count = '_count' in category ? category._count.id : category.count;
    console.log(`    - ${category.Category}: ${count} offers`);
  }

  console.log('\nSeed completed successfully');
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
