import { Ionicons } from '@expo/vector-icons';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { PurpleButton } from '../../components/Buttons';
import { ScreenContent, ScreenHeader, ScreenShell, Section } from '../../components/layout';
import { useAuth } from '../../hooks/client/useAuth';
import { navigateTo } from '../../navigation/navigationRef';
import type { ProfileStackParamList } from '../../navigation/types';
import { colors, patterns, radii, sizes, spacing, typography } from '../../theme';

type Props = NativeStackScreenProps<ProfileStackParamList, 'Profile'>;

export const ProfileScreen = ({ navigation }: Props) => {
  const { user, logout } = useAuth();
  const tabBarHeight = useBottomTabBarHeight();

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Se déconnecter', style: 'destructive', onPress: logout },
      ],
    );
  };

  if (!user) {
    return (
      <ScreenShell>
        <ScreenHeader style={styles.header}>
          <Text style={styles.headerTitle}>Profil</Text>
        </ScreenHeader>

        <ScreenContent
          scrollable={false}
          contentContainerStyle={[
            styles.guestContent,
            { paddingBottom: tabBarHeight + spacing.xl },
          ]}
        >
          <View style={styles.guestContainer}>
            <View style={styles.guestIconWrap}>
              <Ionicons
                name="person-circle-outline"
                size={80}
                color={colors.primary.DEFAULT}
              />
            </View>

            <Text style={styles.guestTitle}>
              Connectez-vous à votre compte
            </Text>
            <Text style={styles.guestSubtitle}>
              Gérez vos eSIMs, paiements et paramètres
            </Text>
            <View style={styles.guestCta}>
              <PurpleButton
                icon="log-in-outline"
                label="Se connecter"
                onPress={() => navigateTo('Login', { source: 'app' })}
              />
              <Pressable
                onPress={() => navigateTo('Register', { source: 'app' })}
                style={styles.guestRegisterLink}
              >
                <Text style={styles.guestRegisterText}>
                  Pas encore de compte ?{' '}
                  <Text style={styles.guestRegisterAccent}>Créer un compte</Text>
                </Text>
              </Pressable>
            </View>
            <Pressable
              onPress={() => navigateTo('Onboarding')}
              style={styles.guestIntroLink}
            >
              <Ionicons name="play-circle-outline" size={sizes.icon.sm} color={colors.text.tertiary} />
              <Text style={styles.guestIntroText}>Voir l'introduction</Text>
            </Pressable>
          </View>
        </ScreenContent>
      </ScreenShell>
    );
  }

  const initials = `${user?.firstname?.[0] ?? ''}${user?.lastname?.[0] ?? ''}`.toUpperCase();

  return (
    <ScreenShell>
      <ScreenHeader style={styles.header}>
        <Text style={styles.headerTitle}>Profil</Text>
      </ScreenHeader>

      <ScreenContent
        contentContainerStyle={[styles.content, { paddingBottom: tabBarHeight + spacing.xl }]}
      >
        {/* ── Profile card ── */}
        <Section>
          <View style={styles.profileCard}>
            <View style={styles.profileRow}>
              <View style={styles.avatarWrap}>
                <Text style={styles.avatarText}>{initials || 'U'}</Text>
              </View>
              <View style={styles.profileTextWrap}>
                <Text style={styles.profileName}>
                  {`${user?.firstname ?? ''} ${user?.lastname ?? ''}`.trim() || 'Utilisateur'}
                </Text>
                <Text style={styles.profileEmail}>{user?.email ?? '-'}</Text>
              </View>
            </View>
          </View>
        </Section>

        {/* ── Compte section ── */}
        <Section>
          <Text style={styles.sectionCaption}>Compte</Text>
          <View style={styles.sectionCard}>
            <MenuItem
              icon="person-outline"
              label="Détails personnels"
              onPress={() => navigation.navigate('PersonalDetails')}
            />
            <View style={styles.divider} />
            <MenuItem
              icon="card-outline"
              label="Moyens de paiement"
              onPress={() => navigation.navigate('PaymentMethods')}
            />
            <View style={styles.divider} />
            <MenuItem
              icon="settings-outline"
              label="Paramètres"
              onPress={() => navigation.navigate('Settings')}
            />
            {user?.role === 'SALESMAN' ? (
              <>
                <View style={styles.divider} />
                <MenuItem
                  icon="wallet-outline"
                  label="Portefeuille"
                  onPress={() => navigation.navigate('Wallet')}
                />
              </>
            ) : null}
          </View>
        </Section>

        {/* ── Support section ── */}
        <Section>
          <Text style={styles.sectionCaption}>Support</Text>
          <View style={styles.sectionCard}>
            <MenuItem
              icon="help-circle-outline"
              label="Centre d'aide"
              onPress={() => navigation.navigate('HelpCenter')}
            />
          </View>
        </Section>

        {/* ── Disconnect ── */}
        <Section>
          <View style={styles.sectionCard}>
            <Pressable
              onPress={handleLogout}
              style={({ pressed }) => [
                styles.menuItem,
                pressed && styles.menuItemPressed,
              ]}
            >
              <View style={styles.menuRow}>
                <View style={[styles.menuIconWrap, styles.menuIconError]}>
                  <Ionicons
                    color={colors.error.DEFAULT}
                    name="log-out-outline"
                    size={sizes.icon.sm}
                  />
                </View>
                <View style={styles.menuItemTextBlock}>
                  <Text style={[styles.menuLabel, styles.menuLabelError]}>
                    Se déconnecter
                  </Text>
                  <Text style={styles.menuItemSub}>Retourner à l'accueil</Text>
                </View>
                <Ionicons
                  color={colors.error.DEFAULT}
                  name="chevron-forward"
                  size={sizes.icon.sm}
                />
              </View>
            </Pressable>
          </View>
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
  <Pressable
    onPress={onPress}
    style={({ pressed }) => [styles.menuItem, pressed ? styles.menuItemPressed : undefined]}
  >
    <View style={styles.menuRow}>
      <View style={styles.menuIconWrap}>
        <Ionicons color={colors.primary.DEFAULT} name={icon} size={sizes.icon.sm} />
      </View>
      <Text style={styles.menuLabel}>{label}</Text>
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
  guestContent: {
    flex: 1,
    ...patterns.screenPadding,
  },
  guestContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.lg,
  },
  guestIconWrap: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  guestTitle: {
    ...typography.titleMD,
    color: colors.text.primary,
    fontWeight: '700',
    textAlign: 'center',
  },
  guestSubtitle: {
    ...typography.bodyMD,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  guestCta: {
    alignSelf: 'stretch',
    gap: spacing.md,
  },
  guestRegisterLink: {
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  guestRegisterText: {
    ...typography.bodyMD,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  guestRegisterAccent: {
    color: colors.primary.DEFAULT,
    fontWeight: '700',
  },
  guestIntroLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
  },
  guestIntroText: {
    ...typography.bodySM,
    color: colors.text.tertiary,
  },

  /* ── Profile card ── */
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
  profileTextWrap: { flex: 1 },
  profileName: {
    ...typography.titleSM,
    color: colors.text.primary,
    fontWeight: '700',
  },
  profileEmail: {
    ...typography.bodySM,
    color: colors.text.secondary,
  },

  /* ── Sections ── */
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

  /* ── Menu items ── */
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
    backgroundColor: colors.primary[100],
    borderRadius: radii.md,
    height: sizes.avatar.md,
    justifyContent: 'center',
    width: sizes.avatar.md,
  },
  menuIconError: {
    backgroundColor: colors.error[50],
  },
  menuLabel: {
    ...typography.bodyMD,
    color: colors.text.primary,
    flex: 1,
    fontWeight: '600',
  },
  menuLabelError: {
    color: colors.error.DEFAULT,
  },
  menuItemTextBlock: {
    flex: 1,
  },
  menuItemSub: {
    ...typography.bodySM,
    color: colors.text.secondary,
    marginTop: spacing.xxs,
  },
  menuItemPressed: {
    backgroundColor: colors.state.hover,
    transform: [{ scale: 0.98 }],
  },
});