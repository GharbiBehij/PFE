import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, radii, typography, sizes } from '../../theme';

type ResellerGradientHeaderProps = {
  title: string;
  subtitle?: string;
  date?: string;
  rightAction?: ReactNode;
  children?: ReactNode;
  /** Renders flush at the very bottom of the gradient — removes bottom border radius */
  bottomSlot?: ReactNode;
};

export const ResellerGradientHeader = ({
  title,
  subtitle,
  date,
  rightAction,
  children,
  bottomSlot,
}: ResellerGradientHeaderProps) => {
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={[colors.primary.DEFAULT, colors.primary.dark]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.container,
        { paddingTop: insets.top + spacing.md },
        bottomSlot ? styles.containerNoBottomRadius : null,
      ]}
    >
      {/* ── Title row — consistent across all screens ── */}
      <View style={styles.titleRow}>
        <View style={styles.titleBlock}>
          {date ? <Text style={styles.date}>{date}</Text> : null}
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {rightAction ? (
          <View style={styles.rightSlot}>{rightAction}</View>
        ) : null}
      </View>

      {/* ── Per-screen content below title ── */}
      {children ? (
        <View style={styles.children}>{children}</View>
      ) : null}

      {/* ── Bottom slot — rendered flush, no bottom padding ── */}
      {bottomSlot ? (
        <View style={styles.bottomSlot}>{bottomSlot}</View>
      ) : null}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    borderBottomLeftRadius: radii.xl,
    borderBottomRightRadius: radii.xl,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  containerNoBottomRadius: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    paddingBottom: 0,
  },
  bottomSlot: {
    marginHorizontal: -spacing.lg,
  },
  titleRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: sizes.touch.md, // ← consistent title row height across all screens
  },
  titleBlock: {
    flex: 1,
    justifyContent: 'center',
  },
  date: {
    color: colors.text.onPrimary,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.8,
    opacity: 0.75,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  title: {
    ...typography.titleMD,
    color: colors.text.onPrimary,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.text.onPrimary,
    fontSize: 13,
    marginTop: spacing.xs,
    opacity: 0.85,
  },
  rightSlot: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: sizes.touch.sm,
    width: sizes.touch.sm,
  },
  children: {
    marginTop: spacing.lg,
  },
});