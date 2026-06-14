import { io, Socket } from 'socket.io-client';
import { env } from '../config/env';
import { tokenStorage } from '../storage/tokenStorage';
import type { Esim } from '../types/esim';

// ── Event names ────────────────────────────────────────────────────────────

const USAGE_UPDATED_EVENT = 'esim:usage-updated';
const ESIM_ACTIVATED_EVENT = 'esim:activated';
const ESIM_FAILED_EVENT = 'esim:failed';
const ESIM_TOPUP_SUCCESS_EVENT = 'esim:topup-success';

// ── Payload types ──────────────────────────────────────────────────────────

type UsageUpdatedPayload = { esim: Esim };

export type EsimActivatedPayload = {
  iccid: string;
  qrCode: string | null;
  activationCode: string;
};

export type EsimFailedPayload = { transactionId: number };

export type EsimTopupSuccessPayload = { esimId: number; dataAdded: number };

// ── Singleton socket instance ──────────────────────────────────────────────

let socket: Socket | null = null;

// ── Lifecycle ──────────────────────────────────────────────────────────────

export const connectSocket = async (accessToken?: string) => {
  const token = accessToken ?? (await tokenStorage.getAccessToken());
  if (!token) return null;

  if (socket?.connected) return socket;

  // Connect to the /esim namespace where EsimGateway listens
  socket = io(`${env.WS_URL}/esim`, {
    transports: ['websocket'],
    auth: { token },
  });

  return socket;
};

export const disconnectSocket = () => {
  if (!socket) return;
  socket.removeAllListeners();
  socket.disconnect();
  socket = null;
};

export const getSocket = () => socket;

// ── Event listeners ────────────────────────────────────────────────────────
// Each returns an unsubscribe function for use in useEffect cleanup.

export const onEsimUsageUpdated = (
  listener: (payload: UsageUpdatedPayload) => void,
) => {
  if (!socket) return () => undefined;
  socket.on(USAGE_UPDATED_EVENT, listener);
  return () => { socket?.off(USAGE_UPDATED_EVENT, listener); };
};

/** Fired when a worker successfully activates an eSIM (status → ACTIVE). */
export const onEsimActivated = (
  listener: (payload: EsimActivatedPayload) => void,
) => {
  if (!socket) return () => undefined;
  socket.on(ESIM_ACTIVATED_EVENT, listener);
  return () => { socket?.off(ESIM_ACTIVATED_EVENT, listener); };
};

/** Fired when activation fails after all retries. */
export const onEsimFailed = (
  listener: (payload: EsimFailedPayload) => void,
) => {
  if (!socket) return () => undefined;
  socket.on(ESIM_FAILED_EVENT, listener);
  return () => { socket?.off(ESIM_FAILED_EVENT, listener); };
};

/** Fired when a top-up job completes and data has been added. */
export const onEsimTopupSuccess = (
  listener: (payload: EsimTopupSuccessPayload) => void,
) => {
  if (!socket) return () => undefined;
  socket.on(ESIM_TOPUP_SUCCESS_EVENT, listener);
  return () => { socket?.off(ESIM_TOPUP_SUCCESS_EVENT, listener); };
};
