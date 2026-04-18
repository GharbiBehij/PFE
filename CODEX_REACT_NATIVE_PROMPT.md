# React Native Refactor — Complete Execution Prompt

## Mission

Rebuild the **NetyFly eSIM** mobile app from Flutter/Dart to **React Native (Expo + TypeScript)**. The backend (NestJS) is unchanged — the new frontend must consume the exact same REST API and Socket.IO events. Preserve all existing screens, flows, and UX behavior 1:1.

---

## Source Architecture (Flutter — what you're replacing)

```
esim-frontend/lib/
├── main.dart                         # Entry: ProviderScope → App
├── app.dart                          # MaterialApp.router with GoRouter
├── core/
│   ├── constants/                    # API URLs, colors, text styles
│   ├── network/                      # Dio client, auth/refresh/logging interceptors
│   ├── storage/                      # FlutterSecureStorage for JWT tokens
│   ├── router/                       # GoRouter config + route names
│   ├── providers/                    # Riverpod DI (Dio, TokenStorage, WsClient)
│   ├── theme/                        # Material3 theme tokens
│   ├── motion/                       # Page transitions, animations
│   └── widgets/                      # Shared UI (BottomNav, PackageCard, StatusBadge...)
├── features/
│   ├── auth/          (data/models/presentation)
│   ├── home/          (models/presentation)
│   ├── offers/        (data/models/presentation)
│   ├── esims/         (data/domain/models/presentation)
│   ├── payment/       (data/models/presentation)
│   ├── wallet/        (data/models/presentation)
│   └── profile/       (data/models/presentation)
└── shared/widgets/
```

**Pattern:** Screen → Riverpod Provider (AsyncNotifier) → Repository → Dio → Backend

---

## Target Architecture (React Native)

```
esim-mobile/
├── app.json                          # Expo config
├── babel.config.js
├── tsconfig.json
├── .env                              # API_URL, WS_URL
├── package.json
├── App.tsx                           # Providers wrapper (QueryClient, Auth, Navigation)
├── src/
│   ├── api/
│   │   ├── client.ts                 # Axios instance + interceptors (auth, refresh, logging)
│   │   ├── auth.api.ts               # login, signup, me, logout, refresh
│   │   ├── offers.api.ts             # getOffers, getById, popular, search, destinations
│   │   ├── esims.api.ts              # getUserEsims, getById, sync, delete
│   │   ├── payment.api.ts            # purchase, getTransactions
│   │   ├── wallet.api.ts             # getBalance, getHistory, topUp
│   │   └── profile.api.ts            # getProfile, updateProfile, changePassword
│   ├── hooks/
│   │   ├── useAuth.ts                # Auth context hook (login, signup, logout, user, isAuthenticated)
│   │   ├── useOffers.ts              # React Query hooks for offer data
│   │   ├── useEsims.ts              # React Query hooks + socket real-time updates
│   │   ├── usePayment.ts            # useMutation for purchase flow
│   │   ├── useWallet.ts             # Balance, history, topup mutation
│   │   └── useProfile.ts            # Profile query + update/password mutations
│   ├── navigation/
│   │   ├── RootNavigator.tsx         # Auth gate: logged in → MainTabs, else → AuthStack
│   │   ├── AuthStack.tsx             # Login, Register
│   │   ├── MainTabs.tsx              # Bottom tabs: Home, My eSIMs, Profile
│   │   ├── HomeStack.tsx             # Home → Search, Destinations → Packages → Detail → Payment → Success
│   │   ├── EsimsStack.tsx            # My eSIMs → eSIM Detail
│   │   └── ProfileStack.tsx          # Profile → Personal, Payment Methods, Settings, Help, Wallet
│   ├── screens/
│   │   ├── auth/
│   │   │   ├── LoginScreen.tsx
│   │   │   └── RegisterScreen.tsx
│   │   ├── home/
│   │   │   └── HomeScreen.tsx
│   │   ├── offers/
│   │   │   ├── DestinationsScreen.tsx
│   │   │   ├── SearchScreen.tsx
│   │   │   ├── PackageListingScreen.tsx
│   │   │   └── PackageDetailScreen.tsx
│   │   ├── payment/
│   │   │   ├── PaymentScreen.tsx
│   │   │   └── SuccessScreen.tsx
│   │   ├── esims/
│   │   │   ├── MyEsimsScreen.tsx
│   │   │   └── EsimDetailScreen.tsx
│   │   ├── wallet/
│   │   │   ├── WalletScreen.tsx
│   │   │   └── TopUpScreen.tsx
│   │   └── profile/
│   │       ├── ProfileScreen.tsx
│   │       ├── PersonalDetailsScreen.tsx
│   │       ├── PaymentMethodsScreen.tsx
│   │       ├── SettingsScreen.tsx
│   │       └── HelpCenterScreen.tsx
│   ├── components/
│   │   ├── BottomNav.tsx              # Custom tab bar (if needed)
│   │   ├── CountryFlag.tsx            # Flag emoji/image by country code
│   │   ├── DestinationCard.tsx        # Country card with price badge
│   │   ├── PackageCard.tsx            # Offer card (data, days, price)
│   │   ├── StatusBadge.tsx            # Colored badge (Active/Pending/Expired)
│   │   ├── EmptyState.tsx             # Icon + message + optional CTA
│   │   ├── ErrorBanner.tsx            # Red error box
│   │   ├── LoadingOverlay.tsx         # Full-screen spinner
│   │   ├── EsimCard.tsx               # eSIM with usage bar
│   │   ├── OrderSummaryCard.tsx       # Checkout pricing breakdown
│   │   ├── PaymentMethodTile.tsx      # Radio-selectable payment option
│   │   ├── BalanceCard.tsx            # Wallet balance with gradient
│   │   ├── CoverageFilterChips.tsx    # Filter: Popular/Local/Regional/Global
│   │   └── QrCodeCard.tsx             # QR code for eSIM activation
│   ├── context/
│   │   └── AuthContext.tsx            # React Context for auth state + token management
│   ├── storage/
│   │   └── tokenStorage.ts           # expo-secure-store: get/save/clear access + refresh tokens
│   ├── socket/
│   │   └── useSocket.ts              # Socket.IO client hook — connect/disconnect/listen
│   ├── theme/
│   │   ├── colors.ts                 # Full color palette (see below)
│   │   ├── spacing.ts                # xs=4, sm=8, md=12, lg=16, xl=24, xxl=32, xxxl=48
│   │   ├── typography.ts             # Font sizes, weights, line heights
│   │   └── index.ts                  # Re-export all theme tokens
│   ├── types/
│   │   ├── auth.ts                   # User, AuthResponse, LoginRequest, SignupRequest
│   │   ├── offer.ts                  # Offer, Destination, PlanType
│   │   ├── esim.ts                   # Esim, EsimStatus
│   │   ├── payment.ts               # PurchaseResult, Transaction, PaymentMethod
│   │   ├── wallet.ts                # WalletBalance, WalletLedgerEntry, TopUpRequest
│   │   └── profile.ts              # UserProfile, UpdateProfileRequest, ChangePasswordRequest
│   └── utils/
│       ├── formatCurrency.ts         # Format prices (TND)
│       └── formatDate.ts             # Date formatting
```

---

## Tech Stack to Use

| Concern | Library | Why |
|---------|---------|-----|
| Framework | Expo SDK 52+ (managed workflow) | Fast setup, OTA updates |
| Language | TypeScript (strict) | Type safety |
| Navigation | @react-navigation/native + @react-navigation/bottom-tabs + @react-navigation/native-stack | Industry standard for RN |
| HTTP | axios | Same interceptor pattern as Dio |
| Server state | @tanstack/react-query v5 | Replaces Riverpod FutureProvider/AsyncNotifier |
| Auth state | React Context + useReducer | Replaces Riverpod authProvider |
| Token storage | expo-secure-store | Replaces FlutterSecureStorage |
| WebSocket | socket.io-client | Same library, same events |
| QR codes | react-native-qrcode-svg | Replaces qr_flutter |
| Image caching | expo-image | Replaces cached_network_image |
| Icons | @expo/vector-icons (Ionicons) | Replaces CupertinoIcons |
| Env vars | expo-constants + .env | Replaces hardcoded constants |

---

## Backend API Contract (DO NOT CHANGE)

Base URL: configurable via `API_URL` env var (default `http://10.0.2.2:3000` for Android emulator, `http://localhost:3000` for iOS sim).

### Auth
```
POST   /auth/login        body: { email, password }           → { access_token, refresh_token, user }
POST   /auth/signup       body: { firstname, lastname, email, password }  → { access_token, refresh_token, user }
GET    /auth/me           header: Bearer token                → User
POST   /auth/logout       header: Bearer token                → void
POST   /auth/refresh      body: { refreshToken }              → { access_token, refresh_token }
```

### Offers
```
GET    /offers                 query: ?country=XX              → Offer[]
GET    /offers/:id                                             → Offer
GET    /offers/popular                                         → Offer[]
GET    /offers/search          query: ?q=keyword               → Offer[]
GET    /offers/destinations                                    → Destination[]
```

### eSIMs
```
GET    /esims                  header: Bearer                  → Esim[]
GET    /esims/:id              header: Bearer                  → Esim
POST   /esims/:id/sync         header: Bearer                  → Esim (refreshed usage)
DELETE /esims/:id              header: Bearer                  → void
```

### Payment
```
POST   /purchase               body: { offerId, paymentMethod } → PurchaseResult
GET    /transactions           header: Bearer                  → Transaction[]
GET    /transactions/:id       header: Bearer                  → Transaction
```

### Wallet
```
GET    /wallet/balance         header: Bearer                  → { balance }
GET    /wallet/history         header: Bearer                  → WalletLedgerEntry[]
POST   /wallet/topup           body: { amount }                → WalletLedgerEntry
```

### Profile
```
GET    /profile                header: Bearer                  → UserProfile
PATCH  /profile                body: { firstname?, lastname?, email?, phone? } → UserProfile
POST   /profile/password       body: { currentPassword, newPassword }          → void
```

### WebSocket (Socket.IO)
```
URL: same as API_URL
Event: "esim:usage-updated"   payload: { esim: EsimModel }
Connect after login, disconnect on logout.
```

---

## TypeScript Types

```typescript
// ── Auth ──
interface User {
  id: string;
  email: string;
  firstname: string;
  lastname: string;
  role: 'CLIENT' | 'SALESMAN' | 'CUSTOMER';
  status: 'ONLINE' | 'OFFLINE';
  balance?: number;
}

interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}

interface LoginRequest { email: string; password: string; }
interface SignupRequest { firstname: string; lastname: string; email: string; password: string; }

// ── Offers ──
interface Destination {
  id: string;
  country: string;
  countryCode: string;
  region: string;
  imageUrl?: string;
  startingPrice: number;
  coverageType: 'LOCAL' | 'REGIONAL' | 'GLOBAL';
}

interface Offer {
  id: string;
  country: string;
  countryCode: string;
  dataVolume: string;       // e.g. "1GB", "5GB"
  validityDays: number;
  price: number;
  currency: string;         // "TND"
  providerId: string;
  description?: string;
  popularity?: number;
}

type PlanType = 'data' | 'days';

// ── eSIMs ──
type EsimStatus = 'NOT_ACTIVE' | 'ACTIVE' | 'EXPIRED' | 'DELETED';

interface Esim {
  id: string;
  iccid: string;
  activationCode: string;
  status: EsimStatus;
  dataUsed?: number;        // bytes
  dataTotal?: number;       // bytes
  expiryDate?: string;      // ISO date
  country: string;
  countryCode: string;
  offer?: Offer;
  createdAt: string;
}

// ── Payment ──
type PaymentMethod = 'card' | 'apple_pay' | 'wallet';
type TransactionStatus = 'PENDING' | 'PROCESSING' | 'SUCCEEDED' | 'FAILED';

interface PurchaseResult {
  transactionId: string;
  status: TransactionStatus;
  esimId?: string;
  message?: string;
}

interface Transaction {
  id: string;
  status: TransactionStatus;
  amount: number;
  currency: string;
  channel: 'B2C' | 'B2B2C';
  offerId: string;
  offer?: Offer;
  esim?: Esim;
  createdAt: string;
}

// ── Wallet ──
interface WalletBalance {
  balance: number;
  currency: string;
}

interface WalletLedgerEntry {
  id: string;
  amount: number;
  type: 'DEBIT' | 'CREDIT';
  reason: 'RESERVE' | 'COMMIT' | 'RELEASE' | 'TOP_UP' | 'REFUND';
  createdAt: string;
}

// ── Profile ──
interface UserProfile {
  id: string;
  email: string;
  firstname: string;
  lastname: string;
  phone?: string;
  role: string;
  balance?: number;
}

interface UpdateProfileRequest {
  firstname?: string;
  lastname?: string;
  email?: string;
  phone?: string;
}

interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}
```

---

## Design System Tokens

### Colors
```typescript
export const colors = {
  // Primary (Violet)
  primary:          '#7C3AED',
  primaryLight:     '#8B5CF6',
  primaryDark:      '#6D28D9',
  primaryBg:        '#F5F3FF',
  primaryContainer: '#EDE9FE',

  // Secondary (Yellow — CTA)
  secondary:        '#FACC15',
  secondaryDark:    '#FBBF24',

  // Neutral
  background:       '#FAFAFA',
  surface:          '#FFFFFF',
  divider:          '#E5E7EB',
  border:           '#E5E7EB',

  // Text
  textPrimary:      '#111827',
  textSecondary:    '#6B7280',
  textTertiary:     '#9CA3AF',
  textOnPrimary:    '#FFFFFF',

  // Semantic
  error:            '#EF4444',
  success:          '#10B981',
  warning:          '#F59E0B',
} as const;
```

### Spacing
```typescript
export const spacing = {
  xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48,
} as const;
```

### Border Radius
```typescript
export const radii = {
  card: 24, button: 16, input: 12, badge: 8,
} as const;
```

---

## Navigation Map

```
RootNavigator (auth gate)
├── AuthStack (not logged in)
│   ├── Login
│   └── Register
└── MainTabs (logged in — bottom tabs)
    ├── HomeStack (tab: Home)
    │   ├── HomeScreen
    │   ├── SearchScreen
    │   ├── DestinationsScreen
    │   ├── PackageListingScreen (params: countryId, heroCountry?, heroImageUrl?)
    │   ├── PackageDetailScreen (params: packageId)
    │   ├── PaymentScreen (params: packageId)
    │   └── SuccessScreen (params: PurchaseResult)
    ├── EsimsStack (tab: My eSIMs)
    │   ├── MyEsimsScreen
    │   └── EsimDetailScreen (params: esimId)
    └── ProfileStack (tab: Profile)
        ├── ProfileScreen
        ├── PersonalDetailsScreen
        ├── PaymentMethodsScreen
        ├── SettingsScreen
        ├── HelpCenterScreen
        ├── WalletScreen
        └── TopUpScreen
```

**Bottom Tab Icons:** Home (home-outline), My eSIMs (phone-portrait-outline), Profile (person-outline) — using Ionicons.

---

## Key Implementation Details

### 1. Axios Client (`src/api/client.ts`)
- Create axios instance with `baseURL` from env
- **Request interceptor:** attach `Authorization: Bearer <token>` from secure store
- **Response interceptor (401 handler):**
  1. Get refresh token from secure store
  2. POST `/auth/refresh` with `{ refreshToken }`
  3. Save new tokens to secure store
  4. Retry original request with new access token
  5. If refresh fails: clear tokens, navigate to Login
- Timeouts: 10s
### 2. Auth Context (`src/context/AuthContext.tsx`)
- State: `{ user: User | null, isLoading: boolean, isAuthenticated: boolean }`
- On mount: try `GET /auth/me` (session rehydration). If token exists and valid → set user. If not → clear.
- `login(email, password)` → save tokens → set user → connect socket
- `signup(...)` → save tokens → set user → connect socket
- `logout()` → `POST /auth/logout` → clear tokens → disconnect socket → set user null

### 3. React Query Hooks
- `useDestinations()` → `useQuery(['destinations'], () => offersApi.getDestinations())`
- `usePopularOffers()` → `useQuery(['offers', 'popular'], ...)`
- `useOffersByCountry(countryId)` → `useQuery(['offers', countryId], ...)`
- `useOfferDetail(id)` → `useQuery(['offers', id], ...)`
- `useSearchOffers(query)` → `useQuery(['offers', 'search', query], ..., { enabled: query.length > 0 })`
- `useUserEsims()` → `useQuery(['esims'], ...)` — also listens to socket for real-time updates
- `useEsimDetail(id)` → `useQuery(['esims', id], ...)`
- `useSyncEsim()` → `useMutation` calling POST `/esims/:id/sync`, invalidates `['esims']`
- `useDeleteEsim()` → `useMutation` calling DELETE `/esims/:id`, invalidates `['esims']`
- `usePurchase()` → `useMutation` calling POST `/purchase`, invalidates `['esims']` + `['wallet']`
- `useWalletBalance()` → `useQuery(['wallet', 'balance'], ...)`
- `useWalletHistory()` → `useQuery(['wallet', 'history'], ...)`
- `useTopUp()` → `useMutation`, invalidates `['wallet']`
- `useProfile()` → `useQuery(['profile'], ...)`
- `useUpdateProfile()` → `useMutation`, invalidates `['profile']`
- `useChangePassword()` → `useMutation`
- `useTransactions()` → `useQuery(['transactions'], ...)`

### 4. Socket.IO Integration (`src/socket/useSocket.ts`)
- Singleton socket instance
- `connect()`: called after login
- `disconnect()`: called on logout
- In `useUserEsims()` hook, subscribe to `esim:usage-updated` event
- On event: use `queryClient.setQueryData(['esims'], ...)` to upsert the updated eSIM

### 5. Token Storage (`src/storage/tokenStorage.ts`)
```typescript
import * as SecureStore from 'expo-secure-store';

const ACCESS_KEY = 'access_token';
const REFRESH_KEY = 'refresh_token';

export const tokenStorage = {
  getAccessToken: () => SecureStore.getItemAsync(ACCESS_KEY),
  getRefreshToken: () => SecureStore.getItemAsync(REFRESH_KEY),
  saveTokens: async (access: string, refresh: string) => {
    await SecureStore.setItemAsync(ACCESS_KEY, access);
    await SecureStore.setItemAsync(REFRESH_KEY, refresh);
  },
  clear: async () => {
    await SecureStore.deleteItemAsync(ACCESS_KEY);
    await SecureStore.deleteItemAsync(REFRESH_KEY);
  },
};
```

---

## Screen-by-Screen Specifications

### LoginScreen
- Gradient header (primaryDark → primary) with decorative circles
- Title: "Bon retour!" + subtitle "Connectez-vous pour continuer"
- White rounded card containing: email input, password input (toggle visibility), "Connexion" button (primary violet), error banner if login fails
- Footer: "Pas de compte?" link to Register
- On submit: `auth.login(email, password)` → navigate to Home

### RegisterScreen
- Same gradient header layout
- Title: "Bienvenue!" + subtitle "Creez votre compte"
- Fields: firstname, lastname, email, password, confirm password
- Validation: all required, email format, password match, min 6 chars
- "Creer un compte" button → `auth.signup(...)` → navigate to Home

### HomeScreen
- Header: "Bonjour, {user.firstname}" + search icon button
- CoverageFilterChips: horizontal scrollable chips (Populaires, Local, Regional, Global)
- Grid of DestinationCards filtered by selected coverage type
- Each card: country flag, country name, "A partir de {price} TND", tap → PackageListingScreen

### SearchScreen
- Auto-focus search input at top
- Debounced search (300ms) calling `useSearchOffers(query)`
- Results as PackageCard list
- Empty state: "Rechercher des offres eSIM"

### DestinationsScreen
- Title: "Destinations"
- Grid (2 columns) of DestinationCards
- Tap → PackageListingScreen(countryId)

### PackageListingScreen
- Header: country name + flag image
- Scrollable list of PackageCards for that country
- Each card: data volume, validity days, price, tap → PackageDetailScreen

### PackageDetailScreen
- Large card: country flag + country name
- Details: data volume, validity, price, description
- "Acheter" (Buy) CTA button → PaymentScreen

### PaymentScreen
- Back button + "Paiement" title
- OrderSummaryCard: plan name, data, validity, subtotal, total
- Payment method selection (radio): Carte bancaire, Apple Pay, (Portefeuille if SALESMAN)
- "Confirmer et payer — {price} TND" button
- Loading overlay during purchase
- On success → navigate to SuccessScreen with PurchaseResult

### SuccessScreen
- Checkmark animation/icon
- "Achat reussi!" title
- Transaction ID, status badge
- "Voir mes eSIMs" button → My eSIMs tab
- "Retour a l'accueil" button → Home

### MyEsimsScreen
- Header: "Mes eSIMs"
- Tab toggle: "Actifs" / "Historique"
- Active tab: list of EsimCards with status badge, country, data usage bar (used/total), days remaining, "Gerer" button → EsimDetailScreen
- History tab: expired/deleted eSIMs (grayed)
- Empty state: "Aucun eSIM actif" + "Parcourir les offres" button

### EsimDetailScreen
- Country + status badge header
- Data usage circular/linear gauge
- QR code card (activationCode)
- Details: ICCID, activation date, expiry date
- "Synchroniser" button → POST /esims/:id/sync
- "Supprimer" button with confirmation dialog

### ProfileScreen
- User avatar (initials circle)
- Name + email display
- Menu list: Details personnels, Moyens de paiement, Parametres, Centre d'aide
- If SALESMAN: "Portefeuille" menu item
- "Deconnexion" button (red) at bottom

### PersonalDetailsScreen
- Editable fields: firstname, lastname, email, phone
- "Enregistrer" button → PATCH /profile
- Success snackbar

### WalletScreen
- BalanceCard: large gradient card showing balance in TND
- Preset amounts: 5, 10, 20, 50 TND (tappable chips)
- Custom amount input
- "Recharger" button → POST /wallet/topup
- Recent transactions list (last 5)

### TopUpScreen
- Extended version of wallet recharge
- More amount options, full transaction history

---

## Execution Order

1. **Scaffold**: `npx create-expo-app esim-mobile --template blank-typescript`, install all deps
2. **Core layer**: theme tokens, types, tokenStorage, axios client with interceptors
3. **Auth**: AuthContext, login/register screens, auth navigation gate
4. **Navigation**: Full navigator tree (RootNavigator, AuthStack, MainTabs with 3 stacks)
5. **Home + Offers**: HomeScreen, destinations, search, package listing, package detail
6. **Payment**: PaymentScreen, SuccessScreen, purchase mutation
7. **eSIMs**: MyEsimsScreen, EsimDetailScreen, socket integration for real-time updates
8. **Profile**: ProfileScreen + all sub-screens
9. **Wallet**: WalletScreen, TopUpScreen (conditional on SALESMAN role)
10. **Polish**: Animations (react-native-reanimated), error handling, loading states, empty states

---

## Critical Rules

- **DO NOT** modify the backend. The API contract is frozen.
- **DO NOT** use class components. Functional components + hooks only.
- **DO NOT** use Redux or MobX. Use React Query for server state, React Context for auth only.
- **DO NOT** use inline styles. Use `StyleSheet.create()` everywhere.
- All text is in **French** (same as the Flutter app).
- All prices are in **TND** (Tunisian Dinar).
- Use the **exact color palette** defined above. The brand is violet + yellow.
- Every screen must handle 3 states: **loading**, **error** (with retry), **data**.
- The app must work on both **iOS** and **Android**.
- Respect the **border radius** values: cards=24, buttons=16, inputs=12, badges=8.
- Bottom tabs show on Home, My eSIMs, and Profile screens only. All other screens are full-screen (no tabs).
