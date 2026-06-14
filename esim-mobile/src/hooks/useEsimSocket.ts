import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { env } from '../config/env';
import { tokenStorage } from '../storage/tokenStorage';

type ActivatedPayload = {
  iccid: string;
  qrCode: string | null;
  activationCode: string;
};

type FailedPayload = {
  transactionId: number;
};

type TopupSuccessPayload = {
  esimId: number;
  dataAdded: number;
};

type UseEsimSocketOptions = {
  onActivated: (payload: ActivatedPayload) => void;
  onFailed: (payload: FailedPayload) => void;
  onTopupSuccess?: (payload: TopupSuccessPayload) => void;
};

/**
 * Connects to the /esim Socket.IO namespace and listens for activation events.
 * The socket is scoped to this hook's lifecycle — disconnects on unmount.
 */
export const useEsimSocket = ({ onActivated, onFailed, onTopupSuccess }: UseEsimSocketOptions): void => {
  const socketRef = useRef<Socket | null>(null);

  // Keep callback refs stable so listeners always call the latest version
  const onActivatedRef = useRef(onActivated);
  const onFailedRef = useRef(onFailed);
  const onTopupSuccessRef = useRef(onTopupSuccess);
  useEffect(() => { onActivatedRef.current = onActivated; }, [onActivated]);
  useEffect(() => { onFailedRef.current = onFailed; }, [onFailed]);
  useEffect(() => { onTopupSuccessRef.current = onTopupSuccess; }, [onTopupSuccess]);

  useEffect(() => {
    let mounted = true;

    (async () => {
      const token = await tokenStorage.getAccessToken();
      if (!token || !mounted) return;

      const socket = io(`${env.WS_URL}/esim`, {
        auth: { token },
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 2000,
      });

      socketRef.current = socket;

      socket.on('esim:activated', (payload: ActivatedPayload) => {
        onActivatedRef.current(payload);
      });

      socket.on('esim:failed', (payload: FailedPayload) => {
        onFailedRef.current(payload);
      });

      socket.on('esim:topup-success', (payload: TopupSuccessPayload) => {
        onTopupSuccessRef.current?.(payload);
      });
    })();

    return () => {
      mounted = false;
      const socket = socketRef.current;
      if (socket) {
        socket.off('esim:activated');
        socket.off('esim:failed');
        socket.off('esim:topup-success');
        socket.disconnect();
        socketRef.current = null;
      }
    };
  }, []);
};
