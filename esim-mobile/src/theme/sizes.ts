export const sizes = {
  icon: {
    xs: 12,
    sm: 16,
    sm2: 18,  // bell, chevron-back, small action icons
    md: 20,
    nav: 20,
    lg: 24,
    xl: 32,
    xxl: 48,
  },

  progressBar: {
    height: 6,
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
    cta: 52,
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
    paymentMethodIcon: 40,
  },

  decoration: {
    authCircleSm: 72,
    authCircleLg: 112,
    authBlobSm: 256,
    authBlobLg: 288,
    heroOrbSm: 140,
    heroOrbLg: 220,
    headerOrb: 120,     // decorative ambient orb in screen hero headers
    onboardingWordmark: 52,
    successIcon: 72,
    successCircle: 132,
    checkCircle: 96,    // main icon circle across success/payment screens
    checkGlow: 120,     // outer glow halo behind icon circle
    successBlobLg: 300, // decorative background blob in PaymentSuccessScreen
    qrPayment: 190,     // QR code size inside the PaymentSuccessScreen card
    processingDot: 8,   // progress indicator dots in ProcessingModal
    regionBgIcon: 90,   // decorative background icon in RegionCard
    regionOrb: 80,      // decorative ambient orb in RegionCard
  },

  iconWrap: {
    xs: 28,  // small icon container (e.g. urgentIconBox, bellBadge area)
    sm: 36,
    md: 40,
    lg: 72,  // large empty-state icon circles
  },

  bottomSheet: {
    handleHeight: 4,
    handleWidth: 32,
  },
} as const;
