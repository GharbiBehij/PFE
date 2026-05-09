import { useQuery } from '@tanstack/react-query';
import type { PendingActivation } from '../../types/reseller';
import { fetchResellerTransactions } from './useTransactions';

export const usePendingActivations = () => {
  return useQuery({
    queryKey: ['reseller', 'transactions'],
    queryFn: fetchResellerTransactions,
    select: (transactions): PendingActivation[] => {
      return transactions
        .filter((transaction) => transaction.status === 'pending')
        .slice(0, 10)
        .map((transaction) => ({
          id: transaction.id,
          customer: transaction.customer,
          phone: '-',
          country: transaction.country,
          package: transaction.package,
          amount: transaction.amount,
          purchaseDate: transaction.createdAt,
        }));
    },
  });
};
