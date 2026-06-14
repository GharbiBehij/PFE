import type { ReactNode } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radii, shadows, sizes, spacing, typography } from '../../theme';

// ── Structured mode (title + back button) ──────────────────────────────────
type StructuredProps = {
  title: string;
  onBack: () => void;
  rightAction?: ReactNode;
  children?: never;
  style?: StyleProp<ViewStyle>;
};

// ── Legacy children mode (custom content) ──────────────────────────────────
type ChildrenProps = {
  children: ReactNode;
  title?: never;
  onBack?: never;
  rightAction?: never;
  style?: StyleProp<ViewStyle>;
};

type ScreenHeaderProps = StructuredProps | ChildrenProps;

export const ScreenHeader = ({
  children,
  title,
  onBack,
  rightAction,
  style,
}: ScreenHeaderProps) => {
  const insets = useSafeAreaInsets();

  // Structured mode handles its own safe-area; children mode is used inside
  // ScreenShell (SafeAreaView edges top) so only needs spacing.md.
  const paddingTop = title !== undefined
    ? insets.top + spacing.md
    : spacing.md;

  const containerStyle = [styles.header, { paddingTop }, style];

  if (title !== undefined && onBack !== undefined) {
    return (
      <View style={containerStyle}>
        <View style={styles.row}>
          {/* ── Back button ── */}
          <Pressable
            accessibilityLabel="Retour"
            accessibilityRole="button"
            onPress={onBack}
            style={({ pressed }) => [
              styles.roundBtn,
              pressed && styles.roundBtnPressed,
            ]}
          >
            <Ionicons
              color={colors.text.primary}
              name="arrow-back"
              size={sizes.icon.md}
            />
          </Pressable>

          {/* ── Centered title ── */}
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>

          {/* ── Right action or spacer to keep title centered ── */}
          {rightAction ? (
            <View style={styles.actionSlot}>{rightAction}</View>
          ) : (
            <View style={styles.spacer} />
          )}
        </View>
      </View>
    );
  }

  // Legacy: render arbitrary children
  return <View style={containerStyle}>{children}</View>;
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.surface,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    borderBottomLeftRadius: radii.card,
    borderBottomRightRadius: radii.card,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    ...shadows.medium,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roundBtn: {
    width: sizes.touch.sm,
    height: sizes.touch.sm,
    borderRadius: radii.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roundBtnPressed: {
    backgroundColor: colors.state.surfacePressed,
  },
  title: {
    flex: 1,
    ...typography.titleMD,
    fontWeight: '700',
    color: colors.text.primary,
    textAlign: 'center',
  },
  // Right-side slot mirrors the back button width so the title stays centered
  actionSlot: {
    width: sizes.touch.sm,
    height: sizes.touch.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spacer: {
    width: sizes.touch.sm,
    height: sizes.touch.sm,
  },
});
