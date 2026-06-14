import { apiClient } from './client';
import type { PaymentMethod, PurchaseResult, Transaction } from '../types/payment';

type TransactionItemResponse = Omit<Transaction, 'id' | 'offerId'> & {
  id: number;
  offerId: number;
  attemptNumber?: number | null;
  durationMs?: number | null;
};

type TransactionListResponse = {
  transactions: TransactionItemResponse[];
};

type TransactionEsimSummary = {
  id: number;
  status: string;
  qrCode?: string | null;
  activationCode?: string | null;
};

type TransactionDetailResponse = {
  transaction: TransactionItemResponse;
  esims: TransactionEsimSummary[];
};

type PurchasePayload = {
  offerId: string | number;
  paymentMethod: PaymentMethod;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  activateNow?: boolean;
};

export const paymentApi = {
  purchase: async ({
    offerId,
    paymentMethod,
    customerName,
    customerPhone,
    customerEmail,
    activateNow,
  }: PurchasePayload) => {
    // 'cash' means the reseller collects cash from the customer but the
    // transaction is still funded from the reseller's wallet on the backend.
    const gatewayMethod =
      paymentMethod === 'wallet' || paymentMethod === 'cash' ? 'WALLET' : 'CARD';
    const response = await apiClient.post<PurchaseResult>('/transaction/purchase', {
      offerId: Number(offerId),
      paymentMethod: gatewayMethod,
      customerName,
      customerPhone,
      customerEmail,
      activateNow,
    });
    return response.data;
  },
  getTransactions: async () => {
    const response = await apiClient.get<TransactionListResponse>('/transaction');
    const transactions = Array.isArray(response.data?.transactions) ? response.data.transactions : [];

    return transactions.map((transaction) => ({
      ...transaction,
      id: String(transaction.id),
      offerId: String(transaction.offerId),
      amount: transaction.amount / 1000,
    })) as Transaction[];
  },
  getTransactionById: async (id: string) => {
    const response = await apiClient.get<TransactionDetailResponse>(`/transaction/${id}`);
    const transaction = response.data.transaction;
    const esims = response.data.esims ?? [];

    return {
      ...transaction,
      id: String(transaction.id),
      offerId: String(transaction.offerId),
      amount: transaction.amount / 1000,
      esims,
    } as Transaction & { esims: TransactionEsimSummary[] };
  },
  requestRefund: async (transactionId: string) => {
    const response = await apiClient.post(`/transaction/${transactionId}/refund`);
    return response.data;
  },
  activateEsim: async (transactionId: string) => {
    const response = await apiClient.post(`/transaction/${transactionId}/activate`);
    return response.data as { transactionId: number; status: string; esimId?: number };
  },
};
