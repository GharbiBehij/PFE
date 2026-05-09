import { apiClient } from './client';
import type { WalletBalance, WalletLedgerEntry } from '../types/wallet';

type WalletBalanceResponse = {
  balance: number;
};

type WalletHistoryResponse = {
  data: Array<{
    id: number;
    amount: number;
    status: string;
    createdAt: string;
    ledgerEntries?: Array<{
      type: 'DEBIT' | 'CREDIT';
      reason: 'RESERVE' | 'COMMIT' | 'RELEASE' | 'TOP_UP' | 'REFUND';
    }>;
  }>;
};

const MINOR_UNIT_FACTOR = 1000;

const toMajorUnits = (value: number) => value / MINOR_UNIT_FACTOR;

const toMinorUnits = (value: number) => Math.round(value * MINOR_UNIT_FACTOR);

export const walletApi = {
  getBalance: async () => {
    const response = await apiClient.get<WalletBalanceResponse>('/wallet/balance');
    return {
      balance: toMajorUnits(response.data.balance),
      currency: 'TND',
    } as WalletBalance;
  },
  getHistory: async () => {
    const response = await apiClient.get<WalletHistoryResponse>('/wallet/history', {
      params: { page: 1, limit: 20 },
    });

    const history = Array.isArray(response.data?.data) ? response.data.data : [];

    return history.map((item): WalletLedgerEntry => {
      const firstLedgerEntry = item.ledgerEntries?.[0];

      return {
        id: String(item.id),
        amount: toMajorUnits(item.amount),
        type: firstLedgerEntry?.type ?? (item.status === 'RELEASED' ? 'CREDIT' : 'DEBIT'),
        reason: firstLedgerEntry?.reason ?? 'RESERVE',
        createdAt: item.createdAt,
      };
    });
  },
  topUp: async (amount: number) => {
    const response = await apiClient.post('/wallet/topup/request', {
      amount: toMinorUnits(amount),
    });
    return response.data;
  },
};
