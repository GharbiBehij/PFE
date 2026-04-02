# eSIM Backend — Architecture

## Stack

- **Framework**: NestJS (TypeScript)
- **Database**: PostgreSQL via Prisma ORM (`@prisma/adapter-pg`)
- **Queue broker**: Redis 7 + BullMQ (exponential backoff, 3s initial, 5 attempts)
- **Auth**: JWT (access + refresh tokens, bcrypt hashed)
- **Rate limiting**: ThrottlerModule

---

## Module Structure

| Module | Responsibility |
|--------|---------------|
| `auth/` | JWT login/signup, Guards, Passport strategy |
| `user/` | User CRUD, salesman eSIM sales via orchestrator |
| `esim/` | eSIM records, provider adapter (currently mocked) |
| `offer/` | eSIM plan catalog (country, data, price) |
| `transaction/` | Transaction lifecycle: PENDING → PROCESSING → SUCCEEDED/FAILED |
| `payment/` | Payment processing (mocked Stripe, 70/20/10 success/retry/fail) |
| `WalletTransaction/` | Salesman wallet: top-ups, balance reserve/commit/release |
| `Queue/` | BullMQ producer — enqueues purchase & activation jobs |
| `processors/` | BullMQ consumer — routes jobs to worker services |
| `workers/` | Business logic for purchase & activation workflows |
| `Orchestrators/` | High-level purchase flow coordinator (B2C vs B2B2C) |
| `ProvisionningEvent/` | Audit log for all eSIM lifecycle events |

---

## Data Flow

### eSIM Purchase (B2C)

```
HTTP Request
    → EsimPurchaseOrchestrator
        → TransactionService.createInitial()           # Transaction: PENDING
        → PaymentService.initiatePayment()             # mock Stripe
        → EsimProducer.enqueuePurchase()               # → Redis
            → EsimProcessor (concurrency: 10)
                → PurchaseService.handlePurchase()
                    → MockProviderAdapter.createEsim() # ICCID, activationCode
                    → EsimRepository.createAndLinkTransaction()  # atomic
                    → Transaction: PROCESSING
            → onCompleted()
                    → Esim.status: ACTIVE
                    → Transaction: SUCCEEDED
```

### eSIM Purchase (B2B2C — Salesman Wallet)

Same as B2C but payment is replaced by wallet deduction:

1. `WalletRepository.ReserveAmount()` — deducts balance, creates `RESERVED` wallet record
2. On job success → `commitReservedFunds()` → `COMMITTED`
3. On terminal failure → `releaseReservedFunds()` → `RELEASED` (balance refunded)

Double-entry ledger (`WalletLedger`) tracks every balance change with DEBIT/CREDIT + reason (RESERVE/COMMIT/RELEASE/TOP_UP).

### Wallet Top-Up Flow

1. Salesman requests top-up → `TopUpRequest` (PENDING)
2. Admin approves → balance incremented + `WalletTransaction` (COMMITTED) + `WalletLedger` (CREDIT, TOP_UP)
3. Admin rejects → no balance change

---

## Database Schema (Prisma)

### Core Entities

- **User** — id, email, balance, role (CLIENT/SALESMAN/CUSTOMER), status (ONLINE/OFFLINE)
- **Offer** — country, dataVolume, validityDays, price, InternalMargin, providerId
- **Transaction** — status, channel (B2C/B2B2C), amount, currency, userId, offerId
- **eSIM** — iccid (unique), activationCode, status (NOT_ACTIVE/ACTIVE), event, expiryDate, userId, transactionId
- **Payment** — paymentProvider, providerRefId, amount, status, rawResponse (JSON), transactionId
- **Provider** — name, apiUrl, apiKey
- **WalletTransaction** — amount, status (RESERVED/COMMITTED/RELEASED), balanceAfter, userId, transactionId
- **WalletLedger** — amount, type (DEBIT/CREDIT), reason (RESERVE/COMMIT/RELEASE/TOP_UP/REFUND), walletId
- **EsimAuditLog** — userId, jobId, event (EsimEventStatus), status, message, details (JSON), transactionId
- **TopUpRequest** — salesmanId, amount, status (PENDING/APPROVED/REJECTED), reviewedBy

### Key Enums

- `TransactionStatus`: PENDING, PROCESSING, FAILED, SUCCEEDED
- `TransactionChannel`: B2C, B2B2C
- `WalletStatus`: RESERVED, COMMITTED, RELEASED
- `LedgerReason`: RESERVE, COMMIT, RELEASE, TOP_UP, REFUND
- `EsimEventStatus`: 16+ states (PURCHASE_REQUESTED, PROVISIONING_*, PAYMENT_*, ACTIVATION_*, WALLET_FAILED, …)

---

## Key Architectural Patterns

- **Orchestrator** — separates B2C/B2B2C routing from individual services (`EsimPurchaseOrchestrator`)
- **Repository pattern** — all DB access isolated behind repositories; services never touch Prisma directly
- **Adapter pattern** — `ProviderAdapter` interface; swap mock for real eSIM provider without changing workers
- **Error classification** — `RetryableError` (infra failures → BullMQ retries) vs `TerminalError` (business failures → no retry)
- **Idempotency** — workers check prior state before acting (wallet status guard, early-return if SUCCEEDED)
- **Atomic transactions** — wallet reserve/commit/release and eSIM creation use Prisma `$transaction`

---

## External Integrations (currently mocked)

| Integration | File | Notes |
|-------------|------|-------|
| Payment provider (Stripe) | `src/payment/payment.service.ts` | Replace `simulateProviderCall()` with real HTTP |
| eSIM provider API | `src/esim/adapters/mock-provider.adapter.ts` | Implements `ProviderAdapter` interface |

---

## Environment Variables

```
DATABASE_URL=postgresql://postgres:password@localhost:5432/mydatabase?schema=public
JWT_SECRET=...
REDIS_HOST=localhost
REDIS_PORT=6379
PORT=3000
```