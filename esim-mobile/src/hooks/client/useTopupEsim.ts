import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { esimsApi } from '../../api/esims.api';

export const useTopupOffers = (esimId: string, enabled: boolean) =>
  useQuery({
    queryKey: ['topup-offers', esimId],
    queryFn: () => esimsApi.getTopupOffers(esimId),
    enabled: enabled && esimId.trim().length > 0,
  });

export const useTopupEsim = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      esimId,
      offerId,
      paymentMethod,
    }: {
      esimId: string;
      offerId: number;
      paymentMethod: string;
    }) => esimsApi.topupEsim(esimId, offerId, paymentMethod),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['esims'] });
    },
  });
};
