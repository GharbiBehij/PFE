import { Ionicons } from '@expo/vector-icons';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { colors, radii, shadows, spacing, typography } from '../theme';

type OutlineButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  iconName?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  containerStyle?: StyleProp<ViewStyle>;
  buttonStyle?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
};

export const OutlineButton = ({
  label,
  onPress,
  disabled = false,
  iconName,
  iconColor = colors.primary.DEFAULT,
  containerStyle,
  buttonStyle,
  labelStyle,
}: OutlineButtonProps) => {
  return (
    <View style={[styles.container, containerStyle]}>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityState={{ disabled }}
        activeOpacity={0.85}
        disabled={disabled}
        onPress={onPress}
        style={[styles.button, buttonStyle, disabled ? styles.buttonDisabled : undefined]}
      >
        {iconName ? <Ionicons color={iconColor} name={iconName} size={18} /> : null}
        <Text style={[styles.label, labelStyle]}>{label}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderColor: colors.primary.DEFAULT,
    borderRadius: radii.lg,
    borderWidth: 2,
    flex: 1,
    overflow: 'hidden',
    ...shadows.medium,
  },
  button: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    width: '100%',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  label: {
    ...typography.button,
    color: colors.primary.DEFAULT,
    fontWeight: '700',
    textAlign: 'center',
  },
});
