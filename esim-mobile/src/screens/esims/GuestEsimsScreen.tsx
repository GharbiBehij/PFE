import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { PurpleButton } from '../../components/Buttons/PurpleButton';
import { ScreenContent, ScreenHeader, ScreenShell } from '../../components/layout';
import { navigateTo } from '../../navigation/navigationRef';
import { colors, radii, patterns, spacing, typography } from '../../theme';
import { Pressable } from 'react-native';
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

          {/* CTA group — login + register */}
          <View style={styles.cta}>
            <PurpleButton
              label="Se connecter"
              icon="log-in-outline"
              onPress={() => navigateTo('Login', { source: 'app' })}
            />
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

  // CTA wrapper — boutons centrés pleine largeur
  cta: {
    alignSelf: 'stretch',
    gap: spacing.md,
  },

  // Register — text link only, no border, no background
  registerLink: {
    paddingVertical: spacing.sm,
    alignItems: 'center',
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
