import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ScreenContent, ScreenHeader, ScreenShell } from '../../components/layout';
import { navigateTo } from '../../navigation/navigationRef';
import { colors, radii, patterns, sizes, spacing, typography } from '../../theme';

export const GuestEsimsScreen = () => {
  return (
    <ScreenShell>
      {/* Plain white header — no gradient */}
      <ScreenHeader style={styles.header}>
        <Text style={styles.headerTitle}>Mes eSIMs</Text>
      </ScreenHeader>

      <ScreenContent
        scrollable={false}
        contentContainerStyle={styles.root}
      >
        {/* Free-floating content — no card, no container */}
        <View style={styles.inner}>

          {/* Icon — floating directly, no circle background */}
          <Ionicons
            name="globe-outline"
            size={72}
            color={colors.primary.DEFAULT}
            style={styles.icon}
          />

          {/* Title */}
          <Text style={styles.title}>
            Vos eSIMs apparaîtront ici
          </Text>

          {/* Subtitle */}
          <Text style={styles.subtitle}>
            Connectez-vous pour accéder à vos eSIMs
            et suivre votre consommation de données.
          </Text>

          {/* Primary — login */}
          <Pressable
            onPress={() => navigateTo('Login', { source: 'app' })}
            style={({ pressed }) => [styles.loginButton, pressed && styles.loginButtonPressed]}
          >
            <Text style={styles.loginButtonText}>Se connecter</Text>
          </Pressable>

          {/* Secondary — register */}
          <Pressable
            onPress={() => navigateTo('Register', { source: 'app' })}
            style={styles.registerLink}
          >
            <Text style={styles.registerText}>
              Pas encore de compte ?{' '}
              <Text style={styles.registerAccent}>
                Créer un compte
              </Text>
            </Text>
          </Pressable>

        </View>
      </ScreenContent>
    </ScreenShell>
  );
};

const styles = StyleSheet.create({
  // Plain header
  header: {
    ...patterns.headerShell,
    alignItems: 'center',
    borderBottomLeftRadius: radii.card,
    borderBottomRightRadius: radii.card,
  },
  headerTitle: {
    ...typography.titleMD,
    color: colors.text.primary,
    fontWeight: '700',
  },

  // Full screen root — vertically centered
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // Inner — no card, no border, no shadow
  inner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
    gap: spacing.lg,
  },

  // Icon — no wrapping view
  icon: {
    opacity: 0.9,
    marginBottom: spacing.md,
  },

  // Text
  title: {
    ...typography.titleMD,
    color: colors.text.primary,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    ...typography.bodyMD,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },

  // Login button — full width, purple
  loginButton: {
    ...patterns.ctaPrimary,
    alignSelf: 'stretch',
    backgroundColor: colors.primary.DEFAULT,
  },
  loginButtonPressed: {
    ...patterns.ctaPrimaryPressed,
    backgroundColor: colors.primary.dark,
  },
  loginButtonText: {
    ...typography.labelLG,
    color: colors.text.primary,
    fontWeight: '700',
    textAlign: 'center',
  },

  // Register — text link only, no border, no background
  registerLink: {
    paddingVertical: spacing.sm,
  },
  registerText: {
    ...typography.bodyMD,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  registerAccent: {
    color: colors.primary.DEFAULT,
    fontWeight: '700',
  },
});
