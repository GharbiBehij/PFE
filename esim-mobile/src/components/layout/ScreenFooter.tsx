import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import { colors, patterns } from '../../theme';

type ScreenFooterProps = {
  children: ReactNode;
  sticky?: boolean;
  style?: StyleProp<ViewStyle>;
};

export const ScreenFooter = ({ children, sticky = false, style }: ScreenFooterProps) => {
  return <View style={[sticky ? styles.sticky : styles.footer, style]}>{children}</View>;
};

const styles = StyleSheet.create({
  footer: {
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    borderTopWidth: 1,
  },
  sticky: {
    ...patterns.stickyFooter,
  },
});
