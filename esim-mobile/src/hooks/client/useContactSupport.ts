import { useMutation } from '@tanstack/react-query';
import { apiClient } from '../../api/client';

interface ContactPayload {
  subject: string;
  message: string;
}

const submitContact = async (data: ContactPayload) => {
  const res = await apiClient.post('/support/contact', data);
  return res.data;
};

export const useContactSupport = () =>
  useMutation({
    mutationFn: submitContact,
  });
