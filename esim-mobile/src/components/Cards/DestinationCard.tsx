import { useEffect, useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, patterns, radii, shadows, sizes, spacing, typography } from '../../theme';
import type { Destination } from '../../types/offer';

type DestinationCardProps = {
  destination: Destination;
  onPress: () => void;
  flagVariant?: 'default' | 'authentic';
};

// ─── Helpers (must be above component for Hermes compatibility) ──────────────

type DestinationWithPrice = Destination & { price?: number };

const getStartingPrice = (destination: Destination): number => {
  const fallbackPrice = (destination as DestinationWithPrice).price;
  const numeric = Number(destination.startingPrice ?? fallbackPrice);
  return Number.isFinite(numeric) ? numeric : 0;
};

const getCoverageLabel = (coverageType: Destination['coverageType']): string => {
  if (coverageType === 'REGIONAL') return 'Régional';
  if (coverageType === 'GLOBAL') return 'Mondial';
  return 'Locale';
};

const getCountryFlag = (country: string): string => {
  const flagMap: Record<string, string> = {
    // ── Local countries ──────────────────────────────────────
    Tunisia: '🇹🇳',
    France: '🇫🇷',
    Germany: '🇩🇪',
    Spain: '🇪🇸',
    Italy: '🇮🇹',
    'United Kingdom': '🇬🇧',
    UK: '🇬🇧',
    Morocco: '🇲🇦',
    Egypt: '🇪🇬',
    'United Arab Emirates': '🇦🇪',
    UAE: '🇦🇪',
    Dubai: '🇦🇪',
    'Saudi Arabia': '🇸🇦',
    Japan: '🇯🇵',
    'South Korea': '🇰🇷',
    Thailand: '🇹🇭',
    'United States': '🇺🇸',
    USA: '🇺🇸',
    Canada: '🇨🇦',
    Brazil: '🇧🇷',
    Turkey: '🇹🇷',
    Poland: '🇵🇱',
    Netherlands: '🇳🇱',
    Sweden: '🇸🇪',
    Portugal: '🇵🇹',
    Greece: '🇬🇷',
    China: '🇨🇳',
    Singapore: '🇸🇬',
    Belgium: '🇧🇪',
    Switzerland: '🇨🇭',
    Austria: '🇦🇹',
    'Czech Republic': '🇨🇿',
    Hungary: '🇭🇺',
    Romania: '🇷🇴',
    Bulgaria: '🇧🇬',
    Croatia: '🇭🇷',
    Serbia: '🇷🇸',
    Albania: '🇦🇱',
    'North Macedonia': '🇲🇰',
    Montenegro: '🇲🇪',
    Bosnia: '🇧🇦',
    // ── Regional & global ────────────────────────────────────
    Europe: '🇪🇺',
    'Middle East & Africa': '🌍',
    'Asia Pacific': '🌏',
    Americas: '🌎',
    'North Africa': '🌍',
    Asia: '🌏',
    'Middle East': '🌍',
    'North America': '🌎',
    Oceania: '🌏',
    Mondial: '🌍',
    Global: '🌍',
  };

  return flagMap[country] ?? '🌍';
};

// Maps non-standard regional codes to a representative country flag
const REGIONAL_CODE_MAP: Record<string, string> = {
  eu: 'eu', mea: 'ae', apac: 'jp', ame: 'us', naf: 'tn',
};

const getFlagUri = (countryCode: string, country: string): string | null => {
  const normalizedCode = countryCode?.trim().toLowerCase();

  // Standard 2-letter ISO code → direct CDN lookup
  if (/^[a-z]{2}$/.test(normalizedCode)) {
    return `https://flagcdn.com/w80/${normalizedCode}.png`;
  }

  // Regional / non-ISO codes (EU, MEA, APAC, AME, NAF, GLOBAL)
  const regionalCode = REGIONAL_CODE_MAP[normalizedCode];
  if (regionalCode) {
    return `https://flagcdn.com/w80/${regionalCode}.png`;
  }

  // Fallback: derive from country name
  const nameCodeMap: Record<string, string> = {
    Tunisia: 'tn', France: 'fr', Germany: 'de', Spain: 'es', Italy: 'it',
    'United Kingdom': 'gb', UK: 'gb', Morocco: 'ma', Egypt: 'eg',
    'United Arab Emirates': 'ae', UAE: 'ae', 'Saudi Arabia': 'sa',
    Japan: 'jp', 'South Korea': 'kr', Thailand: 'th',
    'United States': 'us', USA: 'us', Canada: 'ca', Brazil: 'br',
    Turkey: 'tr', Poland: 'pl', Netherlands: 'nl', Sweden: 'se',
    Portugal: 'pt', Greece: 'gr', China: 'cn', Singapore: 'sg',
    Belgium: 'be', Switzerland: 'ch', Austria: 'at', Poland2: 'pl',
    'Czech Republic': 'cz', Hungary: 'hu', Romania: 'ro', Bulgaria: 'bg',
    Croatia: 'hr', Serbia: 'rs', Europe: 'eu',
    'Middle East & Africa': 'ae', 'Asia Pacific': 'jp',
    Americas: 'us', 'North Africa': 'tn', 'North America': 'us',
  };

  const code = nameCodeMap[country];
  return code ? `https://flagcdn.com/w80/${code}.png` : null;
};

// ─── Component ───────────────────────────────────────────────────────────────

export const DestinationCard = ({ destination, onPress, flagVariant = 'default' }: DestinationCardProps) => {
  const isAuthenticFlag = flagVariant === 'authentic';
  const startingPrice = getStartingPrice(destination);
  const networkType = destination.networkType;
  const coverageLabel = getCoverageLabel(destination.coverageType);
  const [flagLoadFailed, setFlagLoadFailed] = useState(false);
  const flagUri = getFlagUri(destination.countryCode, destination.country);
  const emojiFlag = useMemo(() => getCountryFlag(destination.country), [destination.country]);
  const shouldRenderImageFlag = Boolean(flagUri) && !flagLoadFailed;

  useEffect(() => {
    setFlagLoadFailed(false);
  }, [destination.country, destination.countryCode]);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${destination.country}`}
      accessibilityHint="Ouvre la liste des forfaits pour cette destination"
      style={({ pressed }) => [styles.pressable, pressed ? styles.pressablePressed : undefined]}
    >
      {({ pressed }) => (
        <View style={styles.card}>
          {isAuthenticFlag ? (
            <View style={styles.authenticRow}>
              <View style={styles.authenticCenterGroup}>
                <View style={styles.flagWrapAuthentic}>
                  {shouldRenderImageFlag && flagUri ? (
                    <Image
                      source={{ uri: flagUri }}
                      style={styles.flagImageAuthentic}
                      resizeMode="cover"
                      onError={() => setFlagLoadFailed(true)}
                    />
                  ) : (
                    <Text style={[styles.flagText, styles.flagTextAuthentic]}>
                      {emojiFlag}
                    </Text>
                  )}
                </View>

                <View style={styles.authenticNameBlock}>
                  <Text numberOfLines={1} style={styles.countryTextAuthentic}>
                    {destination.country}
                  </Text>
                  <View style={styles.metaRow}>
                    {networkType ? (
                      <View style={styles.networkChip}>
                        <Text style={styles.networkChipText}>{networkType}</Text>
                      </View>
                    ) : null}
                    <Text style={styles.coverageLabelText}>{coverageLabel}</Text>
                  </View>
                </View>
              </View>
              <View style={styles.chevronWrap}>
                <Ionicons
                  color={colors.primary.DEFAULT}
                  name="chevron-forward"
                  size={sizes.icon.sm}
                />
              </View>
            </View>
          ) : (
            <>
              <View style={styles.row}>
                <View style={styles.flagWrap}>
                  {shouldRenderImageFlag && flagUri ? (
                    <Image
                      source={{ uri: flagUri }}
                      style={styles.flagImageDefault}
                      resizeMode="cover"
                      onError={() => setFlagLoadFailed(true)}
                    />
                  ) : (
                    <Text style={styles.flagText}>{emojiFlag}</Text>
                  )}
                </View>

                <View style={styles.mainContent}>
                  <Text numberOfLines={1} style={styles.countryText}>
                    {destination.country}
                  </Text>
                  <Text style={styles.offerText}>
                    {networkType ? `${networkType} · ` : ''}{coverageLabel}
                  </Text>
                </View>

                <View style={styles.priceWrap}>
                  <Text style={styles.priceValue}>
                    {startingPrice.toFixed(2)} TND
                  </Text>
                </View>

                <View style={styles.chevronWrap}>
                  <Ionicons color={colors.primary.DEFAULT} name="chevron-forward" size={sizes.icon.sm} />
                </View>
              </View>
            </>
          )}
        </View>
      )}
    </Pressable>
  );
};

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
  },
  flagWrap: {
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.border,
    height: sizes.avatar.lg,
    justifyContent: 'center',
    overflow: 'hidden',
    width: sizes.avatar.lg,
  },
  flagImageDefault: {
    width: sizes.avatar.sm,
    height: sizes.icon.lg,
    borderRadius: radii.xs,
  },
  flagText: {
    ...typography.titleMD,
  },
  flagWrapAuthentic: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radii.sm,
    borderWidth: 1,
    height: sizes.touch.lg,
    justifyContent: 'center',
    width: sizes.touch.lg,
    overflow: 'hidden',
    ...shadows.medium,
  },
  flagTextAuthentic: {
    ...typography.titleLG,
  },
  flagImageAuthentic: {
    borderRadius: radii.xs,
    height: '100%',
    width: '100%',
  },
  authenticRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: sizes.touch.lg,
  },
  authenticCenterGroup: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  mainContent: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  authenticNameBlock: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  countryTextAuthentic: {
    ...typography.bodyLG,
    color: colors.text.primary,
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    gap: spacing.xs,
  },
  networkChip: {
    backgroundColor: colors.primary[100],
    borderRadius: radii.full,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xxs,
  },
  networkChipText: {
    ...typography.bodyXS,
    color: colors.primary.DEFAULT,
    fontWeight: '700',
  },
  coverageLabelText: {
    ...typography.bodySM,
    color: colors.text.secondary,
  },
  countryText: {
    ...typography.bodyLG,
    color: colors.text.primary,
    fontWeight: '700',
  },
  offerText: {
    ...typography.bodySM,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  priceWrap: {
    alignItems: 'flex-end',
    marginRight: spacing.sm,
  },
  priceValue: {
    ...typography.bodyMD,
    color: colors.primary.DEFAULT,
    fontWeight: '500',
    marginTop: spacing.xs,
  },
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
