import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { env } from '../config/env';
import { tokenStorage } from '../storage/tokenStorage';

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

let onAuthFailure: null | (() => void | Promise<void>) = null;
let refreshPromise: Promise<string> | null = null;

export const setAuthFailureHandler = (handler: null | (() => void | Promise<void>)) => {
  onAuthFailure = handler;
};

const refreshAccessToken = async () => {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const refreshToken = await tokenStorage.getRefreshToken();
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await axios.post<{ access_token: string; refresh_token: string }>(
        `${env.API_URL}/auth/refresh`,
        { refreshToken },
        { timeout: 10000 },
      );

      const { access_token, refresh_token } = response.data;
      await tokenStorage.saveTokens(access_token, refresh_token);
      return access_token;
    })().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
};

export const apiClient = axios.create({
  baseURL: env.API_URL,
  timeout: 10000,
});

apiClient.interceptors.request.use(async (config) => {
  const token = await tokenStorage.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;
    const status = error.response?.status;

    if (!originalRequest || status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    if (originalRequest.url?.includes('/auth/refresh')) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      const newAccessToken = await refreshAccessToken();
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      return apiClient(originalRequest);
    } catch (refreshError) {
      await tokenStorage.clear();
      if (onAuthFailure) {
        await onAuthFailure();
      }
      return Promise.reject(refreshError);
    }
  },
);
