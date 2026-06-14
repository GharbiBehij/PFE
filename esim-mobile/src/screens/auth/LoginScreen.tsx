import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
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

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export const LoginScreen = ({ navigation, route }: Props) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
const [error, setError] = useState<string | null>(null);

  const onBack = () => {
    const source = route.params?.source ?? 'app';
    if (source === 'onboarding') {
      navigation.navigate('Onboarding', { skipAnimation: true });
    } else if (navigation.canGoBack()) {
      navigation.goBack();
    } else if (navigation.getParent()?.canGoBack()) {
      navigation.getParent()?.goBack();
    } else {
      navigation.navigate('Onboarding', { skipAnimation: true });
    }
  };

  const onSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Veuillez remplir tous les champs.');
      return;
    }
    try {
      setIsSubmitting(true);
      setError(null);
      await login(email.trim(), password);
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
      setError('Identifiants incorrects. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell
      badgeIcon="airplane"
      badgeLabel="NetyFly eSIM"
      formSubtitle="Entrez vos identifiants pour continuer"
      formTitle="Connexion"
      onBack={onBack}
      subtitle="Connectez-vous à votre compte"
      title="Bon retour ! 👋"
    >
      {error ? <ErrorBanner message={error} /> : null}

      <AuthField
        autoCapitalize="none"
        iconName="email-outline"
        keyboardType="email-address"
        label="Adresse e-mail"
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

      <Pressable style={styles.forgotWrapper}>
        <Text style={styles.forgotText}>Mot de passe oublié ?</Text>
      </Pressable>

      <ActionButton
        disabled={isSubmitting}
        icon="arrow-forward"
        label="Se connecter"
        loading={isSubmitting}
        onPress={() => { void onSubmit(); }}
        style={styles.submitButton}
      />

      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>OU</Text>
        <View style={styles.dividerLine} />
      </View>

      <View style={styles.footerRow}>
        <Text style={styles.footerLabel}>Pas encore de compte ?</Text>
        <Pressable onPress={() => navigation.navigate('Register', { source: route.params?.source })}>
          <Text style={styles.footerLink}> Créer un compte</Text>
        </Pressable>
      </View>
    </AuthShell>
  );
};

const styles = StyleSheet.create({
  fieldGap: {
    marginTop: spacing.lg,
  },
  forgotWrapper: {
    alignSelf: 'flex-end',
    marginBottom: spacing.xs,
    marginTop: spacing.md,
  },
  forgotText: {
    ...typography.bodyMD,
    color: colors.primary.DEFAULT,
    fontWeight: '600',
  },
  submitButton: {
    marginTop: spacing.lg,
  },
  dividerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    marginVertical: spacing.lg,
  },
  dividerLine: {
    backgroundColor: colors.border,
    flex: 1,
    minHeight: StyleSheet.hairlineWidth,
  },
  dividerText: {
    ...typography.labelSM,
    color: colors.gray[400],
  },
  footerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
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
