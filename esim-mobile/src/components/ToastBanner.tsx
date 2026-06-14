import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, shadows, spacing, typography, zIndex } from '../theme';

export type ToastType = 'success' | 'error';

type Props = {
  type: ToastType;
  title: string;
  message: string;
  /** Called after the exit animation completes so the parent can unmount */
  onDismiss: () => void;
  /** Visible duration in ms before the exit animation starts (default 3500) */
  durationMs?: number;
};

const SLIDE_DISTANCE = -220; // offscreen above the safe area (increased for taller toast)

export const ToastBanner = ({
  type,
  title,
  message,
  onDismiss,
  durationMs = 3500,
}: Props) => {
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(SLIDE_DISTANCE);
  const opacity = useSharedValue(0);

  const isSuccess = type === 'success';
  const accentColor = isSuccess ? colors.success.DEFAULT : colors.error.DEFAULT;
  const bgColor = isSuccess ? colors.success[50] : colors.error[50];
  const iconName = isSuccess ? 'checkmark-circle' : 'close-circle';

  useEffect(() => {
    // Slide in
    translateY.value = withSpring(insets.top + 12, {
      damping: 18,
      stiffness: 220,
    });
    opacity.value = withTiming(1, { duration: 200 });

    // Slide out after durationMs
    translateY.value = withDelay(
      durationMs,
      withSpring(SLIDE_DISTANCE, { damping: 18, stiffness: 220 }, (finished) => {
        if (finished) runOnJS(onDismiss)();
      }),
    );
    opacity.value = withDelay(durationMs, withTiming(0, { duration: 250 }));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[styles.container, { backgroundColor: bgColor }, animatedStyle]}
      pointerEvents="none"
    >
      <View style={[styles.accent, { backgroundColor: accentColor }]} />
      <Ionicons
        name={iconName as any}
        size={28}
        color={accentColor}
        style={styles.icon}
      />
      <View style={styles.textBlock}>
        <Text style={[styles.title, { color: accentColor }]} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.message} numberOfLines={3}>
          {message}
        </Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: spacing.sm,
    right: spacing.sm,
    zIndex: zIndex.toast,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.lg,
    overflow: 'hidden',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    ...shadows.high,
  },
  accent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 5,
    borderTopLeftRadius: radii.lg,
    borderBottomLeftRadius: radii.lg,
  },
  icon: {
    marginLeft: spacing.sm,
    marginRight: spacing.md,
  },
  textBlock: {
    flex: 1,
    gap: 4,
  },
  title: {
    ...typography.labelMD,
    fontSize: 15,
    fontWeight: '700',
  },
  message: {
    ...typography.bodyMD,
    color: colors.text.secondary,
  },
});
