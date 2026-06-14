import { StyleSheet, Text, type StyleProp, type TextStyle } from 'react-native';
import { colors, spacing, typography } from '../theme';

type SectionLabelProps = {
  children: string;
  style?: StyleProp<TextStyle>;
};

export const SectionLabel = ({ children, style }: SectionLabelProps) => {
  return <Text style={[styles.label, style]}>{children}</Text>;
};

const styles = StyleSheet.create({
  label: {
    ...typography.overline,
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
});
