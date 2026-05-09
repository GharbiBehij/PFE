import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';

const expoExtra = (Constants.expoConfig?.extra ?? {}) as Record<string, string | undefined>;
const constantsAny = Constants as unknown as Record<string, any>;

const resolveDevHost = (): string | undefined => {
  const hostUri =
    constantsAny.expoConfig?.hostUri ??
    constantsAny.expoGoConfig?.debuggerHost ??
    constantsAny.manifest?.debuggerHost;

  if (typeof hostUri !== 'string' || hostUri.trim().length === 0) {
    return undefined;
  }

  const host = hostUri.split(':')[0]?.trim();
  return host || undefined;
};

const devHost = resolveDevHost();
const lanApiUrl = devHost ? `http://${devHost}:3000` : undefined;

const fallbackApiUrl = Platform.select({
  android: Device.isDevice ? (lanApiUrl ?? 'http://localhost:3000') : 'http://10.0.2.2:3000',
  ios: 'http://localhost:3000',
  default: lanApiUrl ?? 'http://localhost:3000',
});

const fromProcess = (key: string) => {
  const value = process.env[key];
  return typeof value === 'string' && value.trim().length > 0 ? value : undefined;
};

const fromExtra = (key: string) => {
  const value = expoExtra[key];
  return typeof value === 'string' && value.trim().length > 0 ? value : undefined;
};

const normalizeApiHost = (value: string | undefined): string | undefined => {
  if (!value || !value.includes('10.0.2.2')) {
    return value;
  }

  if (Platform.OS !== 'android') {
    return value.replace('10.0.2.2', 'localhost');
  }

  if (!Device.isDevice) {
    return value;
  }

  return lanApiUrl ?? value;
};

const configuredApiUrl = normalizeApiHost(
  fromProcess('EXPO_PUBLIC_API_URL') ??
    fromProcess('API_URL') ??
    fromExtra('API_URL'),
);

const configuredWsUrl = normalizeApiHost(
  fromProcess('EXPO_PUBLIC_WS_URL') ??
    fromProcess('WS_URL') ??
    fromExtra('WS_URL'),
);

export const env = {
  API_URL: configuredApiUrl ?? fallbackApiUrl,
  WS_URL: configuredWsUrl ?? configuredApiUrl ?? fallbackApiUrl,
};
