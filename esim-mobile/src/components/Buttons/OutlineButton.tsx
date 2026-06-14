import { Ionicons } from '@expo/vector-icons';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { colors, radii, spacing, sizes } from '../../theme';

type OutlineButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  size?: 'sm' | 'md';
  style?: StyleProp<ViewStyle>;
  color?: 'default' | 'error';
};

export const OutlineButton = ({ label, onPress, disabled = false, icon, size = 'md', style, color = 'default' }: OutlineButtonProps) => {
  const isSmall = size === 'sm';
  const isError = color === 'error';
  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={onPress}
        activeOpacity={0.75}
        style={[
          styles.button,
          isSmall && styles.buttonSm,
          isError && styles.buttonError,
          disabled && styles.buttonDisabled,
        ]}
      >
        {icon ? (
          <Ionicons
            name={icon}
            size={isSmall ? 14 : sizes.icon.sm}
            color={isError ? colors.error.DEFAULT : colors.primary.DEFAULT}
          />
        ) : null}
        <Text style={[styles.label, isSmall && styles.labelSm, isError && styles.labelError]}>{label}</Text>
      </TouchableOpacity>
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
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    borderWidth: 1.5,
    borderColor: colors.primary.DEFAULT,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  buttonSm: {
    minHeight: 42,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },

  buttonError: {
    borderColor: colors.error.DEFAULT,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary.DEFAULT,
  },
  labelSm: {
    fontSize: 13,
  },
  labelError: {
    color: colors.error.DEFAULT,
  },
});