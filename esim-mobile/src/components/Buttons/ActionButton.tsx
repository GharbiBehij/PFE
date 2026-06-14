import { Ionicons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { colors, radii, shadows, spacing, sizes } from '../../theme';

type ActionButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  size?: 'sm' | 'md';
  style?: StyleProp<ViewStyle>;
  loading?: boolean;
};

const actionShadow = shadows.secondaryGlow ?? shadows.medium;

export const ActionButton = ({ label, onPress, disabled = false, icon, size = 'md', style, loading }: ActionButtonProps) => {
  const isSmall = size === 'sm';
  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={onPress}
        activeOpacity={0.8}
        style={[
          styles.button,
          isSmall && styles.buttonSm,
          disabled && styles.buttonDisabled,
        ]}
      >
        {icon ? (
          <Ionicons
            name={icon}
            size={isSmall ? 14 : sizes.icon.sm}
            color={colors.text.onSecondary}
          />
        ) : null}
        {loading ? (
          <ActivityIndicator color={colors.text.onSecondary} />
        ) : (
          <Text style={[styles.label, isSmall && styles.labelSm]}>{label}</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignSelf: 'stretch',
  },
  button: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.secondary.DEFAULT,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    ...actionShadow,
  },
  buttonSm: {
    minHeight: 42,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },

  buttonDisabled: {
    opacity: 0.5,
  },
  label: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text.onSecondary,
  },
  labelSm: {
    fontSize: 13,
  },
});