import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOut, SlideInLeft, SlideInRight } from 'react-native-reanimated';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { EsimCard } from '../../components/EsimCard';
import { ScreenContent, ScreenHeader, ScreenShell, Section } from '../../components/layout';
import { useUserEsims } from '../../hooks/useEsims';
import type { EsimsStackParamList } from '../../navigation/types';
import { Animation, colors, patterns, radii, shadows, sizes, spacing, typography } from '../../theme';
import type { Esim } from '../../types/esim';

type Props = NativeStackScreenProps<EsimsStackParamList, 'MyEsims'>;

type TabKey = 'ACTIVE' | 'HISTORY';

const activeStatuses = new Set(['ACTIVE', 'NOT_ACTIVE']);

export const MyEsimsScreen = ({ navigation }: Props) => {
  const [selectedTab, setSelectedTab] = useState<TabKey>('ACTIVE');
  const [toggleDirection, setToggleDirection] = useState<'left' | 'right'>('left');
  const esimsQuery = useUserEsims();
  const allEsims = Array.isArray(esimsQuery.data) ? esimsQuery.data : [];

  useFocusEffect(
    useCallback(() => {
      void esimsQuery.refetch();
    }, [esimsQuery.refetch]),
  );

  const activeCount = allEsims.filter((item) => activeStatuses.has(item.status)).length;
  const historyCount = allEsims.length - activeCount;

  const handleTabChange = useCallback(
    (nextTab: TabKey) => {
      if (nextTab === selectedTab) {
        return;
      }
      setToggleDirection(nextTab === 'HISTORY' ? 'right' : 'left');
      setSelectedTab(nextTab);
    },
    [selectedTab],
  );

  const filteredEsims = useMemo(() => {
    return allEsims.filter((item) => {
      if (selectedTab === 'ACTIVE') {
        return activeStatuses.has(item.status);
      }
      return !activeStatuses.has(item.status);
    });
  }, [allEsims, selectedTab]);

  const renderItem = ({ index, item }: { index: number; item: Esim }) => (
    <Animated.View
      entering={FadeInDown.delay(index * (Animation.duration.fast / 3)).duration(Animation.duration.normal)}
    >
      <EsimCard esim={item} onPress={() => navigation.navigate('EsimDetail', { esimId: item.id })} />
    </Animated.View>
  );

  const renderEmpty = () => {
    if (esimsQuery.isLoading) {
      return (
        <View style={styles.stateCard}>
          <ActivityIndicator color={colors.primary.DEFAULT} size="large" />
        </View>
      );
    }

    if (esimsQuery.isError) {
      return (
        <View style={styles.stateCard}>
          <Ionicons color={colors.error.DEFAULT} name="alert-circle-outline" size={sizes.touch.sm} />
          <Text style={styles.stateTitle}>Impossible de charger vos eSIMs</Text>
          <Pressable
            onPress={() => esimsQuery.refetch()}
            style={({ pressed }) => [styles.retryButton, pressed ? styles.retryButtonPressed : undefined]}
          >
            <Text style={styles.retryText}>Réessayer</Text>
          </Pressable>
        </View>
      );
    }

    return (
      <View style={styles.stateCard}>
        <Ionicons color={colors.text.tertiary} name="planet-outline" size={sizes.touch.sm} />
        <Text style={styles.stateTitle}>
          {selectedTab === 'ACTIVE' ? 'Aucune eSIM active' : 'Historique vide'}
        </Text>
        {selectedTab === 'ACTIVE' ? (
          <Pressable
            onPress={() => navigation.getParent()?.navigate('HomeTab' as never)}
            style={({ pressed }) => [styles.retryButton, pressed ? styles.retryButtonPressed : undefined]}
          >
            <Text style={styles.retryText}>Parcourir les offres</Text>
          </Pressable>
        ) : null}
      </View>
    );
  };

  return (
    <ScreenShell>
      <ScreenHeader style={styles.headerShell}>
        <View style={styles.headerContainer}>
          <Text style={styles.title}>Mes eSIMs</Text>

          <View style={styles.tabSelectorContainer}>
            <Pressable
              accessibilityLabel="Afficher les eSIMs actives"
              accessibilityRole="button"
              accessibilityState={{ selected: selectedTab === 'ACTIVE' }}
              onPress={() => handleTabChange('ACTIVE')}
              style={styles.tabOption}
            >
              {selectedTab === 'ACTIVE' ? (
                <Animated.View
                  entering={
                    toggleDirection === 'left'
                      ? SlideInLeft.duration(Animation.duration.fast)
                      : SlideInRight.duration(Animation.duration.fast)
                  }
                  exiting={FadeOut.duration(Animation.duration.fast)}
                  style={styles.tabActiveBackground}
                />
              ) : null}
              <Text style={[styles.tabText, selectedTab === 'ACTIVE' ? styles.tabTextActive : undefined]}>
                Actif ({activeCount})
              </Text>
            </Pressable>
            <Pressable
              accessibilityLabel="Afficher l'historique des eSIMs"
              accessibilityRole="button"
              accessibilityState={{ selected: selectedTab === 'HISTORY' }}
              onPress={() => handleTabChange('HISTORY')}
              style={styles.tabOption}
            >
              {selectedTab === 'HISTORY' ? (
                <Animated.View
                  entering={
                    toggleDirection === 'right'
                      ? SlideInRight.duration(Animation.duration.fast)
                      : SlideInLeft.duration(Animation.duration.fast)
                  }
                  exiting={FadeOut.duration(Animation.duration.fast)}
                  style={styles.tabActiveBackground}
                />
              ) : null}
              <Text style={[styles.tabText, selectedTab === 'HISTORY' ? styles.tabTextActive : undefined]}>
                Historique ({historyCount})
              </Text>
            </Pressable>
          </View>
        </View>
      </ScreenHeader>

      <ScreenContent scrollable={false}>
        <Section style={styles.sectionHeaderSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {selectedTab === 'ACTIVE' ? 'eSIMs actives' : 'Historique des eSIMs'}
            </Text>
            {!esimsQuery.isLoading && !esimsQuery.isError ? (
              <Text style={styles.viewAll}>{filteredEsims.length} élément(s)</Text>
            ) : null}
          </View>
        </Section>

        <FlatList
          contentContainerStyle={styles.listContent}
          data={esimsQuery.isError || esimsQuery.isLoading ? [] : filteredEsims}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={renderEmpty}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
        />
      </ScreenContent>
    </ScreenShell>
  );
};

const headerShadow = {
  shadowColor: shadows.high.shadowColor,
  shadowOffset: {
    width: shadows.high.shadowOffset.width,
    height: Math.round((shadows.medium.shadowOffset.height + shadows.high.shadowOffset.height) / 2),
  },
  shadowOpacity: (shadows.medium.shadowOpacity + shadows.high.shadowOpacity) / 2,
  shadowRadius: Math.round((shadows.medium.shadowRadius + shadows.high.shadowRadius) / 2),
  elevation: Math.round((shadows.medium.elevation + shadows.high.elevation) / 2),
} as const;

const styles = StyleSheet.create({
  headerShell: {
    ...patterns.headerShell,
    ...headerShadow,
    borderBottomLeftRadius: radii.card,
    borderBottomRightRadius: radii.card,
    paddingBottom: spacing.lg,
  },
  headerContainer: {
    ...patterns.screenPadding,
  },
  title: {
    ...typography.titleMD,
    color: colors.text.primary,
    fontWeight: '700',
  },
  tabSelectorContainer: {
    backgroundColor: colors.surfaceCard,
    borderColor: colors.border,
    borderRadius: radii.card,
    borderWidth: 1,
    flexDirection: 'row',
    marginTop: spacing.lg,
    overflow: 'hidden',
    padding: spacing.xs,
    ...shadows.low,
  },
  tabOption: {
    alignItems: 'center',
    borderRadius: radii.lg,
    flex: 1,
    justifyContent: 'center',
    minHeight: sizes.touch.sm,
    overflow: 'hidden',
    paddingVertical: spacing.sm,
    position: 'relative',
  },
  tabActiveBackground: {
    backgroundColor: colors.primary.DEFAULT,
    borderRadius: radii.lg,
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  tabText: {
    ...typography.bodyMD,
    color: colors.text.secondary,
    fontWeight: '600',
    zIndex: 1,
  },
  tabTextActive: {
    color: colors.text.onPrimary,
    fontWeight: '700',
  },
  sectionHeader: {
    ...patterns.sectionHeaderRow,
    ...patterns.screenPadding,
  },
  sectionHeaderSection: {
    paddingTop: spacing.xl,
  },
  sectionTitle: {
    ...typography.titleSM,
    color: colors.text.primary,
  },
  viewAll: {
    ...typography.bodyMD,
    color: colors.primary.DEFAULT,
    fontWeight: '600',
  },
  stateCard: {
    ...patterns.card,
    alignItems: 'center',
    marginHorizontal: spacing[0],
    marginTop: spacing.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  stateTitle: {
    ...typography.bodyLG,
    color: colors.text.secondary,
    fontWeight: '600',
    marginTop: spacing.md,
  },
  retryButton: {
    backgroundColor: colors.primary.DEFAULT,
    borderRadius: radii.md,
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  retryButtonPressed: {
    backgroundColor: colors.primary.dark,
    transform: [{ scale: 0.98 }],
    ...shadows.low,
  },
  retryText: {
    ...typography.labelMD,
    color: colors.text.onPrimary,
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: spacing.xxl,
    ...patterns.screenPadding,
  },
  listBody: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
});
