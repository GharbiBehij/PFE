import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenContent, ScreenHeader, ScreenShell } from '../../components/layout';
import type { HomeStackParamList } from '../../navigation/types';
import { colors, patterns, radii, sizes, spacing, typography } from '../../theme';

type Props = NativeStackScreenProps<HomeStackParamList, 'EsimExpired'>;

export const EsimExpiredScreen = ({ navigation, route }: Props) => {
  const { transactionId } = route.params;

  const openHomeTab = () => {
    navigation.getParent()?.navigate('HomeTab' as never);
  };

  return (
    <ScreenShell>
      <ScreenHeader style={styles.header}>
        <Text style={styles.headerTitle}>Paiement</Text>
      </ScreenHeader>

      <ScreenContent scrollable={false}>
        <View style={styles.container}>
          <View style={styles.iconCircle}>
            <Ionicons color={colors.warning.DEFAULT} name="time-outline" size={sizes.decoration.successIcon} />
          </View>
          <Text style={styles.title}>Session expirée</Text>
          <Text style={styles.subtitle}>Le délai de paiement a été dépassé.</Text>
          <Text style={styles.transaction}>Transaction: {transactionId}</Text>

          <Pressable
            onPress={openHomeTab}
            style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryButtonPressed]}
          >
            <Text style={styles.primaryButtonText}>Retour à l'accueil</Text>
          </Pressable>
        </View>
      </ScreenContent>
    </ScreenShell>
  );
};

const styles = StyleSheet.create({
  header: {
    ...patterns.headerShell,
    alignItems: 'center',
    borderBottomLeftRadius: radii.card,
    borderBottomRightRadius: radii.card,
  },
  headerTitle: {
    ...typography.titleMD,
    color: colors.text.primary,
    fontWeight: '700',
  },
  container: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    ...patterns.screenPadding,
  },
  iconCircle: {
    alignItems: 'center',
    backgroundColor: colors.warning[50],
    borderRadius: radii.full,
    height: sizes.decoration.successCircle,
    justifyContent: 'center',
    width: sizes.decoration.successCircle,
  },
  title: {
    ...typography.titleLG,
    color: colors.text.primary,
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.bodyMD,
    color: colors.text.secondary,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  transaction: {
    ...typography.bodySM,
    color: colors.text.tertiary,
    marginTop: spacing.xs,
  },
  primaryButton: {
    ...patterns.ctaPrimary,
    marginTop: spacing.xl,
  },
  primaryButtonPressed: {
    ...patterns.ctaPrimaryPressed,
  },
  primaryButtonText: {
    ...typography.labelMD,
    color: colors.text.onPrimary,
  },
});
