import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import { patterns } from '../../theme';

type BlockProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export const Section = ({ children, style }: BlockProps) => {
  return <View style={[styles.section, style]}>{children}</View>;
};

export const Group = ({ children, style }: BlockProps) => {
  return <View style={[styles.group, style]}>{children}</View>;
};

export const Item = ({ children, style }: BlockProps) => {
  return <View style={[styles.item, style]}>{children}</View>;
};

const styles = StyleSheet.create({
  section: {
    ...patterns.section,
  },
  group: {
    ...patterns.group,
  },
  item: {
    ...patterns.element,
  },
});
