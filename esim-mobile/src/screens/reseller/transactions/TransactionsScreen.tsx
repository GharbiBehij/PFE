import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import {
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { ErrorBanner } from '../../../components/ErrorBanner';
import { LoadingOverlay } from '../../../components/LoadingOverlay';
import { ScreenContent, ScreenHeader, ScreenShell } from '../../../components/layout';
import {
  useTransactions,
  type ResellerTransaction,
  type ResellerTransactionStatus,
} from '../../../hooks/reseller/useTransactions';
import { colors, patterns, radii, shadows, sizes, spacing, typography } from '../../../theme';
import { formatCurrency } from '../../../utils/formatCurrency';
import { PurpleButton } from '../../../components/Buttons';

type FilterValue = 'all' | 'completed' | 'pending' | 'failed';

const filters: Array<{ label: string; value: FilterValue }> = [
  { label: 'Tout', value: 'all' },
  { label: 'Complété', value: 'completed' },
  { label: 'En attente', value: 'pending' },
  { label: 'Échoué', value: 'failed' },
];

const statusLabelMap: Record<ResellerTransactionStatus, string> = {
  completed: 'Complété',
  pending: 'En attente',
  failed: 'Échoué',
};

const statusIconMap: Record <
  ResellerTransactionStatus,
  keyof typeof Ionicons.glyphMap
> = {
  completed: 'checkmark-circle',
  pending: 'time',
  failed: 'close-circle',
};

const statusColorMap: Record <
  ResellerTransactionStatus,
  { background: string; text: string; border: string }
> = {
  completed: colors.status.succeeded,
  pending: colors.status.pending,
  failed: colors.status.failed,
};

const toDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getDateLabel = (dateKey: string) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (dateKey === toDateKey(today)) return "Aujourd'hui";
  if (dateKey === toDateKey(yesterday)) return 'Hier';
  const parsed = new Date(`${dateKey}T00:00:00`);
  const formatted = new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(parsed);
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
};

export const TransactionsScreen = () => {
  const tabBarHeight = useBottomTabBarHeight();
  const transactionsQuery = useTransactions();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterValue>('all');

  if (transactionsQuery.isLoading) {
    return <LoadingOverlay message="Chargement des transactions..." />;
  }

  if (transactionsQuery.isError) {
    return (
      <ScreenShell>
        <ScreenContent contentContainerStyle={styles.errorContent} scrollable={false}>
          <ErrorBanner message="Impossible de charger les transactions." />
        </ScreenContent>
      </ScreenShell>
    );
  }

  const transactions = transactionsQuery.data ?? [];

  const filteredTransactions = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    return transactions.filter((transaction) => {
      const matchesFilter =
        activeFilter === 'all' || transaction.status === activeFilter;
      if (!matchesFilter) return false;
      if (!normalizedQuery) return true;
      return (
        transaction.customer.toLowerCase().includes(normalizedQuery)
        || transaction.id.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [activeFilter, searchQuery, transactions]);

  const totalAmount = useMemo(
    () => filteredTransactions.reduce((sum, t) => sum + t.amount, 0),
    [filteredTransactions],
  );

  const totalCommission = useMemo(
    () => filteredTransactions.reduce((sum, t) => sum + t.commission, 0),
    [filteredTransactions],
  );

  const averageCommission =
    filteredTransactions.length > 0
      ? totalCommission / filteredTransactions.length
      : 0;

  const groupedTransactions = useMemo(() => {
    const sorted = [...filteredTransactions].sort((a, b) => {
      const aTime = new Date(`${a.date}T${a.time}:00`).getTime();
      const bTime = new Date(`${b.date}T${b.time}:00`).getTime();
      return bTime - aTime;
    });

    const groupMap = new Map<string, ResellerTransaction[]>();
    sorted.forEach((transaction) => {
      const existing = groupMap.get(transaction.date);
      if (existing) {
        existing.push(transaction);
      } else {
        groupMap.set(transaction.date, [transaction]);
      }
    });

    return Array.from(groupMap.keys())
      .sort((a, b) => b.localeCompare(a))
      .map((date) => ({
        date,
        label: getDateLabel(date),
        transactions: groupMap.get(date) ?? [],
      }));
  }, [filteredTransactions]);

  const hasResults = groupedTransactions.length > 0;
  const isSearching = searchQuery.trim().length > 0;

  // TODO: replace with real API data
  const handleExport = async () => {
    const header = 'Date,Client,Offre,Montant,Statut';
    const rows = filteredTransactions.map((t) =>
      [t.date, `"${t.customer}"`, `"${t.package}"`, t.amount, t.status].join(','),
    );
    const csv = [header, ...rows].join('\n');
    await Share.share({ message: csv, title: 'transactions.csv' });
  };

  return (
    <ScreenShell>
      {/* 🔹 HEADER — matches HomeScreen pattern */}
      <ScreenHeader style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.greetingBlock}>
            <Text style={styles.greetingSub}>Historique</Text>
            <Text style={styles.headerTitle}>Transactions</Text>
          </View>
          <TouchableOpacity
            accessibilityRole="button"
            activeOpacity={0.85}
            onPress={handleExport}
            style={styles.iconButton}
          >
            <Ionicons color={colors.text.onPrimary} name="download-outline" size={sizes.icon.md} />
          </TouchableOpacity>
        </View>

        {/* Search — matches HomeScreen search bar pattern */}
        <View style={styles.searchFieldWrap}>
          <Ionicons
            color={colors.state.onPrimaryOverlay70}
            name="search"
            size={sizes.icon.sm}
            style={styles.searchIcon}
          />
          <TextInput
            onChangeText={setSearchQuery}
            placeholder="Rechercher une transaction..."
            placeholderTextColor={colors.state.onPrimaryOverlay50}
            style={styles.searchInput}
            value={searchQuery}
          />
          {isSearching ? (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setSearchQuery('')}
              style={styles.clearSearch}
            >
              <Ionicons color={colors.text.tertiary} name="close-circle" size={sizes.icon.sm} />
            </TouchableOpacity>
          ) : null}
        </View>
      </ScreenHeader>

      {/* 🔹 FILTER PILLS — matches HomeScreen tabsWrap pattern */}
      <View style={styles.filtersSection}>
        <ScrollView
          contentContainerStyle={styles.filterRow}
          horizontal
          showsHorizontalScrollIndicator={false}
        >
          {filters.map((filter) => {
            const isActive = activeFilter === filter.value;
            return (
              <TouchableOpacity
                key={filter.value}
                accessibilityRole="button"
                activeOpacity={0.85}
                onPress={() => setActiveFilter(filter.value)}
                style={[styles.filterPill, isActive && styles.filterPillActive]}
              >
                <Text style={[styles.filterPillText, isActive && styles.filterPillTextActive]}>
                  {filter.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScreenContent
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: tabBarHeight + spacing.xxxl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.pagePadding}>

          {/* Summary cards — overlap header bottom */}
          <View style={styles.summaryRow}>
            <View style={[styles.summaryCard, styles.summaryCardLeft]}>
              <Ionicons
                color={colors.text.secondary}
                name="bar-chart-outline"
                size={sizes.icon.sm}
                style={styles.summaryIcon}
              />
              <Text style={styles.summaryLabel}>Total des ventes</Text>
              <Text style={styles.summaryValueDark}>
                {formatCurrency(totalAmount)}
              </Text>
              <Text style={styles.summarySuccessText}>
                {`${filteredTransactions.length} transaction${
                  filteredTransactions.length !== 1 ? 's' : ''
                }`}
              </Text>
            </View>

            <View style={[styles.summaryCard, styles.summaryCardRight]}>
              <Ionicons
                color={colors.primary.DEFAULT}
                name="trending-up-outline"
                size={sizes.icon.sm}
                style={styles.summaryIcon}
              />
              <Text style={styles.summaryLabel}>Commission</Text>
              <Text style={styles.summaryValue}>
                {formatCurrency(totalCommission)}
              </Text>
              <Text style={styles.summarySecondaryText}>
                {`Moy. ${formatCurrency(averageCommission)} / transaction`}
              </Text>
            </View>
          </View>

          {/* Section divider */}
          <View style={styles.sectionDivider}>
            <Text style={styles.sectionDividerText}>
              {isSearching
                ? `Résultats pour "${searchQuery}"`
                : activeFilter === 'all'
                  ? 'Toutes les transactions'
                  : filters.find((f) => f.value === activeFilter)?.label}
            </Text>
            {filteredTransactions.length > 0 ? (
              <View style={styles.resultCountBadge}>
                <Text style={styles.resultCountText}>
                  {filteredTransactions.length}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Empty state */}
          {!hasResults ? (
            <View style={styles.emptyStateWrap}>
              <View style={styles.emptyStateIconWrap}>
                <Ionicons
                  color={colors.text.tertiary}
                  name="receipt-outline"
                  size={sizes.icon.xxl}
                />
              </View>
              <Text style={styles.emptyStateTitle}>
                Aucune transaction trouvée
              </Text>
              <Text style={styles.emptyStateSubtitle}>
                {isSearching
                  ? 'Essayez un autre terme de recherche'
                  : 'Essayez de modifier vos filtres'}
              </Text>
              {isSearching || activeFilter !== 'all' ? (
                <PurpleButton
                  label="Réinitialiser les filtres"
                  onPress={() => {
                    setSearchQuery('');
                    setActiveFilter('all');
                  }}
                  size="sm"
                  style={styles.resetFiltersBtn}
                />
              ) : null}
            </View>
          ) : (
            <View style={styles.listSection}>
              {groupedTransactions.map((group) => (
                <View key={group.date} style={styles.groupSection}>
                  <View style={styles.groupHeaderRow}>
                    <View style={styles.groupHeaderLine} />
                    <Text style={styles.groupHeader}>{group.label}</Text>
                    <View style={styles.groupHeaderLine} />
                  </View>

                  {group.transactions.map((transaction, index) => {
                    const statusColors = statusColorMap[transaction.status];
                    const isLastInGroup =
                      index === group.transactions.length - 1;

                    return (
                      <View
                        key={transaction.id}
                        style={[
                          styles.transactionCard,
                          !isLastInGroup
                            ? styles.transactionCardGap
                            : undefined,
                        ]}
                      >
                        <View style={styles.transactionTopRow}>
                          <View style={styles.transactionLeftContent}>
                            <Text
                              numberOfLines={1}
                              style={styles.customerName}
                            >
                              {transaction.customer}
                            </Text>
                            <Text
                              numberOfLines={1}
                              style={styles.packageText}
                            >
                              {transaction.package}
                            </Text>
                          </View>

                          <View style={styles.transactionRightContent}>
                            <Text style={styles.amountText}>
                              {formatCurrency(transaction.amount)}
                            </Text>
                            <Text style={styles.commissionText}>
                              {`+${formatCurrency(transaction.commission)}`}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.transactionBottomRow}>
                          <View style={styles.dateTimeWrap}>
                            <Ionicons
                              color={colors.text.tertiary}
                              name="time-outline"
                              size={sizes.icon.xs}
                            />
                            <Text style={styles.dateTimeText}>
                              {`${group.label} • ${transaction.time}`}
                            </Text>
                          </View>

                          <View
                            style={[
                              styles.statusBadge,
                              {
                                backgroundColor: statusColors.background,
                                borderColor: statusColors.border,
                              },
                            ]}
                          >
                            <Ionicons
                              color={statusColors.text}
                              name={statusIconMap[transaction.status]}
                              size={10}
                            />
                            <Text
                              style={[
                                styles.statusBadgeText,
                                { color: statusColors.text },
                              ]}
                            >
                              {statusLabelMap[transaction.status]}
                            </Text>
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </View>
              ))}
            </View>
          )}

        </View>
      </ScreenContent>
    </ScreenShell>
  );
};

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
    marginBottom: spacing.lg,
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

  /* ── SEARCH — mirrors HomeScreen search bar ── */
  searchFieldWrap: {
    ...patterns.searchField,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: sizes.touch.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.primary[800],
    borderColor: colors.primary[900],
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    ...typography.bodyMD,
    color: colors.text.onPrimary,
    flex: 1,
    paddingVertical: spacing.sm,
  },
  clearSearch: {
    padding: spacing.xs,
  },

  /* ── FILTER PILLS — mirrors HomeScreen tab chips ── */
  filtersSection: {
    marginTop: spacing.md,
    ...patterns.screenPadding,
  },
  filterRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    paddingRight: spacing.sm,
  },
  filterPill: {
    backgroundColor: colors.gray[100],
    borderColor: colors.border,
    borderRadius: radii.full,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 1,
  },
  filterPillActive: {
    backgroundColor: colors.primary[100],
    borderColor: colors.primary.DEFAULT,
  },
  filterPillText: {
    ...typography.labelSM,
    color: colors.text.secondary,
    fontWeight: '700',
  },
  filterPillTextActive: {
    color: colors.primary.DEFAULT,
  },

  contentContainer: {
    flexGrow: 1,
    paddingTop: spacing.lg,
  },
  pagePadding: {
    ...patterns.screenPadding,
    flex: 1,
  },

  // Summary cards
  summaryRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  summaryCard: {
    ...patterns.card,
    borderTopWidth: 3,
    flex: 1,
    padding: spacing.md,
  },
  summaryCardLeft: {
    borderTopColor: colors.text.primary,
  },
  summaryCardRight: {
    borderTopColor: colors.primary.DEFAULT,
  },
  summaryIcon: {
    marginBottom: spacing.sm,
  },
  summaryLabel: {
    ...typography.bodySM,
    color: colors.text.secondary,
  },
  summaryValue: {
    ...typography.titleMD,
    color: colors.primary.DEFAULT,
    fontWeight: '700',
    marginTop: spacing.xs,
  },
  summaryValueDark: {
    ...typography.titleMD,
    color: colors.text.primary,
    fontWeight: '700',
    marginTop: spacing.xs,
  },
  summarySuccessText: {
    ...typography.bodySM,
    color: colors.success.DEFAULT,
    fontWeight: '600',
    marginTop: spacing.xs,
  },
  summarySecondaryText: {
    ...typography.bodySM,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },

  // Section divider
  sectionDivider: {
    alignItems: 'center',
    borderBottomColor: colors.divider,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
  },
  sectionDividerText: {
    ...typography.labelMD,
    color: colors.text.secondary,
    flex: 1,
  },
  resultCountBadge: {
    alignItems: 'center',
    backgroundColor: colors.primary[100],
    borderRadius: radii.full,
    height: 22,
    justifyContent: 'center',
    minWidth: 22,
    paddingHorizontal: spacing.xs,
  },
  resultCountText: {
    ...typography.labelSM,
    color: colors.primary.DEFAULT,
    fontWeight: '700',
  },

  // List
  listSection: {
    paddingBottom: spacing.md,
  },
  groupSection: {
    marginBottom: spacing.lg,
  },
  groupHeaderRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  groupHeaderLine: {
    backgroundColor: colors.divider,
    flex: 1,
    height: 1,
  },
  groupHeader: {
    ...typography.labelSM,
    color: colors.text.tertiary,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  transactionCard: {
    ...patterns.card,
    padding: spacing.md,
  },
  transactionCardGap: {
    marginBottom: spacing.md,
  },
  transactionTopRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  transactionLeftContent: {
    flex: 1,
    marginRight: spacing.md,
  },
  customerName: {
    ...typography.titleSM,
    color: colors.text.primary,
    fontWeight: '700',
  },
  packageText: {
    ...typography.bodySM,
    color: colors.text.secondary,
    marginTop: spacing.xxs,
  },
  transactionRightContent: {
    alignItems: 'flex-end',
  },
  amountText: {
    ...typography.bodyMD,
    color: colors.text.primary,
    fontWeight: '700',
  },
  commissionText: {
    ...typography.bodySM,
    color: colors.primary.DEFAULT,
    fontWeight: '600',
    marginTop: spacing.xxs,
  },
  transactionBottomRow: {
    alignItems: 'center',
    borderTopColor: colors.divider,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: spacing.sm,
  },
  dateTimeWrap: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    marginRight: spacing.sm,
  },
  dateTimeText: {
    ...typography.bodySM,
    color: colors.text.tertiary,
    marginLeft: spacing.xs,
  },
  statusBadge: {
    alignItems: 'center',
    borderRadius: radii.full,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xxs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  statusBadgeText: {
    ...typography.labelSM,
    fontWeight: '700',
  },

  // Empty state
  emptyStateWrap: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingVertical: spacing.xxxxl,
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
  resetFiltersBtn: {
    marginTop: spacing.lg,
  },
});