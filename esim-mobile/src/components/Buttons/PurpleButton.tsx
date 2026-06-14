import { Ionicons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { colors, radii, shadows, spacing, sizes } from '../../theme';

type PurpleButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  size?: 'sm' | 'md';
  style?: StyleProp<ViewStyle>;
};

export const PurpleButton = ({ label, onPress, disabled = false, loading = false, icon, size = 'md', style }: PurpleButtonProps) => {
  const isSmall = size === 'sm';
  const isDisabled = disabled || loading;
  return (
    <View style={[styles.container, style]}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: isDisabled }}
        disabled={isDisabled}
        onPress={onPress}
        style={({ pressed }) => [
          styles.button,
          isSmall && styles.buttonSm,
          pressed && !isDisabled && styles.buttonPressed,
          isDisabled && styles.buttonDisabled,
        ]}
      >
        {loading ? (
          <>
            <ActivityIndicator color={colors.white} size="small" />
            <Text style={[styles.label, isSmall && styles.labelSm]}>Traitement...</Text>
          </>
        ) : (
          <>
            {icon ? (
              <Ionicons name={icon} size={isSmall ? 14 : sizes.icon.sm} color={colors.white} />
            ) : null}
            <Text style={[styles.label, isSmall && styles.labelSm]}>{label}</Text>
          </>
        )}
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignSelf: 'stretch',
  },
  button: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary.DEFAULT,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    ...shadows.medium,
  },
  buttonSm: {
    minHeight: 42,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  buttonPressed: {
    backgroundColor: colors.primary.dark,
    transform: [{ scale: 0.97 }],
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.white,
  },
  labelSm: {
    fontSize: 13,
  },
});