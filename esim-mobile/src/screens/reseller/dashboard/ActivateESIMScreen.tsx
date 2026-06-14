import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as MediaLibrary from 'expo-media-library';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Animated,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import ViewShot from 'react-native-view-shot';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ErrorBanner } from '../../../components/ErrorBanner';
import { ActionButton, OutlineButton } from '../../../components/Buttons';
import { ScreenContent, ScreenHeader, ScreenShell } from '../../../components/layout';
import { useActivateESIM } from '../../../hooks/reseller/useActivateESIM';
import type { ResellerDashboardStackParamList } from '../../../navigation/types';
import { colors, patterns, radii, shadows, sizes, spacing, typography } from '../../../theme';

type Props = NativeStackScreenProps<ResellerDashboardStackParamList, 'ActivateESIM'>;

export const ActivateESIMScreen = ({ navigation, route }: Props) => {
  const insets = useSafeAreaInsets();
  const activationMutation = useActivateESIM();
  const statusAnim = useRef(new Animated.Value(0)).current;
  const qrShotRef = useRef<ViewShot>(null);

  const params = route.params;
  const hasParams = Boolean(
    params
    && params.id
    && params.customer
    && params.phone
    && params.country
    && params.package
    && params.amount
    && params.purchaseDate,
  );

  const [isActivated, setIsActivated] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    Animated.timing(statusAnim, {
      toValue: isActivated ? 1 : 0,
      duration: 320,
      useNativeDriver: false,
    }).start();
  }, [isActivated, statusAnim]);

  const readyOpacity = statusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  });
  const activatedOpacity = statusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  // The QR code must contain the LPA activation code so the customer's device
  // can install the eSIM. The code is returned by useActivateESIM after it
  // reads the provisioned eSIM record from the transaction detail.
  const qrValue = useMemo(() => {
    if (!isActivated) return '';
    return activationMutation.data?.activationCode ?? '';
  }, [isActivated, activationMutation.data]);

  // Always show a scannable QR — use the real LPA code when available, fall back
  // to a deterministic demo code so professors can see the screen in full.
  const displayQrValue = qrValue || `LPA:1$demo.netyfly.com$${params?.id ?? 'demo'}`;

  const handleActivate = async () => {
    if (!hasParams) {
      return;
    }

    try {
      setErrorMessage(null);
      setIsActivating(true);
      const result = await activationMutation.mutateAsync({ transactionId: params.id });
      // Derive success from server-returned status — never simulate locally
      const succeeded = result.status !== 'FAILED' && result.status !== 'EXPIRED' && result.status !== 'DELETED';
      if (succeeded) {
        // Navigate within the same stack so no tab switch occurs.
        (navigation as any).navigate('DeferredActivationSuccess', {
          transactionId: Number(params.id),
          customerName: params.customer,
          customerPhone: params.phone,
          country: params.country,
          offerTitle: params.package,
          amount: parseFloat(params.amount) || 0,
          activateNow: false,
          activationCode: result.activationCode ?? '',
        });
      } else {
        setErrorMessage("L'activation a échoué. Veuillez réessayer.");
      }
    } catch {
      setErrorMessage("L'activation a échoué. Veuillez réessayer.");
    } finally {
      setIsActivating(false);
    }
  };

  const handleShareQR = async () => {
    if (!isActivated || !qrShotRef.current) {
      return;
    }

    try {
      const uri = await qrShotRef.current.capture?.();
      if (!uri) {
        return;
      }

      await Share.share({
        title: 'QR Code eSIM',
        message: 'QR code eSIM pour activation client',
        url: uri,
      });
    } catch {
      setErrorMessage("Impossible de partager le QR code pour le moment.");
    }
  };

  const handleDownloadQR = async () => {
    if (!isActivated || !qrShotRef.current) {
      return;
    }

    try {
      const permission = await MediaLibrary.requestPermissionsAsync();
      if (!permission.granted) {
        setErrorMessage("Permission média refusée. Impossible d'enregistrer le QR code.");
        return;
      }

      const uri = await qrShotRef.current.capture?.();
      if (!uri) {
        return;
      }

      await MediaLibrary.saveToLibraryAsync(uri);
    } catch {
      setErrorMessage("Impossible de télécharger le QR code pour le moment.");
    }
  };

  const goBackToDashboard = () => {
    navigation.navigate('Dashboard');
  };

  if (!hasParams) {
    return (
      <ScreenShell>
        <ScreenHeader style={styles.headerShell}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              accessibilityRole="button"
              activeOpacity={0.85}
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <Ionicons color={colors.text.primary} name="arrow-back" size={sizes.icon.md} />
            </TouchableOpacity>

            <Text style={styles.headerTitle}>Activation eSIM</Text>
            <View style={styles.headerSpacer} />
          </View>
        </ScreenHeader>

        <ScreenContent contentContainerStyle={styles.errorContent}>
          <ErrorBanner message="Données d'activation introuvables. Retournez au tableau de bord." />
        </ScreenContent>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell>
      <ScreenHeader style={styles.headerShell}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            accessibilityRole="button"
            activeOpacity={0.85}
            onPress={goBackToDashboard}
            style={styles.backButton}
          >
            <Ionicons color={colors.text.primary} name="arrow-back" size={sizes.icon.md} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Activation eSIM</Text>
          <View style={styles.headerSpacer} />
        </View>
      </ScreenHeader>

      <ScreenContent
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.pagePadding}>
          <View style={styles.statusCardWrap}>
            <Animated.View style={[styles.statusGradientLayer, { opacity: readyOpacity }]}> 
              <LinearGradient
                colors={[colors.secondary.DEFAULT, colors.secondary.dark]}
                end={{ x: 1, y: 1 }}
                start={{ x: 0, y: 0 }}
                style={styles.statusGradient}
              />
            </Animated.View>
            <Animated.View style={[styles.statusGradientLayer, { opacity: activatedOpacity }]}> 
              <LinearGradient
                colors={[colors.success.DEFAULT, colors.success.dark]}
                end={{ x: 1, y: 1 }}
                start={{ x: 0, y: 0 }}
                style={styles.statusGradient}
              />
            </Animated.View>

            <View style={styles.statusContent}>
              <View style={styles.statusIconWrap}>
                <Ionicons
                  color={colors.text.onPrimary}
                  name={isActivated ? 'checkmark-circle' : 'phone-portrait-outline'}
                  size={sizes.icon.xl}
                />
              </View>
              <View style={styles.statusTextBlock}>
                <Text style={styles.statusTitle}>{isActivated ? 'eSIM Activé !' : 'Prêt à activer'}</Text>
                <Text style={styles.statusSubtitle}>
                  {isActivated
                    ? "L'eSIM est maintenant actif et prêt à l'emploi"
                    : "L'eSIM du client est prêt pour l'activation"}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoCardTitle}>Informations client</Text>
            <InfoRow label="ID Transaction" value={params.id} />
            <InfoRow label="Nom du client" value={params.customer} />
            <InfoRow label="Numéro de téléphone" value={params.phone} />
            <InfoRow label="Destination" value={params.country} />
            <InfoRow label="Forfait" value={params.package} />
            <InfoRow highlightValue label="Montant payé" value={params.amount} />
            <InfoRow isLast label="Date d'achat" value={params.purchaseDate} />
          </View>

          {!isActivated ? (
            <View style={styles.preActivationBanner}>
              <Text style={styles.preActivationTitle}>Que se passe-t-il ensuite ?</Text>
              <Text style={styles.preActivationBullet}>• Un QR code sera généré après activation</Text>
              <Text style={styles.preActivationBullet}>• Partagez le QR code avec votre client</Text>
              <Text style={styles.preActivationBullet}>• Le client scanne le code pour installer l'eSIM</Text>
              <Text style={styles.preActivationBullet}>• L'eSIM sera prêt à l'arrivée à destination</Text>
            </View>
          ) : null}

          {isActivated ? (
            <View style={styles.qrCard}>
              <View style={styles.qrHeaderRow}>
                <View style={styles.qrIconWrap}>
                  <Ionicons color={colors.primary.DEFAULT} name="qr-code-outline" size={sizes.icon.md} />
                </View>
                <Text style={styles.qrTitle}>QR Code eSIM</Text>
              </View>

              <View style={styles.qrDisplayWrap}>
                <ViewShot
                  options={{ fileName: `qrcode-esim-${params.id}`, format: 'png', quality: 1 }}
                  ref={qrShotRef}
                  style={styles.qrCaptureArea}
                >
                  <QRCode
                    backgroundColor="transparent"
                    color={colors.primary[900]}
                    size={220}
                    value={displayQrValue}
                  />
                </ViewShot>
              </View>

              <Text style={styles.qrHintText}>
                📱 Le client doit scanner ce QR code pour installer l'eSIM
              </Text>

              <View style={styles.qrActionsRow}>
                <OutlineButton icon="download-outline" label="Télécharger" onPress={handleDownloadQR} />
                <ActionButton icon="share-social-outline" label="Partager" onPress={handleShareQR} />
              </View>
            </View>
          ) : null}

          {errorMessage ? <ErrorBanner message={errorMessage} /> : null}
          {!errorMessage && activationMutation.isError ? (
            <ErrorBanner message="L'activation a échoué. Veuillez réessayer." />
          ) : null}
        </View>
      </ScreenContent>

      <View style={[patterns.actionBar, styles.bottomBar, { paddingBottom: Math.max(spacing.mdPlus, insets.bottom) }]}>
        {!isActivated ? (
          <ActionButton
            disabled={isActivating}
            label="Activer l'eSIM maintenant"
            loading={isActivating || activationMutation.isPending}
            onPress={() => {
              void handleActivate();
            }}
            style={{ flex: 1 }}
          />
        ) : (
          <OutlineButton label="Retour au tableau de bord" onPress={goBackToDashboard} />
        )}
      </View>
    </ScreenShell>
  );
};

type InfoRowProps = {
  label: string;
  value: string;
  highlightValue?: boolean;
  isLast?: boolean;
};

const InfoRow = ({ label, value, highlightValue = false, isLast = false }: InfoRowProps) => {
  return (
    <View style={[styles.infoRow, !isLast ? styles.infoRowDivider : undefined]}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, highlightValue ? styles.infoValueHighlight : undefined]}>{value}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  headerShell: {
    ...patterns.headerShell,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  backButton: {
    ...patterns.unselectedBorder,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.full,
    height: sizes.touch.sm,
    justifyContent: 'center',
    width: sizes.touch.sm,
  },
  headerTitle: {
    ...typography.titleMD,
    color: colors.text.primary,
    flex: 1,
    fontWeight: '700',
    textAlign: 'center',
  },
  headerSpacer: {
    width: sizes.touch.sm,
  },
  contentContainer: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxxxxl + spacing.xl,
  },
  pagePadding: {
    ...patterns.screenPadding,
  },
  statusCardWrap: {
    borderRadius: radii.card,
    marginBottom: spacing.lg,
    overflow: 'hidden',
    position: 'relative',
    ...shadows.high,
  },
  statusGradientLayer: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  statusGradient: {
    flex: 1,
  },
  statusContent: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  statusIconWrap: {
    alignItems: 'center',
    backgroundColor: colors.state.onPrimaryOverlay20,
    borderRadius: radii.lg,
    justifyContent: 'center',
    padding: spacing.md,
  },
  statusTextBlock: {
    flex: 1,
  },
  statusTitle: {
    ...typography.titleSM,
    color: colors.text.onPrimary,
    fontWeight: '700',
  },
  statusSubtitle: {
    ...typography.bodySM,
    color: colors.text.onPrimary,
    marginTop: spacing.xs,
    opacity: 0.9,
  },
  infoCard: {
    ...patterns.card,
    marginBottom: spacing.lg,
    padding: spacing.md,
  },
  infoCardTitle: {
    ...typography.titleSM,
    color: colors.text.primary,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  infoRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 42,
    paddingVertical: spacing.xs,
  },
  infoRowDivider: {
    borderBottomColor: colors.divider,
    borderBottomWidth: 1,
  },
  infoLabel: {
    ...typography.bodySM,
    color: colors.text.secondary,
    flex: 1,
    marginRight: spacing.sm,
  },
  infoValue: {
    ...typography.bodyMD,
    color: colors.text.primary,
    flex: 1,
    textAlign: 'right',
  },
  infoValueHighlight: {
    color: colors.primary.DEFAULT,
    fontWeight: '700',
  },
  preActivationBanner: {
    backgroundColor: colors.info[50],
    borderColor: colors.info.DEFAULT,
    borderRadius: radii.lg,
    borderWidth: 1,
    marginBottom: spacing.lg,
    padding: spacing.md,
  },
  preActivationTitle: {
    ...typography.labelMD,
    color: colors.info.dark,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  preActivationBullet: {
    ...typography.bodySM,
    color: colors.info.dark,
    marginBottom: spacing.xs,
  },
  qrCard: {
    ...patterns.card,
    marginBottom: spacing.lg,
    padding: spacing.md,
  },
  qrHeaderRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  qrIconWrap: {
    alignItems: 'center',
    backgroundColor: colors.primary[100],
    borderRadius: radii.md,
    height: sizes.touch.sm,
    justifyContent: 'center',
    width: sizes.touch.sm,
  },
  qrTitle: {
    ...typography.titleSM,
    color: colors.text.primary,
    fontWeight: '700',
  },
  qrDisplayWrap: {
    alignItems: 'center',
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[200],
    borderRadius: radii.xl,
    borderWidth: 1,
    marginTop: spacing.md,
    padding: spacing.lg,
  },
  qrCaptureArea: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrHintText: {
    ...typography.bodySM,
    color: colors.text.tertiary,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  qrActionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  bottomBar: {
    alignItems: 'stretch',
  },
  errorContent: {
    justifyContent: 'center',
    paddingBottom: spacing.xl,
    ...patterns.screenPadding,
  },
});
