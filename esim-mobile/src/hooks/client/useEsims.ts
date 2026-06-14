import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { esimsApi } from '../../api/esims.api';
import {
  onEsimUsageUpdated,
  onEsimActivated,
  onEsimFailed,
  onEsimTopupSuccess,
} from '../../socket/useSocket';
import type { Esim } from '../../types/esim';

export const useUserEsims = (enabled = true) => {
  const queryClient = useQueryClient();

  // esim:usage-updated — mise à jour granulaire dans le cache
  useEffect(() => {
    const unsubscribe = onEsimUsageUpdated(({ esim }) => {
      queryClient.setQueryData<Esim[]>(['esims'], (current) => {
        if (!current || current.length === 0) return [esim];
        const index = current.findIndex((item) => item.id === esim.id);
        if (index === -1) return [esim, ...current];
        const copy = [...current];
        copy[index] = esim;
        return copy;
      });
      queryClient.setQueryData(['esims', esim.id], esim);
    });
    return unsubscribe;
  }, [queryClient]);

  // esim:activated — l'eSIM est passée ACTIVE, refetch la liste complète
  useEffect(() => {
    const unsubscribe = onEsimActivated(() => {
      queryClient.invalidateQueries({ queryKey: ['esims'] });
    });
    return unsubscribe;
  }, [queryClient]);

  // esim:failed — activation échouée, invalide les eSIMs et les transactions
  useEffect(() => {
    const unsubscribe = onEsimFailed(() => {
      queryClient.invalidateQueries({ queryKey: ['esims'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    });
    return unsubscribe;
  }, [queryClient]);

  // esim:topup-success — données ajoutées, invalide l'eSIM concernée
  useEffect(() => {
    const unsubscribe = onEsimTopupSuccess(({ esimId }) => {
      queryClient.invalidateQueries({ queryKey: ['esims', String(esimId)] });
      queryClient.invalidateQueries({ queryKey: ['esims'] });
    });
    return unsubscribe;
  }, [queryClient]);

  return useQuery({
    queryKey: ['esims'],
    queryFn: esimsApi.getUserEsims,
    enabled,
    refetchInterval: 4000,
    placeholderData: keepPreviousData,
    staleTime: 10_000,
  });
};

export const useEsimDetail = (id: string) =>
  useQuery({
    queryKey: ['esims', id],
    queryFn: () => esimsApi.getById(id),
    enabled: id.trim().length > 0,
  });

export const useEsimUsage = (id: string) =>
  useQuery({
    queryKey: ['esims', id, 'usage'],
    queryFn: async () => [] as number[],
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
