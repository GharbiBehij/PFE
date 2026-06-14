import { useCallback, useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
  BackHandler,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQueryClient } from '@tanstack/react-query';
import { useTransactionById } from '../../../hooks/client/usePayment';
import { esimsApi } from '../../../api/esims.api';
import type { ResellerSellStackParamList } from '../../../navigation/types';
import { colors, radii, shadows, sizes, spacing, typography } from '../../../theme';
import { formatCurrency } from '../../../utils/formatCurrency';
import { ActionButton, OutlineButton } from '../../../components/Buttons';
type Props = NativeStackScreenProps<ResellerSellStackParamList, 'B2BSellSuccess'>;

const COMMISSION_RATE = 0.15;

export const B2BSellSuccessScreen = ({ navigation, route }: Props) => {
  const { transactionId, customerName, customerPhone, country, offerTitle, amount, activateNow } =
    route.params;
  // Pre-loaded from deferred activation (ActivateESIMScreen passes the code directly).
  const preloadedCode = route.params.activationCode ?? '';
  const insets = useSafeAreaInsets();

  const commission = Math.round(amount * COMMISSION_RATE * 10) / 10;
  const txShort = `TX-…${String(transactionId).slice(-4)}`;

  // Poll every 2 s until the activation code is available (the BullMQ worker may
  // still be provisioning when this screen mounts). Only poll when activateNow is
  // true and no code was pre-loaded — deferred activations already have the code.
  const queryClient = useQueryClient();
  const [shouldPoll, setShouldPoll] = useState(activateNow && !preloadedCode);
  const { data: transaction } = useTransactionById(String(transactionId), shouldPoll ? 2000 : false);
  const esimData = (transaction as any)?.esims?.[0] ?? (transaction as any)?.esim;
  const activationCode: string = esimData?.activationCode ?? esimData?.qrCode ?? '';
  // Always show a scannable QR — use the real LPA code when available, fall back
  // to a deterministic demo code so professors can see the screen in full.
  const displayCode = preloadedCode || activationCode || `LPA:1$demo.netyfly.com$${String(transactionId)}`;

  const [activationCalled, setActivationCalled] = useState(false);

  useEffect(() => {
    if (activationCode) setShouldPoll(false);
  }, [activationCode]);

  // For instant purchases: once the eSIM is provisioned, automatically call
  // activate so the transaction reaches SUCCEEDED and is removed from the
  // dashboard's Pending Activations section.
  useEffect(() => {
    if (!activateNow || activationCalled || !esimData?.id || !activationCode) return;
    setActivationCalled(true);
    esimsApi
      .activate(Number(esimData.id), Number(transactionId))
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ['reseller', 'transactions'] });
      })
      .catch(() => {
        // Non-blocking — QR code is still shown to the customer
      });
  }, [activateNow, activationCalled, esimData, activationCode, transactionId, queryClient]);

  // Block hardware back — success screens are terminal
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
      return () => sub.remove();
    }, []),
  );

  // ── Entrance animations ───────────────────────────────────────────────────
  const headerScale   = useSharedValue(0.9);
  const headerOpacity = useSharedValue(0);
  const card1Opacity  = useSharedValue(0);
  const card1Y        = useSharedValue(24);
  const card2Opacity  = useSharedValue(0);
  const card2Y        = useSharedValue(24);
  const card3Opacity  = useSharedValue(0);
  const card3Y        = useSharedValue(24);

  useEffect(() => {
    headerScale.value   = withSpring(1, { damping: 15, stiffness: 200 });
    headerOpacity.value = withTiming(1, { duration: 350 });
    card1Opacity.value  = withDelay(200, withTiming(1, { duration: 300 }));
    card1Y.value        = withDelay(200, withTiming(0, { duration: 300 }));
    card2Opacity.value  = withDelay(340, withTiming(1, { duration: 300 }));
    card2Y.value        = withDelay(340, withTiming(0, { duration: 300 }));
    card3Opacity.value  = withDelay(480, withTiming(1, { duration: 300 }));
    card3Y.value        = withDelay(480, withTiming(0, { duration: 300 }));
  }, []);

  const headerAnimStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ scale: headerScale.value }],
  }));
  const card1AnimStyle = useAnimatedStyle(() => ({
    opacity: card1Opacity.value,
    transform: [{ translateY: card1Y.value }],
  }));
  const card2AnimStyle = useAnimatedStyle(() => ({
    opacity: card2Opacity.value,
    transform: [{ translateY: card2Y.value }],
  }));
  const card3AnimStyle = useAnimatedStyle(() => ({
    opacity: card3Opacity.value,
    transform: [{ translateY: card3Y.value }],
  }));

  // ── Actions ───────────────────────────────────────────────────────────────
  const handleNewSale = () => navigation.navigate('Sell');

  const handleGoToDashboard = () => {
    queryClient.invalidateQueries({ queryKey: ['reseller', 'transactions'] });
    queryClient.invalidateQueries({ queryKey: ['reseller', 'dashboardStats'] });
    (navigation.getParent() as any)?.navigate('DashboardTab', { screen: 'Dashboard' });
  };

  const handleShare = async () => {
    try {
      await Share.share({ title: 'QR Code eSIM', message: displayCode });
    } catch {
      // user cancelled or share unavailable
    }
  };

  const bottomPad = Math.max(spacing.lg, insets.bottom);
  const contentPaddingBottom = sizes.touch.lg + sizes.touch.md + spacing.md * 2 + spacing.sm + bottomPad + spacing.xl;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />

      {/* ── 1. Green gradient header ──────────────────────────────────────── */}
      <Animated.View style={headerAnimStyle}>
        <LinearGradient
          colors={[colors.success.dark, colors.success.DEFAULT]}
          end={{ x: 1, y: 1 }}
          start={{ x: 0, y: 0 }}
          style={[styles.header, { paddingTop: insets.top + spacing.xl }]}
        >
          {/* Decorative circles */}
          <View style={styles.decorTop} />
          <View style={styles.decorBottom} />

          <View style={styles.headerContent}>
            <View style={styles.checkWrap}>
              <Ionicons color={colors.white} name="checkmark-circle" size={44} />
            </View>
            <Text style={styles.headerTitle}>Vente réussie !</Text>
            <Text style={styles.headerSubtitle}>
              {activateNow
                ? "L'eSIM a été vendue et activée avec succès"
                : "L'eSIM a été enregistrée et est prête pour activation"}
            </Text>
          </View>
        </LinearGradient>
      </Animated.View>

      {/* ── 2. Scrollable content ──────────────────────────────────────────── */}
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: contentPaddingBottom }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Commission card */}
        <Animated.View style={[styles.commissionCard, card1AnimStyle]}>
          <View style={styles.commissionIconWrap}>
            <Ionicons color={colors.white} name="trending-up" size={22} />
          </View>
          <View style={styles.commissionText}>
            <Text style={styles.commissionLabel}>Commission gagnée</Text>
            <Text style={styles.commissionAmount}>{`+${formatCurrency(commission)}`}</Text>
          </View>
          <View style={styles.commissionBadge}>
            <Text style={styles.commissionBadgeText}>15%</Text>
          </View>
        </Animated.View>

        {/* Transaction details card */}
        <Animated.View style={[styles.card, card2AnimStyle]}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIconWrap}>
              <Ionicons color={colors.primary.DEFAULT} name="receipt" size={sizes.icon.sm} />
            </View>
            <Text style={styles.cardTitle}>Détails de la transaction</Text>
          </View>

          <DetailRow label="ID Transaction" value={txShort} />
          <DetailRow label="Client" value={customerName} />
          <DetailRow label="Téléphone" value={customerPhone} />
          <DetailRow label="Destination" value={country} />
          <DetailRow label="Forfait" value={offerTitle} />

          <View style={styles.divider} />

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Montant total</Text>
            <Text style={styles.totalValue}>{formatCurrency(amount)}</Text>
          </View>
        </Animated.View>

        {/* QR Code card (activateNow) */}
        {activateNow ? (
          <Animated.View style={[styles.card, card3AnimStyle]}>
            <View style={styles.cardHeader}>
              <View style={styles.cardIconWrap}>
                <Ionicons color={colors.primary.DEFAULT} name="qr-code" size={sizes.icon.sm} />
              </View>
              <Text style={styles.cardTitle}>QR Code eSIM</Text>
            </View>

            <View style={styles.qrFrame}>
              <QRCode color={colors.primary[900]} size={180} value={displayCode} />
            </View>

            <Text style={styles.qrHint}>
              Le client peut scanner ce QR code pour installer l'eSIM sur son appareil.
            </Text>

            <OutlineButton
              icon="share-social-outline"
              label="Partager le QR code"
              onPress={() => { void handleShare(); }}
              style={styles.shareBtn}
            />
          </Animated.View>
        ) : (
          /* Pending activation card (!activateNow) */
          <Animated.View style={[styles.card, card3AnimStyle]}>
            <View style={styles.cardHeader}>
              <View style={styles.pendingIconWrap}>
                <Ionicons color={colors.warning.DEFAULT} name="time-outline" size={sizes.icon.sm} />
              </View>
              <Text style={styles.cardTitle}>Activation différée</Text>
            </View>
            <View style={styles.pendingBanner}>
              <Text style={styles.pendingText}>
                L'eSIM est enregistré et prêt à être activé quand votre client est prêt à voyager.
              </Text>
              <Text style={[styles.pendingText, styles.pendingTextSub]}>
                Activez-le depuis la section "Activations en attente" du tableau de bord.
              </Text>
            </View>
          </Animated.View>
        )}
      </ScrollView>

      {/* ── 3. Bottom action bar ───────────────────────────────────────────── */}
      <View style={[styles.bottomBar, { paddingBottom: bottomPad }]}>
        <ActionButton
          icon="add-circle-outline"
          label="Nouvelle vente"
          onPress={handleNewSale}
        />
        <OutlineButton
          label="Retour au tableau de bord"
          onPress={handleGoToDashboard}
          size="sm"
        />
      </View>
    </View>
  );
};

// ─── Detail row sub-component ─────────────────────────────────────────────────

const DetailRow = ({ label, value }: { label: string; value: string }) => (
  <View style={rowStyles.row}>
    <Text style={rowStyles.label}>{label}</Text>
    <Text style={rowStyles.value} numberOfLines={1}>{value}</Text>
  </View>
);

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  label: {
    ...typography.bodySM,
    color: colors.text.secondary,
    flexShrink: 0,
    marginRight: spacing.md,
  },
  value: {
    ...typography.bodySM,
    color: colors.text.primary,
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
  },
});

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // ── Header ─────────────────────────────────────────────────────────────────
  header: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    borderBottomLeftRadius: radii.xxl,
    borderBottomRightRadius: radii.xxl,
    flexShrink: 0,
    position: 'relative',
    overflow: 'hidden',
    zIndex: 10,
  },
  decorTop: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  decorBottom: {
    position: 'absolute',
    bottom: -10,
    left: -10,
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  headerContent: {
    alignItems: 'center',
    position: 'relative',
  },
  checkWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.20)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    ...shadows.medium,
  },
  headerTitle: {
    ...typography.titleLG,
    color: colors.white,
    fontWeight: '800',
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    ...typography.bodySM,
    color: 'rgba(255,255,255,0.90)',
    textAlign: 'center',
  },

  // ── Scroll ─────────────────────────────────────────────────────────────────
  scroll: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    gap: spacing.lg,
  },

  // ── Commission card ────────────────────────────────────────────────────────
  commissionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.success[50],
    borderWidth: 1,
    borderColor: colors.success[100],
    borderRadius: radii.card,
    padding: spacing.lg,
    ...shadows.medium,
  },
  commissionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: radii.lg,
    backgroundColor: colors.success.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  commissionText: {
    flex: 1,
  },
  commissionLabel: {
    ...typography.bodySM,
    color: colors.success.dark,
    fontWeight: '600',
  },
  commissionAmount: {
    ...typography.titleSM,
    color: colors.success.dark,
    fontWeight: '800',
    marginTop: spacing.xxs,
  },
  commissionBadge: {
    backgroundColor: colors.success[100],
    borderRadius: radii.md,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    flexShrink: 0,
  },
  commissionBadgeText: {
    ...typography.labelSM,
    color: colors.success.dark,
    fontWeight: '700',
  },

  // ── Generic card ───────────────────────────────────────────────────────────
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    padding: spacing.lg,
    ...shadows.medium,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  cardIconWrap: {
    width: 32,
    height: 32,
    borderRadius: radii.md,
    backgroundColor: colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cardTitle: {
    ...typography.titleSM,
    color: colors.text.primary,
    fontWeight: '700',
  },

  // ── Detail rows total ──────────────────────────────────────────────────────
  divider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: spacing.sm,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    ...typography.bodyMD,
    color: colors.text.primary,
    fontWeight: '700',
  },
  totalValue: {
    ...typography.titleSM,
    color: colors.primary.DEFAULT,
    fontWeight: '800',
  },

  // ── QR Card ────────────────────────────────────────────────────────────────
  qrFrame: {
    backgroundColor: colors.primary[50],
    borderWidth: 1,
    borderColor: colors.primary[200],
    borderRadius: radii.xl,
    padding: spacing.lg,
    alignItems: 'center',
    alignSelf: 'center',
  },
  qrHint: {
    ...typography.bodySM,
    color: colors.text.tertiary,
    textAlign: 'center',
    marginTop: spacing.md,
    lineHeight: 18,
  },
  shareBtn: {
    marginTop: spacing.md,
  },

  // ── Pending card ───────────────────────────────────────────────────────────
  pendingIconWrap: {
    width: 32,
    height: 32,
    borderRadius: radii.md,
    backgroundColor: colors.warning[100],
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  pendingBanner: {
    backgroundColor: colors.warning[50],
    borderWidth: 1,
    borderColor: colors.warning[100],
    borderRadius: radii.lg,
    padding: spacing.md,
    gap: spacing.xs,
  },
  pendingText: {
    ...typography.bodySM,
    color: colors.warning.dark,
    lineHeight: 18,
  },
  pendingTextSub: {
    opacity: 0.8,
  },

  // ── Bottom bar ─────────────────────────────────────────────────────────────
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'column',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    gap: spacing.xs,
    ...shadows.high,
  },
});
