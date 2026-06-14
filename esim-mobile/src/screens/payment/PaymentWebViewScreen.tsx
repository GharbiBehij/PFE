import { useCallback, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import WebView from 'react-native-webview';
import { useVerifyPayment } from '../../hooks/client/useVerifyPayment';
import type { HomeStackParamList } from '../../navigation/types';
import { colors, radii, spacing, typography } from '../../theme';
import { PurpleButton } from '../../components/Buttons';


const SUCCESS_REDIRECT = 'netyfly://payment/success';
const FAIL_REDIRECT = 'netyfly://payment/fail';
// Backend redirect paths that ClicToPay calls after payment
const SUCCESS_PATH = '/payment/redirect/success';
const FAIL_PATH = '/payment/redirect/fail';
const VERIFY_RETRY_MS = 2000;
const VERIFY_TIMEOUT_MS = 60000;

type Props = NativeStackScreenProps<HomeStackParamList, 'PaymentWebView'>;

export const PaymentWebViewScreen = ({ navigation, route }: Props) => {
  const { paymentUrl, transactionId, mode = 'purchase', esimId } = route.params;
  const insets = useSafeAreaInsets();
  const [isVerifying, setIsVerifying] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const verifyMutation = useVerifyPayment();
  // Dedup guard: both onShouldStartLoadWithRequest and onNavigationStateChange
  // can fire for the same redirect URL — process each orderId only once.
  const handledOrderIdRef = useRef<string | null>(null);

  const handleDeepLink = useCallback(
    async (url: string) => {
      const urlObj = new URL(url);
      const orderId = urlObj.searchParams.get('orderId') ?? '';

      if (orderId && handledOrderIdRef.current === orderId) return;
      if (orderId) handledOrderIdRef.current = orderId;

      if (url.startsWith(FAIL_REDIRECT)) {
        // Call verifyAndProcess so the backend marks the transaction FAILED immediately
        // (rather than waiting for the 30-min reconciliation window).
        if (orderId) {
          try {
            await verifyMutation.mutateAsync(orderId);
          } catch {
            // Best-effort — backend will reconcile if this fails
          }
        }
        navigation.navigate('EsimFailed', {
          transactionId,
          reason: 'Paiement annulé ou refusé',
        });
        return;
      }

      if (url.startsWith(SUCCESS_REDIRECT) && orderId) {
        setIsVerifying(true);
        try {
          const startTime = Date.now();

          while (Date.now() - startTime < VERIFY_TIMEOUT_MS) {
            try {
              const result = await verifyMutation.mutateAsync(orderId);

              if (result.status === 'SUCCESS') {
                navigation.navigate('ProcessingModal', {
                  transactionId: result.transactionId,
                  channel: 'B2C',
                  mode,
                  esimId,
                });
                return;
              }

              if (result.status === 'FAILED') {
                navigation.navigate('EsimFailed', {
                  transactionId: result.transactionId,
                  reason: 'Paiement non confirmé',
                });
                return;
              }
            } catch {
              // Keep retrying while we are within the timeout window.
            }

            await new Promise((resolve) => setTimeout(resolve, VERIFY_RETRY_MS));
          }

          navigation.navigate('EsimFailed', {
            transactionId,
            reason: 'Paiement en attente',
          });
        } finally {
          setIsVerifying(false);
        }
      }
    },
    [navigation, transactionId, verifyMutation, mode, esimId],
  );

  // Fires BEFORE each navigation attempt. Intercepts:
  // 1. The backend redirect URLs (/payment/redirect/success|fail) that ClicToPay
  //    calls after payment — extracts orderId and handles inline so the WebView
  //    never needs to follow the server-side 302 to netyfly://
  // 2. netyfly:// URLs as a fallback for platforms that do fire this for custom schemes
  const handleShouldStartLoadWithRequest = useCallback(
    (request: { url: string }) => {
      const { url } = request;

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

      if (url.startsWith('netyfly://')) {
        handleDeepLink(url);
        return false;
      }

      return true;
    },
    [handleDeepLink],
  );

  const handleNavigationStateChange = useCallback(
    (navState: { url: string }) => {
      const { url } = navState;

      // Fallback for Android where onShouldStartLoadWithRequest
      // does not fire for server-side 302 redirects
      if (url.includes(SUCCESS_PATH)) {
        const orderId = new URL(url).searchParams.get('orderId') ?? '';
        handleDeepLink(`${SUCCESS_REDIRECT}?orderId=${orderId}`);
        return;
      }

      if (url.includes(FAIL_PATH)) {
        const orderId = new URL(url).searchParams.get('orderId') ?? '';
        handleDeepLink(`${FAIL_REDIRECT}?orderId=${orderId}`);
        return;
      }

      if (url.startsWith('netyfly://')) {
        handleDeepLink(url);
      }
    },
    [handleDeepLink],
  );

  if (loadError) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="wifi-outline" size={48} color={colors.text.tertiary} />
        <Text style={styles.errorTitle}>Impossible de charger la page</Text>
        <Text style={styles.errorDesc}>{loadError}</Text>
        <PurpleButton
          label="Réessayer"
          onPress={() => setLoadError(null)}
          style={styles.retryButton}
        />
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={styles.cancelText}>Annuler le paiement</Text>
        </Pressable>
      </View>
    );
  }

  if (isVerifying) {
    return (
      <View style={styles.verifyingContainer}>
        <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
        <Text style={styles.verifyingText}>Vérification du paiement...</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={[styles.topBar, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
        >
          <Ionicons name="arrow-back" size={20} color={colors.text.primary} />
          <Text style={styles.backText}>Retour</Text>
        </Pressable>
      </View>

      <WebView
        source={{ uri: paymentUrl, headers: { 'ngrok-skip-browser-warning': 'true' } }}
        onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
        onNavigationStateChange={handleNavigationStateChange}
        onError={(e) => {
          console.log('[WebView] onError:', e.nativeEvent);
          setLoadError(e.nativeEvent.description ?? 'Erreur réseau');
        }}
        onHttpError={(e) => {
          console.log('[WebView] onHttpError:', e.nativeEvent.statusCode, e.nativeEvent.url);
          if (e.nativeEvent.statusCode >= 500) {
            setLoadError(`Erreur serveur (${e.nativeEvent.statusCode})`);
          }
        }}
        javaScriptEnabled
        domStorageEnabled
        thirdPartyCookiesEnabled
        sharedCookiesEnabled
        startInLoadingState
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    backgroundColor: colors.background,
  },
  backButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.md,
  },
  backButtonPressed: {
    backgroundColor: colors.state.surfacePressed,
  },
  backText: {
    ...typography.labelMD,
    color: colors.text.primary,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifyingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    gap: spacing.lg,
  },
  verifyingText: {
    ...typography.bodyLG,
    color: colors.text.secondary,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  errorTitle: {
    ...typography.titleSM,
    color: colors.text.primary,
    fontWeight: '700',
    textAlign: 'center',
  },
  errorDesc: {
    ...typography.bodySM,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: spacing.sm,
  },
  cancelText: {
    ...typography.bodySM,
    color: colors.text.tertiary,
    textDecorationLine: 'underline',
  },
});
