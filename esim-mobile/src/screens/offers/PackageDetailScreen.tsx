import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ErrorBanner } from '../../components/ErrorBanner';
import { LoadingOverlay } from '../../components/LoadingOverlay';
import { PrimaryButton } from '../../components/Cards/PrimaryCard';
import { ScreenContent, ScreenHeader, ScreenShell } from '../../components/layout';
import { useOfferDetail } from '../../hooks/client/useOffers';
import type { HomeStackParamList } from '../../navigation/types';
import { colors, patterns, radii, shadows, sizes, spacing, typography } from '../../theme';

type Props = NativeStackScreenProps<HomeStackParamList, 'PackageDetail'>;

export const PackageDetailScreen = ({ navigation, route }: Props) => {
  const { packageId } = route.params;
  const insets = useSafeAreaInsets();
  const offerQuery = useOfferDetail(packageId);

  if (offerQuery.isLoading) {
    return (
      <ScreenShell>
        <ScreenContent scrollable={false}>
          <LoadingOverlay />
        </ScreenContent>
      </ScreenShell>
    );
  }

  if (offerQuery.isError || !offerQuery.data) {
    return (
      <ScreenShell>
        <ScreenContent scrollable={false}>
          <View style={styles.centeredState}>
            <ErrorBanner
              message="Impossible de charger les détails du forfait."
              onRetry={() => offerQuery.refetch()}
            />
          </View>
        </ScreenContent>
      </ScreenShell>
    );
  }

  const offer = offerQuery.data;

  return (
    <ScreenShell>
      <ScreenHeader style={styles.headerShell}>
        <View style={styles.headerTopRow}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={({ pressed }) => [styles.headerIconButton, pressed ? styles.headerIconButtonPressed : undefined]}
          >
            <Ionicons color={colors.text.primary} name="arrow-back" size={sizes.icon.md} />
          </Pressable>

          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>Détails du forfait</Text>
            <Text style={styles.headerSubtitle}>{offer.country}</Text>
          </View>

          <View style={styles.headerRightSpacer} />
        </View>
      </ScreenHeader>

      <ScreenContent
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={[colors.primary.DEFAULT, colors.primary.dark]}
          end={{ x: 1, y: 1 }}
          start={{ x: 0, y: 0 }}
          style={styles.gradientCard}
        >
          <View style={styles.gradientTopRow}>
            <Ionicons color={colors.text.onPrimary} name="globe-outline" size={sizes.icon.lg} />
            <Text style={styles.gradientCountry}>{offer.country.toUpperCase()}</Text>
          </View>
          <Text style={styles.gradientData}>{formatData(offer.dataVolume)}</Text>
          <View style={styles.validityBadge}>
            <Text style={styles.validityText}>{formatDays(offer.validityDays)}</Text>
          </View>
        </LinearGradient>

        <View style={styles.sectionHeader}>
          <Text style={styles.includedTitle}>Ce qui est inclus</Text>
          <View style={styles.sectionBadge}>
            <Text style={styles.sectionBadgeText}>Premium</Text>
          </View>
        </View>

        <View style={styles.card}>
          {[
            'Donnees 4G/5G haute vitesse',
            `Valable ${formatDays(offer.validityDays)}`,
            'Partage de connexion active',
            'Activation instantanee',
            "Sans frais d'itinerance",
            'Support 24h/24 7j/7',
          ].map((feature, index, all) => (
            <View
              key={feature}
              style={[styles.featureRow, index !== all.length - 1 ? styles.featureRowBorder : undefined]}
            >
              <View style={styles.checkWrap}>
                <Ionicons color={colors.success.DEFAULT} name="checkmark" size={sizes.icon.sm} />
              </View>
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>

        <View style={styles.warningBox}>
          <Ionicons
            color={colors.warning.DEFAULT}
            name="information-circle"
            size={sizes.icon.md}
            style={styles.warningIcon}
          />
          <Text style={styles.warningText}>
            Votre forfait demarrera automatiquement lorsque vous vous connecterez au reseau.
          </Text>
        </View>
      </ScreenContent>

      <View style={[patterns.actionBar, { paddingBottom: Math.max(spacing.md, insets.bottom) }]}>
        <PrimaryButton
          label="Continuer"
          onPress={() => navigation.navigate('Payment', { packageId: String(offer.id) })}
        />
      </View>
    </ScreenShell>
  );
};

const formatData = (dataVolume: string) => {
  const normalized = dataVolume.trim().toUpperCase();
  if (normalized.includes('GB') || normalized.includes('MB')) return normalized;
  const numeric = Number(normalized);
  if (!Number.isFinite(numeric)) return dataVolume;
  if (numeric >= 1024) return `${(numeric / 1024).toFixed(numeric % 1024 === 0 ? 0 : 1)}GB`;
  return `${Math.round(numeric)}MB`;
};

const formatDays = (days: number) => (days === 1 ? '1 jour' : `${days} jours`);

const styles = StyleSheet.create({
  centeredState: {
    alignItems: 'center',
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: 'center',
    ...patterns.screenPadding,
  },
  headerShell: {
    ...patterns.headerShell,
    borderBottomLeftRadius: radii.card,
    borderBottomRightRadius: radii.card,
  },
  headerTopRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  headerIconButton: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.full,
    borderWidth: 1,
    height: sizes.touch.sm,
    justifyContent: 'center',
    width: sizes.touch.sm,
  },
  headerIconButtonPressed: {
    backgroundColor: colors.state.surfacePressed,
    ...patterns.pressablePressed,
  },
  headerTitleWrap: {
    flex: 1,
    marginHorizontal: spacing.md,
  },
  headerTitle: {
    ...typography.titleMD,
    color: colors.text.primary,
  },
  headerSubtitle: {
    ...typography.bodyMD,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  headerRightSpacer: {
    width: sizes.touch.sm,
  },
  scrollContent: {
    ...patterns.screenPadding,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxxxxl + spacing.xxl,
  },
  gradientCard: {
    ...patterns.card,
    borderRadius: radii.xl,
    borderWidth: 0,
    marginBottom: spacing.xl,
    padding: spacing.xl,
    ...shadows.high,
  },
  gradientTopRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  gradientCountry: {
    ...typography.labelSM,
    color: colors.text.onPrimary,
    fontWeight: '600',
    letterSpacing: 1,
    marginLeft: spacing.sm,
  },
  gradientData: {
    ...typography.displayLG,
    color: colors.text.onPrimary,
    marginBottom: spacing.sm,
  },
  validityBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary[100],
    borderColor: colors.primary[200],
    borderRadius: radii.full,
    borderWidth: 1,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  validityText: {
    ...typography.labelMD,
    color: colors.primary.DEFAULT,
  },
  sectionHeader: {
    ...patterns.sectionHeaderRow,
  },
  includedTitle: {
    ...typography.titleSM,
    color: colors.text.primary,
  },
  sectionBadge: {
    backgroundColor: colors.primary[100],
    borderColor: colors.primary.DEFAULT,
    borderRadius: radii.full,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  sectionBadgeText: {
    ...typography.bodySM,
    color: colors.primary.DEFAULT,
    fontWeight: '700',
  },
  card: {
    ...patterns.card,
    padding: spacing.lg,
  },
  featureRow: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingVertical: spacing.md,
  },
  featureRowBorder: {
    borderBottomColor: colors.divider,
    borderBottomWidth: 1,
  },
  checkWrap: {
    alignItems: 'center',
    backgroundColor: colors.success[50],
    borderRadius: radii.full,
    height: sizes.icon.lg,
    justifyContent: 'center',
    marginRight: spacing.sm,
    width: sizes.icon.lg,
  },
  featureText: {
    ...typography.bodyLG,
    color: colors.text.secondary,
    flex: 1,
  },
  warningBox: {
    alignItems: 'flex-start',
    backgroundColor: colors.borderSubtle,
    borderColor: colors.warning.DEFAULT,
    borderRadius: radii.lg,
    borderWidth: 1,
    flexDirection: 'row',
    marginTop: spacing.xl,
    padding: spacing.md,
  },
  warningIcon: {
    marginTop: spacing.xs,
  },
  warningText: {
    ...typography.bodySM,
    color: colors.text.secondary,
    flex: 1,
    marginLeft: spacing.sm,
  },
});