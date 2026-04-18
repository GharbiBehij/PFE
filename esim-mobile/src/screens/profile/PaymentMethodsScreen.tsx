import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ScreenContent, ScreenHeader, ScreenShell, Section } from '../../components/layout';
import type { ProfileStackParamList } from '../../navigation/types';
import { colors, patterns, radii, sizes, spacing, typography } from '../../theme';

type Props = NativeStackScreenProps<ProfileStackParamList, 'PaymentMethods'>;

export const PaymentMethodsScreen = ({ navigation }: Props) => {
  const methods = [
    {
      icon: 'card-outline' as const,
      subtitle: 'Ajoutez et gerez vos cartes de paiement securisees.',
      title: 'Carte bancaire',
    },
    {
      icon: 'phone-portrait-outline' as const,
      subtitle: 'Paiement mobile rapide pour les appareils compatibles.',
      title: 'D17',
    },
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
            <Text style={styles.headerTitle}>Moyens de paiement</Text>
          </View>

          <View style={styles.headerSpacer} />
        </View>
      </ScreenHeader>

      <ScreenContent contentContainerStyle={styles.contentContainer}>
        <Section>
          <Text style={styles.sectionLabel}>
            Methodes disponibles
          </Text>

          {methods.map((method, index) => (
            <View key={method.title} style={[styles.methodCard, index !== methods.length - 1 ? styles.methodGap : undefined]}>
              <View style={styles.iconWrap}>
                <Ionicons color={colors.primary.DEFAULT} name={method.icon} size={sizes.icon.sm} />
              </View>

              <View style={styles.content}>
                <Text style={styles.methodTitle}>{method.title}</Text>
                <Text style={styles.methodSubtitle}>{method.subtitle}</Text>
              </View>
            </View>
          ))}
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
  sectionLabel: {
    ...typography.overline,
    color: colors.text.tertiary,
    marginBottom: spacing.sm,
  },
  methodCard: {
    ...patterns.card,
    alignItems: 'center',
    flexDirection: 'row',
  },
  methodGap: {
    marginBottom: spacing.md,
  },
  iconWrap: {
    alignItems: 'center',
    backgroundColor: colors.primary[100],
    borderRadius: radii.lg,
    height: sizes.touch.sm,
    justifyContent: 'center',
    marginRight: spacing.md,
    width: sizes.touch.sm,
  },
  content: {
    flex: 1,
  },
  methodTitle: {
    ...typography.labelLG,
    color: colors.text.primary,
  },
  methodSubtitle: {
    ...typography.bodySM,
    color: colors.text.secondary,
  },
});
