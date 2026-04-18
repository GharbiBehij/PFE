import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ScreenContent, ScreenHeader, ScreenShell, Section } from '../../components/layout';
import type { ProfileStackParamList } from '../../navigation/types';
import { colors, patterns, radii, sizes, spacing, typography } from '../../theme';

type Props = NativeStackScreenProps<ProfileStackParamList, 'HelpCenter'>;

export const HelpCenterScreen = ({ navigation }: Props) => {
  const steps = [
    "Consultez la FAQ integree de l'application.",
    'Contactez le support: support@netyfly.com.',
    'Partagez votre ID de transaction pour une resolution rapide.',
  ];

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
            <Text style={styles.headerTitle}>Centre d'aide</Text>
          </View>

          <View style={styles.headerSpacer} />
        </View>
      </ScreenHeader>

      <ScreenContent contentContainerStyle={styles.contentContainer}>
        <Section>
          <View style={styles.banner}>
            <Text style={styles.bannerTitle}>
              Besoin d'aide ?
            </Text>
            <Text style={styles.bannerBody}>
              Notre equipe est disponible pour vous aider a activer et gerer vos eSIMs.
            </Text>
          </View>

          <View style={styles.card}>
            {steps.map((step, index) => (
              <View key={step} style={[styles.stepRow, index !== steps.length - 1 ? styles.stepGap : undefined]}>
                <Text style={styles.stepIndex}>{index + 1}.</Text>
                <Text style={styles.stepText}>{step}</Text>
              </View>
            ))}
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
    ...patterns.screenPadding,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  banner: {
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[100],
    borderRadius: radii.xl,
    borderWidth: 1,
    marginBottom: spacing.md,
    padding: spacing.xl,
  },
  bannerTitle: {
    ...typography.titleSM,
    color: colors.primary[700],
    marginBottom: spacing.xs,
  },
  bannerBody: {
    ...typography.bodySM,
    color: colors.primary.DEFAULT,
  },
  card: {
    ...patterns.card,
  },
  stepRow: {
    flexDirection: 'row',
  },
  stepGap: {
    marginBottom: spacing.md,
  },
  stepIndex: {
    ...typography.bodyMD,
    color: colors.primary.DEFAULT,
    fontWeight: '700',
    marginRight: spacing.xs,
  },
  stepText: {
    ...typography.bodyMD,
    color: colors.text.secondary,
    flex: 1,
  },
});
