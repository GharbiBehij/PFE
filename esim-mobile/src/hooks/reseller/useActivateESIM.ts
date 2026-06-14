import { useMutation, useQueryClient } from '@tanstack/react-query';
import { esimsApi } from '../../api/esims.api';
import { paymentApi } from '../../api/payment.api';

type ActivatePayload = {
  transactionId: string;
};

export const useActivateESIM = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ transactionId }: ActivatePayload) => {
      // Fetch transaction to resolve the eSIM id (B2B endpoint requires esimId in URL)
      const detail = await paymentApi.getTransactionById(transactionId);
      const esim = detail.esims?.[0];

      if (!esim) {
        throw new Error(
          "L'eSIM est encore en cours de provisionnement. Veuillez réessayer dans quelques instants.",
        );
      }

      // B2B activation: POST /esims/:esimId/activate  (SALESMAN role required)
      const result = await esimsApi.activate(esim.id, Number(transactionId));

      return {
        transactionId,
        esimId: result.esimId,
        status: result.status,
        message: result.message,
        // activationCode was set during provisioning (purchase step); safe to
        // read from the pre-activation fetch since activation only changes status.
        activationCode: esim.activationCode ?? esim.qrCode ?? null,
      };
    },
    onSuccess: (data) => {
      if (data.esimId) {
        queryClient.invalidateQueries({ queryKey: ['esims', String(data.esimId)] });
      }
      queryClient.invalidateQueries({ queryKey: ['esims'] });
      queryClient.invalidateQueries({ queryKey: ['reseller', 'transactions'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
};
