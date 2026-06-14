type PaymentMethod = 'WALLET' | 'CASH' | 'CARD';
type Channel = 'B2C' | 'B2B2C';

export interface PurchaseJobData {
  transactionId: number;
  userId: number;
  channel: Channel;
  offerId: number;
  amount: number;
  currency: string;
  paymentMethod?: PaymentMethod;
  /** When true, enqueue activate-esim after purchase-esim completes */
  chainActivation?: boolean;
  /** B2B2C only — when false, skip COMPLETED transition after provisioning so reseller can activate later */
  activateNow?: boolean;
}

export interface ActivateJobData {
  transactionId: number;
  userId: number;
  iccid: string;
  channel: Channel;
}
export interface EsimTopupJobData {
  transactionId: number;
  userId: number;
  esimId: number;
  offerId: number;
}
export interface PaymentEventJobData {
  gatewayPaymentId: string;
  webhookStatus: 'SUCCESS' | 'FAILED' | 'PENDING' | 'AUTHORIZED';
  rawPayload?: any;
  correlationId?: string;
}

export interface WalletDebitJobData {
  transactionId: number;
  salesmanId: number;
  amount: number;
  currency: string;
}
export interface TopUpJobData {
  topUpRequestId: number;
  salesmanId: number;
  amount: number;
  currency: string;
  paymentMethod: 'CARD' | 'CASH';
}
