import { useMutation } from '@tanstack/react-query';
import { apiClient } from '../../api/client';

interface VerifyPaymentResult {
  status: 'SUCCESS' | 'FAILED';
  transactionId: number;
}

const verifyPayment = async (orderId: string): Promise<VerifyPaymentResult> => {
  const response = await apiClient.post('/payment/verify', { orderId });
  return response.data;
};

export const useVerifyPayment = () =>
  useMutation({
    mutationFn: verifyPayment,
  });
