import { StyleSheet, Text, View } from 'react-native';
import { colors, patterns, radii, spacing, typography } from '../theme';
import { formatCurrency } from '../utils/formatCurrency';

type BalanceCardProps = {
  balance: number;
};

export const BalanceCard = ({ balance }: BalanceCardProps) => {
  return (
    <View
      style={styles.card}
      accessible
      accessibilityRole="summary"
      accessibilityLabel={`Solde disponible ${formatCurrency(balance)}`}
    >
      <Text style={styles.label}>Solde disponible</Text>
      <Text style={styles.value}>{formatCurrency(balance)}</Text>
      <View style={styles.chip}>
        <Text style={styles.chipText}>Portefeuille</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    ...patterns.card,
  },
  label: {
    ...typography.bodyMD,
    color: colors.text.secondary,
  },
  value: {
    ...typography.titleLG,
    color: colors.primary.DEFAULT,
    marginTop: spacing.sm,
  },
  chip: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary[100],
    borderRadius: radii.full,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  chipText: {
    ...typography.bodySM,
    color: colors.primary.DEFAULT,
    fontWeight: '700',
  },
});
