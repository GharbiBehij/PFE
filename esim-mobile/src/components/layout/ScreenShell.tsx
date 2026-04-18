import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { patterns } from '../../theme';

type ScreenShellProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export const ScreenShell = ({ children, style }: ScreenShellProps) => {
  return <SafeAreaView edges={['top']} style={[styles.shell, style]}>{children}</SafeAreaView>;
};

const styles = StyleSheet.create({
  shell: {
    ...patterns.screen,
  },
});
