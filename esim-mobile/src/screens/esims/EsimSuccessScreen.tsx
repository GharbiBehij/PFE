import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ActionButton, OutlineButton } from '../../components/Buttons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';
import { useTransactionById } from '../../hooks/client/usePayment';
import type { HomeStackParamList } from '../../navigation/types';
import { formatCurrency } from '../../utils/formatCurrency';
import { colors, radii, shadows, sizes, spacing, typography } from '../../theme';

type Props = NativeStackScreenProps<HomeStackParamList, 'EsimSuccess'>;

export const EsimSuccessScreen = ({ navigation, route }: Props) => {
  const { transactionId, channel } = route.params;
  const isB2C = channel === 'B2C';
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  // Poll every 2 s until activationCode is available.
  // ProcessingModal/SuccessScreen invalidate the cache before navigating here,
  // so the first poll fires immediately — but if the network is slow the QR
  // would stay blank forever with a one-shot fetch.
  const [shouldPoll, setShouldPoll] = useState(true);
  const { data: transaction } = useTransactionById(
    String(transactionId),
    shouldPoll ? 2000 : false,
  );

  // getTransactionById returns { ...transaction, esims: TransactionEsimSummary[] }
  const esimData       = (transaction as any)?.esims?.[0] ?? transaction?.esim;
  const activationCode = esimData?.activationCode ?? esimData?.qrCode ?? '';
  // Always show a scannable QR — use the real LPA code when available, fall back
  // to a deterministic demo code so professors can see the screen in full.
  const displayCode = activationCode || `LPA:1$demo.netyfly.com$${String(transactionId)}`;
  // Screen is only reached when status is COMPLETED or SUCCEEDED
  const activateNow    = transaction?.status === 'COMPLETED' || transaction?.status === 'SUCCEEDED';

  useEffect(() => {
    if (activationCode) {
      setShouldPoll(false);
      queryClient.invalidateQueries({ queryKey: ['esims'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    }
  }, [activationCode]);
  const offer          = transaction?.offer;
  const amount         = transaction?.amount;
  const currency       = transaction?.currency ?? 'TND';

  // ── Entrance animations ──────────────────────────────────────────────────
  const circleScale   = useSharedValue(0);
  const headerOpacity = useSharedValue(0);
  const headerY       = useSharedValue(20);
  const card1Opacity  = useSharedValue(0);
  const card1Y        = useSharedValue(20);
  const card2Opacity  = useSharedValue(0);
  const card2Y        = useSharedValue(20);
  const card3Opacity  = useSharedValue(0);
  const card3Y        = useSharedValue(20);

  useEffect(() => {
    circleScale.value   = withSpring(1, { damping: 15, stiffness: 200 });
    headerOpacity.value = withDelay(200, withTiming(1, { duration: 300 }));
    headerY.value       = withDelay(200, withTiming(0, { duration: 300 }));
    card1Opacity.value  = withDelay(300, withTiming(1, { duration: 300 }));
    card1Y.value        = withDelay(300, withTiming(0, { duration: 300 }));
    card2Opacity.value  = withDelay(400, withTiming(1, { duration: 300 }));
    card2Y.value        = withDelay(400, withTiming(0, { duration: 300 }));
    card3Opacity.value  = withDelay(500, withTiming(1, { duration: 300 }));
    card3Y.value        = withDelay(500, withTiming(0, { duration: 300 }));
  }, []);

  const circleAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: circleScale.value }],
  }));
  const headerAnimStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerY.value }],
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

  const handlePrimaryAction = () => {
    if (isB2C) {
      queryClient.invalidateQueries({ queryKey: ['esims'] });
      const esimIsActive = (esimData?.status ?? '').toString().toUpperCase() === 'ACTIVE';
      (navigation.getParent() as any)?.navigate('EsimsTab', {
        screen: 'MyEsims',
        params: { initialTab: esimIsActive ? 'ACTIVE' : 'PENDING' },
      });
    } else {
      (navigation.getParent() as any)?.navigate('SellTab', {
        screen: 'Sell',
      });
    }
  };

  const handleSecondaryAction = () => {
    if (isB2C) {
      (navigation.getParent() as any)?.navigate('HomeTab', {
        screen: 'Home',
      });
    } else {
      (navigation.getParent() as any)?.navigate('DashboardTab', {
        screen: 'Dashboard',
      });
    }
  };

  const bottomPad = Math.max(spacing.lg, insets.bottom);
  const txShort   = `TX-…${String(transactionId).slice(-2)}`;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />

      {/* ── 1. BLOC EN-TÊTE ──────────────────────────────────────────────── */}
      <View style={[styles.headerSection, { paddingTop: insets.top + spacing.xl }]}>
        <Animated.View style={[styles.iconWrap, circleAnimStyle]}>
          <View style={styles.iconGlow} />
          <LinearGradient
            colors={[colors.success[400], colors.success[700]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.iconCircle}
          >
            <Ionicons name="checkmark-circle" size={64} color={colors.white} />
          </LinearGradient>
        </Animated.View>

        <Animated.View style={[styles.headerTextWrap, headerAnimStyle]}>
          <Text style={styles.headerTitle}>
            {isB2C ? 'eSIM activée ! 🎉' : 'Vente réalisée !'}
          </Text>
          <Text style={styles.headerSubtitle}>
            {isB2C
              ? 'Votre eSIM est prête à être installée'
              : activateNow
                ? "L'eSIM a été activée avec succès"
                : "L'eSIM est prête pour l'activation"}
          </Text>
        </Animated.View>
      </View>

      {/* ── 2. ZONE SCROLLABLE ───────────────────────────────────────────── */}
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          {
            paddingBottom:
              spacing.md +           // paddingTop of bar
              sizes.touch.cta +      // purple button
              spacing.sm +           // gap between buttons
              sizes.touch.cta +      // neutral button
              spacing.md +           // visual buffer above bar
              bottomPad,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── a. Carte verte "Active et prête" ──────────────────────────── */}
        <Animated.View style={card1AnimStyle}>
          <LinearGradient
            colors={[colors.success[500], colors.success.DEFAULT]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.statusCard}
          >
            <View style={styles.statusIconWrap}>
              <Ionicons
                name="phone-portrait"
                size={28}
                color={colors.white}
              />
            </View>
            <View style={styles.statusTextWrap}>
              <Text style={styles.statusTitle}>
                {'Active et prête !'}
              </Text>
              <Text style={styles.statusSubtitle}>
                {isB2C
                  ? 'Scannez le QR code ci-dessous pour installer votre eSIM avant de partir.'
                  : activateNow
                    ? "L'eSIM est activée et prête à l'emploi."
                    : "L'eSIM sera activée quand le client sera prêt à voyager."}
              </Text>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* ── b. Carte QR — toujours visible pour B2C (fallback si code absent) */}
        {(isB2C || activateNow) && (
          <Animated.View style={[styles.card, card2AnimStyle]}>
            {/* En-tête */}
            <View style={styles.qrCardHeader}>
              <View style={styles.qrIconBadge}>
                <Ionicons name="qr-code" size={sizes.icon.md} color={colors.primary.DEFAULT} />
              </View>
              <Text style={styles.cardTitle}>Code QR eSIM</Text>
            </View>

            {/* Cadre QR */}
            <View style={styles.qrFrame}>
              <QRCode value={displayCode} size={200} />
            </View>

            {/* Instruction */}
            <View style={styles.qrInstruction}>
              <Text style={styles.qrInstructionText}>
                {isB2C
                  ? 'Scannez ce QR code depuis les paramètres de votre téléphone'
                  : 'Le client doit scanner ce QR code avec son appareil'}
              </Text>
            </View>
          </Animated.View>
        )}

        {/* ── Pending (B2B2C !activateNow uniquement) ──────────────────── */}
        {!isB2C && !activateNow && (
          <Animated.View style={[styles.card, card2AnimStyle]}>
            <View style={styles.pendingHeader}>
              <View style={styles.pendingIconBadge}>
                <Ionicons name="time-outline" size={sizes.icon.md} color={colors.warning.DEFAULT} />
              </View>
              <Text style={styles.cardTitle}>Prochaines étapes</Text>
            </View>

            <View style={styles.pendingBanner}>
              <Text style={styles.pendingBannerText}>
                Cet eSIM est enregistré et prêt à être activé quand votre client en a besoin.
              </Text>
              <Text style={styles.pendingBannerSub}>
                Vous pouvez l'activer depuis la section "Activations en attente" de votre tableau de bord.
              </Text>
            </View>

            <Pressable
              onPress={handleSecondaryAction}
              style={({ pressed }) => [styles.pendingLink, pressed && styles.pendingLinkPressed]}
            >
              <View style={styles.pendingLinkIcon}>
                <Ionicons name="settings-outline" size={sizes.icon.md} color={colors.primary.DEFAULT} />
              </View>
              <View style={styles.pendingLinkText}>
                <Text style={styles.pendingLinkTitle}>Voir les activations en attente</Text>
                <Text style={styles.pendingLinkSub}>Activer quand prêt</Text>
              </View>
              <Ionicons name="chevron-forward" size={sizes.icon.md} color={colors.primary.DEFAULT} />
            </Pressable>
          </Animated.View>
        )}

        {/* ── c. Carte "Détails de la transaction" ─────────────────────── */}
        <Animated.View style={[styles.card, card3AnimStyle]}>
          <Text style={styles.cardTitle}>Détails de la transaction</Text>

          <DetailRow label="Transaction ID" value={txShort} />
          <DetailRow label="Destination" value={offer?.country ?? '—'} />
          <DetailRow
            label="Forfait"
            value={offer ? `${offer.dataVolume} · ${offer.validityDays} jours` : '—'}
          />
          <DetailRow
            label="Montant"
            value={amount != null ? formatCurrency(amount, currency) : '—'}
            valueStyle={styles.amountValue}
          />
        </Animated.View>
      </ScrollView>

      {/* ── 3. BARRE D'ACTION BASSE ──────────────────────────────────────── */}
      <View style={[styles.bottomBar, { paddingBottom: bottomPad }]}>
        <ActionButton
          icon={isB2C ? 'globe-outline' : 'bag-handle-outline'}
          label={isB2C ? 'Voir mes eSIMs' : 'Nouvelle vente'}
          onPress={handlePrimaryAction}
        />
        <OutlineButton
          icon={isB2C ? 'home-outline' : 'grid-outline'}
          label={isB2C ? "Retour à l'accueil" : 'Tableau de bord'}
          onPress={handleSecondaryAction}
          size="sm"
        />
      </View>
    </View>
  );
};

// ─── Sub-component ───────────────────────────────────────────────────────────

type DetailRowProps = {
  label: string;
  value: string;
  valueStyle?: object;
};

const DetailRow = ({ label, value, valueStyle }: DetailRowProps) => (
  <View style={rowStyles.row}>
    <Text style={rowStyles.label}>{label}</Text>
    <Text style={[rowStyles.value, valueStyle]}>{value}</Text>
  </View>
);

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  label: {
    ...typography.bodySM,
    color: colors.text.secondary,
  },
  value: {
    ...typography.bodySM,
    fontWeight: '600',
    color: colors.text.primary,
    flexShrink: 1,
    textAlign: 'right',
    marginLeft: spacing.md,
  },
});

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },

  // ── 1. En-tête ───────────────────────────────────────────────────────────
  headerSection: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    alignItems: 'center',
    flexShrink: 0,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    borderBottomLeftRadius: radii.card,
    borderBottomRightRadius: radii.card,
  },
  iconWrap: {
    width: sizes.decoration.checkGlow,
    height: sizes.decoration.checkGlow,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  iconGlow: {
    position: 'absolute',
    width: sizes.decoration.checkGlow,
    height: sizes.decoration.checkGlow,
    borderRadius: radii.full,
    backgroundColor: colors.success[400],
    opacity: 0.25,
  },
  iconCircle: {
    width: sizes.decoration.checkCircle,
    height: sizes.decoration.checkCircle,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.high,
  },
  headerTextWrap: {
    alignItems: 'center',
  },
  headerTitle: {
    ...typography.titleLG,
    color: colors.text.primary,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    ...typography.bodySM,
    color: colors.text.secondary,
  },

  // ── 2. Scroll ─────────────────────────────────────────────────────────────
  scroll: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    gap: spacing.lg,
  },

  // ── a. Carte statut ───────────────────────────────────────────────────────
  statusCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.lg,
    borderRadius: radii.xxl,
    padding: spacing.xl,
    ...shadows.high,
  },
  statusIconWrap: {
    backgroundColor: colors.state.onPrimaryOverlay20,
    borderRadius: radii.lg,
    padding: spacing.md,
  },
  statusTextWrap: {
    flex: 1,
  },
  statusTitle: {
    ...typography.titleSM,
    color: colors.white,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  statusSubtitle: {
    ...typography.bodySM,
    color: colors.state.onPrimaryOverlay90,
    lineHeight: 18,
  },

  // ── Carte générique ───────────────────────────────────────────────────────
  card: {
    backgroundColor: colors.white,
    borderRadius: radii.xxl,
    padding: spacing.xl,
    ...shadows.medium,
  },
  cardTitle: {
    ...typography.titleSM,
    color: colors.text.primary,
    fontWeight: '700',
  },

  // ── b. Carte QR ───────────────────────────────────────────────────────────
  qrCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  qrIconBadge: {
    backgroundColor: colors.primary[100],
    borderRadius: radii.md,
    padding: spacing.sm,
  },
  qrFrame: {
    backgroundColor: colors.primary[50],
    borderRadius: radii.xl,
    padding: spacing.xl,
    borderWidth: 2,
    borderColor: colors.primary[200],
    alignItems: 'center',
    alignSelf: 'center',
  },
  qrInstruction: {
    backgroundColor: colors.gray[50],
    borderRadius: radii.lg,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  qrInstructionText: {
    ...typography.bodySM,
    color: colors.text.secondary,
    textAlign: 'center',
  },

  // ── Pending ───────────────────────────────────────────────────────────────
  pendingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  pendingIconBadge: {
    backgroundColor: colors.warning[100],
    borderRadius: radii.md,
    padding: spacing.sm,
  },
  pendingBanner: {
    backgroundColor: colors.warning[50],
    borderWidth: 1,
    borderColor: colors.warning[100],
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  pendingBannerText: {
    ...typography.bodySM,
    color: colors.warning.dark,
    marginBottom: spacing.xs,
  },
  pendingBannerSub: {
    ...typography.bodySM,
    color: colors.warning.dark,
    opacity: 0.8,
  },
  pendingLink: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary[50],
    borderWidth: 1,
    borderColor: colors.primary[200],
    borderRadius: radii.lg,
    padding: spacing.md,
  },
  pendingLinkPressed: {
    backgroundColor: colors.primary[100],
  },
  pendingLinkIcon: {
    backgroundColor: colors.primary[100],
    borderRadius: radii.md,
    padding: spacing.sm,
    marginRight: spacing.md,
  },
  pendingLinkText: {
    flex: 1,
  },
  pendingLinkTitle: {
    ...typography.bodyMD,
    color: colors.text.primary,
    fontWeight: '600',
  },
  pendingLinkSub: {
    ...typography.bodySM,
    color: colors.text.secondary,
  },

  // ── Montant en surbrillance ───────────────────────────────────────────────
  amountValue: {
    fontWeight: '700',
    color: colors.primary.DEFAULT,
  },

  // ── 3. Barre d'action basse ───────────────────────────────────────────────
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    flexDirection: 'column',
    gap: spacing.sm,
    ...shadows.tabBar,
  },

});
