import { useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentApi } from '../../api/payment.api';

export const useRefund = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (transactionId: string) => paymentApi.requestRefund(transactionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['esims'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
};
