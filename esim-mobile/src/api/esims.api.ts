import { apiClient } from './client';
import type { Esim } from '../types/esim';

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

const asNumber = (value: unknown): number | undefined => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : undefined;
};

const toCountryCode = (country: string, rawCountryCode: unknown): string => {
  const provided = asString(rawCountryCode).trim().toUpperCase();
  if (provided.length === 2) {
    return provided;
  }

  const safeCountry = country.trim().toUpperCase();
  return safeCountry.slice(0, 2) || 'UN';
};

const normalizeStatus = (value: unknown): Esim['status'] => {
  const normalized = asString(value, 'NOT_ACTIVE').toUpperCase();
  if (normalized === 'ACTIVE' || normalized === 'EXPIRED' || normalized === 'DELETED') {
    return normalized;
  }

  return 'NOT_ACTIVE';
};

const normalizeEsim = (rawValue: unknown): Esim => {
  const raw = asRecord(rawValue);
  const offer = asRecord(raw.offer);
  const country = asString(raw.country || offer.country, 'Destination');

  return {
    id: asString(raw.id),
    iccid: asString(raw.iccid),
    activationCode: asString(raw.activationCode || raw.qrCode),
    status: normalizeStatus(raw.status),
    dataUsed: asNumber(raw.dataUsed),
    dataTotal: asNumber(raw.dataTotal),
    expiryDate: asString(raw.expiryDate || raw.expiresAt) || undefined,
    country,
    countryCode: toCountryCode(country, raw.countryCode),
    createdAt: asString(raw.createdAt, new Date().toISOString()),
  };
};

const normalizeEsimListResponse = (payload: unknown): Esim[] => {
  if (Array.isArray(payload)) {
    return payload.map(normalizeEsim);
  }

  const root = asRecord(payload);
  if (Array.isArray(root.data)) {
    return asArray(root.data).map(normalizeEsim);
  }

  if (Array.isArray(root.active) || Array.isArray(root.expired)) {
    return [...asArray(root.active), ...asArray(root.expired)].map(normalizeEsim);
  }

  return [];
};

export const esimsApi = {
  getUserEsims: async () => {
    const response = await apiClient.get<unknown>('/esims');
    return normalizeEsimListResponse(response.data);
  },
  getById: async (id: string) => {
    const response = await apiClient.get<unknown>(`/esims/${id}`);
    return normalizeEsim(response.data);
  },
  sync: async (id: string) => {
    const response = await apiClient.post<unknown>(`/esims/${id}/sync-usage`);
    return normalizeEsim(response.data);
  },
  remove: async (id: string) => {
    await apiClient.delete(`/esims/${id}`);
  },
};
