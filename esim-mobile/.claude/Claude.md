# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Layout

```
PFE/
├── esim-backend/   # NestJS API
├── esim-mobile/    # React Native (Expo) app
├── Docs/           # API contracts and frontend auth guide
└── components/     # Shared JSX primitives (showcase/design reference only)
```

Each sub-project has its own `CLAUDE.md` with finer-grained guidance. This root file covers cross-cutting concerns.

---

## Backend (`esim-backend/`)

### Dev Commands
```bash
cd esim-backend
npm run start:dev          # watch mode
npm run build              # compile
npm run lint               # ESLint --fix
npm run test               # Jest unit tests (src/**/*.spec.ts)
npm run test:watch         # watch
npm run test:cov           # coverage

# E2E — requires Postgres on :5433 (docker compose)
npm run test:db:up         # spin up test DB container
npm run test:db:migrate    # apply migrations to test DB
npm run test:e2e:all       # run all e2e suites
npm run test:e2e:financial # financial-critical-path suite only
npm run test:e2e:payment   # payment-flow suite only
npm run test:e2e:activation # esim-activation suite only

# DB
npx prisma migrate dev     # create + apply migration
npx prisma db seed         # seed providers, offers, test users
```

### Runtime Dependencies
- **PostgreSQL** — connection via `DATABASE_URL` in `.env` (currently Neon hosted)
- **Redis** — `REDIS_HOST/PORT/PASSWORD` (currently Upstash TLS); used by BullMQ and IdempotencyGuard
- **Environment** — copy `.env` values; `PROVIDER_TYPE=mock` uses MockProviderAdapter

### Architecture

**Request path for a B2C purchase:**
1. `POST /transaction/purchase` → `TransactionController` → `EsimPurchaseOrchestrator`
2. Orchestrator calls `FundingService` which selects B2C (ClicToPay gateway) or B2B2C (wallet debit)
3. For B2C: transaction moves to `PENDING_PAYMENT`, frontend opens ClicToPay WebView
4. After payment: `GET /payment/verify` → `getOrderStatus()` → enqueues `purchase-esim` BullMQ job
5. `PurchaseService` worker creates eSIM via `ProviderAdapter`, commits state
6. For B2B2C: wallet reserved immediately, `purchase-esim` job enqueued straight away

**Key design patterns:**
- **Orchestrators** (`EsimPurchaseOrchestrator`, `EsimActivateOrchestrator`) coordinate multi-step flows; keep business logic out of controllers
- **Repository pattern** — all Prisma calls go through `*Repository` classes; services never import `PrismaService` directly
- **ProviderAdapter** — `PROVIDER_ADAPTER` injection token; swap between `MockProviderAdapter` (default) and a real HTTP adapter by changing `PROVIDER_TYPE` env var
- **BullMQ jobs** — `ESIM_QUEUE` with job names `purchase-esim`, `activate-esim`, `topup-esim`; Bull Board UI at `/queues`
- **IdempotencyGuard** — Redis `SET NX EX 30` keyed on `sha256(userId+offerId+amount+channel+30s-window)`; returns `409` on duplicate
- **AuditLog** — every status transition writes a row with `layer`, `event`, `trigger`, `fromStatus`, `toStatus`, timing fields

**Transaction state machine:**
```
PENDING → PENDING_PAYMENT (B2C) → PROCESSING → PROVISIONING → COMPLETED
                                                              ↘ FAILED
       → PROCESSING (B2B2C wallet) ──────────────────────────↗
```

**Auth:** 15-min access token (Bearer header) + 30-day refresh token (httpOnly cookie). `GET /auth/me` bootstraps session on app launch.

**ID types:** Both `Transaction.id` and `Esim.id` are `Int @id @default(autoincrement())` — not strings/cuids despite older docs suggesting otherwise.

### Swagger
Available at `http://localhost:3000/api/docs` when running locally.

---

## Mobile (`esim-mobile/`)

### Dev Commands
```bash
cd esim-mobile
npm run start              # Expo dev server
npm run android            # run on Android emulator/device
npm run ios                # run on iOS simulator

# Design token linting (runs against src/components and src/screens)
npm run check:design-tokens         # warn on violations
npm run check:design-tokens:strict  # fail on violations
```

### Architecture

**Navigation — role-based split at root:**
```
RootNavigator
├── AuthStack          (unauthenticated)
├── ClientNavigator    (role: CLIENT/CUSTOMER)  — tabs: Home | eSIMs | Offers | Profile
└── ResellerTabs       (role: SALESMAN/ZONE_CHIEF) — tabs: Dashboard | Wallet | Transactions | Profile
```
`src/navigation/types.ts` is the single source of truth for all stack param lists.

**API layer:** `src/api/` — thin Axios wrappers. `client.ts` holds the interceptor that injects the Bearer token and handles 401 → refresh → retry with deduplication. All server state goes through React Query (`useMutation` / `useQuery`); never call API functions directly from components.

**Reseller post-sale flow:**
After `purchaseMutation` succeeds, navigate to `DashboardTab → ActivateESIM` (not `HomeTab → ProcessingModal`). The `useActivateESIM` hook fetches the transaction to find the esim ID, then calls `POST /esims/:id/activate`.

### Design System — Non-Negotiable Rules

All UI in `src/screens/` and `src/components/` must use theme tokens. Raw hex values, `rgb()`/`rgba()`, and hardcoded pixel sizes are violations caught by `check:design-tokens`.

**Token files** (`src/theme/`):
| File | Exports |
|---|---|
| `colors.ts` | `colors` — primary `#7C3AED` (violet), secondary `#FACC15` (yellow) |
| `spacing.ts` | `spacing`, `radii` |
| `typography.ts` | `typography` — named text presets (`bodyMD`, `labelSM`, `overline`, …) |
| `sizes.ts` | `sizes` — icon, touch, input, button dimensions |
| `shadows.ts` | `shadows` — `low`, `medium`, `high` |
| `patterns.ts` | `patterns` — composable `ViewStyle` objects (`card`, `headerShell`, `actionBar`, `inputField`, …) |

**Critical pattern: stepper on purple header.** Any stepper rendered inside a `colors.primary.DEFAULT` header must use white/semi-transparent variants — never `colors.primary.DEFAULT` (invisible on purple) or `colors.text.tertiary` (gray, also invisible):
- Active circle bg → `'#fff'`; text → `colors.primary.DEFAULT`
- Inactive circle bg → `'rgba(255,255,255,0.25)'`; text → `'#fff'`
- Connector line → `'rgba(255,255,255,0.25)'` (inactive) / `colors.success.DEFAULT` (done)
- Step labels → `'rgba(255,255,255,0.6)'` (inactive) / `colors.text.onPrimary` (active)

**MenuItem / card-row pattern** (used for save actions, settings rows, logout):
```
patterns.card + flexDirection:'row' + alignItems:'center'
└── 40×40 icon wrap (borderRadius: radii.md, backgroundColor: colors.primary.DEFAULT)
└── Text (flex:1, typography.bodyMD, fontWeight:'600')
└── Ionicons chevron-forward (colors.text.tertiary)
```

**Section labels** in reseller screens use `fontSize:16, fontWeight:'700', color:colors.text.primary` — **not** `typography.overline` (which is small uppercase for secondary labels).

### French Text
All user-facing strings are French. Always include proper accents (`é`, `è`, `ê`, `à`, `ç`, `ô`, etc.). Missing accents are a bug.

---

## Cross-Cutting Notes

- **`Docs/`** — `EsimPayment.md` is the authoritative B2C API contract; `FrontEnd.md` covers the auth flow. Read before touching auth or payment integration.
- **`components/`** at repo root contains JSX showcase primitives (`primitives.jsx`, `recharge-sheet.jsx`) — design reference only, not imported by the app.
- The `.env` in `esim-backend/` is committed (dev/test credentials). Database is Neon-hosted Postgres; Redis is Upstash TLS.

```
Tu travailles sur "esim-mobile", une app React Native (Expo) pour une plateforme eSIM
tunisienne (NetyFly). Objectif de cette session : harmoniser le rendu visuel de TOUS les
écrans pour qu'ils suivent un seul et même design system, déjà défini dans le code.

RÈGLES ABSOLUES
- Ne touche PAS à la logique métier : hooks (src/hooks), appels API (src/api),
  navigation (src/navigation), types, state. Tu modifies uniquement le JSX de rendu
  et les StyleSheet.
- N'introduis AUCUNE couleur, espacement, rayon ou ombre en dur ("magic value").
  Utilise TOUJOURS les tokens importés depuis src/theme :
  colors, spacing, radii, typography, shadows, sizes, patterns.
- Si tu as besoin d'une valeur qui n'existe pas dans les tokens, ajoute-la d'abord
  au fichier de token approprié, puis référence-la. Ne l'inline jamais.
- Conserve l'accessibilité (tailles de cible tactiles ≥ 44px), le support du safe-area,
  et le comportement de scroll existant.
- Le texte de l'UI reste en français.

SOURCE DE VÉRITÉ DU DESIGN
- src/theme/colors.ts, spacing.ts, sizes.ts, typography.ts, shadows.ts, patterns.ts
- src/theme/index.ts (barrel export)
- .claude/DESIGN_SYSTEM_SNAPSHOT.md

PALETTE & GESTES (résumé)
- Primaire (violet) : colors.primary.DEFAULT #7C3AED, .dark #6D28D9, .light #8B5CF6,
  échelle 50→900. Secondaire (jaune CTA) : colors.secondary.DEFAULT #FACC15, .dark #FBBF24.
- Fond écran : colors.background #FAFAFA. Surface carte : colors.surfaceCard #FCF7F7.
  Bordure : colors.border #E5E7EB. Texte : colors.text.primary/secondary/tertiary.
- Dégradé "hero" : linear-gradient(135deg, #6D28D9 → #7C3AED).
- Rayons : radii.card = 20, radii.lg = 16, radii.nav = 18, radii.full = 9999.
- Ombres : shadows.medium pour les cartes, shadows.high pour les barres d'action /
  éléments flottants, shadows.glow pour les boutons jaunes.

Quand je te donnerai un groupe d'écrans, applique ces règles. Avant d'écrire du code,
liste les écarts entre l'écran actuel et le design cible, puis corrige-les.
```

---
