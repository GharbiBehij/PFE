import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, patterns, radii, spacing, typography } from '../../theme';
import type { Esim } from '../../types/esim';
import { CountryFlag } from '../CountryFlag';

type EsimCardProps = {
  esim: Esim;
  onPress: () => void;
  onRecharge?: () => void;
};

const getDaysRemaining = (expiryDate?: string): number | null => {
  if (!expiryDate) return null;
  const diff = new Date(expiryDate).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

const getPlanLabel = (esim: Esim): string => {
  const gb = esim.offer?.dataVolume ?? null;
  const days = esim.offer?.validityDays ?? null;
  if (gb && days) return `${gb} · ${days} jours`;
  if (gb) return String(gb);
  if (days) return `${days} jours`;
  return '';
};

export const EsimCard = ({ esim, onPress, onRecharge }: EsimCardProps) => {
  const used = esim.dataUsed ?? 0;
  const total = esim.dataTotal ?? 1;
  const ratio = Math.min(used / total, 1);
  const pct = Math.round(ratio * 100);
  const isLow = ratio > 0.8;
  const daysLeft = getDaysRemaining(esim.expiryDate);
  const plan = getPlanLabel(esim);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Voir la eSIM ${esim.country}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        isLow && styles.cardLow,
        pressed ? styles.cardPressed : undefined,
      ]}
    >
      {/* Row 1: flag + name/plan + status badge */}
      <View style={styles.topRow}>
        <View style={styles.flagCircle}>
          <CountryFlag countryCode={esim.countryCode} size={20} />
        </View>
        <View style={styles.nameBlock}>
          <Text style={styles.country}>{esim.country}</Text>
          {plan ? <Text style={styles.plan}>{plan}</Text> : null}
        </View>
        <View style={[styles.statusBadge, isLow ? styles.statusBadgeLow : styles.statusBadgeActive]}>
          <Text style={[styles.statusText, isLow ? styles.statusTextLow : styles.statusTextActive]}>
            ● {isLow ? 'Bientôt épuisé' : 'Actif'}
          </Text>
        </View>
      </View>

      {/* Row 2: usage labels */}
      <View style={styles.usageRow}>
        <Text style={styles.usageLabel}>{pct}% utilisé</Text>
        {daysLeft !== null && (
          <Text style={styles.usageLabel}>{daysLeft} jours restants</Text>
        )}
      </View>

      {/* Row 3: progress bar */}
      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            { width: `${pct}%` as unknown as number },
            isLow ? styles.progressFillLow : undefined,
          ]}
        />
      </View>

      {/* Row 4: recharge button */}
      {onRecharge ? (
        <Pressable
          onPress={(e) => {
            e.stopPropagation();
            onRecharge();
          }}
          style={({ pressed }) => [styles.rechargeButton, pressed && styles.rechargeButtonPressed]}
        >
          <Ionicons name="add" size={13} color={colors.primary.DEFAULT} />
          <Text style={styles.rechargeText}>Recharger en data</Text>
        </Pressable>
      ) : null}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    ...patterns.card,
    marginBottom: spacing.sm,
    padding: spacing.md,
    gap: spacing.sm,
  },
  cardLow: {
    borderColor: colors.secondary[200],
  },
  cardPressed: {
    transform: [{ scale: 0.98 }],
  },

  /* top row */
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  flagCircle: {
    width: 38,
    height: 38,
    borderRadius: radii.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  nameBlock: {
    flex: 1,
    minWidth: 0,
  },
  country: {
    ...typography.labelMD,
    color: colors.text.primary,
  },
  plan: {
    ...typography.bodyXS,
    color: colors.text.secondary,
    marginTop: 2,
  },
  statusBadge: {
    borderRadius: radii.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderWidth: 1,
    flexShrink: 0,
  },
  statusBadgeActive: {
    backgroundColor: colors.success[50],
    borderColor: colors.success[100],
  },
  statusBadgeLow: {
    backgroundColor: colors.warning[100],
    borderColor: colors.secondary[200],
  },
  statusText: {
    fontSize: 9,
    fontWeight: '700',
  },
  statusTextActive: {
    color: colors.success.dark,
  },
  statusTextLow: {
    color: colors.warning.dark,
  },

  /* usage */
  usageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  usageLabel: {
    ...typography.bodyXS,
    color: colors.text.tertiary,
  },

  /* progress */
  progressTrack: {
    height: 5,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radii.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary.DEFAULT,
    borderRadius: radii.full,
  },
  progressFillLow: {
    backgroundColor: colors.warning.DEFAULT,
  },

  /* recharge button */
  rechargeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary[100],
    borderWidth: 1,
    borderColor: colors.primary.DEFAULT,
    borderRadius: radii.md,
    paddingVertical: spacing.sm,
  },
  rechargeButtonPressed: {
    backgroundColor: colors.primary[200],
  },
  rechargeText: {
    ...typography.labelSM,
    color: colors.primary.DEFAULT,
  },
});
