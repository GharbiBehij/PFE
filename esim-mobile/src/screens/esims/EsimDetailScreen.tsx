import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ErrorBanner } from '../../components/ErrorBanner';
import { LoadingOverlay } from '../../components/LoadingOverlay';
import { QrCodeCard } from '../../components/QrCodeCard';
import { StatusBadge } from '../../components/StatusBadge';
import { ScreenContent, ScreenHeader, ScreenShell, Section } from '../../components/layout';
import { useDeleteEsim, useEsimDetail, useSyncEsim } from '../../hooks/useEsims';
import type { EsimsStackParamList } from '../../navigation/types';
import { colors, patterns, radii, sizes, spacing, typography } from '../../theme';
import { formatDate } from '../../utils/formatDate';

type Props = NativeStackScreenProps<EsimsStackParamList, 'EsimDetail'>;

export const EsimDetailScreen = ({ navigation, route }: Props) => {
  const { esimId } = route.params;
  const esimQuery = useEsimDetail(esimId);
  const syncMutation = useSyncEsim();
  const deleteMutation = useDeleteEsim();

  if (esimQuery.isLoading || !esimQuery.data) {
    return (
      <ScreenShell>
        <ScreenContent scrollable={false}>
          <LoadingOverlay />
        </ScreenContent>
      </ScreenShell>
    );
  }

  if (esimQuery.isError) {
    return (
      <ScreenShell>
        <ScreenContent scrollable={false}>
          <View style={styles.errorState}>
            <ErrorBanner message="Impossible de charger votre eSIM." onRetry={() => esimQuery.refetch()} />
          </View>
        </ScreenContent>
      </ScreenShell>
    );
  }

  const esim = esimQuery.data;

  const onDelete = () => {
    Alert.alert('Supprimer eSIM', 'Confirmer la suppression de cette eSIM?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteMutation.mutateAsync(esim.id);
            navigation.goBack();
          } catch {
            Alert.alert('Erreur', 'Suppression impossible pour le moment.');
          }
        },
      },
    ]);
  };

  return (
    <ScreenShell>
      <ScreenHeader style={styles.headerShell}>
        <View style={styles.headerRow}>
          <Text style={styles.country}>{esim.country}</Text>
          <StatusBadge status={esim.status} />
        </View>
      </ScreenHeader>

      <ScreenContent contentContainerStyle={styles.contentContainer}>
        <Section>
          <View style={styles.usageCard}>
            <Text style={styles.usageTitle}>Consommation des données</Text>
            <Text style={styles.usageValue}>
              {((esim.dataUsed ?? 0) / 1024 / 1024).toFixed(0)}MB /{' '}
              {((esim.dataTotal ?? 0) / 1024 / 1024).toFixed(0)}MB
            </Text>
          </View>
        </Section>

        <Section>
          <QrCodeCard value={esim.activationCode} />
        </Section>

        <Section>
          <View style={styles.detailCard}>
            <LabelValue label="ICCID" value={esim.iccid} />
            <LabelValue label="Date d'activation" value={formatDate(esim.createdAt)} />
            {esim.expiryDate ? <LabelValue label="Date d'expiration" value={formatDate(esim.expiryDate)} /> : null}
          </View>
        </Section>

        <Section>
          <Pressable
            disabled={syncMutation.isPending}
            onPress={() => syncMutation.mutate(esim.id)}
            style={({ pressed }) => [
              styles.syncButton,
              pressed && !syncMutation.isPending ? styles.syncButtonPressed : undefined,
            ]}
          >
            <Text style={styles.syncButtonText}>
              {syncMutation.isPending ? 'Synchronisation...' : 'Synchroniser'}
            </Text>
          </Pressable>

          <Pressable
            disabled={deleteMutation.isPending}
            onPress={onDelete}
            style={({ pressed }) => [
              styles.deleteButton,
              pressed && !deleteMutation.isPending ? styles.deleteButtonPressed : undefined,
            ]}
          >
            <Text style={styles.deleteButtonText}>Supprimer</Text>
          </Pressable>
        </Section>
      </ScreenContent>
    </ScreenShell>
  );
};

const LabelValue = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.labelValueRow}>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.value}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  headerShell: {
    ...patterns.headerShell,
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
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  country: {
    ...typography.titleLG,
    color: colors.text.primary,
  },
  usageCard: {
    ...patterns.card,
    padding: spacing.lg,
  },
  usageTitle: {
    ...typography.bodyMD,
    color: colors.text.secondary,
  },
  usageValue: {
    ...typography.titleSM,
    color: colors.text.primary,
    marginTop: spacing.sm,
  },
  detailCard: {
    ...patterns.card,
    padding: spacing.lg,
  },
  labelValueRow: {
    marginBottom: spacing.sm,
  },
  label: {
    ...typography.bodySM,
    color: colors.text.secondary,
  },
  value: {
    ...typography.bodyMD,
    color: colors.text.primary,
    marginTop: spacing.xs,
  },
  syncButton: {
    ...patterns.ctaPrimary,
    marginTop: spacing.xl,
  },
  syncButtonPressed: {
    ...patterns.ctaPrimaryPressed,
  },
  syncButtonText: {
    ...typography.labelMD,
    color: colors.text.onPrimary,
  },
  deleteButton: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.error.DEFAULT,
    borderRadius: radii.lg,
    borderWidth: 1,
    justifyContent: 'center',
    marginTop: spacing.md,
    minHeight: sizes.button.minHeight,
    paddingVertical: spacing.md,
    width: '100%',
  },
  deleteButtonPressed: {
    backgroundColor: colors.borderSubtle,
    transform: [{ scale: 0.98 }],
  },
  deleteButtonText: {
    ...typography.labelMD,
    color: colors.error.DEFAULT,
  },
});
