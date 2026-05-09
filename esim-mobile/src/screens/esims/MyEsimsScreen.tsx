import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { EsimCard } from '../../components/Cards/EsimCard';
import { RechargeBottomSheet } from '../../components/RechargeBottomSheet';
import { ScreenContent, ScreenHeader, ScreenShell } from '../../components/layout';
import { useAuth } from '../../hooks/client/useAuth';
import { useUserEsims } from '../../hooks/client/useEsims';
import { navigateTo } from '../../navigation/navigationRef';
import type { EsimsStackParamList } from '../../navigation/types';
import { Animation, colors, patterns, radii, shadows, sizes, spacing, typography } from '../../theme';
import type { Esim } from '../../types/esim';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = NativeStackScreenProps<EsimsStackParamList, 'MyEsims'>;

type TabKey = 'ACTIVE' | 'HISTORY';

const activeStatuses = new Set(['ACTIVE', 'NOT_ACTIVE']);

export const MyEsimsScreen = ({ navigation }: Props) => {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [selectedTab, setSelectedTab] = useState<TabKey>('ACTIVE');
  const [rechargeEsim, setRechargeEsim] = useState<Esim | null>(null);
  const esimsQuery = useUserEsims(true);
  const allEsims = Array.isArray(esimsQuery.data) ? esimsQuery.data : [];

  useFocusEffect(
    useCallback(() => {
      void esimsQuery.refetch();
    }, [esimsQuery.refetch]),
  );

  const activeCount = allEsims.filter((item) => activeStatuses.has(item.status)).length;
  const historyCount = allEsims.length - activeCount;

  const handleTabChange = useCallback(
    (nextTab: TabKey) => {
      if (nextTab === selectedTab) return;
      setSelectedTab(nextTab);
    },
    [selectedTab],
  );

  const filteredEsims = useMemo(() => {
    return allEsims.filter((item) => {
      if (selectedTab === 'ACTIVE') {
        return activeStatuses.has(item.status);
      }
      return !activeStatuses.has(item.status);
    });
  }, [allEsims, selectedTab]);

  // ── Guest view ─────────────────────────────────────────────────────
  if (!user) {
    return (
      <ScreenShell>
        {/* Plain header — no gradient */}
        <ScreenHeader style={styles.header}>
          <Text style={styles.headerTitle}>Mes eSIMs</Text>
        </ScreenHeader>

        {/* Free-floating centered content — NO card wrapper */}
        <View style={styles.guestRoot}>
          <Ionicons
            name="globe-outline"
            size={80}
            color={colors.primary.DEFAULT}
            style={styles.guestIcon}
          />

          <Text style={styles.guestTitle}>
            Vos eSIMs apparaîtront ici
          </Text>

          <Text style={styles.guestSubtitle}>
            Connectez-vous pour accéder à vos eSIMs
            et suivre votre consommation de données.
          </Text>

          <Pressable
            onPress={() => navigateTo('Login', { source: 'app' })}
            style={({ pressed }) => [
              styles.guestLoginButton,
              pressed && styles.guestLoginButtonPressed,
            ]}
          >
            <Text style={styles.guestLoginButtonText}>
              Se connecter
            </Text>
          </Pressable>

          <Pressable
            onPress={() => navigateTo('Register', { source: 'app' })}
            style={styles.guestRegisterLink}
          >
            <Text style={styles.guestRegisterText}>
              Pas encore de compte ?{' '}
              <Text style={styles.guestRegisterAccent}>
                Créer un compte
              </Text>
            </Text>
          </Pressable>
        </View>
      </ScreenShell>
    );
  }
  // ── Authenticated view — entirely unchanged below ──────────────────

  const renderItem = ({ index, item }: { index: number; item: Esim }) => (
    <Animated.View
      entering={FadeInDown.delay(index * (Animation.duration.fast / 3)).duration(Animation.duration.normal)}
    >
      <EsimCard
        esim={item}
        onPress={() => navigation.navigate('EsimDetail', { esimId: item.id })}
        onRecharge={
          item.status === 'ACTIVE'
            ? () => setRechargeEsim(item)
            : undefined
        }
      />
    </Animated.View>
  );

  const renderEmpty = () => {
    if (esimsQuery.isLoading) {
      return (
        <View style={styles.stateCard}>
          <ActivityIndicator color={colors.primary.DEFAULT} size="large" />
        </View>
      );
    }

    if (esimsQuery.isError) {
      return (
        <View style={styles.stateCard}>
          <Ionicons color={colors.error.DEFAULT} name="alert-circle-outline" size={sizes.touch.sm} />
          <Text style={styles.stateTitle}>Impossible de charger vos eSIMs</Text>
          <Pressable
            onPress={() => esimsQuery.refetch()}
            style={({ pressed }) => [styles.retryButton, pressed ? styles.retryButtonPressed : undefined]}
          >
            <Text style={styles.retryText}>Réessayer</Text>
          </Pressable>
        </View>
      );
    }

    if (selectedTab === 'HISTORY') {
      return (
        <View style={styles.stateCard}>
          <View style={styles.stateIconCircle}>
            <Ionicons color={colors.text.tertiary} name="time-outline" size={sizes.icon.lg} />
          </View>
          <Text style={styles.stateTitle}>Aucun historique</Text>
          <Text style={styles.stateSubtitle}>Vos eSIMs expirées apparaîtront ici.</Text>
        </View>
      );
    }

    return (
      <View style={styles.stateCard}>
        <View style={styles.stateIconCircle}>
          <Ionicons color={colors.text.tertiary} name="planet-outline" size={sizes.icon.lg} />
        </View>
        <Text style={styles.stateTitle}>Aucune eSIM active</Text>
        <Pressable
          onPress={() => navigation.getParent()?.navigate('HomeTab' as never)}
          style={({ pressed }) => [styles.retryButton, pressed ? styles.retryButtonPressed : undefined]}
        >
          <Text style={styles.retryText}>Parcourir les offres</Text>
        </Pressable>
      </View>
    );
  };

  return (
    <ScreenShell>
      <LinearGradient
        colors={[colors.primary.dark, colors.primary.DEFAULT]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.gradientHeader, { paddingTop: insets.top + spacing.xs }]}
      >
        <View style={styles.headerTopRow}>
          <View>
            <Text style={styles.headerGreeting}>Bonjour 👋</Text>
            <Text style={styles.headerName}>Mes eSIMs</Text>
          </View>
          <Pressable style={styles.bellButton}>
            <Ionicons name="notifications-outline" size={sizes.icon.md} color="white" />
            <View style={styles.bellBadge} />
          </Pressable>
        </View>

        <View style={styles.summaryCard}>
          <View>
            <Text style={styles.summaryLabel}>eSIMs actives</Text>
            <Text style={styles.summaryValue}>{activeCount}</Text>
          </View>
          <Pressable
            onPress={() => navigation.getParent()?.navigate('HomeTab' as never)}
            style={styles.browseButton}
          >
            <Text style={styles.browseButtonText}>+ Acheter</Text>
          </Pressable>
        </View>
      </LinearGradient>

      <ScreenContent scrollable={false}>
        {/* Segmented control — below header in content area */}
        <View style={styles.tabSelectorContainer}>
          <Pressable
            accessibilityLabel="Afficher les eSIMs actives"
            accessibilityRole="button"
            accessibilityState={{ selected: selectedTab === 'ACTIVE' }}
            onPress={() => handleTabChange('ACTIVE')}
            style={[styles.tabOption, selectedTab === 'ACTIVE' && styles.tabOptionActive]}
          >
            <Text style={[styles.tabText, selectedTab === 'ACTIVE' && styles.tabTextActive]}>
              Actif ({activeCount})
            </Text>
          </Pressable>
          <Pressable
            accessibilityLabel="Afficher l'historique des eSIMs"
            accessibilityRole="button"
            accessibilityState={{ selected: selectedTab === 'HISTORY' }}
            onPress={() => handleTabChange('HISTORY')}
            style={[styles.tabOption, selectedTab === 'HISTORY' && styles.tabOptionActive]}
          >
            <Text style={[styles.tabText, selectedTab === 'HISTORY' && styles.tabTextActive]}>
              Historique ({historyCount})
            </Text>
          </Pressable>
        </View>

        <FlatList
          contentContainerStyle={styles.listContent}
          data={esimsQuery.isError || esimsQuery.isLoading ? [] : filteredEsims}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={renderEmpty}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
        />
      </ScreenContent>

      <RechargeBottomSheet
        esim={rechargeEsim}
        visible={!!rechargeEsim}
        onClose={() => setRechargeEsim(null)}
      />
    </ScreenShell>
  );
};

const styles = StyleSheet.create({
  /* ── gradient header ── */
  gradientHeader: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    gap: spacing.md,
    borderBottomLeftRadius: radii.xl,
    borderBottomRightRadius: radii.xl,
    overflow: 'hidden',
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerGreeting: {
    ...typography.bodySM,
    color: 'rgba(255,255,255,0.65)',
    fontWeight: '500',
  },
  headerName: {
    ...typography.titleSM,
    color: colors.text.onPrimary,
    fontWeight: '800',
  },
  bellButton: {
    width: sizes.touch.sm,
    height: sizes.touch.sm,
    borderRadius: radii.full,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  bellBadge: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 7,
    height: 7,
    borderRadius: radii.full,
    backgroundColor: colors.secondary.DEFAULT,
    borderWidth: 1.5,
    borderColor: colors.primary.DEFAULT,
  },
  summaryCard: {
    backgroundColor: 'rgba(255,255,255,0.13)',
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    padding: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    ...typography.bodySM,
    color: 'rgba(255,255,255,0.65)',
    fontWeight: '600',
  },
  summaryValue: {
    ...typography.titleMD,
    color: colors.text.onPrimary,
    fontWeight: '800',
    marginTop: spacing.xs,
  },
  browseButton: {
    backgroundColor: colors.secondary.DEFAULT,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...shadows.medium,
  },
  browseButtonText: {
    ...typography.labelSM,
    color: colors.text.onSecondary,
    fontWeight: '800',
  },

  /* ── segmented tab (in content area) ── */
  tabSelectorContainer: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radii.full,
    borderWidth: 1,
    flexDirection: 'row',
    marginHorizontal: spacing.xl,
    marginTop: spacing.md,
    marginBottom: spacing.md,
    padding: 3,
    ...shadows.low,
  },
  tabOption: {
    alignItems: 'center',
    borderRadius: radii.full,
    flex: 1,
    justifyContent: 'center',
    paddingVertical: spacing.sm,
  },
  tabOptionActive: {
    backgroundColor: colors.surface,
    ...shadows.medium,
  },
  tabText: {
    ...typography.labelSM,
    color: colors.text.secondary,
  },
  tabTextActive: {
    color: colors.primary.DEFAULT,
    fontWeight: '700',
  },

  /* ── empty states ── */
  stateCard: {
    ...patterns.card,
    alignItems: 'center',
    marginTop: spacing.xl,
    paddingVertical: spacing.xl,
    gap: spacing.sm,
  },
  stateIconCircle: {
    width: 40,
    height: 40,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stateTitle: {
    ...typography.labelMD,
    color: colors.text.secondary,
  },
  stateSubtitle: {
    ...typography.bodyXS,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: colors.primary.DEFAULT,
    borderRadius: radii.md,
    marginTop: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  retryButtonPressed: {
    backgroundColor: colors.primary.dark,
    transform: [{ scale: 0.98 }],
    ...shadows.low,
  },
  retryText: {
    ...typography.labelSM,
    color: colors.text.onPrimary,
  },

  /* ── list ── */
  listContent: {
    flexGrow: 1,
    paddingBottom: spacing.xxl,
    ...patterns.screenPadding,
  },

  /* ── guest plain header ── */
  header: {
    borderBottomLeftRadius: radii.xl,
    borderBottomRightRadius: radii.xl,
  },
  headerTitle: {
    ...typography.titleSM,
    color: colors.text.primary,
    fontWeight: '800',
  },

  /* ── guest free-floating content ── */
  guestRoot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
    gap: spacing.lg,
    backgroundColor: colors.background,
  },
  guestIcon: {
    marginBottom: spacing.md,
    opacity: 0.85,
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
    paddingHorizontal: spacing.md,
  },
  guestLoginButton: {
    backgroundColor: colors.primary.DEFAULT,
    borderRadius: radii.lg,
    paddingVertical: spacing.lg,
    width: '100%',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  guestLoginButtonPressed: {
    backgroundColor: colors.primary.dark,
    transform: [{ scale: 0.98 }],
  },
  guestLoginButtonText: {
    ...typography.labelLG,
    color: colors.white,
    fontWeight: '700',
  },
  guestRegisterLink: {
    paddingVertical: spacing.sm,
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
});
