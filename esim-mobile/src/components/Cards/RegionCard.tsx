import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, patterns, radii, sizes, spacing, typography } from '../../theme';

// ─── Props ────────────────────────────────────────────────────────────────────

type RegionCardProps = {
  /** Exact string from backend Destination.Region field */
  regionName: string;
  onPress: () => void;
};

// ─── Region theme ─────────────────────────────────────────────────────────────

type RegionTheme = {
  /** Globe emoji specific to this region */
  globe: string;
  /** Badge background — region start colour from the palette */
  color: string;
  /** Localised primary name (large text) */
  label: string;
  /** Localised subtitle displayed below the region name */
  subtitle: string;
};

const REGION_THEMES: Record<string, RegionTheme> = {
  'africa': {
    globe: '🌍',
    color: colors.region.africa.start,
    label: 'Afrique',
    subtitle: 'Continent africain',
  },
  'europe': {
    globe: '🌍',
    color: colors.region.europe.start,
    label: 'Europe',
    subtitle: 'Continent européen',
  },
  'middle east': {
    globe: '🌍',
    color: colors.region.middleEast.start,
    label: 'Moyen-Orient',
    subtitle: 'Asie occidentale',
  },
  'asia pacific': {
    globe: '🌏',
    color: colors.region.asiaPacific.start,
    label: 'Asie-Pacifique',
    subtitle: 'Asie & Océanie',
  },
  'americas': {
    globe: '🌎',
    color: colors.region.americas.start,
    label: 'Amériques',
    subtitle: 'Nord, Centre & Sud',
  },
  'north africa': {
    globe: '🌍',
    color: colors.region.northAfrica.start,
    label: 'Afrique du Nord',
    subtitle: 'Maghreb & Sahel',
  },
  'global': {
    globe: '🌐',
    color: colors.region.global.start,
    label: 'Mondial',
    subtitle: 'Couverture globale',
  },
};

const FALLBACK_THEME: RegionTheme = {
  globe: '🌐',
  color: colors.region.fallback.start,
  label: 'Régional',
  subtitle: 'Régional',
};

const getTheme = (name: string): RegionTheme =>
  REGION_THEMES[name.trim().toLowerCase()] ?? FALLBACK_THEME;

// ─── Component ────────────────────────────────────────────────────────────────

export const RegionCard = ({ regionName, onPress }: RegionCardProps) => {
  const theme = getTheme(regionName);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={regionName}
      accessibilityHint="Ouvre la liste des forfaits pour cette région"
      style={({ pressed }) => [styles.pressable, pressed && styles.pressablePressed]}
    >
      <View style={styles.card}>
        <View style={styles.row}>
          {/* ── Globe emoji ── */}
          <View style={styles.iconBadge}>
            <Text style={styles.globeEmoji}>{theme.globe}</Text>
          </View>

          {/* ── Name + subtitle ── */}
          <View style={styles.nameBlock}>
            <Text numberOfLines={1} style={styles.regionName}>{theme.label}</Text>
            <Text style={styles.subtitle}>{theme.subtitle}</Text>
          </View>

          {/* ── Chevron ── */}
          <View style={styles.chevronWrap}>
            <Ionicons
              name="chevron-forward"
              size={sizes.icon.sm}
              color={colors.primary.DEFAULT}
            />
          </View>
        </View>
      </View>
    </Pressable>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  pressable: {
    ...patterns.pressableBase,
  },
  pressablePressed: {
    ...patterns.pressablePressed,
  },

  card: {
    ...patterns.card,
    padding: spacing.lg,
  },

  row: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: sizes.touch.lg,
  },

  // ── Coloured globe badge (region colour + emoji) ─────────────────────────────
  iconBadge: {
    width: sizes.touch.lg,
    height: sizes.touch.lg,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  globeEmoji: {
    fontSize: sizes.icon.xl,
    lineHeight: sizes.icon.xl + spacing.xs,
    textAlign: 'center',
  },

  // ── Text ─────────────────────────────────────────────────────────────────────
  nameBlock: {
    flex: 1,
    marginLeft: spacing.sm,
    gap: spacing.xs,
  },
  regionName: {
    ...typography.bodyLG,
    color: colors.text.primary,
    fontWeight: '700',
  },
  subtitle: {
    ...typography.bodySM,
    color: colors.text.secondary,
  },
  // ── Chevron ──────────────────────────────────────────────────────────────────
  chevronWrap: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.full,
    height: sizes.avatar.sm,
    justifyContent: 'center',
    width: sizes.avatar.sm,
  },
});
