import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { PurpleButton } from '../../components/Buttons';
import { PackageCard } from '../../components/Cards/PackageCard';
import { ScreenContent, ScreenHeader, ScreenShell } from '../../components/layout';
import { useOffersByCountry } from '../../hooks/client/useOffers';
import type { EsimsStackParamList } from '../../navigation/types';
import { colors, patterns, radii, sizes, spacing, typography } from '../../theme';
import type { Offer } from '../../types/offer';

type Props = NativeStackScreenProps<EsimsStackParamList, 'TopupPackage'>;

type SortKey = 'popular' | 'price_asc' | 'price_desc' | 'data_desc';

const SORT_OPTIONS: { key: SortKey; label: string; icon: string }[] = [
  { key: 'popular',    label: 'Populaire', icon: 'star-outline' },
  { key: 'price_asc',  label: 'Prix ↑',    icon: 'arrow-up-outline' },
  { key: 'price_desc', label: 'Prix ↓',    icon: 'arrow-down-outline' },
  { key: 'data_desc',  label: 'Volume ↑',  icon: 'cellular-outline' },
];

const parseDataMb = (dataVolume: string): number => {
  const match = dataVolume.match(/([\d.]+)\s*(GB|MB|TB)/i);
  if (!match) return 0;
  const value = parseFloat(match[1] ?? '0');
  const unit = (match[2] ?? '').toUpperCase();
  if (unit === 'TB') return value * 1_000_000;
  if (unit === 'GB') return value * 1_000;
  return value;
};

const sortOffers = (offers: Offer[], key: SortKey): Offer[] => {
  const copy = [...offers];
  switch (key) {
    case 'price_asc':  return copy.sort((a, b) => a.price - b.price);
    case 'price_desc': return copy.sort((a, b) => b.price - a.price);
    case 'data_desc':  return copy.sort((a, b) => parseDataMb(b.dataVolume) - parseDataMb(a.dataVolume));
    default:           return copy.sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0));
  }
};

export const TopupPackageScreen = ({ navigation, route }: Props) => {
  const { esimId, country, region, coverageType } = route.params;
  const [selectedOfferId, setSelectedOfferId] = useState<number | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('popular');
  const [validityFilter, setValidityFilter] = useState<number | null>(null);

  const offersQuery = useOffersByCountry(
    coverageType === 'REGIONAL' ? region ?? country : country,
    coverageType,
  );

  const offers = useMemo(() => offersQuery.data ?? [], [offersQuery.data]);

  // Unique validity values from actual offers, ascending
  const validityOptions = useMemo(
    () => [...new Set(offers.map((o) => o.validityDays))].sort((a, b) => a - b),
    [offers],
  );

  // Apply validity filter then sort
  const filteredOffers = useMemo(() => {
    const base = validityFilter
      ? offers.filter((o) => o.validityDays === validityFilter)
      : offers;
    return sortOffers(base, sortKey);
  }, [offers, sortKey, validityFilter]);

  const hasOffers = !offersQuery.isLoading && !offersQuery.isError;
  const isEmpty = hasOffers && filteredOffers.length === 0 && offers.length > 0;

  return (
    <ScreenShell>
      <ScreenHeader style={styles.header}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => navigation.goBack()} style={styles.iconButton}>
            <Ionicons name="arrow-back" size={sizes.icon.md} color={colors.text.primary} />
          </Pressable>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Recharger</Text>
            <Text style={styles.headerSubtitle}>{country}</Text>
          </View>
          <View style={styles.iconButton} />
        </View>
      </ScreenHeader>

      {/* ── Filters — outside ScreenContent so they stay sticky-ish ── */}
      {hasOffers && offers.length > 0 ? (
        <View style={styles.filtersWrap}>
          {/* Sort chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRow}
          >
            {SORT_OPTIONS.map((opt) => {
              const active = sortKey === opt.key;
              return (
                <Pressable
                  key={opt.key}
                  onPress={() => setSortKey(opt.key)}
                  style={[styles.chip, active && styles.chipActive]}
                >
                  <Ionicons
                    name={opt.icon as any}
                    size={sizes.icon.xs}
                    color={active ? colors.primary.DEFAULT : colors.text.secondary}
                  />
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Validity chips — only rendered when multiple validity values exist */}
          {validityOptions.length > 1 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterRow}
              style={styles.validityRow}
            >
              <Pressable
                onPress={() => setValidityFilter(null)}
                style={[styles.validityChip, validityFilter === null && styles.validityChipActive]}
              >
                <Text style={[styles.validityChipText, validityFilter === null && styles.validityChipTextActive]}>
                  Tout
                </Text>
              </Pressable>
              {validityOptions.map((days) => {
                const active = validityFilter === days;
                return (
                  <Pressable
                    key={days}
                    onPress={() => setValidityFilter(active ? null : days)}
                    style={[styles.validityChip, active && styles.validityChipActive]}
                  >
                    <Text style={[styles.validityChipText, active && styles.validityChipTextActive]}>
                      {days} j
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          ) : null}

          {/* Result count */}
          <View style={styles.resultRow}>
            <Text style={styles.resultText}>
              {filteredOffers.length} forfait{filteredOffers.length !== 1 ? 's' : ''} disponible{filteredOffers.length !== 1 ? 's' : ''}
            </Text>
            {validityFilter !== null ? (
              <Pressable onPress={() => setValidityFilter(null)} style={styles.clearBtn}>
                <Ionicons name="close-circle" size={sizes.icon.xs} color={colors.text.tertiary} />
                <Text style={styles.clearBtnText}>Réinitialiser</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      ) : null}

      <ScreenContent contentContainerStyle={styles.content}>
        {/* Loading */}
        {offersQuery.isLoading ? (
          <View style={styles.stateCard}>
            <ActivityIndicator color={colors.primary.DEFAULT} size="large" />
            <Text style={styles.stateText}>Chargement des forfaits…</Text>
          </View>
        ) : null}

        {/* Error */}
        {offersQuery.isError ? (
          <View style={styles.stateCard}>
            <Ionicons name="cloud-offline-outline" size={sizes.icon.xxl} color={colors.text.tertiary} />
            <Text style={styles.stateText}>Impossible de charger les forfaits.</Text>
          </View>
        ) : null}

        {/* Empty filter result */}
        {isEmpty ? (
          <View style={styles.stateCard}>
            <Ionicons name="filter-outline" size={sizes.icon.xxl} color={colors.text.tertiary} />
            <Text style={styles.stateTitle}>Aucun forfait trouvé</Text>
            <Text style={styles.stateText}>Essayez un autre filtre de durée.</Text>
            <Pressable onPress={() => setValidityFilter(null)} style={styles.resetBtn}>
              <Text style={styles.resetBtnText}>Voir tous les forfaits</Text>
            </Pressable>
          </View>
        ) : null}

        {/* Offer list */}
        {hasOffers && !isEmpty
          ? filteredOffers.map((offer, index) => (
              <Animated.View key={offer.id} entering={FadeInDown.delay(index * 25).duration(220)}>
                <PackageCard
                  offer={offer}
                  selected={selectedOfferId === offer.id}
                  onPress={() => setSelectedOfferId(offer.id)}
                />
              </Animated.View>
            ))
          : null}
      </ScreenContent>

      <View style={patterns.actionBar}>
        <PurpleButton
          label="Continuer vers le paiement"
          disabled={!selectedOfferId}
          onPress={() => {
            if (!selectedOfferId) return;
            (navigation.getParent() as any)?.navigate('HomeTab', {
              screen: 'Payment',
              params: {
                packageId: String(selectedOfferId),
                mode: 'topup',
                esimId,
                offerId: selectedOfferId,
              },
            });
          }}
        />
      </View>
    </ScreenShell>
  );
};

const styles = StyleSheet.create({
  /* ── Header ── */
  header: { ...patterns.headerShell },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  iconButton: {
    width: sizes.iconWrap.sm,
    height: sizes.iconWrap.sm,
    borderRadius: radii.full,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { ...typography.titleMD, color: colors.text.primary, fontWeight: '700' },
  headerSubtitle: { ...typography.bodySM, color: colors.text.secondary, marginTop: spacing.xxs },

  /* ── Filters ── */
  filtersWrap: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  filterRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.gray[100],
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  chipActive: {
    backgroundColor: colors.primary[100],
    borderColor: colors.primary.DEFAULT,
  },
  chipText: {
    ...typography.labelSM,
    color: colors.text.secondary,
    fontWeight: '700',
  },
  chipTextActive: {
    color: colors.primary.DEFAULT,
  },

  validityRow: {
    marginTop: spacing.sm,
  },
  validityChip: {
    backgroundColor: colors.gray[100],
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  validityChipActive: {
    backgroundColor: colors.secondary[100],
    borderColor: colors.secondary[500],
  },
  validityChipText: {
    ...typography.labelSM,
    color: colors.text.secondary,
    fontWeight: '700',
  },
  validityChipTextActive: {
    color: colors.secondary[600],
  },

  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    marginTop: spacing.sm,
  },
  resultText: {
    ...typography.bodySM,
    color: colors.text.tertiary,
    fontWeight: '600',
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
  },
  clearBtnText: {
    ...typography.bodySM,
    color: colors.text.tertiary,
    fontWeight: '600',
  },

  /* ── Content ── */
  content: {
    ...patterns.screenPadding,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxxxxl,
  },

  /* ── States ── */
  stateCard: {
    ...patterns.card,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  stateTitle: {
    ...typography.titleSM,
    color: colors.text.primary,
    fontWeight: '700',
  },
  stateText: {
    ...typography.bodyMD,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  resetBtn: {
    marginTop: spacing.sm,
    backgroundColor: colors.primary[100],
    borderRadius: radii.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
  },
  resetBtnText: {
    ...typography.labelMD,
    color: colors.primary.DEFAULT,
    fontWeight: '700',
  },

});
