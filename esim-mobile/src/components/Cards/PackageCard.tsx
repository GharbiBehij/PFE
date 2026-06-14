import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, patterns, sizes, spacing, typography } from '../../theme';
import type { Offer } from '../../types/offer';

type PackageCardProps = {
  offer: Offer;
  selected?: boolean;
  onPress: () => void;
};

export const PackageCard = ({ offer, selected, onPress }: PackageCardProps) => {
  const network = offer.networkType ?? '4G';
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={`Voir forfait ${offer.dataVolume} ${offer.validityDays} jours`}
      accessibilityState={{ selected }}
      activeOpacity={0.85}
      onPress={onPress}
      style={[styles.card, selected && styles.cardSelected]}
    >
      <View style={styles.row}>
        <View style={styles.info}>
          <Text style={styles.dataVolume}>{offer.dataVolume}</Text>
          <Text style={styles.meta}>{`${offer.validityDays} jours • ${network}`}</Text>
        </View>

        <View style={styles.right}>
          <Text style={styles.price}>{`${offer.price.toFixed(3)} TND`}</Text>
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
    ...patterns.selectableCard,
    marginBottom: spacing.md,
    minHeight: sizes.card.minHeight,
    padding: spacing.lg,
  },
  cardSelected: {
    ...patterns.selectableCardSelected,
    borderWidth: 2,
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