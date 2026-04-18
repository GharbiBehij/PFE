import { StyleSheet, Text } from 'react-native';
import { typography } from '../theme';

type CountryFlagProps = {
  countryCode: string;
  size?: number;
};

const toFlagEmoji = (countryCode: string) => {
  const code = countryCode.trim().toUpperCase();
  if (code.length !== 2) {
    return '🏳️';
  }

  return String.fromCodePoint(...Array.from(code).map((char) => 127397 + char.charCodeAt(0)));
};

export const CountryFlag = ({ countryCode, size = 28 }: CountryFlagProps) => {
  return <Text style={[styles.flag, { fontSize: size }]}>{toFlagEmoji(countryCode)}</Text>;
};

const styles = StyleSheet.create({
  flag: {
    ...typography.titleLG,
  },
});
