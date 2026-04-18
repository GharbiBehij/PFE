export const colors = {
  // Primary Purple (Main brand)
  primary: {
    DEFAULT: '#7C3AED',    // violet-600
    light: '#8B5CF6',      // violet-500
    dark: '#6D28D9',       // violet-700
    50: '#F5F3FF',
    100: '#EDE9FE',
    200: '#DDD6FE',
    300: '#C4B5FD',
    400: '#A78BFA',
    500: '#8B5CF6',
    600: '#7C3AED',
    700: '#6D28D9',
    800: '#5B21B6',
    900: '#4C1D95',
  },

  // Secondary Yellow (Accent/CTA)
  secondary: {
    DEFAULT: '#FACC15',
    dark: '#FBBF24',
    50: '#FFFBEB',
    100: '#FEF3C7',
    200: '#FDE68A',
    300: '#FCD34D',
    400: '#FACC15',
    500: '#EAB308',
    600: '#CA8A04',
  },
  info: {
  DEFAULT: '#3B82F6',
  light: '#60A5FA',
  dark: '#2563EB',
  50: '#EFF6FF',
  100: '#DBEAFE',
  600: '#3B82F6',
},

  // Neutrals (Gray scale)
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },

  // Semantic Colors
  success: {
    DEFAULT: '#10B981',
    light: '#34D399',
    dark: '#059669',
    50: '#ECFDF5',
    100: '#D1FAE5',
    600: '#10B981',
  },

  error: {
    DEFAULT: '#EF4444',
    light: '#F87171',
    dark: '#DC2626',
    50: '#FEF2F2',
    100: '#FEE2E2',
    600: '#EF4444',
  },

  warning: {
    DEFAULT: '#F59E0B',
    light: '#FBBF24',
    dark: '#D97706',
    50: '#FFFBEB',
    100: '#FEF3C7',
    600: '#F59E0B',
  },

  // Surfaces
  background: '#FAFAFA',      // App background
  surface: '#FFFFFF',         // Card backgrounds
  surfaceCard: '#FCF7F7',     // Unified Figma card/nav surface
  surfaceElevated: '#FFFFFF', // Elevated cards (same as surface for now)
  surfaceMuted: '#F3F4F6',    // Muted surface (gray-100)
  overlay: 'rgba(0, 0, 0, 0.5)', // Modals/sheets

  // Borders & Dividers
  border: '#E5E7EB',          // gray-200
  divider: '#E5E7EB',         // gray-200
  borderSubtle: '#F3F4F6',    // gray-100 for very subtle borders

  // Text
  text: {
    primary: '#111827',       // gray-900
    secondary: '#6B7280',     // gray-500
    tertiary: '#6B7280',      // gray-400
    disabled: '#D1D5DB',      // gray-300
    onPrimary: '#FFFFFF',     // White on purple
    onSecondary: '#111827',   // Dark on yellow
    link: '#7C3AED',          // Primary purple
  },

  // Interactive States (NEW - Critical for UX)
  state: {
    hover: 'rgba(124, 58, 237, 0.08)',      // primary with 8% opacity
    pressed: 'rgba(124, 58, 237, 0.12)',    // primary with 12% opacity
    focus: '#7C3AED',                        // primary
    disabled: '#F3F4F6',                     // gray-100
    selected: '#EDE9FE',                     // primary-100
    primaryPressed: '#6D28D9',               // primary-700
    secondaryPressed: '#FBBF24',             // secondary dark
    surfacePressed: '#F3F4F6',               // gray-100
    onPrimaryOverlay20: 'rgba(255, 255, 255, 0.20)',
  },

  // Semantic Status Colors
  status: {
    active: {
      background: '#ECFDF5', // success-50
      text: '#059669',       // success dark
      border: '#D1FAE5',     // success-100
    },
    inactive: {
      background: '#FEF3C7', // warning-100
      text: '#D97706',       // warning dark
      border: '#FDE68A',     // secondary-200
    },
    expired: {
      background: '#F3F4F6', // gray-100
      text: '#374151',       // gray-700
      border: '#E5E7EB',     // gray-200
    },
    deleted: {
      background: '#F3F4F6', // gray-100
      text: '#374151',       // gray-700
      border: '#E5E7EB',     // gray-200
    },
    pending: {
      background: '#FEF3C7', // warning-100 (action needed)
      text: '#D97706',       // warning dark
      border: '#FDE68A',     // secondary-200
},
    processing: {
      background: '#EDE9FE', // primary-100
      text: '#6D28D9',       // primary-700
      border: '#DDD6FE',     // primary-200
    },
    succeeded: {
      background: '#ECFDF5', // success-50
      text: '#059669',       // success dark
      border: '#D1FAE5',     // success-100
    },
    failed: {
      background: '#FEF2F2', // error-50
      text: '#DC2626',       // error dark
      border: '#FEE2E2',     // error-100
    },
  },

  // Special
  black: '#000000',
  white: '#FFFFFF',
  transparent: 'transparent',
} as const;