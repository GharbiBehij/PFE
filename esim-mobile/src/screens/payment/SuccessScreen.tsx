import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import QRCode from 'react-native-qrcode-svg';
import { useTransactionById } from '../../hooks/client/usePayment';
import type { HomeStackParamList } from '../../navigation/types';
import { colors, radii, spacing, typography } from '../../theme';

type Props = NativeStackScreenProps<HomeStackParamList, 'EsimSuccess'>;

export const SuccessScreen = ({ navigation, route }: Props) => {
  const { transactionId } = route.params;
  const [shared, setShared] = useState(false);

  const { data: transaction } = useTransactionById(String(transactionId), false);
  const activationCode = transaction?.esim?.activationCode ?? '';

  const circleScale   = useSharedValue(0);
  const circleRotate  = useSharedValue(-180);
  const contentOpacity = useSharedValue(0);
  const contentY      = useSharedValue(20);
  const cardY         = useSharedValue(50);
  const cardOpacity   = useSharedValue(0);

  useEffect(() => {
    circleScale.value  = withSpring(1, { damping: 12 });
    circleRotate.value = withSpring(0, { damping: 12 });
    contentOpacity.value = withDelay(200, withTiming(1, { duration: 300 }));
    contentY.value       = withDelay(200, withTiming(0, { duration: 300 }));
    cardY.value      = withDelay(400, withSpring(0, { damping: 14 }));
    cardOpacity.value = withDelay(400, withTiming(1, { duration: 400 }));
  }, []);

  const circleStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: circleScale.value },
      { rotate: `${circleRotate.value}deg` },
    ],
  }));

  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateY: contentY.value }],
  }));

  const cardStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ translateY: cardY.value }],
  }));

  const handleShare = async () => {
    if (!activationCode) return;
    await Share.share({ message: activationCode });
    setShared(true);
    setTimeout(() => setShared(false), 2000);
  };

  const goToEsims = () => {
    navigation.getParent()?.navigate('EsimsTab' as never);
  };

  const goHome = () => {
    navigation.getParent()?.navigate('HomeTab' as never);
  };

  return (
    <View style={styles.root}>
      {/* Background blobs */}
      <View style={styles.blobTop} />
      <View style={styles.blobBottom} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Animated checkmark circle */}
        <Animated.View style={[styles.circleWrap, circleStyle]}>
          <View style={styles.circle}>
            <Ionicons name="checkmark" size={48} color={colors.primary.DEFAULT} />
          </View>
        </Animated.View>

        {/* Title block */}
        <Animated.View style={[styles.titleWrap, contentStyle]}>
          <Text style={styles.title}>Paiement réussi !</Text>
          <Text style={styles.subtitle}>Votre eSIM est prête à être activée.</Text>
        </Animated.View>

        {/* White card */}
        <Animated.View style={[styles.card, cardStyle]}>
          {/* QR code */}
          <View style={styles.qrWrap}>
            {activationCode ? (
              <QRCode value={activationCode} size={200} />
            ) : (
              <View style={styles.qrPlaceholder}>
                <Text style={styles.qrPlaceholderText}>Code QR</Text>
              </View>
            )}
          </View>

          {/* Activation code row */}
          <View style={styles.codeRow}>
            <Text style={styles.codeText} ellipsizeMode="middle" numberOfLines={1}>
              {activationCode || '—'}
            </Text>
            <Pressable
              onPress={() => { void handleShare(); }}
              style={({ pressed }) => [styles.copyBtn, pressed && styles.copyBtnPressed]}
            >
              <Ionicons
                name={shared ? 'checkmark' : 'copy-outline'}
                size={18}
                color={colors.primary.DEFAULT}
              />
            </Pressable>
          </View>

          {/* Primary CTA */}
          <Pressable
            onPress={goToEsims}
            style={({ pressed }) => [styles.primaryBtn, pressed && styles.primaryBtnPressed]}
          >
            <Ionicons name="phone-portrait-outline" size={18} color={colors.gray[900]} />
            <Text style={styles.primaryBtnText}>Activer l'eSIM</Text>
          </Pressable>

          {/* Secondary CTA */}
          <Pressable
            onPress={goHome}
            style={({ pressed }) => [styles.secondaryBtn, pressed && styles.secondaryBtnPressed]}
          >
            <Text style={styles.secondaryBtnText}>Retour à l'accueil</Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.primary.DEFAULT,
    overflow: 'hidden',
  },
  blobTop: {
    position: 'absolute',
    top: '25%',
    left: '25%',
    width: 256,
    height: 256,
    borderRadius: 128,
    backgroundColor: colors.primary.light,
    opacity: 0.5,
  },
  blobBottom: {
    position: 'absolute',
    bottom: '25%',
    right: '25%',
    width: 384,
    height: 384,
    borderRadius: 192,
    backgroundColor: colors.primary[700],
    opacity: 0.5,
  },
  scroll: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxxxxl,
    paddingBottom: spacing.xxxl,
  },
  circleWrap: {
    marginBottom: spacing.xxl,
  },
  circle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
  titleWrap: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  title: {
    ...typography.titleLG,
    color: colors.white,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.bodyMD,
    color: colors.primary[200],
    textAlign: 'center',
    maxWidth: 280,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radii.xxl,
    padding: spacing.xl,
    width: '100%',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.25,
    shadowRadius: 32,
    elevation: 16,
  },
  qrWrap: {
    aspectRatio: 1,
    backgroundColor: colors.gray[100],
    borderRadius: radii.lg,
    marginBottom: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.gray[300],
    overflow: 'hidden',
    padding: spacing.lg,
  },
  qrPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  qrPlaceholderText: {
    ...typography.bodyMD,
    color: colors.gray[400],
    fontWeight: '500',
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[50],
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.gray[100],
  },
  codeText: {
    ...typography.bodySM,
    color: colors.gray[600],
    fontFamily: 'monospace',
    flex: 1,
    marginRight: spacing.md,
  },
  copyBtn: {
    padding: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: radii.sm,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  copyBtnPressed: {
    backgroundColor: colors.gray[100],
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.secondary.DEFAULT,
    borderRadius: radii.lg,
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
    shadowColor: colors.secondary.DEFAULT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  primaryBtnPressed: {
    backgroundColor: colors.secondary.dark,
    transform: [{ scale: 0.98 }],
  },
  primaryBtnText: {
    ...typography.labelMD,
    color: colors.gray[900],
    fontWeight: '700',
  },
  secondaryBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: radii.lg,
    paddingVertical: spacing.md,
  },
  secondaryBtnPressed: {
    backgroundColor: colors.gray[50],
    transform: [{ scale: 0.98 }],
  },
  secondaryBtnText: {
    ...typography.labelMD,
    color: colors.gray[600],
    fontWeight: '700',
  },
});
