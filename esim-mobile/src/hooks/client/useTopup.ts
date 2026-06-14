import { useMutation, useQueryClient } from '@tanstack/react-query';
import { esimsApi } from '../../api/esims.api';

export const useTopup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ esimId, offerId }: { esimId: string; offerId: number }) =>
      esimsApi.topupEsim(esimId, offerId, 'CASH'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['esims'] });
    },
  });
};
