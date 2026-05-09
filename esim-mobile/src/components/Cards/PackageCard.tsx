import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, radii, shadows, sizes, spacing, typography } from '../../theme';
import type { Offer } from '../../types/offer';

type PackageCardProps = {
  offer: Offer;
  selected?: boolean;
  isBestValue?: boolean;
  onPress: () => void;
};

export const PackageCard = ({ offer, selected, isBestValue, onPress }: PackageCardProps) => {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={`Voir forfait ${offer.dataVolume} ${offer.validityDays} jours`}
      accessibilityState={{ selected }}
      activeOpacity={0.85}
      onPress={onPress}
      style={[styles.card, selected && styles.cardSelected]}
    >
      {isBestValue && (
        <View style={styles.bestValueBadge}>
          <Text style={styles.bestValueText}>Meilleur</Text>
        </View>
      )}

      <View style={styles.row}>
        <View style={styles.info}>
          <Text style={styles.dataVolume}>{offer.dataVolume}</Text>
          <Text style={styles.meta}>{`${offer.validityDays} jours • 4G/5G`}</Text>
        </View>

        <View style={styles.right}>
          <Text style={styles.price}>{`${offer.price.toFixed(2)} ${offer.currency ?? 'TND'}`}</Text>
          <Ionicons
            color={selected ? colors.primary.DEFAULT : colors.text.secondary}
            name="chevron-forward"
            size={sizes.icon.sm}
          />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceCard,
    borderColor: colors.border,
    borderRadius: radii.card,
    borderWidth: 1,
    marginBottom: spacing.md,
    minHeight: sizes.card.minHeight,
    padding: spacing.lg,
    ...shadows.medium,
  },
  cardSelected: {
    borderColor: colors.primary.DEFAULT,
    borderWidth: 2,
    ...shadows.high,
  },
  bestValueBadge: {
    backgroundColor: colors.primary[100],
    borderRadius: radii.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    alignSelf: 'flex-start',
    marginBottom: spacing.sm,
  },
  bestValueText: {
    ...typography.labelSM,
    color: colors.primary.DEFAULT,
    fontWeight: '700',
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  info: {
    flex: 1,
  },
  dataVolume: {
    ...typography.titleSM,
    color: colors.text.primary,
    fontWeight: '700',
  },
  meta: {
    ...typography.bodySM,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  right: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  price: {
    ...typography.bodyMD,
    color: colors.primary.DEFAULT,
    fontWeight: '600',
  },
});