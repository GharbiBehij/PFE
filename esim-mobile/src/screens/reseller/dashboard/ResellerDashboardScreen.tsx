import { Ionicons } from '@expo/vector-icons';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQueryClient } from '@tanstack/react-query';

import { ErrorBanner } from '../../../components/ErrorBanner';
import { LoadingOverlay } from '../../../components/LoadingOverlay';
import { CountryFlag } from '../../../components/CountryFlag';
import { ScreenContent, ScreenHeader, ScreenShell } from '../../../components/layout';
import { RecentSaleCard } from '../../../components/Cards/RecentSaleCard';
import { PendingActivationCard } from '../../../components/Cards/PendingActivationCard';

import { useDashboardStats } from '../../../hooks/reseller/useDashboardStats';
import { usePendingActivations } from '../../../hooks/reseller/usePendingActivations';
import { useRecentSales } from '../../../hooks/reseller/useRecentSales';
import { useFeaturedOffer } from '../../../hooks/reseller/useFeaturedOffer';
import { useAuth } from '../../../hooks/client/useAuth';
import { useNotificationInbox } from '../../../hooks/client/useNotificationInbox';

import type { ResellerDashboardStackParamList } from '../../../navigation/types';
import {
  colors,
  patterns,
  radii,
  shadows,
  sizes,
  spacing,
  typography,
} from '../../../theme';
import type { Offer } from '../../../types/offer';
import type { PendingActivation } from '../../../types/reseller';
import { formatCurrency } from '../../../utils/formatCurrency';
import { formatDate } from '../../../utils/formatDate';
import { ActionButton } from '../../../components/Buttons';

type Props = NativeStackScreenProps<ResellerDashboardStackParamList, 'Dashboard'>;
type Period = 'today' | 'week' | 'month';

const PERIODS: { key: Period; label: string }[] = [
  { key: 'today', label: 'Auj.' },
  { key: 'week', label: 'Semaine' },
  { key: 'month', label: 'Mois' },
];

export const ResellerDashboardScreen = ({ navigation }: Props) => {
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const statsQuery = useDashboardStats();
  const recentSalesQuery = useRecentSales();
  const pendingActivationsQuery = usePendingActivations();
  const featuredOfferQuery = useFeaturedOffer();
  const { user } = useAuth();
  const inbox = useNotificationInbox();

  useFocusEffect(
    useCallback(() => {
      queryClient.invalidateQueries({ queryKey: ['reseller', 'transactions'] });
      queryClient.invalidateQueries({ queryKey: ['reseller', 'dashboardStats'] });
    }, [queryClient]),
  );

  const [selectedPeriod, setSelectedPeriod] = useState<Period>('today');
  const [showNotifications, setShowNotifications] = useState(false);

  const navigateToActivation = (activation: PendingActivation) => {
    navigation.navigate('ActivateESIM', {
      id: activation.id,
      customer: activation.customer,
      phone: activation.phone,
      country: activation.country,
      package: activation.package,
      amount: formatCurrency(activation.amount),
      purchaseDate: activation.purchaseDate,
    });
  };

  const accountName = useMemo(() => {
    const firstName = user?.firstname ?? '';
    const lastName = user?.lastname ?? '';
    return `${firstName} ${lastName}`.trim() || user?.email?.split('@')[0] || 'Revendeur';
  }, [user]);

  const openSellTab = () => {
    (navigation.getParent() as any)?.navigate('SellTab', { screen: 'Sell' });
  };

  const openTransactionsTab = () => {
    (navigation.getParent() as any)?.navigate('TransactionsTab', { screen: 'Transactions' });
  };

  const openWalletTab = () => {
    (navigation.getParent() as any)?.navigate('WalletTab', { screen: 'Wallet' });
  };


  if (statsQuery.isLoading) {
    return <LoadingOverlay message="Chargement du tableau de bord..." />;
  }

  if (statsQuery.isError || !statsQuery.data) {
    return (
      <ScreenShell>
        <ScreenContent
          contentContainerStyle={styles.errorContentContainer}
          scrollable={false}
        >
          <ErrorBanner
            message="Impossible de charger les statistiques du tableau de bord."
            onRetry={() => statsQuery.refetch()}
          />
        </ScreenContent>
      </ScreenShell>
    );
  }

  const stats = statsQuery.data;
  const recentSales = recentSalesQuery.data ?? [];
  const pendingActivations = pendingActivationsQuery.data ?? [];

  const periodSales = selectedPeriod === 'today'
    ? stats.todaySales
    : selectedPeriod === 'week'
    ? stats.thisWeek
    : stats.monthSales;

  const periodSalesChange = selectedPeriod === 'today'
    ? stats.todaySalesChange
    : selectedPeriod === 'week'
    ? stats.thisWeekChange
    : stats.totalCustomersChange;

  const periodSalesRate = selectedPeriod === 'today'
    ? stats.todaySalesRate
    : selectedPeriod === 'week'
    ? stats.thisWeekSalesRate
    : stats.monthSalesRate;

  const periodCommissionRate = selectedPeriod === 'today'
    ? stats.todayCommissionRate
    : selectedPeriod === 'week'
    ? stats.thisWeekCommissionRate
    : stats.monthCommissionRate;

  const periodCommission = selectedPeriod === 'today'
    ? stats.todayCommission
    : selectedPeriod === 'week'
    ? stats.weekCommission
    : stats.monthCommission;

  return (
    <ScreenShell>
      {/* 🔹 HEADER — matches HomeScreen pattern */}
      <ScreenHeader style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.greetingBlock}>
            <Text style={styles.greetingSub}>Bonjour 👋</Text>
            <Text numberOfLines={1} style={styles.headerTitle}>{accountName}</Text>
          </View>

          <Pressable
            onPress={() => {
              if (!showNotifications) void inbox.markRead();
              setShowNotifications(v => !v);
            }}
            style={styles.iconButton}
          >
            <Ionicons
              name="notifications-outline"
              size={sizes.icon.md}
              color={colors.text.onPrimary}
            />
            {inbox.unreadCount > 0 && (
              <View style={styles.notifBadge}>
                <Text style={styles.notifBadgeCount}>{inbox.unreadCount}</Text>
              </View>
            )}
          </Pressable>
        </View>
      </ScreenHeader>

      {showNotifications && (
        <>
          {/* Full-screen transparent backdrop */}
          <Pressable
            style={styles.notifBackdrop}
            onPress={() => setShowNotifications(false)}
          />
          {/* Dropdown panel */}
          <View style={[styles.notifDropdown, { top: insets.top + 80 }]}>
            <Text style={styles.notifDropdownTitle}>Notifications</Text>
            <ScrollView
              style={{ maxHeight: 260 }}
              showsVerticalScrollIndicator={false}
            >
              {inbox.items.length === 0 ? (
                <Text style={styles.notifEmpty}>
                  Aucune notification pour le moment.
                </Text>
              ) : inbox.items.map((item, i) => (
                <View key={item.id}>
                  <View style={styles.notifItem}>
                    <Text style={styles.notifItemTitle}>{item.title}</Text>
                    <Text style={styles.notifItemBody}>{item.body}</Text>
                  </View>
                  {i < inbox.items.length - 1 && (
                    <View style={styles.notifDivider} />
                  )}
                </View>
              ))}
            </ScrollView>
          </View>
        </>
      )}

      <ScreenContent
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: tabBarHeight + spacing.xxxl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* 🔹 WALLET STRIP — matches HomeScreen promoStrip pattern */}
        <View style={styles.promoSection}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={openWalletTab}
            style={styles.promoStrip}
          >
            <View style={styles.promoIcon}>
              <Ionicons
                name="wallet-outline"
                size={sizes.icon.md}
                color={colors.primary.DEFAULT}
              />
            </View>
            <View style={styles.promoText}>
              <Text style={styles.promoLabel}>Solde disponible</Text>
              <Text style={styles.promoBalance}>{formatCurrency(stats.walletBalance)}</Text>
            </View>
            <ActionButton
              label="+ Recharger"
              onPress={openWalletTab}
              size="sm"
            />
          </TouchableOpacity>
        </View>

        {/* 🔹 PERIOD FILTERS — matches HomeScreen tabsWrap pattern */}
        <View style={styles.filtersSection}>
          <View style={styles.tabsWrap}>
            {PERIODS.map((p) => {
              const isActive = p.key === selectedPeriod;
              return (
                <TouchableOpacity
                  key={p.key}
                  activeOpacity={0.8}
                  onPress={() => setSelectedPeriod(p.key)}
                  style={[styles.tab, isActive && styles.tabActive]}
                >
                  <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                    {p.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.pagePadding}>

          {/* 🔹 KPI GRID */}
          <View style={styles.contentSection}>
            <Text style={styles.sectionTitle}>Performances</Text>
            <View style={styles.kpiGrid}>
              <KpiCard
                iconName="bag-handle"
                iconColor={colors.primary.DEFAULT}
                iconBg={colors.primary[100]}
                label="Ventes"
                value={String(periodSales)}
                delta={periodSalesRate}
                deltaLabel="vs période préc."
                style={styles.kpiCardFlex}
              />
              <KpiCard
                iconName="trending-up"
                iconColor={colors.success.DEFAULT}
                iconBg={colors.success[50]}
                label="Commission"
                value={formatCurrency(periodCommission)}
                delta={periodCommissionRate}
                deltaLabel="vs période préc."
                valueColor={colors.success.dark}
                style={[styles.kpiCardFlex, styles.kpiCardCommission]}
              />
            </View>
          </View>

          {/* 🔹 PRIMARY SELL CTA */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={openSellTab}
            style={styles.sellCta}
          >
            <View style={styles.sellCtaLeft}>
              <View style={styles.sellCtaIconWrap}>
                <Ionicons
                  color={colors.secondary[600]}
                  name="add-circle"
                  size={sizes.icon.lg}
                />
              </View>
              <View style={styles.sellCtaTextWrap}>
                <Text style={styles.sellCtaTitle}>Vendre une eSIM</Text>
                <Text style={styles.sellCtaSubtitle}>
                  Démarrer une transaction
                </Text>
              </View>
            </View>
            <View style={styles.sellCtaArrowWrap}>
              <Ionicons
                color={colors.primary[900]}
                name="arrow-forward"
                size={sizes.icon.sm}
              />
            </View>
          </TouchableOpacity>

          {/* 🔹 FEATURED OFFER — matches HomeScreen promoStrip pattern */}
          {featuredOfferQuery.data ? (
            <FeaturedOfferCard
              offer={featuredOfferQuery.data}
              onPress={openSellTab}
            />
          ) : null}

          {/* 🔹 RECENT SALES */}
          <View style={styles.section}>
            <SectionHeader
              actionLabel="Tout voir →"
              title="Ventes récentes"
              onPressAction={openTransactionsTab}
            />

            {recentSalesQuery.isLoading ? (
              <View style={styles.stateCard}>
                <ActivityIndicator color={colors.primary.DEFAULT} />
              </View>
            ) : recentSales.length === 0 ? (
              <View style={styles.stateCard}>
                <View style={styles.emptyStateIconWrap}>
                  <Ionicons
                    color={colors.text.tertiary}
                    name="receipt-outline"
                    size={sizes.icon.xl}
                  />
                </View>
                <Text style={styles.emptyText}>Aucune vente récente</Text>
              </View>
            ) : (
              recentSales.map((sale) => (
                <RecentSaleCard
                  key={sale.id}
                  formattedAmount={formatCurrency(sale.amount)}
                  formattedCommission={`+${formatCurrency(sale.commission)}`}
                  sale={sale}
                />
              ))
            )}
          </View>

          {/* 🔹 PENDING ACTIVATIONS */}
          <View style={styles.section}>
            <SectionHeader title="Activations en attente" />

            {pendingActivationsQuery.isLoading ? (
              <View style={styles.stateCard}>
                <ActivityIndicator color={colors.primary.DEFAULT} />
              </View>
            ) : pendingActivations.length === 0 ? (
              <View style={styles.stateCard}>
                <View style={styles.emptyStateIconWrap}>
                  <Ionicons
                    color={colors.text.tertiary}
                    name="checkmark-circle"
                    size={sizes.icon.xl}
                  />
                </View>
                <Text style={styles.emptyText}>Aucune activation en attente</Text>
              </View>
            ) : (
              pendingActivations.map((activation) => (
                <PendingActivationCard
                  key={activation.id}
                  activation={activation}
                  formattedAmount={formatCurrency(activation.amount)}
                  formattedDate={formatDate(activation.purchaseDate)}
                  onPress={() => navigateToActivation(activation)}
                  onPressActivate={() => navigateToActivation(activation)}
                />
              ))
            )}
          </View>

        </View>
      </ScreenContent>

    </ScreenShell>
  );
};

// ─── Sub-components ──────────────────────────────────────────────────────────

type KpiCardProps = {
  iconName: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBg: string;
  label: string;
  value: string;
  delta: string;
  deltaLabel: string;
  valueColor?: string;
  style?: StyleProp<ViewStyle>;
};

const KpiCard = ({
  delta,
  deltaLabel,
  iconBg,
  iconColor,
  iconName,
  label,
  style,
  value,
  valueColor,
}: KpiCardProps) => {
  const isPositive = delta.startsWith('+');
  const isNegative = delta.startsWith('-');
  const isNeutral = delta === '--';
  const deltaColor = isPositive
    ? colors.success.dark
    : isNegative
    ? colors.error.DEFAULT
    : colors.text.tertiary;
  const arrowIcon: keyof typeof Ionicons.glyphMap | null = isPositive
    ? 'arrow-up'
    : isNegative
    ? 'arrow-down'
    : null;

  return (
    <View style={[styles.kpiCard, style]}>
      <View style={[styles.kpiIconWrap, { backgroundColor: iconBg }]}>
        <Ionicons color={iconColor} name={iconName} size={sizes.icon.sm} />
      </View>
      <View style={styles.kpiText}>
        <Text style={styles.kpiLabel}>{label}</Text>
        <Text style={[styles.kpiValue, valueColor ? { color: valueColor } : null]} numberOfLines={1}>
          {value}
        </Text>
        <View style={styles.kpiDeltaRow}>
          {arrowIcon && !isNeutral ? (
            <Ionicons name={arrowIcon} size={10} color={deltaColor} />
          ) : null}
          <Text style={[styles.kpiDelta, { color: deltaColor }]}>
            {delta}{isNeutral ? '' : ` ${deltaLabel}`}
          </Text>
        </View>
      </View>
    </View>
  );
};

type FeaturedOfferCardProps = {
  offer: Offer;
  onPress: () => void;
};

const FeaturedOfferCard = ({ offer, onPress }: FeaturedOfferCardProps) => (
  <TouchableOpacity
    activeOpacity={0.85}
    onPress={onPress}
    style={styles.featuredCard}
  >
    <View style={styles.featuredFlagWrap}>
      <CountryFlag countryCode={offer.countryCode} size={22} />
    </View>
    <View style={styles.featuredContent}>
      <Text style={styles.featuredTitle} numberOfLines={1}>
        {offer.country}
      </Text>
      <Text style={styles.featuredSubtitle} numberOfLines={1}>
        {offer.dataVolume} • {offer.validityDays} jours
      </Text>
    </View>
    <View style={styles.featuredRight}>
      <Text style={styles.featuredPrice}>{formatCurrency(offer.price)}</Text>
      <Text style={styles.featuredBadge}>Offre</Text>
    </View>
    <View style={styles.featuredChevronWrap}>
      <Ionicons color={colors.primary.DEFAULT} name="chevron-forward" size={sizes.icon.sm} />
    </View>
  </TouchableOpacity>
);

type SectionHeaderProps = {
  title: string;
  actionLabel?: string;
  onPressAction?: () => void;
};

const SectionHeader = ({ actionLabel, onPressAction, title }: SectionHeaderProps) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {actionLabel && onPressAction ? (
      <TouchableOpacity activeOpacity={0.85} onPress={onPressAction}>
        <Text style={styles.sectionAction}>{actionLabel}</Text>
      </TouchableOpacity>
    ) : null}
  </View>
);

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  errorContentContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    ...patterns.screenPadding,
  },

  /* ── HEADER — mirrors HomeScreen ── */
  header: {
    ...patterns.headerShell,
    backgroundColor: colors.primary.DEFAULT,
    borderBottomColor: colors.primary.dark,
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
    color: colors.state.onPrimaryOverlay80,
    fontWeight: '500',
    marginBottom: spacing.xxs,
  },
  headerTitle: {
    ...typography.titleLG,
    color: colors.text.onPrimary,
  },
  iconButton: {
    height: sizes.touch.sm,
    width: sizes.touch.sm,
    borderRadius: radii.full,
    backgroundColor: colors.state.onPrimaryOverlay18,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.medium,
  },
  notifBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: sizes.icon.sm,
    height: sizes.icon.sm,
    borderRadius: radii.full,
    backgroundColor: colors.error.DEFAULT,
    borderWidth: 1.5,
    borderColor: colors.primary.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxs,
  },
  notifBadgeCount: {
    color: colors.white,
    fontSize: 9,
    fontWeight: '700',
  },

  /* ── Notification dropdown ── */
  notifBackdrop: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 99,
  },
  notifDropdown: {
    position: 'absolute',
    right: spacing.xl,
    width: 300,
    maxHeight: 320,
    backgroundColor: colors.surface,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    zIndex: 100,
    ...shadows.high,
    overflow: 'hidden',
  },
  notifDropdownTitle: {
    ...typography.labelMD,
    color: colors.text.primary,
    fontWeight: '700',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  notifItem: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  notifItemTitle: {
    ...typography.labelSM,
    color: colors.text.primary,
    fontWeight: '600',
    marginBottom: 2,
  },
  notifItemBody: {
    ...typography.bodySM,
    color: colors.text.secondary,
    lineHeight: 18,
  },
  notifDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.lg,
  },
  notifEmpty: {
    ...typography.bodySM,
    color: colors.text.tertiary,
    textAlign: 'center',
    padding: spacing.xl,
  },

  /* ── WALLET PROMO STRIP — mirrors HomeScreen promoStrip ── */
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
    width: sizes.iconWrap.sm,
    height: sizes.iconWrap.sm,
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
    ...typography.labelSM,
    color: colors.text.secondary,
  },
  promoBalance: {
    ...typography.titleSM,
    color: colors.text.primary,
    fontWeight: '800',
    marginTop: 2,
  },

  /* ── PERIOD FILTER TABS — mirrors HomeScreen tabsWrap ── */
  filtersSection: {
    marginTop: spacing.lg,
    ...patterns.screenPadding,
  },
  tabsWrap: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.xl,
    overflow: 'hidden',
    ...shadows.low,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  tabActive: {
    backgroundColor: colors.primary[100],
  },
  tabText: {
    ...typography.bodyMD,
    color: colors.text.secondary,
  },
  tabTextActive: {
    color: colors.primary.DEFAULT,
    fontWeight: '700',
  },

  /* ── CONTENT ── */
  contentContainer: {
    paddingTop: spacing.sm,
  },
  pagePadding: {
    ...patterns.screenPadding,
  },
  contentSection: {
    marginTop: spacing.xl,
  },

  /* ── KPI GRID ── */
  kpiGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  kpiCard: {
    ...patterns.card,
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
    ...shadows.medium,
  },
  kpiCardFlex: {
    flex: 1,
  },
  kpiCardCommission: {
    backgroundColor: colors.success[50],
    borderColor: colors.success[100],
  },
  kpiIconWrap: {
    alignItems: 'center',
    borderRadius: radii.md,
    height: sizes.iconWrap.sm,
    justifyContent: 'center',
    width: sizes.iconWrap.sm,
    flexShrink: 0,
  },
  kpiText: {
    flex: 1,
    minWidth: 0,
  },
  kpiLabel: {
    ...typography.bodySM,
    color: colors.text.tertiary,
    fontWeight: '600',
  },
  kpiValue: {
    ...typography.titleSM,
    color: colors.text.primary,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginTop: spacing.xxs,
  },
  kpiDeltaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    marginTop: spacing.xs,
  },
  kpiDelta: {
    ...typography.labelSM,
    fontWeight: '700',
    fontSize: 10,
  },

  /* ── SELL CTA ── */
  sellCta: {
    alignItems: 'center',
    backgroundColor: colors.secondary.DEFAULT,
    borderRadius: radii.xl,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xl,
    padding: spacing.lg,
    ...shadows.medium,
  },
  sellCtaLeft: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: spacing.md,
  },
  sellCtaIconWrap: {
    alignItems: 'center',
    backgroundColor: colors.state.onPrimaryOverlay90,
    borderRadius: radii.lg,
    height: sizes.touch.md,
    justifyContent: 'center',
    width: sizes.touch.md,
  },
  sellCtaTextWrap: {
    flex: 1,
  },
  sellCtaTitle: {
    ...typography.button,
    color: colors.primary[900],
    fontWeight: '700',
  },
  sellCtaSubtitle: {
    ...typography.bodySM,
    color: colors.text.primary,
    marginTop: spacing.xxs,
  },
  sellCtaArrowWrap: {
    alignItems: 'center',
    backgroundColor: colors.state.onPrimaryOverlay40,
    borderRadius: radii.full,
    height: sizes.touch.sm,
    justifyContent: 'center',
    width: sizes.touch.sm,
  },

  /* ── FEATURED OFFER — mirrors HomeScreen promoStrip ── */
  featuredCard: {
    ...patterns.card,
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: spacing.xl,
    padding: spacing.md,
    ...shadows.medium,
  },
  featuredFlagWrap: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radii.sm,
    borderWidth: 1,
    height: sizes.touch.sm,
    justifyContent: 'center',
    width: sizes.touch.lg,
    flexShrink: 0,
    marginRight: spacing.sm,
  },
  featuredContent: {
    flex: 1,
    minWidth: 0,
  },
  featuredTitle: {
    ...typography.bodyMD,
    color: colors.text.primary,
    fontWeight: '700',
  },
  featuredSubtitle: {
    ...typography.bodySM,
    color: colors.text.secondary,
    marginTop: spacing.xxs,
  },
  featuredRight: {
    alignItems: 'center',
    flexDirection: 'column',
    flexShrink: 0,
    marginLeft: spacing.sm,
  },
  featuredPrice: {
    ...typography.labelMD,
    color: colors.primary.DEFAULT,
    fontWeight: '700',
  },
  featuredBadge: {
    ...typography.labelSM,
    color: colors.secondary[600],
    backgroundColor: colors.secondary[100],
    borderRadius: radii.full,
    overflow: 'hidden',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    marginTop: spacing.xxs,
  },
  featuredChevronWrap: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.full,
    height: sizes.avatar.sm,
    justifyContent: 'center',
    marginLeft: spacing.sm,
    width: sizes.avatar.sm,
  },

  /* ── SECTIONS — mirrors HomeScreen sectionTitle ── */
  section: {
    marginTop: spacing.xxl,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
  },
  sectionAction: {
    ...typography.labelMD,
    color: colors.primary.DEFAULT,
    fontWeight: '600',
  },

  /* ── STATE CARDS — mirrors HomeScreen stateCard ── */
  stateCard: {
    ...patterns.card,
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyStateIconWrap: {
    alignItems: 'center',
    backgroundColor: colors.gray[100],
    borderRadius: radii.full,
    height: sizes.touch.lg,
    justifyContent: 'center',
    marginBottom: spacing.sm,
    width: sizes.touch.lg,
  },
  emptyText: {
    ...typography.bodyMD,
    color: colors.text.secondary,
    textAlign: 'center',
  },

});
