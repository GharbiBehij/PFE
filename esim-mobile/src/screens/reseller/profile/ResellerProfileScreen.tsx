import { Ionicons } from '@expo/vector-icons';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import {
  Alert,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ScreenContent, ScreenHeader, ScreenShell } from '../../../components/layout';
import { LoadingOverlay } from '../../../components/LoadingOverlay';
import { useAuth } from '../../../hooks/client/useAuth';
import { colors, patterns, radii, shadows, sizes, spacing, typography } from '../../../theme';

const SUPPORT_EMAIL = 'support@netyfly.com';
const SUPPORT_PHONE = '+216 00 000 000';

export const ResellerProfileScreen = () => {
  const tabBarHeight = useBottomTabBarHeight();
  const { user, logout, isLoading: authLoading } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: async () => { await logout(); },
        },
      ],
    );
  };

  const handleContactEmail = () => {
    Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=Support NetyFly`);
  };

  const handleContactPhone = () => {
    Linking.openURL(`tel:${SUPPORT_PHONE}`);
  };

  if (authLoading) {
    return <LoadingOverlay message="Chargement..." />;
  }

  const fullName = `${user?.firstname ?? ''} ${user?.lastname ?? ''}`.trim();
  const initials = fullName
    .split(' ')
    .map((n) => n.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');

  return (
    <ScreenShell>
      {/* 🔹 HEADER — matches HomeScreen pattern */}
      <ScreenHeader style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.greetingBlock}>
            <Text style={styles.greetingSub}>Mon compte</Text>
            <Text numberOfLines={1} style={styles.headerTitle}>{fullName || 'Revendeur'}</Text>
          </View>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitials}>{initials || 'R'}</Text>
          </View>
        </View>
      </ScreenHeader>

      <ScreenContent
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: tabBarHeight + spacing.xxxl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* 🔹 PROFILE CARD — matches HomeScreen promoStrip pattern */}
        <View style={styles.promoSection}>
          <View style={styles.promoStrip}>
            <View style={styles.promoIcon}>
              <Ionicons name="person-outline" size={sizes.icon.md} color={colors.primary.DEFAULT} />
            </View>
            <View style={styles.promoText}>
              <Text style={styles.promoLabel}>{user?.email ?? '-'}</Text>
              <View style={styles.roleBadge}>
                <Ionicons color={colors.secondary[600]} name="briefcase-outline" size={sizes.icon.xs} />
                <Text style={styles.roleBadgeText}>Revendeur</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.pagePadding}>
          {/* Support */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Support</Text>
          </View>

          <View style={styles.menuCard}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleContactEmail}
              style={styles.menuItem}
            >
              <View style={[styles.menuIconWrap, styles.menuIconInfo]}>
                <Ionicons
                  color={colors.info.DEFAULT}
                  name="mail-outline"
                  size={sizes.icon.sm}
                />
              </View>
              <View style={styles.menuItemText}>
                <Text style={styles.menuItemLabel}>Contacter par email</Text>
                <Text style={styles.menuItemSub}>{SUPPORT_EMAIL}</Text>
              </View>
              <Ionicons
                color={colors.text.tertiary}
                name="chevron-forward"
                size={sizes.icon.sm}
              />
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleContactPhone}
              style={styles.menuItem}
            >
              <View style={[styles.menuIconWrap, styles.menuIconSuccess]}>
                <Ionicons
                  color={colors.success.DEFAULT}
                  name="call-outline"
                  size={sizes.icon.sm}
                />
              </View>
              <View style={styles.menuItemText}>
                <Text style={styles.menuItemLabel}>Appeler le support</Text>
                <Text style={styles.menuItemSub}>{SUPPORT_PHONE}</Text>
              </View>
              <Ionicons
                color={colors.text.tertiary}
                name="chevron-forward"
                size={sizes.icon.sm}
              />
            </TouchableOpacity>
          </View>

          {/* Account */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Compte</Text>
          </View>

          <View style={styles.menuCard}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleLogout}
              style={styles.menuItem}
            >
              <View style={[styles.menuIconWrap, styles.menuIconError]}>
                <Ionicons
                  color={colors.error.DEFAULT}
                  name="log-out-outline"
                  size={sizes.icon.sm}
                />
              </View>
              <View style={styles.menuItemText}>
                <Text style={[styles.menuItemLabel, styles.menuItemLabelError]}>
                  Se déconnecter
                </Text>
                <Text style={styles.menuItemSub}>
                  Retourner à l'onboarding
                </Text>
              </View>
              <Ionicons
                color={colors.error.DEFAULT}
                name="chevron-forward"
                size={sizes.icon.sm}
              />
            </TouchableOpacity>
          </View>

          <Text style={styles.versionText}>NetyFly v1.0.0</Text>

        </View>
      </ScreenContent>
    </ScreenShell>
  );
};

const styles = StyleSheet.create({
  /* ── HEADER — mirrors HomeScreen ── */
  header: {
    ...patterns.headerShell,
    borderBottomLeftRadius: radii.card,
    borderBottomRightRadius: radii.card,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greetingBlock: {
    flex: 1,
    marginRight: spacing.md,
  },
  greetingSub: {
    ...typography.bodySM,
    color: colors.text.secondary,
    fontWeight: '500',
    marginBottom: 2,
  },
  headerTitle: {
    ...typography.titleLG,
    color: colors.text.primary,
  },
  avatarCircle: {
    height: sizes.touch.sm,
    width: sizes.touch.sm,
    borderRadius: radii.full,
    backgroundColor: colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.medium,
  },
  avatarInitials: {
    ...typography.labelSM,
    color: colors.primary.DEFAULT,
    fontWeight: '800',
  },

  /* ── PROFILE PROMO STRIP — mirrors HomeScreen promoStrip ── */
  promoSection: {
    marginTop: spacing.lg,
    ...patterns.screenPadding,
  },
  promoStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.card,
    padding: spacing.md,
    ...shadows.medium,
  },
  promoIcon: {
    width: 36,
    height: 36,
    borderRadius: radii.sm,
    backgroundColor: colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  promoText: {
    flex: 1,
    minWidth: 0,
  },
  promoLabel: {
    ...typography.bodySM,
    color: colors.text.secondary,
  },
  roleBadge: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.secondary[100],
    borderRadius: radii.full,
    flexDirection: 'row',
    gap: spacing.xxs,
    marginTop: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
  },
  roleBadgeText: {
    ...typography.labelSM,
    color: colors.secondary[600],
    fontWeight: '700',
  },

  contentContainer: {
    paddingTop: spacing.lg,
  },
  pagePadding: {
    ...patterns.screenPadding,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xl,
    marginTop: -spacing.xl,
  },
  statCard: {
    ...patterns.card,
    alignItems: 'center',
    borderTopWidth: 3,
    flex: 1,
    padding: spacing.md,
  },
  statCardWallet: { borderTopColor: colors.primary.DEFAULT },
  statCardSales: { borderTopColor: colors.success.DEFAULT },
  statCardCustomers: { borderTopColor: colors.info.DEFAULT },
  statIconWrap: {
    alignItems: 'center',
    backgroundColor: colors.primary[100],
    borderRadius: radii.md,
    height: sizes.touch.sm,
    justifyContent: 'center',
    marginBottom: spacing.sm,
    width: sizes.touch.sm,
  },
  statIconSuccess: { backgroundColor: colors.success[100] },
  statIconInfo: { backgroundColor: colors.info[100] },
  statLabel: {
    ...typography.labelSM,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  statValue: {
    ...typography.titleSM,
    color: colors.text.primary,
    fontWeight: '700',
    marginTop: spacing.xxs,
    textAlign: 'center',
  },
  sectionHeader: {
    marginBottom: spacing.sm,
    marginTop: spacing.lg,
  },
  sectionTitle: {
    ...typography.overline,
    color: colors.text.secondary,
  },
  menuCard: {
    ...patterns.card,
    overflow: 'hidden',
    padding: spacing[0],
  },
  menuItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: sizes.touch.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  menuDivider: {
    backgroundColor: colors.divider,
    height: 1,
    marginLeft: spacing.md + sizes.touch.sm + spacing.md,
  },
  menuIconWrap: {
    alignItems: 'center',
    backgroundColor: colors.primary[100],
    borderRadius: radii.md,
    height: sizes.touch.sm,
    justifyContent: 'center',
    width: sizes.touch.sm,
  },
  menuIconInfo: { backgroundColor: colors.info[100] },
  menuIconSuccess: { backgroundColor: colors.success[100] },
  menuIconError: { backgroundColor: colors.error[50] },
  menuItemText: { flex: 1 },
  menuItemLabel: {
    ...typography.bodyMD,
    color: colors.text.primary,
    fontWeight: '600',
  },
  menuItemLabelError: { color: colors.error.DEFAULT },
  menuItemSub: {
    ...typography.bodySM,
    color: colors.text.secondary,
    marginTop: spacing.xxs,
  },
  versionText: {
    ...typography.bodySM,
    color: colors.text.tertiary,
    marginTop: spacing.xxl,
    textAlign: 'center',
  },
});
