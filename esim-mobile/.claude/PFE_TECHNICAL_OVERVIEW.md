# NetyFly eSIM Platform — Technical Overview (PFE Report)

> Generated: 2026-05-11  
> Author reference: Behij Gharbi  
> Stack: NestJS (backend) + React Native Expo (frontend)



## Table of Contents

1. [Project Structure](#1-project-structure)
2. [Backend Analysis (NestJS)](#2-backend-analysis-nestjs)
3. [Frontend Analysis (React Native)](#3-frontend-analysis-react-native)
4. [eSIM Provider Integration](#4-esim-provider-integration)
5. [Payment Integration](#5-payment-integration)
6. [Non-Functional Implementations](#6-non-functional-implementations)
7. [Built vs Planned](#7-built-vs-planned)

---

## 1. Project Structure

### Technology Stack

| Layer       | Technology                                       |
|-------------|--------------------------------------------------|
| Backend     | NestJS (TypeScript), Prisma ORM, PostgreSQL      |
| Queue       | BullMQ + Redis (localhost:6380)                  |
| Payment     | ClicToPay (Tunisian gateway)                     |
| Auth        | JWT (Passport.js), httpOnly cookies              |
| API Docs    | Swagger / OpenAPI at `/api/docs`                 |
| Frontend    | React Native (Expo), React Navigation            |
| State       | React Context API + React Query (TanStack)       |
| HTTP        | Axios with JWT refresh interceptor               |
| Real-time   | Socket.IO                                        |
| Storage     | Expo SecureStore (tokens)                        |

---

### Backend Folder Tree (`esim-backend/src/`)

```
src/
├── app/
│   └── app.module.ts                    # Root module (all imports)
├── main.ts                              # Bootstrap, global middleware
├── auth/
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── Strategies/JwtStrategy.ts
│   └── Guards/
│       ├── JwtAuthGuard.ts
│       └── roles.guard.ts
├── user/
│   ├── user.controller.ts
│   └── user.service.ts
├── esim/
│   ├── esim.controller.ts
│   ├── esim.service.ts
│   ├── esim.repository.ts
│   ├── interfaces/
│   │   └── provider-adapter.interface.ts
│   └── adapters/
│       ├── mock-provider.adapter.ts
│       └── provider-adapter.token.ts
├── offer/
│   ├── offer.controller.ts
│   └── offer.service.ts
├── transaction/
│   ├── transaction.controller.ts
│   ├── transaction.service.ts
│   └── transaction.repository.ts
├── payment/
│   ├── payment.controller.ts
│   ├── payment.service.ts
│   ├── payment.repository.ts
│   ├── clictopay/
│   │   └── clictopay.service.ts
│   └── Webhook/
│       ├── webhook.controller.ts
│       ├── webhook.service.ts
│       ├── funding.service.ts
│       └── reconciliation.service.ts
├── WalletTransaction/
│   ├── wallet.controller.ts
│   ├── wallet.service.ts
│   └── wallet.repository.ts
├── TopUp/
│   └── top-up.controller.ts
├── Orchestrators/
│   ├── EsimPurchaseOrchestrator.ts
│   └── EsimActivateOrchestrator.ts
├── Queue/
│   ├── Queue/esim.queue.ts
│   └── Producer/esim.producer.ts
├── workers/
│   ├── Purchase.service.ts
│   └── activation.service.ts
├── Common/
│   ├── redis.provider.ts
│   ├── guards/idempotency.guard.ts
│   └── dto/error-response.dto.ts
├── NotificationModule/
├── SupportModule/
├── ZoneChiefModule/
└── AuditLog/
    └── audit-log.service.ts
```

### Frontend Folder Tree (`esim-mobile/src/`)

```
src/
├── api/
│   ├── client.ts            # Axios instance + interceptors
│   ├── auth.api.ts
│   ├── esims.api.ts
│   ├── payment.api.ts
│   ├── offers.api.ts
│   ├── profile.api.ts
│   └── wallet.api.ts
├── context/
│   └── AuthContext.tsx      # Global auth state (reducer pattern)
├── hooks/
│   ├── client/
│   │   ├── useAuth.ts
│   │   ├── usePayment.ts
│   │   ├── useEsims.ts
│   │   ├── useOffers.ts
│   │   ├── useProfile.ts
│   │   ├── usePushNotifications.ts
│   │   └── useVerifyPayment.ts
│   └── reseller/
│       ├── useDashboardStats.ts
│       ├── useWallet.ts
│       ├── useActivateESIM.ts
│       └── useTransactions.ts
├── screens/
│   ├── auth/                # Login, Register, Onboarding, ResellerLogin
│   ├── home/                # HomeScreen
│   ├── offers/              # Destinations, PackageListing, PackageDetail, Search
│   ├── payment/             # PaymentScreen, WebView, Processing, Success, Failed
│   ├── esims/               # MyEsims, GuestEsims, EsimDetail, EsimSuccess
│   ├── profile/             # Profile, PersonalDetails, PaymentMethods, Settings
│   └── reseller/            # Dashboard, Sell, Wallet, Transactions, Activate
├── components/
│   ├── layout/              # ScreenShell, ScreenContent, ScreenHeader, Section
│   ├── Cards/               # PrimaryCard, OrderSummaryCard, etc.
│   ├── PaymentMethodTile.tsx
│   ├── StatusBadge.tsx
│   ├── ErrorBanner.tsx
│   ├── LoadingOverlay.tsx
│   └── reseller/
├── navigation/
│   ├── RootNavigator.tsx    # Role-based dispatch
│   ├── Client/ClientNavigator.tsx
│   ├── reseller/ResellerNavigator.tsx
│   ├── navigationRef.ts
│   └── types.ts
├── storage/tokenStorage.ts
├── socket/useSocket.ts
├── theme/                   # colors, spacing, typography, sizes, patterns
├── types/                   # auth, esim, payment, offer, reseller, wallet
└── config/env.ts
```

---

## 2. Backend Analysis (NestJS)

### 2.1 Modules and Responsibilities

| Module               | Responsibility                                                            |
|----------------------|---------------------------------------------------------------------------|
| `AuthModule`         | JWT login/signup/refresh, Passport strategy, token management            |
| `UserModule`         | User CRUD, profile update, password change, push token registration      |
| `EsimModule`         | eSIM CRUD, usage sync, status transitions, provider adapter injection     |
| `OfferModule`        | Offer catalog management, search, destination aggregation                 |
| `TransactionModule`  | Purchase initiation, state machine, transaction history                   |
| `PaymentModule`      | ClicToPay gateway integration, verification, reconciliation, webhooks     |
| `WalletModule`       | Reseller balance ledger, wallet history, reserve/commit/release           |
| `TopUpModule`        | Reseller top-up requests, zone chief approval workflow                    |
| `NotificationModule` | Expo push notification delivery                                           |
| `SupportModule`      | Customer support ticketing                                                |
| `ZoneChiefModule`    | Zone chief management (reseller hierarchy)                                |
| `EsimQueueModule`    | BullMQ queue registration, Bull Board UI at `/queues`                     |
| `AuditLog`           | Comprehensive audit trail for all state changes                           |
| `CommonModule`       | Redis client, IdempotencyGuard, shared DTOs                               |

---

### 2.2 Entities / Database Schema (PostgreSQL via Prisma)

#### User
| Field               | Type          | Notes                                        |
|---------------------|---------------|----------------------------------------------|
| id                  | Int (PK)      | Auto-increment                               |
| passportId          | String        | Unique                                       |
| firstname/lastname  | String        |                                              |
| email               | String        | Unique                                       |
| hashedPassword      | String        | bcrypt hash                                  |
| hashedRefreshToken  | String?       | Stored hashed for security                   |
| balance             | Float         | Reseller wallet balance (computed from ledger)|
| status              | Enum          | ONLINE / OFFLINE                             |
| role                | Enum          | ADMIN / ZONE_CHIEF / CLIENT / SALESMAN / CUSTOMER |
| phone               | String?       |                                              |
| pushToken           | String?       | Expo push notification token                 |
| **Relations**       |               | transactions, payments, walletTransactions, esims, topUpRequests |

#### Transaction
| Field       | Type    | Notes                                                                        |
|-------------|---------|------------------------------------------------------------------------------|
| id          | String  | PK                                                                           |
| status      | Enum    | PENDING → PENDING_PAYMENT / PROCESSING → PROVISIONING → COMPLETED / FAILED  |
| channel     | Enum    | B2C (customer) / B2B2C (reseller)                                            |
| amount      | Float   |                                                                              |
| currency    | String  |                                                                              |
| userId      | Int     | FK → User                                                                    |
| offerId     | Int     | FK → Offer                                                                   |
| **Relations**|        | esim (1-1), payment (1-1 optional), walletTransaction (1-1 optional), auditLogs |

#### Esim
| Field          | Type    | Notes                                                 |
|----------------|---------|-------------------------------------------------------|
| id             | String  | PK                                                    |
| iccid          | String  | Unique (SIM identifier)                               |
| activationCode | String  | LPA format for QR scan                                |
| status         | Enum    | NOT_ACTIVE / ACTIVE / PROCESSING / PENDING / FAILED / EXPIRED / DELETED |
| qrCode         | String? |                                                       |
| dataTotal      | Int?    | MB                                                    |
| dataUsed       | Int?    | MB                                                    |
| expiryDate     | Date?   |                                                       |
| userId         | Int     | FK → User                                             |
| transactionId  | String  | FK → Transaction (unique)                             |
| offerId        | Int     | FK → Offer                                            |
| providerId     | Int     | FK → Provider                                         |
| **Indexes**    |         | [userId], [status]                                    |

#### Offer
| Field        | Type    | Notes                                      |
|--------------|---------|--------------------------------------------|
| id           | Int     | PK                                         |
| title        | String  |                                            |
| country      | String  |                                            |
| countryCode  | String  | ISO code                                   |
| Region       | String  |                                            |
| Destination  | String  |                                            |
| coverageType | Enum    | LOCAL / REGIONAL / GLOBAL                  |
| networkType  | String  | Default "4G"                               |
| dataVolume   | Int     | MB                                         |
| validityDays | Int     |                                            |
| price        | Float   |                                            |
| popularity   | Int     |                                            |
| providerId   | Int     | FK → Provider                              |
| isDeleted    | Boolean | Soft delete flag                           |

#### Payment
| Field             | Type    | Notes                                  |
|-------------------|---------|----------------------------------------|
| id                | String  | PK                                     |
| paymentProvider   | String  | "CLICTOPAY"                            |
| gatewayPaymentId  | String  | Unique (ClicToPay orderId)             |
| amount            | Float   |                                        |
| status            | Enum    | PENDING / AUTHORIZED / COMPLETED / FAILED |
| rawResponse       | JSON    | Full gateway response                  |
| paymentUrl        | String  | Redirect URL for payment form          |
| transactionId     | String  | FK → Transaction (unique)              |

#### WalletTransaction
| Field         | Type    | Notes                              |
|---------------|---------|------------------------------------|
| id            | String  | PK                                 |
| amount        | Float   |                                    |
| balanceAfter  | Float   |                                    |
| paymentMethod | String  |                                    |
| status        | Enum    | RESERVED / COMMITTED / RELEASED    |
| userId        | Int     | FK → User (salesman)               |
| transactionId | String? | FK → Transaction (optional, unique)|
| **Relations** |         | ledgerEntries (WalletLedger)       |

#### WalletLedger
| Field       | Type    | Notes                                           |
|-------------|---------|-------------------------------------------------|
| id          | String  | PK                                              |
| amount      | Float   |                                                 |
| type        | Enum    | DEBIT / CREDIT                                  |
| reason      | Enum    | RESERVE / COMMIT / RELEASE / TOP_UP / REFUND    |
| referenceId | String  |                                                 |
| walletId    | String  | FK → WalletTransaction                          |

#### AuditLog
| Field            | Type    | Notes                                                      |
|------------------|---------|------------------------------------------------------------|
| id               | String  | cuid PK                                                    |
| layer            | Enum    | PAYMENT / PROVISIONING / ACTIVATION / WALLET / SYSTEM      |
| event            | Enum    | PAYMENT_INITIATED, PROVISIONING_SUCCESS, ACTIVATION_FAILED, etc. |
| userId           | Int?    |                                                            |
| transactionId    | String? |                                                            |
| trigger          | Enum    | PAYMENT_GATEWAY / WEBHOOK / PROVIDER / WORKER / SCHEDULER / USER |
| fromStatus/toStatus | String? | State transition recording                             |
| durationMs       | Int?    | Processing duration                                        |
| providerLatencyMs| Int?    | External call latency                                      |
| details          | JSON    | Extensible context blob                                    |

#### ActivationAttempt
| Field             | Type    | Notes                                    |
|-------------------|---------|------------------------------------------|
| id                | String  | PK                                       |
| attemptNumber     | Int     |                                          |
| status            | Enum    | STARTED / SUCCESS / FAILED / TIMED_OUT   |
| providerRequestId | String  | Unique                                   |
| providerResponse  | JSON    |                                          |
| esimId            | String  | FK → Esim                                |

#### TopUpRequest
| Field         | Type    | Notes                                                            |
|---------------|---------|------------------------------------------------------------------|
| status        | Enum    | PENDING / PENDING_PAYMENT / PENDING_CASH / APPROVED / CREDITED / REJECTED / FAILED |
| paymentMethod | String  | CARD / CASH                                                      |
| salesmanId    | Int     | FK → User                                                        |
| reviewedBy    | Int?    | Zone chief FK → User                                             |

---

### 2.3 API Endpoints

#### Auth (`/auth`)
| Method | Route           | Guard        | Description                              |
|--------|-----------------|--------------|------------------------------------------|
| POST   | /auth/login     | None         | Login; returns access + refresh tokens   |
| POST   | /auth/signup    | None         | Register new user                        |
| GET    | /auth/me        | JwtAuthGuard | Get authenticated user profile           |
| POST   | /auth/logout    | JwtAuthGuard | Logout; clear refresh token              |
| POST   | /auth/refresh   | None         | Refresh access token from cookie         |

#### Transaction (`/transaction`)
| Method | Route                   | Guard                       | Description                            |
|--------|-------------------------|-----------------------------|----------------------------------------|
| POST   | /transaction/purchase   | JwtAuthGuard, IdempotencyGuard | Purchase eSIM (B2C main endpoint)   |
| GET    | /transaction            | JwtAuthGuard                | Get user's transaction list            |
| GET    | /transaction/:id        | JwtAuthGuard                | Get transaction detail                 |

#### Payment (`/payment`)
| Method | Route                         | Guard        | Description                          |
|--------|-------------------------------|--------------|--------------------------------------|
| POST   | /payment                      | IdempotencyGuard | Initiate payment for transaction |
| GET    | /payment/verify               | JwtAuthGuard | Verify ClicToPay payment after return|
| GET    | /payment/redirect/success     | SkipThrottle | ClicToPay success callback           |
| GET    | /payment/redirect/fail        | SkipThrottle | ClicToPay fail callback              |

#### eSIM (`/esims`)
| Method | Route                    | Guard        | Description                              |
|--------|--------------------------|--------------|------------------------------------------|
| GET    | /esims/destinations      | None         | Aggregated destinations with pricing     |
| GET    | /esims                   | JwtAuthGuard | User's eSIMs grouped by status           |
| GET    | /esims/:id               | JwtAuthGuard | Get single eSIM by ID                    |
| POST   | /esims/:id/sync-usage    | JwtAuthGuard | Sync usage from provider                 |
| DELETE | /esims/:id               | JwtAuthGuard | Soft-delete eSIM (ownership verified)    |

#### Offer (`/offers`)
| Method | Route               | Guard | Description                           |
|--------|---------------------|-------|---------------------------------------|
| POST   | /offers             | None  | Create new offer (admin)              |
| GET    | /offers             | None  | List offers (filter: country, region) |
| GET    | /offers/popular     | None  | List popular offers                   |
| GET    | /offers/search      | None  | Search by destination/title           |
| GET    | /offers/destinations| None  | Destination list with pricing         |
| GET    | /offers/:id         | None  | Get offer by ID                       |

#### User (`/user`)
| Method | Route               | Guard        | Description                        |
|--------|---------------------|--------------|------------------------------------|
| POST   | /user               | None         | Create user profile                |
| GET    | /user/profile       | JwtAuthGuard | Get authenticated profile          |
| PATCH  | /user/profile       | JwtAuthGuard | Update profile fields              |
| POST   | /user/change-password | JwtAuthGuard | Change password                  |
| PATCH  | /user/push-token    | JwtAuthGuard | Register Expo push token           |

#### Wallet (`/wallet`)
| Method | Route                      | Guard                        | Description                      |
|--------|----------------------------|------------------------------|----------------------------------|
| GET    | /wallet/balance            | JwtAuthGuard                 | Get reseller wallet balance      |
| GET    | /wallet/history            | JwtAuthGuard                 | Paginated wallet history         |
| POST   | /wallet/topup              | JwtAuthGuard                 | Request top-up (salesman)        |
| GET    | /wallet/topup-pending      | JwtAuthGuard                 | Pending top-ups (zone chief)     |
| POST   | /wallet/topup/:id/approve  | JwtAuthGuard, RolesGuard     | Approve top-up (ZONE_CHIEF only) |
| POST   | /wallet/topup/:id/reject   | JwtAuthGuard, RolesGuard     | Reject top-up (ZONE_CHIEF only)  |

---

### 2.4 Authentication Strategy

- **Algorithm**: HS256 JWT (Passport.js `JwtStrategy`)
- **Access Token**: 15-minute TTL, extracted from `Authorization: Bearer` header
- **Refresh Token**: 30-day TTL, stored in `httpOnly` cookie (XSS-proof)
- **Payload**: `{ sub: userId, email, role }`
- **Refresh Rotation**: New refresh token issued on each `/auth/refresh` call
- **Session Hydration**: `GET /auth/me` bootstraps frontend on app launch

---

### 2.5 Guards, Interceptors, Pipes

| Type          | Name                | Description                                                    |
|---------------|---------------------|----------------------------------------------------------------|
| Guard         | `JwtAuthGuard`      | Validates JWT on protected routes                              |
| Guard         | `RolesGuard`        | Checks user role against `@Roles()` decorator                  |
| Guard         | `IdempotencyGuard`  | Redis-based deduplication (30-sec window, NX atomic set)       |
| Guard         | `ThrottlerGuard`    | Global rate limit: 10 requests / 600 seconds                   |
| Pipe          | `ValidationPipe`    | Global DTO validation (class-validator decorators)             |

---

### 2.6 Design Patterns

| Pattern       | Where Applied                                                        |
|---------------|----------------------------------------------------------------------|
| Repository    | `PaymentRepository`, `TransactionRepository`, `WalletRepository`, `EsimRepository` — isolate DB access from business logic |
| Adapter       | `ProviderAdapter` interface with `MockProviderAdapter` implementation; `ClicToPayGateway` |
| Orchestrator  | `EsimPurchaseOrchestrator`, `EsimActivateOrchestrator` — coordinate multi-step workflows |
| Strategy      | `FundingService` — selects B2C (gateway) or B2B2C (wallet) funding at runtime |
| State Machine | Transaction and eSIM status transitions are explicit and guarded    |
| Double-entry  | `WalletLedger` uses DEBIT/CREDIT bookkeeping for balance integrity   |
| Producer/Consumer | BullMQ `EsimProducer` enqueues; `PurchaseService`/`ActivationService` workers consume |

---

### 2.7 Database & ORM

- **Database**: PostgreSQL
- **ORM**: Prisma (`@prisma/client`)
- **Migrations**: Located in `prisma/migrations/`
- **Seeding**: `prisma/seed.ts` — populates providers, offers, test users
- **Transactions**: `prisma.$transaction()` used for atomic multi-model writes (eSIM creation + wallet commit)
- **Soft Deletes**: `isDeleted` boolean on User, Offer, Esim

---

## 3. Frontend Analysis (React Native)

### 3.1 Screens and Purpose

#### Auth Screens
| Screen                 | Purpose                                        |
|------------------------|------------------------------------------------|
| `OnboardingScreen`     | App introduction for new users                 |
| `LoginScreen`          | Customer email/password login                  |
| `RegisterScreen`       | New customer registration                      |
| `ResellerLoginScreen`  | Separate login flow for salesmen               |

#### Customer Screens
| Screen                  | Purpose                                       |
|-------------------------|-----------------------------------------------|
| `HomeScreen`            | Search bar, popular destinations, featured    |
| `DestinationsScreen`    | Browse all destinations with flag + price     |
| `SearchScreen`          | Full-text search across offers                |
| `PackageListingScreen`  | Offer list for selected country               |
| `PackageDetailScreen`   | Single offer detail, plan comparison          |
| `PaymentScreen`         | Payment method selection + order summary      |
| `PaymentWebViewScreen`  | ClicToPay form embedded in WebView            |
| `ProcessingModal`       | Loading spinner while provisioning            |
| `SuccessScreen`         | Purchase success + QR code preview            |
| `EsimFailedScreen`      | Purchase failure + retry action               |
| `EsimExpiredScreen`     | Expired eSIM state                            |
| `MyEsimsScreen`         | List of user's eSIMs grouped by status        |
| `EsimDetailScreen`      | Data usage bar, activation code, QR code      |
| `EsimSuccessScreen`     | Activation confirmation                       |
| `ProfileScreen`         | Account hub (links to sub-screens)            |
| `PersonalDetailsScreen` | Edit name, email, phone                       |
| `PaymentMethodsScreen`  | Saved payment methods (informational)         |
| `SettingsScreen`        | App preferences                               |
| `HelpCenterScreen`      | FAQs and support contact                      |

#### Reseller Screens
| Screen                      | Purpose                                   |
|-----------------------------|-------------------------------------------|
| `ResellerDashboardScreen`   | Stats: sales count, revenue, pending      |
| `SellESIMScreen`            | Sell eSIM to client (B2B2C flow)          |
| `ActivateESIMScreen`        | Manually trigger eSIM activation          |
| `TransactionsScreen`        | Reseller transaction history              |
| `ResellerWalletScreen`      | Wallet balance + ledger history           |
| `TopUpScreen`               | Submit top-up request                     |
| `ResellerProfileScreen`     | Reseller profile view                     |

---

### 3.2 Navigation Structure

```
RootNavigator (role-based dispatch)
│
├── Unauthenticated → AuthNavigator
│   ├── OnboardingScreen
│   ├── LoginScreen
│   └── RegisterScreen
│
├── CUSTOMER / CLIENT → ClientNavigator
│   ├── HomeStack
│   │   ├── HomeScreen
│   │   ├── DestinationsScreen
│   │   ├── PackageListingScreen
│   │   ├── PackageDetailScreen
│   │   └── PaymentScreen → PaymentWebViewScreen → SuccessScreen / EsimFailedScreen
│   ├── EsimsStack
│   │   ├── MyEsimsScreen
│   │   ├── EsimDetailScreen
│   │   └── EsimSuccessScreen
│   ├── OffersStack (search-based entry)
│   │   └── SearchScreen
│   └── ProfileStack
│       ├── ProfileScreen
│       ├── PersonalDetailsScreen
│       ├── PaymentMethodsScreen
│       └── SettingsScreen
│   [Bottom Tabs: Home | eSIMs | Offers | Profile]
│
└── SALESMAN / ZONE_CHIEF → ResellerNavigator
    ├── DashboardStack → ResellerDashboardScreen → SellESIMScreen / ActivateESIMScreen
    ├── WalletStack → ResellerWalletScreen → TopUpScreen
    ├── TransactionsStack → TransactionsScreen
    └── ProfileStack → ResellerProfileScreen
    [Bottom Tabs: Dashboard | Wallet | Transactions | Profile]
```

---

### 3.3 State Management

| Mechanism          | Scope           | Usage                                              |
|--------------------|-----------------|-----------------------------------------------------|
| **React Context**  | Global auth     | `AuthContext` — user, isAuthenticated, login/logout |
| **React Query**    | Server state    | All API data — caching, invalidation, mutations     |
| **Local useState** | UI state        | Form inputs, modal visibility, filter selections    |
| **Socket.IO cache**| Real-time sync  | Direct cache updates via `queryClient.setQueryData` |

---

### 3.4 Key Reusable Components

| Component              | Purpose                                         |
|------------------------|-------------------------------------------------|
| `ScreenShell`          | Safearea + scroll wrapper                       |
| `ScreenHeader`         | Back button + title bar                         |
| `PrimaryCard`          | Elevated card container                         |
| `OrderSummaryCard`     | Offer + price summary for payment screen        |
| `PaymentMethodTile`    | Selectable payment method button                |
| `StatusBadge`          | Colored badge for eSIM/transaction status       |
| `ErrorBanner`          | Inline error message display                    |
| `LoadingOverlay`       | Full-screen loading spinner                     |
| `CoverageFilterChips`  | LOCAL / REGIONAL / GLOBAL filter row            |
| `PlanTypeToggle`       | Toggle between plan types                       |
| `AuthWallModal`        | Prompt to login for unauthenticated actions     |
| `ResellerGradientHeader` | Reseller section header with gradient        |

---

### 3.5 API Call Strategy

- **HTTP Client**: Axios with base URL from `env.EXPO_PUBLIC_API_URL`
- **Request Interceptor**: Injects `Authorization: Bearer <access_token>`
- **Response Interceptor**:
  - On 401: Call `/auth/refresh` → retry original request
  - Refresh deduplication: Multiple concurrent 401s share one refresh promise
  - If refresh fails: Clear tokens + call auth failure handler (force logout)
- **Queries**: React Query `useQuery` with `queryKey` arrays
- **Mutations**: React Query `useMutation` with `onSuccess` invalidation
- **Real-time**: Socket.IO listeners update query cache directly

---

## 4. eSIM Provider Integration

### 4.1 Provider Adapter Interface

```typescript
// src/esim/interfaces/provider-adapter.interface.ts
interface ProviderAdapter {
  createEsim(dto: CreateEsimDto): Promise<CreateEsimResponse>;
  getStatus(iccid: string): Promise<ProviderStatusResponse>;
  cancelEsim(iccid: string): Promise<void>;
  deactivateEsim(iccid: string): Promise<void>;
  topupEsim(iccid: string, offerId: string): Promise<TopupEsimResponse>;
}

interface CreateEsimDto {
  userId: number;
  offerId: number;
  validityDays: number;
  dataVolume: number;
}

interface CreateEsimResponse {
  iccid: string;           // Unique SIM identifier
  activationCode: string;  // LPA:1$... format for QR code
  expiryDate: Date;
}

interface ProviderStatusResponse {
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  message?: string;
}
```

### 4.2 Mock Provider Implementation

**File**: `src/esim/adapters/mock-provider.adapter.ts`

| Method            | Behavior                                                                 |
|-------------------|--------------------------------------------------------------------------|
| `createEsim()`    | 1000ms delay; deterministic ICCID from `sha256(userId-offerId-timestamp).slice(0,12)` |
| `getStatus()`     | 500ms delay; always returns `SUCCESS` with "Mock activation confirmed"   |
| `cancelEsim()`    | 500ms delay; no-op                                                       |
| `deactivateEsim()`| 500ms delay; no-op                                                       |
| `topupEsim()`     | 800ms delay; returns `{ addedData: 1024, status: 'SUCCESS' }`            |

**Activation code format**: `LPA:1$<offerId>.mock.netyfly.com$<hash>`

### 4.3 Provider Switching Mechanism

- An injection token `PROVIDER_ADAPTER` is registered in `EsimModule`
- At startup, `PROVIDER_TYPE` env var selects the implementation:
  - `"mock"` → `MockProviderAdapter` (current)
  - `"real"` → Real provider HTTP adapter (when a real provider is contracted)
- `PurchaseService` and `ActivationService` inject via `@Inject(PROVIDER_ADAPTER_TOKEN)`
- Switching providers requires only changing the `PROVIDER_TYPE` env var and implementing the same interface

```
                 ┌──────────────────────┐
                 │   ProviderAdapter    │ (interface)
                 └──────────┬───────────┘
                            │
              ┌─────────────┴──────────────┐
              │                            │
   ┌──────────▼──────────┐    ┌────────────▼──────────┐
   │  MockProviderAdapter│    │  RealProviderAdapter  │ (future)
   │  (test/dev)         │    │  (production HTTP)    │
   └─────────────────────┘    └───────────────────────┘
```

---

## 5. Payment Integration

### 5.1 ClicToPay Gateway

| Aspect            | Detail                                                     |
|-------------------|------------------------------------------------------------|
| Provider          | ClicToPay (Tunisian payment gateway)                       |
| Method            | Redirect-based (user sent to hosted payment form)          |
| Amount unit       | Millimes (price × 1000)                                    |
| Currency code     | 788 (TND)                                                  |
| Key methods       | `registerOrder()`, `getOrderStatus()`, `reverseOrder()`, `refundOrder()` |
| Order status codes | 0: REGISTERED, 2: DEPOSITED (paid), 3: REVERSED, 4: REFUNDED, 6: DECLINED |

### 5.2 B2C Payment Flow (Card)

```
Frontend                         Backend                          ClicToPay
   │                                │                                │
   │  POST /transaction/purchase    │                                │
   │───────────────────────────────>│                                │
   │                                │  registerOrder()               │
   │                                │───────────────────────────────>│
   │                                │<─── { orderId, formUrl } ──────│
   │<── { transactionId, status:    │                                │
   │     PENDING_PAYMENT, paymentUrl}│                               │
   │                                │                                │
   │  Open WebView(paymentUrl)      │                                │
   │  [User enters card details]    │                                │
   │                                │                                │
   │<── redirect success/fail ──────│<── redirect callback ──────────│
   │                                │                                │
   │  POST /payment/verify          │                                │
   │───────────────────────────────>│  getOrderStatus()              │
   │                                │───────────────────────────────>│
   │                                │<─── status: 2 (DEPOSITED) ─────│
   │                                │                                │
   │                                │  Enqueue PURCHASE job          │
   │                                │  (Worker creates eSIM)         │
   │<── { transactionId, status:    │                                │
   │     COMPLETED, esimId }        │                                │
```

### 5.3 B2B2C Payment Flow (Wallet)

```
Reseller Frontend                Backend
   │                                │
   │  POST /transaction/purchase    │
   │  { paymentMethod: "WALLET" }   │
   │───────────────────────────────>│
   │                                │  WalletService.ReserveAmount()
   │                                │  └─ WalletTransaction (RESERVED)
   │                                │  └─ WalletLedger (DEBIT/RESERVE)
   │                                │
   │                                │  Enqueue PURCHASE job immediately
   │<── { status: PROCESSING }──────│
   │                                │
   │                                │  [Worker creates eSIM]
   │                                │  [Commit wallet reservation]
   │                                │  WalletTransaction → COMMITTED
   │                                │  WalletLedger (DEBIT/COMMIT)
```

### 5.4 Reconciliation

- `ReconciliationService` handles ClicToPay webhook gaps
- Periodically queries pending payments older than a threshold
- If paid but transaction still `PENDING_PAYMENT` → triggers provisioning
- If failed → reverses payment + updates transaction to `FAILED`

---

## 6. Non-Functional Implementations

### 6.1 Retry System (BullMQ)

**Queue Config** (`esim.queue.ts`):
```typescript
defaultJobOptions: {
  attempts: 5,
  backoff: { type: 'exponential', delay: 5000 },  // 5s → 10s → 20s → 40s → 80s
  timeout: 30000,   // 30 seconds per attempt
  removeOnComplete: true,
  removeOnFail: false,
}
```

**Error Classification**:
```
Error
 ├── RetryableError (extends Error)
 │   → HTTP >= 500, connection reset, timeout, rate limit 429
 │   → BullMQ will retry up to 5 times
 │
 └── TerminalError (extends UnrecoverableError)
     → Missing records, invalid state transition, business logic failure
     → BullMQ marks job as failed immediately (no retry)
```

**Idempotency for Retries**:
- `PurchaseService`: Check if eSIM already exists → skip provider call
- `ActivationService`: 60-second in-flight window blocks duplicate activations
- All workers safe to re-run from scratch after crash

### 6.2 Idempotency Guard

**Mechanism** (`Common/guards/idempotency.guard.ts`):
1. Compute deterministic key: `sha256(userId + offerId + amount + channel + 30-sec window)`
2. Redis `SET key "PENDING" NX EX 30` (atomic set-if-not-exists)
3. If key existed with `PENDING` → respond `409 Conflict`
4. If key existed with result JSON → respond with cached result
5. If new → allow request, store result in Redis for 30s

### 6.3 Error Handling Strategy

| Layer       | Strategy                                                            |
|-------------|---------------------------------------------------------------------|
| Global HTTP | NestJS default exception filter; `ErrorResponseDto` format          |
| Guards      | `ForbiddenException` (403), `UnauthorizedException` (401)           |
| Business    | `NotFoundException` (404), `ConflictException` (409), `BadRequestException` (400) |
| Queue Jobs  | `RetryableError` → retry, `TerminalError` → fail immediately        |
| Frontend    | `ErrorBanner` component; React Query `isError` + `error` states     |
| Auth Failure| Force logout on 401 after refresh fails; clear token storage        |

### 6.4 Security Measures

| Measure                    | Implementation                                                  |
|----------------------------|-----------------------------------------------------------------|
| Password hashing           | bcrypt in `UserService`                                         |
| JWT access tokens          | 15-minute TTL, HS256, Bearer header                             |
| Refresh tokens             | httpOnly cookie (XSS-proof), 30-day TTL, rotation on use        |
| Role-based authorization   | `@Roles()` + `RolesGuard` + `RolesDecorator`                    |
| Resource ownership         | eSIM endpoints verify `req.user.userId === esim.userId`         |
| Rate limiting              | Global `ThrottlerGuard`: 10 req / 600 sec                       |
| CORS                       | Enabled with credentials (origin: true in MVP)                  |
| API keys                   | Provider and gateway credentials via environment variables      |
| Webhook raw body           | Raw body middleware before JSON parser for payment endpoints     |
| Payment PCI scope          | Card data handled entirely by ClicToPay (out of scope for app)  |

### 6.5 Audit Trail

Every state change writes to `AuditLog` with:
- **Layer** classification (PAYMENT / PROVISIONING / ACTIVATION / WALLET)
- **Event** type (e.g., `PAYMENT_INITIATED`, `PROVISIONING_SUCCESS`)
- **Causal chain**: `trigger` field (WEBHOOK / WORKER / USER / SCHEDULER)
- **Timing**: `durationMs`, `providerLatencyMs`
- **Context**: `userId`, `transactionId`, `jobId`, `attemptNumber`, `sessionId`

Database indexes enable fast queries for debugging, analytics, and compliance reporting.

---

## 7. Built vs Planned

### Currently Functional (Built)

| Feature                                  | Status     |
|------------------------------------------|------------|
| JWT auth with refresh token rotation     | Built      |
| User registration / login / logout       | Built      |
| Offer catalog with search + filtering    | Built      |
| B2C eSIM purchase via ClicToPay          | Built      |
| B2B2C reseller purchase via wallet       | Built      |
| BullMQ job queue with exponential retry  | Built      |
| Mock eSIM provider adapter               | Built      |
| eSIM provisioning worker                 | Built      |
| eSIM activation worker                   | Built      |
| Idempotency guard (Redis-based)          | Built      |
| Audit log system                         | Built      |
| Wallet ledger (double-entry)             | Built      |
| Top-up request flow (salesman)           | Built      |
| Zone chief approval of top-ups           | Built      |
| Role-based navigation (customer/reseller)| Built      |
| Payment WebView + redirect handling      | Built      |
| Payment verification + reconciliation    | Built      |
| eSIM usage sync from provider            | Built      |
| Socket.IO real-time cache updates        | Built      |
| Expo push notification registration      | Built (token only) |
| Soft delete for eSIMs, offers, users     | Built      |
| Swagger/OpenAPI documentation            | Built      |
| Bull Board queue visualization           | Built      |
| Rate limiting (ThrottlerGuard)           | Built      |

### Mocked / Partial (Not Yet Production-Ready)

| Feature                                     | Status               |
|---------------------------------------------|----------------------|
| Real eSIM provider integration              | **Mocked** — `MockProviderAdapter` returns static data |
| Actual QR code generation                   | **Partial** — `activationCode` is generated; QR image rendering may be pending |
| Push notification delivery                  | **Partial** — token stored, notification sending not confirmed |
| Support ticketing system                    | **Stub** — module exists, endpoints may not be complete |
| Admin panel / dashboard                     | **Not built** — backend role exists, no frontend |
| eSIM data usage polling from real provider  | **Mocked** — `getStatus()` always returns SUCCESS |
| Production CORS restriction                 | **Pending** — `origin: true` (all origins allowed in MVP) |
| Zone Chief management UI                    | **Backend only** — no frontend screens confirmed |
| Refund flow                                 | **Backend partial** — `reverseOrder()` exists, UI not confirmed |
| eSIM top-up (add data to existing eSIM)     | **Backend partial** — `topupEsim()` in interface, flow not wired |
| Analytics dashboard                         | **Not built** — audit logs stored, no reporting UI |

---

*End of Technical Overview — NetyFly eSIM Platform*
