import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { colors, patterns, radii, sizes, spacing, typography } from '../theme';
import type { Offer } from '../types/offer';
import { formatCurrency } from '../utils/formatCurrency';

type OrderSummaryCardProps = {
  offer: Offer;
};

export const OrderSummaryCard = ({ offer }: OrderSummaryCardProps) => {
  return (
    <View style={styles.card}>
      <View style={styles.titleRow}>
        <View style={styles.titleWrap}>
          <Ionicons color={colors.primary.DEFAULT} name="receipt-outline" size={sizes.icon.sm} />
          <Text style={styles.title}>Résumé de commande</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Instantané</Text>
        </View>
      </View>
      <Row label="Forfait" value={`${offer.country} ${offer.dataVolume}`} />
      <Row label="Validite" value={`${offer.validityDays} jours`} />
      <Row label="Sous-total" value={formatCurrency(offer.price, offer.currency)} />
      <View style={styles.divider} />
      <Row label="Total" value={formatCurrency(offer.price, offer.currency)} strong />
    </View>
  );
};

const Row = ({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) => (
  <View style={styles.row}>
    <Text style={[styles.label, strong ? styles.strong : undefined]}>{label}</Text>
    <Text style={[styles.value, strong ? styles.strong : undefined]}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  card: {
    ...patterns.summaryCard,
    padding: spacing.lg,
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  titleWrap: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  title: {
    ...typography.titleSM,
    color: colors.text.primary,
  },
  badge: {
    backgroundColor: colors.primary[100],
    borderColor: colors.primary[200],
    borderRadius: radii.full,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  badgeText: {
    ...typography.bodySM,
    color: colors.primary.DEFAULT,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  label: {
    ...typography.bodyMD,
    color: colors.text.secondary,
  },
  value: {
    ...typography.bodyLG,
    color: colors.text.primary,
    fontWeight: '600',
  },
  strong: {
    color: colors.primary.DEFAULT,
    fontWeight: '800',
  },
  divider: {
    backgroundColor: colors.divider,
    height: 1,
    marginBottom: spacing.md,
    marginTop: spacing.sm,
  },
});
