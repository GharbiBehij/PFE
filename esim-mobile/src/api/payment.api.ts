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

type TransactionDetailResponse = {
  transaction: TransactionItemResponse;
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
    const gatewayMethod = paymentMethod === 'wallet' ? 'WALLET' : 'CASH';
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
    })) as Transaction[];
  },
  getTransactionById: async (id: string) => {
    const response = await apiClient.get<TransactionDetailResponse>(`/transaction/${id}`);
    const transaction = response.data.transaction;

    return {
      ...transaction,
      id: String(transaction.id),
      offerId: String(transaction.offerId),
    } as Transaction;
  },
};
