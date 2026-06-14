import { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';
import { ActionButton, OutlineButton, PurpleButton } from '../../components/Buttons';
import { ErrorBanner } from '../../components/ErrorBanner';
import { LoadingOverlay } from '../../components/LoadingOverlay';
import { RechargeBottomSheet } from '../../components/RechargeBottomSheet';
import { StatusBadge } from '../../components/StatusBadge';
import { useEsimDetail, useDeleteEsim, useSyncEsim } from '../../hooks/client/useEsims';
import type { EsimsStackParamList } from '../../navigation/types';
import { colors, radii, shadows, sizes, spacing, typography } from '../../theme';
import { formatDate } from '../../utils/formatDate';
import { countryNameFr } from '../../utils/countryNameFr';

type Props = NativeStackScreenProps<EsimsStackParamList, 'EsimDetail'>;

// Approximate button height — matches minHeight used in ActionButton/PurpleButton/OutlineButton
const BTN_H = sizes.touch.md + spacing.xs; // 48 + 4 = 52

const InfoRow = ({ label, value, mono, last }: {
  label: string; value: string; mono?: boolean; last?: boolean;
}) => (
  <View style={[styles.infoRow, last && styles.infoRowLast]}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={[styles.infoValue, mono && styles.infoValueMono]}>{value}</Text>
  </View>
);

export const EsimDetailScreen = ({ navigation, route }: Props) => {
  const { esimId } = route.params;
  const insets = useSafeAreaInsets();
  const esimQuery = useEsimDetail(esimId);
  const syncMutation = useSyncEsim();
  const deleteMutation = useDeleteEsim();
  const [showRecharge, setShowRecharge] = useState(false);

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

  const esim = esimQuery.data;
  const isActive = esim.status === 'ACTIVE';
  const countryLabel = countryNameFr(esim.countryCode, esim.country);
  const used = esim.dataUsed ?? 0;
  const total = esim.dataTotal ?? 0;
  const bottomPad = Math.max(spacing.lg, insets.bottom);

  // Footer height: paddingTop + (recharge btn + gap if active) + sync btn + gap + delete btn + paddingBottom
  const footerBtnCount = isActive ? 3 : 2;
  const footerHeight =
    spacing.md +
    footerBtnCount * BTN_H +
    (footerBtnCount - 1) * spacing.md +
    bottomPad;

  const onDelete = () => {
    Alert.alert('Supprimer eSIM', 'Confirmer la suppression de cette eSIM ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
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

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={({ pressed }) => [styles.iconButton, pressed && styles.iconButtonPressed]}
          >
            <Ionicons name="arrow-back" size={sizes.icon.md} color={colors.text.primary} />
          </Pressable>

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle} numberOfLines={1}>{countryLabel}</Text>
            <StatusBadge status={esim.status} />
          </View>

          {/* Spacer to mirror back button */}
          <View style={styles.iconButton} />
        </View>
      </View>

      {/* ── Scroll ─────────────────────────────────────────────────────────── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: footerHeight + spacing.lg }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Card 1 — Données consommées */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Données consommées</Text>
          <View style={styles.dataRow}>
            <Text style={styles.dataUsed}>{(used / 1000).toFixed(1)} GB</Text>
            <Text style={styles.dataDivider}> / </Text>
            <Text style={styles.dataTotal}>{(total / 1000).toFixed(1)} GB</Text>
          </View>
          {total > 0 ? (
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${Math.min((used / total) * 100, 100)}%` as any },
                ]}
              />
            </View>
          ) : null}
          {total > 0 ? (
            <Text style={styles.dataCaption}>
              {(Math.max(0, total - used) / 1000).toFixed(1)} GB restants
            </Text>
          ) : null}
        </View>

        {/* Card 2 — Code QR */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Code d'activation</Text>
          <View style={styles.qrWrap}>
            {esim.activationCode ? (
              <QRCode value={esim.activationCode} size={180} />
            ) : (
              <View style={styles.qrEmpty}>
                <Ionicons name="qr-code-outline" size={sizes.icon.xl} color={colors.text.tertiary} />
                <Text style={styles.qrEmptyText}>Code non disponible</Text>
              </View>
            )}
          </View>
          {esim.activationCode ? (
            <Text selectable style={styles.activationCode}>
              {esim.activationCode}
            </Text>
          ) : null}
        </View>

        {/* Card 3 — Informations */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Informations</Text>
          <InfoRow label="ICCID" value={esim.iccid || '--'} mono />
          <InfoRow
            label="Date d'activation"
            value={esim.createdAt ? formatDate(esim.createdAt) : '--'}
          />
          <InfoRow
            label="Date d'expiration"
            value={esim.expiryDate ? formatDate(esim.expiryDate) : '--'}
            last
          />
        </View>
      </ScrollView>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <View style={[styles.footer, { paddingBottom: bottomPad }]}>
        {isActive ? (
          <ActionButton
            label="Recharger les données"
            icon="add-circle-outline"
            onPress={() => setShowRecharge(true)}
          />
        ) : null}
        <PurpleButton
          label={syncMutation.isPending ? 'Synchronisation…' : 'Synchroniser'}
          icon="sync-outline"
          disabled={syncMutation.isPending}
          onPress={() => syncMutation.mutate(esim.id)}
        />
        <OutlineButton
          label={deleteMutation.isPending ? 'Suppression…' : 'Supprimer'}
          icon="trash-outline"
          color="error"
          disabled={deleteMutation.isPending}
          onPress={onDelete}
        />
      </View>

      <RechargeBottomSheet
        esim={esim}
        visible={showRecharge}
        onClose={() => setShowRecharge(false)}
      />
    </View>
  );
};

/* ─── Styles ─────────────────────────────────────────────────────────────── */

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  errorWrap: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.xl,
    justifyContent: 'center',
  },

  // ── Header ────────────────────────────────────────────────────────────────
  header: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
    ...shadows.low,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  iconButton: {
    width: sizes.iconWrap.sm,
    height: sizes.iconWrap.sm,
    borderRadius: radii.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonPressed: {
    backgroundColor: colors.gray[100],
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
    marginHorizontal: spacing.md,
  },
  headerTitle: {
    ...typography.titleMD,
    color: colors.text.primary,
    fontWeight: '700',
  },

  // ── Scroll ────────────────────────────────────────────────────────────────
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    gap: spacing.lg,
  },

  // ── Card ──────────────────────────────────────────────────────────────────
  card: {
    backgroundColor: colors.surfaceCard,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    ...shadows.medium,
  },
  cardTitle: {
    ...typography.titleSM,
    color: colors.text.primary,
    fontWeight: '700',
    marginBottom: spacing.md,
  },

  // ── Card 1: Données ───────────────────────────────────────────────────────
  dataRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: spacing.md,
  },
  dataUsed: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.primary.DEFAULT,
    letterSpacing: -0.5,
  },
  dataDivider: {
    ...typography.bodyLG,
    color: colors.text.tertiary,
  },
  dataTotal: {
    ...typography.bodyLG,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  progressTrack: {
    height: sizes.progressBar.height,
    backgroundColor: colors.border,
    borderRadius: radii.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary.DEFAULT,
    borderRadius: radii.full,
  },
  dataCaption: {
    ...typography.bodySM,
    color: colors.text.secondary,
    marginTop: spacing.sm,
  },

  // ── Card 2: QR ────────────────────────────────────────────────────────────
  qrWrap: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    marginBottom: spacing.md,
  },
  qrEmpty: {
    width: 180,
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  qrEmptyText: {
    ...typography.bodySM,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
  activationCode: {
    ...typography.caption,
    fontFamily: 'monospace',
    color: colors.text.secondary,
    textAlign: 'center',
    letterSpacing: 0.4,
  },

  // ── Card 3: Info ──────────────────────────────────────────────────────────
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  infoRowLast: { borderBottomWidth: 0 },
  infoLabel: { ...typography.labelSM, color: colors.text.secondary },
  infoValue: {
    ...typography.labelSM,
    fontWeight: '700',
    color: colors.text.primary,
    maxWidth: '60%',
    textAlign: 'right',
  },
  infoValueMono: { fontFamily: 'monospace', letterSpacing: 0.5 },

  // ── Footer ────────────────────────────────────────────────────────────────
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    gap: spacing.md,
    ...shadows.high,
  },
});
