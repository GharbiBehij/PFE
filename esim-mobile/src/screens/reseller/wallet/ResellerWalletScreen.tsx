import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import {
  Animated,
  BackHandler,
  Dimensions,
  Modal,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ErrorBanner } from '../../../components/ErrorBanner';
import { LoadingOverlay } from '../../../components/LoadingOverlay';
import { ActionButton, OutlineButton } from '../../../components/Buttons';
import { ScreenContent, ScreenHeader, ScreenShell } from '../../../components/layout';
import {
  useResellerWallet,
  type ResellerWalletActivity,
  type ResellerWalletActivityStatus,
} from '../../../hooks/reseller/useResellerWallet';
import { colors, patterns, radii, shadows, sizes, spacing, typography } from '../../../theme';
import { formatCurrency } from '../../../utils/formatCurrency';

const screenHeight = Dimensions.get('window').height;
const quickAmounts = [50, 100, 200, 500];

type TypeFilter = 'all' | ResellerWalletActivityType;
type StatusFilter = 'all' | ResellerWalletActivityStatus;

const TYPE_FILTERS: { key: TypeFilter; label: string }[] = [
  { key: 'all', label: 'Tout' },
  { key: 'topup', label: 'Recharges' },
];

const STATUS_FILTERS: { key: Exclude<StatusFilter, 'all'>; label: string; color: string; bg: string; border: string }[] = [
  { key: 'done',    label: 'Terminé',  color: colors.success.dark,    bg: colors.success[50],   border: colors.success[100] },
  { key: 'pending', label: 'En cours', color: colors.warning.dark,    bg: colors.warning[50],   border: colors.warning[100] },
  { key: 'failed',  label: 'Échoué',   color: colors.error.dark,      bg: colors.error[50],     border: colors.error[100] },
];

type ResellerWalletActivityType = 'commission' | 'sale' | 'topup';

const activityIconConfig: Record<ResellerWalletActivityType, { iconName: keyof typeof Ionicons.glyphMap; bg: string; stroke: string }> = {
  commission: { iconName: 'trending-up', bg: colors.success[50],   stroke: colors.success.DEFAULT },
  sale:       { iconName: 'bag-handle',  bg: colors.primary[100],  stroke: colors.primary.DEFAULT },
  topup:      { iconName: 'arrow-up',    bg: colors.primary[50],   stroke: colors.primary.DEFAULT },
};

const getAmountStyle = (activity: ResellerWalletActivity): { text: string; color: string } => {
  const abs = formatCurrency(Math.abs(activity.amount));
  if (activity.status === 'failed') return { text: abs, color: colors.error.DEFAULT };
  switch (activity.type) {
    case 'commission': return { text: `+${abs}`, color: colors.success.dark };
    case 'topup':      return { text: `+${abs}`, color: colors.primary.DEFAULT };
    case 'sale':       return { text: abs,        color: colors.text.primary };
  }
};

export const ResellerWalletScreen = () => {
  const tabBarHeight = useBottomTabBarHeight();
  const walletQuery = useResellerWallet();

  const scrollRef = useRef<ScrollView>(null);
  const [activitySectionY, setActivitySectionY] = useState(0);
  const [isSheetVisible, setIsSheetVisible] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const translateY = useRef(new Animated.Value(screenHeight)).current;

  const data = walletQuery.data;
  const activities = data?.activities ?? [];
  const balance = data?.balance ?? 0;
  const pendingBalance = data?.pendingBalance ?? 0;

  const parsedAmount = Number(topUpAmount.replace(',', '.'));
  const isTopUpValid = Number.isFinite(parsedAmount) && parsedAmount > 0;

  const openSheet = () => {
    translateY.setValue(screenHeight);
    setIsSheetVisible(true);
    Animated.timing(translateY, {
      toValue: 0,
      duration: 220,
      useNativeDriver: true,
    }).start();
  };

  const closeSheet = useCallback(() => {
    Animated.timing(translateY, {
      toValue: screenHeight,
      duration: 220,
      useNativeDriver: true,
    }).start(() => {
      setIsSheetVisible(false);
    });
  }, [translateY]);

  useEffect(() => {
    if (!isSheetVisible) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      closeSheet();
      return true;
    });
    return () => subscription.remove();
  }, [closeSheet, isSheetVisible]);

  const sortedActivities = useMemo(
    () => [...activities].sort((a, b) => b.id - a.id),
    [activities],
  );

  const filteredActivities = useMemo(
    () =>
      sortedActivities.filter(
        (a) =>
          (typeFilter === 'all' || a.type === typeFilter) &&
          (statusFilter === 'all' || a.status === statusFilter),
      ),
    [sortedActivities, typeFilter, statusFilter],
  );

  const scrollToActivity = () => {
    scrollRef.current?.scrollTo({
      y: Math.max(activitySectionY - spacing.lg, 0),
      animated: true,
    });
  };

  const onRequestTopUp = () => {
    if (!isTopUpValid) return;
    closeSheet();
    setTopUpAmount('');
  };

  // TODO: replace with real API data
  const handleExportTopup = async () => {
    const topupActivities = activities.filter((a) => a.type === 'topup');
    const header = 'Date,Description,Montant,Statut';
    const rows = topupActivities.map((a) =>
      [a.date, `"${a.description}"`, a.amount, a.status].join(','),
    );
    const csv = [header, ...rows].join('\n');
    await Share.share({ message: csv, title: 'recharges.csv' });
  };

  if (walletQuery.isLoading) {
    return <LoadingOverlay message="Chargement du portefeuille..." />;
  }

  if (walletQuery.isError || !walletQuery.data) {
    return (
      <ScreenShell>
        <ScreenContent contentContainerStyle={styles.errorContent} scrollable={false}>
          <ErrorBanner message="Impossible de charger les données du portefeuille." />
        </ScreenContent>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell>
      {/* 🔹 HEADER — matches HomeScreen pattern */}
      <ScreenHeader style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.greetingBlock}>
            <Text style={styles.greetingSub}>Portefeuille</Text>
            <Text style={styles.headerTitle}>Mon Wallet</Text>
          </View>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleExportTopup}
            style={styles.iconButton}
          >
            <Ionicons name="download-outline" size={sizes.icon.md} color={colors.text.onPrimary} />
          </TouchableOpacity>
        </View>
      </ScreenHeader>

      <ScreenContent
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: tabBarHeight + spacing.xxl },
        ]}
        scrollViewRef={scrollRef}
        showsVerticalScrollIndicator={false}
      >
        {/* 🔹 BALANCE PROMO STRIP — matches HomeScreen promoStrip pattern */}
        <View style={styles.promoSection}>
          <View style={styles.promoStrip}>
            <View style={styles.promoIcon}>
              <Ionicons name="wallet-outline" size={sizes.icon.md} color={colors.primary.DEFAULT} />
            </View>
            <View style={styles.promoText}>
              <Text style={styles.promoLabel}>Solde disponible</Text>
              <Text style={styles.promoBalance}>{formatCurrency(balance)}</Text>
              {pendingBalance > 0 ? (
                <Text style={styles.pendingText}>
                  {formatCurrency(pendingBalance)} en attente
                </Text>
              ) : null}
            </View>
            <View style={styles.promoActions}>
              <ActionButton
                label="+ Recharger"
                onPress={openSheet}
                size="sm"
              />
            </View>
          </View>
        </View>

        <View style={styles.pagePadding}>

          {/* Type filter chips — horizontal scroll */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.typeFilterRow}
            style={styles.typeFilterScroll}
          >
            {TYPE_FILTERS.map((f) => {
              const active = typeFilter === f.key;
              return (
                <TouchableOpacity
                  key={f.key}
                  activeOpacity={0.8}
                  onPress={() => setTypeFilter(f.key)}
                  style={[styles.typeChip, active && styles.typeChipActive]}
                >
                  <Text style={[styles.typeChipText, active && styles.typeChipTextActive]}>
                    {f.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Activity section */}
          <View onLayout={(event) => setActivitySectionY(event.nativeEvent.layout.y)}>
            {/* Section header + inline status filters */}
            <View style={styles.activityHeader}>
              <Text style={styles.activityTitle}>Historique des recharges</Text>
              <View style={styles.statusFilterRow}>
                {STATUS_FILTERS.map((f) => {
                  const active = statusFilter === f.key;
                  return (
                    <TouchableOpacity
                      key={f.key}
                      activeOpacity={0.8}
                      onPress={() => setStatusFilter(active ? 'all' : f.key)}
                      style={[
                        styles.statusChip,
                        active
                          ? { backgroundColor: f.bg, borderColor: f.border }
                          : styles.statusChipInactive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusChipText,
                          active ? { color: f.color } : styles.statusChipTextInactive,
                        ]}
                      >
                        {f.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {filteredActivities.length === 0 ? (
              <View style={styles.emptyStateWrap}>
                <View style={styles.emptyStateIconWrap}>
                  <Ionicons
                    color={colors.text.tertiary}
                    name="wallet-outline"
                    size={sizes.icon.xxl}
                  />
                </View>
                <Text style={styles.emptyStateTitle}>Aucune transaction trouvée</Text>
                <Text style={styles.emptyStateSubtitle}>
                  Modifiez les filtres pour voir d'autres résultats
                </Text>
              </View>
            ) : (
              <View style={styles.activitiesWrap}>
                {filteredActivities.map((activity) => (
                  <ActivityRow key={activity.id} activity={activity} />
                ))}
              </View>
            )}
          </View>

        </View>
      </ScreenContent>

      {/* Top-up bottom sheet */}
      <Modal
        visible={isSheetVisible}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={closeSheet}
      >
        <TouchableOpacity activeOpacity={1} onPress={closeSheet} style={styles.overlay} />

        <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
            <View style={styles.handle} />

            <View style={styles.sheetHeaderRow}>
              <Text style={styles.sheetTitle}>Recharger le portefeuille</Text>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={closeSheet}
                style={styles.sheetCloseBtn}
              >
                <Ionicons color={colors.text.secondary} name="close" size={sizes.icon.md} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Montant (DT)</Text>
              <View style={styles.amountInputWrap}>
                <Text style={styles.amountPrefix}>DT</Text>
                <TextInput
                  keyboardType="numeric"
                  onChangeText={setTopUpAmount}
                  placeholder="0"
                  placeholderTextColor={colors.text.tertiary}
                  style={styles.amountInput}
                  value={topUpAmount}
                />
                {topUpAmount.length > 0 ? (
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => setTopUpAmount('')}
                    style={styles.clearBtn}
                  >
                    <Ionicons
                      color={colors.text.tertiary}
                      name="close-circle"
                      size={sizes.icon.sm}
                    />
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>

            <View style={styles.quickGrid}>
              {quickAmounts.map((value) => (
                <TouchableOpacity
                  accessibilityRole="button"
                  activeOpacity={0.85}
                  key={value}
                  onPress={() => setTopUpAmount(String(value))}
                  style={[
                    styles.quickButton,
                    topUpAmount === String(value) ? styles.quickButtonSelected : undefined,
                  ]}
                >
                  <Text
                    style={[
                      styles.quickButtonText,
                      topUpAmount === String(value) ? styles.quickButtonTextSelected : undefined,
                    ]}
                  >
                    {`${value} DT`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.infoBanner}>
              <Ionicons
                color={colors.warning.dark}
                name="information-circle-outline"
                size={sizes.icon.sm}
              />
              <Text style={styles.infoBannerText}>
                Contactez votre gestionnaire pour finaliser la recharge
              </Text>
            </View>

            <View style={styles.sheetActionsRow}>
              <OutlineButton label="Annuler" onPress={closeSheet} />
              <ActionButton
                disabled={!isTopUpValid}
                label="Demander une recharge"
                onPress={onRequestTopUp}
              />
            </View>
        </Animated.View>
      </Modal>
    </ScreenShell>
  );
};

// ─── ActivityRow ──────────────────────────────────────────────────────────────

const ActivityRow = ({ activity }: { activity: ResellerWalletActivity }) => {
  const failed = activity.status === 'failed';
  const iconCfg = activityIconConfig[activity.type];
  const amountStyle = getAmountStyle(activity);

  const statusBadge = STATUS_FILTERS.find((f) => f.key === activity.status);

  return (
    <View style={styles.activityCard}>
      {/* Icon */}
      <View
        style={[
          styles.activityIconWrap,
          { backgroundColor: failed ? colors.error[50] : iconCfg.bg },
        ]}
      >
        <Ionicons
          color={failed ? colors.error.DEFAULT : iconCfg.stroke}
          name={iconCfg.iconName}
          size={sizes.icon.sm}
        />
      </View>

      {/* Middle */}
      <View style={styles.activityMiddle}>
        <Text style={styles.activityLabel} numberOfLines={1}>{activity.description}</Text>
        <View style={styles.activityMeta}>
          {statusBadge ? (
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: statusBadge.bg, borderColor: statusBadge.border },
              ]}
            >
              <Text style={[styles.statusBadgeText, { color: statusBadge.color }]}>
                {statusBadge.label}
              </Text>
            </View>
          ) : null}
          <Text style={styles.activityDate}>{activity.date}</Text>
        </View>
      </View>

      {/* Amount */}
      <View style={styles.activityRight}>
        <Text style={[styles.activityAmount, { color: amountStyle.color }]}>
          {amountStyle.text}
        </Text>
        <Text style={styles.activityCurrency}>TND</Text>
      </View>
    </View>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  errorContent: {
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

  /* ── BALANCE PROMO STRIP — mirrors HomeScreen promoStrip ── */
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
    marginTop: spacing.xxs,
  },
  pendingText: {
    ...typography.bodySM,
    color: colors.text.tertiary,
    marginTop: spacing.xxs,
  },
  promoActions: {
    flexShrink: 0,
    gap: spacing.xs,
  },


  contentContainer: {
    paddingTop: spacing.lg,
  },
  pagePadding: {
    ...patterns.screenPadding,
  },

  // Type filter chips
  typeFilterScroll: {
    marginBottom: spacing.lg,
  },
  typeFilterRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: 0,
  },
  typeChip: {
    backgroundColor: colors.gray[100],
    borderColor: colors.border,
    borderRadius: radii.full,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 1,
  },
  typeChipActive: {
    backgroundColor: colors.primary[100],
    borderColor: colors.primary.DEFAULT,
  },
  typeChipText: {
    ...typography.labelSM,
    color: colors.text.secondary,
    fontWeight: '700',
  },
  typeChipTextActive: {
    color: colors.primary.DEFAULT,
  },

  // Activity section header
  activityHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  activityTitle: {
    ...typography.overline,
    color: colors.text.secondary,
  },
  statusFilterRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statusChip: {
    borderRadius: radii.full,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  statusChipInactive: {
    backgroundColor: colors.gray[100],
    borderColor: colors.border,
  },
  statusChipText: {
    fontSize: 9,
    fontWeight: '700',
  },
  statusChipTextInactive: {
    color: colors.text.tertiary,
  },

  activitiesWrap: {
    gap: spacing.sm,
  },

  // Activity row
  activityCard: {
    ...patterns.card,
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
  },
  activityIconWrap: {
    alignItems: 'center',
    borderRadius: radii.md,
    flexShrink: 0,
    height: sizes.iconWrap.sm,
    justifyContent: 'center',
    width: sizes.iconWrap.sm,
  },
  activityMiddle: {
    flex: 1,
    minWidth: 0,
  },
  activityLabel: {
    ...typography.bodyMD,
    color: colors.text.primary,
    fontWeight: '700',
    fontSize: 12,
  },
  activityMeta: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  statusBadge: {
    borderRadius: radii.full,
    borderWidth: 1,
    paddingHorizontal: spacing.xs + 3,
    paddingVertical: 2,
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: '700',
  },
  activityDate: {
    ...typography.bodySM,
    color: colors.text.tertiary,
    fontSize: 9,
  },
  activityRight: {
    alignItems: 'flex-end',
    flexShrink: 0,
  },
  activityAmount: {
    ...typography.bodyMD,
    fontWeight: '800',
    fontSize: 13,
  },
  activityCurrency: {
    ...typography.bodySM,
    color: colors.text.tertiary,
    fontSize: 9,
    marginTop: spacing.xxs,
  },

  // Empty state
  emptyStateWrap: {
    ...patterns.card,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxxl,
  },
  emptyStateIconWrap: {
    alignItems: 'center',
    backgroundColor: colors.gray[100],
    borderRadius: radii.full,
    height: sizes.iconWrap.lg,
    justifyContent: 'center',
    width: sizes.iconWrap.lg,
  },
  emptyStateTitle: {
    ...typography.titleSM,
    color: colors.text.secondary,
    fontWeight: '600',
    marginTop: spacing.md,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    ...typography.bodySM,
    color: colors.text.tertiary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },

  // Bottom sheet
  overlay: {
    backgroundColor: colors.overlay,
    flex: 1,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    padding: spacing.xl,
    ...shadows.high,
  },
  handle: {
    alignSelf: 'center',
    backgroundColor: colors.gray[300],
    borderRadius: radii.full,
    height: sizes.bottomSheet.handleHeight,
    marginBottom: spacing.lg,
    width: sizes.bottomSheet.handleWidth,
  },
  sheetHeaderRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  sheetTitle: {
    ...typography.titleSM,
    color: colors.text.primary,
    fontWeight: '700',
  },
  sheetCloseBtn: {
    alignItems: 'center',
    backgroundColor: colors.gray[100],
    borderRadius: radii.full,
    height: sizes.touch.sm,
    justifyContent: 'center',
    width: sizes.touch.sm,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    ...typography.labelMD,
    color: colors.text.primary,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  amountInputWrap: {
    ...patterns.inputField,
  },
  amountPrefix: {
    ...typography.labelMD,
    color: colors.text.secondary,
    marginRight: spacing.sm,
  },
  amountInput: {
    ...typography.bodyMD,
    color: colors.text.primary,
    flex: 1,
    paddingVertical: spacing[0],
  },
  clearBtn: {
    padding: spacing.xs,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  quickButton: {
    alignItems: 'center',
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[200],
    borderRadius: radii.lg,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: sizes.touch.sm,
    width: '48%',
  },
  quickButtonSelected: {
    backgroundColor: colors.primary.DEFAULT,
    borderColor: colors.primary.DEFAULT,
  },
  quickButtonText: {
    ...typography.button,
    color: colors.primary.DEFAULT,
    fontWeight: '700',
  },
  quickButtonTextSelected: {
    color: colors.text.onPrimary,
  },
  infoBanner: {
    alignItems: 'flex-start',
    backgroundColor: colors.warning[50],
    borderColor: colors.warning.DEFAULT,
    borderRadius: radii.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
    padding: spacing.md,
  },
  infoBannerText: {
    ...typography.bodySM,
    color: colors.warning.dark,
    flex: 1,
  },
  sheetActionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
});
