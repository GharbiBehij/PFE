import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../hooks/client/useAuth';
import { colors, radii, sizes, spacing, typography } from '../../theme';

export const WebOnlyScreen = () => {
  const { logout } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogout = async () => {
    try {
      setIsSubmitting(true);
      await logout();
      // RootNavigator redirects to AuthStack when user becomes null.
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Ionicons color={colors.text.tertiary} name="laptop-outline" size={sizes.icon.xxl} />

      <Text style={styles.title}>Accès Web Uniquement</Text>

      <Text style={styles.description}>
        Votre compte est réservé à la plateforme web NetyFly.{`\n`}
        Veuillez vous connecter depuis votre navigateur.
      </Text>

      <TouchableOpacity
        accessibilityRole="button"
        disabled={isSubmitting}
        onPress={() => {
          void handleLogout();
        }}
        style={styles.logoutButton}
      >
        <Text style={styles.logoutButtonText}>{isSubmitting ? 'Déconnexion...' : 'Se déconnecter'}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    ...typography.titleMD,
    color: colors.primary.DEFAULT,
    fontWeight: '700',
    marginTop: spacing.lg,
  },
  description: {
    ...typography.bodyMD,
    color: colors.text.secondary,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.xl,
    textAlign: 'center',
  },
  logoutButton: {
    backgroundColor: colors.primary.DEFAULT,
    borderRadius: radii.lg,
    marginTop: spacing.xl,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  logoutButtonText: {
    ...typography.button,
    color: colors.white,
    fontWeight: '700',
  },
});