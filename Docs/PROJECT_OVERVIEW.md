# NetyFly eSIM Platform — Technical Overview

> Author: Behij Gharbi  
> Stack: NestJS (backend) + React Native Expo (frontend)

---

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

| Layer | Technology |
|-------|-----------|
| Backend | NestJS (TypeScript), Prisma ORM, PostgreSQL |
| Queue | BullMQ + Redis |
| Payment | ClicToPay (Tunisian gateway) |
| Auth | JWT (Passport.js), httpOnly cookies |
| API Docs | Swagger / OpenAPI at `/api/docs` |
| Frontend | React Native (Expo), React Navigation |
| State | React Context API + React Query (TanStack) |
| HTTP | Axios with JWT refresh interceptor |
| Real-time | Socket.IO |
| Storage | Expo SecureStore (tokens) |

### User Roles

| Role | Description |
|------|-------------|
| `CLIENT` / `CUSTOMER` | End customers — buy eSIMs via ClicToPay card payment (B2C) |
| `SALESMAN` | Reseller — sells eSIMs to customers via wallet debit (B2B2C) |
| `ZONE_CHIEF` | Manages resellers, approves top-up requests |
| `ADMIN` | Platform administrator |

---

### Backend Folder Tree (`esim-backend/src/`)

```
src/
├── app/app.module.ts                    Root module
├── main.ts                              Bootstrap, global middleware
├── auth/                                JWT auth, Passport strategy
├── user/                                User CRUD, profile
├── esim/                                eSIM CRUD, provider adapter
│   ├── interfaces/provider-adapter.interface.ts
│   └── adapters/mock-provider.adapter.ts
├── offer/                               Offer catalog, search
├── transaction/                         Purchase state machine
├── payment/                             ClicToPay gateway, webhooks
│   └── Webhook/                         Reconciliation, funding strategy
├── WalletTransaction/                   Reseller wallet ledger
├── TopUp/                               Top-up request workflow
├── Orchestrators/                       EsimPurchaseOrchestrator, EsimActivateOrchestrator
├── Queue/                               BullMQ queue + producer
├── workers/                             Purchase.service, activation.service
├── Common/                              Redis, IdempotencyGuard, shared DTOs
├── AuditLog/                            Audit trail
├── NotificationModule/                  Expo push notifications
├── SupportModule/                       Customer support
└── ZoneChiefModule/                     Zone chief management
```

### Frontend Folder Tree (`esim-mobile/src/`)

```
src/
├── api/                  Axios wrappers (auth, esims, offers, payment, wallet)
├── context/AuthContext.tsx   Global auth state (reducer pattern)
├── hooks/
│   ├── client/           useAuth, usePayment, useEsims, useOffers, useProfile
│   └── reseller/         useDashboardStats, useWallet, useActivateESIM, useTransactions
├── screens/
│   ├── auth/             Login, Register, Onboarding, ResellerLogin
│   ├── home/             HomeScreen
│   ├── offers/           Destinations, PackageListing, PackageDetail, Search
│   ├── payment/          PaymentScreen, WebView, Processing, Success, Failed
│   ├── esims/            MyEsims, EsimDetail, EsimSuccess
│   ├── profile/          Profile, PersonalDetails, PaymentMethods, Settings
│   └── reseller/         Dashboard, Sell, Wallet, Transactions, Activate
├── components/           Reusable UI components
├── navigation/           RootNavigator (role-based dispatch)
├── theme/                Design tokens (colors, spacing, typography)
└── types/                TypeScript type definitions
```

---

## 2. Backend Analysis (NestJS)

### 2.1 Modules and Responsibilities

| Module | Responsibility |
|--------|---------------|
| `AuthModule` | JWT login/signup/refresh, Passport strategy, token management |
| `UserModule` | User CRUD, profile update, password change, push token registration |
| `EsimModule` | eSIM CRUD, usage sync, status transitions, provider adapter injection |
| `OfferModule` | Offer catalog management, search, destination aggregation |
| `TransactionModule` | Purchase initiation, state machine, transaction history |
| `PaymentModule` | ClicToPay gateway integration, verification, reconciliation, webhooks |
| `WalletModule` | Reseller balance ledger, wallet history, reserve/commit/release |
| `TopUpModule` | Reseller top-up requests, zone chief approval workflow |
| `NotificationModule` | Expo push notification delivery |
| `EsimQueueModule` | BullMQ queue registration, Bull Board UI at `/queues` |
| `AuditLog` | Comprehensive audit trail for all state changes |
| `CommonModule` | Redis client, IdempotencyGuard, shared DTOs |

---

### 2.2 Database Schema (PostgreSQL via Prisma)

#### User
| Field | Type | Notes |
|-------|------|-------|
| id | Int (PK) | Auto-increment |
| passportId | String | Unique |
| firstname/lastname | String | |
| email | String | Unique |
| hashedPassword | String | bcrypt hash |
| hashedRefreshToken | String? | Stored hashed for security |
| balance | Float | Reseller wallet balance |
| status | Enum | ONLINE / OFFLINE |
| role | Enum | ADMIN / ZONE_CHIEF / CLIENT / SALESMAN / CUSTOMER |
| pushToken | String? | Expo push notification token |

#### Transaction
| Field | Type | Notes |
|-------|------|-------|
| id | String | PK |
| status | Enum | PENDING → PENDING_PAYMENT / PROCESSING → PROVISIONING → COMPLETED / FAILED |
| channel | Enum | B2C (customer) / B2B2C (reseller) |
| amount | Float | |
| currency | String | |
| userId | Int | FK → User |
| offerId | Int | FK → Offer |

#### Esim
| Field | Type | Notes |
|-------|------|-------|
| id | String | PK |
| iccid | String | Unique (SIM identifier) |
| activationCode | String | LPA format for QR scan |
| status | Enum | NOT_ACTIVE / ACTIVE / PROCESSING / PENDING / FAILED / EXPIRED / DELETED |
| dataTotal / dataUsed | Int? | MB |
| expiryDate | Date? | |
| userId | Int | FK → User |
| transactionId | String | FK → Transaction (unique) |

#### Offer
| Field | Type | Notes |
|-------|------|-------|
| id | Int | PK |
| title / country / countryCode | String | |
| coverageType | Enum | LOCAL / REGIONAL / GLOBAL |
| dataVolume | Int | MB |
| validityDays / price | Int/Float | |
| providerId | Int | FK → Provider |
| isDeleted | Boolean | Soft delete |

#### Payment
| Field | Type | Notes |
|-------|------|-------|
| id | String | PK |
| paymentProvider | String | "CLICTOPAY" |
| gatewayPaymentId | String | Unique (ClicToPay orderId) |
| amount | Float | |
| status | Enum | PENDING / AUTHORIZED / COMPLETED / FAILED |
| paymentUrl | String | Redirect URL for payment form |
| transactionId | String | FK → Transaction |

#### WalletTransaction & WalletLedger (Double-Entry)
| Field | Notes |
|-------|-------|
| WalletTransaction | Aggregated record (RESERVED / COMMITTED / RELEASED) |
| WalletLedger | Individual entries (DEBIT / CREDIT) per operation |
| Reasons | RESERVE / COMMIT / RELEASE / TOP_UP / REFUND |

#### AuditLog
| Field | Notes |
|-------|-------|
| layer | PAYMENT / PROVISIONING / ACTIVATION / WALLET / SYSTEM |
| event | PAYMENT_INITIATED, PROVISIONING_SUCCESS, ACTIVATION_FAILED, etc. |
| trigger | PAYMENT_GATEWAY / WEBHOOK / PROVIDER / WORKER / SCHEDULER / USER |
| fromStatus / toStatus | State transition recording |
| durationMs / providerLatencyMs | Timing metrics |
| details | Extensible JSON context blob |

---

### 2.3 API Endpoints

#### Auth (`/auth`)
| Method | Route | Guard | Description |
|--------|-------|-------|-------------|
| POST | /auth/login | None | Login; returns access + refresh tokens |
| POST | /auth/signup | None | Register new user |
| GET | /auth/me | JwtAuthGuard | Get authenticated user profile |
| POST | /auth/logout | JwtAuthGuard | Logout; clear refresh token |
| POST | /auth/refresh | None | Refresh access token from cookie |

#### Transaction (`/transaction`)
| Method | Route | Guard | Description |
|--------|-------|-------|-------------|
| POST | /transaction/purchase | JwtAuthGuard, IdempotencyGuard | Purchase eSIM |
| GET | /transaction | JwtAuthGuard | Get user's transaction list |
| GET | /transaction/:id | JwtAuthGuard | Get transaction detail |

#### Payment (`/payment`)
| Method | Route | Guard | Description |
|--------|-------|-------|-------------|
| POST | /payment | IdempotencyGuard | Initiate payment for transaction |
| GET | /payment/verify | JwtAuthGuard | Verify ClicToPay payment after return |
| GET | /payment/redirect/success | SkipThrottle | ClicToPay success callback |
| GET | /payment/redirect/fail | SkipThrottle | ClicToPay fail callback |

#### eSIM (`/esims`)
| Method | Route | Guard | Description |
|--------|-------|-------|-------------|
| GET | /esims/destinations | None | Aggregated destinations with pricing |
| GET | /esims | JwtAuthGuard | User's eSIMs grouped by status |
| GET | /esims/:id | JwtAuthGuard | Get single eSIM |
| POST | /esims/:id/sync-usage | JwtAuthGuard | Sync usage from provider |
| DELETE | /esims/:id | JwtAuthGuard | Soft-delete eSIM |

#### Offer (`/offers`)
| Method | Route | Guard | Description |
|--------|-------|-------|-------------|
| GET | /offers | None | List offers (filter: country, region) |
| GET | /offers/popular | None | List popular offers |
| GET | /offers/search | None | Search by destination/title |
| GET | /offers/:id | None | Get offer by ID |

#### Wallet (`/wallet`)
| Method | Route | Guard | Description |
|--------|-------|-------|-------------|
| GET | /wallet/balance | JwtAuthGuard | Get reseller wallet balance |
| GET | /wallet/history | JwtAuthGuard | Paginated wallet history |
| POST | /wallet/topup | JwtAuthGuard | Request top-up (salesman) |
| POST | /wallet/topup/:id/approve | JwtAuthGuard, RolesGuard | Approve top-up (ZONE_CHIEF only) |
| POST | /wallet/topup/:id/reject | JwtAuthGuard, RolesGuard | Reject top-up (ZONE_CHIEF only) |

---

### 2.4 Authentication Strategy

- **Algorithm**: HS256 JWT (Passport.js `JwtStrategy`)
- **Access Token**: 15-minute TTL, `Authorization: Bearer` header
- **Refresh Token**: 30-day TTL, `httpOnly` cookie (XSS-proof), rotation on use
- **Payload**: `{ sub: userId, email, role }`

### 2.5 Guards and Middleware

| Name | Description |
|------|-------------|
| `JwtAuthGuard` | Validates JWT on protected routes |
| `RolesGuard` | Checks user role against `@Roles()` decorator |
| `IdempotencyGuard` | Redis-based deduplication (30-sec window, atomic NX set) |
| `ThrottlerGuard` | Global rate limit: 10 requests / 600 seconds |
| `ValidationPipe` | Global DTO validation (class-validator) |

### 2.6 Design Patterns

| Pattern | Where Applied |
|---------|--------------|
| Repository | PaymentRepository, TransactionRepository, WalletRepository, EsimRepository |
| Adapter | ProviderAdapter interface + MockProviderAdapter; ClicToPayGateway |
| Orchestrator | EsimPurchaseOrchestrator, EsimActivateOrchestrator |
| Strategy | FundingService — selects B2C (gateway) or B2B2C (wallet) at runtime |
| State Machine | Transaction + eSIM status transitions explicitly guarded |
| Double-Entry | WalletLedger — DEBIT/CREDIT bookkeeping for balance integrity |
| Producer/Consumer | BullMQ EsimProducer → PurchaseService / ActivationService workers |

---

## 3. Frontend Analysis (React Native)

### 3.1 Screens

#### Customer Screens
| Screen | Purpose |
|--------|---------|
| `OnboardingScreen` | App introduction |
| `LoginScreen` / `RegisterScreen` | Authentication |
| `HomeScreen` | Search bar, popular destinations |
| `DestinationsScreen` | Browse all destinations |
| `PackageListingScreen` | Offers for a selected country |
| `PackageDetailScreen` | Single offer detail |
| `PaymentScreen` | Payment method selection + order summary |
| `PaymentWebViewScreen` | ClicToPay form in WebView |
| `SuccessScreen` / `EsimFailedScreen` | Purchase result |
| `MyEsimsScreen` | List of user's eSIMs |
| `EsimDetailScreen` | Data usage, activation code, QR code |

#### Reseller Screens
| Screen | Purpose |
|--------|---------|
| `ResellerDashboardScreen` | Sales stats |
| `SellESIMScreen` | B2B2C purchase for a customer |
| `ActivateESIMScreen` | Manually activate eSIM |
| `ResellerWalletScreen` | Balance + ledger history |
| `TopUpScreen` | Submit top-up request |
| `TransactionsScreen` | Transaction history |

### 3.2 Navigation Structure

```
RootNavigator (role-based dispatch)
├── AuthStack  →  Onboarding / Login / Register
├── ClientNavigator (CLIENT / CUSTOMER)
│   └── Bottom Tabs: Home | eSIMs | Offers | Profile
│       ├── HomeStack: Home → Destinations → PackageListing → PackageDetail → Payment → WebView → Success/Failed
│       ├── EsimsStack: MyEsims → EsimDetail → EsimSuccess
│       └── ProfileStack: Profile → PersonalDetails / PaymentMethods / Settings
└── ResellerNavigator (SALESMAN / ZONE_CHIEF)
    └── Bottom Tabs: Dashboard | Wallet | Transactions | Profile
        ├── DashboardStack: Dashboard → Sell / Activate
        ├── WalletStack: Wallet → TopUp
        └── TransactionsStack: Transactions
```

### 3.3 State Management

| Mechanism | Scope | Usage |
|-----------|-------|-------|
| React Context + reducer | Global auth | `AuthContext`: user, isAuthenticated, login/logout |
| React Query | Server state | All API data — caching, invalidation, mutations |
| useState | Local UI | Form inputs, modal visibility, filters |
| Socket.IO | Real-time | `queryClient.setQueryData()` on server push events |

### 3.4 API Call Strategy

- **HTTP Client**: Axios, base URL from `EXPO_PUBLIC_API_URL`
- **Request Interceptor**: Injects `Authorization: Bearer <token>`
- **Response Interceptor**: On 401 → call `/auth/refresh` → retry; if refresh fails → force logout
- **Queries**: React Query `useQuery` (caching + stale revalidation)
- **Mutations**: React Query `useMutation` with `onSuccess` cache invalidation

---

## 4. eSIM Provider Integration

### Provider Adapter Interface

```typescript
interface ProviderAdapter {
  createEsim(dto: CreateEsimDto): Promise<CreateEsimResponse>;
  getStatus(iccid: string): Promise<ProviderStatusResponse>;
  cancelEsim(iccid: string): Promise<void>;
  deactivateEsim(iccid: string): Promise<void>;
  topupEsim(iccid: string, offerId: string): Promise<TopupEsimResponse>;
}
```

### Current Implementation: Mock Provider

| Method | Behavior |
|--------|---------|
| `createEsim()` | 1000ms delay; deterministic ICCID via sha256 |
| `getStatus()` | 500ms delay; always returns `SUCCESS` |
| `cancelEsim()` / `deactivateEsim()` | 500ms delay; no-op |
| `topupEsim()` | 800ms delay; returns `{ addedData: 1024, status: 'SUCCESS' }` |

### Switching to a Real Provider

Set `PROVIDER_TYPE=real` in `.env` and implement `RealProviderAdapter` with the same interface. No other code changes needed.

---

## 5. Payment Integration

### ClicToPay Gateway

| Aspect | Detail |
|--------|--------|
| Provider | ClicToPay (Tunisian payment gateway) |
| Method | Redirect-based (hosted payment form) |
| Amount unit | Millimes (price × 1000) |
| Currency code | 788 (TND) |
| Status codes | 0: Registered, 2: Deposited (paid), 3: Reversed, 4: Refunded, 6: Declined |

### B2C Purchase Flow (Card Payment)

```
Customer → POST /transaction/purchase
         → Backend registers order with ClicToPay → returns paymentUrl
         → Frontend opens WebView(paymentUrl)
         → User pays
         → ClicToPay redirects to success/fail callback
         → GET /payment/verify → confirms status 2 (DEPOSITED)
         → Backend enqueues PURCHASE job
         → Worker creates eSIM → Transaction COMPLETED
```

### B2B2C Purchase Flow (Reseller Wallet)

```
Reseller → POST /transaction/purchase { paymentMethod: "WALLET" }
         → Backend reserves wallet amount
         → Enqueues PURCHASE job immediately
         → Worker creates eSIM → Commits wallet reservation
         → Transaction COMPLETED
```

### Transaction State Machine

```
PENDING → PENDING_PAYMENT (B2C awaiting card)
        → PROCESSING (B2B2C wallet reserved)
             ↓
        PROVISIONING (worker running)
             ↓
     COMPLETED / FAILED
```

---

## 6. Non-Functional Implementations

### Retry System (BullMQ)

```typescript
defaultJobOptions: {
  attempts: 5,
  backoff: { type: 'exponential', delay: 5000 }, // 5s → 10s → 20s → 40s → 80s
  timeout: 30000,
  removeOnComplete: true,
  removeOnFail: false,
}
```

- `RetryableError` → BullMQ retries (HTTP ≥500, timeout, rate limit 429)
- `TerminalError` → fails immediately (invalid state, missing records)
- Workers are idempotent — safe to re-run after crash

### Idempotency Guard

Redis-based deduplication on `POST /transaction/purchase` and `POST /payment`:
1. Compute `sha256(userId + offerId + amount + channel + 30-sec-window)`
2. `SET key "PENDING" NX EX 30` (atomic)
3. Duplicate within 30s → `409 Conflict`
4. Cached result → return cached response

### Security Measures

| Measure | Implementation |
|---------|---------------|
| Password hashing | bcrypt |
| JWT access tokens | 15-min TTL, HS256 |
| Refresh tokens | httpOnly cookie, 30-day TTL, rotation on use |
| Role-based authorization | `@Roles()` + `RolesGuard` |
| Resource ownership | eSIM endpoints verify `userId` matches |
| Rate limiting | 10 req / 600 sec (global ThrottlerGuard) |
| PCI scope | Card data handled entirely by ClicToPay |

### Audit Trail

Every state change writes to `AuditLog` with layer, event, trigger, timing metrics, and full context JSON. Enables debugging, compliance reporting, and analytics.

---

## 7. Built vs Planned

### Currently Functional

| Feature | Status |
|---------|--------|
| JWT auth with refresh token rotation | Built |
| User registration / login / logout | Built |
| Offer catalog with search + filtering | Built |
| B2C eSIM purchase via ClicToPay | Built |
| B2B2C reseller purchase via wallet | Built |
| BullMQ job queue with exponential retry | Built |
| Mock eSIM provider adapter | Built |
| eSIM provisioning + activation workers | Built |
| Idempotency guard (Redis-based) | Built |
| Audit log system | Built |
| Wallet ledger (double-entry) | Built |
| Top-up request + zone chief approval | Built |
| Role-based navigation (customer/reseller) | Built |
| Payment WebView + redirect handling | Built |
| Payment verification + reconciliation | Built |
| eSIM usage sync from provider | Built |
| Socket.IO real-time cache updates | Built |
| Swagger/OpenAPI documentation | Built |
| Bull Board queue visualization | Built |

### Mocked / Not Yet Production-Ready

| Feature | Status |
|---------|--------|
| Real eSIM provider integration | **Mocked** — MockProviderAdapter returns static data |
| Push notification delivery | **Partial** — token stored, sending not confirmed |
| Support ticketing system | **Stub** — module exists, endpoints may be incomplete |
| Admin panel / dashboard | **Not built** — backend role exists, no frontend |
| eSIM data usage from real provider | **Mocked** — getStatus() always returns SUCCESS |
| Production CORS restriction | **Pending** — `origin: true` (all origins in MVP) |
| Refund flow | **Backend partial** — reverseOrder() exists, UI not confirmed |
| eSIM top-up (add data) | **Backend partial** — topupEsim() in interface, flow not wired |
| Analytics dashboard | **Not built** — audit logs stored, no reporting UI |

---

*NetyFly eSIM Platform — Technical Overview*
