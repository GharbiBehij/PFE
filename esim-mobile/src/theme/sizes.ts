export const sizes = {
  icon: {
    xs: 12,
    sm: 16,
    md: 20,
    nav: 20,
    lg: 24,
    xl: 32,
    xxl: 48,
  },

  bottomNav: {
    height: 56,
    iconContainerWidth: 38,
    iconContainerHeight: 30,
    iconSize: 24,
  },

  touch: {
    sm: 44,
    md: 48,
    lg: 56,
  },

  avatar: {
    xs: 24,
    sm: 32,
    md: 40,
    lg: 48,
    xl: 64,
  },

  badge: {
    height: 20,
    minWidth: 20,
  },

  radio: 16,
  radioInner: 8,

  button: {
    minHeight: 56,
    minWidth: 120,
  },

  input: {
    height: 48, // 🔥 FIXED
  },

  card: {
    minHeight: 80,
  },

  tile: {
    paymentMethodMinHeight: 92,
  },

  decoration: {
    authCircleSm: 72,
    authCircleLg: 112,
    successIcon: 72,
    successCircle: 132,
  },

  bottomSheet: {
    handleHeight: 4,
    handleWidth: 32,
  },
} as const;