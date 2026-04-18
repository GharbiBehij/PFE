import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, patterns, radii, sizes, spacing, typography } from '../theme';
import type { Esim } from '../types/esim';
import { formatDate } from '../utils/formatDate';
import { CountryFlag } from './CountryFlag';
import { StatusBadge } from './StatusBadge';

type EsimCardProps = {
  esim: Esim;
  onPress: () => void;
};

export const EsimCard = ({ esim, onPress }: EsimCardProps) => {
  const used = esim.dataUsed ?? 0;
  const total = esim.dataTotal ?? 0;
  const ratio = total > 0 ? Math.min(used / total, 1) : 0;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Voir la eSIM ${esim.country}`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed ? styles.cardPressed : undefined]}
    >
      <View style={styles.header}>
        <View style={styles.countryRow}>
          <CountryFlag countryCode={esim.countryCode} size={sizes.icon.lg} />
          <Text style={styles.country}>{esim.country}</Text>
        </View>
        <StatusBadge status={esim.status} />
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${ratio * 100}%` }]} />
      </View>
      <Text style={styles.meta}>
        {(used / 1024 / 1024).toFixed(0)}MB / {(total / 1024 / 1024).toFixed(0)}MB
      </Text>
      <Text style={styles.meta}>Créée le {formatDate(esim.createdAt)}</Text>
      {esim.expiryDate ? <Text style={styles.meta}>Expire le {formatDate(esim.expiryDate)}</Text> : null}
      <View style={styles.footer}>
        <Text style={styles.manage}>Gérer</Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    ...patterns.card,
    marginBottom: spacing.md,
    padding: spacing.lg,
  },
  cardPressed: {
    transform: [{ scale: 0.98 }],
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  countryRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  country: {
    ...typography.titleSM,
    color: colors.text.primary,
  },
  progressTrack: {
    backgroundColor: colors.divider,
    borderRadius: radii.sm,
    height: 8,
    overflow: 'hidden',
  },
  progressFill: {
    backgroundColor: colors.primary.DEFAULT,
    height: 8,
  },
  meta: {
    ...typography.bodySM,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  footer: {
    alignItems: 'flex-end',
    marginTop: spacing.md,
  },
  manage: {
    ...typography.labelSM,
    color: colors.primary.DEFAULT,
  },
});
