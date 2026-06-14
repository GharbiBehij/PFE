import { useEffect, useState } from 'react';
import {
  Alert, Image, Pressable, ScrollView,
  StatusBar, StyleSheet, Text, View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ActionButton, OutlineButton } from '../../components/Buttons';
import { DailyUsageChart } from '../../components/DailyUsageChart';
import { ErrorBanner } from '../../components/ErrorBanner';
import { LoadingOverlay } from '../../components/LoadingOverlay';
import { PaymentWebViewModal } from '../../components/PaymentWebViewModal';
import { RechargeBottomSheet } from '../../components/RechargeBottomSheet';
import { UsageRing } from '../../components/UsageRing';
import { useEsimDetail, useEsimUsage, useDeleteEsim, useSyncEsim } from '../../hooks/client/useEsims';
import type { EsimsStackParamList } from '../../navigation/types';
import { colors, radii, shadows, sizes, spacing, typography } from '../../theme';
import { formatDate } from '../../utils/formatDate';
import { normalizeCountryCode } from '../../utils/countryCode';
import { countryNameFr } from '../../utils/countryNameFr';

type Props = NativeStackScreenProps<EsimsStackParamList, 'EsimConsumption'>;

const differenceInDays = (targetDate?: string): number => {
  if (!targetDate) return 0;
  const diff = new Date(targetDate).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

const maskIccid = (iccid: string): string => {
  if (!iccid) return '--';
  const compact = iccid.replace(/\s+/g, '');
  if (compact.length < 8) return compact;
  return `${compact.slice(0, 4)} ${compact.slice(4, 8)} ••• ${compact.slice(-4)}`;
};

const flagUrl = (code: string) => `https://flagcdn.com/w160/${code.toLowerCase()}.png`;

/* ─── Sub-components ───────────────────────────────────────────────────────── */

const SectionLabel = ({ label, right }: { label: string; right?: string }) => (
  <View style={styles.sectionTitle}>
    <Text style={styles.sectionLabel}>{label}</Text>
    {right ? <Text style={styles.sectionRight}>{right}</Text> : null}
  </View>
);

const InfoRow = ({ label, value, mono, last }: {
  label: string; value: string; mono?: boolean; last?: boolean;
}) => (
  <View style={[styles.infoRow, last && styles.infoRowLast]}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={[styles.infoValue, mono && styles.infoValueMono]}>{value}</Text>
  </View>
);

const MiniPill = ({ icon, value, label }: {
  icon: keyof typeof Ionicons.glyphMap; value: string; label: string;
}) => (
  <View style={styles.miniPill}>
    <Ionicons name={icon} size={sizes.icon.xs} color={colors.white} />
    <Text style={styles.miniPillValue}>{value}</Text>
    <Text style={styles.miniPillLabel}>{label}</Text>
  </View>
);

/* ─── Screen ─────────────────────────────────────────────────────────────── */

export const EsimConsumptionScreen = ({ navigation, route }: Props) => {
  const { esimId } = route.params;
  const insets = useSafeAreaInsets();
  const esimQuery   = useEsimDetail(esimId);
  const usageQuery  = useEsimUsage(esimId);
  const deleteMutation = useDeleteEsim();
  const syncMutation   = useSyncEsim();
  const [flagFailed, setFlagFailed]     = useState(false);
  const [showRecharge, setShowRecharge] = useState(false);
  const [paymentData, setPaymentData]   = useState<{
    paymentUrl: string; transactionId: number; channel: 'B2C' | 'B2B2C';
  } | null>(null);

  const isoCode = normalizeCountryCode(esimQuery.data?.countryCode ?? '');
  useEffect(() => { setFlagFailed(false); }, [isoCode]);

  if (esimQuery.isLoading) return <LoadingOverlay fullScreen />;

  if (esimQuery.isError || !esimQuery.data) {
    return (
      <View style={styles.errorWrap}>
        <ErrorBanner
          message="Impossible de charger cette eSIM."
          onRetry={() => esimQuery.refetch()}
        />
      </View>
    );
  }

  const esim      = esimQuery.data;
  const isActive  = esim.status === 'ACTIVE';
  const isPending = esim.status === 'NOT_ACTIVE';

  const used      = esim.dataUsed ?? 0;
  const total     = esim.dataTotal ?? 1;
  const remaining = Math.max(0, total - used);
  const pctUsed   = (used / Math.max(total, 1)) * 100;
  const isLow     = pctUsed >= 80 && isActive;
  const countryLabel = countryNameFr(esim.countryCode, esim.country);
  const daysLeft     = differenceInDays(esim.expiryDate);

  const dailyData = (usageQuery.data?.length ? usageQuery.data : Array(14).fill(0)) as number[];
  const avgDaily  = dailyData.some(v => v > 0)
    ? Math.round(dailyData.reduce((a, b) => a + b, 0) / dailyData.length) : 0;

  const planLabel  = `${esim.offer?.dataVolume ?? '--'} · ${esim.offer?.validityDays ?? '--'} jours`;
  const validUntil = esim.expiryDate ? `Jusqu'au ${formatDate(esim.expiryDate)}` : '--';
  const ringColor  = isLow ? colors.secondary.DEFAULT : colors.white;

  const bottomPad = Math.max(spacing.md, insets.bottom);

  const onDelete = () => {
    Alert.alert('Supprimer eSIM', 'Confirmer la suppression de cette eSIM ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer', style: 'destructive',
        onPress: async () => {
          try {
            await deleteMutation.mutateAsync(esim.id);
            navigation.goBack();
          } catch {
            Alert.alert('Erreur', 'Suppression impossible pour le moment.');
          }
        },
      },
    ]);
  };

  const onMore = () => {
    Alert.alert('Options eSIM', undefined, [
      {
        text: syncMutation.isPending ? 'Synchronisation…' : 'Synchroniser',
        onPress: () => syncMutation.mutate(esim.id),
      },
      { text: 'Supprimer l\'eSIM', style: 'destructive', onPress: onDelete },
      { text: 'Annuler', style: 'cancel' },
    ]);
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />

      {/* ── 1. HERO ─────────────────────────────────────────────────────── */}
      <LinearGradient
        colors={[colors.primary.dark, colors.primary.DEFAULT]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={[styles.hero, { paddingTop: insets.top + spacing.sm }]}
      >
        {/* Cercle décoratif — haut à droite */}
        <View style={styles.heroOrb} />

        {/* Barre du haut */}
        <View style={styles.topBar}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={({ pressed }) => [styles.iconBtn, pressed && styles.iconBtnPressed]}
          >
            <Ionicons name="chevron-back" size={sizes.icon.sm2} color={colors.white} />
          </Pressable>

          <View style={styles.titleStack}>
            <View style={styles.flagPill}>
              {flagFailed ? (
                <View style={styles.flagFallback}>
                  <Text style={styles.flagFallbackText}>
                    {isoCode || esim.countryCode?.toUpperCase()}
                  </Text>
                </View>
              ) : (
                <Image
                  source={{ uri: flagUrl(isoCode || esim.countryCode?.toUpperCase() || '') }}
                  style={styles.flagMini}
                  onError={() => setFlagFailed(true)}
                />
              )}
            </View>
            <View>
              <Text style={styles.heroOverline}>CONSOMMATION</Text>
              <Text style={styles.heroTitle}>{countryLabel}</Text>
            </View>
          </View>

          <Pressable
            onPress={onMore}
            style={({ pressed }) => [styles.iconBtn, pressed && styles.iconBtnPressed]}
          >
            <Ionicons name="ellipsis-vertical" size={sizes.icon.sm2} color={colors.white} />
          </Pressable>
        </View>

        {/* Anneau + infos */}
        <View style={styles.ringRow}>
          <UsageRing
            percent={isPending ? 100 : pctUsed}
            size={120} stroke={10}
            color={isPending ? colors.secondary.DEFAULT : ringColor}
            track={colors.state.onPrimaryOverlay18}
            centerTop={isPending ? 'Prêt' : `${(remaining / 1000).toFixed(1)}`}
            centerBottom={isPending ? '' : 'GB RESTANTS'}
            centerTopStyle={styles.ringCenterTop}
            centerBottomStyle={styles.ringCenterBottom}
          />

          <View style={styles.ringSide}>
            {isPending ? (
              <>
                <Text style={styles.heroOverline}>STATUT</Text>
                <Text style={styles.heroUsedNum}>À activer</Text>
                <Text style={styles.heroUsedTotal}>Scannez le QR ci-dessous</Text>
              </>
            ) : (
              <>
                <Text style={styles.heroOverline}>UTILISÉ</Text>
                <Text style={styles.heroUsedNum}>
                  {(used / 1000).toFixed(1)}
                  <Text style={styles.heroUsedTotal}> / {(total / 1000).toFixed(0)} GB</Text>
                </Text>
                <View style={styles.miniPillsRow}>
                  <MiniPill icon="time-outline" value={`${daysLeft} j`} label="restants" />
                  <MiniPill icon="trending-up-outline" value={`${avgDaily} MB`} label="/jour" />
                </View>
              </>
            )}
          </View>
        </View>
      </LinearGradient>

      {/* ── 2. ZONE SCROLLABLE ──────────────────────────────────────────── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingTop: spacing.lg, paddingBottom: 90 }}
        showsVerticalScrollIndicator={false}
      >
        {/* a. Consommation quotidienne */}
        <SectionLabel label="CONSOMMATION QUOTIDIENNE" right="14 derniers jours" />
        <Animated.View entering={FadeInDown.delay(0).duration(250)}>
          {isPending ? (
            <View style={styles.inactiveHint}>
              <Ionicons name="flash-outline" size={sizes.icon.sm} color={colors.secondary.DEFAULT} />
              <Text style={styles.inactiveHintText}>
                Activez votre eSIM pour suivre votre consommation quotidienne
              </Text>
            </View>
          ) : usageQuery.isLoading ? (
            <View style={styles.chartLoading}>
              <Text style={styles.chartLoadingText}>Chargement…</Text>
            </View>
          ) : (
            <DailyUsageChart data={dailyData} />
          )}
        </Animated.View>

        {/* b. Statistiques */}
        <SectionLabel label="STATISTIQUES" />
        <Animated.View entering={FadeInDown.delay(50).duration(250)} style={styles.statsGrid}>
          <View style={styles.statTile}>
            <View style={styles.statIconBox}>
              <Ionicons name="pulse-outline" size={sizes.icon.xs} color={colors.primary.DEFAULT} />
            </View>
            <Text style={styles.statLabel}>Moyenne/jour</Text>
            <Text style={styles.statValue}>{avgDaily} MB</Text>
          </View>
          <View style={styles.statTile}>
            <View style={styles.statIconBox}>
              <Ionicons name="trending-up" size={sizes.icon.xs} color={colors.success.DEFAULT} />
            </View>
            <Text style={styles.statLabel}>Pic d'utilisation</Text>
            <Text style={styles.statValue}>{Math.max(...dailyData)} MB</Text>
          </View>
          <View style={styles.statTile}>
            <View style={styles.statIconBox}>
              <Ionicons name="calendar-outline" size={sizes.icon.xs} color={colors.warning.DEFAULT} />
            </View>
            <Text style={styles.statLabel}>Jours restants</Text>
            <Text style={styles.statValue}>{daysLeft}</Text>
          </View>
          <View style={styles.statTile}>
            <View style={styles.statIconBox}>
              <Ionicons name="refresh-outline" size={sizes.icon.xs} color={colors.text.secondary} />
            </View>
            <Text style={styles.statLabel}>Dernière synchro</Text>
            <Text style={styles.statValue}>Maintenant</Text>
          </View>
        </Animated.View>

        {/* c. Détails du forfait */}
        <SectionLabel label="DÉTAILS DU FORFAIT" />
        <Animated.View entering={FadeInDown.delay(100).duration(250)} style={styles.infoCard}>
          <InfoRow label="Forfait" value={planLabel} />
          <InfoRow label="Validité" value={validUntil} />
          <InfoRow
            label="Statut"
            value={isActive ? 'Active' : isPending ? 'À activer' : 'Expirée'}
          />
          <InfoRow label="ICCID" value={maskIccid(esim.iccid)} mono last />
        </Animated.View>
      </ScrollView>

      {/* ── 3. BARRE D'ACTION BASSE ─────────────────────────────────────── */}
      <View style={[styles.bottomBar, { paddingBottom: bottomPad }]}>
        <OutlineButton
          label="Détails"
          icon="information-circle-outline"
          size="md"
          onPress={() => navigation.navigate('EsimDetail', { esimId: String(esim.id) })}
          style={styles.footerHalf}
        />
        <ActionButton
          label="Recharger"
          icon="add"
          size="md"
          onPress={() => setShowRecharge(true)}
          style={styles.footerHalf}
        />
      </View>

      <RechargeBottomSheet
        esim={esim}
        visible={showRecharge}
        onClose={() => setShowRecharge(false)}
        onPayment={(paymentUrl, transactionId, channel) => {
          setShowRecharge(false);
          setPaymentData({ paymentUrl, transactionId, channel });
        }}
      />

      {paymentData ? (
        <PaymentWebViewModal
          visible
          paymentUrl={paymentData.paymentUrl}
          transactionId={paymentData.transactionId}
          onClose={() => setPaymentData(null)}
          onSuccess={(txId) => {
            setPaymentData(null);
            (navigation.getParent() as any)?.navigate('HomeTab', {
              screen: 'ProcessingModal',
              params: { transactionId: txId, channel: paymentData.channel, mode: 'topup', esimId: String(esim.id) },
            });
          }}
          onFailed={(txId) => {
            setPaymentData(null);
            (navigation.getParent() as any)?.navigate('HomeTab', {
              screen: 'EsimFailed',
              params: { transactionId: txId },
            });
          }}
        />
      ) : null}
    </View>
  );
};

/* ─── Styles ─────────────────────────────────────────────────────────────── */

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  errorWrap: {
    flex: 1, backgroundColor: colors.background,
    padding: spacing.xl, justifyContent: 'center',
  },

  // ── Hero ────────────────────────────────────────────────────────────────
  hero: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
    borderBottomLeftRadius: radii.hero,
    borderBottomRightRadius: radii.hero,
    overflow: 'hidden',
  },
  heroOrb: {
    position: 'absolute', top: -40, right: -40,
    width: sizes.decoration.heroOrbSm,
    height: sizes.decoration.heroOrbSm,
    borderRadius: radii.full,
    backgroundColor: colors.white,
    opacity: 0.08,
  },
  topBar: {
    flexDirection: 'row', alignItems: 'center',
    gap: spacing.md, marginBottom: spacing.md,
  },
  iconBtn: {
    width: 38, height: 38, borderRadius: radii.full,
    backgroundColor: colors.state.onPrimaryOverlay18,
    borderWidth: 1, borderColor: colors.state.onPrimaryOverlay25,
    alignItems: 'center', justifyContent: 'center',
  },
  iconBtnPressed: { transform: [{ scale: 0.98 }] },
  titleStack: {
    flex: 1, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
  },
  flagPill: {
    backgroundColor: colors.state.onPrimaryOverlay15,
    padding: spacing.xxs, borderRadius: radii.xs,
  },
  flagMini: { width: 22, height: 17, borderRadius: radii.xs },
  flagFallback: {
    width: 22, height: 17, borderRadius: radii.xs,
    backgroundColor: colors.primary[100],
    alignItems: 'center', justifyContent: 'center',
  },
  flagFallbackText: { ...typography.bodyXS, color: colors.primary.dark, fontWeight: '700' },
  heroOverline: {
    ...typography.overline,
    color: colors.state.onPrimaryOverlay70,
    letterSpacing: 1.4,
  },
  heroTitle: {
    fontSize: 15, fontWeight: '800', color: colors.white, marginTop: 2,
  },

  // ── Ring row ─────────────────────────────────────────────────────────────
  ringRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: 18, marginTop: spacing.xl,
  },
  ringSide: { flex: 1 },
  ringCenterTop: { fontSize: 26, fontWeight: '800', color: colors.white },
  ringCenterBottom: {
    ...typography.overline, color: colors.state.onPrimaryOverlay70, fontSize: 10,
  },
  heroUsedNum: {
    fontSize: 22, fontWeight: '800', color: colors.white,
    letterSpacing: -0.3, marginTop: 2,
  },
  heroUsedTotal: { ...typography.bodySM, color: colors.state.onPrimaryOverlay80 },
  miniPillsRow: { flexDirection: 'row', gap: spacing.sm, marginTop: 14, flexWrap: 'wrap' },
  miniPill: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    backgroundColor: colors.state.onPrimaryOverlay12,
    borderWidth: 1, borderColor: colors.state.onPrimaryOverlay20,
    borderRadius: radii.full,
    paddingVertical: 5, paddingHorizontal: 10,
  },
  miniPillValue: { ...typography.caption, fontWeight: '800', color: colors.white },
  miniPillLabel: { ...typography.caption, color: colors.state.onPrimaryOverlay80 },

  // ── Scroll ───────────────────────────────────────────────────────────────
  scroll: { flex: 1 },

  // ── Section header ────────────────────────────────────────────────────────
  sectionTitle: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline',
    marginBottom: spacing.sm, marginLeft: spacing.xxl, marginRight: spacing.xxxl, marginTop: spacing.md,
  },
  sectionLabel: { ...typography.overline, color: colors.text.secondary, letterSpacing: 1.4 },
  sectionRight: { ...typography.caption, fontWeight: '700', color: colors.text.tertiary },

  // ── Chart loading ─────────────────────────────────────────────────────────
  chartLoading: {
    height: 80, alignItems: 'center', justifyContent: 'center',
    marginHorizontal: spacing.xxxl,
  },
  chartLoadingText: { ...typography.bodySM, color: colors.text.tertiary },

  // ── Inactive hint (shown instead of chart for NOT_ACTIVE eSIMs) ───────────
  inactiveHint: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.secondary[50],
    borderWidth: 1, borderColor: colors.secondary.DEFAULT,
    borderRadius: radii.lg,
    marginHorizontal: spacing.xxxl, marginBottom: spacing.sm,
    paddingVertical: spacing.md, paddingHorizontal: spacing.lg,
  },
  inactiveHintText: {
    ...typography.bodySM, color: colors.text.secondary,
    flex: 1, lineHeight: 18,
  },

  // ── Stats grid ────────────────────────────────────────────────────────────
  statsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm,
    marginHorizontal: spacing.xxxl, marginBottom: spacing.sm,
  },
  statTile: {
    width: '47%', backgroundColor: colors.surfaceCard,
    borderWidth: 1, borderColor: colors.border,
    borderRadius: radii.lg, padding: spacing.md, ...shadows.medium,
  },
  statIconBox: {
    width: 28, height: 28, borderRadius: radii.sm,
    backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border,
    marginBottom: spacing.sm, alignItems: 'center', justifyContent: 'center',
  },
  statLabel: {
    ...typography.caption, fontWeight: '600', color: colors.text.secondary,
  },
  statValue: {
    fontSize: 16, fontWeight: '800', color: colors.text.primary,
    marginTop: spacing.xxs, letterSpacing: -0.2,
  },

  // ── Plan info card ────────────────────────────────────────────────────────
  infoCard: {
    backgroundColor: colors.surfaceCard, borderRadius: radii.card,
    borderWidth: 1, borderColor: colors.border,
    marginHorizontal: spacing.xxxl, ...shadows.medium,
  },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: colors.borderSubtle,
  },
  infoRowLast: { borderBottomWidth: 0 },
  infoLabel: { ...typography.labelSM, color: colors.text.secondary },
  infoValue: {
    ...typography.labelSM, fontWeight: '700', color: colors.text.primary,
    maxWidth: '60%', textAlign: 'right',
  },
  infoValueMono: { fontFamily: 'monospace', letterSpacing: 0.5 },

  // ── 3. Barre d'action basse ───────────────────────────────────────────────
  bottomBar: {
    backgroundColor: colors.surface,
    borderTopWidth: 1, borderTopColor: colors.border,
    paddingHorizontal: spacing.xl, paddingTop: spacing.md,
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    ...shadows.high,
  },
  footerHalf: { flex: 1 },
});
