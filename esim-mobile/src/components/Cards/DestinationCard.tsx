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
    France: '🇫🇷',
    Spain: '🇪🇸',
    Italy: '🇮🇹',
    Germany: '🇩🇪',
    UK: '🇬🇧',
    'United Kingdom': '🇬🇧',
    USA: '🇺🇸',
    'United States': '🇺🇸',
    Turkey: '🇹🇷',
    UAE: '🇦🇪',
    Dubai: '🇦🇪',
    Japan: '🇯🇵',
    China: '🇨🇳',
    Singapore: '🇸🇬',
    Thailand: '🇹🇭',
    Greece: '🇬🇷',
    Portugal: '🇵🇹',
    Netherlands: '🇳🇱',
    Belgium: '🇧🇪',
    Switzerland: '🇨🇭',
    Austria: '🇦🇹',
    Poland: '🇵🇱',
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
    Europe: '🇪🇺',
    Asia: '🌏',
    'Middle East': '🌍',
    'North America': '🌎',
    Oceania: '🌏',
    Mondial: '🌍',
    Global: '🌍',
  };

  return flagMap[country] ?? '🌍';
};

const getFlagUri = (countryCode: string, country: string): string | null => {
  const normalizedCode = countryCode?.trim().toLowerCase();
  if (/^[a-z]{2}$/.test(normalizedCode)) {
    return `https://flagcdn.com/w80/${normalizedCode}.png`;
  }

  const codeMap: Record<string, string> = {
    France: 'fr',
    Spain: 'es',
    Italy: 'it',
    Germany: 'de',
    UK: 'gb',
    'United Kingdom': 'gb',
    USA: 'us',
    'United States': 'us',
    Turkey: 'tr',
    UAE: 'ae',
    Dubai: 'ae',
    Japan: 'jp',
    China: 'cn',
    Singapore: 'sg',
    Thailand: 'th',
    Greece: 'gr',
    Portugal: 'pt',
    Netherlands: 'nl',
    Belgium: 'be',
    Switzerland: 'ch',
    Austria: 'at',
    Poland: 'pl',
    'Czech Republic': 'cz',
    Hungary: 'hu',
    Romania: 'ro',
    Bulgaria: 'bg',
    Croatia: 'hr',
    Serbia: 'rs',
    Albania: 'al',
    'North Macedonia': 'mk',
    Montenegro: 'me',
    Bosnia: 'ba',
    Europe: 'eu',
    Asia: 'jp',
    'Middle East': 'ae',
    'North America': 'us',
    Oceania: 'au',
  };

  const code = codeMap[country];
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
  const shouldRenderImageFlag = isAuthenticFlag && Boolean(flagUri) && !flagLoadFailed;

  useEffect(() => {
    setFlagLoadFailed(false);
  }, [destination.country, destination.countryCode]);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${destination.country}, à partir de ${startingPrice.toFixed(2)} TND`}
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

              <View style={styles.authenticPriceBlock}>
                <Text style={styles.priceValueAuthentic}>
                  {startingPrice.toFixed(2)} <Text style={styles.authenticPriceCurrency}>TND</Text>
                </Text>
              </View>
            </View>
          ) : (
            <>
              <View style={styles.row}>
                <View style={styles.flagWrap}>
                  <Text style={styles.flagText}>{getCountryFlag(destination.country)}</Text>
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
    marginBottom: spacing.md,
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
    width: sizes.avatar.lg,
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
    height: sizes.touch.sm,
    justifyContent: 'center',
    width: 56,
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
    minHeight: sizes.touch.sm,
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
    marginTop: 3,
    gap: spacing.xs,
  },
  networkChip: {
    backgroundColor: colors.primary[100],
    borderRadius: radii.xs,
    paddingHorizontal: spacing.xs,
    paddingVertical: 1,
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
  authenticPriceBlock: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginLeft: spacing.md,
    flexShrink: 0,
  },
  authenticPriceDes: {
    ...typography.bodyXS,
    color: colors.text.tertiary,
  },
  priceValueAuthentic: {
    ...typography.titleSM,
    color: colors.primary.DEFAULT,
    fontWeight: '800',
  },
  authenticPriceCurrency: {
    ...typography.bodySM,
    color: colors.primary.DEFAULT,
    fontWeight: '700',
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
