import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { paymentApi } from '../../api/payment.api';
import type { PaymentMethod } from '../../types/payment';

type PurchasePayload = {
  offerId: string | number;
  paymentMethod: PaymentMethod;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  activateNow?: boolean;
};

export const usePurchase = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: PurchasePayload) => paymentApi.purchase(payload),
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

export const useTransactionById = (
  id: string,
  refetchInterval?: number | false,
) =>
  useQuery({
    queryKey: ['transaction', id],
    queryFn: () => paymentApi.getTransactionById(id),
    refetchInterval,
  });
