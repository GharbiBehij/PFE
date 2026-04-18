import { StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing, typography } from '../theme';

type DaySectionHeaderProps = {
  days: number;
};

export const DaySectionHeader = ({ days }: DaySectionHeaderProps) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        {days === 1 ? '1 jour' : `${days} jours`}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.gray[100],
    borderRadius: radii.lg,
    marginBottom: spacing.md,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  label: {
    ...typography.labelSM,
    color: colors.text.primary,
  },
});
