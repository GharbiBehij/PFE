// components/reseller/PendingActivationCard.tsx
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Card } from './Card';
import { ActionButton } from '../Buttons/ActionButton';
import { colors, patterns, spacing, typography } from '../../theme';
import type { PendingActivation } from '../../types/reseller';

type Props = {
  activation: PendingActivation;
  formattedAmount: string;
  formattedDate: string;
  onPress: () => void;
  onPressActivate: () => void;
};

export const PendingActivationCard = ({
  activation,
  formattedAmount,
  formattedDate,
  onPress,
  onPressActivate,
}: Props) => {
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress}>
    <Card style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.details}>
          <Text style={styles.customer}>{activation.customer}</Text>
          <Text style={styles.pkg}>{activation.package}</Text>
        </View>
        <Text style={styles.amount}>{formattedAmount}</Text>
      </View>

      <Text style={styles.meta}>
        {`${activation.phone} • ${activation.country}`}
      </Text>
      <Text style={styles.date}>{`Acheté le ${formattedDate}`}</Text>

      <View style={styles.buttonWrap}>
        <ActionButton
          label="Activer maintenant"
          onPress={onPressActivate}
        />
      </View>
    </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    ...patterns.card,
    marginTop: spacing.sm,
    padding: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  details: {
    flex: 1,
    marginRight: spacing.md,
  },
  customer: {
    ...typography.bodyMD,
    color: colors.text.primary,
    fontWeight: '700',
  },
  pkg: {
    ...typography.bodySM,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  amount: {
    ...typography.bodyMD,
    color: colors.text.primary,
    fontWeight: '700',
  },
  meta: {
    ...typography.bodySM,
    color: colors.text.secondary,
    marginTop: spacing.sm,
  },
  date: {
    ...typography.bodySM,
    color: colors.text.tertiary,
    marginTop: spacing.xs,
  },
  buttonWrap: {
    marginTop: spacing.md,
  },
});