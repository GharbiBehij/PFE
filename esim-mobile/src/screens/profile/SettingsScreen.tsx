import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { ErrorBanner } from '../../components/ErrorBanner';
import { ScreenContent, ScreenHeader, ScreenShell, Section } from '../../components/layout';
import { useChangePassword } from '../../hooks/useProfile';
import type { ProfileStackParamList } from '../../navigation/types';
import { colors, patterns, radii, shadows, sizes, spacing, typography } from '../../theme';

type Props = NativeStackScreenProps<ProfileStackParamList, 'Settings'>;

export const SettingsScreen = ({ navigation }: Props) => {
  const changePasswordMutation = useChangePassword();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [success, setSuccess] = useState('');
  const [errors, setErrors] = useState({ currentPassword: '', newPassword: '' });

  const onSubmit = async () => {
    if (!currentPassword || !newPassword) {
      return;
    }

    try {
      await changePasswordMutation.mutateAsync({
        currentPassword,
        newPassword,
      });
      setSuccess('Mot de passe modifié avec succès.');
      setCurrentPassword('');
      setNewPassword('');
    } catch {
      setErrors({ currentPassword: 'Mot de passe actuel incorrect.', newPassword: '' });
      setSuccess('');
    }
  };

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
            <Text style={styles.headerTitle}>Paramètres</Text>
          </View>

          <View style={styles.headerSpacer} />
        </View>
      </ScreenHeader>

      <ScreenContent contentContainerStyle={styles.contentContainer}>
        <Section>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Sécurité du compte</Text>

            <Text style={styles.fieldLabel}>Mot de passe actuel</Text>
            <TextInput
              onChangeText={setCurrentPassword}
              secureTextEntry
              style={[styles.input, styles.inputGap]}
              value={currentPassword}
            />

            <Text style={styles.fieldLabel}>Nouveau mot de passe</Text>
            <TextInput
              onChangeText={setNewPassword}
              secureTextEntry
              style={styles.input}
              value={newPassword}
            />

            {changePasswordMutation.isError ? <ErrorBanner message="Impossible de changer le mot de passe." /> : null}
            {success ? <Text style={styles.successText}>{success}</Text> : null}
            {errors.currentPassword ? <Text style={styles.errorText}>{errors.currentPassword}</Text> : null}
            {errors.newPassword ? <Text style={styles.errorText}>{errors.newPassword}</Text> : null}

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Mettre à jour le mot de passe"
              accessibilityState={{ disabled: changePasswordMutation.isPending }}
              disabled={changePasswordMutation.isPending}
              onPress={onSubmit}
              style={({ pressed }) => [
                styles.submitButton,
                pressed ? styles.submitButtonPressed : undefined,
                changePasswordMutation.isPending ? styles.submitButtonDisabled : undefined,
              ]}
            >
              <Text style={styles.submitButtonText}>
                {changePasswordMutation.isPending ? 'Mise à jour...' : 'Mettre à jour le mot de passe'}
              </Text>
            </Pressable>
          </View>
        </Section>

        <Section>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Préférences</Text>
            <View style={styles.preferenceRow}>
              <View>
                <Text style={styles.preferenceTitle}>Notifications push</Text>
                <Text style={styles.preferenceSubtitle}>Recevoir les mises à jour de consommation</Text>
              </View>
              <Switch
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: colors.gray[300], true: colors.primary[300] }}
                thumbColor={notificationsEnabled ? colors.primary.DEFAULT : colors.surface}
                value={notificationsEnabled}
              />
            </View>
          </View>
        </Section>
      </ScreenContent>
    </ScreenShell>
  );
};

const styles = StyleSheet.create({
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
  cardTitle: {
    ...typography.titleSM,
    color: colors.text.primary,
    marginBottom: spacing.md,
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
    paddingVertical: spacing.md,
  },
  inputGap: {
    marginBottom: spacing.md,
  },
  successText: {
    ...typography.bodySM,
    color: colors.success.DEFAULT,
    marginTop: spacing.xs,
  },
  errorText: {
    ...typography.bodySM,
    color: colors.error.DEFAULT,
    marginTop: spacing.xs,
  },
  submitButton: {
    ...patterns.ctaPrimary,
    marginTop: spacing.xl,
  },
  submitButtonPressed: {
    ...patterns.ctaPrimaryPressed,
  },
  submitButtonDisabled: {
    ...patterns.ctaPrimaryDisabled,
  },
  submitButtonText: {
    ...typography.labelMD,
    color: colors.text.onPrimary,
  },
  preferenceRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  preferenceTitle: {
    ...typography.labelMD,
    color: colors.text.primary,
  },
  preferenceSubtitle: {
    ...typography.bodySM,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
});
