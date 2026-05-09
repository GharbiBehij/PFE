import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, patterns, sizes, spacing, typography } from '../theme';

export type PlanType = 'standard' | 'Illimité';

type PlanTypeToggleProps = {
  activePlan: PlanType;
  onPlanChange: (plan: PlanType) => void;
};

export const PlanTypeToggle = ({ activePlan, onPlanChange }: PlanTypeToggleProps) => {
  return (
    <View style={styles.container}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Choisir forfait standard"
        accessibilityState={{ selected: activePlan === 'standard' }}
        onPress={() => onPlanChange('standard')}
        style={({ pressed }) => [
          styles.segment,
          activePlan === 'standard' ? styles.segmentActive : styles.segmentInactive,
          pressed ? styles.segmentPressed : undefined,
        ]}
      >
        <Text style={[styles.segmentLabel, activePlan === 'standard' ? styles.segmentLabelActive : undefined]}>
          Standard
        </Text>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Choisir forfait illimite"
        accessibilityState={{ selected: activePlan === 'Illimité' }}
        onPress={() => onPlanChange('Illimité')}
        style={({ pressed }) => [
          styles.segment,
          activePlan === 'Illimité' ? styles.segmentActive : styles.segmentInactive,
          pressed ? styles.segmentPressed : undefined,
        ]}
      >
        <Text style={[styles.segmentLabel, activePlan === 'Illimité' ? styles.segmentLabelActive : undefined]}>
          Illimité
        </Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
    width: '100%',
  },
  segment: {
    ...patterns.selectableCard,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  segmentActive: {
    ...patterns.selectableCardSelected,
  },
  segmentInactive: {
    ...patterns.unselectedBackground,
    ...patterns.unselectedBorder,
  },
  segmentPressed: {
    ...patterns.pressablePressed,
  },
  segmentLabel: {
    ...typography.labelMD,
    color: colors.text.secondary,
  },
  segmentLabelActive: {
    color: colors.primary.DEFAULT,
    fontWeight: '700',
  },
});
