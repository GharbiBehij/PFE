import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { paymentApi } from '../api/payment.api';
import type { PaymentMethod } from '../types/payment';

export const usePurchase = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ offerId, paymentMethod }: { offerId: string; paymentMethod: PaymentMethod }) =>
      paymentApi.purchase(offerId, paymentMethod),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['esims'] });
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
};

export const useTransactions = () =>
  useQuery({
    queryKey: ['transactions'],
    queryFn: paymentApi.getTransactions,
  });
