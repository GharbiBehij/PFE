import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthWallModal } from '../../components/AuthWallModal';
import { CountryFlag } from '../../components/CountryFlag';
import { ErrorBanner } from '../../components/ErrorBanner';
import { LoadingOverlay } from '../../components/LoadingOverlay';
import { PaymentMethodTile } from '../../components/PaymentMethodTile';
import { PrimaryButton } from '../../components/Cards/PrimaryCard';
import { Group, ScreenContent, ScreenHeader, ScreenShell, Section } from '../../components/layout';
import { useAuth } from '../../hooks/client/useAuth';
import { useOfferDetail } from '../../hooks/client/useOffers';
import { usePurchase } from '../../hooks/client/usePayment';
import type { HomeStackParamList } from '../../navigation/types';
import { colors, patterns, radii, sizes, spacing, typography } from '../../theme';
import type { PaymentMethod } from '../../types/payment';

type Props = NativeStackScreenProps<HomeStackParamList, 'Payment'>;

export const PaymentScreen = ({ navigation, route }: Props) => {
  const { packageId } = route.params;
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const offerQuery = useOfferDetail(packageId);
  const purchaseMutation = usePurchase();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [paymentState, setPaymentState] = useState<'idle' | 'loading' | 'paid' | 'error'>('idle');
  const [showAuthWall, setShowAuthWall] = useState(false);

  if (offerQuery.isLoading) {
    return (
      <ScreenShell>
        <ScreenContent scrollable={false}>
          <LoadingOverlay />
        </ScreenContent>
      </ScreenShell>
    );
  }

  if (offerQuery.isError || !offerQuery.data) {
    return (
      <ScreenShell>
        <ScreenContent scrollable={false}>
          <View style={styles.centeredState}>
            <ErrorBanner message="Impossible de charger la commande." onRetry={() => offerQuery.refetch()} />
          </View>
        </ScreenContent>
      </ScreenShell>
    );
  }

  const offer = offerQuery.data;

  const availableMethods: Array<{
    label: string;
    subtitle: string;
    value: PaymentMethod;
    iconName: keyof typeof Ionicons.glyphMap;
  }> = [
    {
      label: 'Carte bancaire',
      subtitle: 'Visa, Mastercard',
      value: 'card',
      iconName: 'card-outline',
    },
    {
      label: 'D17',
      subtitle: 'Paiement mobile rapide',
      value: 'apple_pay',
      iconName: 'phone-portrait-outline',
    },
  ];

  if (user?.role === 'SALESMAN') {
    availableMethods.push({
      label: 'Portefeuille',
      subtitle: 'Solde compte revendeur',
      value: 'wallet',
      iconName: 'wallet-outline',
    });
  }

  const formatAmount = (value: number, currency: string) => {
    const suffixByCurrency: Record<string, string> = {
      EUR: '€',
      USD: '$',
      TND: ' DT',
    };
    return `${value.toFixed(2)}${suffixByCurrency[currency] ?? ` ${currency}`}`;
  };

  const onConfirmPayment = async () => {
    if (!user) {
      setShowAuthWall(true);
      return;
    }

    if (paymentState !== 'idle') return;

    setPaymentState('loading');

    try {
      const result = await purchaseMutation.mutateAsync({
        offerId: offer.id,
        paymentMethod,
      });

      const hasFailed =
        result.status === 'FAILED' ||
        result.message === 'PAYMENT_FAILED' ||
        result.message === 'WALLET_FAILED' ||
        result.message === 'QUEUE_FAILED';

      if (hasFailed) {
        setPaymentState('error');
        return;
      }

      setPaymentState('paid');

      const flowChannel: 'B2C' | 'B2B2C' =
        paymentMethod === 'wallet' ? 'B2B2C' : 'B2C';

      // ── REDIRECT flow — Stripe Checkout + Flouci + ClicToPay ──
      // All B2C payments now use PaymentWebView regardless of gateway
      if (flowChannel === 'B2C' && result.paymentUrl) {
        navigation.navigate('PaymentWebView', {
          paymentUrl: result.paymentUrl,
          transactionId: result.transactionId,
        });
        return;
      }

      // ── B2B2C wallet flow ──────────────────────────────────────
      navigation.navigate('ProcessingModal', {
        transactionId: result.transactionId,
        channel: 'B2B2C',
      });
    } catch {
      setPaymentState('error');
    }
  };

  const buttonLabel: string = {
    idle:    'Confirmer et payer',
    loading: 'Traitement...',
    paid:    'Redirection...',
    error:   'Réessayer',
  }[paymentState];

  const buttonDisabled: boolean =
    paymentState === 'loading' || paymentState === 'paid';

  const buttonLoading: boolean = paymentState === 'loading';

  return (
    <ScreenShell>
      <ScreenHeader style={styles.header}>
        <View style={styles.headerTopRow}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={({ pressed }) => [
              styles.iconButton,
              pressed && styles.iconButtonPressed,
            ]}
          >
            <Ionicons name="arrow-back" size={sizes.icon.md} color={colors.text.secondary} />
          </Pressable>

          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>Paiement</Text>
          </View>

          <View style={styles.headerSpacer} />
        </View>
      </ScreenHeader>

      <ScreenContent contentContainerStyle={styles.content}>
        <Section>
          <View style={styles.summaryCard}>
            <View style={styles.summaryTopRow}>
              <View>
                <Text style={styles.planLabel}>Forfait</Text>
                <View style={styles.planTitleRow}>
                  <CountryFlag countryCode={offer.countryCode} size={sizes.icon.lg} />
                  <Text style={styles.planTitle}>{offer.dataVolume} données</Text>
                </View>
                <Text style={styles.planSubtitle}>{offer.validityDays} jours • {offer.country}</Text>
              </View>

              <View style={styles.globeBadge}>
                <Ionicons name="globe-outline" size={sizes.icon.lg} color={colors.primary.DEFAULT} />
              </View>
            </View>

            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Sous-total</Text>
              <Text style={styles.priceValue}>{formatAmount(offer.price, offer.currency)}</Text>
            </View>
            <View style={styles.priceRowTaxes}>
              <Text style={styles.priceLabel}>Taxes</Text>
              <Text style={styles.priceValue}>{formatAmount(0, offer.currency)}</Text>
            </View>

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{formatAmount(offer.price, offer.currency)}</Text>
            </View>
          </View>
        </Section>

        <Section>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Méthode de paiement</Text>
          </View>
        </Section>

        <Section>
          <Group>
            <View style={styles.methodsWrap}>
              {availableMethods.map((method) => (
                <PaymentMethodTile
                  key={method.value}
                  iconName={method.iconName}
                  label={method.label}
                  subtitle={method.subtitle}
                  selected={paymentMethod === method.value}
                  onPress={() => setPaymentMethod(method.value)}
                />
              ))}
            </View>

            <View style={styles.securityNote}>
              <Ionicons name="lock-closed" size={sizes.icon.xs} color={colors.text.tertiary} />
              <Text style={styles.securityText}>Paiements sécurisés et chiffrés</Text>
            </View>

            {paymentState === 'error' && (
              <ErrorBanner message="Le paiement a échoué. Veuillez réessayer." />
            )}
          </Group>
        </Section>
      </ScreenContent>

      <View style={[patterns.actionBar, { paddingBottom: Math.max(spacing.md, insets.bottom) }]}>
        <PrimaryButton
          containerStyle={paymentState === 'paid' ? styles.buttonPaid : undefined}
          label={buttonLabel}
          loading={buttonLoading}
          disabled={buttonDisabled}
          onPress={onConfirmPayment}
        />
      </View>

      <AuthWallModal
        visible={showAuthWall}
        onClose={() => setShowAuthWall(false)}
      />
    </ScreenShell>
  );
};

const styles = StyleSheet.create({
  centeredState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.background,
  },
  header: {
    ...patterns.headerShell,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitleWrap: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    ...typography.titleMD,
    color: colors.text.primary,
    fontWeight: '700',
  },
  headerSpacer: {
    width: sizes.touch.sm,
  },
  iconButton: {
    ...patterns.unselectedBackground,
    ...patterns.unselectedBorder,
    width: sizes.touch.sm,
    height: sizes.touch.sm,
    borderRadius: radii.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -spacing.sm,
  },
  iconButtonPressed: {
    backgroundColor: colors.state.surfacePressed,
    transform: [{ scale: 0.98 }],
  },
  content: {
    paddingTop: spacing.xl,
    ...patterns.screenPadding,
    paddingBottom: spacing.xxxxxl + spacing.xl,
  },
  summaryCard: {
    ...patterns.summaryCard,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  summaryTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  planLabel: {
    ...typography.overline,
    color: colors.text.tertiary,
    marginBottom: spacing.xs,
  },
  planTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  planTitle: {
    ...typography.titleSM,
    color: colors.text.primary,
    fontWeight: '700',
  },
  planSubtitle: {
    ...typography.bodySM,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  globeBadge: {
    backgroundColor: colors.primary[100],
    padding: spacing.md,
    borderRadius: radii.md,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  priceRowTaxes: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  priceLabel: {
    ...typography.bodySM,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  priceValue: {
    ...typography.bodySM,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  totalLabel: {
    ...typography.labelLG,
    color: colors.text.primary,
    fontWeight: '700',
  },
  totalValue: {
    ...typography.titleSM,
    color: colors.primary.DEFAULT,
    fontWeight: '700',
  },
  sectionHeader: {
    ...patterns.sectionHeaderRow,
  },
  sectionTitle: {
    ...typography.titleMD,
    color: colors.text.primary,
    fontWeight: '700',
  },
  methodsWrap: {
    width: '100%',
    flexDirection: 'column',
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: spacing.xl,
  },
  securityText: {
    ...typography.bodySM,
    color: colors.text.tertiary,
    marginLeft: spacing.sm,
  },
  buttonPaid: {
    opacity: 0.5,
  },
});
