import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Animated, {
  FadeInDown,
  FadeOut,
  SlideInLeft,
  SlideInRight,
  SlideOutLeft,
  SlideOutRight,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Group,
  ScreenContent,
  ScreenFooter,
  ScreenHeader,
  ScreenShell,
  Section,
} from '../../components/layout';
import { useOffersByCountry } from '../../hooks/useOffers';
import type { HomeStackParamList } from '../../navigation/types';
import {
  Animation,
  colors,
  patterns,
  radii,
  shadows,
  sizes,
  spacing,
  typography,
  zIndex,
} from '../../theme';
import type { Offer } from '../../types/offer';

type Props = NativeStackScreenProps<HomeStackParamList, 'PackageListing'>;
type PlanType = 'standard' | 'unlimited';

const DATA_THRESHOLD_MB = 25_000;

export const PackageListingScreen = ({ navigation, route }: Props) => {
  const { countryId, heroCountry } = route.params;
  const insets = useSafeAreaInsets();
  const offersQuery = useOffersByCountry(countryId);

  const [planType, setPlanType] = useState<PlanType>('standard');
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null);
  const [toggleDirection, setToggleDirection] = useState<'left' | 'right'>('right');

  useFocusEffect(
    useCallback(() => {
      navigation.getParent()?.setOptions({ tabBarStyle: { display: 'none' } });
      return () => {
        navigation.getParent()?.setOptions({ tabBarStyle: undefined });
      };
    }, [navigation]),
  );

  const filteredOffers = useMemo(() => {
    const offers = offersQuery.data ?? [];
    return offers.filter((offer) => {
      const volumeMb = parseDataVolumeToMb(offer.dataVolume);
      return planType === 'standard' ? volumeMb <= DATA_THRESHOLD_MB : volumeMb > DATA_THRESHOLD_MB;
    });
  }, [offersQuery.data, planType]);

  const groupedByDays = useMemo(() => groupOffersByDays(filteredOffers), [filteredOffers]);

  const sortedDays = useMemo(
    () => Object.keys(groupedByDays).map(Number).sort((a, b) => a - b),
    [groupedByDays],
  );

  const bestValueOfferId = useMemo<string | null>(() => {
    const bestOffer = findBestValueOffer(filteredOffers);
    return bestOffer ? bestOffer.id : null;
  }, [filteredOffers]);

  const isBottomActionsVisible = Boolean(selectedOfferId);

  useEffect(() => {
    if (!selectedOfferId) {
      return;
    }

    const stillVisible = filteredOffers.some((offer) => offer.id === selectedOfferId);
    if (!stillVisible) {
      setSelectedOfferId(null);
    }
  }, [filteredOffers, selectedOfferId]);

  const countryLabel = heroCountry ? toTitleCase(heroCountry) : toTitleCase(countryId);

  const handlePlanChange = (nextPlan: PlanType) => {
    if (nextPlan === planType) {
      return;
    }

    setToggleDirection(nextPlan === 'unlimited' ? 'right' : 'left');
    setPlanType(nextPlan);
  };

  const handleViewDetails = () => {
    if (!selectedOfferId) {
      return;
    }
    navigation.navigate('PackageDetail', { packageId: selectedOfferId });
  };

  const handleBuyNow = () => {
    if (!selectedOfferId) {
      return;
    }
    navigation.navigate('Payment', { packageId: selectedOfferId });
  };

  return (
    <ScreenShell>
      <ScreenHeader style={styles.headerShell}>
        <View style={styles.headerRow}>
          <Pressable
            accessibilityLabel="Retour"
            accessibilityRole="button"
            onPress={() => navigation.goBack()}
            style={({ pressed }) => [styles.iconButton, pressed ? styles.iconButtonPressed : undefined]}
          >
            <Ionicons color={colors.text.primary} name="arrow-back" size={sizes.icon.md} />
          </Pressable>

          <View style={styles.headerTitleWrap}>
            <Text numberOfLines={1} style={styles.headerTitle}>{countryLabel}</Text>
            <Text numberOfLines={1} style={styles.headerSubtitle}>
              {`${filteredOffers.length} forfaits disponibles`}
            </Text>
          </View>

          <Pressable
            accessibilityLabel="Ouvrir la recherche"
            accessibilityRole="button"
            onPress={() => navigation.navigate('Search')}
            style={({ pressed }) => [styles.iconButton, pressed ? styles.iconButtonPressed : undefined]}
          >
            <Ionicons color={colors.text.primary} name="search" size={sizes.icon.md} />
          </Pressable>
        </View>
      </ScreenHeader>

      <ScreenContent
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingBottom: isBottomActionsVisible
              ? Math.max(
                  spacing.xxxxxl + spacing.sm,
                  insets.bottom + spacing.xxxxxl + spacing.sm,
                )
              : spacing.xxl,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.pagePadding}>
          <Section>
            <View style={styles.planToggle}>
              <Pressable
                accessibilityLabel="Afficher les forfaits standard"
                accessibilityRole="button"
                accessibilityState={{ selected: planType === 'standard' }}
                onPress={() => handlePlanChange('standard')}
                style={styles.planOption}
              >
                {planType === 'standard' ? (
                  <Animated.View
                    entering={
                      toggleDirection === 'left'
                        ? SlideInLeft.duration(Animation.duration.fast)
                        : SlideInRight.duration(Animation.duration.fast)
                    }
                    exiting={FadeOut.duration(Animation.duration.fast)}
                    style={styles.planActiveBackground}
                  />
                ) : null}
                <Text style={[styles.planText, planType === 'standard' ? styles.planTextActive : undefined]}>
                  Standard
                </Text>
              </Pressable>

              <Pressable
                accessibilityLabel="Afficher les forfaits unlimited"
                accessibilityRole="button"
                accessibilityState={{ selected: planType === 'unlimited' }}
                onPress={() => handlePlanChange('unlimited')}
                style={styles.planOption}
              >
                {planType === 'unlimited' ? (
                  <Animated.View
                    entering={
                      toggleDirection === 'right'
                        ? SlideInRight.duration(Animation.duration.fast)
                        : SlideInLeft.duration(Animation.duration.fast)
                    }
                    exiting={FadeOut.duration(Animation.duration.fast)}
                    style={styles.planActiveBackground}
                  />
                ) : null}
                <Text style={[styles.planText, planType === 'unlimited' ? styles.planTextActive : undefined]}>
                  Unlimited
                </Text>
              </Pressable>
            </View>
          </Section>

          <Section style={styles.listSection}>
            {offersQuery.isLoading ? (
              <View style={styles.stateCard}>
                <ActivityIndicator color={colors.primary.DEFAULT} size="large" />
                <Text style={styles.stateText}>Chargement...</Text>
              </View>
            ) : null}

            {offersQuery.isError ? (
              <View style={styles.stateCard}>
                <Ionicons color={colors.error.DEFAULT} name="alert-circle-outline" size={sizes.icon.xxl} />
                <Text style={styles.stateText}>Erreur de chargement</Text>
                <Pressable
                  accessibilityLabel="Recharger les forfaits"
                  accessibilityRole="button"
                  onPress={() => offersQuery.refetch()}
                  style={({ pressed }) => [styles.retryButton, pressed ? styles.retryButtonPressed : undefined]}
                >
                  <Text style={styles.retryButtonText}>Reessayer</Text>
                </Pressable>
              </View>
            ) : null}

            {!offersQuery.isLoading && !offersQuery.isError && filteredOffers.length === 0 ? (
              <View style={styles.stateCard}>
                <Ionicons color={colors.text.tertiary} name="wifi-outline" size={sizes.icon.xxl} />
                <Text style={styles.stateText}>Aucun forfait disponible</Text>
              </View>
            ) : null}

            {!offersQuery.isLoading && !offersQuery.isError ? (
              <Animated.View
                entering={
                  toggleDirection === 'right'
                    ? SlideInRight.duration(Animation.duration.fast)
                    : SlideInLeft.duration(Animation.duration.fast)
                }
                exiting={
                  toggleDirection === 'right'
                    ? SlideOutLeft.duration(Animation.duration.fast)
                    : SlideOutRight.duration(Animation.duration.fast)
                }
                key={planType}
              >
                {sortedDays.map((days) => (
                  <Group key={days} style={styles.dayGroup}>
                    <View style={styles.dayHeaderRow}>
                      <Text style={styles.dayHeader}>{days === 1 ? '1 jour' : `${days} jours`}</Text>
                      <View style={styles.dayHeaderLine} />
                    </View>

                    {groupedByDays[days].map((offer, index) => (
                      <Animated.View
                        entering={FadeInDown.delay(index * 30).duration(Animation.duration.normal)}
                        key={offer.id}
                        style={index < groupedByDays[days].length - 1 ? styles.offerCardGap : undefined}
                      >
                        <Pressable
                          accessibilityLabel={`Choisir forfait ${formatData(offer.dataVolume)} ${offer.validityDays} jours`}
                          accessibilityHint="Affiche les actions details et buy now en bas d'ecran"
                          accessibilityRole="button"
                          accessibilityState={{ selected: selectedOfferId === offer.id }}
                          onPressIn={() => setSelectedOfferId(offer.id)}
                          onPress={() => setSelectedOfferId(offer.id)}
                          style={({ pressed }) => [
                            styles.offerPressable,
                            pressed ? styles.offerCardPressed : undefined,
                          ]}
                        >
                          <View
                            style={[
                              styles.offerCard,
                              selectedOfferId === offer.id ? styles.offerCardSelected : undefined,
                            ]}
                          >
                            <View style={styles.offerRow}>
                              <View style={styles.offerFlagWrap}>
                                <Ionicons
                                  color={selectedOfferId === offer.id ? colors.primary.DEFAULT : colors.text.secondary}
                                  name="cellular-outline"
                                  size={sizes.icon.sm}
                                />
                              </View>

                              <View style={styles.offerMainContent}>
                                <Text numberOfLines={1} style={styles.offerData}>{formatData(offer.dataVolume)}</Text>
                                <Text style={styles.offerMetaText}>{`${offer.validityDays} jours • 4G/5G`}</Text>
                              </View>

                              <View style={styles.offerPriceWrap}>
                                <Text style={styles.offerPriceLabel}>A partir de</Text>
                                <Text style={styles.offerPrice}>{formatPrice(offer.price, offer.currency)}</Text>
                              </View>

                              <View style={styles.offerChevronWrap}>
                                <Ionicons color={colors.primary.DEFAULT} name="chevron-forward" size={sizes.icon.sm} />
                              </View>
                            </View>

                            {offer.id === bestValueOfferId ? (
                              <View style={styles.bestValueBadge}>
                                <Text style={styles.bestValueText}>Meilleur</Text>
                              </View>
                            ) : null}
                          </View>
                        </Pressable>
                      </Animated.View>
                    ))}
                  </Group>
                ))}
              </Animated.View>
            ) : null}
          </Section>
        </View>
      </ScreenContent>

      {isBottomActionsVisible ? (
        <View style={styles.stickyWrap}>
          <ScreenFooter
            style={[styles.bottomBar, { paddingBottom: Math.max(spacing.md, insets.bottom + spacing.sm) }]}
          >
            <View style={styles.bottomRow}>
              <View style={styles.bottomActionSlot}>
                <Pressable
                  accessibilityLabel="Voir les details du forfait"
                  accessibilityRole="button"
                  onPress={handleViewDetails}
                  style={({ pressed }) => [
                    styles.bottomActionContainer,
                    styles.bottomActionContainerSecondary,
                    styles.bottomButton,
                    pressed ? styles.bottomButtonPressed : undefined,
                  ]}
                >
                  <Text style={styles.bottomButtonTextSecondary}>Details</Text>
                </Pressable>
              </View>

              <View style={styles.bottomActionSlot}>
                <Pressable
                  accessibilityLabel="Acheter le forfait selectionne"
                  accessibilityRole="button"
                  onPress={handleBuyNow}
                  style={({ pressed }) => [
                    styles.bottomActionContainer,
                    styles.bottomActionContainerPrimary,
                    styles.bottomButton,
                    pressed ? styles.bottomButtonPressed : undefined,
                  ]}
                >
                  <Text style={styles.bottomButtonTextPrimary}>Buy now</Text>
                </Pressable>
              </View>
            </View>
          </ScreenFooter>
        </View>
      ) : null}
    </ScreenShell>
  );
};

const groupOffersByDays = (offers: Offer[]) => {
  const grouped: Record<number, Offer[]> = {};
  offers.forEach((offer) => {
    if (!grouped[offer.validityDays]) {
      grouped[offer.validityDays] = [];
    }
    grouped[offer.validityDays].push(offer);
  });
  return grouped;
};

const findBestValueOffer = (offers: Offer[]): Offer | null => {
  let bestOffer: Offer | null = null;
  let bestRatio = Number.POSITIVE_INFINITY;

  offers.forEach((offer) => {
    const dataMb = parseDataVolumeToMb(offer.dataVolume);
    if (dataMb <= 0) {
      return;
    }

    const ratio = offer.price / dataMb;
    if (ratio < bestRatio) {
      bestRatio = ratio;
      bestOffer = offer;
    }
  });

  return bestOffer;
};

const parseDataVolumeToMb = (rawVolume: string) => {
  const value = rawVolume.trim().toUpperCase();

  if (value.includes('GB')) {
    const numeric = Number(value.replace('GB', '').trim());
    return Number.isFinite(numeric) ? numeric * 1024 : 0;
  }

  if (value.includes('MB')) {
    const numeric = Number(value.replace('MB', '').trim());
    return Number.isFinite(numeric) ? numeric : 0;
  }

  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
};

const formatData = (rawVolume: string) => {
  const normalized = rawVolume.trim().toUpperCase();

  if (normalized.includes('GB') || normalized.includes('MB')) {
    return normalized;
  }

  const value = Number(normalized);
  if (!Number.isFinite(value)) {
    return rawVolume;
  }

  if (value >= 1024) {
    const gb = value / 1024;
    return `${gb % 1 === 0 ? gb.toFixed(0) : gb.toFixed(1)}GB`;
  }

  return `${Math.round(value)}MB`;
};

const formatPrice = (price: number, currency?: string) => {
  const safeCurrency = (currency && currency.trim()) || 'TND';
  const amount = Number(price);

  if (!Number.isFinite(amount)) {
    return `0.00 ${safeCurrency}`;
  }

  return `${amount.toFixed(2)} ${safeCurrency}`;
};

const toTitleCase = (value: string) => {
  return value
    .split(' ')
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1).toLowerCase()}`)
    .join(' ');
};

const styles = StyleSheet.create({
  headerShell: {
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
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    ...typography.titleMD,
    color: colors.text.primary,
    fontWeight: '700',
  },
  headerSubtitle: {
    ...typography.bodyMD,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },

  scrollContent: {
    paddingTop: spacing.lg,
  },
  pagePadding: {
    ...patterns.screenPadding,
  },
  listSection: {
    marginBottom: spacing.xl,
  },

  planToggle: {
    backgroundColor: colors.surfaceCard,
    borderColor: colors.border,
    borderRadius: radii.card,
    borderWidth: 1,
    flexDirection: 'row',
    overflow: 'hidden',
    padding: spacing.xs,
    ...shadows.low,
  },
  planOption: {
    alignItems: 'center',
    borderRadius: radii.lg,
    flex: 1,
    justifyContent: 'center',
    minHeight: sizes.touch.sm,
    overflow: 'hidden',
    paddingVertical: spacing.sm,
    position: 'relative',
  },
  planActiveBackground: {
    backgroundColor: colors.primary.DEFAULT,
    borderRadius: radii.lg,
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  planText: {
    ...typography.bodyMD,
    color: colors.text.secondary,
    fontWeight: '600',
    zIndex: 1,
  },
  planTextActive: {
    color: colors.text.onPrimary,
    fontWeight: '700',
  },

  dayGroup: {
    marginBottom: spacing.xl,
  },
  dayHeaderRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  dayHeaderLine: {
    backgroundColor: colors.border,
    flex: 1,
    height: 1,
    marginLeft: spacing.md,
  },
  dayHeader: {
    ...typography.bodyLG,
    color: colors.text.primary,
    fontWeight: '700',
    paddingLeft: spacing.xs,
  },

  offerPressable: {
    ...patterns.pressableBase,
    marginBottom: spacing.md,
  },
  offerCardGap: {
    marginBottom: spacing.md,
  },
  offerCard: {
    ...patterns.card,
    minHeight: sizes.card.minHeight,
    padding: spacing.lg,
  },
  offerCardSelected: {
    ...patterns.selectedBorder,
    ...shadows.high,
  },
  offerCardPressed: {
    ...patterns.pressablePressed,
  },
  offerRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  offerFlagWrap: {
    alignItems: 'center',
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: radii.full,
    borderWidth: 1,
    height: sizes.avatar.lg,
    justifyContent: 'center',
    width: sizes.avatar.lg,
  },
  offerMainContent: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  offerData: {
    ...typography.bodyLG,
    color: colors.text.primary,
    fontWeight: '700',
  },
  offerMetaText: {
    ...typography.bodySM,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  offerPriceWrap: {
    alignItems: 'flex-end',
    marginRight: spacing.sm,
  },
  offerPriceLabel: {
    ...typography.bodySM,
    color: colors.text.secondary,
  },
  offerPrice: {
    ...typography.bodyMD,
    color: colors.primary.DEFAULT,
    fontWeight: '600',
    marginTop: spacing.xs,
  },
  offerChevronWrap: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.full,
    borderWidth: 1,
    height: sizes.avatar.sm,
    justifyContent: 'center',
    width: sizes.avatar.sm,
  },
  bestValueBadge: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.full,
    minHeight: sizes.badge.height,
    minWidth: sizes.badge.minWidth,
    paddingHorizontal: spacing.sm,
    position: 'absolute',
    right: spacing.sm,
    top: spacing.sm,
  },
  bestValueText: {
    ...typography.bodySM,
    color: colors.text.secondary,
    fontWeight: '700',
  },

  stateCard: {
    alignItems: 'center',
    backgroundColor: colors.surfaceCard,
    borderColor: colors.border,
    borderRadius: radii.card,
    borderWidth: 1,
    padding: spacing.lg,
    ...shadows.medium,
  },
  stateText: {
    ...typography.bodyLG,
    color: colors.text.secondary,
    fontWeight: '600',
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  retryButton: {
    alignItems: 'center',
    backgroundColor: colors.primary.DEFAULT,
    borderRadius: radii.lg,
    marginTop: spacing.md,
    minHeight: sizes.touch.sm,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  retryButtonPressed: {
    backgroundColor: colors.state.primaryPressed,
    transform: [{ scale: 0.98 }],
    ...shadows.low,
  },
  retryButtonText: {
    ...typography.labelMD,
    color: colors.text.onPrimary,
  },

  stickyWrap: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    zIndex: zIndex.sticky,
  },
  bottomBar: {
    ...patterns.screenPadding,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingTop: spacing.sm,
    ...shadows.medium,
  },
  bottomRow: {
    alignItems: 'stretch',
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  bottomActionSlot: {
    flex: 1,
  },
  bottomActionContainer: {
    borderRadius: radii.md,
    borderWidth: 2,
    minHeight: sizes.button.minHeight,
    overflow: 'hidden',
    padding: spacing[0],
    ...shadows.medium,
  },
  bottomActionContainerSecondary: {
    backgroundColor: colors.surface,
    borderColor: colors.primary.DEFAULT,
  },
  bottomActionContainerPrimary: {
    backgroundColor: colors.secondary.DEFAULT,
    borderColor: colors.secondary.dark,
  },
  bottomButton: {
    alignItems: 'center',
    borderRadius: radii.sm,
    justifyContent: 'center',
    minHeight: sizes.touch.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    width: '100%',
  },
  bottomButtonPressed: {
    transform: [{ scale: 0.98 }],
    ...shadows.low,
  },
  bottomButtonTextSecondary: {
    ...typography.bodyMD,
    color: colors.primary.DEFAULT,
    fontWeight: '700',
    textAlign: 'center',
  },
  bottomButtonTextPrimary: {
    ...typography.bodyMD,
    color: colors.text.primary,
    fontWeight: '700',
    textAlign: 'center',
  },
});
