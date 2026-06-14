import { useCallback, useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  BackHandler,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ActionButton, OutlineButton } from '../../components/Buttons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import QRCode from 'react-native-qrcode-svg';
import { useTransactionById } from '../../hooks/client/usePayment';
import { useEsimSocket } from '../../hooks/useEsimSocket';
import type { HomeStackParamList } from '../../navigation/types';
import type { TransactionStatus } from '../../types/payment';
import { colors, radii, shadows, sizes, spacing, typography } from '../../theme';

type Props = NativeStackScreenProps<HomeStackParamList, 'PaymentSuccess'>;

// Statuses that mean the eSIM is fully provisioned
const SUCCESS_STATUSES: TransactionStatus[] = ['COMPLETED', 'SUCCEEDED'];

export const SuccessScreen = ({ navigation, route }: Props) => {
  const { transactionId, channel } = route.params;
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [shouldPoll, setShouldPoll] = useState(true);

  // Poll every 2 s until a terminal status is reached
  const { data: transaction } = useTransactionById(
    String(transactionId),
    shouldPoll ? 2000 : false,
  );
  const status: TransactionStatus = transaction?.status ?? 'PAID';

  // Derive activation code (fallback to deterministic demo code)
  const esimData = (transaction as any)?.esims?.[0] ?? transaction?.esim;
  const activationCode = esimData?.activationCode ?? esimData?.qrCode ?? '';
  const displayCode = activationCode || `LPA:1$mock.netyfly.com$${String(transactionId)}`;

  const navigateToSuccess = useCallback(() => {
    setShouldPoll(false);
    queryClient.invalidateQueries({ queryKey: ['transaction', String(transactionId)] });
    queryClient.invalidateQueries({ queryKey: ['esims'] });
    queryClient.invalidateQueries({ queryKey: ['transactions'] });
    navigation.replace('EsimSuccess', { transactionId, channel });
  }, [navigation, queryClient, transactionId, channel]);

  // Socket — primary path
  useEsimSocket({
    onActivated: () => navigateToSuccess(),
    onFailed: ({ transactionId: failedId }) => {
      setShouldPoll(false);
      navigation.replace('EsimFailed', { transactionId: failedId });
    },
  });

  // Polling fallback — act on terminal status from server
  useEffect(() => {
    if (SUCCESS_STATUSES.includes(status)) {
      navigateToSuccess();
    } else if (status === 'FAILED') {
      setShouldPoll(false);
      navigation.replace('EsimFailed', { transactionId });
    } else if (status === 'EXPIRED') {
      setShouldPoll(false);
      navigation.replace('EsimExpired', { transactionId });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  // Block Android back: provisioning must complete before user can leave
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
      return () => sub.remove();
    }, []),
  );

  // ── Entrance animations ──────────────────────────────────────────────────
  const circleScale    = useSharedValue(0);
  const circleRotate   = useSharedValue(-180);
  const contentOpacity = useSharedValue(0);
  const contentY       = useSharedValue(20);

  useEffect(() => {
    circleScale.value    = withSpring(1, { damping: 12 });
    circleRotate.value   = withSpring(0, { damping: 12 });
    contentOpacity.value = withDelay(200, withTiming(1, { duration: 300 }));
    contentY.value       = withDelay(200, withTiming(0, { duration: 300 }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const circleStyle  = useAnimatedStyle(() => ({
    transform: [{ scale: circleScale.value }, { rotate: `${circleRotate.value}deg` }],
  }));
  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateY: contentY.value }],
  }));

  const goHome = () => {
    setShouldPoll(false);
    (navigation.getParent() as any)?.navigate('HomeTab', { screen: 'Home' });
  };

  const bottomPad = Math.max(spacing.lg, insets.bottom);
  const contentPaddingBottom = sizes.touch.lg + sizes.touch.md + spacing.md * 2 + spacing.sm + bottomPad + spacing.xl;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      {/* blobs in their own overflow-hidden layer so they don't clip the bottomBar */}
      <View style={styles.bgWrap}>
        <View style={styles.blobTop} />
        <View style={styles.blobBottom} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          {
            paddingTop: insets.top + spacing.xl,
            paddingBottom: contentPaddingBottom,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Checkmark medallion ─────────────────────────────────────── */}
        <Animated.View style={[styles.circleWrap, circleStyle]}>
          <View style={styles.circle}>
            <Ionicons name="checkmark" size={sizes.icon.xxl} color={colors.primary.DEFAULT} />
          </View>
        </Animated.View>

        {/* ── Title + subtitle ─────────────────────────────────────────── */}
        <Animated.View style={[styles.textWrap, contentStyle]}>
          <Text style={styles.title}>Paiement réussi !</Text>
          <Text style={styles.subtitle}>Votre eSIM est prête à être activée.</Text>
        </Animated.View>

        {/* ── White card (QR + code) ───────────────────────────────────── */}
        <Animated.View style={[styles.mainCard, contentStyle]}>
          {/* QR frame */}
          <View style={styles.qrFrame}>
            <QRCode value={displayCode} size={sizes.decoration.qrPayment} />
          </View>

          {/* LPA code bar */}
          <View style={styles.lpaBar}>
            <Text style={styles.lpaCode} numberOfLines={1} ellipsizeMode="tail">
              {displayCode}
            </Text>
            <Pressable style={styles.shareBtn}>
              <Ionicons name="share-outline" size={sizes.icon.sm2} color={colors.primary.DEFAULT} />
            </Pressable>
          </View>
        </Animated.View>
      </ScrollView>

      {/* ── Bottom action bar ─────────────────────────────────────────── */}
      <View style={[styles.bottomBar, { paddingBottom: bottomPad }]}>
        <ActionButton
          icon="phone-portrait-outline"
          label="Activer l'eSIM"
          onPress={navigateToSuccess}
        />
        <OutlineButton
          label="Retour à l'accueil"
          onPress={goHome}
          size="sm"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.primary.DEFAULT,
  },

  // ── Blob layer (overflow hidden isolated so bottomBar isn't clipped) ────────
  bgWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  blobTop: {
    position: 'absolute',
    top: '25%',
    left: '25%',
    width: sizes.decoration.authBlobSm,
    height: sizes.decoration.authBlobSm,
    borderRadius: radii.full,
    backgroundColor: colors.primary.light,
    opacity: 0.5,
  },
  blobBottom: {
    position: 'absolute',
    bottom: '25%',
    right: '20%',
    width: sizes.decoration.successBlobLg,
    height: sizes.decoration.successBlobLg,
    borderRadius: radii.full,
    backgroundColor: colors.primary[700],
    opacity: 0.5,
  },

  // ── ScrollView ─────────────────────────────────────────────────────────────
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.lg,
    alignItems: 'center',
  },

  // ── Checkmark medallion ────────────────────────────────────────────────────
  circleWrap: {
    alignItems: 'center',
  },
  circle: {
    width: sizes.decoration.checkCircle,
    height: sizes.decoration.checkCircle,
    borderRadius: radii.full,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.floatCircle,
  },

  // ── Title + subtitle ───────────────────────────────────────────────────────
  textWrap: {
    alignItems: 'center',
    width: '100%',
  },
  title: {
    ...typography.titleLG,
    color: colors.white,
    fontWeight: '700',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.bodyMD,
    color: colors.primary[200],
    textAlign: 'center',
  },

  // ── White card ─────────────────────────────────────────────────────────────
  mainCard: {
    backgroundColor: colors.white,
    borderRadius: radii.xxl,
    padding: spacing.xl,
    ...shadows.cardDeep,
    gap: spacing.md,
    alignSelf: 'stretch',
  },

  // QR frame (dashed border)
  qrFrame: {
    backgroundColor: colors.gray[100],
    borderRadius: radii.lg,
    padding: spacing.lg,
    borderWidth: 2,
    borderColor: colors.gray[300],
    borderStyle: 'dashed',
    alignItems: 'center',
  },

  // LPA code bar
  lpaBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[50],
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.gray[100],
  },
  lpaCode: {
    flex: 1,
    ...typography.mono,
    fontSize: 12,
    color: colors.gray[600],
    marginRight: spacing.md,
  },
  shareBtn: {
    padding: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: radii.sm,
    ...shadows.low,
  },

  // ── Bottom action bar — identical to B2BSellSuccessScreen ─────────────────
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'column',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    gap: spacing.xs,
    ...shadows.high,
  },
});
