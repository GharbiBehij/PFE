import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { BalanceCard } from '../../components/BalanceCard';
import { EmptyState } from '../../components/EmptyState';
import { ErrorBanner } from '../../components/ErrorBanner';
import { LoadingOverlay } from '../../components/LoadingOverlay';
import { Group, ScreenContent, ScreenHeader, ScreenShell, Section } from '../../components/layout';
import { useTopUp, useWalletBalance, useWalletHistory } from '../../hooks/useWallet';
import type { ProfileStackParamList } from '../../navigation/types';
import { colors, patterns, radii, shadows, sizes, spacing, typography } from '../../theme';
import type { WalletLedgerEntry } from '../../types/wallet';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';

const topUpOptions = [5, 10, 20, 30, 50, 100];

type Props = NativeStackScreenProps<ProfileStackParamList, 'TopUp'>;

export const TopUpScreen = ({ navigation }: Props) => {
  const [amount, setAmount] = useState('');
  const walletBalanceQuery = useWalletBalance();
  const walletHistoryQuery = useWalletHistory();
  const topUpMutation = useTopUp();

  const fullHistory = useMemo(() => walletHistoryQuery.data ?? [], [walletHistoryQuery.data]);

  const onTopUp = async () => {
    const parsed = Number(amount);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return;
    }

    try {
      await topUpMutation.mutateAsync(parsed);
      setAmount('');
    } catch {
      // handled by mutation state
    }
  };

  if (walletBalanceQuery.isLoading || walletHistoryQuery.isLoading) {
    return (
      <ScreenShell>
        <ScreenContent scrollable={false}>
          <LoadingOverlay />
        </ScreenContent>
      </ScreenShell>
    );
  }

  if (walletBalanceQuery.isError || walletHistoryQuery.isError) {
    return (
      <ScreenShell>
        <ScreenContent scrollable={false}>
          <View style={styles.errorState}>
            <ErrorBanner
              message="Impossible de charger les données du portefeuille."
              onRetry={() => {
                walletBalanceQuery.refetch();
                walletHistoryQuery.refetch();
              }}
            />
          </View>
        </ScreenContent>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell>
      <ScreenHeader style={styles.header}>
        <View style={styles.headerRow}>
          <Pressable
            accessibilityLabel="Retour au profil"
            accessibilityRole="button"
            onPress={() => navigation.navigate('Profile')}
            style={({ pressed }) => [styles.headerBackButton, pressed ? styles.headerBackButtonPressed : undefined]}
          >
            <Ionicons color={colors.text.primary} name="arrow-back" size={sizes.icon.md} />
          </Pressable>

          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>Recharge</Text>
          </View>

          <View style={styles.headerSpacer} />
        </View>
      </ScreenHeader>

      <ScreenContent contentContainerStyle={styles.contentContainer}>
        <Section>
          <BalanceCard balance={walletBalanceQuery.data?.balance ?? 0} />
        </Section>

        <Section>
          <Text style={styles.sectionTitle}>Choisir un montant</Text>
          <Group>
            <View style={styles.optionGrid}>
              {topUpOptions.map((option) => (
                <Pressable
                  key={option}
                  onPress={() => setAmount(String(option))}
                  style={({ pressed }) => [styles.optionButton, pressed ? styles.optionButtonPressed : undefined]}
                >
                  <Text style={styles.optionButtonText}>{option} TND</Text>
                </Pressable>
              ))}
            </View>
          </Group>
        </Section>

        <Section>
          <Text style={styles.fieldLabel}>Montant personnalisé</Text>
          <TextInput
            keyboardType="decimal-pad"
            onChangeText={setAmount}
            placeholder="Entrez un montant"
            placeholderTextColor={colors.text.tertiary}
            style={styles.input}
            value={amount}
          />

          {topUpMutation.isError ? <ErrorBanner message="Recharge impossible." /> : null}

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Recharger maintenant"
            accessibilityState={{ disabled: topUpMutation.isPending }}
            disabled={topUpMutation.isPending}
            onPress={onTopUp}
            style={({ pressed }) => [
              styles.submitButton,
              pressed ? styles.submitButtonPressed : undefined,
              topUpMutation.isPending ? styles.submitButtonDisabled : undefined,
            ]}
          >
            <Text style={styles.submitButtonText}>{topUpMutation.isPending ? 'Traitement...' : 'Recharger maintenant'}</Text>
          </Pressable>
        </Section>

        <Section>
          <Text style={styles.sectionTitle}>Historique complet</Text>
          <FlatList
            data={fullHistory}
            keyExtractor={(item) => item.id}
            ListEmptyComponent={<EmptyState title="Aucune transaction" />}
            renderItem={({ item }) => <HistoryRow item={item} />}
            scrollEnabled={false}
          />
        </Section>
      </ScreenContent>
    </ScreenShell>
  );
};

const HistoryRow = ({ item }: { item: WalletLedgerEntry }) => (
  <View style={styles.historyRow}>
    <View>
      <Text style={styles.historyReason}>{item.reason}</Text>
      <Text style={styles.historyDate}>{formatDate(item.createdAt)}</Text>
    </View>
    <Text style={[styles.historyAmount, item.type === 'CREDIT' ? styles.creditAmount : styles.debitAmount]}>
      {item.type === 'CREDIT' ? '+' : '-'} {formatCurrency(Math.abs(item.amount))}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  header: {
    ...patterns.headerShell,
    borderBottomLeftRadius: radii.card,
    borderBottomRightRadius: radii.card,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  headerBackButton: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.full,
    borderWidth: 1,
    height: sizes.touch.sm,
    justifyContent: 'center',
    width: sizes.touch.sm,
  },
  headerBackButtonPressed: {
    backgroundColor: colors.state.surfacePressed,
    transform: [{ scale: 0.98 }],
  },
  headerTitleWrap: {
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    ...typography.titleMD,
    color: colors.text.primary,
    fontWeight: '700',
  },
  headerSpacer: {
    width: sizes.touch.sm,
  },
  errorState: {
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: 'center',
    ...patterns.screenPadding,
    paddingVertical: spacing.lg,
  },
  contentContainer: {
    ...patterns.screenPadding,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  sectionTitle: {
    ...typography.titleSM,
    color: colors.text.primary,
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  optionButton: {
    ...patterns.unselectedBackground,
    ...patterns.unselectedBorder,
    borderRadius: radii.sm,
    minHeight: sizes.touch.sm,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  optionButtonPressed: {
    backgroundColor: colors.state.surfacePressed,
    ...patterns.pressablePressed,
  },
  optionButtonText: {
    ...typography.bodySM,
    color: colors.text.secondary,
    fontWeight: '700',
  },
  fieldLabel: {
    ...typography.bodySM,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
    marginTop: spacing.md,
  },
  input: {
    ...patterns.inputField,
    ...typography.bodyMD,
    color: colors.text.primary,
    paddingVertical: spacing.md,
  },
  submitButton: {
    ...patterns.ctaPrimary,
    marginTop: spacing.md,
  },
  submitButtonPressed: {
    ...patterns.ctaPrimaryPressed,
  },
  submitButtonDisabled: {
    ...patterns.ctaPrimaryDisabled,
  },
  submitButtonText: {
    ...typography.labelMD,
    color: colors.text.onPrimary,
  },
  historyRow: {
    ...patterns.cardCompact,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  historyReason: {
    ...typography.bodyMD,
    color: colors.text.primary,
  },
  historyDate: {
    ...typography.bodySM,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  historyAmount: {
    ...typography.bodyMD,
    fontWeight: '700',
  },
  creditAmount: {
    color: colors.success.DEFAULT,
  },
  debitAmount: {
    color: colors.error.DEFAULT,
  },
});
