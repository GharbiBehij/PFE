import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { esimsApi } from '../api/esims.api';
import { onEsimUsageUpdated } from '../socket/useSocket';
import type { Esim } from '../types/esim';

export const useUserEsims = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const unsubscribe = onEsimUsageUpdated(({ esim }) => {
      queryClient.setQueryData<Esim[]>(['esims'], (current) => {
        if (!current || current.length === 0) {
          return [esim];
        }

        const index = current.findIndex((item) => item.id === esim.id);
        if (index === -1) {
          return [esim, ...current];
        }

        const copy = [...current];
        copy[index] = esim;
        return copy;
      });

      queryClient.setQueryData(['esims', esim.id], esim);
    });

    return unsubscribe;
  }, [queryClient]);

  return useQuery({
    queryKey: ['esims'],
    queryFn: esimsApi.getUserEsims,
  });
};

export const useEsimDetail = (id: string) =>
  useQuery({
    queryKey: ['esims', id],
    queryFn: () => esimsApi.getById(id),
    enabled: id.trim().length > 0,
  });

export const useSyncEsim = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => esimsApi.sync(id),
    onSuccess: (esim) => {
      queryClient.setQueryData(['esims', esim.id], esim);
      queryClient.invalidateQueries({ queryKey: ['esims'] });
    },
  });
};

export const useDeleteEsim = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => esimsApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['esims'] });
    },
  });
};
