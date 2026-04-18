import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, patterns, radii, shadows, sizes, spacing, typography } from '../theme';
import type { Offer } from '../types/offer';

type OfferCardProps = {
  offer: Offer;
  isSelected: boolean;
  isBestValue: boolean;
  onSelect: () => void;
};

export const OfferCard = ({ offer, isSelected, isBestValue, onSelect }: OfferCardProps) => {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Choisir forfait ${formatData(offer.dataVolume)} ${offer.validityDays} jours`}
      accessibilityState={{ selected: isSelected }}
      onPress={onSelect}
    >
      {({ pressed }) => (
        <View
          style={[
            styles.card,
            isSelected ? styles.cardSelected : styles.cardUnselected,
            pressed ? styles.cardPressed : undefined,
          ]}
        >
          <View style={styles.row}>
            <View style={styles.content}>
              {isBestValue ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>Meilleur rapport</Text>
                </View>
              ) : null}

              <Text style={styles.dataText}>
                {formatData(offer.dataVolume)}
              </Text>

              <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                  <Ionicons color={colors.text.secondary} name="time-outline" size={sizes.icon.xs} />
                  <Text style={styles.metaText}>
                    {offer.validityDays}j
                  </Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons color={colors.text.secondary} name="cellular-outline" size={sizes.icon.xs} />
                  <Text style={styles.metaText}>
                    4G/5G
                  </Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons color={colors.text.secondary} name="flash-outline" size={sizes.icon.xs} />
                  <Text style={styles.metaText}>
                    Instant
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.priceCol}>
              <Text style={styles.priceLabel}>
                À partir de
              </Text>
              <Text style={styles.priceValue}>
                {formatPrice(offer.price).replace(' TND', '')}
              </Text>
              <Text style={styles.priceCurrency}>
                TND
              </Text>
            </View>
          </View>
          {isSelected ? (
            <View style={styles.selectedBadge}>
              <Ionicons color={colors.primary.DEFAULT} name="checkmark-circle" size={sizes.icon.md} />
            </View>
          ) : null}
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    ...patterns.selectableCard,
    marginBottom: spacing.md,
    padding: spacing.lg,
  },
  cardSelected: {
    ...patterns.selectableCardSelected,
  },
  cardUnselected: {
    ...patterns.unselectedBackground,
    ...patterns.unselectedBorder,
  },
  cardPressed: {
    ...patterns.pressablePressed,
    ...shadows.low,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  content: {
    flex: 1,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.secondary[400],
    borderRadius: radii.full,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  badgeText: {
    ...typography.bodySM,
    color: colors.text.primary,
    fontWeight: '600',
  },
  dataText: {
    ...typography.titleMD,
    color: colors.text.primary,
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  metaItem: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  metaText: {
    ...typography.bodySM,
    color: colors.text.secondary,
    marginLeft: spacing.xs,
  },
  priceCol: {
    alignItems: 'flex-end',
  },
  priceLabel: {
    ...typography.bodySM,
    color: colors.text.tertiary,
  },
  priceValue: {
    ...typography.titleSM,
    color: colors.primary.DEFAULT,
    fontWeight: '700',
    marginTop: spacing.xs,
  },
  priceCurrency: {
    ...typography.bodySM,
    color: colors.primary.DEFAULT,
    fontWeight: '600',
  },
  selectedBadge: {
    position: 'absolute',
    right: spacing.md,
    top: spacing.md,
  },
});

const formatData = (dataVolume: string) => {
  const normalized = dataVolume.trim().toUpperCase();
  if (normalized.includes('GB') || normalized.includes('MB')) {
    return normalized;
  }

  const raw = Number(normalized);
  if (!Number.isFinite(raw)) {
    return dataVolume;
  }

  if (raw >= 1024) {
    return `${(raw / 1024).toFixed(raw % 1024 === 0 ? 0 : 1)}GB`;
  }

  return `${Math.round(raw)}MB`;
};

const formatPrice = (price: number) => {
  const value = Number(price);
  if (!Number.isFinite(value)) {
    return '0.00 TND';
  }

  return `${value.toFixed(2)} TND`;
};
