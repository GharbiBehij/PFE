import { apiClient } from './client';
import type { PaymentMethod, PurchaseResult, Transaction } from '../types/payment';

export const paymentApi = {
  purchase: async (offerId: string, paymentMethod: PaymentMethod) => {
    const response = await apiClient.post<PurchaseResult>('/transaction/purchase', {
      offerId,
      paymentMethod,
    });
    return response.data;
  },
  getTransactions: async () => {
    const response = await apiClient.get<Transaction[]>('/transaction');
    return response.data;
  },
  getTransactionById: async (id: string) => {
    const response = await apiClient.get<Transaction>(`/transaction/${id}`);
    return response.data;
  },
};
