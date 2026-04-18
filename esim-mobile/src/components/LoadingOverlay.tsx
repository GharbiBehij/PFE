import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../theme';

type LoadingOverlayProps = {
  message?: string;
  fullScreen?: boolean;
};

export const LoadingOverlay = ({ message = 'Chargement...', fullScreen = true }: LoadingOverlayProps) => {
  return (
    <View style={[styles.container, fullScreen ? styles.fullScreen : undefined]}>
      <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  fullScreen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  message: {
    ...typography.bodyMD,
    color: colors.text.secondary,
    marginTop: spacing.sm,
  },
});
