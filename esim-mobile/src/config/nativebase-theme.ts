import { extendTheme } from 'native-base';
import { colors as appColors } from '../theme/colors';
import { radii, spacing } from '../theme/spacing';
import { shadows } from '../theme/shadows';
import { sizes } from '../theme/sizes';
import { typography } from '../theme/typography';

const nativeBaseColors = {
  primary: {
    50: appColors.primary[50],
    100: appColors.primary[100],
    200: appColors.primary[200],
    300: appColors.primary[300],
    400: appColors.primary[400],
    500: appColors.primary[500],
    600: appColors.primary[600],
    700: appColors.primary[700],
    800: appColors.primary[800],
    900: appColors.primary[900],
  },
  secondary: {
    50: appColors.secondary[50],
    100: appColors.secondary[100],
    200: appColors.secondary[200],
    300: appColors.secondary[300],
    400: appColors.secondary[400],
    500: appColors.secondary[500],
    600: appColors.secondary[600],
    700: appColors.secondary[600],
    800: appColors.secondary[600],
    900: appColors.secondary[600],
  },
  gray: {
    50: appColors.gray[50],
    100: appColors.gray[100],
    200: appColors.gray[200],
    300: appColors.gray[300],
    400: appColors.gray[400],
    500: appColors.gray[500],
    600: appColors.gray[600],
    700: appColors.gray[700],
    800: appColors.gray[800],
    900: appColors.gray[900],
  },
  success: {
    600: appColors.success[600],
  },
  error: {
    600: appColors.error[600],
  },
  warning: {
    600: appColors.warning[600],
  },
} as const;

const nativeBaseSpace = {
  0: spacing[0],
  1: spacing.xxs,
  2: spacing.xs,
  3: spacing.sm,
  4: spacing.md,
  5: spacing.lg,
  6: spacing.xl,
  8: spacing.xxl,
  12: spacing.xxxl,
} as const;

const nativeBaseRadii = {
  none: radii.none,
  sm: radii.sm,
  md: radii.md,
  lg: radii.lg,
  xl: radii.xl,
  full: radii.full,
} as const;

export const nativeBaseTheme = extendTheme({
  colors: nativeBaseColors,
  space: nativeBaseSpace,
  radii: nativeBaseRadii,
  config: {
    initialColorMode: 'light',
  },
  components: {
    Button: {
      baseStyle: {
        borderRadius: radii.lg,
        minHeight: sizes.button.minHeight,
        _text: {
          fontSize: typography.button.fontSize,
          fontWeight: typography.button.fontWeight,
          lineHeight: typography.button.lineHeight,
          letterSpacing: typography.button.letterSpacing,
        },
      },
      defaultProps: {
        size: 'lg',
        colorScheme: 'primary',
      },
      variants: {
        solid: (props: { colorScheme?: string }) => ({
          bg: props.colorScheme === 'secondary' ? appColors.secondary.DEFAULT : appColors.primary.DEFAULT,
          _pressed: {
            bg: props.colorScheme === 'secondary' ? appColors.state.secondaryPressed : appColors.state.primaryPressed,
            shadowColor: shadows.low.shadowColor,
            shadowOffset: shadows.low.shadowOffset,
            shadowOpacity: shadows.low.shadowOpacity,
            shadowRadius: shadows.low.shadowRadius,
            elevation: shadows.low.elevation,
            style: {
              transform: [{ scale: 0.98 }],
            },
          },
        }),
      },
    },
    Input: {
      baseStyle: {
        borderRadius: radii.md,
        minHeight: sizes.input.height,
      },
      defaultProps: {
        size: 'lg',
        bg: appColors.surfaceMuted,
        borderColor: appColors.border,
        borderWidth: 1,
        px: spacing.md,
      },
    },
    Heading: {
      baseStyle: {
        color: appColors.text.primary,
        fontSize: typography.titleSM.fontSize,
        fontWeight: typography.titleSM.fontWeight,
        lineHeight: typography.titleSM.lineHeight,
      },
    },
    Text: {
      baseStyle: {
        color: appColors.text.primary,
        fontSize: typography.bodyMD.fontSize,
        fontWeight: typography.bodyMD.fontWeight,
        lineHeight: typography.bodyMD.lineHeight,
      },
      defaultProps: {
        fontSize: 'md',
      },
    },
  },
});
