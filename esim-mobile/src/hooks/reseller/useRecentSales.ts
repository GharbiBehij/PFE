import { useQuery } from '@tanstack/react-query';
import type { RecentSale } from '../../types/reseller';
import { fetchResellerTransactions } from './useTransactions';

const COMMISSION_RATE = 0.15;

const toTimeAgo = (isoDate: string) => {
  const now = Date.now();
  const value = new Date(isoDate).getTime();
  const diffMs = Math.max(now - value, 0);
  const diffMinutes = Math.floor(diffMs / (60 * 1000));

  if (diffMinutes < 1) {
    return "A l'instant";
  }

  if (diffMinutes < 60) {
    return `Il y a ${diffMinutes} min`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return diffHours === 1 ? 'Il y a 1 h' : `Il y a ${diffHours} h`;
  }

  const diffDays = Math.floor(diffHours / 24);
  return diffDays === 1 ? 'Il y a 1 jour' : `Il y a ${diffDays} jours`;
};

export const useRecentSales = () => {
  return useQuery({
    queryKey: ['reseller', 'transactions'],
    queryFn: fetchResellerTransactions,
    select: (transactions): RecentSale[] => {
      return transactions.slice(0, 4).map((transaction) => ({
        id: transaction.id,
        customer: transaction.customer,
        package: transaction.package,
        amount: transaction.amount,
        commission: transaction.amount * COMMISSION_RATE,
        status: transaction.status === 'completed' ? 'completed' : 'pending',
        timeAgo: toTimeAgo(transaction.createdAt),
      }));
    },
  });
};
