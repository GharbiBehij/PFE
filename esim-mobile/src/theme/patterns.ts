import type { ViewStyle } from 'react-native';
import { colors } from './colors';
import { shadows } from './shadows';
import { radii, spacing } from './spacing';
import { sizes } from './sizes';

export const patterns = {
  // ======================
  // LAYOUT
  // ======================

  screen: {
    flex: 1,
    backgroundColor: colors.background,
  } as ViewStyle,

  screenPadding: {
    paddingHorizontal: spacing.xl,
  } as ViewStyle,

  section: {
    marginBottom: spacing.xl,
  } as ViewStyle,

  group: {
    marginBottom: spacing.lg,
  } as ViewStyle,

  element: {
    marginBottom: spacing.sm,
  } as ViewStyle,

  // ======================
  // SURFACES
  // ======================

  headerShell: {
    backgroundColor: colors.surface,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    ...shadows.medium,
  } as ViewStyle,

  card: {
    alignSelf: 'stretch',
    width: '100%',
    backgroundColor: colors.surfaceCard,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.card,
    padding: spacing.lg,
    ...shadows.medium,
  } as ViewStyle,

  cardCompact: {
    alignSelf: 'stretch',
    width: '100%',
    backgroundColor: colors.surfaceCard,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.card,
    padding: spacing.lg,
    ...shadows.medium,
  } as ViewStyle,

  // ======================
  // SELECTABLE CARDS (🔥 NEW CORE PATTERN)
  // ======================

  selectableCard: {
    alignSelf: 'stretch',
    width: '100%',
    backgroundColor: colors.surfaceCard,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.card,
    padding: spacing.lg,
    ...shadows.medium,
  } as ViewStyle,

  selectableCardSelected: {
    borderColor: colors.primary.DEFAULT,
    borderWidth: 1,
    backgroundColor: colors.primary[50],
    ...shadows.high,
  } as ViewStyle,

  summaryCard: {
    alignSelf: 'stretch',
    width: '100%',
    backgroundColor: colors.surfaceCard,
    borderColor: colors.primary[100],
    borderWidth: 1,
    borderRadius: radii.card,
    padding: spacing.lg,
    ...shadows.medium,
  } as ViewStyle,

  ctaPrimary: {
    width: '100%',
    minHeight: sizes.button.minHeight,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.lg,
    backgroundColor: colors.primary.DEFAULT,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    ...shadows.medium,
  } as ViewStyle,

  ctaPrimaryPressed: {
    backgroundColor: colors.state.primaryPressed,
    transform: [{ scale: 0.98 }],
    ...shadows.low,
  } as ViewStyle,

  ctaPrimaryDisabled: {
    backgroundColor: colors.text.disabled,
  } as ViewStyle,

  // ======================
  // FOOTERS
  // ======================

  stickyFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    ...shadows.high,
  } as ViewStyle,

  bottomNav: {
    width: '100%',
    height: sizes.bottomNav.height,
    backgroundColor: colors.white,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    borderBottomLeftRadius: radii.none,
    borderBottomRightRadius: radii.none,
    opacity: 1,
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    ...shadows.medium,
  } as ViewStyle,

  bottomNavIconContainer: {
    width: sizes.bottomNav.iconContainerWidth,
    height: sizes.bottomNav.iconContainerHeight,
    borderRadius: radii.nav,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  } as ViewStyle,

  bottomNavIconContainerSelected: {
    backgroundColor: colors.primary.DEFAULT,
    borderColor: colors.primary.DEFAULT,
  } as ViewStyle,

  bottomNavIconContainerFocused: {
    transform: [{ scale: 1.08 }, { translateY: -1 }],
    ...shadows.medium,
  } as ViewStyle,

  bottomNavIconContainerUnselected: {
    backgroundColor: colors.white,
    borderColor: colors.primary.DEFAULT,
  } as ViewStyle,

  // ======================
  // HEADERS
  // ======================

  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  } as ViewStyle,

  // ======================
  // INPUTS
  // ======================

  inputField: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md, // 🔥 FIXED
  } as ViewStyle,

  searchField: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceCard,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.card,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    ...shadows.medium,
  } as ViewStyle,

  // ======================
  // INTERACTIONS
  // ======================

  pressableBase: {
    borderRadius: radii.lg,
  } as ViewStyle,

  pressablePressed: {
    transform: [{ scale: 0.98 }],
  } as ViewStyle,

  selectedBorder: {
    borderColor: colors.primary.DEFAULT,
    borderWidth: 1,
  } as ViewStyle,

  unselectedBorder: {
    borderColor: colors.border,
    borderWidth: 1,
  } as ViewStyle,

  selectedBackground: {
    backgroundColor: colors.primary[100],
  } as ViewStyle,

  unselectedBackground: {
    backgroundColor: colors.surface,
  } as ViewStyle,
} as const;