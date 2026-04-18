import { apiClient } from './client';
import type { ChangePasswordRequest, UpdateProfileRequest, UserProfile } from '../types/profile';

export const profileApi = {
  getProfile: async () => {
    const response = await apiClient.get<UserProfile>('/user/profile');
    return response.data;
  },
  updateProfile: async (payload: UpdateProfileRequest) => {
    const response = await apiClient.patch<UserProfile>('/user/profile', payload);
    return response.data;
  },
  changePassword: async (payload: ChangePasswordRequest) => {
    await apiClient.post('/user/change-password', payload);
  },
};
