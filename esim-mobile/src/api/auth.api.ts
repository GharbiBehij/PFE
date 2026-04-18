import { apiClient } from './client';
import type { AuthResponse, LoginRequest, SignupRequest, User } from '../types/auth';

export const authApi = {
  login: async (payload: LoginRequest) => {
    const response = await apiClient.post<AuthResponse>('/auth/login', payload);
    return response.data;
  },
  signup: async (payload: SignupRequest) => {
    const response = await apiClient.post<AuthResponse>('/auth/signup', payload);
    return response.data;
  },
  me: async () => {
    const response = await apiClient.get<User>('/auth/me');
    return response.data;
  },
  logout: async () => {
    await apiClient.post('/auth/logout');
  },
};
