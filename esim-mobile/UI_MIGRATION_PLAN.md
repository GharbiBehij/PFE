# UI Migration Plan

## Goal

Every screen must follow this fixed structure:

ScreenShell
- ScreenHeader
- ScreenContent
- ScreenFooter (optional)

Inside `ScreenContent`, spacing must use semantic wrappers only:
- `Section`
- `Group`
- `Item`

## Phase 1: Design System Freeze (Locked)

Locked files:
- `src/theme/colors.ts`
- `src/theme/spacing.ts`
- `src/theme/typography.ts`
- `src/theme/shadows.ts`
- `src/theme/patterns.ts`

Rules:
- No new patterns outside `src/theme/patterns.ts`
- No ad-hoc layout redesigns
- If style is not derived from theme/patterns, it is forbidden

Allowed slot primitives:
- `src/components/layout/ScreenShell.tsx`
- `src/components/layout/ScreenHeader.tsx`
- `src/components/layout/ScreenContent.tsx`
- `src/components/layout/ScreenFooter.tsx`
- `src/components/layout/Section.tsx`

## Migration Order

1. Home / Destinations
2. Offers (Search, Listing, Detail)
3. Payment (Payment, Success)
4. eSIMs (My eSIMs, Detail)
5. Profile (all profile screens)
6. Wallet (Wallet, Top-up)
7. Auth (Login, Register)

## Screen Inventory

- `src/screens/home/HomeScreen.tsx` - migrated
- `src/screens/offers/DestinationsScreen.tsx` - migrated
- `src/screens/offers/SearchScreen.tsx` - migrated
- `src/screens/offers/PackageListingScreen.tsx` - migrated
- `src/screens/offers/PackageDetailScreen.tsx` - migrated
- `src/screens/payment/PaymentScreen.tsx` - migrated
- `src/screens/payment/SuccessScreen.tsx` - migrated
- `src/screens/esims/MyEsimsScreen.tsx` - migrated
- `src/screens/esims/EsimDetailScreen.tsx` - migrated
- `src/screens/profile/ProfileScreen.tsx` - migrated
- `src/screens/profile/PersonalDetailsScreen.tsx` - migrated
- `src/screens/profile/PaymentMethodsScreen.tsx` - migrated
- `src/screens/profile/SettingsScreen.tsx` - migrated
- `src/screens/profile/HelpCenterScreen.tsx` - migrated
- `src/screens/wallet/WalletScreen.tsx` - migrated
- `src/screens/wallet/TopUpScreen.tsx` - migrated
- `src/screens/auth/LoginScreen.tsx` - migrated
- `src/screens/auth/RegisterScreen.tsx` - migrated
