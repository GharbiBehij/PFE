import type { Esim } from './esim';
import type { Offer } from './offer';

export type PaymentMethod = 'card' | 'apple_pay' | 'wallet';
export type TransactionStatus = 'PENDING' | 'PROCESSING' | 'SUCCEEDED' | 'FAILED';

export interface PurchaseResult {
  transactionId: string;
  status: TransactionStatus;
  esimId?: string;
  message?: string;
}

export interface Transaction {
  id: string;
  status: TransactionStatus;
  amount: number;
  currency: string;
  channel: 'B2C' | 'B2B2C';
  offerId: string;
  offer?: Offer;
  esim?: Esim;
  createdAt: string;
}
