# NetyFly eSIM — Référentiel UML
> Généré le : 2026-05-22  
> Auteur : Behij Gharbi  
> Usage : Diagrammes de classes & séquences BCE

---

## TABLE DES MATIÈRES
1. [Modèles Prisma (Entités DB)](#1-modèles-prisma)
2. [Module Auth](#2-module-auth)
3. [Module User](#3-module-user)
4. [Module Esim](#4-module-esim)
5. [Module Offer](#5-module-offer)
6. [Module Transaction](#6-module-transaction)
7. [Module Payment](#7-module-payment)
8. [Module Wallet](#8-module-wallet)
9. [Module TopUp](#9-module-topup)
10. [Orchestrateurs](#10-orchestrateurs)
11. [Queue / Producers](#11-queue--producers)
12. [Processors (Workers)](#12-processors-workers)
13. [Services Transverses](#13-services-transverses)
14. [Guards Communs](#14-guards-communs)
15. [Résumé des Relations inter-modules](#15-relations-inter-modules)

---

## 1. MODÈLES PRISMA

### 1.1 Enums

| Enum | Valeurs |
|------|---------|
| `UserStatus` | ONLINE, OFFLINE |
| `Role` | ADMIN, ZONE_CHIEF, CLIENT, SALESMAN, CUSTOMER |
| `TransactionStatus` | PENDING, PENDING_PAYMENT, PROCESSING, PAID, PROVISIONING, COMPLETED, FAILED, SUCCEEDED, AUTHORIZED, EXPIRED, REFUNDED |
| `TransactionType` | PURCHASE, TOPUP |
| `TransactionChannel` | B2C, B2B2C |
| `CoverageType` | LOCAL, REGIONAL, GLOBAL |
| `EsimStatus` | NOT_ACTIVE, ACTIVE, PROCESSING, PENDING, FAILED, EXPIRED, DELETED |
| `WalletStatus` | RESERVED, COMMITTED, RELEASED |
| `LedgerType` | DEBIT, CREDIT |
| `LedgerReason` | RESERVE, COMMIT, RELEASE, TOP_UP, REFUND |
| `TopUpStatus` | PENDING, PENDING_PAYMENT, PENDING_CASH, APPROVED, CREDITED, REJECTED, FAILED |
| `ActivationAttemptStatus` | STARTED, SUCCESS, FAILED, TIMED_OUT |
| `AuditLayer` | PAYMENT, PROVISIONING, ACTIVATION, WALLET, SYSTEM, TOP_UP |
| `AuditTrigger` | PAYMENT_GATEWAY, WEBHOOK, PROVIDER, WORKER, SCHEDULER, USER, SYSTEM |

---

### 1.2 Classe : `User`
```
User
──────────────────────────────────────────
+ id              : Int          [PK, auto-increment]
+ passportId      : String       [unique]
+ firstname       : String
+ lastname        : String
+ email           : String       [unique]
+ hashedPassword  : String
+ hashedRefreshToken : String?
+ balance         : Float        [default: 0]
+ status          : UserStatus   [default: OFFLINE]
+ role            : Role         [default: CUSTOMER]
+ phone           : String?
+ pushToken       : String?
+ isDeleted       : Boolean      [default: false]
+ createdAt       : DateTime
+ updatedAt       : DateTime
──────────────────────────────────────────
Relations :
  transactions[]       → Transaction
  payments[]           → Payment
  walletTransactions[] → WalletTransaction
  esims[]              → Esim
  topUpRequests[]      → TopUpRequest (salesman)
  reviewedTopUps[]     → TopUpRequest (zone chief)
```

### 1.3 Classe : `Offer`
```
Offer
──────────────────────────────────────────
+ id             : Int          [PK]
+ country        : String
+ Region         : String
+ Destination    : String
+ Category       : String
+ title          : String
+ description    : String?
+ popularity     : Int          [default: 0]
+ coverageType   : CoverageType
+ networkType    : String       [default: "4G"]
+ dataVolume     : Int          (MB)
+ countryCode    : String
+ validityDays   : Int
+ price          : Float
+ InternalMargin : Float        [default: 0]
+ providerId     : Int          [FK → Provider]
+ isDeleted      : Boolean      [default: false]
+ createdAt      : DateTime
+ updatedAt      : DateTime
──────────────────────────────────────────
Relations :
  provider    → Provider
  transactions[] → Transaction
  esims[]     → Esim
```

### 1.4 Classe : `Transaction`
```
Transaction
──────────────────────────────────────────
+ id        : String           [PK, cuid]
+ status    : TransactionStatus [default: PENDING]
+ type      : TransactionType   [default: PURCHASE]
+ channel   : TransactionChannel
+ amount    : Float
+ currency  : String           [default: "TND"]
+ userId    : Int              [FK → User]
+ offerId   : Int              [FK → Offer]
+ createdAt : DateTime
+ updatedAt : DateTime
──────────────────────────────────────────
Relations :
  user              → User
  offer             → Offer
  esim?             → Esim      (1-1 optionnel)
  payment?          → Payment   (1-1 optionnel)
  walletTransaction? → WalletTransaction (1-1 optionnel)
  auditLogs[]       → AuditLog
```

### 1.5 Classe : `Esim`
```
Esim
──────────────────────────────────────────
+ id             : String      [PK, cuid]
+ iccid          : String      [unique]
+ activationCode : String
+ status         : EsimStatus  [default: PENDING]
+ qrCode         : String?
+ dataTotal      : Int?        (MB)
+ dataUsed       : Int?        (MB)
+ lastUsageSync  : DateTime?
+ expiryDate     : DateTime?
+ userId         : Int         [FK → User]
+ transactionId  : String      [FK → Transaction, unique]
+ offerId        : Int         [FK → Offer]
+ providerId     : Int         [FK → Provider]
+ activatedAt    : DateTime?
+ createdAt      : DateTime
+ updatedAt      : DateTime
──────────────────────────────────────────
Index : [userId], [status]
Relations :
  user              → User
  transaction       → Transaction
  offer             → Offer
  provider          → Provider
  activationAttempts[] → ActivationAttempt
  usageHistory[]    → Usage
```

### 1.6 Classe : `Payment`
```
Payment
──────────────────────────────────────────
+ id               : String        [PK, cuid]
+ paymentProvider  : String        [default: "CLICTOPAY"]
+ providerRefId    : String?
+ gatewayPaymentId : String        [unique]
+ amount           : Float
+ status           : TransactionStatus
+ rawResponse      : Json?
+ rawPayload       : Json?
+ paymentUrl       : String?
+ clientSecret     : String?
+ userId           : Int           [FK → User]
+ transactionId    : String        [FK → Transaction, unique]
+ createdAt        : DateTime
+ updatedAt        : DateTime
──────────────────────────────────────────
Relations :
  user        → User
  transaction → Transaction
```

### 1.7 Classe : `WalletTransaction`
```
WalletTransaction
──────────────────────────────────────────
+ id            : String       [PK, cuid]
+ amount        : Float
+ balanceAfter  : Float
+ paymentMethod : String
+ status        : WalletStatus
+ userId        : Int          [FK → User]
+ transactionId : String?      [FK → Transaction, unique, optionnel]
+ createdAt     : DateTime
──────────────────────────────────────────
Relations :
  user          → User
  transaction?  → Transaction
  ledgerEntries[] → WalletLedger
```

### 1.8 Classe : `WalletLedger`
```
WalletLedger
──────────────────────────────────────────
+ id          : String       [PK, cuid]
+ amount      : Float
+ type        : LedgerType   (DEBIT / CREDIT)
+ reason      : LedgerReason
+ referenceId : String
+ walletId    : String       [FK → WalletTransaction]
+ createdAt   : DateTime
──────────────────────────────────────────
Relations :
  wallet → WalletTransaction
```

### 1.9 Classe : `TopUpRequest`
```
TopUpRequest
──────────────────────────────────────────
+ id               : Int          [PK]
+ amount           : Float
+ currency         : String
+ paymentMethod    : String       (CARD / CASH)
+ status           : TopUpStatus
+ gatewayPaymentId : String?
+ paymentUrl       : String?
+ failureReason    : String?
+ creditedAt       : DateTime?
+ salesmanId       : Int          [FK → User]
+ reviewedBy       : Int?         [FK → User (zone chief)]
+ createdAt        : DateTime
+ updatedAt        : DateTime
──────────────────────────────────────────
Relations :
  salesman   → User
  reviewer?  → User
  attempts[] → TopUpAttempt
```

### 1.10 Classe : `ActivationAttempt`
```
ActivationAttempt
──────────────────────────────────────────
+ id                : String                  [PK, cuid]
+ attemptNumber     : Int
+ status            : ActivationAttemptStatus
+ providerRequestId : String                  [unique]
+ providerResponse  : Json
+ errorCode         : String?
+ errorMessage      : String?
+ startedAt         : DateTime
+ completedAt       : DateTime?
+ esimId            : String                  [FK → Esim]
+ createdAt         : DateTime
──────────────────────────────────────────
Relations :
  esim → Esim
```

### 1.11 Classe : `AuditLog`
```
AuditLog
──────────────────────────────────────────
+ id               : String      [PK, cuid]
+ layer            : AuditLayer
+ event            : SystemEvent
+ eventVersion     : String?
+ userId           : Int?
+ jobId            : String?
+ attemptNumber    : Int?
+ sessionId        : String?
+ requestId        : String?
+ fromStatus       : String?
+ toStatus         : String?
+ statusDomain     : String?
+ triggeredBy      : String?
+ trigger          : AuditTrigger
+ durationMs       : Int?
+ providerLatencyMs: Int?
+ providerCode     : String?
+ paymentProvider  : String?
+ message          : String?
+ details          : Json?
+ transactionId    : String?     [FK → Transaction]
+ createdAt        : DateTime
──────────────────────────────────────────
Relations :
  transaction? → Transaction
```

### 1.12 Classe : `Provider`
```
Provider
──────────────────────────────────────────
+ id        : Int      [PK]
+ name      : String   [unique]
+ apiUrl    : String?
+ apiKey    : String?
+ createdAt : DateTime
──────────────────────────────────────────
Relations :
  offers[] → Offer
  esims[]  → Esim
```

### 1.13 Classe : `Usage`
```
Usage
──────────────────────────────────────────
+ id            : String   [PK, cuid]
+ remainingData : Int
+ recordedAt    : DateTime
+ esimId        : String   [FK → Esim]
──────────────────────────────────────────
Relations :
  esim → Esim
```

---

## 2. MODULE AUTH

### 2.1 Classe : `AuthController`
**Route base :** `/auth`

| Méthode HTTP | Route | Guards | Opération | Paramètres | Retour |
|---|---|---|---|---|---|
| POST | `/auth/login` | — | `login()` | `dto: LoginDto`, `res: Response` | tokens + cookie |
| POST | `/auth/signup` | — | `signup()` | `dto: SignupDto`, `res: Response` | tokens + cookie |
| GET | `/auth/me` | JwtAuthGuard | `getMe()` | `req: Request` | `UserProfileDto` |
| POST | `/auth/logout` | JwtAuthGuard | `logout()` | `req: Request`, `res: Response` | `{ message }` |
| POST | `/auth/refresh` | — | `refresh()` | `req: Request`, `body: {refreshToken?}`, `res: Response` | nouveaux tokens |

### 2.2 Classe : `AuthService`

| Opération | Paramètres | Retour | Description |
|---|---|---|---|
| `login()` | `dto: LoginDto` | `{ accessToken, refreshToken, user }` | Vérifie email/password, génère tokens |
| `signup()` | `dto: SignupDto` | `{ accessToken, refreshToken, user }` | Crée utilisateur + génère tokens |
| `logout()` | `id: number` | `void` | Supprime refresh token haché |
| `getMe()` | `userId: number` | `UserProfileDto` | Retourne profil utilisateur courant |
| `refresh()` | `dto: RefreshDto` | `{ accessToken, refreshToken }` | Rotation du refresh token |
| `refreshByToken()` | `refreshToken: string` | `{ accessToken, refreshToken }` | Refresh depuis token brut |
| `generateAndSaveTokens()` | `user: any` | `{ accessToken, refreshToken }` | Génère JWT paire + hash + stocke |
| `toPublicUser()` *(private)* | `user: any` | `PublicUserDto` | Mapping → DTO public |

---

## 3. MODULE USER

### 3.1 Classe : `UserController`
**Route base :** `/user`

| Méthode HTTP | Route | Guards | Opération | Paramètres | Retour |
|---|---|---|---|---|---|
| POST | `/user` | — | `create()` | `dto: CreateUserDto` | `UserDto` |
| GET | `/user/profile` | JwtAuthGuard | `getProfile()` | `req: Request` | `ProfileResponseDto` |
| PATCH | `/user/profile` | JwtAuthGuard | `updateProfile()` | `dto: UpdateProfileDto`, `req: Request` | `ProfileResponseDto` |
| POST | `/user/change-password` | JwtAuthGuard | `changePassword()` | `dto: ChangePasswordDto`, `req: Request` | `{ message }` |
| PATCH | `/user/push-token` | JwtAuthGuard | `updatePushToken()` | `body: {pushToken}`, `req: Request` | `void` |

### 3.2 Classe : `UserService`

| Opération | Paramètres | Retour | Description |
|---|---|---|---|
| `findByEmail()` | `email: string` | `User \| null` | Recherche par email |
| `findById()` | `id: number` | `User \| null` | Recherche par ID |
| `create()` | `dto: CreateUserDto` | `User` | Crée utilisateur (hash password) |
| `validateRefreshToken()` | `id: number`, `refreshToken: string` | `boolean` | Compare refresh token haché |
| `removeRefreshToken()` | `id: number` | `void` | Efface refresh token (logout) |
| `updateStatus()` | `userId: number`, `status: UserStatus` | `void` | Met à jour ONLINE/OFFLINE |
| `StoreHashedRefreshToken()` | `userId: number`, `refreshToken: string` | `void` | Hash + stocke refresh token |
| `updatePushToken()` | `userId: number`, `pushToken: string` | `void` | Enregistre token Expo |
| `getProfile()` | `userId: number` | `ProfileResponseDto` | Retourne profil complet |
| `updateProfile()` | `userId: number`, `dto: UpdateProfileDto` | `ProfileResponseDto` | Modifie champs profil |
| `changePassword()` | `userId: number`, `dto: ChangePasswordDto` | `{ message }` | Vérifie ancien + hash nouveau |
| `sellEsim()` | `dto: SellEsimDto`, `salesmanId: number` | `TransactionResponseDto` | Délègue au `EsimPurchaseOrchestrator` |
| `toProfileDto()` *(private)* | `user: any` | `ProfileResponseDto` | Mapping → DTO |

---

## 4. MODULE ESIM

### 4.1 Classe : `EsimController`
**Route base :** `/esims`

| Méthode HTTP | Route | Guards | Opération | Paramètres | Retour |
|---|---|---|---|---|---|
| GET | `/esims/destinations` | — | `getDestinations()` | — | `DestinationDto[]` |
| GET | `/esims` | JwtAuthGuard | `getUserEsims()` | `req: Request` | `EsimListResponseDto` |
| GET | `/esims/my-esims` | JwtAuthGuard | `getMyEsimsLegacy()` | `req: Request` | `EsimListResponseDto` |
| GET | `/esims/:id` | JwtAuthGuard | `getEsimById()` | `id: number`, `req: Request` | `EsimResponseDto` |
| POST | `/esims/:id/sync-usage` | JwtAuthGuard | `syncUsage()` | `id: number` | `void` |
| POST | `/esims/:id/topup` | JwtAuthGuard, IdempotencyGuard | `initiateTopup()` | `id: number`, `dto: EsimTopupDto`, `req: Request` | `TopupResponseDto` |
| DELETE | `/esims/:id` | JwtAuthGuard | `deleteEsim()` | `id: number`, `req: Request` | `{ message }` |

### 4.2 Classe : `EsimService`

| Opération | Paramètres | Retour | Description |
|---|---|---|---|
| `initiateTopup()` | `esimId: number`, `userId: number`, `dto: EsimTopupDto` | `TopupResponseDto` | Initie topup données eSIM |
| `getDestinations()` | — | `DestinationDto[]` | Agrège destinations depuis offres |
| `create()` | `dto: CreateEsimDto`, `userId: number`, `transactionId: number`, `providerId: number` | `Esim` | Crée eSIM via provider adapter |
| `findById()` | `id: number` | `Esim` | Récupère eSIM par ID |
| `getUserEsims()` | `userId: number` | `EsimListResponseDto` | eSIMs groupés par statut |
| `getEsimById()` | `userId: number`, `esimId: number` | `EsimResponseDto` | Détail eSIM avec vérification ownership |
| `syncUsage()` | `esimId: number` | `void` | Sync consommation données depuis provider |
| `markPending()` | `id: number` | `Esim` | Transition → PENDING |
| `markNotActive()` | `id: number` | `Esim` | Transition → NOT_ACTIVE |
| `markProcessing()` | `id: number` | `Esim` | Transition → PROCESSING |
| `markActive()` | `id: number` | `Esim` | Transition → ACTIVE |
| `markExpired()` | `id: number` | `Esim` | Transition → EXPIRED |
| `markDeleted()` | `id: number` | `Esim` | Transition → DELETED |
| `deleteEsim()` | `userId: number`, `esimId: number` | `{ message }` | Soft-delete avec vérif ownership |
| `requestActivation()` | `esimId: number`, `params: {userId, transactionId, providerCode}` | `Esim` | Transition PENDING → PROCESSING, crée ActivationAttempt |
| `startProcessing()` | `esimId: number`, `params: {...}` | `Esim` | Enregistre début traitement provider |
| `markActivationSuccess()` | `esimId: number`, `params: {...}` | `Esim` | Transition → ACTIVE + audit |
| `markActivationFailure()` | `esimId: number`, `params: {...}` | `Esim` | Transition → FAILED + audit |
| `markTimeout()` | `esimId: number`, `params: {...}` | `Esim` | Transition → FAILED (timeout) |

### 4.3 Classe : `EsimRepository`

| Opération | Paramètres | Retour | Description |
|---|---|---|---|
| `create()` | `data: Prisma.EsimUncheckedCreateInput` | `Esim` | INSERT eSIM |
| `createAndLinkTransaction()` | `data`, `transactionId: number` | `Esim` | INSERT eSIM + lien transaction |
| `findById()` | `id: number` | `Esim \| null` | SELECT par ID |
| `findByTransactionId()` | `transactionId: number` | `Esim \| null` | SELECT par transactionId |
| `UpdateEsim()` | `id: number`, `data: UpdateEsimDto` | `Esim` | UPDATE champs eSIM |
| `findByUserId()` | `userId: number` | `Esim[]` | SELECT par userId |
| `findByIdWithOffer()` | `id: number` | `Esim & {offer}` | JOIN offer |
| `updateUsage()` | `id: number`, `dataUsed: number` | `Esim` | UPDATE dataUsed |
| `updateStatus()` | `id: number`, `status: EsimStatus` | `Esim` | UPDATE status |
| `updateStatusTx()` | `tx`, `id: number`, `status: EsimStatus` | `Esim` | UPDATE status (dans transaction Prisma) |
| `softDelete()` | `id: number` | `Esim` | UPDATE isDeleted = true |
| `aggregateDestinationsByCountryAndCoverageType()` | — | `DestinationAggr[]` | GROUP BY country, coverageType |

### 4.4 Interface : `ProviderAdapter`

| Opération | Paramètres | Retour | Description |
|---|---|---|---|
| `createEsim()` | `dto: CreateEsimDto` | `Promise<CreateEsimResponse>` | Provision eSIM chez provider |
| `getStatus()` | `iccid: string` | `Promise<ProviderStatusResponse>` | Vérifie statut activation |
| `cancelEsim()` | `iccid: string` | `Promise<void>` | Annule eSIM |
| `deactivateEsim()` | `iccid: string` | `Promise<void>` | Désactive eSIM |
| `topupEsim()` | `iccid: string`, `offerId: string` | `Promise<TopupEsimResponse>` | Ajoute données eSIM |

---

## 5. MODULE OFFER

### 5.1 Classe : `OfferController`
**Route base :** `/offers`

| Méthode HTTP | Route | Guards | Opération | Paramètres | Retour |
|---|---|---|---|---|---|
| POST | `/offers` | — | `create()` | `dto: CreateOfferDto` | `Offer` |
| GET | `/offers` | — | `findAll()` | `country?`, `region?`, `coverageType?` | `Offer[]` |
| GET | `/offers/popular` | — | `findPopular()` | — | `Offer[]` |
| GET | `/offers/search` | — | `search()` | `q: string` | `Offer[]` |
| GET | `/offers/destinations` | — | `findDestinations()` | — | `DestinationDto[]` |
| GET | `/offers/:id` | — | `findbyId()` | `id: string` | `Offer` |

### 5.2 Classe : `OfferService`

| Opération | Paramètres | Retour | Description |
|---|---|---|---|
| `create()` | `dto: CreateOfferDto` | `Offer` | Crée une offre |
| `update()` | `id: number`, `dto: UpdateOfferDto` | `Offer` | Met à jour offre |
| `delete()` | `id: number` | `void` | Soft-delete offre |
| `findbyId()` | `id: number` | `Offer` | Cherche par ID |
| `findAll()` | — | `Offer[]` | Liste toutes offres actives |
| `findByCountry()` | `country: string` | `Offer[]` | Filtrer par pays |
| `findPopular()` | — | `Offer[]` | Trier par popularité desc |
| `search()` | `query: string` | `Offer[]` | Recherche full-text title/destination |
| `findByFilters()` | `{ country?, region?, coverageType? }` | `Offer[]` | Filtre combiné |
| `findDestinations()` | — | `DestinationDto[]` | Liste destinations agrégées |

---

## 6. MODULE TRANSACTION

### 6.1 Classe : `TransactionController`
**Route base :** `/transaction`

| Méthode HTTP | Route | Guards | Opération | Paramètres | Retour |
|---|---|---|---|---|---|
| POST | `/transaction/purchase` | JwtAuthGuard, IdempotencyGuard | `purchaseB2C()` | `dto: B2CPurchaseDto`, `req: Request` | `TransactionResponseDto` |
| GET | `/transaction` | JwtAuthGuard | `getMine()` | `req: Request` | `Transaction[]` |
| GET | `/transaction/:id` | JwtAuthGuard | `getById()` | `req: Request`, `id: string` | `TransactionDetailDto` |
| POST | `/transaction/:id/refund` | JwtAuthGuard, IdempotencyGuard | `requestRefund()` | `req: Request`, `id: string` | `{ message }` |

### 6.2 Classe : `TransactionService`

| Opération | Paramètres | Retour | Description |
|---|---|---|---|
| `createInitial()` | `dto: CreateTransactionDto`, `userId: number` | `Transaction` | Crée transaction PENDING |
| `transition()` | `id: number`, `next: TransactionStatus`, `source?`, `correlationId?` | `Transaction` | State machine avec validation |
| `requestRefund()` | `transactionId: number`, `userId: number` | `void` | Initie remboursement |
| `findOne()` | `transactionId: number` | `Transaction` | Récupère par ID |
| `getUserTransactions()` | `userId: number` | `Transaction[]` | Liste transactions utilisateur |
| `findOneWithAuditContext()` | `transactionId: number` | `Transaction & auditLogs` | Avec derniers audit logs |
| `getTransactionDetail()` | `userId: number`, `transactionId: number` | `TransactionDetailDto` | Détail + vérif ownership |
| `assertValidTransition()` *(private)* | `current`, `next` | `void` | Lève exception si transition invalide |

### 6.3 Classe : `TransactionRepository`

| Opération | Paramètres | Retour | Description |
|---|---|---|---|
| `createInitial()` | `data: Prisma.TransactionUncheckedCreateInput` | `Transaction` | INSERT |
| `updateStatus()` | `id: number`, `status: TransactionStatus` | `Transaction` | UPDATE status |
| `updateStatusTx()` | `tx`, `id`, `status` | `Transaction` | UPDATE dans transaction Prisma |
| `findOne()` | `transactionId: number` | `Transaction \| null` | SELECT |
| `findForUser()` | `userId`, `transactionId` | `Transaction \| null` | SELECT + ownership |
| `findManyForUser()` | `userId: number` | `Transaction[]` | SELECT liste |
| `findWithRelations()` | `transactionId: number` | `Transaction & {esim, payment}` | JOIN complet |
| `findLatestAuditContext()` | `transactionId: number` | `AuditLog \| null` | Dernier audit log |
| `applyRefundStatuses()` | `paymentId`, `transactionId`, `esimId` | `void` | UPDATE statuts en transaction atomique |
| `createRefund()` | `transactionId`, `userId` | `void` | Enregistre remboursement |

---

## 7. MODULE PAYMENT

### 7.1 Classe : `PaymentController`
**Route base :** `/payment`

| Méthode HTTP | Route | Guards | Opération | Paramètres | Retour |
|---|---|---|---|---|---|
| POST | `/payment` | JwtAuthGuard, IdempotencyGuard | `create()` | `dto: CreatePaymentDto`, `transactionId: number`, `req: Request` | `{ paymentUrl }` |
| GET | `/payment/verify` | JwtAuthGuard | `verifyPayment()` | `transactionId: number`, `req: Request` | `VerifyResultDto` |
| POST | `/payment/verify` | JwtAuthGuard | `verifyAndProcess()` | `dto: PaymentVerifyDto` | `{ status, transactionId }` |
| GET | `/payment/redirect/success` | SkipThrottle | `redirectSuccess()` | `orderId: string` | Redirect |
| GET | `/payment/redirect/fail` | SkipThrottle | `redirectFail()` | `orderId: string` | Redirect |

### 7.2 Classe : `PaymentService`

| Opération | Paramètres | Retour | Description |
|---|---|---|---|
| `initiatePayment()` | `transaction: Transaction` | `{ gatewayOrderId, paymentUrl }` | Enregistre commande ClicToPay |
| `verifyPayment()` | `transactionId: number` | `{ paid, status, gatewayStatus, pan?, approvalCode? }` | Vérifie statut paiement |
| `verifyAndProcess()` | `orderId: string` | `{ status, transactionId }` | Vérifie + déclenche provisioning |
| `mapVerificationResult()` *(private)* | `result`, `transactionId` | `VerifyResultDto` | Mapping codes gateway → DTO |

### 7.3 Classe : `PaymentRepository`

| Opération | Paramètres | Retour | Description |
|---|---|---|---|
| `initiatePayment()` | `transaction: Transaction` | `{ gatewayOrderId, paymentUrl }` | INSERT Payment + appel ClicToPay |
| `checkPaymentStatus()` | `gatewayOrderId: string` | `{ status, pan?, approvalCode?, errorMessage? }` | Interroge gateway |
| `reversePayment()` | `gatewayOrderId: string` | `boolean` | Annule paiement |
| `refundPayment()` | `gatewayOrderId: string`, `amount: number` | `boolean` | Rembourse |
| `initiatePaymentTx()` | `tx`, `data` | `Payment` | INSERT dans transaction Prisma |
| `updatePaymentStatus()` | `transactionId`, `status`, `rawResponse?` | `Payment` | UPDATE statut |
| `findByGatewayPaymentId()` | `gatewayPaymentId: string` | `Payment \| null` | SELECT par orderId gateway |
| `findByTransactionId()` | `transactionId: number` | `Payment \| null` | SELECT par transactionId |
| `updateStatusByGatewayPaymentId()` | `gatewayPaymentId`, `status`, `rawPayload?` | `Payment` | UPDATE par orderId |
| `findStalePayments()` | `olderThanMs: number` | `Payment[]` | Paiements en attente trop vieux |
| `findExpiredCandidates()` | `expiryMs: number` | `Payment[]` | Candidats à expiration |

### 7.4 Classe : `ClicToPayService`

| Opération | Paramètres | Retour | Description |
|---|---|---|---|
| `registerOrder()` | `params: ClicToPayRegisterParams` | `ClicToPayRegisterResponse` | Enregistre commande (obtient formUrl) |
| `getOrderStatus()` | `orderId: string`, `language?` | `ClicToPayOrderStatus` | Statut standard |
| `getOrderStatusExtended()` | `orderId: string`, `language?` | `ClicToPayExtendedStatus` | Statut étendu + détails PAN |
| `reverseOrder()` | `orderId: string`, `language?` | `ClicToPayErrorResponse` | Annule commande |
| `refundOrder()` | `orderId: string`, `amount: number` | `ClicToPayErrorResponse` | Rembourse montant partiel/total |

### 7.5 Classe : `FundingService`

**Enum `FundingSource` :** GATEWAY, WALLET

| Opération | Paramètres | Retour | Description |
|---|---|---|---|
| `execute()` | `source: FundingSource`, `dto`, `transactionId`, `userId`, `salesmanId?` | `FundingResult` | Stratégie : sélectionne GATEWAY ou WALLET |
| `releaseWalletFunds()` | `transactionId: number` | `void` | Libère réservation wallet en cas d'échec |
| `fundViaGateway()` *(private)* | `...` | `FundingResult` | Flux ClicToPay |
| `fundViaWallet()` *(private)* | `...` | `FundingResult` | Débit wallet |

### 7.6 Classe : `ReconciliationService`

| Opération | Paramètres | Retour | Description |
|---|---|---|---|
| `reconcileStalePayments()` | — | `void` | **@Cron(every 5 min)** — vérifie paiements bloqués |
| `expireAbandonedTransactions()` *(private)* | — | `void` | Expire transactions abandonnées |
| `notifyUpcomingExpiry()` | — | `void` | **@Cron(8h quotidien)** — notifie eSIMs bientôt expirés |

---

## 8. MODULE WALLET

### 8.1 Classe : `WalletController`
**Route base :** `/wallet`  
**Guards globaux :** JwtAuthGuard, RolesGuard

| Méthode HTTP | Route | Rôles | Opération | Paramètres | Retour |
|---|---|---|---|---|---|
| GET | `/wallet/balance` | SALESMAN, CLIENT | `getBalance()` | `req: AuthRequest` | `{ balance }` |
| GET | `/wallet/history` | SALESMAN, CLIENT | `getWalletHistory()` | `req`, `page`, `limit` | `WalletHistoryDto` |
| POST | `/wallet/topup/request` | SALESMAN, CLIENT | `requestTopUp()` | `req`, `dto: RequestTopUpDto` | `TopUpResponseDto` |
| GET | `/wallet/topup/history` | SALESMAN, CLIENT | `getMyTopUpHistory()` | `req`, `page`, `limit` | `TopUpHistoryDto` |
| GET | `/wallet/topup/pending` | ADMIN, ZONE_CHIEF | `getPendingTopUps()` | `page`, `limit` | `TopUpRequest[]` |
| POST | `/wallet/topup/approve` | ZONE_CHIEF, ADMIN | `approveTopUp()` | `req`, `dto: ApproveRejectTopUpDto` | `void` |
| POST | `/wallet/topup/reject` | ZONE_CHIEF, ADMIN | `rejectTopUp()` | `req`, `dto: ApproveRejectTopUpDto` | `void` |

### 8.2 Classe : `WalletService`

| Opération | Paramètres | Retour | Description |
|---|---|---|---|
| `ReserveAmount()` | `userId`, `transactionId`, `amount`, `paymentMethod` | `WalletTransaction` | Réserve fonds (RESERVED) + DEBIT ledger |
| `releaseReservedFunds()` | `transactionId: number` | `void` | Libère réservation (RELEASED) + CREDIT ledger |
| `commitReservedFunds()` | `transactionId: number` | `void` | Valide débit (COMMITTED) + DEBIT/COMMIT ledger |
| `findUnique()` | `transactionId: number` | `WalletTransaction \| null` | Cherche wallet transaction |
| `logLedger()` | `walletId`, `amount`, `type`, `reason`, `referenceId` | `WalletLedger` | Insère entrée de ledger |
| `getBalance()` | `userId: number` | `{ balance: Float }` | Solde courant |
| `getWalletHistory()` | `userId`, `page`, `limit` | `WalletHistoryDto` | Historique paginé |
| `getSalesmanTopUpHistory()` | `salesmanId`, `page`, `limit` | `TopUpHistoryDto` | Historique recharges |
| `getPendingTopUps()` | `page`, `limit` | `TopUpRequest[]` | En attente d'approbation |
| `approveTopUp()` | `topUpId`, `zonechiefId` | `void` | Approuve + crédite wallet |
| `rejectTopUp()` | `topUpId`, `zonechiefId` | `void` | Rejette demande |

### 8.3 Classe : `WalletRepository`
*(Mêmes opérations que WalletService — couche accès données Prisma)*

| Opération | Description |
|---|---|
| `ReserveAmount()` | `prisma.$transaction()` : INSERT WalletTransaction + WalletLedger + UPDATE User.balance |
| `commitReservedFunds()` | UPDATE WalletTransaction.status = COMMITTED + INSERT ledger COMMIT |
| `releaseReservedFunds()` | UPDATE WalletTransaction.status = RELEASED + INSERT ledger RELEASE + UPDATE User.balance (+) |
| `logLedger()` | INSERT WalletLedger |
| `findUnique()` | SELECT WalletTransaction WHERE transactionId |
| `getBalance()` | SELECT User.balance |
| `getWalletHistory()` | SELECT WalletTransaction + WalletLedger paginé |
| `getSalesmanTopUpHistory()` | SELECT TopUpRequest WHERE salesmanId |
| `getPendingTopUps()` | SELECT TopUpRequest WHERE status IN (PENDING, PENDING_CASH, PENDING_PAYMENT) |
| `approveTopUp()` | UPDATE TopUpRequest.status = APPROVED + UPDATE User.balance |
| `rejectTopUp()` | UPDATE TopUpRequest.status = REJECTED |

---

## 9. MODULE TOPUP

### 9.1 Classe : `TopUpController`
**Route base :** `/top-up`  
**Guards globaux :** JwtAuthGuard, RolesGuard

| Méthode HTTP | Route | Rôles | Guards | Opération | Paramètres | Retour |
|---|---|---|---|---|---|---|
| POST | `/top-up` | SALESMAN | IdempotencyGuard | `initiateTopUp()` | `dto: CreateTopUpDto`, `req: Request` | `TopUpResponseDto` |
| PATCH | `/top-up/:id/confirm-cash` | ZONE_CHIEF | IdempotencyGuard | `confirmCash()` | `topUpRequestId: number`, `req: Request` | `void` |

### 9.2 Classe : `TopUpService`

| Opération | Paramètres | Retour | Description |
|---|---|---|---|
| `initiateTopUp()` | `dto: CreateTopUpDto`, `salesmanId: number` | `TopUpResponseDto` | Délègue à TopUpOrchestrator |
| `confirmCash()` | `topUpRequestId: number`, `zoneChiefId: number` | `void` | Confirme paiement espèces |
| `topupEsim()` | `esimId: number`, `dto: EsimTopupDto`, `userId: number` | `TopupResponseDto` | Délègue à EsimTopupOrchestrator |
| `getTopupOffers()` | `esimId: number`, `userId: number` | `Offer[]` | Offres disponibles pour recharge |

---

## 10. ORCHESTRATEURS

### 10.1 Classe : `EsimPurchaseOrchestrator`

| Opération | Paramètres | Retour | Description |
|---|---|---|---|
| `purchaseEsim()` | `dto: CreateTransactionDto`, `salesmanId: number` | `TransactionResponseDto` | Flux complet achat eSIM |
| `resolveClient()` *(private)* | `dto: CreateTransactionDto` | `User` | Résout client cible (B2C ou B2B2C) |

**Flux interne `purchaseEsim()` :**
1. `resolveClient()` — identifie le client final
2. `TransactionService.createInitial()` — crée transaction PENDING
3. `FundingService.execute()` — sélectionne GATEWAY ou WALLET
4. Si GATEWAY → retourne `paymentUrl` (continue côté frontend)
5. Si WALLET → `EsimProducer.enqueuePurchase()` immédiatement

### 10.2 Classe : `EsimTopupOrchestrator`

| Opération | Paramètres | Retour | Description |
|---|---|---|---|
| `topupEsim()` | `esimId: number`, `dto: EsimTopupDto`, `userId: number` | `TopupResponseDto` | Initie recharge données eSIM |
| `handlePaidTopup()` | `transactionId: number`, `userId: number` | `void` | Continue après paiement confirmé |
| `isTopupPayment()` | `rawResponse: unknown` | `boolean` | Détecte si un paiement est un topup |
| `getTopupOffers()` | `esimId: number`, `userId: number` | `Offer[]` | Offres recharge disponibles |
| `executeTopupNow()` *(private)* | `params: {...}` | `void` | Appel provider + mise à jour eSIM |
| `attachTopupContext()` *(private)* | `transactionId`, `context` | `void` | Stocke contexte topup dans rawResponse |
| `readTopupContext()` *(private)* | `rawResponse: unknown` | `TopupContext \| null` | Extrait contexte stocké |

### 10.3 Classe : `TopUpOrchestrator`

| Opération | Paramètres | Retour | Description |
|---|---|---|---|
| `transition()` | `topUpRequestId: number`, `target: TopUpStatus`, `triggeredBy: string` | `void` | State machine TopUpRequest |
| `initiateTopUp()` | `dto: CreateTopUpDto`, `salesmanId: number` | `TopUpResponseDto` | Crée TopUpRequest + flux paiement |
| `confirmCash()` | `topUpRequestId: number`, `zoneChiefId: number` | `void` | Valide paiement espèces + crédite wallet |
| `handleGatewayConfirmed()` | `gatewayPaymentId: string` | `void` | Callback paiement carte réussi |
| `handleGatewayFailed()` | `gatewayPaymentId: string`, `reason: string` | `void` | Callback paiement carte échoué |

---

## 11. QUEUE / PRODUCERS

### 11.1 Classe : `EsimProducer`
**Queue :** `ESIM_QUEUE`

| Opération | Paramètres | Retour | Description |
|---|---|---|---|
| `enqueuePurchase()` | `data: PurchaseJobData` | `Job` | Enfile job `JOB_PURCHASE_ESIM` |
| `enqueueActivation()` | `data: ActivateJobData` | `Job` | Enfile job `JOB_ACTIVATE_ESIM` |
| `enqueueTopup()` | `data: EsimTopupJobData` | `Job` | Enfile job `JOB_TOPUP_ESIM` |

**Types de jobs :**
```
PurchaseJobData   : { transactionId, userId, offerId, channel, salesmanId? }
ActivateJobData   : { esimId, transactionId, userId }
EsimTopupJobData  : { esimId, transactionId, userId, iccid, offerId }
```

### 11.2 Classe : `WalletProducer`
**Queue :** `WALLET_QUEUE`

| Opération | Paramètres | Retour | Description |
|---|---|---|---|
| `enqueueDebit()` | `data: WalletDebitJobData` | `Job` | Enfile job `JOB_WALLET_DEBIT` |
| `enqueueTopUpCredit()` | `data: TopUpJobData` | `Job` | Enfile job `JOB_TOPUP_CREDIT` |

---

## 12. PROCESSORS (WORKERS)

### 12.1 Classe : `EsimProcessor extends WorkerHost`

| Opération | Paramètres | Retour | Description |
|---|---|---|---|
| `process()` | `job: Job` | `any` | Dispatch selon `job.name` |
| `onCompleted()` | `job: Job` | `void` | **@OnWorkerEvent('completed')** — log succès |
| `onFailed()` | `job: Job`, `err: Error` | `void` | **@OnWorkerEvent('failed')** — log échec, audit |

**Jobs traités par `process()` :**
- `JOB_PURCHASE_ESIM` → appel `PurchaseService.execute()`
- `JOB_ACTIVATE_ESIM` → appel `ActivationService.execute()`
- `JOB_TOPUP_ESIM` → appel `EsimTopupOrchestrator.executeTopupNow()`

**Config BullMQ :**
```
attempts: 5
backoff: exponential, delay: 5000ms
timeout: 30000ms par tentative
removeOnComplete: true
removeOnFail: false
```

---

## 13. SERVICES TRANSVERSES

### 13.1 Classe : `AuditLogService`

| Opération | Paramètres | Retour | Description |
|---|---|---|---|
| `log()` | `data: { layer, event, userId?, transactionId?, trigger, fromStatus?, toStatus?, durationMs?, details?, ... }` | `AuditLog` | Insère entrée audit (calcule durée auto) |
| `logtx()` | `tx: Prisma.TransactionClient`, `data: {...}` | `AuditLog` | Audit dans transaction Prisma |
| `triggerNotification()` *(private)* | `data: {...}` | `void` | Envoie notification si événement critique |
| `getNotificationContext()` *(private)* | `userId`, `details?` | `NotificationContext` | Récupère contexte pour notification |

### 13.2 Classe : `NotificationService`

**Templates :** `welcome` | `payment_confirmed` | `activation_success` | `activation_failed` | `activation_retrying` | `topup_success` | `support_received`

| Opération | Paramètres | Retour | Description |
|---|---|---|---|
| `send()` | `userId: number`, `payload: { title, body }` | `void` | Envoie push + email |
| `notifyUser()` | `userId: number`, `template: NotificationTemplate`, `data?: TemplateData` | `void` | Notification depuis template |
| `sendPushOnly()` | `userId: number`, `title: string`, `body: string` | `void` | Push uniquement (Expo) |
| `sendEmail()` *(private)* | `to`, `subject`, `htmlBody`, `textBody` | `void` | Email via Postmark |
| `sendPush()` *(private)* | `pushToken`, `title`, `body` | `void` | Push Expo |
| `buildTemplate()` *(private)* | `template`, `data: TemplateData` | `EmailPayload` | Construit HTML/texte email |

### 13.3 Classe : `SupportService`

| Opération | Paramètres | Retour | Description |
|---|---|---|---|
| `submitTicket()` | `dto: CreateSupportTicketDto`, `userId: number` | `SupportTicket` | Crée ticket support |

---

## 14. GUARDS COMMUNS

### 14.1 Classe : `IdempotencyGuard implements CanActivate`

| Opération | Paramètres | Retour | Description |
|---|---|---|---|
| `canActivate()` | `context: ExecutionContext` | `boolean` | Vérifie/enregistre clé Redis NX EX 30s |
| `generateKey()` *(private)* | `userId`, `offerId`, `amount`, `channel`, `esimId?` | `string` | `sha256(userId+offerId+amount+channel+window)` |

**Comportement :**
- Clé Redis non existante → SET "PENDING" NX EX 30 → laisse passer
- Clé = "PENDING" → lève `409 Conflict`
- Clé = JSON résultat → retourne résultat en cache
- Après traitement → stocke résultat en Redis 30s

### 14.2 Classe : `JwtAuthGuard extends AuthGuard('jwt')`
- Valide Bearer token JWT HS256
- Injecte `req.user = { sub: userId, email, role }`

### 14.3 Classe : `RolesGuard implements CanActivate`
- Lit décorateur `@Roles(...roles)`
- Compare `req.user.role` aux rôles autorisés

---

## 15. RELATIONS INTER-MODULES

```
                          ┌─────────────────────────────────────────────────────┐
                          │            EsimPurchaseOrchestrator                 │
                          │  purchaseEsim(dto, salesmanId)                      │
                          │   ├─ TransactionService.createInitial()             │
                          │   ├─ FundingService.execute(GATEWAY | WALLET)       │
                          │   │   ├─ PaymentService.initiatePayment()   [B2C]   │
                          │   │   └─ WalletService.ReserveAmount()      [B2B2C] │
                          │   └─ EsimProducer.enqueuePurchase()         [B2B2C] │
                          └────────────────────┬────────────────────────────────┘
                                               │
                          ┌────────────────────▼──────────────────────────────┐
                          │              EsimProcessor (Worker)               │
                          │   JOB_PURCHASE_ESIM → PurchaseService             │
                          │   JOB_ACTIVATE_ESIM → ActivationService          │
                          │   JOB_TOPUP_ESIM    → EsimTopupOrchestrator      │
                          └───────────────────────────────────────────────────┘

ÉTAT TRANSACTION :
  PENDING ──► PENDING_PAYMENT ──► PAID ──► PROVISIONING ──► COMPLETED
     │                │                                         │
     └──► PROCESSING ─┘                                    FAILED / REFUNDED

ÉTAT ESIM :
  PENDING ──► PROCESSING ──► NOT_ACTIVE ──► ACTIVE ──► EXPIRED
                  │                                       │
                  └──► FAILED ◄────────────── DELETED ◄──┘

ÉTAT WALLET :
  RESERVED ──► COMMITTED (succès)
       └──────► RELEASED  (échec/compensation)

ÉTAT TOPUP REQUEST :
  PENDING ──► PENDING_PAYMENT ──► CREDITED
     │     └──► PENDING_CASH  ──► APPROVED ──► CREDITED
     └──────────────────────────────────────── REJECTED / FAILED
```

---

## RÉCAPITULATIF DES CLASSES PAR COUCHE

| Couche | Classes |
|--------|---------|
| **Entités (DB)** | User, Offer, Transaction, Esim, Payment, WalletTransaction, WalletLedger, TopUpRequest, ActivationAttempt, AuditLog, Provider, Usage |
| **Controllers** | AuthController, UserController, EsimController, OfferController, TransactionController, PaymentController, WalletController, TopUpController |
| **Services** | AuthService, UserService, EsimService, OfferService, TransactionService, PaymentService, ClicToPayService, FundingService, ReconciliationService, WalletService, TopUpService, AuditLogService, NotificationService, SupportService |
| **Repositories** | EsimRepository, TransactionRepository, PaymentRepository, WalletRepository |
| **Orchestrateurs** | EsimPurchaseOrchestrator, EsimTopupOrchestrator, TopUpOrchestrator |
| **Producers** | EsimProducer, WalletProducer |
| **Workers** | EsimProcessor |
| **Guards** | JwtAuthGuard, RolesGuard, IdempotencyGuard |
| **Adapters** | ProviderAdapter (interface), MockProviderAdapter |
| **Enums** | UserStatus, Role, TransactionStatus, TransactionType, TransactionChannel, CoverageType, EsimStatus, WalletStatus, LedgerType, LedgerReason, TopUpStatus, ActivationAttemptStatus, AuditLayer, AuditTrigger |
