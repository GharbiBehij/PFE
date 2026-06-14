import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, patterns, radii, shadows, spacing, typography } from '../../theme';
import type { Esim } from '../../types/esim';
import { CountryFlag } from '../CountryFlag';

type EsimCardProps = {
  esim: Esim;
  onPress: () => void;        // â†’ DÃ©tails / view QR
  onRecharge?: () => void;    // â†’ open RechargeBottomSheet (ACTIVE only)
  onActivate?: () => void;    // â†’ scan QR to activate (NOT_ACTIVE only)
};

const getDaysRemaining = (expiryDate?: string): number | null => {
  if (!expiryDate) return null;
  const diff = new Date(expiryDate).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

const getPlanLabel = (esim: Esim): string => {
  const gb = esim.offer?.dataVolume ?? null;
  const days = esim.offer?.validityDays ?? null;
  if (gb && days) return `${gb} Â· ${days} jours`;
  if (gb) return `${gb} GB`;
  if (days) return `${days} jours`;
  return '';
};

/**
 * @deprecated MyEsimsScreen now renders its own card layout.
 */
export const EsimCard = ({ esim, onPress, onRecharge, onActivate }: EsimCardProps) => {
  const used = esim.dataUsed ?? 0;
  const total = esim.dataTotal ?? 1;
  const ratio = Math.min(used / Math.max(total, 1), 1);
  const pct = Math.round(ratio * 100);
  const daysLeft = getDaysRemaining(esim.expiryDate);
  const plan = getPlanLabel(esim);

  const isActive = esim.status === 'ACTIVE';
  const isNotActive = esim.status === 'NOT_ACTIVE';
  const isExpiredOrDeleted = esim.status === 'EXPIRED' || esim.status === 'DELETED';

  const isUrgent = (daysLeft !== null && daysLeft <= 5) || ratio > 0.85;

  // progress bar display
  let progressPct = pct;
  let progressColor: string = colors.primary.DEFAULT;
  if (isNotActive) {
    progressPct = 0;
    progressColor = colors.warning.DEFAULT;
  } else if (isExpiredOrDeleted) {
    progressPct = 100;
    progressColor = colors.gray[400];
  } else if (ratio > 0.8) {
    progressColor = colors.warning.DEFAULT;
  }

  return (
    <View
      style={[
        styles.card,
        isUrgent && isActive && styles.cardUrgent,
      ]}
    >
      {/* Urgency badge */}
      {isActive && daysLeft !== null && daysLeft <= 5 ? (
        <View style={styles.urgencyBadge}>
          <Ionicons name="time-outline" size={10} color={colors.error.DEFAULT} />
          <Text style={styles.urgencyBadgeText}>Expire dans {daysLeft}j</Text>
        </View>
      ) : null}

      {/* Row 1: flag + name/plan + status badge */}
      <View style={styles.topRow}>
        <View style={styles.flagCircle}>
          <CountryFlag countryCode={esim.countryCode} size={20} />
        </View>
        <View style={styles.nameBlock}>
          <Text style={styles.country}>{esim.country}</Text>
          {plan ? <Text style={styles.plan}>{plan}</Text> : null}
        </View>
        {/* Status badge */}
        {isActive ? (
          <View style={[styles.statusBadge, styles.statusBadgeActive]}>
            <Text style={[styles.statusText, styles.statusTextActive]}>â— Active</Text>
          </View>
        ) : isNotActive ? (
          <View style={[styles.statusBadge, styles.statusBadgePending]}>
            <Text style={[styles.statusText, styles.statusTextPending]}>â— Ã€ activer</Text>
          </View>
        ) : (
          <View style={[styles.statusBadge, styles.statusBadgeExpired]}>
            <Text style={[styles.statusText, styles.statusTextExpired]}>â— ExpirÃ©e</Text>
          </View>
        )}
      </View>

      {/* Row 2: usage labels (for active only) */}
      {isActive ? (
        <View style={styles.usageRow}>
          <Text style={styles.usageLabel}>{pct}% utilisÃ©</Text>
          {daysLeft !== null && (
            <Text style={styles.usageLabel}>{daysLeft} jours restants</Text>
          )}
        </View>
      ) : null}

      {/* Row 3: progress bar */}
      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            { width: `${progressPct}%` as unknown as number, backgroundColor: progressColor },
          ]}
        />
      </View>

      {/* Row 4: action buttons */}
      {isActive ? (
        <View style={styles.actionRow}>
          <Pressable
            onPress={onPress}
            style={({ pressed }) => [styles.outlineButton, pressed && styles.outlineButtonPressed]}
          >
            <Ionicons name="information-circle-outline" size={14} color={colors.primary.DEFAULT} />
            <Text style={styles.outlineButtonText}>DÃ©tails</Text>
          </Pressable>
          {onRecharge ? (
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                onRecharge();
              }}
              style={({ pressed }) => [styles.filledButton, pressed && styles.filledButtonPressed]}
            >
              <Ionicons name="add" size={14} color={colors.text.onSecondary} />
              <Text style={styles.filledButtonText}>Recharger</Text>
            </Pressable>
          ) : null}
        </View>
      ) : isNotActive ? (
        <Pressable
          onPress={onActivate ?? onPress}
          style={({ pressed }) => [styles.filledButtonFull, pressed && styles.filledButtonPressed]}
        >
          <Ionicons name="qr-code-outline" size={14} color={colors.text.onSecondary} />
          <Text style={styles.filledButtonText}>Scanner QR pour activer</Text>
        </Pressable>
      ) : (
        <Pressable
          onPress={onPress}
          style={({ pressed }) => [styles.outlineButtonFull, pressed && styles.outlineButtonPressed]}
        >
          <Ionicons name="refresh-outline" size={14} color={colors.primary.DEFAULT} />
          <Text style={styles.outlineButtonText}>Racheter un forfait</Text>
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    ...patterns.card,
    marginBottom: spacing.sm,
    padding: spacing.md,
    gap: spacing.sm,
  },
  cardUrgent: {
    borderLeftWidth: 4,
    borderLeftColor: colors.error.DEFAULT,
  },

  /* urgency badge */
  urgencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.error[50],
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.error[100],
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    gap: 3,
  },
  urgencyBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.error.DEFAULT,
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
  statusBadgePending: {
    backgroundColor: colors.warning[100],
    borderColor: colors.secondary[200],
  },
  statusBadgeExpired: {
    backgroundColor: colors.gray[100],
    borderColor: colors.gray[200],
  },
  statusText: {
    fontSize: 9,
    fontWeight: '700',
  },
  statusTextActive: {
    color: colors.success.dark,
  },
  statusTextPending: {
    color: colors.warning.dark,
  },
  statusTextExpired: {
    color: colors.gray[600],
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
    borderRadius: radii.full,
  },

  /* action buttons */
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  outlineButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.primary.DEFAULT,
    borderRadius: radii.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primary[50],
  },
  outlineButtonFull: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.primary.DEFAULT,
    borderRadius: radii.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primary[50],
  },
  outlineButtonPressed: {
    backgroundColor: colors.primary[100],
    transform: [{ scale: 0.98 }],
  },
  outlineButtonText: {
    ...typography.labelSM,
    color: colors.primary.DEFAULT,
  },
  filledButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.secondary.DEFAULT,
    borderRadius: radii.md,
    paddingVertical: spacing.sm,
    ...shadows.low,
  },
  filledButtonFull: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.secondary.DEFAULT,
    borderRadius: radii.md,
    paddingVertical: spacing.sm,
    ...shadows.low,
  },
  filledButtonPressed: {
    backgroundColor: colors.secondary.dark,
    transform: [{ scale: 0.98 }],
  },
  filledButtonText: {
    ...typography.labelSM,
    color: colors.text.onSecondary,
  },
});
