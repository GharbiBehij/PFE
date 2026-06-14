import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RegionCard } from '../../components/Cards/RegionCard';
import { DestinationCard } from '../../components/Cards/DestinationCard';
import { EmptyState } from '../../components/EmptyState';
import { ErrorBanner } from '../../components/ErrorBanner';
import { LoadingOverlay } from '../../components/LoadingOverlay';
import { ScreenContent, ScreenHeader, ScreenShell, Section } from '../../components/layout';
import { useDestinations } from '../../hooks/client/useOffers';
import type { HomeStackParamList } from '../../navigation/types';
import { colors, patterns, sizes, spacing, typography } from '../../theme';
import type { Destination } from '../../types/offer';

type Props = NativeStackScreenProps<HomeStackParamList, 'Destinations'>;

export const DestinationsScreen = ({ navigation }: Props) => {
  const destinationsQuery = useDestinations();
  const [activeRegion, setActiveRegion] = useState<string>('All');

  const destinations = destinationsQuery.data ?? [];
  const regions = useMemo(() => {
    const unique = Array.from(new Set(destinations.map((item) => item.Region).filter(Boolean)));
    return ['All', ...unique];
  }, [destinations]);

  const filteredDestinations = useMemo(() => {
    if (activeRegion === 'All') {
      return destinations;
    }

    return destinations.filter((item) => item.Region === activeRegion);
  }, [activeRegion, destinations]);

  const renderItem = ({ item }: { item: Destination }) => (
    <DestinationCard
      destination={item}
      onPress={() =>
        navigation.navigate('PackageListing', {
          countryId: item.country,
          heroCountry: item.country,
          //heroImageUrl: item.imageUrl,
        })
      }
    />
  );

  const listHeader = !destinationsQuery.isLoading && !destinationsQuery.isError ? (
    <>
      {/* ── Region grid (visible when no filter is active) ── */}
      {activeRegion === 'All' ? (
        <View style={styles.regionListSection}>
          <Text style={styles.regionGridLabel}>Explorer par région</Text>
          {regions
            .filter((r) => r !== 'All')
            .map((region) => (
              <RegionCard
                key={region}
                regionName={region}
                onPress={() => setActiveRegion(region)}
              />
            ))}
        </View>
      ) : (
        /* ── Active-filter chip with reset ── */
        <View style={styles.activeFilterRow}>
          <View style={styles.activeFilterChip}>
            <Text style={styles.activeFilterText}>{activeRegion}</Text>
            <Pressable
              accessibilityLabel="Supprimer le filtre"
              hitSlop={spacing.sm}
              onPress={() => setActiveRegion('All')}
              style={styles.clearBtn}
            >
              <Ionicons name="close-circle" size={sizes.icon.sm} color={colors.primary.DEFAULT} />
            </Pressable>
          </View>
        </View>
      )}

      {/* ── Results count row ── */}
      <View style={styles.resultsHeaderRow}>
        <Text style={styles.resultsTitle}>
          {activeRegion === 'All' ? 'Toutes les destinations' : activeRegion}
        </Text>
        <Text style={styles.resultsCount}>{filteredDestinations.length} résultat(s)</Text>
      </View>
    </>
  ) : null;

  return (
    <ScreenShell>
      <ScreenHeader style={styles.header}>
        <Text style={styles.sectionTitle}>Destinations</Text>
      </ScreenHeader>

      <ScreenContent scrollable={false}>
        {destinationsQuery.isLoading ? <LoadingOverlay fullScreen={false} /> : null}

        {destinationsQuery.isError ? (
          <Section style={styles.errorSection}>
            <ErrorBanner message="Impossible de charger les destinations." onRetry={() => destinationsQuery.refetch()} />
          </Section>
        ) : null}

        {!destinationsQuery.isLoading && !destinationsQuery.isError ? (
          <FlatList
            contentContainerStyle={styles.listContent}
            data={filteredDestinations}
            keyExtractor={(item) => item.id}
            ListEmptyComponent={<EmptyState title="Aucune destination disponible" />}
            ListHeaderComponent={listHeader}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
          />
        ) : null}
      </ScreenContent>
    </ScreenShell>
  );
};

const SECTION_PADDING = spacing.xl;

const styles = StyleSheet.create({
  header: {
    ...patterns.headerShell,
  },
  errorSection: {
    ...patterns.screenPadding,
    paddingTop: spacing.xl,
  },
  sectionTitle: {
    ...typography.titleSM,
    color: colors.text.primary,
    fontWeight: '700',
  },

  // ── Region list ────────────────────────────────────────────────────────────
  regionListSection: {
    paddingHorizontal: SECTION_PADDING,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
    gap: spacing.xl,
  },
  regionGridLabel: {
    ...typography.titleSM,
    color: colors.text.primary,
    fontWeight: '700',
    marginBottom: spacing.lg,
  },

  // ── Active-filter chip ─────────────────────────────────────────────────────
  activeFilterRow: {
    paddingHorizontal: SECTION_PADDING,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xs,
    flexDirection: 'row',
  },
  activeFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary[100],
    borderRadius: spacing.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  activeFilterText: {
    ...typography.bodyMD,
    color: colors.primary.DEFAULT,
    fontWeight: '600',
  },
  clearBtn: {
    padding: spacing.xs,
  },

  // ── Results header ─────────────────────────────────────────────────────────
  resultsHeaderRow: {
    ...patterns.sectionHeaderRow,
    paddingHorizontal: SECTION_PADDING,
    paddingBottom: spacing.md,
  },
  resultsTitle: {
    ...typography.titleSM,
    color: colors.text.primary,
    fontWeight: '700',
  },
  resultsCount: {
    ...typography.bodySM,
    color: colors.text.secondary,
  },

  listContent: {
    paddingBottom: spacing.xxl,
    paddingHorizontal: SECTION_PADDING,
    gap: spacing.xl,
  },
});
