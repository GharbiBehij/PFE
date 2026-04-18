export const spacing = {
  0: 0,
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 40,
  xxxxl: 48,
  xxxxxl: 64,
} as const;

// Semantic (use this mentally, not always directly)
export const layoutSpacing = {
  screenPadding: spacing.xl,   // 24
  sectionGap: spacing.xl,      // 24
  componentGap: spacing.md,    // 12
  itemGap: spacing.sm,         // 8
  minTouchTarget: 44,
} as const;

export const radii = {
  none: 0,
  xs: 4,
  sm: 8,
  card: 20,
  nav: 18,
  md: 12,
  lg: 16,     // 🔥 PRIMARY radius (cards/buttons)
  xl: 24,
  xxl: 32,
  full: 9999,
} as const;

export const borderRadius = {
  input: radii.md,
  button: radii.lg,
  card: radii.card,
  pill: radii.full,
} as const;