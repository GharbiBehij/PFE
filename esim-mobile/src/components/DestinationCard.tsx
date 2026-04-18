import { useEffect, useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, patterns, radii, shadows, sizes, spacing, typography } from '../theme';
import type { Destination } from '../types/offer';

type DestinationCardProps = {
  destination: Destination;
  onPress: () => void;
  flagVariant?: 'default' | 'authentic';
};

export const DestinationCard = ({ destination, onPress, flagVariant = 'default' }: DestinationCardProps) => {
  const isAuthenticFlag = flagVariant === 'authentic';
  const offerCount = getOfferCount(destination);
  const startingPrice = getStartingPrice(destination);
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

                <Text numberOfLines={1} style={styles.countryTextAuthentic}>
                  {destination.country}
                </Text>
              </View>

              <Text style={styles.priceValueAuthentic}>
                {startingPrice.toFixed(2)} TND
              </Text>
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
                    {offerCount !== null
                      ? `${offerCount} ${offerCount === 1 ? 'forfait' : 'forfaits'}`
                      : 'Forfaits disponibles'}
                  </Text>
                </View>

                <View style={styles.priceWrap}>
                  <Text style={styles.priceLabel}>
                    À partir de
                  </Text>
                  <Text style={styles.priceValue}>
                    {startingPrice.toFixed(2)} TND
                  </Text>
                </View>

                <View style={styles.chevronWrap}>
                  <Ionicons color={colors.primary.DEFAULT} name="chevron-forward" size={sizes.icon.sm} />
                </View>
              </View>

              {offerCount !== null ? <View style={styles.badge}><Text style={styles.badgeText}>{offerCount}</Text></View> : null}
            </>
          )}
        </View>
      )}
    </Pressable>
  );
};

type DestinationWithOfferCount = Destination & {
  offerCount?: number;
  price?: number;
};

const getOfferCount = (destination: Destination): number | null => {
  const maybeCount = (destination as DestinationWithOfferCount).offerCount;
  return typeof maybeCount === 'number' ? maybeCount : null;
};

const getStartingPrice = (destination: Destination): number => {
  const fallbackPrice = (destination as DestinationWithOfferCount).price;
  const numeric = Number(destination.startingPrice ?? fallbackPrice);
  return Number.isFinite(numeric) ? numeric : 0;
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
  };

  const code = codeMap[country];
  return code ? `https://flagcdn.com/w80/${code}.png` : null;
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
  countryTextAuthentic: {
    ...typography.bodyLG,
    color: colors.text.primary,
    fontWeight: '700',
    marginLeft: spacing.sm,
    textAlign: 'left',
  },
  priceValueAuthentic: {
    ...typography.bodyMD,
    color: colors.primary.DEFAULT,
    fontWeight: '700',
    marginLeft: spacing.md,
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
  priceLabel: {
    ...typography.bodySM,
    color: colors.text.secondary,
  },
  priceValue: {
    ...typography.bodyMD,
    color: colors.primary.DEFAULT,
    fontWeight: '600',
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
  badge: {
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
  badgeText: {
    ...typography.bodySM,
    color: colors.text.secondary,
    fontWeight: '700',
  },
});
