import type { ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radii, sizes, spacing, typography } from '../../theme';

// ── Main component ───────────────────────────────────────────────────────────

type HeroHeaderProps = {
  /** Small uppercase overline above the main title */
  surtitle?: string;
  title: string;
  /** Node rendered in the top-right corner (e.g. HeroGlassButton) */
  rightAction?: ReactNode;
  /** Optional content rendered below the title row */
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export const HeroHeader = ({
  surtitle,
  title,
  rightAction,
  children,
  style,
}: HeroHeaderProps) => {
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      // 135 deg ≡ top-left → bottom-right; dark at start, DEFAULT at end
      colors={[colors.primary.dark, colors.primary.DEFAULT]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.container,
        { paddingTop: insets.top + spacing.md },
        style,
      ]}
    >
      {/* ── Decorative orbs (overflow hidden on container clips them) ── */}
      <View style={[styles.orb, styles.orbLarge]} />
      <View style={[styles.orb, styles.orbSmall]} />

      {/* ── Title row ── */}
      <View style={styles.row}>
        <View style={styles.textBlock}>
          {surtitle ? (
            <Text style={styles.surtitle}>{surtitle.toUpperCase()}</Text>
          ) : null}
          <Text style={styles.title}>{title}</Text>
        </View>

        {rightAction ? (
          <View style={styles.rightSlot}>{rightAction}</View>
        ) : null}
      </View>

      {/* ── Optional per-screen content (stats, filters, …) ── */}
      {children ? <View style={styles.childrenSlot}>{children}</View> : null}
    </LinearGradient>
  );
};

// ── Glass button (for rightAction / secondary actions inside HeroHeader) ────

type HeroGlassButtonProps = {
  onPress?: () => void;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export const HeroGlassButton = ({
  onPress,
  children,
  style,
}: HeroGlassButtonProps) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => [
      styles.glassBtn,
      pressed && styles.glassBtnPressed,
      style,
    ]}
  >
    {children}
  </Pressable>
);

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    borderBottomLeftRadius: radii.hero,
    borderBottomRightRadius: radii.hero,
    overflow: 'hidden',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
  },

  // Decorative background circles
  orb: {
    position: 'absolute',
    borderRadius: radii.full,
  },
  orbLarge: {
    width: sizes.decoration.heroOrbLg,
    height: sizes.decoration.heroOrbLg,
    top: -spacing.xxxxxl - spacing.xs,
    right: -spacing.xxxxxl + spacing.xs,
    backgroundColor: colors.state.onPrimaryOverlay08,
  },
  orbSmall: {
    width: sizes.decoration.heroOrbSm,
    height: sizes.decoration.heroOrbSm,
    bottom: -spacing.xxxxl - spacing.xs,
    left: -spacing.xxxl + spacing.xs,
    backgroundColor: colors.state.onPrimaryOverlay12,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    minHeight: sizes.touch.md,
  },
  textBlock: {
    flex: 1,
    justifyContent: 'center',
  },
  surtitle: {
    ...typography.overline,
    color: colors.state.onPrimaryOverlay70,
    marginBottom: spacing.xs,
  },
  title: {
    ...typography.titleLG,
    fontWeight: '800',
    color: colors.white,
  },
  rightSlot: {
    alignItems: 'center',
    justifyContent: 'center',
    width: sizes.touch.sm,
    height: sizes.touch.sm,
  },
  childrenSlot: {
    marginTop: spacing.md,
  },

  // Glass button
  glassBtn: {
    width: sizes.touch.sm,
    height: sizes.touch.sm,
    borderRadius: radii.full,
    backgroundColor: colors.state.onPrimaryOverlay18,
    borderWidth: 1,
    borderColor: colors.state.onPrimaryOverlay25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glassBtnPressed: {
    backgroundColor: colors.state.onPrimaryOverlay28,
  },
});
