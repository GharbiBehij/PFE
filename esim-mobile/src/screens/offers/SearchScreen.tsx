import { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { DestinationCard } from '../../components/Cards/DestinationCard';
import { EmptyState } from '../../components/EmptyState';
import { ErrorBanner } from '../../components/ErrorBanner';
import { LoadingOverlay } from '../../components/LoadingOverlay';
import { ScreenContent, ScreenHeader, ScreenShell } from '../../components/layout';
import { useDestinations } from '../../hooks/client/useOffers';
import type { HomeStackParamList } from '../../navigation/types';
import { colors, patterns, radii, shadows, sizes, spacing, typography } from '../../theme';
import type { Destination } from '../../types/offer';

type Props = NativeStackScreenProps<HomeStackParamList, 'Search'>;

type CountrySearchDestination = {
  id: string;
  country: string;
  countryCode: string;
  region: string;
  startingPrice: number;
  coverageType: Destination['coverageType'];
  offerCount: number;
  price: number;
};

export const SearchScreen = ({ navigation }: Props) => {
  const [searchInput, setSearchInput] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedQuery(searchInput.trim()), 300);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  const destinationsQuery = useDestinations();

  const hasSearchQuery = debouncedQuery.length > 0;
  const destinations = useMemo(
    () => destinationsQuery.data ?? [],
    [destinationsQuery.data],
  );

  const countryResults = useMemo<CountrySearchDestination[]>(() => {
    const groupedByCountry = new Map<string, CountrySearchDestination>();

    destinations.forEach((destination: Destination) => {
      const country = destination.country.trim();
      if (!country) return;

      const key = country.toLowerCase();
      const safePrice = Number.isFinite(destination.startingPrice)
        ? destination.startingPrice
        : 0;
      const current = groupedByCountry.get(key);

      if (!current) {
        groupedByCountry.set(key, {
          id: `destination-${key}`,
          country,
          countryCode:
            destination.countryCode || country.slice(0, 2).toUpperCase(),
          region: destination.Region || 'Search',
          startingPrice: safePrice,
          coverageType: destination.coverageType,
          offerCount: 1,
          price: safePrice,
        });
        return;
      }

      current.offerCount += 1;

      if (safePrice < current.startingPrice) {
        current.startingPrice = safePrice;
        current.price = safePrice;
      }

      if (!current.countryCode && destination.countryCode) {
        current.countryCode = destination.countryCode;
      }

      if (!current.region && destination.Region) {
        current.region = destination.Region;
      }
    });

    const allCountries = Array.from(groupedByCountry.values()).sort((a, b) =>
      a.country.localeCompare(b.country),
    );

    if (!hasSearchQuery) return allCountries;

    const normalizedQuery = debouncedQuery.toLowerCase();
    return allCountries.filter((item) =>
      item.country.toLowerCase().includes(normalizedQuery),
    );
  }, [destinations, hasSearchQuery, debouncedQuery]);

const renderItem = ({ item }: { item: CountrySearchDestination }) => (
  <DestinationCard
    destination={{
      ...item,
      Region: item.region,        // ← map region → Region
      startingPrice: item.price,  // ← ensure startingPrice is set
    } as any}
    flagVariant="authentic"       // ← add this to use flagcdn images
    onPress={() =>
      navigation.navigate('PackageListing', {
        countryId: item.country,
        heroCountry: item.country,
      })
    }
  />
);

  return (
    <ScreenShell>
      <ScreenHeader style={styles.header}>
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={({ pressed }) => [
              styles.iconButton,
              pressed && styles.iconButtonPressed,
            ]}
          >
            <Ionicons
              color={colors.text.primary}
              name="arrow-back"
              size={sizes.icon.md}
            />
          </Pressable>

          <View style={styles.searchWrap}>
            <Ionicons
              color={colors.text.tertiary}
              name="search"
              size={sizes.icon.sm}
              style={styles.searchIcon}
            />
            <TextInput
              autoFocus
              onChangeText={setSearchInput}
              placeholder="Rechercher une offre eSIM"
              placeholderTextColor={colors.text.tertiary}
              style={styles.searchInput}
              value={searchInput}
            />
          </View>
        </View>
      </ScreenHeader>

      <ScreenContent scrollable={false}>
        <View style={styles.listSection}>
          {destinationsQuery.isLoading ? (
            <LoadingOverlay fullScreen={false} />
          ) : null}
          {destinationsQuery.isError ? (
            <View style={styles.bannerWrap}>
              <ErrorBanner
                message="Erreur lors du chargement des pays."
                onRetry={() => destinationsQuery.refetch()}
              />
            </View>
          ) : null}
          {!destinationsQuery.isLoading && !destinationsQuery.isError ? (
            <FlatList
              contentContainerStyle={styles.listContent}
              data={countryResults}
              keyExtractor={(item) => item.id}
              ListEmptyComponent={
                <EmptyState
                  title={
                    hasSearchQuery
                      ? 'Aucun pays trouvé'
                      : 'Aucun pays disponible'
                  }
                />
              }
              renderItem={renderItem}
              showsVerticalScrollIndicator={false}
            />
          ) : null}
        </View>
      </ScreenContent>
    </ScreenShell>
  );
};

const styles = StyleSheet.create({
  header: {
    ...patterns.headerShell,
    borderBottomLeftRadius: radii.card,
    borderBottomRightRadius: radii.card,
    paddingBottom: spacing.lg,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  iconButton: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.full,
    borderWidth: 1,
    height: sizes.touch.sm,
    justifyContent: 'center',
    width: sizes.touch.sm,
  },
  iconButtonPressed: {
    backgroundColor: colors.state.surfacePressed,
    transform: [{ scale: 0.98 }],
    ...shadows.low,
  },
  searchWrap: {
    ...patterns.searchField,
    flex: 1,
    minHeight: sizes.touch.sm,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    ...typography.bodyMD,
    color: colors.text.primary,
    flex: 1,
    paddingVertical: spacing[0],
  },
  listSection: {
    flex: 1,
    ...patterns.screenPadding,
    paddingTop: spacing.sm,
  },
  bannerWrap: {
    paddingBottom: spacing.md,
  },
  listContent: {
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
});