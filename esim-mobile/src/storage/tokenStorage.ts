import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const ACCESS_KEY = 'access_token';
const REFRESH_KEY = 'refresh_token';

const isWeb = Platform.OS === 'web';

const get = (key: string): Promise<string | null> => {
  if (isWeb) {
    return Promise.resolve(localStorage.getItem(key));
  }
  return SecureStore.getItemAsync(key);
};

const set = (key: string, value: string): Promise<void> => {
  if (isWeb) {
    localStorage.setItem(key, value);
    return Promise.resolve();
  }
  return SecureStore.setItemAsync(key, value);
};

const remove = (key: string): Promise<void> => {
  if (isWeb) {
    localStorage.removeItem(key);
    return Promise.resolve();
  }
  return SecureStore.deleteItemAsync(key);
};

export const tokenStorage = {
  getAccessToken: () => get(ACCESS_KEY),
  getRefreshToken: () => get(REFRESH_KEY),
  saveTokens: async (access: string, refresh: string) => {
    await set(ACCESS_KEY, access);
    await set(REFRESH_KEY, refresh);
  },
  clear: async () => {
    await remove(ACCESS_KEY);
    await remove(REFRESH_KEY);
  },
};
