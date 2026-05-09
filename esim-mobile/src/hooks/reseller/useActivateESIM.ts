import { useMutation } from '@tanstack/react-query';
import { paymentApi } from '../../api/payment.api';

type ActivatePayload = {
  transactionId: string;
};

export const useActivateESIM = () => {
  return useMutation({
    mutationFn: async ({ transactionId }: ActivatePayload) => {
      const transaction = await paymentApi.getTransactionById(transactionId);

      return {
        success: true,
        transactionId,
        status: transaction.status,
      };
    },
  });
};
