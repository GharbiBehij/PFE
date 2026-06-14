import type { Offer } from './offer';

export type EsimStatus = 'NOT_ACTIVE' | 'ACTIVE' | 'EXPIRED' | 'DELETED' | 'FAILED';

export interface Esim {
  id: string;
  iccid: string;
  activationCode: string;
  status: EsimStatus;
  dataUsed?: number;
  dataTotal?: number;
  expiryDate?: string;
  country: string;
  countryCode?: string;
  offer?: Offer;
  createdAt: string;
  transactionId?: string;
}
