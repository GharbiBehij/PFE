import { Ionicons } from '@expo/vector-icons';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenContent, ScreenHeader, ScreenShell, Section } from '../../components/layout';
import { useAuth } from '../../hooks/useAuth';
import type { ProfileStackParamList } from '../../navigation/types';
import { colors, patterns, radii, sizes, spacing, typography } from '../../theme';

type Props = NativeStackScreenProps<ProfileStackParamList, 'Profile'>;

export const ProfileScreen = ({ navigation }: Props) => {
  const { user, logout } = useAuth();
  const tabBarHeight = useBottomTabBarHeight();

  const initials = `${user?.firstname?.[0] ?? ''}${user?.lastname?.[0] ?? ''}`.toUpperCase();

  return (
    <ScreenShell>
      <ScreenHeader style={styles.header}>
        <Text style={styles.headerTitle}>Profil</Text>
      </ScreenHeader>

      <ScreenContent contentContainerStyle={[styles.content, { paddingBottom: tabBarHeight + spacing.xl }]}>
        <Section>
          <View style={styles.profileCard}>
            <View style={styles.profileRow}>
              <View style={styles.avatarWrap}>
                <Text style={styles.avatarText}>
                  {initials || 'U'}
                </Text>
              </View>
              <View style={styles.profileTextWrap}>
                <Text style={styles.profileName}>
                  {`${user?.firstname ?? ''} ${user?.lastname ?? ''}`.trim() || 'Utilisateur'}
                </Text>
                <Text style={styles.profileEmail}>
                  {user?.email ?? '-'}
                </Text>
              </View>
            </View>
          </View>
        </Section>

        <Section>
          <Text style={styles.sectionCaption}>
            Compte
          </Text>
          <View style={styles.sectionCard}>
            <MenuItem icon="person-outline" label="Détails personnels" onPress={() => navigation.navigate('PersonalDetails')} />
            <View style={styles.divider} />
            <MenuItem icon="card-outline" label="Moyens de paiement" onPress={() => navigation.navigate('PaymentMethods')} />
            <View style={styles.divider} />
            <MenuItem icon="settings-outline" label="Paramètres" onPress={() => navigation.navigate('Settings')} />
            {user?.role === 'SALESMAN' ? (
              <>
                <View style={styles.divider} />
                <MenuItem icon="wallet-outline" label="Portefeuille" onPress={() => navigation.navigate('Wallet')} />
              </>
            ) : null}
          </View>
        </Section>

        <Section>
          <Text style={styles.sectionCaption}>
            Support
          </Text>
          <View style={styles.sectionCard}>
            <MenuItem icon="help-circle-outline" label="Centre d'aide" onPress={() => navigation.navigate('HelpCenter')} />
          </View>
        </Section>

        <Section>
          <Pressable onPress={logout} style={({ pressed }) => [styles.logoutButton, pressed ? styles.logoutButtonPressed : undefined]}>
            <View style={styles.logoutRow}>
              <Ionicons color={colors.error.DEFAULT} name="log-out-outline" size={sizes.icon.sm} />
              <Text style={styles.logoutText}>
                Déconnexion
              </Text>
            </View>
          </Pressable>
        </Section>
      </ScreenContent>
    </ScreenShell>
  );
};

const MenuItem = ({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) => (
  <Pressable onPress={onPress} style={({ pressed }) => [styles.menuItem, pressed ? styles.menuItemPressed : undefined]}>
    <View style={styles.menuRow}>
      <View style={styles.menuIconWrap}>
        <Ionicons color={colors.text.secondary} name={icon} size={sizes.icon.sm} />
      </View>
      <Text style={styles.menuLabel}>
        {label}
      </Text>
      <Ionicons color={colors.text.tertiary} name="chevron-forward" size={sizes.icon.sm} />
    </View>
  </Pressable>
);

const styles = StyleSheet.create({
  header: {
    ...patterns.headerShell,
    alignItems: 'center',
    borderBottomLeftRadius: radii.card,
    borderBottomRightRadius: radii.card,
  },
  headerTitle: {
    ...typography.titleMD,
    color: colors.text.primary,
    fontWeight: '700',
  },
  content: {
    paddingTop: spacing.xl,
    ...patterns.screenPadding,
  },
  profileCard: {
    ...patterns.card,
    padding: spacing.lg,
  },
  profileRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  avatarWrap: {
    alignItems: 'center',
    backgroundColor: colors.primary[100],
    borderRadius: radii.full,
    height: sizes.avatar.xl,
    justifyContent: 'center',
    width: sizes.avatar.xl,
  },
  avatarText: {
    ...typography.titleLG,
    color: colors.primary.DEFAULT,
    fontWeight: '700',
  },
  profileTextWrap: {
    flex: 1,
  },
  profileName: {
    ...typography.titleSM,
    color: colors.text.primary,
    fontWeight: '700',
  },
  profileEmail: {
    ...typography.bodySM,
    color: colors.text.secondary,
  },
  sectionCaption: {
    ...typography.overline,
    color: colors.text.tertiary,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  sectionCard: {
    ...patterns.card,
    padding: spacing[0],
  },
  divider: {
    backgroundColor: colors.border,
    height: 1,
    marginHorizontal: spacing.lg,
  },
  menuItem: {
    borderRadius: radii.lg,
  },
  menuRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  menuIconWrap: {
    alignItems: 'center',
    backgroundColor: colors.gray[100],
    borderRadius: radii.md,
    height: sizes.avatar.md,
    justifyContent: 'center',
    width: sizes.avatar.md,
  },
  menuLabel: {
    ...typography.bodyMD,
    color: colors.text.primary,
    flex: 1,
    fontWeight: '600',
  },
  menuItemPressed: {
    backgroundColor: colors.state.hover,
    transform: [{ scale: 0.98 }],
  },
  logoutButton: {
    backgroundColor: colors.surface,
    borderColor: colors.error.DEFAULT,
    borderRadius: radii.lg,
    borderWidth: 1,
    minHeight: sizes.button.minHeight,
    paddingVertical: spacing.md,
    width: '100%',
  },
  logoutRow: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  logoutText: {
    ...typography.labelMD,
    color: colors.error.DEFAULT,
    fontWeight: '700',
  },
  logoutButtonPressed: {
    backgroundColor: colors.borderSubtle,
    transform: [{ scale: 0.98 }],
  },
});
