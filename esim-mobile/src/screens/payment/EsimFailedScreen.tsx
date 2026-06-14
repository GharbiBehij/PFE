import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenContent, ScreenHeader, ScreenShell } from '../../components/layout';
import type { HomeStackParamList } from '../../navigation/types';
import { colors, patterns, radii, sizes, spacing, typography } from '../../theme';
import { ActionButton } from '../../components/Buttons';

type Props = NativeStackScreenProps<HomeStackParamList, 'EsimFailed'>;

export const EsimFailedScreen = ({ navigation, route }: Props) => {
  const { transactionId, reason } = route.params;
  const insets = useSafeAreaInsets();

  const openHomeTab = () => {
    (navigation.getParent() as any)?.navigate('HomeTab', { screen: 'Home' });
  };

  const subtitle = reason
    ? reason === 'payment_failed'
      ? 'Le paiement a échoué.'
      : reason
    : "Nous n'avons pas pu activer votre eSIM.";

  return (
    <ScreenShell>
      <ScreenHeader style={styles.header}>
        <Text style={styles.headerTitle}>Paiement</Text>
      </ScreenHeader>

      <ScreenContent scrollable={false}>
        <View style={styles.container}>
          <View style={styles.iconCircle}>
            <Ionicons color={colors.error.DEFAULT} name="close-circle" size={sizes.decoration.successIcon} />
          </View>
          <Text style={styles.title}>Une erreur est survenue</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
          <Text style={styles.transaction}>Transaction: {transactionId}</Text>
        </View>
      </ScreenContent>

      <View style={[patterns.actionBar, { paddingBottom: Math.max(spacing.md, insets.bottom) }]}>
        <ActionButton
          icon="home-outline"
          label="Retour à l'accueil"
          style={{ flex: 1 }}
          onPress={openHomeTab}
        />
      </View>
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
    backgroundColor: colors.error[50],
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
});
