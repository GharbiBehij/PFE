type PaymentMethod = 'WALLET' | 'CASH';
type Channel = 'B2C' | 'B2B2C';

export interface PurchaseJobData {
  transactionId: number;
  userId: number;
  channel: Channel;
  offerId: number;
  amount: number;
  currency: string;
  paymentMethod?: PaymentMethod;
}

export interface ActivateJobData {
  transactionId: number;
  userId: number;
  iccid: string;
  channel: Channel;
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
