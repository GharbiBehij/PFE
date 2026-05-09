import { Ionicons } from '@expo/vector-icons';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  SlideInLeft,
  SlideInRight,
  SlideOutLeft,
  SlideOutRight,
} from 'react-native-reanimated';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { DestinationCard } from '../../components/Cards/DestinationCard';
import { ErrorBanner } from '../../components/ErrorBanner';
import {
  ScreenContent,
  ScreenHeader,
  ScreenShell,
} from '../../components/layout';

import { useAuth } from '../../hooks/client/useAuth';
import { useDestinations } from '../../hooks/client/useOffers';
import type { HomeStackParamList } from '../../navigation/types';

import {
  colors,
  patterns,
  radii,
  shadows,
  sizes,
  spacing,
  typography,
} from '../../theme';

type Props = NativeStackScreenProps<HomeStackParamList, 'Home'>;

type HomeTab = 'LOCAL' | 'REGIONAL' | 'GLOBAL';

const tabs: Array<{ key: HomeTab; label: string }> = [
  { key: 'LOCAL', label: 'Locale' },
  { key: 'REGIONAL', label: 'Régional' },
  { key: 'GLOBAL', label: 'Mondial' },
];

const sectionTitleByTab: Record<HomeTab, string> = {
  LOCAL: 'Destinations populaires',
  REGIONAL: 'Régions',
  GLOBAL: 'Forfaits mondiaux',
};

export const HomeScreen = ({ navigation }: Props) => {
  const tabBarHeight = useBottomTabBarHeight();
  const [activeTab, setActiveTab] = useState<HomeTab>('LOCAL');
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('right');
  const { user } = useAuth();

  const destinationsQuery = useDestinations();
  const accountName = `${user?.firstname ?? ''} ${user?.lastname ?? ''}`.trim()
    || user?.email?.split('@')[0]
    || 'Voyageur!';

  const filteredDestinations = useMemo(() => {
    const list = Array.isArray(destinationsQuery.data)
      ? destinationsQuery.data
      : [];

    return list.filter((d) => d.coverageType === activeTab);
  }, [activeTab, destinationsQuery.data]);

  const handleTabPress = (nextTab: HomeTab) => {
    if (nextTab === activeTab) {
      return;
    }

    const currentIndex = tabs.findIndex((tab) => tab.key === activeTab);
    const nextIndex = tabs.findIndex((tab) => tab.key === nextTab);

    setSlideDirection(nextIndex > currentIndex ? 'right' : 'left');
    setActiveTab(nextTab);
  };

  return (
    <ScreenShell>
      {/* 🔹 HEADER (sticky) */}
      <ScreenHeader style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.greetingBlock}>
            <Text style={styles.greetingSub}>Bonjour 👋</Text>
            <Text numberOfLines={1} style={styles.headerTitle}>{accountName}</Text>
          </View>

          <Pressable style={styles.iconButton}>
            <Ionicons
              name="notifications-outline"
              size={sizes.icon.md}
              color={colors.primary.DEFAULT}
            />
            <View style={styles.notifBadge} />
          </Pressable>
        </View>

        {/* SEARCH (PRIMARY) */}
        <Pressable
          onPress={() => navigation.navigate('Search')}
          style={styles.search}
        >
          <Ionicons
            name="search"
            size={sizes.icon.sm}
            color={colors.text.secondary}
          />
          <Text style={styles.searchText}>
            Rechercher un pays ou région
          </Text>
        </Pressable>
      </ScreenHeader>

      <ScreenContent
        contentContainerStyle={{
          paddingBottom: tabBarHeight + spacing.xxl,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* 🔹 PROMO STRIP */}
        <View style={styles.promoSection}>
          <Pressable style={styles.promoStrip}>
            <View style={styles.promoIcon}>
              <Text style={styles.promoEmoji}>🌍</Text>
            </View>
            <View style={styles.promoText}>
              <Text style={styles.promoTitle}>Europe illimitée — 39.90 TND</Text>
              <Text style={styles.promoSub}>30 pays · 15 jours · économisez 20 TND</Text>
            </View>
            <Ionicons name="chevron-forward" size={sizes.icon.sm} color={colors.primary.DEFAULT} />
          </Pressable>
        </View>

        {/* 🔹 FILTERS (SECONDARY) */}
        <View style={styles.filtersSection}>
          <View style={styles.tabsWrap}>
            {tabs.map((tab) => {
              const isActive = tab.key === activeTab;

              return (
                <Pressable
                  key={tab.key}
                  onPress={() => handleTabPress(tab.key)}
                  style={[
                    styles.tab,
                    isActive && styles.tabActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.tabText,
                      isActive && styles.tabTextActive,
                    ]}
                  >
                    {tab.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* 🔹 CONTENT (TERTIARY) */}
        <View style={styles.contentSection}>
          <Text style={styles.sectionTitle}>{sectionTitleByTab[activeTab]}</Text>
          {destinationsQuery.isLoading && (
            <View style={styles.stateCard}>
              <ActivityIndicator
                color={colors.primary.DEFAULT}
              />
            </View>
          )}

          {destinationsQuery.isError && (
            <View style={styles.stateCard}>
              <ErrorBanner
                message="Impossible de charger les destinations."
                onRetry={() => destinationsQuery.refetch()}
              />
            </View>
          )}

          {!destinationsQuery.isLoading && !destinationsQuery.isError && (
            <Animated.View
              key={activeTab}
              entering={
                slideDirection === 'right'
                  ? SlideInRight.duration(140)
                  : SlideInLeft.duration(140)
              }
              exiting={
                slideDirection === 'left'
                  ? SlideOutLeft.duration(140)
                  : SlideOutRight.duration(140)
              }
            >
              {filteredDestinations.map((item, index) => (
                <View
                  key={item.id}
                  style={index < filteredDestinations.length - 1 ? styles.destinationCardGap : undefined}
                >
                  <DestinationCard
                    destination={item}
                    flagVariant="authentic"
                    onPress={() => {
                      if (item.coverageType === 'LOCAL') {
                        navigation.navigate('PackageListing', {
                          countryId: item.country,
                        });
                      } else if (item.coverageType === 'REGIONAL') {
                        navigation.navigate('PackageListing', {
                          countryId: item.Region,
                          coverageType: 'REGIONAL',
                        });
                      } else {
                        navigation.navigate('PackageListing', {
                          countryId: 'Mondial',
                          coverageType: 'GLOBAL',
                        });
                      }
                    }}
                  />
                </View>
                ))}
              </Animated.View>
          )}

          {!destinationsQuery.isLoading && !destinationsQuery.isError && filteredDestinations.length === 0 && (
            <View style={styles.stateCard}>
              <Text style={styles.emptyText}>Aucune destination disponible pour le moment.</Text>
            </View>
          )}
        </View>

      </ScreenContent>
    </ScreenShell>
  );
};
const styles = StyleSheet.create({
  /* HEADER */
  header: {
    ...patterns.headerShell,
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
    color: colors.text.secondary,
    fontWeight: '500',
    marginBottom: 2,
  },

  headerTitle: {
    ...typography.titleLG,
    color: colors.text.primary,
  },

  iconButton: {
    height: sizes.touch.sm,
    width: sizes.touch.sm,
    borderRadius: radii.full,
    backgroundColor: colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.medium,
  },

  notifBadge: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 7,
    height: 7,
    borderRadius: radii.full,
    backgroundColor: colors.secondary.DEFAULT,
    borderWidth: 1.5,
    borderColor: colors.surface,
  },

  /* SEARCH */
  search: {
    ...patterns.searchField,
    minHeight: sizes.button.minHeight,
    paddingHorizontal: spacing.md,
  },

  searchText: {
    ...typography.bodyMD,
    color: colors.text.secondary,
    marginLeft: spacing.sm,
  },

  /* PROMO STRIP */
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

  promoEmoji: {
    fontSize: 18,
  },

  promoText: {
    flex: 1,
    minWidth: 0,
  },

  promoTitle: {
    ...typography.labelSM,
    color: colors.text.primary,
  },

  promoSub: {
    ...typography.bodySM,
    color: colors.text.secondary,
    marginTop: 2,
  },

  /* FILTERS */
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

  /* CONTENT */
  contentSection: {
    marginTop: spacing.xl, // 🔥 critical
    ...patterns.screenPadding,
  },

  sectionTitle: {
    ...typography.overline,
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },

  destinationCardGap: {
    marginBottom: spacing.md,
  },

  stateCard: {
    ...patterns.card,
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyText: {
    ...typography.bodyMD,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});
