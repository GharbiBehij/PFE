import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, patterns, sizes, spacing, typography } from '../theme';

type EmptyStateProps = {
  title: string;
  description?: string;
  ctaLabel?: string;
  onPressCta?: () => void;
};

export const EmptyState = ({ title, description, ctaLabel, onPressCta }: EmptyStateProps) => {
  return (
    <View style={styles.container}>
      <Ionicons color={colors.text.tertiary} name="planet-outline" size={sizes.touch.sm} />
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
      {ctaLabel && onPressCta ? (
        <Pressable onPress={onPressCta} style={styles.button}>
          <Text style={styles.buttonText}>{ctaLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...patterns.card,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  title: {
    ...typography.titleSM,
    color: colors.text.primary,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  description: {
    ...typography.bodyMD,
    color: colors.text.secondary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  button: {
    ...patterns.ctaPrimary,
    backgroundColor: colors.primary.DEFAULT,
    marginTop: spacing.lg,
  },
  buttonText: {
    ...typography.labelMD,
    color: colors.text.onPrimary,
  },
});
