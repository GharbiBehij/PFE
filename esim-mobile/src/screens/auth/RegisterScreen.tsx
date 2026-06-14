import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CommonActions } from '@react-navigation/native';
import { AuthField } from '../../components/auth/AuthField';
import { AuthShell } from '../../components/auth/AuthShell';
import { ErrorBanner } from '../../components/ErrorBanner';
import { useAuth } from '../../hooks/client/useAuth';
import { navigationRef } from '../../navigation/navigationRef';
import type { AuthStackParamList } from '../../navigation/types';
import { colors, spacing, typography } from '../../theme';
import { ActionButton } from '../../components/Buttons';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export const RegisterScreen = ({ navigation, route }: Props) => {
  const { signup } = useAuth();
  const [firstname, setFirstname] = useState('');
  const [lastname, setLastname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
const [error, setError] = useState<string | null>(null);

  const isValidEmail = useMemo(() => /^\S+@\S+\.\S+$/.test(email), [email]);

  const onBack = () => {
    const source = route.params?.source ?? 'app';
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else if (navigation.getParent()?.canGoBack()) {
      navigation.getParent()?.goBack();
    } else if (source === 'onboarding') {
      navigation.navigate('Onboarding', { skipAnimation: true });
    } else {
      navigation.navigate('Onboarding', { skipAnimation: true });
    }
  };

  const onSubmit = async () => {
    if (!firstname.trim() || !lastname.trim() || !email.trim() || !password.trim()) {
      setError('Veuillez remplir tous les champs obligatoires.');
      return;
    }
    if (!isValidEmail) {
      setError('Adresse e-mail invalide.');
      return;
    }
    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    try {
      setIsSubmitting(true);
      setError(null);
      await signup({
        email: email.trim(),
        firstname: firstname.trim(),
        lastname: lastname.trim(),
        password,
      });
      // Redirect to Payment if auth was triggered from PackageDetailScreen
      const pkgId = route.params?.packageId;
      if (route.params?.returnTo === 'Payment' && pkgId) {
        setTimeout(() => {
          navigationRef.dispatch(
            CommonActions.navigate({
              name: 'HomeTab',
              params: { screen: 'Payment', params: { packageId: pkgId } },
            }),
          );
        }, 200);
      }
    } catch {
      setError('Inscription impossible. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell
      badgeIcon="airplane"
      badgeLabel="NetyFly eSIM"
      formSubtitle="Remplissez le formulaire ci-dessous"
      formTitle="Inscription"
      onBack={onBack}
      subtitle="Rejoignez des milliers de voyageurs connectés"
      title="Créer un compte ✨"
    >
      {error ? <ErrorBanner message={error} /> : null}

      <View style={styles.nameRow}>
        <AuthField
          containerStyle={styles.nameField}
          iconName="account-outline"
          inputSize="sm"
          onChangeText={setFirstname}
          placeholder="Prénom"
          value={firstname}
        />
        <AuthField
          containerStyle={styles.nameField}
          iconName="account-outline"
          inputSize="sm"
          onChangeText={setLastname}
          placeholder="Nom"
          value={lastname}
        />
      </View>

      <AuthField
        autoCapitalize="none"
        containerStyle={styles.fieldGap}
        iconName="email-outline"
        keyboardType="email-address"
        onChangeText={setEmail}
        placeholder="votre@email.com"
        value={email}
      />

      <AuthField
        containerStyle={styles.fieldGap}
        iconName="lock-outline"
        isPasswordVisible={isPasswordVisible}
        onChangeText={setPassword}
        onTogglePasswordVisibility={() => setIsPasswordVisible((value) => !value)}
        placeholder="Min. 6 caractères"
        secureTextEntry={!isPasswordVisible}
        value={password}
      />

      <AuthField
        containerStyle={styles.fieldGap}
        iconName="lock-check-outline"
        onChangeText={setConfirmPassword}
        placeholder="Confirmer le mot de passe"
        secureTextEntry={!isPasswordVisible}
        value={confirmPassword}
      />

      <Text style={styles.termsText}>
        En créant un compte, vous acceptez nos{' '}
        <Text style={styles.termsLink}>Conditions d'utilisation</Text>
        {' '}et notre{' '}
        <Text style={styles.termsLink}>Politique de confidentialité</Text>.
      </Text>

      <ActionButton
        disabled={isSubmitting}
        icon="arrow-forward"
        label="Créer mon compte"
        loading={isSubmitting}
        onPress={() => { void onSubmit(); }}
        style={styles.submitButton}
      />

      <View style={styles.footerRow}>
        <Text style={styles.footerLabel}>Déjà un compte ?</Text>
        <Pressable onPress={() => navigation.navigate('Login', { source: route.params?.source })}>
          <Text style={styles.footerLink}> Se connecter</Text>
        </Pressable>
      </View>
    </AuthShell>
  );
};

const styles = StyleSheet.create({
  nameRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  nameField: {
    flex: 1,
  },
  fieldGap: {
    marginTop: spacing.lg,
  },
  termsText: {
    ...typography.bodySM,
    color: colors.gray[400],
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  termsLink: {
    color: colors.primary.DEFAULT,
    fontWeight: '600',
  },
  submitButton: {
    marginTop: spacing.lg,
  },
  footerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
  footerLabel: {
    ...typography.bodyMD,
    color: colors.text.secondary,
  },
  footerLink: {
    ...typography.bodyMD,
    color: colors.primary.DEFAULT,
    fontWeight: '700',
  },
});
