import { io, Socket } from 'socket.io-client';
import { env } from '../config/env';
import { tokenStorage } from '../storage/tokenStorage';
import type { Esim } from '../types/esim';

const USAGE_UPDATED_EVENT = 'esim:usage-updated';

type UsageUpdatedPayload = {
  esim: Esim;
};

let socket: Socket | null = null;

export const connectSocket = async (accessToken?: string) => {
  const token = accessToken ?? (await tokenStorage.getAccessToken());
  if (!token) {
    return null;
  }

  if (socket?.connected) {
    return socket;
  }

  socket = io(env.WS_URL, {
    transports: ['websocket'],
    auth: {
      token,
    },
  });

  return socket;
};

export const disconnectSocket = () => {
  if (!socket) {
    return;
  }

  socket.removeAllListeners();
  socket.disconnect();
  socket = null;
};

export const onEsimUsageUpdated = (listener: (payload: UsageUpdatedPayload) => void) => {
  if (!socket) {
    return () => undefined;
  }

  socket.on(USAGE_UPDATED_EVENT, listener);
  return () => {
    socket?.off(USAGE_UPDATED_EVENT, listener);
  };
};

export const getSocket = () => socket;
