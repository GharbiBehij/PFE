import { Ionicons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { colors, radii, shadows, spacing, typography } from '../../theme';

type PrimaryButtonProps = {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  iconName?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  containerStyle?: StyleProp<ViewStyle>;
  buttonStyle?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
};

export const PrimaryButton = ({
  label,
  onPress,
  loading = false,
  disabled = false,
  iconName,
  iconColor = colors.primary[900],
  containerStyle,
  buttonStyle,
  labelStyle,
}: PrimaryButtonProps) => {
  return (
    <View style={[styles.container, containerStyle]}>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityState={{ disabled: disabled || loading }}
        activeOpacity={0.85}
        disabled={disabled || loading}
        onPress={onPress}
        style={[styles.button, buttonStyle, (disabled || loading) && styles.buttonDisabled]}
      >
        {loading ? (
          <>
            <ActivityIndicator color={colors.primary[900]} size="small" />
            <Text style={[styles.label, labelStyle]}>Traitement...</Text>
          </>
        ) : (
          <>
            {iconName ? <Ionicons color={iconColor} name={iconName} size={18} /> : null}
            <Text style={[styles.label, labelStyle]}>{label}</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.secondary.DEFAULT,
    borderColor: colors.secondary.dark,
    borderRadius: radii.lg,
    borderWidth: 2,
    overflow: 'hidden',
    ...shadows.secondaryGlow,
  },
  button: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    width: '100%',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  label: {
    ...typography.button,
    color: colors.primary[900],
    fontWeight: '700',
    textAlign: 'center',
  },
});