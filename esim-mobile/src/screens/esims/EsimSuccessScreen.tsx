import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
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
import { colors, radii, shadows, spacing, typography } from '../../theme';

type Props = NativeStackScreenProps<HomeStackParamList, 'EsimSuccess'>;

export const EsimSuccessScreen = ({ navigation, route }: Props) => {
  const { transactionId, channel } = route.params;
  const isB2C = channel === 'B2C';
  const insets = useSafeAreaInsets();
  const [showQR, setShowQR] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  const { data: transaction } = useTransactionById(String(transactionId), false);

  const activationCode  = transaction?.esim?.activationCode ?? '';
  const activateNow     = transaction?.esim?.status === 'ACTIVE';
  const offer           = transaction?.offer;
  const amount          = transaction?.amount;
  const currency        = transaction?.currency ?? 'TND';

  // ── Entrance animations ──────────────────────────────────────────────────
  const circleScale    = useSharedValue(0);
  const headerOpacity  = useSharedValue(0);
  const headerY        = useSharedValue(20);
  const card1Opacity   = useSharedValue(0);
  const card1Y         = useSharedValue(20);
  const card2Opacity   = useSharedValue(0);
  const card2Y         = useSharedValue(20);
  const card3Opacity   = useSharedValue(0);
  const card3Y         = useSharedValue(20);

  useEffect(() => {
    circleScale.value    = withSpring(1, { damping: 15, stiffness: 200 });
    headerOpacity.value  = withDelay(200, withTiming(1, { duration: 300 }));
    headerY.value        = withDelay(200, withTiming(0, { duration: 300 }));
    card1Opacity.value   = withDelay(300, withTiming(1, { duration: 300 }));
    card1Y.value         = withDelay(300, withTiming(0, { duration: 300 }));
    card2Opacity.value   = withDelay(400, withTiming(1, { duration: 300 }));
    card2Y.value         = withDelay(400, withTiming(0, { duration: 300 }));
    card3Opacity.value   = withDelay(500, withTiming(1, { duration: 300 }));
    card3Y.value         = withDelay(500, withTiming(0, { duration: 300 }));
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

  const handleShareCode = async () => {
    if (!activationCode) return;
    await Share.share({
      message: activationCode,
      title: `eSIM — ${offer?.country ?? ''}`,
    });
  };

  const handlePrimaryAction = () => {
    if (isB2C) {
      (navigation.getParent() as any)?.navigate('EsimsTab', {
        screen: 'MyEsims',
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

  const bottomPad = Math.max(spacing.md, insets.bottom);

  return (
    <View style={styles.root}>
      {/* ── Success Header ──────────────────────────────────────────────── */}
      <View style={styles.headerSection}>
        <Animated.View style={[styles.iconWrap, circleAnimStyle]}>
          <View style={styles.iconGlow} />
          <LinearGradient
            colors={['#4ade80', '#16a34a']}
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

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: spacing.xxxxxl + spacing.xxxl + bottomPad },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Activation Status Card ─────────────────────────────────────── */}
        <Animated.View style={card1AnimStyle}>
          <LinearGradient
            colors={activateNow
              ? ['#22c55e', '#10b981']
              : ['#facc15', '#f97316']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.statusCard}
          >
            <View style={styles.statusIconWrap}>
              <Ionicons
                name={activateNow ? 'phone-portrait-outline' : 'time-outline'}
                size={28}
                color={colors.white}
              />
            </View>
            <View style={styles.statusTextWrap}>
              <Text style={styles.statusTitle}>
                {activateNow ? 'Active et prête !' : 'En attente d\'activation'}
              </Text>
              <Text style={styles.statusSubtitle}>
                {isB2C
                  ? 'Scannez le QR code ci-dessous pour installer votre eSIM avant de partir.'
                  : activateNow
                    ? "L'eSIM est activée et prête à l'emploi. Partagez le code QR avec le client."
                    : "L'eSIM sera activée quand le client sera prêt à voyager."}
              </Text>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* ── QR Code Section (activateNow only) ────────────────────────── */}
        {activateNow && (
          <Animated.View style={[styles.card, card2AnimStyle]}>
            <View style={styles.qrSectionHeader}>
              <View style={styles.qrSectionLeft}>
                <View style={styles.qrIconBadge}>
                  <Ionicons name="qr-code-outline" size={20} color={colors.primary.DEFAULT} />
                </View>
                <Text style={styles.cardTitle}>Code QR eSIM</Text>
              </View>
              <Pressable
                onPress={() => setShowQR(!showQR)}
                style={({ pressed }) => [styles.toggleBtn, pressed && styles.toggleBtnPressed]}
              >
                <Text style={styles.toggleBtnText}>{showQR ? 'Masquer' : 'Afficher'}</Text>
              </Pressable>
            </View>

            {showQR && (
              <View style={styles.qrContent}>
                <View style={styles.qrCodeBox}>
                  {activationCode ? (
                    <QRCode value={activationCode} size={220} />
                  ) : (
                    <View style={styles.qrEmptyBox}>
                      <Text style={styles.qrEmptyText}>Code non disponible</Text>
                    </View>
                  )}
                </View>

                <View style={styles.qrInstructionRow}>
                  <Text style={styles.qrInstruction}>
                    {isB2C
                      ? '📱 Scannez ce QR code depuis les paramètres de votre téléphone'
                      : '📱 Le client doit scanner ce QR code avec son appareil'}
                  </Text>
                </View>

                <Pressable
                  onPress={() => { void handleShareCode(); }}
                  style={({ pressed }) => [styles.shareBtn, pressed && styles.shareBtnPressed]}
                >
                  <Ionicons name="share-outline" size={18} color={colors.white} />
                  <Text style={styles.shareBtnText}>
                    {isB2C ? 'Partager le code' : 'Partager avec le client'}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => setShowInstructions(!showInstructions)}
                  style={styles.instructionsToggle}
                >
                  <Ionicons name="settings-outline" size={16} color={colors.primary.DEFAULT} />
                  <Text style={styles.instructionsToggleText}>
                    {showInstructions ? 'Masquer' : 'Afficher'} les instructions d'installation
                  </Text>
                </Pressable>

                {showInstructions && (
                  <View style={styles.instructionsBox}>
                    <Text style={styles.instructionsTitle}>
                      {isB2C ? "Comment installer votre eSIM" : "Comment installer l'eSIM"}
                    </Text>
                    {[
                      'Allez dans Paramètres → Données mobiles',
                      'Appuyez sur "Ajouter une eSIM" ou "Ajouter un forfait",',
                      'Scannez le QR code affiché ci-dessus',
                      'Suivez les instructions à l\'écran pour terminer',
                      'Activez la nouvelle eSIM à l\'arrivée à destination',
                    ].map((step, i) => (
                      <View key={i} style={styles.instructionRow}>
                        <Text style={styles.instructionNumber}>{i + 1}.</Text>
                        <Text style={styles.instructionText}>{step}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}
          </Animated.View>
        )}

        {/* ── Pending Activation Instructions (not activateNow) ────────── */}
        {!activateNow && (
          <Animated.View style={[styles.card, card2AnimStyle]}>
            <View style={styles.pendingHeader}>
              <View style={[styles.qrIconBadge, styles.pendingIconBadge]}>
                <Ionicons name="time-outline" size={20} color={colors.warning.DEFAULT} />
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
              <View style={[styles.qrIconBadge, { marginRight: spacing.md }]}>
                <Ionicons name="settings-outline" size={20} color={colors.primary.DEFAULT} />
              </View>
              <View style={styles.pendingLinkText}>
                <Text style={styles.pendingLinkTitle}>Voir les activations en attente</Text>
                <Text style={styles.pendingLinkSub}>Activer quand prêt</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.primary.DEFAULT} />
            </Pressable>
          </Animated.View>
        )}

        {/* ── Transaction Details ────────────────────────────────────────── */}
        <Animated.View style={[styles.card, card3AnimStyle]}>
          <Text style={styles.cardTitle}>Détails de la transaction</Text>

          <DetailRow label="Transaction ID" value={String(transactionId)} />
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

      {/* ── Bottom Actions ──────────────────────────────────────────────── */}
      <View style={[styles.bottomBar, { paddingBottom: bottomPad }]}>
        {/* Primary button */}
        <Pressable
          onPress={handlePrimaryAction}
          style={({ pressed }) => [
            styles.newSaleBtn,
            isB2C && styles.newSaleBtnB2C,
            pressed && styles.newSaleBtnPressed,
          ]}
        >
          <Ionicons
            name={isB2C ? 'globe-outline' : 'add-circle-outline'}
            size={20}
            color={isB2C ? colors.white : colors.gray[900]}
          />
          <Text style={[
            styles.newSaleBtnText,
            isB2C && styles.newSaleBtnTextB2C,
          ]}>
            {isB2C ? 'Voir mes eSIMs' : 'Nouvelle vente'}
          </Text>
        </Pressable>

        {/* Secondary button */}
        <Pressable
          onPress={handleSecondaryAction}
          style={({ pressed }) => [
            styles.dashboardBtn,
            pressed && styles.dashboardBtnPressed,
          ]}
        >
          <Ionicons
            name={isB2C ? 'home-outline' : 'grid-outline'}
            size={20}
            color={colors.gray[700]}
          />
          <Text style={styles.dashboardBtnText}>
            {isB2C ? "Retour à l'accueil" : 'Tableau de bord'}
          </Text>
        </Pressable>
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
    color: colors.text.primary,
    fontWeight: '600',
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

  // Header
  headerSection: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxxxxl,
    paddingBottom: spacing.xl,
    alignItems: 'center',
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  iconGlow: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#4ade80',
    opacity: 0.25,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
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

  // Scroll
  scroll: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    gap: spacing.lg,
  },

  // Status card
  statusCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.lg,
    borderRadius: radii.xxl,
    padding: spacing.xl,
    ...shadows.high,
  },
  statusIconWrap: {
    backgroundColor: 'rgba(255,255,255,0.2)',
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
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 18,
  },

  // Generic card
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

  // QR section
  qrSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  qrSectionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  qrIconBadge: {
    backgroundColor: colors.primary[100],
    borderRadius: radii.md,
    padding: spacing.sm,
  },
  toggleBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  toggleBtnPressed: {
    opacity: 0.6,
  },
  toggleBtnText: {
    ...typography.bodySM,
    color: colors.primary.DEFAULT,
    fontWeight: '600',
  },
  qrContent: {
    alignItems: 'center',
    marginTop: spacing.md,
    gap: spacing.md,
  },
  qrCodeBox: {
    backgroundColor: colors.primary[50],
    borderRadius: radii.xl,
    padding: spacing.xl,
    borderWidth: 2,
    borderColor: colors.primary[200],
  },
  qrEmptyBox: {
    width: 220,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrEmptyText: {
    ...typography.bodyMD,
    color: colors.text.tertiary,
  },
  qrInstructionRow: {
    backgroundColor: colors.gray[50],
    borderRadius: radii.lg,
    padding: spacing.md,
    width: '100%',
  },
  qrInstruction: {
    ...typography.bodySM,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary.DEFAULT,
    borderRadius: radii.lg,
    paddingVertical: spacing.md,
    width: '100%',
  },
  shareBtnPressed: {
    backgroundColor: colors.primary.dark,
    transform: [{ scale: 0.98 }],
  },
  shareBtnText: {
    ...typography.labelMD,
    color: colors.white,
    fontWeight: '600',
  },
  instructionsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  instructionsToggleText: {
    ...typography.bodySM,
    color: colors.primary.DEFAULT,
    fontWeight: '600',
  },
  instructionsBox: {
    backgroundColor: colors.info[50],
    borderWidth: 1,
    borderColor: colors.info[100],
    borderRadius: radii.lg,
    padding: spacing.md,
    width: '100%',
  },
  instructionsTitle: {
    ...typography.labelMD,
    color: '#1e3a8a',
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  instructionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  instructionNumber: {
    ...typography.bodySM,
    color: '#1e40af',
    fontWeight: '700',
  },
  instructionText: {
    ...typography.bodySM,
    color: '#1e40af',
    flex: 1,
  },

  // Pending section
  pendingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  pendingIconBadge: {
    backgroundColor: colors.warning[100],
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

  // Amount value
  amountValue: {
    color: colors.primary.DEFAULT,
    fontWeight: '700',
  },

  // Bottom bar
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
    gap: spacing.sm,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
  },
  newSaleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.secondary.DEFAULT,
    borderRadius: radii.lg,
    paddingVertical: spacing.md,
    shadowColor: colors.secondary.DEFAULT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  newSaleBtnB2C: {
    backgroundColor: colors.primary.DEFAULT,
    shadowColor: colors.primary.DEFAULT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  newSaleBtnPressed: {
    backgroundColor: colors.secondary.dark,
    transform: [{ scale: 0.98 }],
  },
  newSaleBtnText: {
    ...typography.labelMD,
    color: colors.gray[900],
    fontWeight: '700',
  },
  newSaleBtnTextB2C: {
    color: colors.white,
  },
  dashboardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.gray[100],
    borderRadius: radii.lg,
    paddingVertical: spacing.md,
  },
  dashboardBtnPressed: {
    backgroundColor: colors.gray[200],
    transform: [{ scale: 0.98 }],
  },
  dashboardBtnText: {
    ...typography.labelMD,
    color: colors.gray[700],
    fontWeight: '600',
  },
});
