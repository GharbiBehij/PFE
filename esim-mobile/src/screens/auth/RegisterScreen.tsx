import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useMemo, useState } from 'react';
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
  const [isPressed, setIsPressed] = useState(false);
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
            <View style={styles.blobTopRight} />
            <View style={styles.blobBottomLeft} />

            {/* Back button */}
            <Pressable
              onPress={() => {
                const source = route.params?.source ?? 'app';
                if (navigation.canGoBack()) {
                  navigation.goBack();
                } else if (navigation.getParent()?.canGoBack()) {
                  navigation.getParent()?.goBack();
                } else if (source === 'onboarding') {
                  navigation.navigate('Onboarding', { skipAnimation: true });
                } else {
                  navigation.navigate('MainTabs');
                }
              }}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={18} color="rgba(255,255,255,0.8)" />
              <Text style={styles.backText}>Retour</Text>
            </Pressable>

            {/* NetyFly badge */}
            <View style={styles.badge}>
              <Ionicons name="airplane" size={14} color={YELLOW} />
              <Text style={styles.badgeText}>NetyFly eSIM</Text>
            </View>

            <Text style={styles.heroTitle}>Créer un compte ✨</Text>
            <Text style={styles.heroSubtitle}>Rejoignez des milliers de voyageurs connectés</Text>
          </View>

          {/* ── White slide-up card ── */}
          <ScrollView
            style={styles.cardScroll}
            contentContainerStyle={styles.cardScrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.cardTitle}>Inscription</Text>
            <Text style={styles.cardSubtitle}>Remplissez le formulaire ci-dessous</Text>

            {error ? <ErrorBanner message={error} /> : null}

            {/* Prénom + Nom */}
            <View style={styles.nameRow}>
              <View style={[styles.inputWrapper, { flex: 1 }]}>
                <MaterialCommunityIcons
                  name="account-outline"
                  size={16}
                  color="#9CA3AF"
                  style={styles.inputIconSm}
                />
                <TextInput
                  onChangeText={setFirstname}
                  placeholder="Prénom"
                  placeholderTextColor="#9CA3AF"
                  style={styles.inputSm}
                  value={firstname}
                />
              </View>
              <View style={[styles.inputWrapper, { flex: 1 }]}>
                <MaterialCommunityIcons
                  name="account-outline"
                  size={16}
                  color="#9CA3AF"
                  style={styles.inputIconSm}
                />
                <TextInput
                  onChangeText={setLastname}
                  placeholder="Nom"
                  placeholderTextColor="#9CA3AF"
                  style={styles.inputSm}
                  value={lastname}
                />
              </View>
            </View>

            {/* Email */}
            <View style={[styles.inputWrapper, { marginTop: 16 }]}>
              <MaterialCommunityIcons
                name="email-outline"
                size={18}
                color="#9CA3AF"
                style={styles.inputIcon}
              />
              <TextInput
                autoCapitalize="none"
                keyboardType="email-address"
                onChangeText={setEmail}
                placeholder="votre@email.com"
                placeholderTextColor="#9CA3AF"
                style={styles.input}
                value={email}
              />
            </View>

            {/* Password */}
            <View style={[styles.inputWrapper, { marginTop: 16 }]}>
              <MaterialCommunityIcons
                name="lock-outline"
                size={18}
                color="#9CA3AF"
                style={styles.inputIcon}
              />
              <TextInput
                onChangeText={setPassword}
                placeholder="Min. 6 caractères"
                placeholderTextColor="#9CA3AF"
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
                  color="#9CA3AF"
                />
              </Pressable>
            </View>

            {/* Confirm password */}
            <View style={[styles.inputWrapper, { marginTop: 16 }]}>
              <MaterialCommunityIcons
                name="lock-check-outline"
                size={18}
                color="#9CA3AF"
                style={styles.inputIcon}
              />
              <TextInput
                onChangeText={setConfirmPassword}
                placeholder="Confirmer le mot de passe"
                placeholderTextColor="#9CA3AF"
                secureTextEntry={!isPasswordVisible}
                style={styles.input}
                value={confirmPassword}
              />
            </View>

            {/* Terms */}
            <Text style={styles.termsText}>
              En créant un compte, vous acceptez nos{' '}
              <Text style={styles.termsLink}>Conditions d'utilisation</Text>
              {' '}et notre{' '}
              <Text style={styles.termsLink}>Politique de confidentialité</Text>.
            </Text>

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
                  <Text style={styles.submitButtonText}>Créer mon compte</Text>
                  <Ionicons name="arrow-forward" size={18} color="#1C1917" />
                </View>
              )}
            </Pressable>

            {/* Footer */}
            <View style={styles.footerRow}>
              <Text style={styles.footerLabel}>Déjà un compte ?</Text>
              <Pressable onPress={() => navigation.navigate('Login', { source: route.params?.source })}>
                <Text style={styles.footerLink}> Se connecter</Text>
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
    paddingTop: 16,
    paddingBottom: 44,
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
    marginBottom: 18,
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
    color: 'rgba(221,214,254,1)',
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
    marginBottom: 24,
  },

  // ── Inputs ───────────────────────────────────────────
  nameRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inputWrapper: {
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderColor: '#E5E7EB',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
  },
  inputIcon: {
    paddingHorizontal: 14,
  },
  inputIconSm: {
    paddingHorizontal: 10,
  },
  input: {
    color: '#1F2937',
    flex: 1,
    fontSize: 16,
    paddingVertical: 16,
  },
  inputSm: {
    color: '#1F2937',
    flex: 1,
    fontSize: 14,
    paddingVertical: 16,
  },
  eyeButton: {
    paddingHorizontal: 14,
    paddingVertical: 16,
  },

  // ── Terms ────────────────────────────────────────────
  termsText: {
    color: '#9CA3AF',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 16,
    textAlign: 'center',
  },
  termsLink: {
    color: '#7C3AED',
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

  // ── Footer ───────────────────────────────────────────
  footerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
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
