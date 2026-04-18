import { apiClient } from './client';
import type { Destination, Offer } from '../types/offer';

const COUNTRY_CODE_MAP: Record<string, string> = {
  France: 'FR',
  Spain: 'ES',
  Italy: 'IT',
  Germany: 'DE',
  'United Kingdom': 'GB',
  UK: 'GB',
  USA: 'US',
  'United States': 'US',
  Turkey: 'TR',
  UAE: 'AE',
  Japan: 'JP',
  China: 'CN',
  Singapore: 'SG',
  Thailand: 'TH',
};

const asRecord = (value: unknown): Record<string, unknown> =>
  value !== null && typeof value === 'object' ? (value as Record<string, unknown>) : {};

const asArray = (value: unknown): Record<string, unknown>[] =>
  Array.isArray(value) ? value.map(asRecord) : [];

const asString = (value: unknown, fallback = ''): string => {
  if (typeof value === 'string') {
    return value;
  }

  if (value === null || value === undefined) {
    return fallback;
  }

  return String(value);
};

const asNumber = (value: unknown, fallback = 0): number => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
};

const toCountryCode = (country: string, input: unknown): string => {
  const candidate = asString(input).trim().toUpperCase();
  if (candidate.length === 2) {
    return candidate;
  }

  const fromMap = COUNTRY_CODE_MAP[country];
  if (fromMap) {
    return fromMap;
  }

  return country.trim().slice(0, 2).toUpperCase() || 'UN';
};

const normalizeDataVolume = (value: unknown): string => {
  if (typeof value === 'string') {
    const normalized = value.trim().toUpperCase();
    if (normalized.includes('GB') || normalized.includes('MB')) {
      return normalized;
    }

    const numericFromString = asNumber(normalized, 0);
    if (numericFromString >= 1024) {
      return `${(numericFromString / 1024).toFixed(numericFromString % 1024 === 0 ? 0 : 1)}GB`;
    }
    return `${Math.round(numericFromString)}MB`;
  }

  const numeric = asNumber(value, 0);
  if (numeric >= 1024) {
    return `${(numeric / 1024).toFixed(numeric % 1024 === 0 ? 0 : 1)}GB`;
  }

  return `${Math.round(numeric)}MB`;
};

const normalizeCoverageType = (value: unknown): Destination['coverageType'] => {
  const normalized = asString(value, 'LOCAL').toUpperCase();
  if (normalized === 'REGIONAL' || normalized === 'GLOBAL') {
    return normalized;
  }

  return 'LOCAL';
};

const normalizeOffer = (rawValue: unknown): Offer => {
  const raw = asRecord(rawValue);
  const country = asString(raw.country);
  const countryCode = toCountryCode(country, raw.countryCode);

  const popularityRaw = raw.popularity;
  let popularity: number | undefined;
  if (typeof popularityRaw === 'number' && Number.isFinite(popularityRaw)) {
    popularity = popularityRaw;
  } else {
    const map: Record<string, number> = { HIGH: 3, MEDIUM: 2, LOW: 1 };
    const mapped = map[asString(popularityRaw).toUpperCase()];
    popularity = mapped;
  }

  return {
    id: asString(raw.id),
    country,
    countryCode,
    dataVolume: normalizeDataVolume(raw.dataVolume),
    validityDays: asNumber(raw.validityDays),
    price: asNumber(raw.price),
    currency: asString(raw.currency, 'TND') || 'TND',
    providerId: asString(raw.providerId),
    description: asString(raw.description) || undefined,
    popularity,
  };
};

const normalizeDestination = (rawValue: unknown): Destination => {
  const raw = asRecord(rawValue);
  const country = asString(raw.country);
  const region = asString(raw.region || raw.Region);
  const startingPrice = asNumber(raw.startingPrice ?? raw.lowestPrice ?? raw.price);

  return {
    id: asString(raw.id, `${country}-${region}`),
    country,
    countryCode: toCountryCode(country, raw.countryCode),
    region,
    imageUrl: asString(raw.imageUrl) || undefined,
    startingPrice,
    coverageType: normalizeCoverageType(raw.coverageType),
  };
};

export const offersApi = {
  getOffers: async (country?: string) => {
    const response = await apiClient.get<unknown>('/offers', {
      params: country ? { country } : undefined,
    });
    return asArray(response.data).map(normalizeOffer);
  },
  getById: async (id: string) => {
    const response = await apiClient.get<unknown>(`/offers/${id}`);
    return normalizeOffer(response.data);
  },
  getPopular: async () => {
    const response = await apiClient.get<unknown>('/offers/popular');
    return asArray(response.data).map(normalizeOffer);
  },
  search: async (query: string) => {
    const response = await apiClient.get<unknown>('/offers/search', {
      params: { q: query },
    });
    return asArray(response.data).map(normalizeOffer);
  },
  getDestinations: async () => {
    const response = await apiClient.get<unknown>('/offers/destinations');
    return asArray(response.data).map(normalizeDestination);
  },
};
