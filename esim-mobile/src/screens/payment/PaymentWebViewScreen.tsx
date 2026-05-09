import { useCallback, useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import WebView from 'react-native-webview';
import { useVerifyPayment } from '../../hooks/client/useVerifyPayment';
import type { HomeStackParamList } from '../../navigation/types';
import { colors, spacing, typography } from '../../theme';


const SUCCESS_REDIRECT = 'netyfly://payment/success';
const FAIL_REDIRECT = 'netyfly://payment/fail';

type Props = NativeStackScreenProps<HomeStackParamList, 'PaymentWebView'>;

export const PaymentWebViewScreen = ({ navigation, route }: Props) => {
  const { paymentUrl, transactionId } = route.params;
  const [isVerifying, setIsVerifying] = useState(false);
  const verifyMutation = useVerifyPayment();

  const handleNavigationStateChange = useCallback(
    async (navState: { url: string }) => {
      const { url } = navState;

      if (!url.startsWith('netyfly://')) return;

      const urlObj = new URL(url);
      const orderId = urlObj.searchParams.get('orderId') ?? '';

      if (url.startsWith(FAIL_REDIRECT)) {
        navigation.navigate('EsimFailed', {
          transactionId,
          reason: 'Paiement annulé ou refusé',
        });
        return;
      }

      if (url.startsWith(SUCCESS_REDIRECT) && orderId) {
        setIsVerifying(true);
        try {
          const result = await verifyMutation.mutateAsync(orderId);

          if (result.status === 'SUCCESS') {
            navigation.navigate('ProcessingModal', {
              transactionId: result.transactionId,
              channel: 'B2C',
            });
          } else {
            navigation.navigate('EsimFailed', {
              transactionId: result.transactionId,
              reason: 'Paiement non confirmé',
            });
          }
        } catch {
          navigation.navigate('EsimFailed', {
            transactionId,
            reason: 'Erreur de vérification du paiement',
          });
        } finally {
          setIsVerifying(false);
        }
      }
    },
    [navigation, transactionId, verifyMutation],
  );

  if (isVerifying) {
    return (
      <View style={styles.verifyingContainer}>
        <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
        <Text style={styles.verifyingText}>Vérification du paiement...</Text>
      </View>
    );
  }

  return (
    <WebView
      source={{ uri: paymentUrl }}
      onNavigationStateChange={handleNavigationStateChange}
      startInLoadingState
      renderLoading={() => (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
        </View>
      )}
    />
  );
};

const styles = StyleSheet.create({
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
});
