import { StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { colors, patterns, radii, spacing, typography } from '../theme';

type QrCodeCardProps = {
  value: string;
};

export const QrCodeCard = ({ value }: QrCodeCardProps) => {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Code QR d'activation</Text>
      <View style={styles.codeContainer}>
        <QRCode size={180} value={value} />
      </View>
      <Text selectable style={styles.value}>
        {value}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    ...patterns.card,
    alignItems: 'center',
    padding: spacing.lg,
  },
  title: {
    ...typography.titleSM,
    color: colors.text.primary,
  },
  codeContainer: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    marginTop: spacing.md,
    padding: spacing.md,
  },
  value: {
    ...typography.bodySM,
    color: colors.text.secondary,
    marginTop: spacing.md,
    textAlign: 'center',
  },
});
