import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { PrimaryButton } from '../../components/Cards/PrimaryCard';
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
  ScreenHeader,
  ScreenShell,
  Section,
} from '../../components/layout';
import { PackageCard } from '../../components/Cards/PackageCard';
import { useOffersByCountry } from '../../hooks/client/useOffers';
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
type PlanType = 'standard' | 'Illimité';

const DATA_THRESHOLD_MB = 25_000;

export const PackageListingScreen = ({ navigation, route }: Props) => {
  const { countryId, heroCountry, coverageType } = route.params;
  const insets = useSafeAreaInsets();
  const offersQuery = useOffersByCountry(countryId, coverageType);

  const [planType, setPlanType] = useState<PlanType>('standard');
  const [selectedOfferId, setSelectedOfferId] = useState<number | null>(null);
  const [toggleDirection, setToggleDirection] = useState<'left' | 'right'>('right');

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

  const bestValueOfferId = useMemo<number | null>(() => {
    const bestOffer = findBestValueOffer(filteredOffers);
    return bestOffer ? bestOffer.id : null;
  }, [filteredOffers]);

  const isBottomActionsVisible = selectedOfferId !== null;

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
    setToggleDirection(nextPlan === 'Illimité' ? 'right' : 'left');
    setPlanType(nextPlan);
  };

  const handleViewDetails = () => {
    if (selectedOfferId === null) {
      return;
    }
    navigation.navigate('PackageDetail', { packageId: String(selectedOfferId) });
  };

  const handleBuyNow = () => {
    if (selectedOfferId === null) {
      return;
    }
    navigation.navigate('Payment', { packageId: String(selectedOfferId) });
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
                        ? SlideInLeft.duration(Animation.duration.normal)
                        : SlideInRight.duration(Animation.duration.normal)
                    }
                    exiting={FadeOut.duration(Animation.duration.normal)}
                    style={styles.planActiveBackground}
                  />
                ) : null}
                <Text style={[styles.planText, planType === 'standard' ? styles.planTextActive : undefined]}>
                  Standard
                </Text>
              </Pressable>

              <Pressable
                accessibilityLabel="Afficher les forfaits illimités"
                accessibilityRole="button"
                accessibilityState={{ selected: planType === 'Illimité' }}
                onPress={() => handlePlanChange('Illimité')}
                style={styles.planOption}
              >
                {planType === 'Illimité' ? (
                  <Animated.View
                    entering={
                      toggleDirection === 'right'
                        ? SlideInRight.duration(Animation.duration.normal)
                        : SlideInLeft.duration(Animation.duration.normal)
                    }
                    exiting={FadeOut.duration(Animation.duration.normal)}
                    style={styles.planActiveBackground}
                  />
                ) : null}
                <Text style={[styles.planText, planType === 'Illimité' ? styles.planTextActive : undefined]}>
                  Illimité
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
                    ? SlideInRight.duration(Animation.duration.normal)
                    : SlideInLeft.duration(Animation.duration.normal)
                }
                exiting={
                  toggleDirection === 'right'
                    ? SlideOutLeft.duration(Animation.duration.normal)
                    : SlideOutRight.duration(Animation.duration.normal)
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
                      >
                        <PackageCard
                          offer={offer}
                          selected={selectedOfferId === offer.id}
                          isBestValue={offer.id === bestValueOfferId}
                          onPress={() => setSelectedOfferId(offer.id)}
                        />
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
  <View style={[patterns.actionBar, { paddingBottom: Math.max(spacing.md, insets.bottom) }]}>
    <PrimaryButton
      label="Détails"
      onPress={handleViewDetails}
    />
    <PrimaryButton
      label="Acheter maintenant"
      onPress={handleBuyNow}
    />
  </View>
) : null}
    </ScreenShell>
  );
};

// ─── Helpers ────────────────────────────────────────────────────────────────

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

const toTitleCase = (value: string) => {
  return value
    .split(' ')
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1).toLowerCase()}`)
    .join(' ');
};

// ─── Styles ─────────────────────────────────────────────────────────────────

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
    borderRadius: radii.card,
    flexDirection: 'row',
    padding: spacing.xs,
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
    bottom: spacing.xs,
    left: spacing.xs,
    position: 'absolute',
    right: spacing.xs,
    top: spacing.xs,
    ...shadows.medium,
  },
  planText: {
    ...typography.bodyMD,
    color: colors.primary.DEFAULT,
    fontWeight: '600',
    zIndex: 1,
  },
  planTextActive: {
    color: colors.white,
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
});