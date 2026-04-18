import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, patterns, radii, shadows, sizes, spacing, typography } from '../theme';

type PaymentMethodTileProps = {
  label: string;
  subtitle?: string;
  iconName: keyof typeof Ionicons.glyphMap;
  selected: boolean;
  onPress: () => void;
};

export const PaymentMethodTile = ({ iconName, label, onPress, selected, subtitle }: PaymentMethodTileProps) => {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={({ pressed }) => [styles.tile, selected ? styles.selectedTile : styles.unselectedTile, pressed ? styles.tilePressed : undefined]}
    >
      <View style={[styles.iconWrap, selected ? styles.selectedIconWrap : styles.unselectedIconWrap]}>
        <Ionicons color={selected ? colors.text.onPrimary : colors.primary.DEFAULT} name={iconName} size={sizes.icon.md} />
      </View>

      <View style={styles.content}>
        <Text style={styles.label}>{label}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  tile: {
    ...patterns.selectableCard,
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    marginBottom: spacing.md,
  },
  unselectedTile: {
    ...patterns.unselectedBackground,
    ...patterns.unselectedBorder,
  },
  tilePressed: {
    ...patterns.pressablePressed,
    ...shadows.low,
  },
  selectedTile: {
    ...patterns.selectableCardSelected,
  },
  iconWrap: {
    alignItems: 'center',
    borderRadius: radii.md,
    height: sizes.touch.lg,
    justifyContent: 'center',
    marginRight: spacing.md,
    width: sizes.touch.lg,
  },
  unselectedIconWrap: {
    backgroundColor: colors.surfaceMuted,
  },
  selectedIconWrap: {
    backgroundColor: colors.primary.DEFAULT,
  },
  content: {
    flex: 1,
  },
  label: {
    ...typography.titleSM,
    color: colors.text.primary,
    fontWeight: '700',
  },
  subtitle: {
    ...typography.bodySM,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
});
