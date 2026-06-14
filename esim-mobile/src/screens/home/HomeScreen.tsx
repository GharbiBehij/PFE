import { Ionicons } from '@expo/vector-icons';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  SlideInLeft,
  SlideInRight,
  SlideOutLeft,
  SlideOutRight,
} from 'react-native-reanimated';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { RegionCard } from '../../components/Cards/RegionCard';
import { DestinationCard } from '../../components/Cards/DestinationCard';
import { ErrorBanner } from '../../components/ErrorBanner';
import {
  ScreenContent,
  ScreenHeader,
  ScreenShell,
} from '../../components/layout';
import { SectionLabel } from '../../components/SectionLabel';

import { useAuth } from '../../hooks/client/useAuth';
import { useDestinations } from '../../hooks/client/useOffers';
import type { HomeStackParamList } from '../../navigation/types';
import { useNotificationInbox } from '../../hooks/client/useNotificationInbox';

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
  const [showNotifications, setShowNotifications] = useState(false);
  const inbox = useNotificationInbox();

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

          <Pressable
            style={styles.iconButton}
            onPress={() => {
              setShowNotifications(true);
              void inbox.markRead();
            }}
          >
            <Ionicons
              name="notifications-outline"
              size={sizes.icon.md}
              color={colors.primary.DEFAULT}
            />
            {inbox.unreadCount > 0 ? <View style={styles.notifBadge} /> : null}
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
          <SectionLabel>{sectionTitleByTab[activeTab]}</SectionLabel>
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
              {activeTab === 'REGIONAL' ? (
                /* ── Single-column list of RegionCards ── */
                <View>
                  {(() => {
                    const regions = Array.from(
                      new Map(filteredDestinations.map((d) => [d.Region, d])).values(),
                    );
                    return regions.map((item, index) => (
                      <View
                        key={item.Region}
                        style={index < regions.length - 1 ? styles.regionCardGap : undefined}
                      >
                        <RegionCard
                          regionName={item.Region}
                          onPress={() =>
                            navigation.navigate('PackageListing', {
                              countryId: item.Region,
                              coverageType: 'REGIONAL',
                            })
                          }
                        />
                      </View>
                    ));
                  })()}
                </View>
              ) : (
                filteredDestinations.map((item, index) => (
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
                        } else {
                          navigation.navigate('PackageListing', {
                            countryId: 'Mondial',
                            coverageType: 'GLOBAL',
                          });
                        }
                      }}
                    />
                  </View>
                ))
              )}
              </Animated.View>
          )}

          {!destinationsQuery.isLoading && !destinationsQuery.isError && filteredDestinations.length === 0 && (
            <View style={styles.stateCard}>
              <Text style={styles.emptyText}>Aucune destination disponible pour le moment.</Text>
            </View>
          )}
        </View>

      </ScreenContent>

      <Modal visible={showNotifications} transparent animationType="slide" onRequestClose={() => setShowNotifications(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Notifications</Text>
              <Pressable onPress={() => setShowNotifications(false)}><Ionicons name="close" size={20} color={colors.text.primary} /></Pressable>
            </View>
            <ScrollView contentContainerStyle={styles.modalList}>
              {inbox.items.length === 0 ? <Text style={styles.emptyText}>Aucune notification pour le moment.</Text> : null}
              {inbox.items.map((item) => (
                <View key={item.id} style={styles.notificationItem}>
                  <Text style={styles.notificationTitle}>{item.title}</Text>
                  <Text style={styles.notificationBody}>{item.body}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    marginBottom: spacing.xxs,
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
    top: spacing.sm,
    right: spacing.sm,
    width: spacing.sm,
    height: spacing.sm,
    borderRadius: radii.full,
    backgroundColor: colors.secondary.DEFAULT,
    borderWidth: 1,
    borderColor: colors.surface,
  },

  /* SEARCH */
  search: {
    ...patterns.searchField,
    minHeight: sizes.touch.lg,
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
    backgroundColor: colors.surfaceCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.card,
    padding: spacing.md,
    ...shadows.medium,
  },

  promoIcon: {
    width: sizes.avatar.md,
    height: sizes.avatar.md,
    borderRadius: radii.sm,
    backgroundColor: colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  promoEmoji: {
    fontSize: sizes.icon.md,
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
    marginTop: spacing.xxs,
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
    borderRadius: radii.full,
    padding: spacing.xxs,
    overflow: 'hidden',
    ...shadows.low,
  },

  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.full,
    minHeight: sizes.touch.sm,
    paddingVertical: spacing.xs,
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
    marginBottom: spacing.lg,
  },

  regionCardGap: {
    marginBottom: spacing.lg,
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
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: colors.overlay },
  modalSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    maxHeight: '70%',
    padding: spacing.lg,
  },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  modalTitle: { ...typography.titleSM, color: colors.text.primary, fontWeight: '700' },
  modalList: { gap: spacing.sm, paddingBottom: spacing.lg },
  notificationItem: { ...patterns.card, padding: spacing.md },
  notificationTitle: { ...typography.labelMD, color: colors.text.primary },
  notificationBody: { ...typography.bodySM, color: colors.text.secondary, marginTop: spacing.xs },
});
