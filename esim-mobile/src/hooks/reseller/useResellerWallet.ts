import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../api/client';

export type ResellerWalletActivityType = 'sale' | 'commission' | 'topup';
export type ResellerWalletActivityStatus = 'done' | 'pending' | 'failed';

export type ResellerWalletActivity = {
  id: number;
  type: ResellerWalletActivityType;
  status: ResellerWalletActivityStatus;
  description: string;
  amount: number;
  balance: number;
  date: string;
};

type WalletBalanceResponse = {
  balance: number;
};

type WalletHistoryItem = {
  id: number;
  amount: number;
  paymentMethod: string;
  status: string;
  balanceAfter: number;
  createdAt: string;
  ledgerEntries?: Array<{
    reason: string;
  }>;
};

type WalletHistoryResponse = {
  data: WalletHistoryItem[];
};

const MINOR_UNIT_FACTOR = 1000;

const toMajorUnits = (value: number) => value / MINOR_UNIT_FACTOR;

const formatWalletDate = (iso: string) => {
  const date = new Date(iso);
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date).replace(',', ' •');
};

const toActivityType = (item: WalletHistoryItem): ResellerWalletActivityType => {
  if (item.paymentMethod === 'TOP_UP') {
    return 'topup';
  }

  if (item.status === 'RELEASED') {
    return 'commission';
  }

  return 'sale';
};

const toActivityAmount = (item: WalletHistoryItem) => {
  const majorValue = toMajorUnits(item.amount);
  if (item.paymentMethod === 'TOP_UP' || item.status === 'RELEASED') {
    return majorValue;
  }

  return -majorValue;
};

const toActivityStatus = (item: WalletHistoryItem): ResellerWalletActivityStatus => {
  if (item.status === 'RESERVED') return 'pending';
  if (item.status === 'COMMITTED' || item.status === 'RELEASED') return 'done';
  if (item.status === 'FAILED' || item.status === 'CANCELLED') return 'failed';
  return 'done';
};

const toActivityDescription = (item: WalletHistoryItem) => {
  if (item.paymentMethod === 'TOP_UP') {
    return item.status === 'COMMITTED'
      ? 'Recharge portefeuille approuvee'
      : 'Recharge portefeuille en attente';
  }

  if (item.status === 'RESERVED') {
    return 'Achat eSIM en cours';
  }

  if (item.status === 'COMMITTED') {
    return 'Achat eSIM confirme';
  }

  if (item.status === 'RELEASED') {
    return 'Fonds restitues apres echec';
  }

  const ledgerReason = item.ledgerEntries?.[0]?.reason;
  return ledgerReason ? `Operation ${ledgerReason.toLowerCase()}` : 'Operation portefeuille';
};

export const useResellerWallet = () => {
  return useQuery({
    queryKey: ['reseller', 'wallet'],
    queryFn: async () => {
      const [balanceResponse, historyResponse] = await Promise.all([
        apiClient.get<WalletBalanceResponse>('/wallet/balance'),
        apiClient.get<WalletHistoryResponse>('/wallet/history', {
          params: { page: 1, limit: 20 },
        }),
      ]);

      const historyData = Array.isArray(historyResponse.data?.data)
        ? historyResponse.data.data
        : [];

      const activities = historyData.map((item): ResellerWalletActivity => ({
        id: item.id,
        type: toActivityType(item),
        status: toActivityStatus(item),
        description: toActivityDescription(item),
        amount: toActivityAmount(item),
        balance: toMajorUnits(item.balanceAfter),
        date: formatWalletDate(item.createdAt),
      }));

      const now = new Date();
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      const thisMonthCommission = activities
        .filter((activity) => activity.type === 'commission')
        .reduce((sum, activity) => sum + Math.max(activity.amount, 0), 0);

      const pendingBalance = historyData
        .filter((item) => item.status === 'RESERVED' && new Date(item.createdAt) >= thisMonthStart)
        .reduce((sum, item) => sum + toMajorUnits(item.amount), 0);

      return {
        balance: toMajorUnits(balanceResponse.data.balance),
        thisMonthCommission,
        pendingBalance,
        activities,
      };
    },
  });
};
