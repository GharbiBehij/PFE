import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { authApi } from '../../api/auth.api';
import { AuthField } from '../../components/auth/AuthField';
import { AuthShell } from '../../components/auth/AuthShell';
import { ErrorBanner } from '../../components/ErrorBanner';
import { useAuth } from '../../hooks/client/useAuth';
import { navigationRef } from '../../navigation/navigationRef';
import type { AuthStackParamList } from '../../navigation/types';
import { colors, sizes, spacing, typography } from '../../theme';
import { ActionButton } from '../../components/Buttons';

type Props = NativeStackScreenProps<AuthStackParamList, 'ResellerLogin'>;

export const ResellerLoginScreen = (_props: Props) => {
  const { login, logout } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Veuillez remplir tous les champs.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await login(email.trim(), password);

      const freshUser = await authApi.me();

      if (freshUser.role !== 'SALESMAN') {
        await logout();
        setError(
          "Accès non autorisé. Ce compte n'est pas un compte revendeur. Contactez votre responsable de zone.",
        );
        return;
      }
    } catch {
      setError('Email ou mot de passe incorrect. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell
      badgeIcon="briefcase-outline"
      badgeLabel="Portail Revendeur"
      formSubtitle="Utilisez vos identifiants professionnels"
      formTitle="Accès sécurisé"
      onBack={() => navigationRef.reset({ index: 0, routes: [{ name: 'Onboarding' }] })}
      subtitle="Accédez à votre espace professionnel"
      title="Connexion revendeur"
    >
      {error ? <ErrorBanner message={error} /> : null}

      <AuthField
        autoCapitalize="none"
        autoCorrect={false}
        iconName="email-outline"
        keyboardType="email-address"
        label="Email professionnel"
        onChangeText={setEmail}
        placeholder="votre@email.com"
        value={email}
      />

      <AuthField
        containerStyle={styles.fieldGap}
        iconName="lock-outline"
        isPasswordVisible={isPasswordVisible}
        label="Mot de passe"
        onChangeText={setPassword}
        onTogglePasswordVisibility={() => setIsPasswordVisible((value) => !value)}
        placeholder="••••••••"
        secureTextEntry={!isPasswordVisible}
        value={password}
      />

      <View style={styles.bottomNote}>
        <Ionicons
          color={colors.text.tertiary}
          name="information-circle-outline"
          size={sizes.icon.sm}
        />
        <Text style={styles.bottomNoteText}>
          Vos identifiants vous ont été fournis par votre responsable de zone.
        </Text>
      </View>

      <ActionButton
        disabled={isSubmitting}
        icon="arrow-forward"
        label="Se connecter"
        loading={isSubmitting}
        onPress={() => { void handleLogin(); }}
        style={styles.submitButton}
      />
    </AuthShell>
  );
};

const styles = StyleSheet.create({
  fieldGap: {
    marginTop: spacing.lg,
  },
  bottomNote: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.lg,
    marginTop: spacing.lg,
  },
  bottomNoteText: {
    ...typography.bodySM,
    color: colors.text.tertiary,
    flex: 1,
  },
  submitButton: {
    // no extra layout needed; ActionButton fills to stretch by default
  },
});
