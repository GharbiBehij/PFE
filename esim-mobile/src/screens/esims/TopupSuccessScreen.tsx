import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContent, ScreenHeader, ScreenShell } from '../../components/layout';
import { useEsimDetail } from '../../hooks/client/useEsims';
import type { EsimsStackParamList } from '../../navigation/types';
import { colors, patterns, radii, sizes, spacing, typography } from '../../theme';
import { ActionButton, OutlineButton } from '../../components/Buttons';

type Props = NativeStackScreenProps<EsimsStackParamList, 'TopupSuccess'>;

export const TopupSuccessScreen = ({ navigation, route }: Props) => {
  const { esimId } = route.params;
  const queryClient = useQueryClient();
  const esimQuery = useEsimDetail(esimId);

  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ['esims'] });
  }, [queryClient]);

  const total = (esimQuery.data?.dataTotal ?? 0) / 1024;
  const used = (esimQuery.data?.dataUsed ?? 0) / 1024;

  return (
    <ScreenShell>
      <ScreenHeader style={styles.header}>
        <Text style={styles.headerTitle}>Recharge réussie</Text>
      </ScreenHeader>

      <ScreenContent contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <Ionicons
              name="checkmark-circle"
              size={sizes.decoration.successIcon}
              color={colors.success.DEFAULT}
            />
          </View>
          <Text style={styles.title}>Vos données ont bien été rechargées</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Utilisé</Text>
              <Text style={styles.statValue}>{used.toFixed(1)} GB</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Total</Text>
              <Text style={styles.statValue}>{total.toFixed(1)} GB</Text>
            </View>
          </View>
        </View>

        <ActionButton
          label="Voir mon eSIM"
          onPress={() => navigation.navigate('EsimConsumption', { esimId })}
          style={styles.button}
        />

        <OutlineButton
          label="Retour à mes eSIMs"
          onPress={() => navigation.navigate('MyEsims')}
          style={styles.secondaryButton}
        />
      </ScreenContent>
    </ScreenShell>
  );
};

const styles = StyleSheet.create({
  header: { ...patterns.headerShell },
  headerTitle: { ...typography.titleMD, color: colors.text.primary, fontWeight: '700' },
  content: { ...patterns.screenPadding, paddingTop: spacing.xl },
  card: {
    ...patterns.card,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
  },
  iconWrap: {
    width: sizes.decoration.successCircle,
    height: sizes.decoration.successCircle,
    borderRadius: radii.full,
    backgroundColor: colors.success[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.titleSM,
    color: colors.text.primary,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    gap: spacing.lg,
  },
  statItem: { alignItems: 'center', gap: spacing.xxs },
  statLabel: { ...typography.bodySM, color: colors.text.secondary },
  statValue: { ...typography.titleSM, color: colors.text.primary, fontWeight: '700' },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: colors.border,
  },
  button: {
    marginTop: spacing.xl,
  },
  secondaryButton: {
    marginTop: spacing.md,
  },
});
