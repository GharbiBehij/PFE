// components/Cards/RecentSaleCard.tsx
import { View, Text, StyleSheet } from 'react-native';
import { Card } from './Card';
import { colors, radii, spacing, typography } from '../../theme';
import type { RecentSale } from '../../types/reseller';

type Props = {
  sale: RecentSale;
  formattedAmount: string;
  formattedCommission: string;
};

const getInitials = (name: string) => {
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return `${parts[0]![0]}${parts[1]![0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

export const RecentSaleCard = ({ sale, formattedAmount, formattedCommission }: Props) => {
  const isCompleted = sale.status === 'completed';
  const initials = getInitials(sale.customer);

  return (
    <Card style={styles.card}>
      <View style={styles.row}>
        {/* Avatar */}
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>

        {/* Details */}
        <View style={styles.details}>
          <Text style={styles.customer} numberOfLines={1}>{sale.customer}</Text>
          <Text style={styles.package} numberOfLines={1}>{sale.package}</Text>
          <View
            style={[
              styles.statusBadge,
              isCompleted ? styles.statusCompleted : styles.statusPending,
            ]}
          >
            <Text
              style={[
                styles.statusText,
                isCompleted ? styles.statusCompletedText : styles.statusPendingText,
              ]}
            >
              {isCompleted ? '✓ Complété' : '⏳ En attente'}
            </Text>
          </View>
        </View>

        {/* Amount + commission + time */}
        <View style={styles.amountWrap}>
          <Text style={styles.amount}>{formattedAmount}</Text>
          <Text style={styles.commission}>{formattedCommission}</Text>
          <Text style={styles.time}>{sale.timeAgo}</Text>
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginTop: spacing.sm,
    padding: spacing.md,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: colors.primary[100],
    borderRadius: radii.full,
    height: 36,
    justifyContent: 'center',
    width: 36,
    flexShrink: 0,
  },
  avatarText: {
    ...typography.labelSM,
    color: colors.primary.DEFAULT,
    fontWeight: '800',
  },
  details: {
    flex: 1,
    minWidth: 0,
  },
  customer: {
    ...typography.bodyMD,
    color: colors.text.primary,
    fontWeight: '700',
  },
  package: {
    ...typography.bodySM,
    color: colors.text.secondary,
    marginTop: spacing.xxs,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    borderRadius: radii.full,
    borderWidth: 1,
    marginTop: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
  },
  statusCompleted: {
    backgroundColor: colors.success[50],
    borderColor: colors.success[100],
  },
  statusPending: {
    backgroundColor: colors.secondary[100],
    borderColor: colors.secondary[200],
  },
  statusText: {
    ...typography.labelSM,
    fontWeight: '700',
    fontSize: 10,
  },
  statusCompletedText: {
    color: colors.success.dark,
  },
  statusPendingText: {
    color: colors.secondary[600],
  },
  amountWrap: {
    alignItems: 'flex-end',
    flexShrink: 0,
  },
  amount: {
    ...typography.bodyMD,
    color: colors.text.primary,
    fontWeight: '800',
  },
  commission: {
    ...typography.bodySM,
    color: colors.success.dark,
    fontWeight: '700',
    marginTop: spacing.xxs,
  },
  time: {
    ...typography.bodySM,
    color: colors.text.tertiary,
    marginTop: spacing.xxs,
  },
});
