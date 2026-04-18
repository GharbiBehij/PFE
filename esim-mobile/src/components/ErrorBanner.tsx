import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radii, sizes, spacing, typography } from '../theme';

type ErrorBannerProps = {
  message: string;
  onRetry?: () => void;
};

export const ErrorBanner = ({ message, onRetry }: ErrorBannerProps) => {
  return (
    <View style={styles.container}>
      <Text style={styles.message}>{message}</Text>
      {onRetry ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Réessayer"
          onPress={onRetry}
          style={({ pressed }) => [styles.retryButton, pressed ? styles.retryButtonPressed : undefined]}
        >
          <Text style={styles.retryText}>Réessayer</Text>
        </Pressable>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.error[100],
    borderColor: colors.error.DEFAULT,
    borderRadius: radii.md,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md,
  },
  message: {
    ...typography.bodyMD,
    color: colors.error.dark,
  },
  retryButton: {
    alignSelf: 'flex-start',
    alignItems: 'center',
    backgroundColor: colors.error.DEFAULT,
    borderRadius: radii.sm,
    justifyContent: 'center',
    minHeight: sizes.touch.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  retryButtonPressed: {
    backgroundColor: colors.error.dark,
    transform: [{ scale: 0.98 }],
  },
  retryText: {
    ...typography.labelSM,
    color: colors.text.onPrimary,
  },
});
