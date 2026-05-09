import type { Esim } from './esim';
import type { Offer } from './offer';

export type PaymentMethod = 'card' | 'apple_pay' | 'wallet' | 'cash';
export type TransactionStatus =
  | 'PENDING'
  | 'PENDING_PAYMENT'
  | 'PROCESSING'
  | 'PAID'
  | 'PROVISIONING'
  | 'COMPLETED'
  | 'FAILED'
  | 'SUCCEEDED'
  | 'AUTHORIZED'
  | 'EXPIRED'
  | 'REFUNDED';

export interface PurchaseResult {
  transactionId: number;
  status?: TransactionStatus | 'FAILED';
  channel?: 'B2C' | 'B2B2C';
  paymentUrl?: string;
  clientSecret?: string;
  type?: 'REDIRECT' | 'INTENT';
  esimId?: string;
  message?: string;
  error?: string;
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
  attemptNumber?: number | null;
  durationMs?: number | null;
}
