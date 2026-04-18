import { apiClient } from './client';
import type { WalletBalance, WalletLedgerEntry } from '../types/wallet';

export const walletApi = {
  getBalance: async () => {
    const response = await apiClient.get<{ balance: number }>('/wallet/balance');
    return {
      balance: response.data.balance,
      currency: 'TND',
    } as WalletBalance;
  },
  getHistory: async () => {
    const response = await apiClient.get<WalletLedgerEntry[]>('/wallet/history');
    return response.data;
  },
  topUp: async (amount: number) => {
    const response = await apiClient.post<WalletLedgerEntry>('/wallet/topup/request', { amount });
    return response.data;
  },
};
