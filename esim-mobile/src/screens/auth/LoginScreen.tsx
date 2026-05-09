import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ErrorBanner } from '../../components/ErrorBanner';
import { useAuth } from '../../hooks/client/useAuth';
import type { AuthStackParamList } from '../../navigation/types';
import { colors, radii, sizes, spacing, typography } from '../../theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export const LoginScreen = ({ navigation, route }: Props) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Veuillez remplir tous les champs.');
      return;
    }
    try {
      setIsSubmitting(true);
      setError(null);
      await login(email.trim(), password);
    } catch {
      setError('Identifiants incorrects. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    // Deeper violet gradient matching the React design
    <LinearGradient
      colors={['#5B21B6', '#7C3AED', '#6D28D9']}
      locations={[0, 0.5, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.root}
    >
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.flex}
        >
          {/* ── Hero ── */}
          <View style={styles.heroSection}>
            {/* Back */}
            <Pressable
              onPress={() => {
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
              }}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={18} color="rgba(255,255,255,0.8)" />
              <Text style={styles.backText}>Retour</Text>
            </Pressable>

            {/* Decorative blobs */}
            <View pointerEvents="none" style={styles.blobTopRight} />
            <View pointerEvents="none" style={styles.blobBottomLeft} />

            {/* NetyFly badge */}
            <View style={styles.badge}>
              <Ionicons name="airplane" size={14} color={YELLOW} />
              <Text style={styles.badgeText}>NetyFly eSIM</Text>
            </View>

            <Text style={styles.heroTitle}>Bon retour ! 👋</Text>
            <Text style={styles.heroSubtitle}>Connectez-vous à votre compte</Text>
          </View>

          {/* ── White slide-up card ── */}
          <ScrollView
            style={styles.cardScroll}
            contentContainerStyle={styles.cardScrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.cardTitle}>Connexion</Text>
            <Text style={styles.cardSubtitle}>Entrez vos identifiants pour continuer</Text>

            {error ? <ErrorBanner message={error} /> : null}

            {/* Email */}
            <Text style={styles.label}>Adresse e-mail</Text>
            <View style={styles.inputWrapper}>
              <MaterialCommunityIcons
                name="email-outline"
                size={18}
                color={colors.text.tertiary}
                style={styles.inputIcon}
              />
              <TextInput
                autoCapitalize="none"
                keyboardType="email-address"
                onChangeText={setEmail}
                placeholder="votre@email.com"
                placeholderTextColor={colors.text.tertiary}
                style={styles.input}
                value={email}
              />
            </View>

            {/* Password */}
            <Text style={[styles.label, { marginTop: spacing.lg }]}>Mot de passe</Text>
            <View style={styles.inputWrapper}>
              <MaterialCommunityIcons
                name="lock-outline"
                size={18}
                color={colors.text.tertiary}
                style={styles.inputIcon}
              />
              <TextInput
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor={colors.text.tertiary}
                secureTextEntry={!isPasswordVisible}
                style={[styles.input, { flex: 1 }]}
                value={password}
              />
              <Pressable
                onPress={() => setIsPasswordVisible((v) => !v)}
                style={styles.eyeButton}
              >
                <Ionicons
                  name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color={colors.text.tertiary}
                />
              </Pressable>
            </View>

            {/* Forgot password */}
            <Pressable style={styles.forgotWrapper}>
              <Text style={styles.forgotText}>Mot de passe oublié ?</Text>
            </Pressable>

            {/* CTA */}
            <Pressable
              disabled={isSubmitting}
              onPress={onSubmit}
              onPressIn={() => setIsPressed(true)}
              onPressOut={() => setIsPressed(false)}
              style={[
                styles.submitButton,
                isPressed && !isSubmitting && styles.submitButtonPressed,
                isSubmitting && styles.submitButtonDisabled,
              ]}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#1C1917" />
              ) : (
                <View style={styles.submitButtonInner}>
                  <Text style={styles.submitButtonText}>Se connecter</Text>
                  <Ionicons name="arrow-forward" size={18} color="#1C1917" />
                </View>
              )}
            </Pressable>

            {/* OR divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OU</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Footer */}
            <View style={styles.footerRow}>
              <Text style={styles.footerLabel}>Pas encore de compte ?</Text>
              <Pressable onPress={() => navigation.navigate('Register', { source: route.params?.source })}>
                <Text style={styles.footerLink}> Créer un compte</Text>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const YELLOW = '#FACC15';

const styles = StyleSheet.create({
  root: { flex: 1 },
  safeArea: { flex: 1 },
  flex: { flex: 1 },

  // ── Hero ─────────────────────────────────────────────
  heroSection: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 48,
    overflow: 'hidden',
  },
  blobTopRight: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 9999,
    height: 256,
    position: 'absolute',
    right: -60,
    top: -80,
    width: 256,
  },
  blobBottomLeft: {
    backgroundColor: 'rgba(99,102,241,0.1)',
    borderRadius: 9999,
    height: 288,
    position: 'absolute',
    bottom: -60,
    left: -60,
    width: 288,
  },
  backButton: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    marginBottom: 20,
    zIndex: 2,
  },
  backText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '500',
  },
  badge: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 9999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    marginBottom: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '700',
    lineHeight: 36,
  },
  heroSubtitle: {
    color: 'rgba(221,214,254,1)', // violet-200
    fontSize: 14,
    marginTop: 8,
  },

  // ── White card ───────────────────────────────────────
  cardScroll: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
  },
  cardScrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  cardTitle: {
    color: '#1F2937',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  cardSubtitle: {
    color: '#9CA3AF',
    fontSize: 14,
    marginBottom: 28,
  },

  // ── Labels ───────────────────────────────────────────
  label: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },

  // ── Inputs ───────────────────────────────────────────
  inputWrapper: {
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderColor: '#E5E7EB',
    borderRadius: 16, // rounded-2xl equivalent
    borderWidth: 1,
    flexDirection: 'row',
  },
  inputIcon: {
    paddingHorizontal: 14,
  },
  input: {
    color: '#1F2937',
    flex: 1,
    fontSize: 16,
    paddingVertical: 16,
  },
  eyeButton: {
    paddingHorizontal: 14,
    paddingVertical: 16,
  },

  // ── Forgot ───────────────────────────────────────────
  forgotWrapper: {
    alignSelf: 'flex-end',
    marginTop: 12,
    marginBottom: 4,
  },
  forgotText: {
    color: '#7C3AED',
    fontSize: 14,
    fontWeight: '500',
  },

  // ── CTA ──────────────────────────────────────────────
  submitButton: {
    alignItems: 'center',
    backgroundColor: YELLOW,
    borderRadius: 16,
    elevation: 6,
    justifyContent: 'center',
    marginTop: 20,
    paddingVertical: 18,
    shadowColor: YELLOW,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    width: '100%',
  },
  submitButtonInner: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  submitButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#1C1917',
    fontSize: 16,
    fontWeight: '700',
  },

  // ── Divider ──────────────────────────────────────────
  dividerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    marginVertical: 20,
  },
  dividerLine: {
    backgroundColor: '#E5E7EB',
    flex: 1,
    height: 1,
  },
  dividerText: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '500',
  },

  // ── Footer ───────────────────────────────────────────
  footerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  footerLabel: {
    color: '#6B7280',
    fontSize: 14,
  },
  footerLink: {
    color: '#7C3AED',
    fontSize: 14,
    fontWeight: '700',
  },
});
