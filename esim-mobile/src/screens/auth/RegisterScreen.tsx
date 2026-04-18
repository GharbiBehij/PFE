import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ErrorBanner } from '../../components/ErrorBanner';
import { ScreenContent, ScreenHeader, ScreenShell, Section } from '../../components/layout';
import { useAuth } from '../../hooks/useAuth';
import type { AuthStackParamList } from '../../navigation/types';
import { colors, patterns, radii, sizes, spacing, typography } from '../../theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export const RegisterScreen = ({ navigation }: Props) => {
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
      await signup({ firstname: firstname.trim(), lastname: lastname.trim(), email: email.trim(), password });
    } catch {
      setError('Inscription impossible. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboard}>
      <ScreenShell>
        <ScreenHeader style={styles.headerShell}>
          <LinearGradient colors={[colors.primary.dark, colors.primary.DEFAULT]} style={styles.header}>
            <View style={styles.circleOne} />
            <View style={styles.circleTwo} />
            <Text style={styles.headerTitle}>Bienvenue!</Text>
            <Text style={styles.headerSubtitle}>Créez votre compte</Text>
          </LinearGradient>
        </ScreenHeader>

        <ScreenContent contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <Section style={styles.cardSection}>
            <View style={styles.card}>
              {error ? <ErrorBanner message={error} /> : null}

              <TextInput
                onChangeText={setFirstname}
                placeholder="Prénom"
                placeholderTextColor={colors.text.tertiary}
                style={styles.input}
                value={firstname}
              />
              <TextInput
                onChangeText={setLastname}
                placeholder="Nom"
                placeholderTextColor={colors.text.tertiary}
                style={styles.input}
                value={lastname}
              />
              <TextInput
                autoCapitalize="none"
                keyboardType="email-address"
                onChangeText={setEmail}
                placeholder="E-mail"
                placeholderTextColor={colors.text.tertiary}
                style={styles.input}
                value={email}
              />
              <View style={styles.passwordRow}>
                <TextInput
                  onChangeText={setPassword}
                  placeholder="Mot de passe"
                  placeholderTextColor={colors.text.tertiary}
                  secureTextEntry={!isPasswordVisible}
                  style={styles.passwordInput}
                  value={password}
                />
                <Pressable onPress={() => setIsPasswordVisible((current) => !current)} style={styles.eyeButton}>
                  <Ionicons
                    color={colors.text.secondary}
                    name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
                    size={sizes.icon.md}
                  />
                </Pressable>
              </View>
              <TextInput
                onChangeText={setConfirmPassword}
                placeholder="Confirmer le mot de passe"
                placeholderTextColor={colors.text.tertiary}
                secureTextEntry={!isPasswordVisible}
                style={styles.input}
                value={confirmPassword}
              />

              <Pressable disabled={isSubmitting} onPress={onSubmit} style={styles.submitButton}>
                {({ pressed }) => (
                  <View style={[styles.submitButtonInner, pressed && !isSubmitting ? styles.submitButtonPressed : undefined]}>
                    <Text style={styles.submitButtonText}>{isSubmitting ? 'Création...' : 'Créer un compte'}</Text>
                  </View>
                )}
              </Pressable>

              <View style={styles.footerRow}>
                <Text style={styles.footerLabel}>Déjà un compte?</Text>
                <Pressable onPress={() => navigation.navigate('Login')}>
                  <Text style={styles.footerLink}>Se connecter</Text>
                </Pressable>
              </View>
            </View>
          </Section>
        </ScreenContent>
      </ScreenShell>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboard: {
    backgroundColor: colors.background,
    flex: 1,
  },
  headerShell: {
    ...patterns.headerShell,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  header: {
    borderBottomLeftRadius: radii.xxl,
    borderBottomRightRadius: radii.xxl,
    overflow: 'hidden',
    paddingBottom: spacing.xxl,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxxl,
  },
  circleOne: {
    backgroundColor: colors.white,
    borderRadius: radii.full,
    height: sizes.decoration.authCircleSm,
    opacity: 0.12,
    position: 'absolute',
    right: -(spacing.lg + spacing.xs),
    top: -(spacing.lg + spacing.xs),
    width: sizes.decoration.authCircleSm,
  },
  circleTwo: {
    backgroundColor: colors.white,
    borderRadius: radii.full,
    height: sizes.decoration.authCircleLg,
    opacity: 0.08,
    position: 'absolute',
    right: spacing.xxl + spacing.xxxl,
    top: -(spacing.xxxxxl + spacing.xs),
    width: sizes.decoration.authCircleLg,
  },
  headerTitle: {
    ...typography.titleLG,
    color: colors.text.onPrimary,
  },
  headerSubtitle: {
    ...typography.bodyMD,
    color: colors.primary[200],
    marginTop: spacing.sm,
  },
  card: {
    ...patterns.card,
    marginTop: -spacing.xl,
  },
  cardSection: {
    ...patterns.screenPadding,
  },
  input: {
    ...patterns.inputField,
    ...typography.bodyLG,
    color: colors.text.primary,
    marginTop: spacing.md,
    paddingVertical: spacing.md,
  },
  passwordRow: {
    ...patterns.inputField,
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: spacing.md,
  },
  passwordInput: {
    ...typography.bodyLG,
    color: colors.text.primary,
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  eyeButton: {
    paddingHorizontal: spacing.md,
  },
  submitButton: {
    marginTop: spacing.xl,
    width: '100%',
  },
  submitButtonInner: {
    ...patterns.ctaPrimary,
  },
  submitButtonPressed: {
    ...patterns.ctaPrimaryPressed,
  },
  submitButtonText: {
    ...typography.button,
    color: colors.text.onPrimary,
  },
  footerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
  footerLabel: {
    ...typography.bodySM,
    color: colors.text.secondary,
    marginRight: spacing.xs,
  },
  footerLink: {
    ...typography.labelSM,
    color: colors.primary.DEFAULT,
    fontWeight: '700',
  },
});
