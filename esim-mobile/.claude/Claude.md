# CLAUDE.md - esim-mobile (React Native)

Purpose: provide a low-token architecture map so agents do not scan the whole repo.

## 1) Do Not Read Everything

Default behavior:
- Read only the files listed in the task map below.
- Stop reading once enough context is found.
- Avoid broad searches over `src/**` unless debugging unknown regressions.

Avoid scanning by default:
- `android/`
- `ios/`
- `assets/`
- `node_modules/`
- generated build outputs

## 2) App Entry And Runtime Shell

Read first for global behavior:
- `App.tsx`
- `src/navigation/RootNavigator.tsx`
- `src/navigation/types.ts`

App composition (high level):
- Expo + React Navigation + React Query + AuthContext
- `apiClient` with JWT refresh interceptor in `src/api/client.ts`

## 3) Navigation Architecture

Root split:
- `RootNavigator`: authenticated -> `MainTabs`, else `AuthStack`

Tabs:
- `HomeTab` -> `HomeStack`
- `EsimsTab` -> `EsimsStack`
- `ProfileTab` -> `ProfileStack`

Primary tab-bar policy lives in:
- `src/navigation/MainTabs.tsx`

## 4) Feature Map (Minimal Read Set)

Offers and purchase entry:
- `src/screens/home/HomeScreen.tsx`
- `src/screens/offers/SearchScreen.tsx`
- `src/screens/offers/PackageListingScreen.tsx`
- `src/screens/offers/PackageDetailScreen.tsx`

Payment flow:
- `src/screens/payment/PaymentScreen.tsx`
- `src/screens/payment/SuccessScreen.tsx`
- `src/hooks/usePayment.ts`
- `src/api/payment.api.ts`
- `src/types/payment.ts`
- `src/components/PaymentMethodTile.tsx`

Offer fetching and normalization:
- `src/hooks/useOffers.ts`
- `src/api/offers.api.ts`
- `src/types/offer.ts`

Auth and session:
- `src/context/AuthContext.tsx`
- `src/hooks/useAuth.ts`
- `src/storage/tokenStorage.ts`
- `src/api/client.ts`

## 5) Design System Source Of Truth

Always prefer tokens and shared patterns:
- `src/theme/index.ts`
- `src/theme/colors.ts`
- `src/theme/spacing.ts`
- `src/theme/typography.ts`
- `src/theme/shadows.ts`
- `src/theme/patterns.ts`
- `src/theme/sizes.ts`

Use shared layout wrappers where possible:
- `src/components/layout/`

## 6) API Contract Snapshot Used By Mobile

Purchase endpoint used by app:
- `POST /transaction/purchase`

Transaction endpoints:
- `GET /transaction`
- `GET /transaction/:id`

Important: align request/response shapes with backend before UI logic changes.

## 7) Task-Based Read Plans

If task is payment result behavior:
1. `src/screens/payment/PaymentScreen.tsx`
2. `src/screens/payment/SuccessScreen.tsx`
3. `src/hooks/usePayment.ts`
4. `src/api/payment.api.ts`
5. `src/types/payment.ts`

If task is tab bar visibility:
1. `src/navigation/MainTabs.tsx`
2. stack files in `src/navigation/`

If task is offer-to-payment handoff:
1. `src/screens/offers/PackageListingScreen.tsx`
2. `src/screens/offers/PackageDetailScreen.tsx`
3. `src/screens/payment/PaymentScreen.tsx`
4. `src/navigation/types.ts`

## 8) Editing Rules

- Prefer minimal diffs.
- Do not change business logic when task is UI-only.
- Keep existing route names and API endpoint paths stable unless requested.
- Keep French user-facing text unless a task explicitly asks otherwise.

## 9) Dev Commands

Run from `esim-mobile/`:
- `npm run start`
- `npm run android`
- `npm run ios`
- `npm run web`
- `npm run check:design-tokens`
- `npm run check:design-tokens:strict`

## 10) Reseller Flow (Salesman)

Role gate:
- `SALESMAN` users are routed to `ResellerTabs` from `src/navigation/RootNavigator.tsx`

Reseller tab structure:
- `DashboardTab` -> `src/navigation/reseller/DashboardStack.tsx`
- `SellTab` -> `src/navigation/reseller/SellStack.tsx`
- `TransactionsTab` -> `src/navigation/reseller/TransactionsStack.tsx`
- `WalletTab` -> `src/navigation/reseller/WalletStack.tsx`

Primary reseller screens:
- `src/screens/reseller/dashboard/ResellerDashboardScreen.tsx`
- `src/screens/reseller/sell/SellESIMScreen.tsx`
- `src/screens/reseller/transactions/TransactionsScreen.tsx`
- `src/screens/reseller/wallet/ResellerWalletScreen.tsx`
- `src/screens/reseller/dashboard/ActivateESIMScreen.tsx`

Shared reseller UI:
- `src/components/reseller/ResellerGradientHeader.tsx`
- `src/components/PrimaryCard.tsx`
- `src/components/OutlineButton.tsx`
- `src/components/ErrorBanner.tsx`
- `src/components/LoadingOverlay.tsx`

Reseller hooks (placeholder/query contract):
- `src/hooks/reseller/useDashboardStats.ts`
- `src/hooks/reseller/useRecentSales.ts`
- `src/hooks/reseller/usePendingActivations.ts`
- `src/hooks/reseller/useTransactions.ts`
- `src/hooks/reseller/useResellerWallet.ts`
- `src/hooks/reseller/useActivateESIM.ts`

If task is reseller flow wiring:
1. `src/navigation/types.ts`
2. `src/navigation/RootNavigator.tsx`
3. `src/navigation/reseller/ResellerTabs.tsx`
4. impacted screen in `src/screens/reseller/**`
5. matching hook in `src/hooks/reseller/**`
