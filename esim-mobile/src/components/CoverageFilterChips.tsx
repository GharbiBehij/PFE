import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, patterns, radii, shadows, sizes, spacing, typography } from '../theme';

export type CoverageFilter = 'LOCAL' | 'REGIONAL' | 'GLOBAL' | 'POPULAR';

const options: Array<{ icon: keyof typeof Ionicons.glyphMap; key: CoverageFilter; label: string }> = [
  { icon: 'location', key: 'LOCAL', label: 'Locale' },
  { icon: 'earth', key: 'REGIONAL', label: 'Régional' },
  { icon: 'language', key: 'GLOBAL', label: 'Mondial' },
  { icon: 'trending-up', key: 'POPULAR', label: 'Populaire' },
] as const;

type CoverageFilterChipsProps = {
  selected: CoverageFilter;
  onSelect: (filter: CoverageFilter) => void;
};

export const CoverageFilterChips = ({ selected, onSelect }: CoverageFilterChipsProps) => {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {options.map((option) => {
        const isActive = selected === option.key;

        return (
          <Pressable
            key={option.key}
            onPress={() => onSelect(option.key)}
            accessibilityRole="button"
            accessibilityLabel={`Filtrer: ${option.label}`}
            accessibilityState={{ selected: isActive }}
            style={({ pressed }) => [
              styles.chip,
              isActive ? styles.chipActive : styles.chipInactive,
              pressed ? styles.chipPressed : undefined,
              pressed && isActive ? styles.chipPressedActive : undefined,
              pressed && !isActive ? styles.chipPressedInactive : undefined,
            ]}
          >
            <View style={styles.chipRow}>
              <View style={[styles.iconBubble, isActive ? styles.iconBubbleActive : styles.iconBubbleInactive]}>
                {isActive ? <View style={styles.iconBubbleOverlay} /> : null}
                <Ionicons
                  name={option.icon}
                  size={sizes.icon.sm}
                  color={isActive ? colors.text.onPrimary : colors.text.secondary}
                />
              </View>
              <Text
                style={[
                  styles.chipText,
                  isActive ? styles.chipTextActive : styles.chipTextInactive,
                ]}
              >
                {option.label}
              </Text>
            </View>
          </Pressable>
        );
      })}
      <View style={styles.trailingSpace} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing[0],
  },
  chip: {
    ...patterns.pressableBase,
    ...patterns.unselectedBackground,
    ...patterns.unselectedBorder,
    minWidth: sizes.button.minWidth,
    minHeight: sizes.touch.sm,
    marginRight: spacing.md,
    borderRadius: radii.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipActive: {
    ...patterns.selectedBackground,
    ...patterns.selectedBorder,
    ...shadows.low,
  },
  chipInactive: {
    ...patterns.unselectedBackground,
    ...patterns.unselectedBorder,
  },
  chipPressed: {
    ...shadows.low,
    transform: [{ scale: 0.98 }],
  },
  chipPressedActive: {
    backgroundColor: colors.state.selected,
  },
  chipPressedInactive: {
    backgroundColor: colors.state.surfacePressed,
  },
  chipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    justifyContent: 'center',
  },
  iconBubble: {
    alignItems: 'center',
    justifyContent: 'center',
    width: sizes.avatar.sm,
    height: sizes.avatar.sm,
    borderRadius: radii.full,
    overflow: 'hidden',
  },
  iconBubbleActive: {
    backgroundColor: colors.primary.DEFAULT,
  },
  iconBubbleInactive: {
    backgroundColor: colors.surfaceMuted,
  },
  iconBubbleOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.text.onPrimary,
    opacity: 0.2,
  },
  chipText: {
    ...typography.bodyMD,
    fontWeight: '600',
  },
  chipTextActive: {
    color: colors.primary.DEFAULT,
  },
  chipTextInactive: {
    color: colors.text.secondary,
  },
  trailingSpace: {
    width: spacing.lg,
  },
});