import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import { patterns } from '../../theme';

type ScreenHeaderProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export const ScreenHeader = ({ children, style }: ScreenHeaderProps) => {
  return <View style={[styles.header, style]}>{children}</View>;
};

const styles = StyleSheet.create({
  header: {
    ...patterns.headerShell,
  },
});
