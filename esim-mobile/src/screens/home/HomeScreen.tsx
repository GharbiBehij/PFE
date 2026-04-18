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

import { DestinationCard } from '../../components/DestinationCard';
import {
  ScreenContent,
  ScreenHeader,
  ScreenShell,
} from '../../components/layout';

import { useAuth } from '../../hooks/useAuth';
import { useDestinations } from '../../hooks/useOffers';
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
  { key: 'LOCAL', label: 'Local' },
  { key: 'REGIONAL', label: 'Regional' },
  { key: 'GLOBAL', label: 'Global' },
];

export const HomeScreen = ({ navigation }: Props) => {
  const tabBarHeight = useBottomTabBarHeight();
  const [activeTab, setActiveTab] = useState<HomeTab>('LOCAL');
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('right');
  const { user } = useAuth();

  const destinationsQuery = useDestinations();
  const accountName = `${user?.firstname ?? ''} ${user?.lastname ?? ''}`.trim()
    || user?.email?.split('@')[0]
    || 'Utilisateur';

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
          <Text numberOfLines={1} style={styles.headerTitle}>{`Bienvenue ${accountName}`}</Text>

          <Pressable style={styles.iconButton}>
            <Ionicons
              name="notifications-outline"
              size={sizes.icon.md}
              color={colors.text.onPrimary}
            />
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
            Search data packs...
          </Text>
        </Pressable>
      </ScreenHeader>

      <ScreenContent
        contentContainerStyle={{
          paddingBottom: tabBarHeight + spacing.xxl,
        }}
        showsVerticalScrollIndicator={false}
      >
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
          {destinationsQuery.isLoading && (
            <View style={styles.stateCard}>
              <ActivityIndicator
                color={colors.primary.DEFAULT}
              />
            </View>
          )}

          {!destinationsQuery.isLoading && (
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
                    onPress={() =>
                      navigation.navigate('PackageListing', {
                        countryId: item.country,
                      })
                    }
                  />
                </View>
              ))}
            </Animated.View>
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

  headerTitle: {
    ...typography.titleLG,
    color: colors.text.primary,
    flex: 1,
    marginRight: spacing.md,
  },

  iconButton: {
    height: sizes.touch.sm,
    width: sizes.touch.sm,
    borderRadius: radii.full,
    backgroundColor: colors.primary.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.medium,
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

  destinationCardGap: {
    marginBottom: spacing.md,
  },

  stateCard: {
    ...patterns.card,
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
});