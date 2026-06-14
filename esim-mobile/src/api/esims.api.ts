import { apiClient } from './client';
import type { Esim } from '../types/esim';
import type { Offer } from '../types/offer';

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

const normalizeDataVolume = (value: unknown): string => {
  if (typeof value === 'string') {
    const up = value.trim().toUpperCase();
    if (up.includes('GB') || up.includes('MB')) return up;
    const n = Number(up);
    if (!Number.isFinite(n)) return value.trim();
    if (n >= 999_999) return 'Illimité';
    return n >= 1024 ? `${(n / 1024).toFixed(n % 1024 === 0 ? 0 : 1)}GB` : `${Math.round(n)}MB`;
  }
  const n = Number(value);
  if (!Number.isFinite(n)) return '--';
  if (n >= 999_999) return 'Illimité';
  return n >= 1024 ? `${(n / 1024).toFixed(n % 1024 === 0 ? 0 : 1)}GB` : `${Math.round(n)}MB`;
};

const normalizeEsimOffer = (raw: Record<string, unknown>): Offer => ({
  id: asNumber(raw.id) ?? 0,
  title: asString(raw.title),
  country: asString(raw.country),
  countryCode: asString(raw.countryCode),
  dataVolume: normalizeDataVolume(raw.dataVolume),
  validityDays: asNumber(raw.validityDays) ?? 0,
  price: (asNumber(raw.price) ?? 0) / 1000,
  currency: asString(raw.currency, 'TND') || 'TND',
  providerId: asString(raw.providerId),
  description: asString(raw.description) || undefined,
  networkType: asString(raw.networkType) || undefined,
});

const normalizeStatus = (value: unknown): Esim['status'] => {
  const normalized = asString(value, 'NOT_ACTIVE').toUpperCase();
  if (normalized === 'ACTIVE') {
    return 'ACTIVE';
  }
  if (normalized === 'EXPIRED' || normalized === 'DELETED' || normalized === 'FAILED') {
    return normalized;
  }
  return 'NOT_ACTIVE';
};

const normalizeEsim = (rawValue: unknown): Esim => {
  const raw = asRecord(rawValue);
  const rawOffer = asRecord(raw.offer);
  const country = asString(raw.country || rawOffer.country, 'Destination');
  const offer = raw.offer && typeof raw.offer === 'object'
    ? normalizeEsimOffer(rawOffer)
    : undefined;

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
    offer,
    transactionId: raw.transactionId != null ? asString(raw.transactionId) : undefined,
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

  if (Array.isArray(root.active) || Array.isArray(root.pending) || Array.isArray(root.expired)) {
    return [
      ...asArray(root.active),
      ...asArray(root.pending),
      ...asArray(root.expired),
    ].map(normalizeEsim);
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
  getTopupOffers: async (esimId: string) => {
    const response = await apiClient.get(`/esim/${esimId}/topup-offers`);
    return response.data;
  },
  topupEsim: async (esimId: string, offerId: number, paymentMethod: string) => {
    const response = await apiClient.post(`/esims/${esimId}/topup`, {
      offerId,
      paymentMethod,
    });
    return response.data;
  },
  activate: async (esimId: number, transactionId: number) => {
    const response = await apiClient.post(`/esims/${esimId}/activate`, {
      transactionId,
    });
    return response.data as { transactionId: number; esimId: number; message: string; status: string };
  },
};
