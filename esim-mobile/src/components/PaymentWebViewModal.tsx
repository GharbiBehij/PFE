import { useCallback, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import WebView from 'react-native-webview';
import { useVerifyPayment } from '../hooks/client/useVerifyPayment';
import { colors, radii, shadows, spacing, typography } from '../theme';

const SUCCESS_PATH = '/payment/redirect/success';
const FAIL_PATH    = '/payment/redirect/fail';
const SUCCESS_REDIRECT = 'netyfly://payment/success';
const FAIL_REDIRECT    = 'netyfly://payment/fail';
const VERIFY_RETRY_MS   = 2000;
const VERIFY_TIMEOUT_MS = 60000;

interface Props {
  visible: boolean;
  paymentUrl: string;
  transactionId: number;
  onClose: () => void;
  onSuccess: (transactionId: number) => void;
  onFailed:  (transactionId: number) => void;
}

export const PaymentWebViewModal = ({
  visible,
  paymentUrl,
  transactionId,
  onClose,
  onSuccess,
  onFailed,
}: Props) => {
  const insets = useSafeAreaInsets();
  const [isVerifying, setIsVerifying] = useState(false);
  const [loadError,   setLoadError]   = useState<string | null>(null);
  const verifyMutation = useVerifyPayment();
  const handledOrderIdRef = useRef<string | null>(null);

  const handleDeepLink = useCallback(
    async (url: string) => {
      const urlObj  = new URL(url);
      const orderId = urlObj.searchParams.get('orderId') ?? '';

      if (orderId && handledOrderIdRef.current === orderId) return;
      if (orderId) handledOrderIdRef.current = orderId;

      if (url.startsWith(FAIL_REDIRECT)) {
        if (orderId) {
          try { await verifyMutation.mutateAsync(orderId); } catch { /* best-effort */ }
        }
        onFailed(transactionId);
        return;
      }

      if (url.startsWith(SUCCESS_REDIRECT) && orderId) {
        setIsVerifying(true);
        try {
          const start = Date.now();
          while (Date.now() - start < VERIFY_TIMEOUT_MS) {
            try {
              const result = await verifyMutation.mutateAsync(orderId);
              if (result.status === 'SUCCESS') { onSuccess(result.transactionId); return; }
              if (result.status === 'FAILED')  { onFailed(result.transactionId);  return; }
            } catch { /* retry */ }
            await new Promise(r => setTimeout(r, VERIFY_RETRY_MS));
          }
          onFailed(transactionId);
        } finally {
          setIsVerifying(false);
        }
      }
    },
    [transactionId, verifyMutation, onSuccess, onFailed],
  );

  const handleShouldStart = useCallback(
    (req: { url: string }) => {
      const { url } = req;
      if (url.includes(SUCCESS_PATH)) {
        const orderId = new URL(url).searchParams.get('orderId') ?? '';
        handleDeepLink(`${SUCCESS_REDIRECT}?orderId=${orderId}`);
        return false;
      }
      if (url.includes(FAIL_PATH)) {
        const orderId = new URL(url).searchParams.get('orderId') ?? '';
        handleDeepLink(`${FAIL_REDIRECT}?orderId=${orderId}`);
        return false;
      }
      if (url.startsWith('netyfly://')) { handleDeepLink(url); return false; }
      return true;
    },
    [handleDeepLink],
  );

  const handleNavState = useCallback(
    (navState: { url: string }) => {
      const { url } = navState;
      if (url.includes(SUCCESS_PATH)) {
        const orderId = new URL(url).searchParams.get('orderId') ?? '';
        handleDeepLink(`${SUCCESS_REDIRECT}?orderId=${orderId}`);
      } else if (url.includes(FAIL_PATH)) {
        const orderId = new URL(url).searchParams.get('orderId') ?? '';
        handleDeepLink(`${FAIL_REDIRECT}?orderId=${orderId}`);
      } else if (url.startsWith('netyfly://')) {
        handleDeepLink(url);
      }
    },
    [handleDeepLink],
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      {/* Backdrop */}
      <Pressable style={styles.backdrop} onPress={onClose} />

      {/* Sheet — plein écran, par-dessus le backdrop */}
      <View style={[styles.sheet, { paddingTop: insets.top }]}>

        {/* Barre du haut */}
        <View style={styles.topBar}>
          <Pressable
            onPress={onClose}
            style={({ pressed }) => [styles.closeBtn, pressed && styles.closeBtnPressed]}
          >
            <Ionicons name="close" size={20} color={colors.text.primary} />
          </Pressable>
          <Text style={styles.title}>Paiement sécurisé</Text>
          <View style={styles.lockBadge}>
            <Ionicons name="lock-closed" size={12} color={colors.success.DEFAULT} />
          </View>
        </View>

        {/* États alternatifs */}
        {loadError ? (
          <View style={styles.center}>
            <Ionicons name="wifi-outline" size={48} color={colors.text.tertiary} />
            <Text style={styles.errorTitle}>Page inaccessible</Text>
            <Text style={styles.errorDesc}>{loadError}</Text>
            <Pressable
              onPress={() => setLoadError(null)}
              style={({ pressed }) => [styles.retryBtn, pressed && styles.retryBtnPressed]}
            >
              <Text style={styles.retryText}>Réessayer</Text>
            </Pressable>
            <Pressable onPress={onClose} style={styles.cancelWrap}>
              <Text style={styles.cancelText}>Annuler le paiement</Text>
            </Pressable>
          </View>
        ) : isVerifying ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
            <Text style={styles.verifyText}>Vérification du paiement…</Text>
          </View>
        ) : (
          <WebView
            source={{ uri: paymentUrl, headers: { 'ngrok-skip-browser-warning': 'true' } }}
            onShouldStartLoadWithRequest={handleShouldStart}
            onNavigationStateChange={handleNavState}
            onError={e => setLoadError(e.nativeEvent.description ?? 'Erreur réseau')}
            onHttpError={e => {
              if (e.nativeEvent.statusCode >= 500)
                setLoadError(`Erreur serveur (${e.nativeEvent.statusCode})`);
            }}
            javaScriptEnabled
            domStorageEnabled
            thirdPartyCookiesEnabled
            sharedCookiesEnabled
            startInLoadingState
            renderLoading={() => (
              <View style={styles.center}>
                <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
              </View>
            )}
          />
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay,
  },
  sheet: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.background,
  },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    ...shadows.medium,
  },
  closeBtn: {
    width: 36, height: 36,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnPressed: {
    backgroundColor: colors.state.surfacePressed,
  },
  title: {
    ...typography.labelLG,
    fontWeight: '700',
    color: colors.text.primary,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: spacing.sm,
  },
  lockBadge: {
    width: 36, height: 36,
    borderRadius: radii.full,
    backgroundColor: colors.success[50],
    alignItems: 'center',
    justifyContent: 'center',
  },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  verifyText: {
    ...typography.bodyLG,
    color: colors.text.secondary,
  },
  errorTitle: {
    ...typography.titleSM,
    fontWeight: '700',
    color: colors.text.primary,
    textAlign: 'center',
  },
  errorDesc: {
    ...typography.bodySM,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  retryBtn: {
    backgroundColor: colors.primary.DEFAULT,
    borderRadius: radii.md,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
    ...shadows.medium,
  },
  retryBtnPressed: { opacity: 0.8 },
  retryText: {
    ...typography.labelMD,
    fontWeight: '700',
    color: colors.white,
  },
  cancelWrap: { marginTop: spacing.xs },
  cancelText: {
    ...typography.bodySM,
    color: colors.text.tertiary,
    textDecorationLine: 'underline',
  },
});
