import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, patterns, spacing, typography } from '../theme';
import type { Offer } from '../types/offer';
import { formatCurrency } from '../utils/formatCurrency';

type PackageCardProps = {
  offer: Offer;
  onPress: () => void;
};

export const PackageCard = ({ offer, onPress }: PackageCardProps) => {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Voir forfait ${offer.country} ${offer.dataVolume}`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed ? styles.cardPressed : undefined]}
    >
      <View>
        <Text style={styles.title}>{offer.country}</Text>
        <Text style={styles.subtitle}>{offer.dataVolume} • {offer.validityDays} jours</Text>
      </View>
      <Text style={styles.price}>{formatCurrency(offer.price, offer.currency || 'TND')}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    ...patterns.card,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    padding: spacing.lg,
  },
  cardPressed: {
    transform: [{ scale: 0.98 }],
  },
  title: {
    ...typography.titleSM,
    color: colors.text.primary,
  },
  subtitle: {
    ...typography.bodyMD,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  price: {
    ...typography.titleSM,
    color: colors.primary.DEFAULT,
  },
});
