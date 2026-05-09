import { Ionicons } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
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
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { authApi } from '../../api/auth.api';
import { ErrorBanner } from '../../components/ErrorBanner';
import { useAuth } from '../../hooks/client/useAuth';
import type { AuthStackParamList } from '../../navigation/types';
import { colors, spacing } from '../../theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'ResellerLogin'>;

export const ResellerLoginScreen = ({ navigation }: Props) => {
  const { login, logout } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
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

      // RootNavigator automatically routes to ResellerTabs based on user.role === 'SALESMAN'
    } catch {
      setError('Email ou mot de passe incorrect. Veuillez réessayer.');
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
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <View style={styles.heroSection}>
          <Pressable
            onPress={() => navigation.navigate('Onboarding', { skipAnimation: true })}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={18} color="rgba(255,255,255,0.8)" />
            <Text style={styles.backText}>Retour</Text>
          </Pressable>

          <View style={styles.blobTopRight} />
          <View style={styles.blobBottomLeft} />

          <View style={styles.badge}>
            <Ionicons name="briefcase-outline" size={14} color={YELLOW} />
            <Text style={styles.badgeText}>Portail Revendeur</Text>
          </View>

          <Text style={styles.heroTitle}>Connexion revendeur</Text>
          <Text style={styles.heroSubtitle}>Accédez à votre espace professionnel</Text>
        </View>

        <ScrollView
          style={styles.cardScroll}
          contentContainerStyle={styles.cardScrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.cardTitle}>Accès sécurisé</Text>
          <Text style={styles.cardSubtitle}>Utilisez vos identifiants professionnels</Text>

          {error ? <ErrorBanner message={error} /> : null}

          <Text style={styles.label}>Email professionnel</Text>
          <View style={styles.inputWrapper}>
            <MaterialCommunityIcons
              name="email-outline"
              size={18}
              color={colors.text.tertiary}
              style={styles.inputIcon}
            />
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              onChangeText={setEmail}
              placeholder="votre@email.com"
              placeholderTextColor={colors.text.tertiary}
              style={styles.input}
              value={email}
            />
          </View>

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
            <Pressable onPress={() => setIsPasswordVisible((v) => !v)} style={styles.eyeButton}>
              <Ionicons
                name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
                size={18}
                color={colors.text.tertiary}
              />
            </Pressable>
          </View>

          <View style={styles.bottomNote}>
            <Ionicons color={colors.text.tertiary} name="information-circle-outline" size={16} />
            <Text style={styles.bottomNoteText}>
              Vos identifiants vous ont été fournis par votre responsable de zone.
            </Text>
          </View>

          <Pressable
            disabled={isSubmitting}
            onPress={handleLogin}
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
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const YELLOW = '#FACC15';

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  flex: { flex: 1 },
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
    color: 'rgba(221,214,254,1)',
    fontSize: 14,
    marginTop: 8,
  },
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
  label: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
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
  input: {
    flex: 1,
    color: '#1F2937',
    fontSize: 16,
    paddingVertical: 16,
  },
  eyeButton: {
    paddingHorizontal: 14,
    paddingVertical: 16,
  },
  bottomNote: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
  },
  bottomNoteText: {
    fontSize: 13,
    color: colors.text.tertiary,
    lineHeight: 18,
    flex: 1,
  },
  submitButton: {
    alignItems: 'center',
    backgroundColor: YELLOW,
    borderRadius: 16,
    elevation: 6,
    justifyContent: 'center',
    marginTop: 4,
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
});
