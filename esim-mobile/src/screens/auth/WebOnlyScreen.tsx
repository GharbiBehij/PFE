import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../hooks/client/useAuth';
import { colors, sizes, spacing, typography } from '../../theme';
import { PurpleButton } from '../../components/Buttons';

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
      <Ionicons color={colors.primary.DEFAULT} name="laptop-outline" size={sizes.icon.xxl} />

      <Text style={styles.title}>Accès Web Uniquement</Text>

      <Text style={styles.description}>
        Votre compte est réservé à la plateforme web NetyFly.{`\n`}
        Veuillez vous connecter depuis votre navigateur.
      </Text>

      <PurpleButton
        disabled={isSubmitting}
        label={isSubmitting ? 'Déconnexion...' : 'Se déconnecter'}
        loading={isSubmitting}
        onPress={() => { void handleLogout(); }}
        style={styles.logoutButton}
      />
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
    marginTop: spacing.xl,
  },
});
