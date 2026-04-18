import { Platform } from 'react-native';
import Constants from 'expo-constants';

const expoExtra = (Constants.expoConfig?.extra ?? {}) as Record<string, string | undefined>;

const fallbackApiUrl = Platform.select({
  android: 'http://10.0.2.2:3000',
  ios: 'http://localhost:3000',
  default: 'http://localhost:3000',
});

const fromProcess = (key: string) => {
  const value = process.env[key];
  return typeof value === 'string' && value.trim().length > 0 ? value : undefined;
};

const fromExtra = (key: string) => {
  const value = expoExtra[key];
  return typeof value === 'string' && value.trim().length > 0 ? value : undefined;
};

export const env = {
  API_URL:
    fromProcess('EXPO_PUBLIC_API_URL') ??
    fromProcess('API_URL') ??
    fromExtra('API_URL') ??
    fallbackApiUrl,
  WS_URL:
    fromProcess('EXPO_PUBLIC_WS_URL') ??
    fromProcess('WS_URL') ??
    fromExtra('WS_URL') ??
    fromProcess('EXPO_PUBLIC_API_URL') ??
    fallbackApiUrl,
};
