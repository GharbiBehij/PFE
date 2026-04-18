export const typography = {
  // Display (Hero text)
  displayXL: {
    fontSize: 48,
    fontWeight: '800' as const,
    lineHeight: 56,
    letterSpacing: -0.5,
  },
  displayLG: {
    fontSize: 40,
    fontWeight: '800' as const,
    lineHeight: 48,
    letterSpacing: -0.5,
  },

  // Titles
  titleXL: {
    fontSize: 32,
    fontWeight: '700' as const,
    lineHeight: 38,
    letterSpacing: -0.2,
  },
  titleLG: {
    fontSize: 26,
    fontWeight: '700' as const,
    lineHeight: 32,
  },
  titleMD: {
    fontSize: 22,
    fontWeight: '700' as const,
    lineHeight: 28,
  },
  titleSM: {
    fontSize: 18,
    fontWeight: '600' as const,
    lineHeight: 24,
  },

  // Body
  bodyLG: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
  },
  bodyMD: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
  },
  bodySM: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 18,
  },

  // Labels & Captions
  labelLG: {
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 20,
  },
  labelMD: {
    fontSize: 14,
    fontWeight: '600' as const,
    lineHeight: 18,
  },
  labelSM: {
    fontSize: 12,
    fontWeight: '600' as const,
    lineHeight: 16,
  },

  // Caption (smallest text)
  caption: {
    fontSize: 11,
    fontWeight: '400' as const,
    lineHeight: 14,
    letterSpacing: 0.3,
  },

  // Special
  overline: {
    fontSize: 11,
    fontWeight: '700' as const,
    lineHeight: 14,
    letterSpacing: 1.5,
    textTransform: 'uppercase' as const,
  },

  // Button text
  button: {
    fontSize: 16,
    fontWeight: '700' as const,
    lineHeight: 20,
    letterSpacing: 0.3,
  },

  // Code/Mono (for activation codes, etc.)
  mono: {
    fontFamily: 'monospace',
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
  },
} as const;