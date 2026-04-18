import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { walletApi } from '../api/wallet.api';

export const useWalletBalance = () =>
  useQuery({
    queryKey: ['wallet', 'balance'],
    queryFn: walletApi.getBalance,
  });

export const useWalletHistory = () =>
  useQuery({
    queryKey: ['wallet', 'history'],
    queryFn: walletApi.getHistory,
  });

export const useTopUp = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (amount: number) => walletApi.topUp(amount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
    },
  });
};
