import { useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { DestinationCard } from '../../components/DestinationCard';
import { EmptyState } from '../../components/EmptyState';
import { ErrorBanner } from '../../components/ErrorBanner';
import { LoadingOverlay } from '../../components/LoadingOverlay';
import { Group, ScreenContent, ScreenHeader, ScreenShell, Section } from '../../components/layout';
import { useDestinations } from '../../hooks/useOffers';
import type { HomeStackParamList } from '../../navigation/types';
import { colors, patterns, radii, spacing, typography } from '../../theme';
import type { Destination } from '../../types/offer';

type Props = NativeStackScreenProps<HomeStackParamList, 'Destinations'>;

export const DestinationsScreen = ({ navigation }: Props) => {
  const destinationsQuery = useDestinations();
  const [activeRegion, setActiveRegion] = useState<string>('All');

  const destinations = destinationsQuery.data ?? [];
  const regions = useMemo(() => {
    const unique = Array.from(new Set(destinations.map((item) => item.region).filter(Boolean)));
    return ['All', ...unique];
  }, [destinations]);

  const filteredDestinations = useMemo(() => {
    if (activeRegion === 'All') {
      return destinations;
    }

    return destinations.filter((item) => item.region === activeRegion);
  }, [activeRegion, destinations]);

  const renderItem = ({ item }: { item: Destination }) => (
    <DestinationCard
      destination={item}
      onPress={() =>
        navigation.navigate('PackageListing', {
          countryId: item.country,
          heroCountry: item.country,
          heroImageUrl: item.imageUrl,
        })
      }
    />
  );

  return (
    <ScreenShell>
      <ScreenHeader style={styles.header}>
        <Text style={styles.sectionTitle}>Régions</Text>
      </ScreenHeader>

      <ScreenContent scrollable={false}>
        {destinationsQuery.isLoading ? <LoadingOverlay fullScreen={false} /> : null}

        {destinationsQuery.isError ? (
          <Section style={styles.errorSection}>
            <ErrorBanner message="Impossible de charger les destinations." onRetry={() => destinationsQuery.refetch()} />
          </Section>
        ) : null}

        {!destinationsQuery.isLoading && !destinationsQuery.isError ? (
          <>
            <Section style={styles.filtersSection}>
              <Group>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.regionRow}>
                    {regions.map((region) => {
                      const isActive = activeRegion === region;

                      return (
                        <Pressable key={region} onPress={() => setActiveRegion(region)} style={styles.regionChipPressable}>
                          {({ pressed }) => (
                            <View
                              style={[
                                styles.regionChip,
                                isActive ? styles.regionChipActive : styles.regionChipInactive,
                                pressed ? styles.regionChipPressed : undefined,
                              ]}
                            >
                              <Text style={[styles.regionChipText, isActive ? styles.regionChipTextActive : styles.regionChipTextInactive]}>
                                {region}
                              </Text>
                            </View>
                          )}
                        </Pressable>
                      );
                    })}
                  </View>
                </ScrollView>
              </Group>
            </Section>

            <Section style={styles.resultsSection}>
              <View style={styles.resultsHeaderRow}>
                <Text style={styles.resultsTitle}>
                  {activeRegion === 'All' ? 'Toutes les destinations' : activeRegion}
                </Text>
                <Text style={styles.resultsCount}>
                  {filteredDestinations.length} résultat(s)
                </Text>
              </View>
            </Section>

            <FlatList
              contentContainerStyle={styles.listContent}
              data={filteredDestinations}
              keyExtractor={(item) => item.id}
              ListEmptyComponent={<EmptyState title="Aucune destination disponible" />}
              renderItem={renderItem}
              showsVerticalScrollIndicator={false}
            />
          </>
        ) : null}
      </ScreenContent>
    </ScreenShell>
  );
};

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
  filtersSection: {
    ...patterns.screenPadding,
    paddingTop: spacing.xl,
  },
  regionRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    paddingBottom: spacing.sm,
  },
  regionChipPressable: {
    ...patterns.pressableBase,
  },
  regionChip: {
    ...patterns.unselectedBackground,
    ...patterns.unselectedBorder,
    borderRadius: radii.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  regionChipActive: {
    ...patterns.selectedBackground,
    ...patterns.selectedBorder,
  },
  regionChipInactive: {
    ...patterns.unselectedBackground,
    ...patterns.unselectedBorder,
  },
  regionChipPressed: {
    ...patterns.pressablePressed,
  },
  regionChipText: {
    ...typography.bodyMD,
    fontWeight: '600',
  },
  regionChipTextActive: {
    color: colors.primary.DEFAULT,
  },
  regionChipTextInactive: {
    color: colors.text.secondary,
  },
  resultsSection: {
    ...patterns.screenPadding,
    paddingTop: spacing.xl,
  },
  resultsHeaderRow: {
    ...patterns.sectionHeaderRow,
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
    ...patterns.screenPadding,
  },
});
