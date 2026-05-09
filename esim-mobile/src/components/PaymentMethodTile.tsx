import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors,shadows, radii, sizes, spacing, typography } from '../theme';

type PaymentMethodTileProps = {
  label: string;
  subtitle?: string;
  iconName: keyof typeof Ionicons.glyphMap;
  selected: boolean;
  onPress: () => void;
};

export const PaymentMethodTile = ({ iconName, label, onPress, selected, subtitle }: PaymentMethodTileProps) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      activeOpacity={0.85}
      style={[
        styles.tile,
        selected ? styles.selectedTile : styles.unselectedTile,
      ]}
    >
      <View style={[styles.iconWrap, selected ? styles.selectedIconWrap : styles.unselectedIconWrap]}>
        <Ionicons
          color={selected ? colors.text.onPrimary : colors.primary.DEFAULT}
          name={iconName}
          size={sizes.icon.md}
        />
      </View>

      <View style={styles.content}>
        <Text style={styles.label}>{label}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>

      <View style={[styles.radio, selected && styles.radioSelected]}>
        {selected && <View style={styles.radioDot} />}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  tile: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radii.card,
    borderWidth: 2,
    marginBottom: spacing.sm,
    minHeight: sizes.tile.paymentMethodMinHeight,
  },
  unselectedTile: {
    backgroundColor: colors.surfaceCard,
    borderColor: colors.border,
    borderRadius: radii.card,
    borderWidth: 1,
    marginBottom: spacing.md,
    minHeight: sizes.card.minHeight,
    padding: spacing.lg,
    ...shadows.medium,

},
  selectedTile: {
    borderColor: colors.primary.DEFAULT,
    backgroundColor: colors.white,
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.md,
    height: 40,
    width: 40,
    marginRight: spacing.md,
  },
  unselectedIconWrap: {
    backgroundColor: colors.gray[100],
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
  radio: {
    width: sizes.radio,
    height: sizes.radio,
    borderRadius: sizes.radio / 2,
    borderWidth: 2,
    borderColor: colors.gray[300],
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.md,
  },
  radioSelected: {
    borderColor: colors.primary.DEFAULT,
  },
  radioDot: {
    width: sizes.radioInner,
    height: sizes.radioInner,
    borderRadius: sizes.radioInner / 2,
    backgroundColor: colors.primary.DEFAULT,
  },
  tilePressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
});