# CLAUDE.md - esim-backend (NestJS)

Purpose: provide a low-token architecture map so agents can work without scanning all backend files.

## 1) Do Not Read Everything

Default behavior:
- Read only module entrypoints and task-specific files.
- Avoid wide `src/**` searches unless root cause is unknown.

Avoid scanning by default:
- `dist/`
- `node_modules/`
- generated prisma artifacts
- unrelated feature folders when task scope is narrow

## 2) System Entry Points

Read first for global wiring:
- `src/main.ts`
- `src/app/app.module.ts`
- `prisma/prisma.service.ts`

Core platform:
- NestJS + Prisma + PostgreSQL
- BullMQ + Redis for async purchase/activation jobs
- JWT auth with guards

## 3) Module Map

Main domains:
- `auth/` -> login/refresh + guards/strategy
- `user/` -> profile + customer resolution for purchase
- `offer/` -> catalog read APIs
- `transaction/` -> purchase endpoint + transaction history/detail
- `payment/` -> payment initiation (currently mock provider simulation)
- `esim/` -> eSIM domain + provider adapter
- `Queue/`, `processors/`, `workers/` -> BullMQ producer/consumer workflow
- `Orchestrators/` -> high-level purchase coordination
- `top-up/` ->   Reseller Wallet TopUp
- `WalletTransaction/` -> wallet reserve/commit/release for B2B2C
- `ProvisionningEvent/` -> audit logging

## 4) B2C Purchase Flow (Current)

Request path:
1. `POST /transaction/purchase` in `src/transaction/transaction.controller.ts`
2. `EsimPurchaseOrchestrator.purchaseEsim(...)`
3. `TransactionService.createInitial(...)` -> transaction PENDING
4. `PaymentService.initiatePayment(...)` -> mock success/fail result
5. on payment success -> `EsimProducer.enqueuePurchase(...)`
6. queue worker `PurchaseService.handlePurchase(...)` creates eSIM and sets PROCESSING
7. activation/job lifecycle continues via processor/workers

## 5) Minimal Read Sets Per Task

If task is purchase API contract:
1. `src/transaction/transaction.controller.ts`
2. `src/transaction/dto/create-transaction.dto.ts`
3. `src/transaction/dto/transaction-response.dto.ts`
4. `src/Orchestrators/EsimPurchaseOrchestrator.ts`

If task is payment behavior (mock vs real):
1. `src/payment/payment.service.ts`
2. `src/payment/payment.controller.ts`
3. `src/payment/payment.repository.ts`
4. `src/Orchestrators/EsimPurchaseOrchestrator.ts`

If task is queue/job failures:
1. `src/Queue/esim.producer.ts`
2. `src/processors/esim.processor.ts`
3. `src/workers/Purchase.service.ts`
4. `src/workers/activation.service.ts`

If task is DB write/read shape:
1. target `*.repository.ts`
2. corresponding `*.service.ts`
3. related DTO in `dto/`
4. prisma schema and entities only if needed

## 6) Contract Notes For Mobile Integration

Mobile depends mainly on:
- `POST /transaction/purchase`
- `GET /transaction`
- `GET /transaction/:id`

When changing responses:
- update DTOs and Swagger annotations
- keep controller return shapes consistent with service outputs
- coordinate with mobile `payment.api.ts` and `types/payment.ts`

## 7) Reliability And State Rules

- Prefer explicit status transitions: PENDING -> PROCESSING -> SUCCEEDED or FAILED.
- Treat retryable infra errors differently from terminal business errors in workers.
- Keep enqueue + DB status updates consistent to avoid false success states.

## 8) Editing Rules

- Keep changes scoped to the active domain module.
- Use repository/service boundaries already in place.
- Avoid introducing cross-module coupling when orchestrator already owns flow.
- Preserve existing route paths unless explicitly requested.

## 9) Dev Commands

Run from `esim-backend/`:
- `npm run start:dev`
- `npm run build`
- `npm run test`
- `npm run test:e2e`
- `npm run lint`

Swagger:
- `http://localhost:3000/api/docs`

## Architecture
- EsimProcessor → eSIM jobs only
- WalletProcessor → wallet jobs only  
- PaymentEventProcessor → webhook jobs only

## Patterns
- Race condition protection: always use $transaction + AttemptTable
- State machines: always use transition() never raw prisma.update on status
- Worker errors: RetryableError vs TerminalError

## Queue jobs
- JOB_ACTIVATE_ESIM → ESIM_QUEUE
- JOB_PURCHASE_ESIM → ESIM_QUEUE
- JOB_WALLET_DEBIT → WALLET_QUEUE
- JOB_TOPUP_CREDIT → WALLET_QUEUE
- JOB_PROCESS_PAYMENT_EVENT → PAYMENT_QUEUE
