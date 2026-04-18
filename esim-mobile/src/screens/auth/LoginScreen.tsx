import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
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

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export const LoginScreen = ({ navigation }: Props) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Veuillez saisir votre e-mail et mot de passe.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await login(email.trim(), password);
    } catch {
      setError('Connexion impossible. Vérifiez vos identifiants.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.keyboardContainer}
    >
      <ScreenShell>
        <ScreenHeader style={styles.headerShell}>
          <LinearGradient colors={[colors.primary.dark, colors.primary.DEFAULT]} style={styles.header}>
            <View style={styles.circleOne} />
            <View style={styles.circleTwo} />
            <Text style={styles.headerTitle}>Bon retour!</Text>
            <Text style={styles.headerSubtitle}>Connectez-vous pour continuer</Text>
          </LinearGradient>
        </ScreenHeader>

        <ScreenContent scrollable={false}>
          <Section style={styles.cardSection}>
            <View style={styles.card}>
              {error ? <ErrorBanner message={error} /> : null}

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

              <Pressable
                disabled={isSubmitting}
                onPress={onSubmit}
                style={({ pressed }) => [
                  styles.submitButton,
                  pressed && !isSubmitting ? styles.submitButtonPressed : undefined,
                ]}
              >
                <Text style={styles.submitButtonText}>{isSubmitting ? 'Connexion...' : 'Connexion'}</Text>
              </Pressable>

              <View style={styles.footerRow}>
                <Text style={styles.footerLabel}>Pas de compte?</Text>
                <Pressable onPress={() => navigation.navigate('Register')}>
                  <Text style={styles.footerLink}>Créer un compte</Text>
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
  keyboardContainer: {
    backgroundColor: colors.background,
    flex: 1,
  },
  headerShell: {
    ...patterns.headerShell,
  },
  header: {
    borderBottomLeftRadius: radii.xxl,
    borderBottomRightRadius: radii.xxl,
    overflow: 'hidden',
    paddingBottom: spacing.xxl,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxxl,
  },
  cardSection: {
    ...patterns.screenPadding,
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
    alignItems: 'center',
    height: sizes.touch.sm,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  submitButton: {
    ...patterns.ctaPrimary,
    marginTop: spacing.xl,
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
