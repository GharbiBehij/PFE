export interface CreatePaymentInput {
  amount: number;
  currency: string;
  transactionId: number;
  userId?: number;
  firstName?: string;
  lastName?: string;
  email?: string;
}

export interface CreatePaymentResult {
  gatewayPaymentId: string; // ClicToPay orderId (cs_xxx)
  paymentUrl: string; // formUrl to open in WebView
  type: 'REDIRECT'; // always REDIRECT now
}

export interface PaymentStatusResult {
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
}

export interface PaymentGatewayAdapter {
  createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult>;
  fetchPaymentStatus(gatewayPaymentId: string): Promise<PaymentStatusResult>;
}
