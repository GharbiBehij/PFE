import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type KeyboardTypeOptions,
} from 'react-native';
import { ErrorBanner } from '../../components/ErrorBanner';
import { LoadingOverlay } from '../../components/LoadingOverlay';
import { ScreenContent, ScreenHeader, ScreenShell, Section } from '../../components/layout';
import { useProfile, useUpdateProfile } from '../../hooks/useProfile';
import type { ProfileStackParamList } from '../../navigation/types';
import { colors, patterns, radii, shadows, sizes, spacing, typography } from '../../theme';

type Props = NativeStackScreenProps<ProfileStackParamList, 'PersonalDetails'>;

export const PersonalDetailsScreen = ({ navigation }: Props) => {
  const profileQuery = useProfile();
  const updateMutation = useUpdateProfile();
  const [firstname, setFirstname] = useState('');
  const [lastname, setLastname] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const getErrorMessage = (error: unknown) => {
    if (error instanceof Error && error.message.trim().length > 0) {
      return error.message;
    }

    if (typeof error === 'object' && error !== null && 'response' in error) {
      const response = (error as { response?: { data?: { message?: string | string[] } } }).response;
      const apiMessage = response?.data?.message;

      if (Array.isArray(apiMessage) && apiMessage.length > 0) {
        return apiMessage.join(', ');
      }

      if (typeof apiMessage === 'string' && apiMessage.trim().length > 0) {
        return apiMessage;
      }
    }

    return 'Mise à jour impossible.';
  };

  useEffect(() => {
    if (!profileQuery.data) {
      return;
    }

    setFirstname(profileQuery.data.firstname ?? '');
    setLastname(profileQuery.data.lastname ?? '');
    setEmail(profileQuery.data.email ?? '');
    setPhone(profileQuery.data.phone ?? '');
  }, [profileQuery.data]);

  const onSave = async () => {
    setSuccessMessage('');
    setErrorMessage('');

    try {
      await updateMutation.mutateAsync({
        firstname,
        lastname,
        email,
        phone,
      });
      setSuccessMessage('Profil mis à jour avec succès.');
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
      setSuccessMessage('');
    }
  };

  if (profileQuery.isLoading || !profileQuery.data) {
    return (
      <ScreenShell>
        <ScreenContent scrollable={false}>
          <LoadingOverlay />
        </ScreenContent>
      </ScreenShell>
    );
  }

  if (profileQuery.isError) {
    return (
      <ScreenShell>
        <ScreenContent scrollable={false}>
          <View style={styles.errorState}>
            <ErrorBanner message="Impossible de charger le profil." onRetry={() => profileQuery.refetch()} />
          </View>
        </ScreenContent>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell>
      <ScreenHeader style={styles.header}>
        <View style={styles.headerRow}>
          <Pressable
            accessibilityLabel="Retour au profil"
            accessibilityRole="button"
            onPress={() => navigation.navigate('Profile')}
            style={({ pressed }) => [styles.headerBackButton, pressed ? styles.headerBackButtonPressed : undefined]}
          >
            <Ionicons color={colors.text.primary} name="arrow-back" size={sizes.icon.md} />
          </Pressable>

          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>Détails personnels</Text>
          </View>

          <View style={styles.headerSpacer} />
        </View>
      </ScreenHeader>

      <ScreenContent contentContainerStyle={styles.contentContainer}>
        <Section>
          <View style={styles.card}>
            <Field label="Prenom" onChangeText={setFirstname} value={firstname} />
            <Field label="Nom" onChangeText={setLastname} value={lastname} />
            <Field autoCapitalize="none" keyboardType="email-address" label="E-mail" onChangeText={setEmail} value={email} />
            <Field keyboardType="phone-pad" label="Telephone" onChangeText={setPhone} value={phone} />

            {errorMessage ? <ErrorBanner message={errorMessage} /> : null}
            {successMessage ? <Text style={styles.successText}>{successMessage}</Text> : null}

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Enregistrer les modifications du profil"
              accessibilityState={{ disabled: updateMutation.isPending }}
              disabled={updateMutation.isPending}
              onPress={onSave}
              style={({ pressed }) => [
                styles.saveButton,
                pressed ? styles.saveButtonPressed : undefined,
                updateMutation.isPending ? styles.saveButtonDisabled : undefined,
              ]}
            >
              <Text style={styles.saveButtonText}>
                {updateMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
              </Text>
            </Pressable>
          </View>
        </Section>
      </ScreenContent>
    </ScreenShell>
  );
};

const Field = ({
  label,
  value,
  onChangeText,
  keyboardType,
  autoCapitalize,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
}) => (
  <View style={styles.fieldWrap}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <TextInput
      autoCapitalize={autoCapitalize}
      keyboardType={keyboardType}
      onChangeText={onChangeText}
      placeholder={label}
      placeholderTextColor={colors.text.tertiary}
      style={styles.input}
      value={value}
    />
  </View>
);

const styles = StyleSheet.create({
  errorState: {
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: 'center',
    ...patterns.screenPadding,
    paddingVertical: spacing.lg,
  },
  header: {
    ...patterns.headerShell,
    borderBottomLeftRadius: radii.card,
    borderBottomRightRadius: radii.card,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  headerBackButton: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.full,
    borderWidth: 1,
    height: sizes.touch.sm,
    justifyContent: 'center',
    width: sizes.touch.sm,
  },
  headerBackButtonPressed: {
    backgroundColor: colors.state.surfacePressed,
    transform: [{ scale: 0.98 }],
  },
  headerTitleWrap: {
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    ...typography.titleMD,
    color: colors.text.primary,
    fontWeight: '700',
  },
  headerSpacer: {
    width: sizes.touch.sm,
  },
  contentContainer: {
    paddingBottom: spacing.xxxl,
    ...patterns.screenPadding,
    paddingTop: spacing.xl,
  },
  card: {
    ...patterns.card,
  },
  fieldWrap: {
    marginBottom: spacing.lg,
  },
  fieldLabel: {
    ...typography.bodySM,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  input: {
    ...patterns.inputField,
    ...typography.bodyMD,
    color: colors.text.primary,
    minHeight: sizes.input.height,
  },
  successText: {
    ...typography.bodySM,
    color: colors.success.DEFAULT,
    marginTop: spacing.xs,
  },
  saveButton: {
    ...patterns.ctaPrimary,
    marginTop: spacing.md,
  },
  saveButtonPressed: {
    ...patterns.ctaPrimaryPressed,
  },
  saveButtonDisabled: {
    ...patterns.ctaPrimaryDisabled,
  },
  saveButtonText: {
    ...typography.labelMD,
    color: colors.text.onPrimary,
  },
});
