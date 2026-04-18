import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { profileApi } from '../api/profile.api';
import type { ChangePasswordRequest, UpdateProfileRequest } from '../types/profile';

export const useProfile = () =>
  useQuery({
    queryKey: ['profile'],
    queryFn: profileApi.getProfile,
  });

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateProfileRequest) => profileApi.updateProfile(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
};

export const useChangePassword = () =>
  useMutation({
    mutationFn: (payload: ChangePasswordRequest) => profileApi.changePassword(payload),
  });
