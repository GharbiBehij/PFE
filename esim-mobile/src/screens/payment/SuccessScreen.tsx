import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StatusBadge } from '../../components/StatusBadge';
import { ScreenContent, ScreenHeader, ScreenShell } from '../../components/layout';
import type { HomeStackParamList } from '../../navigation/types';
import { colors, patterns, radii, shadows, sizes, spacing, typography } from '../../theme';

type Props = NativeStackScreenProps<HomeStackParamList, 'Success'>;

export const SuccessScreen = ({ navigation, route }: Props) => {
  const { result } = route.params;

  const openEsimsTab = () => {
    navigation.getParent()?.navigate('EsimsTab' as never);
  };

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
            <Ionicons color={colors.success.DEFAULT} name="checkmark-circle" size={sizes.decoration.successIcon} />
          </View>
          <Text style={styles.title}>Achat réussi!</Text>
          <Text style={styles.transaction}>Transaction: {result.transactionId}</Text>
          <StatusBadge status={result.status} />

          <Pressable onPress={openEsimsTab} style={({ pressed }) => [styles.primaryButton, pressed ? styles.primaryButtonPressed : undefined]}>
            <Text style={styles.primaryButtonText}>Voir mes eSIMs</Text>
          </Pressable>

          <Pressable onPress={openHomeTab} style={({ pressed }) => [styles.secondaryButton, pressed ? styles.secondaryButtonPressed : undefined]}>
            <Text style={styles.secondaryButtonText}>Retour à l'accueil</Text>
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
    backgroundColor: colors.success[50],
    borderRadius: radii.full,
    height: sizes.decoration.successCircle,
    justifyContent: 'center',
    width: sizes.decoration.successCircle,
  },
  title: {
    ...typography.titleLG,
    color: colors.text.primary,
    marginTop: spacing.lg,
  },
  transaction: {
    ...typography.bodyMD,
    color: colors.text.secondary,
    marginTop: spacing.sm,
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
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.primary.DEFAULT,
    borderRadius: radii.lg,
    borderWidth: 1,
    justifyContent: 'center',
    marginTop: spacing.md,
    minHeight: sizes.button.minHeight,
    paddingVertical: spacing.md,
    width: '100%',
  },
  secondaryButtonPressed: {
    backgroundColor: colors.borderSubtle,
    transform: [{ scale: 0.98 }],
  },
  secondaryButtonText: {
    ...typography.labelMD,
    color: colors.primary.DEFAULT,
  },
});
