import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import { colors, patterns, spacing } from '../../theme';

type ScreenFooterProps = {
  children: ReactNode;
  sticky?: boolean;
  style?: StyleProp<ViewStyle>;
};

export const ScreenFooter = ({ children, sticky = false, style }: ScreenFooterProps) => {
  return (
    <View style={[sticky ? styles.sticky : styles.footer, styles.base, style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    alignItems: 'stretch',
    gap: spacing.xs,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  footer: {
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    borderTopWidth: 1,
  },
  sticky: {
    ...patterns.stickyFooter,
  },
});