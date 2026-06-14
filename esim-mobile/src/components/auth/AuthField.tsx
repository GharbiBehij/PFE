import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { colors, radii, sizes, spacing, typography } from '../../theme';

type AuthFieldProps = TextInputProps & {
  containerStyle?: StyleProp<ViewStyle>;
  iconName: keyof typeof MaterialCommunityIcons.glyphMap;
  inputSize?: 'md' | 'sm';
  isPasswordVisible?: boolean;
  label?: string;
  onTogglePasswordVisibility?: () => void;
};

export const AuthField = ({
  containerStyle,
  iconName,
  inputSize = 'md',
  isPasswordVisible,
  label,
  onTogglePasswordVisibility,
  secureTextEntry,
  style,
  ...inputProps
}: AuthFieldProps) => {
  const hasPasswordToggle = typeof onTogglePasswordVisibility === 'function';

  return (
    <View style={containerStyle}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.inputWrapper}>
        <MaterialCommunityIcons
          color={colors.text.tertiary}
          name={iconName}
          size={inputSize === 'sm' ? sizes.icon.sm : sizes.icon.md}
          style={inputSize === 'sm' ? styles.inputIconSm : styles.inputIcon}
        />
        <TextInput
          placeholderTextColor={colors.text.tertiary}
          secureTextEntry={secureTextEntry}
          style={[inputSize === 'sm' ? styles.inputSm : styles.input, style]}
          {...inputProps}
        />
        {hasPasswordToggle ? (
          <Pressable
            accessibilityRole="button"
            onPress={onTogglePasswordVisibility}
            style={styles.eyeButton}
          >
            <Ionicons
              color={colors.text.tertiary}
              name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
              size={sizes.icon.md}
            />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  label: {
    ...typography.labelMD,
    color: colors.gray[700],
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  inputWrapper: {
    alignItems: 'center',
    backgroundColor: colors.gray[50],
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: sizes.touch.lg,
  },
  inputIcon: {
    paddingHorizontal: spacing.md,
  },
  inputIconSm: {
    paddingHorizontal: spacing.sm + spacing.xxs,
  },
  input: {
    ...typography.bodyLG,
    color: colors.gray[800],
    flex: 1,
    paddingVertical: spacing.lg,
  },
  inputSm: {
    ...typography.bodyMD,
    color: colors.gray[800],
    flex: 1,
    paddingVertical: spacing.lg,
  },
  eyeButton: {
    minHeight: sizes.touch.sm,
    minWidth: sizes.touch.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
