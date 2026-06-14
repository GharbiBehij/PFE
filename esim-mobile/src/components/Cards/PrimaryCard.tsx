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
import { colors, radii, shadows, sizes, spacing, typography } from '../../theme';

export type PrimaryButtonVariant = 'yellow' | 'purple' | 'outline';

type PrimaryButtonProps = {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: PrimaryButtonVariant;
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
  variant = 'yellow',
  iconName,
  iconColor,
  containerStyle,
  buttonStyle,
  labelStyle,
}: PrimaryButtonProps) => {
  const isDisabled = disabled || loading;
  const defaultIconColor =
    variant === 'yellow' ? colors.primary[900]
    : variant === 'purple' ? colors.white
    : colors.primary.DEFAULT;

  const variantContainerStyle =
    variant === 'yellow' ? styles.containerYellow
    : variant === 'purple' ? styles.containerPurple
    : styles.containerOutline;

  const variantLabelStyle =
    variant === 'yellow' ? styles.labelYellow
    : variant === 'purple' ? styles.labelPurple
    : styles.labelOutline;

  return (
    <View
      style={[
        styles.container,
        variantContainerStyle,
        isDisabled && styles.containerDisabled,
        containerStyle,
      ]}
    >
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityState={{ disabled: isDisabled }}
        activeOpacity={0.85}
        disabled={isDisabled}
        onPress={onPress}
        style={[styles.button, buttonStyle]}
      >
        {loading ? (
          <>
            <ActivityIndicator
              color={variant === 'yellow' ? colors.primary[900] : colors.white}
              size="small"
            />
            <Text style={[styles.label, variantLabelStyle, labelStyle]}>
              Traitement...
            </Text>
          </>
        ) : (
          <>
            {iconName ? (
              <Ionicons
                color={iconColor ?? defaultIconColor}
                name={iconName}
                size={sizes.icon.md}
              />
            ) : null}
            <Text style={[styles.label, variantLabelStyle, labelStyle]}>
              {label}
            </Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: radii.lg,
    overflow: 'hidden',
  },
  // Yellow CTA (default) — secondary.DEFAULT bg + secondaryGlow shadow
  containerYellow: {
    backgroundColor: colors.secondary.DEFAULT,
    borderColor: colors.secondary.dark,
    borderWidth: 2,
    ...shadows.glow,
  },
  // Purple (secondary action) — primary bg + medium shadow
  containerPurple: {
    backgroundColor: colors.primary.DEFAULT,
    ...shadows.medium,
  },
  // Outline — white bg + 1.5px primary border, no shadow
  containerOutline: {
    backgroundColor: colors.white,
    borderColor: colors.primary.DEFAULT,
    borderWidth: 1.5,
  },
  // Disabled — flatten opacity, neutralise shadow
  containerDisabled: {
    opacity: 0.55,
    shadowOpacity: 0,
    elevation: 0,
  },
  button: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: sizes.button.minHeight,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    width: '100%',
  },
  label: {
    ...typography.button,
    textAlign: 'center',
  },
  labelYellow: {
    color: colors.primary[900],
    fontWeight: '800',
  },
  labelPurple: {
    color: colors.white,
    fontWeight: '800',
  },
  labelOutline: {
    color: colors.primary.DEFAULT,
    fontWeight: '700',
  },
});
