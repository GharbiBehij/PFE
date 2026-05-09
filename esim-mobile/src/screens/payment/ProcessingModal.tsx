import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { useTransactionById } from '../../hooks/client/usePayment';
import type { HomeStackParamList } from '../../navigation/types';
import type { TransactionStatus } from '../../types/payment';
import { colors, radii, shadows, spacing, typography } from '../../theme';

// SLOW_THRESHOLD_MS is a placeholder constant
// TODO: replace with median durationMs from AuditLog analytics
//       once enough data is collected
const SLOW_THRESHOLD_MS = 8000;

const TERMINAL_STATUSES: TransactionStatus[] = [
  'COMPLETED',
  'FAILED',
  'EXPIRED',
  'REFUNDED',
];

const isSlow = (durationMs: number | null | undefined): boolean =>
  durationMs != null && durationMs > SLOW_THRESHOLD_MS;

const getStatusMessage = (
  status: TransactionStatus,
  attemptNumber: number | null | undefined,
  slow: boolean,
): { title: string; subtitle: string } => {
  switch (status) {
    case 'PENDING_PAYMENT':
      return {
        title: 'Vérification du paiement...',
        subtitle: 'Nous confirmons votre paiement',
      };
    case 'PAID':
      return {
        title: 'Paiement confirmé ✓',
        subtitle: 'Votre paiement a été accepté',
      };
    case 'PROVISIONING':
    case 'PROCESSING': {
      if (slow) {
        return {
          title: 'Ça prend un peu plus de temps...',
          subtitle: 'Tout va bien, nous continuons',
        };
      }
      if (attemptNumber && attemptNumber === 2) {
        return {
          title: 'On réessaie...',
          subtitle: `Tentative ${attemptNumber} en cours`,
        };
      }
      if (attemptNumber && attemptNumber >= 3) {
        return {
          title: 'Encore une tentative...',
          subtitle: `Tentative ${attemptNumber} en cours`,
        };
      }
      return {
        title: 'Activation de votre eSIM...',
        subtitle: 'Connexion au fournisseur en cours',
      };
    }
    case 'COMPLETED':
      return {
        title: 'eSIM activée !',
        subtitle: 'Vous êtes prêt à voyager',
      };
    case 'FAILED':
      return {
        title: 'Une erreur est survenue',
        subtitle: "Nous n'avons pas pu activer votre eSIM",
      };
    case 'EXPIRED':
      return {
        title: 'Session expirée',
        subtitle: 'Le délai de paiement a été dépassé',
      };
    default:
      return {
        title: 'Traitement en cours...',
        subtitle: 'Veuillez patienter',
      };
  }
};

const activeDotIndex = (attemptNumber: number | null | undefined): number => {
  if (!attemptNumber || attemptNumber <= 1) return 0;
  if (attemptNumber === 2) return 1;
  return 2;
};

type Props = NativeStackScreenProps<HomeStackParamList, 'ProcessingModal'>;

export const ProcessingModal = ({ navigation, route }: Props) => {
  const { transactionId, channel } = route.params;

  const [shouldPoll, setShouldPoll] = useState(true);
  const { data: transaction } = useTransactionById(String(transactionId), shouldPoll ? 3000 : false);

  const status: TransactionStatus = transaction?.status ?? 'PENDING_PAYMENT';
  const attemptNumber = transaction?.attemptNumber ?? null;
  const durationMs = transaction?.durationMs ?? null;
  const slow = isSlow(durationMs);
  const { title, subtitle } = getStatusMessage(status, attemptNumber, slow);

  // Rotation animation (airplane)
  const rotation = useSharedValue(0);
  const iconScale = useSharedValue(1);
  const iconTranslateX = useSharedValue(0);
  // Dot pulse scale
  const dotScale = useSharedValue(1);

  const isTerminal = TERMINAL_STATUSES.includes(status);
  const isCompleted = status === 'COMPLETED';
  const isFailed = status === 'FAILED';

  useEffect(() => {
    if (!isTerminal) {
      rotation.value = withRepeat(
        withTiming(360, { duration: 1200, easing: Easing.linear }),
        -1,
        false,
      );
    }
  }, []);

  useEffect(() => {
    if (isCompleted) {
      rotation.value = 0;
      iconScale.value = withSequence(
        withTiming(1.2, { duration: 300 }),
        withTiming(1, { duration: 300 }),
      );
    } else if (isFailed) {
      rotation.value = 0;
      iconTranslateX.value = withSequence(
        withTiming(-8, { duration: 80 }),
        withTiming(8, { duration: 80 }),
        withTiming(-8, { duration: 80 }),
        withTiming(8, { duration: 80 }),
        withTiming(0, { duration: 80 }),
      );
    }
  }, [isCompleted, isFailed]);

  // Stop polling and navigate away once terminal
  useEffect(() => {
    if (!TERMINAL_STATUSES.includes(status)) return;
    setShouldPoll(false);

    if (isCompleted) {
      const timer = setTimeout(() => {
        navigation.replace('EsimSuccess', { transactionId, channel });
      }, 1500);
      return () => clearTimeout(timer);
    }
    if (isFailed) {
      navigation.replace('EsimFailed', { transactionId });
    }
    if (status === 'EXPIRED') {
      navigation.replace('EsimExpired', { transactionId });
    }
  }, [status]);

  // Dot pulse
  useEffect(() => {
    dotScale.value = withRepeat(
      withSequence(
        withTiming(1.3, { duration: 500 }),
        withTiming(1, { duration: 500 }),
      ),
      -1,
      false,
    );
  }, []);

  const iconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${rotation.value}deg` },
      { scale: iconScale.value },
      { translateX: iconTranslateX.value },
    ],
  }));

  const dotScaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: dotScale.value }],
  }));

  const iconColor = isCompleted
    ? colors.success?.DEFAULT ?? '#22C55E'
    : isFailed
    ? colors.error?.DEFAULT ?? '#EF4444'
    : colors.primary.DEFAULT;

  const iconName = isCompleted
    ? 'checkmark-circle'
    : isFailed
    ? 'close-circle'
    : 'airplane';

  const activeDot = activeDotIndex(attemptNumber);

  return (
    <View style={styles.backdrop}>
      <View style={styles.card}>
        <Animated.View style={iconAnimatedStyle}>
          <Ionicons name={iconName as any} size={48} color={iconColor} />
        </Animated.View>

        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>

        <View style={styles.dotsRow}>
          {[0, 1, 2].map((i) => {
            const isActive = i === activeDot;
            return isActive ? (
              <Animated.View key={i} style={[styles.dot, styles.dotActive, dotScaleStyle]} />
            ) : (
              <View key={i} style={[styles.dot, styles.dotInactive]} />
            );
          })}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radii.xxl,
    padding: spacing.xl,
    width: '80%',
    maxWidth: 320,
    alignItems: 'center',
    ...shadows.high,
  },
  title: {
    ...typography.titleMD,
    color: colors.text.primary,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  subtitle: {
    ...typography.bodySM,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xl,
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    backgroundColor: colors.primary.DEFAULT,
  },
  dotInactive: {
    backgroundColor: colors.border,
  },
});
