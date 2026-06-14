# NetyFly eSIM — Diagrammes UML
> Format : Mermaid (rendu dans VS Code, GitHub, Notion…)  
> Auteur : Behij Gharbi | 2026-05-23

---

## TABLE DES MATIÈRES
1. [Diagramme de Classes — Domaine (Entités Prisma)](#1-diagramme-de-classes--domaine)
2. [Diagramme de Classes — Couche BCE](#2-diagramme-de-classes--couche-bce)
3. [Séquence BCE — Achat eSIM B2C (paiement carte)](#3-séquence-bce--achat-esim-b2c)
4. [Séquence BCE — Achat eSIM B2B2C (wallet revendeur)](#4-séquence-bce--achat-esim-b2b2c)
5. [Séquence BCE — Recharge Wallet (Top-Up revendeur)](#5-séquence-bce--recharge-wallet)
6. [Séquence BCE — Recharge Données eSIM (Topup eSIM)](#6-séquence-bce--recharge-données-esim)
7. [Séquence BCE — Authentification (Login + Refresh)](#7-séquence-bce--authentification)
8. [Séquence BCE — Réconciliation Paiements (Scheduler)](#8-séquence-bce--réconciliation)

---

## 1. Diagramme de Classes — Domaine

```mermaid
classDiagram

  %% ─── ENUMS ────────────────────────────────────────────────
  class Role {\chapter{Identification de l'environnement}

% ─────────────────────────────────────────────────────────────────────────────
\section*{Introduction}
\addcontentsline{toc}{section}{Introduction}
% ─────────────────────────────────────────────────────────────────────────────

Ce chapitre présente l'environnement dans lequel la plateforme NetyFly a été
conçue et développée. Il identifie les acteurs du système et leurs interactions
à travers les diagrammes de cas d'utilisation et de classes, puis expose les
choix technologiques retenus en justifiant chaque décision par des critères
techniques précis.

% ─────────────────────────────────────────────────────────────────────────────
\section{Environnement applicatif}
% ─────────────────────────────────────────────────────────────────────────────

\subsection{Acteurs du système}

La plateforme NetyFly implique deux acteurs principaux, chacun disposant d'un
espace dédié avec des fonctionnalités adaptées à son profil~:

\begin{itemize}
  \item \textbf{Client (B2C)~:} voyageur tunisien interagissant directement
    avec l'application mobile. Il peut s'inscrire, parcourir le catalogue
    d'offres eSIM, sélectionner une destination, effectuer un paiement via
    ClicToPay, activer son eSIM par QR code, suivre sa consommation en temps
    réel et recharger son forfait.
  \item \textbf{Vendeur (B2B)~:} commercial appartenant au réseau de
    distribution Nety. Il accède à un portail dédié via des identifiants
    fournis par l'entreprise. Il peut vendre des eSIM à des clients en
    présentiel, activer l'eSIM pour leur compte, gérer son portefeuille,
    recharger son solde et consulter l'historique de ses transactions.
\end{itemize}

\subsection{Diagramme de cas d'utilisation global}

Le diagramme de cas d'utilisation global illustre l'ensemble des interactions
entre les deux acteurs du système et la plateforme NetyFly. Il met en évidence
la séparation claire entre l'espace client et l'espace vendeur, ainsi que les
dépendances entre les cas d'utilisation via les relations d'inclusion.

\begin{figure}[H]
  \centering
  \includegraphics[width=0.75\textwidth]{chapters/images/usecase (2).png}
  \caption{Diagramme de cas d'utilisation global de NetyFly}
  \label{fig:use_case_global}
\end{figure}

Le parcours client suit une séquence logique~: la sélection de la destination
inclut le choix du pack, qui inclut à son tour le paiement, lequel déclenche
automatiquement l'activation de l'eSIM. Du côté vendeur, la vente d'une eSIM
inclut systématiquement son activation pour le client ainsi que la gestion
du portefeuille associé.

\subsection{Diagramme de classes global}

Le diagramme de classes global représente la structure des données de la
plateforme NetyFly, telle qu'elle est définie dans le schéma Prisma. Il
illustre les entités principales, leurs attributs et les relations qui les
unissent.

\begin{figure}[H]
  \centering
  \includegraphics[width=\textwidth]{chapters/images/DigClass.png}
  \caption{Diagramme de classes global de NetyFly}
  \label{fig:class_diagram}
\end{figure}

L'entité \textbf{User} est au centre du modèle~: elle est liée aux
transactions, aux eSIM activées, au portefeuille et aux logs d'audit.
L'\textbf{Offer} représente les packs eSIM disponibles dans le catalogue.
La \textbf{Transaction} orchestre le flux d'achat en reliant l'offre choisie
au paiement et à l'eSIM générée. Le \textbf{Wallet} et les
\textbf{WalletTransaction} supportent le modèle B2B avec un système de
comptabilité en double entrée. L'\textbf{AuditLog} assure la traçabilité
complète des opérations de la plateforme.

% ─────────────────────────────────────────────────────────────────────────────
\section{Environnement technique}
% ─────────────────────────────────────────────────────────────────────────────

\subsection{Choix technologiques}

Les technologies retenues pour le développement de NetyFly ont été
sélectionnées sur la base de critères techniques précis~: cohérence de
l'écosystème, adéquation aux contraintes métier et maîtrise de l'équipe.
Le tableau suivant présente chaque choix technologique en regard des
alternatives écartées et justifie la décision adoptée.

\begin{table}[H]
  \centering
  \caption{Tableau comparatif des choix technologiques}
  \label{tab:techstack}
  \renewcommand{\arraystretch}{1.4}
  \begin{tabularx}{\textwidth}{
    |>{\columncolor{rowlightblue}\bfseries\raggedright\arraybackslash}p{2.8cm}
    |>{\raggedright\arraybackslash}p{2.2cm}
    |>{\raggedright\arraybackslash}p{2.8cm}
    |X|}
    \hline
    \rowcolor{headerblue}
    \color{white}\textbf{Technologie} &
    \color{white}\textbf{Retenue} &
    \color{white}\textbf{Alternatives} &
    \color{white}\textbf{Justification} \\
    \hline
    Backend framework &
    NestJS &
    Express, Fastify &
    NestJS fournit une architecture modulaire avec injection de dépendances
    native et un support TypeScript cohérent entre les couches applicatives. \\
    \hline
    Frontend mobile &
    React Native Expo &
    Flutter, Ionic &
    Expo simplifie le développement cross-platform et s'intègre naturellement
    avec l'écosystème React et TypeScript déjà maîtrisé. \\
    \hline
    Base de données &
    PostgreSQL &
    MongoDB, MySQL &
    PostgreSQL garantit les propriétés ACID nécessaires aux transactions
    financières et à la cohérence des données. \\
    \hline
    Cache \& Queue &
    Redis &
    Memcached, RabbitMQ &
    Redis permet la gestion des clés d'idempotence ainsi que la persistance
    des jobs BullMQ. \\
    \hline
    File de messages &
    BullMQ &
    Kafka, RabbitMQ &
    BullMQ s'intègre nativement avec NestJS et fournit retry, backoff
    exponentiel et gestion des échecs. \\
    \hline
    ORM &
    Prisma &
    TypeORM, Sequelize &
    Prisma génère automatiquement les types TypeScript depuis le schéma de
    données et simplifie les migrations. \\
    \hline
    Temps réel &
    Socket.IO &
    WebSocket natif, SSE &
    Socket.IO facilite la communication temps réel avec reconnexion automatique
    et compatibilité multiplateforme. \\
    \hline
    Paiement &
    ClicToPay &
    Stripe, PayPal &
    ClicToPay permet le paiement en dinar tunisien, indispensable pour
    le marché local tunisien. \\
    \hline
  \end{tabularx}
\end{table}

% ─────────────────────────────────────────────────────────────────────────────
\section*{Conclusion}
\addcontentsline{toc}{section}{Conclusion}
% ─────────────────────────────────────────────────────────────────────────────

Ce chapitre a présenté l'environnement complet de la plateforme NetyFly.
Les acteurs du système ont été identifiés et leurs interactions modélisées
à travers les diagrammes de cas d'utilisation et de classes. Les choix
technologiques ont été justifiés par des critères techniques précis, en
cohérence avec les contraintes métier du projet. Le chapitre suivant présente
le premier sprint de développement, couvrant l'authentification et le
catalogue d'offres eSIM.
    <<enumeration>>
    ADMIN
    ZONE_CHIEF
    CLIENT
    SALESMAN
  }

  class TransactionStatus {
    <<enumeration>>
    PENDING
    PENDING_PAYMENT
    PROCESSING
    PAID
    PROVISIONING
    COMPLETED
    FAILED
    REFUNDED
    EXPIRED
  }

  class EsimStatus {
    <<enumeration>>
    NOT_ACTIVE
    ACTIVE
    PROCESSING
    PENDING
    FAILED
    EXPIRED
    DELETED
  }

  class WalletStatus {
    <<enumeration>>
    RESERVED
    COMMITTED
    RELEASED
  }

  class TopUpStatus {
    <<enumeration>>
    PENDING
    PENDING_PAYMENT
    PENDING_CASH
    APPROVED
    CREDITED
    REJECTED
    FAILED
  }

  class CoverageType {
    <<enumeration>>
    LOCAL
    REGIONAL
    GLOBAL
  }

  %% ─── ENTITÉS ──────────────────────────────────────────────
  class User {
    +Int id
    +String firstname
    +String lastname
    +String email
    +String hashedPassword
    +String? hashedRefreshToken
    +Float balance
    +UserStatus status
    +Role role
    +String? phone
    +String? pushToken
    +Boolean isDeleted
    +DateTime createdAt
    +DateTime updatedAt
  }

  class Offer {
    +Int id
    +String country
    +String countryCode
    +String Region
    +String Destination
    +String Category
    +String title
    +String? description
    +Int popularity
    +CoverageType coverageType
    +String networkType
    +Int dataVolume
    +Int validityDays
    +Float price
    +Float InternalMargin
    +Int providerId
    +Boolean isDeleted
    +DateTime createdAt
  }

  class Transaction {
    +String id
    +TransactionStatus status
    +TransactionType type
    +TransactionChannel channel
    +Float amount
    +String currency
    +Int userId
    +Int offerId
    +DateTime createdAt
    +DateTime updatedAt
  }

  class Esim {
    +String id
    +String iccid
    +String activationCode
    +EsimStatus status
    +String? qrCode
    +Int? dataTotal
    +Int? dataUsed
    +DateTime? lastUsageSync
    +DateTime? expiryDate
    +Int userId
    +String transactionId
    +Int offerId
    +Int providerId
    +DateTime? activatedAt
    +DateTime createdAt
  }

  class Payment {
    +String id
    +String paymentProvider
    +String gatewayPaymentId
    +Float amount
    +TransactionStatus status
    +Json? rawResponse
    +String? paymentUrl
    +Int userId
    +String transactionId
    +DateTime createdAt
  }

  class WalletTransaction {
    +String id
    +Float amount
    +Float balanceAfter
    +String paymentMethod
    +WalletStatus status
    +Int userId
    +String? transactionId
    +DateTime createdAt
  }

  class WalletLedger {
    +String id
    +Float amount
    +LedgerType type
    +LedgerReason reason
    +String referenceId
    +String walletId
    +DateTime createdAt
  }

  class TopUpRequest {
    +Int id
    +Float amount
    +String currency
    +String paymentMethod
    +TopUpStatus status
    +String? gatewayPaymentId
    +String? paymentUrl
    +String? failureReason
    +Int salesmanId
    +Int? reviewedBy
    +DateTime createdAt
  }

  class ActivationAttempt {
    +String id
    +Int attemptNumber
    +ActivationAttemptStatus status
    +String providerRequestId
    +Json providerResponse
    +String? errorCode
    +String? errorMessage
    +DateTime startedAt
    +DateTime? completedAt
    +String esimId
  }

  class AuditLog {
    +String id
    +AuditLayer layer
    +SystemEvent event
    +Int? userId
    +String? transactionId
    +AuditTrigger trigger
    +String? fromStatus
    +String? toStatus
    +Int? durationMs
    +Int? providerLatencyMs
    +Json? details
    +DateTime createdAt
  }

  class Provider {
    +Int id
    +String name
    +String? apiUrl
    +String? apiKey
    +DateTime createdAt
  }

  class Usage {
    +String id
    +Int remainingData
    +DateTime recordedAt
    +String esimId
  }

  %% ─── RELATIONS ────────────────────────────────────────────
  User "1" --> "0..*" Transaction : crée
  User "1" --> "0..*" Esim : possède
  User "1" --> "0..*" Payment : initie
  User "1" --> "0..*" WalletTransaction : détient
  User "1" --> "0..*" TopUpRequest : demande (salesman)

  Offer "1" --> "0..*" Transaction : est acheté via
  Offer "1" --> "0..*" Esim : est associé à
  Offer "1" --> "1" Provider : fourni par

  Transaction "1" --> "0..1" Esim : provisionne
  Transaction "1" --> "0..1" Payment : est payé via
  Transaction "1" --> "0..1" WalletTransaction : débite
  Transaction "1" --> "0..*" AuditLog : journalise

  Esim "1" --> "0..*" ActivationAttempt : tente activation
  Esim "1" --> "0..*" Usage : enregistre usage
  Esim "1" --> "1" Provider : géré par

  WalletTransaction "1" --> "0..*" WalletLedger : contient entrées
```

---

## 2. Diagramme de Classes — Couche BCE

```mermaid
classDiagram

  %% ─── BOUNDARY (Contrôleurs) ───────────────────────────────
  class AuthController {
    <<Boundary>>
    +login(dto, res) Response
    +signup(dto, res) Response
    +getMe(req) UserProfileDto
    +logout(req, res) void
    +refresh(req, body, res) Response
  }

  class TransactionController {
    <<Boundary>>
    +purchaseB2C(dto, req) TransactionResponseDto
    +getMine(req) Transaction[]
    +getById(req, id) TransactionDetailDto
    +requestRefund(req, id) void
  }

  class PaymentController {
    <<Boundary>>
    +create(dto, transactionId, req) PaymentResponseDto
    +verifyPayment(transactionId, req) VerifyResultDto
    +verifyAndProcess(dto) StatusDto
    +redirectSuccess(orderId) Redirect
    +redirectFail(orderId) Redirect
  }

  class EsimController {
    <<Boundary>>
    +getDestinations() DestinationDto[]
    +getUserEsims(req) EsimListResponseDto
    +getEsimById(id, req) EsimResponseDto
    +syncUsage(id) void
    +initiateTopup(id, dto, req) TopupResponseDto
    +deleteEsim(id, req) MessageDto
  }

  class WalletController {
    <<Boundary>>
    +getBalance(req) BalanceDto
    +getWalletHistory(req, page, limit) WalletHistoryDto
    +requestTopUp(req, dto) TopUpResponseDto
    +getPendingTopUps(page, limit) TopUpRequest[]
    +approveTopUp(req, dto) void
    +rejectTopUp(req, dto) void
  }

  class TopUpController {
    <<Boundary>>
    +initiateTopUp(dto, req) TopUpResponseDto
    +confirmCash(topUpRequestId, req) void
  }

  class OfferController {
    <<Boundary>>
    +create(dto) Offer
    +findAll(country, region, coverageType) Offer[]
    +findPopular() Offer[]
    +search(q) Offer[]
    +findDestinations() DestinationDto[]
    +findbyId(id) Offer
  }

  class UserController {
    <<Boundary>>
    +create(dto) UserDto
    +getProfile(req) ProfileResponseDto
    +updateProfile(dto, req) ProfileResponseDto
    +changePassword(dto, req) MessageDto
    +updatePushToken(body, req) void
  }

  %% ─── CONTROL (Services & Orchestrateurs) ─────────────────
  class EsimPurchaseOrchestrator {
    <<Control>>
    +purchaseEsim(dto, salesmanId) TransactionResponseDto
    -resolveClient(dto) User
  }

  class EsimTopupOrchestrator {
    <<Control>>
    +topupEsim(esimId, dto, userId) TopupResponseDto
    +handlePaidTopup(transactionId, userId) void
    +isTopupPayment(rawResponse) boolean
    +getTopupOffers(esimId, userId) Offer[]
    -executeTopupNow(params) void
  }

  class TopUpOrchestrator {
    <<Control>>
    +initiateTopUp(dto, salesmanId) TopUpResponseDto
    +confirmCash(topUpRequestId, zoneChiefId) void
    +handleGatewayConfirmed(gatewayPaymentId) void
    +handleGatewayFailed(gatewayPaymentId, reason) void
    +transition(topUpRequestId, target, triggeredBy) void
  }

  class FundingService {
    <<Control>>
    +execute(source, dto, transactionId, userId, salesmanId) FundingResult
    +releaseWalletFunds(transactionId) void
    -fundViaGateway(...) FundingResult
    -fundViaWallet(...) FundingResult
  }

  class TransactionService {
    <<Control>>
    +createInitial(dto, userId) Transaction
    +transition(id, next, source, correlationId) Transaction
    +requestRefund(transactionId, userId) void
    +findOne(transactionId) Transaction
    +getUserTransactions(userId) Transaction[]
    +getTransactionDetail(userId, transactionId) TransactionDetailDto
    -assertValidTransition(current, next) void
  }

  class PaymentService {
    <<Control>>
    +initiatePayment(transaction) PaymentInitDto
    +verifyPayment(transactionId) VerifyResultDto
    +verifyAndProcess(orderId) StatusDto
    -mapVerificationResult(result, transactionId) VerifyResultDto
  }

  class WalletService {
    <<Control>>
    +ReserveAmount(userId, transactionId, amount, paymentMethod) WalletTransaction
    +releaseReservedFunds(transactionId) void
    +commitReservedFunds(transactionId) void
    +getBalance(userId) BalanceDto
    +getWalletHistory(userId, page, limit) WalletHistoryDto
    +approveTopUp(topUpId, zonechiefId) void
    +rejectTopUp(topUpId, zonechiefId) void
  }

  class EsimService {
    <<Control>>
    +getUserEsims(userId) EsimListResponseDto
    +getEsimById(userId, esimId) EsimResponseDto
    +syncUsage(esimId) void
    +markActive(id) Esim
    +markFailed(id) Esim
    +requestActivation(esimId, params) Esim
    +markActivationSuccess(esimId, params) Esim
    +markActivationFailure(esimId, params) Esim
    +deleteEsim(userId, esimId) MessageDto
  }

  class ReconciliationService {
    <<Control>>
    +reconcileStalePayments() void
    +notifyUpcomingExpiry() void
    -expireAbandonedTransactions() void
  }

  class AuditLogService {
    <<Control>>
    +log(data) AuditLog
    +logtx(tx, data) AuditLog
    -triggerNotification(data) void
  }

  class NotificationService {
    <<Control>>
    +notifyUser(userId, template, data) void
    +sendPushOnly(userId, title, body) void
    -sendEmail(to, subject, html, text) void
    -sendPush(pushToken, title, body) void
  }

  class EsimProducer {
    <<Control>>
    +enqueuePurchase(data) Job
    +enqueueActivation(data) Job
    +enqueueTopup(data) Job
  }

  class EsimProcessor {
    <<Control>>
    +process(job) any
    +onCompleted(job) void
    +onFailed(job, err) void
  }

  %% ─── ENTITY (Repositories) ────────────────────────────────
  class TransactionRepository {
    <<Entity>>
    +createInitial(data) Transaction
    +updateStatus(id, status) Transaction
    +findOne(id) Transaction
    +findManyForUser(userId) Transaction[]
    +findWithRelations(id) Transaction
    +applyRefundStatuses(paymentId, transactionId, esimId) void
  }

  class EsimRepository {
    <<Entity>>
    +create(data) Esim
    +findById(id) Esim
    +updateStatus(id, status) Esim
    +findByUserId(userId) Esim[]
    +updateUsage(id, dataUsed) Esim
    +softDelete(id) Esim
    +aggregateDestinationsByCountryAndCoverageType() DestinationAggr[]
  }

  class PaymentRepository {
    <<Entity>>
    +initiatePayment(transaction) PaymentInitDto
    +checkPaymentStatus(gatewayOrderId) StatusDto
    +reversePayment(gatewayOrderId) boolean
    +findByGatewayPaymentId(id) Payment
    +findStalePayments(olderThanMs) Payment[]
  }

  class WalletRepository {
    <<Entity>>
    +ReserveAmount(userId, transactionId, amount, paymentMethod) WalletTransaction
    +commitReservedFunds(transactionId) void
    +releaseReservedFunds(transactionId) void
    +getBalance(userId) Float
    +approveTopUp(topUpId, adminId) void
  }

  class ClicToPayService {
    <<Entity>>
    +registerOrder(params) ClicToPayRegisterResponse
    +getOrderStatus(orderId) ClicToPayOrderStatus
    +reverseOrder(orderId) ClicToPayErrorResponse
    +refundOrder(orderId, amount) ClicToPayErrorResponse
  }

  %% ─── RELATIONS BCE ────────────────────────────────────────
  TransactionController --> EsimPurchaseOrchestrator : purchaseB2C
  TransactionController --> TransactionService : getMine / getById

  EsimPurchaseOrchestrator --> TransactionService : createInitial / transition
  EsimPurchaseOrchestrator --> FundingService : execute
  EsimPurchaseOrchestrator --> EsimProducer : enqueuePurchase

  FundingService --> PaymentService : fundViaGateway
  FundingService --> WalletService : fundViaWallet

  PaymentController --> PaymentService : verify / verifyAndProcess
  PaymentService --> PaymentRepository : initiatePayment / checkStatus
  PaymentRepository --> ClicToPayService : registerOrder / getOrderStatus

  EsimController --> EsimService : CRUD + sync
  EsimProcessor --> EsimService : markActive / markFailed
  EsimProcessor --> AuditLogService : log

  WalletController --> WalletService : balance / history / topup
  WalletService --> WalletRepository : CRUD ledger

  ReconciliationService --> PaymentRepository : findStalePayments
  ReconciliationService --> TransactionService : transition
  ReconciliationService --> NotificationService : notifyUser

  AuditLogService --> NotificationService : triggerNotification
```

---

## 3. Séquence BCE — Achat eSIM B2C

> **Acteur :** Client (CUSTOMER)  
> **Scénario :** Achat carte via ClicToPay → provisioning eSIM asynchrone

```mermaid
sequenceDiagram
  actor Client
  participant TC  as TransactionController<<Boundary>>
  participant PC  as PaymentController<<Boundary>>
  participant EPA as EsimPurchaseOrchestrator<<Control>>
  participant TS  as TransactionService<<Control>>
  participant FS  as FundingService<<Control>>
  participant PS  as PaymentService<<Control>>
  participant PR  as PaymentRepository<<Entity>>
  participant CTP as ClicToPayService<<Entity>>
  participant TR  as TransactionRepository<<Entity>>
  participant EP  as EsimProducer<<Control>>
  participant WK  as EsimProcessor<<Control>>
  participant ES  as EsimService<<Control>>
  participant NS  as NotificationService<<Control>>
  participant AL  as AuditLogService<<Control>>

  Note over Client,TC: ① INITIATION TRANSACTION
  Client->>TC: POST /transaction/purchase {offerId, channel:B2C}
  TC->>EPA: purchaseEsim(dto, userId)
  EPA->>TS: createInitial(dto, userId)
  TS->>TR: createInitial({status:PENDING, channel:B2C})
  TR-->>TS: Transaction{id, status:PENDING}
  TS-->>EPA: Transaction

  Note over EPA,CTP: ② FINANCEMENT GATEWAY
  EPA->>FS: execute(GATEWAY, dto, transactionId, userId)
  FS->>PS: initiatePayment(transaction)
  PS->>PR: initiatePayment(transaction)
  PR->>CTP: registerOrder({amount, returnUrl, failUrl})
  CTP-->>PR: {orderId, formUrl}
  PR-->>PS: {gatewayOrderId, paymentUrl}
  PS-->>FS: {gatewayOrderId, paymentUrl}

  TS->>TR: updateStatus(id, PENDING_PAYMENT)
  AL->>AL: log(PAYMENT, PAYMENT_INITIATED, PENDING→PENDING_PAYMENT)
  FS-->>EPA: FundingResult{paymentUrl}
  EPA-->>TC: {transactionId, status:PENDING_PAYMENT, paymentUrl}
  TC-->>Client: 201 {transactionId, paymentUrl}

  Note over Client,PC: ③ PAIEMENT (WebView)
  Client->>Client: Ouvre WebView(paymentUrl)
  Client->>CTP: [Saisie données carte]
  CTP-->>Client: Redirect /payment/redirect/success?orderId=xxx

  Note over Client,PC: ④ VÉRIFICATION PAIEMENT
  Client->>PC: GET /payment/verify?transactionId=xxx
  PC->>PS: verifyPayment(transactionId)
  PS->>PR: checkPaymentStatus(gatewayOrderId)
  PR->>CTP: getOrderStatus(orderId)
  CTP-->>PR: {actionCode:0, status:DEPOSITED}
  PR-->>PS: {status:PAID}
  PS->>TS: transition(transactionId, PAID)
  TS->>TR: updateStatus(id, PAID)
  AL->>AL: log(PAYMENT, PAYMENT_CONFIRMED, PENDING_PAYMENT→PAID)

  Note over PS,WK: ⑤ ENQUEUE PROVISIONING
  PS->>EP: enqueuePurchase({transactionId, userId, offerId})
  EP-->>PS: Job enfilé
  PS-->>PC: {status:PAID, transactionId}
  PC-->>Client: 200 {status:PROCESSING}

  Note over WK,NS: ⑥ WORKER — PROVISIONING ESIM
  WK->>WK: process(JOB_PURCHASE_ESIM)
  WK->>TS: transition(transactionId, PROVISIONING)
  WK->>ES: create(dto, userId, transactionId, providerId)
  ES->>ES: providerAdapter.createEsim(dto)
  ES-->>WK: Esim{iccid, activationCode}
  WK->>TS: transition(transactionId, COMPLETED)
  AL->>AL: log(PROVISIONING, PROVISIONING_SUCCESS, PROVISIONING→COMPLETED)

  Note over WK,NS: ⑦ NOTIFICATION
  WK->>NS: notifyUser(userId, 'activation_success', {iccid})
  NS->>NS: sendPush(pushToken, "eSIM prête", "...")
  NS->>NS: sendEmail(email, "Votre eSIM", html)
  WK-->>Client: [push notification reçue]
```

---

## 4. Séquence BCE — Achat eSIM B2B2C

> **Acteur :** Revendeur (SALESMAN)  
> **Scénario :** Vente eSIM à un client via débit wallet → provisioning immédiat

```mermaid
sequenceDiagram
  actor Revendeur
  participant TC  as TransactionController<<Boundary>>
  participant EPA as EsimPurchaseOrchestrator<<Control>>
  participant TS  as TransactionService<<Control>>
  participant FS  as FundingService<<Control>>
  participant WS  as WalletService<<Control>>
  participant WR  as WalletRepository<<Entity>>
  participant TR  as TransactionRepository<<Entity>>
  participant EP  as EsimProducer<<Control>>
  participant WK  as EsimProcessor<<Control>>
  participant ES  as EsimService<<Control>>
  participant AL  as AuditLogService<<Control>>
  participant NS  as NotificationService<<Control>>

  Note over Revendeur,TC: ① INITIATION B2B2C
  Revendeur->>TC: POST /transaction/purchase {offerId, channel:B2B2C, clientPhone?, paymentMethod:WALLET}
  TC->>EPA: purchaseEsim(dto, salesmanId)
  EPA->>EPA: resolveClient(dto)
  Note right of EPA: Identifie le client final (par téléphone ou crée guest)

  EPA->>TS: createInitial(dto, clientId)
  TS->>TR: createInitial({status:PENDING, channel:B2B2C})
  TR-->>TS: Transaction
  TS-->>EPA: Transaction

  Note over EPA,WR: ② RÉSERVATION WALLET
  EPA->>FS: execute(WALLET, dto, transactionId, clientId, salesmanId)
  FS->>WS: ReserveAmount(salesmanId, transactionId, amount, "WALLET")
  WS->>WR: ReserveAmount(...)
  Note right of WR: prisma.$transaction():\n  INSERT WalletTransaction{status:RESERVED}\n  INSERT WalletLedger{DEBIT/RESERVE}\n  UPDATE User.balance -= amount
  WR-->>WS: WalletTransaction{status:RESERVED}
  WS-->>FS: WalletTransaction

  TS->>TR: updateStatus(transactionId, PROCESSING)
  AL->>AL: log(WALLET, WALLET_RESERVED, PENDING→PROCESSING)
  FS-->>EPA: FundingResult{status:PROCESSING}

  Note over EPA,EP: ③ ENQUEUE PROVISIONING IMMÉDIAT
  EPA->>EP: enqueuePurchase({transactionId, userId:clientId, salesmanId})
  EP-->>EPA: Job enfilé
  EPA-->>TC: {transactionId, status:PROCESSING}
  TC-->>Revendeur: 201 {transactionId, status:PROCESSING}

  Note over WK,WR: ④ WORKER — PROVISIONING + COMMIT WALLET
  WK->>WK: process(JOB_PURCHASE_ESIM)
  WK->>TS: transition(transactionId, PROVISIONING)
  WK->>ES: create(dto, clientId, transactionId, providerId)
  ES->>ES: providerAdapter.createEsim(dto)
  ES-->>WK: Esim{iccid, activationCode}

  WK->>WS: commitReservedFunds(transactionId)
  WS->>WR: commitReservedFunds(transactionId)
  Note right of WR: UPDATE WalletTransaction{status:COMMITTED}\n  INSERT WalletLedger{DEBIT/COMMIT}
  WR-->>WS: ok

  WK->>TS: transition(transactionId, COMPLETED)
  AL->>AL: log(PROVISIONING, PROVISIONING_SUCCESS)
  AL->>AL: log(WALLET, WALLET_COMMITTED)

  Note over WK,NS: ⑤ NOTIFICATION CLIENT + REVENDEUR
  WK->>NS: notifyUser(clientId, 'activation_success', {iccid})
  WK->>NS: notifyUser(salesmanId, 'payment_confirmed', {amount})

  Note over WK,WR: ⑥ CAS D'ÉCHEC — COMPENSATION WALLET
  Note right of WK: Si providerAdapter.createEsim() lève une erreur
  WK--xWK: RetryableError (max 5 tentatives)
  WK->>FS: releaseWalletFunds(transactionId)
  FS->>WS: releaseReservedFunds(transactionId)
  WS->>WR: releaseReservedFunds(transactionId)
  Note right of WR: UPDATE WalletTransaction{status:RELEASED}\n  INSERT WalletLedger{CREDIT/RELEASE}\n  UPDATE User.balance += amount
  WK->>TS: transition(transactionId, FAILED)
  AL->>AL: log(PROVISIONING, PROVISIONING_FAILED)
```

---

## 5. Séquence BCE — Recharge Wallet (Top-Up Revendeur)

> **Acteur :** Revendeur (SALESMAN), Zone Chief (ZONE_CHIEF)  
> **Scénario :** Recharge par carte (CARD) via ClicToPay

```mermaid
sequenceDiagram
  actor Revendeur
  actor ZoneChief
  participant TUC as TopUpController<<Boundary>>
  participant WC  as WalletController<<Boundary>>
  participant TUS as TopUpService<<Control>>
  participant TUO as TopUpOrchestrator<<Control>>
  participant CTP as ClicToPayService<<Entity>>
  participant WS  as WalletService<<Control>>
  participant WR  as WalletRepository<<Entity>>
  participant RC  as ReconciliationService<<Control>>
  participant AL  as AuditLogService<<Control>>
  participant NS  as NotificationService<<Control>>

  Note over Revendeur,TUC: ① DEMANDE DE RECHARGE
  Revendeur->>TUC: POST /top-up {amount, currency, paymentMethod:CARD}
  TUC->>TUS: initiateTopUp(dto, salesmanId)
  TUS->>TUO: initiateTopUp(dto, salesmanId)

  Note over TUO,CTP: ② CRÉATION + PAIEMENT GATEWAY
  TUO->>TUO: INSERT TopUpRequest{status:PENDING}
  TUO->>CTP: registerOrder({amount, returnUrl})
  CTP-->>TUO: {orderId, formUrl}
  TUO->>TUO: UPDATE TopUpRequest{status:PENDING_PAYMENT, gatewayPaymentId, paymentUrl}
  AL->>AL: log(TOP_UP, TOPUP_INITIATED)
  TUO-->>TUS: TopUpResponseDto{paymentUrl}
  TUS-->>TUC: TopUpResponseDto
  TUC-->>Revendeur: 201 {paymentUrl}

  Note over Revendeur,CTP: ③ PAIEMENT (WebView)
  Revendeur->>Revendeur: Ouvre WebView(paymentUrl)
  Revendeur->>CTP: [Saisie carte]
  CTP-->>Revendeur: Redirect /payment/redirect/success?orderId=xxx

  Note over RC,WR: ④ CONFIRMATION GATEWAY (Reconciliation ou Callback)
  RC->>RC: @Cron every 5min reconcileStalePayments()
  RC->>CTP: getOrderStatus(orderId)
  CTP-->>RC: {status:DEPOSITED}
  RC->>TUO: handleGatewayConfirmed(gatewayPaymentId)
  TUO->>TUO: transition(topUpRequestId, APPROVED)

  Note over TUO,WR: ⑤ CRÉDIT WALLET
  TUO->>TUO: transition(topUpRequestId, CREDITED)
  TUO->>WS: logLedger(walletId, amount, CREDIT, TOP_UP, topUpId)
  WS->>WR: INSERT WalletLedger{CREDIT/TOP_UP}
  WR->>WR: UPDATE User.balance += amount
  AL->>AL: log(WALLET, WALLET_CREDITED)

  Note over TUO,NS: ⑥ NOTIFICATION
  TUO->>NS: notifyUser(salesmanId, 'topup_success', {amount})
  NS-->>Revendeur: [push + email reçus]

  Note over Revendeur,WC: ⑦ VÉRIFICATION SOLDE (optionnel)
  Revendeur->>WC: GET /wallet/balance
  WC->>WS: getBalance(salesmanId)
  WS->>WR: SELECT User.balance
  WR-->>WS: {balance: xxx}
  WS-->>WC: {balance}
  WC-->>Revendeur: 200 {balance}

  Note over Revendeur,WC: ⑧ CAS PAIEMENT ESPÈCES (CASH)
  Note right of Revendeur: Revendeur paie en espèces au Zone Chief
  Revendeur->>TUC: POST /top-up {amount, paymentMethod:CASH}
  TUC->>TUO: initiateTopUp(dto, salesmanId)
  TUO->>TUO: INSERT TopUpRequest{status:PENDING_CASH}
  TUO-->>Revendeur: {status:PENDING_CASH}

  ZoneChief->>WC: GET /wallet/topup/pending
  WC-->>ZoneChief: [TopUpRequest{status:PENDING_CASH}]
  ZoneChief->>TUC: PATCH /top-up/:id/confirm-cash
  TUC->>TUS: confirmCash(topUpRequestId, zoneChiefId)
  TUS->>TUO: confirmCash(topUpRequestId, zoneChiefId)
  TUO->>TUO: transition(PENDING_CASH → APPROVED → CREDITED)
  TUO->>WR: UPDATE User.balance += amount
  AL->>AL: log(TOP_UP, TOPUP_CASH_CONFIRMED)
  TUO->>NS: notifyUser(salesmanId, 'topup_success', {amount})
```

---

## 6. Séquence BCE — Recharge Données eSIM (Topup eSIM)

> **Acteur :** Client (CUSTOMER) ou Revendeur (SALESMAN)  
> **Scénario :** Ajout de données sur un eSIM existant (B2C carte)

```mermaid
sequenceDiagram
  actor Client
  participant EC  as EsimController<<Boundary>>
  participant PC  as PaymentController<<Boundary>>
  participant ETO as EsimTopupOrchestrator<<Control>>
  participant TS  as TransactionService<<Control>>
  participant FS  as FundingService<<Control>>
  participant PS  as PaymentService<<Control>>
  participant PR  as PaymentRepository<<Entity>>
  participant CTP as ClicToPayService<<Entity>>
  participant ES  as EsimService<<Control>>
  participant PA  as ProviderAdapter<<Entity>>
  participant AL  as AuditLogService<<Control>>
  participant NS  as NotificationService<<Control>>

  Note over Client,EC: ① CONSULTATION OFFRES RECHARGE
  Client->>EC: GET /esims/:id/topup (via TopUpController)
  EC->>ETO: getTopupOffers(esimId, userId)
  ETO->>ETO: Vérifie ownership + statut ACTIVE
  ETO-->>EC: Offer[] (compatibles avec eSIM)
  EC-->>Client: 200 [offres recharge]

  Note over Client,EC: ② INITIATION TOPUP
  Client->>EC: POST /esims/:id/topup {offerId, paymentMethod:CARD}
  EC->>ETO: topupEsim(esimId, dto, userId)
  ETO->>TS: createInitial({type:TOPUP, offerId, userId})
  TS-->>ETO: Transaction{id, status:PENDING}

  Note over ETO,CTP: ③ PAIEMENT GATEWAY
  ETO->>FS: execute(GATEWAY, dto, transactionId, userId)
  FS->>PS: initiatePayment(transaction)
  PS->>PR: initiatePayment(transaction)
  PR->>CTP: registerOrder({amount, returnUrl})
  CTP-->>PR: {orderId, formUrl}
  PR-->>PS: {gatewayOrderId, paymentUrl}
  PS-->>FS: FundingResult{paymentUrl}

  ETO->>ETO: attachTopupContext(transactionId, {esimId, iccid, offerId})
  TS->>TS: transition(transactionId, PENDING_PAYMENT)
  AL->>AL: log(PAYMENT, PAYMENT_INITIATED)
  ETO-->>EC: {transactionId, paymentUrl}
  EC-->>Client: 201 {paymentUrl}

  Note over Client,CTP: ④ PAIEMENT (WebView)
  Client->>CTP: [Saisie carte]
  CTP-->>Client: Redirect success

  Note over Client,PC: ⑤ VÉRIFICATION + EXÉCUTION TOPUP
  Client->>PC: GET /payment/verify?transactionId=xxx
  PC->>PS: verifyPayment(transactionId)
  PS->>CTP: getOrderStatus(orderId)
  CTP-->>PS: {status:DEPOSITED}
  PS->>TS: transition(transactionId, PAID)

  PS->>ETO: handlePaidTopup(transactionId, userId)
  Note right of ETO: Lit contexte topup depuis rawResponse
  ETO->>ETO: readTopupContext(rawResponse)
  ETO->>ETO: executeTopupNow({esimId, iccid, offerId, transactionId})
  ETO->>PA: topupEsim(iccid, offerId)
  PA-->>ETO: {addedData: 1024, status:SUCCESS}

  Note over ETO,AL: ⑥ MISE À JOUR ESIM
  ETO->>ES: updateUsage(esimId, newDataTotal)
  ETO->>TS: transition(transactionId, COMPLETED)
  AL->>AL: log(PROVISIONING, TOPUP_SUCCESS)
  ETO->>NS: notifyUser(userId, 'topup_success', {addedData})
  NS-->>Client: [push: "1 Go ajouté à votre eSIM"]
  ETO-->>PC: {status:COMPLETED}
  PC-->>Client: 200 {status:COMPLETED}
```

---

## 7. Séquence BCE — Authentification

> **Acteur :** Utilisateur (CLIENT / SALESMAN)  
> **Scénarios :** Login, Logout, Refresh token

```mermaid
sequenceDiagram
  actor Utilisateur
  participant AC  as AuthController<<Boundary>>
  participant AS  as AuthService<<Control>>
  participant US  as UserService<<Control>>
  participant UR  as UserRepository<<Entity>>
  participant NS  as NotificationService<<Control>>

  Note over Utilisateur,AC: ① LOGIN
  Utilisateur->>AC: POST /auth/login {email, password}
  AC->>AS: login(dto)
  AS->>US: findByEmail(email)
  US->>UR: SELECT User WHERE email
  UR-->>US: User{hashedPassword, role, ...}
  US-->>AS: User
  AS->>AS: bcrypt.compare(password, hashedPassword)
  alt Mot de passe invalide
    AS-->>AC: UnauthorizedException 401
    AC-->>Utilisateur: 401 Unauthorized
  else Mot de passe valide
    AS->>AS: generateAndSaveTokens(user)
    AS->>AS: jwt.sign({sub, email, role}) → accessToken (15min)
    AS->>AS: jwt.sign({sub}) → refreshToken (30j)
    AS->>US: StoreHashedRefreshToken(userId, refreshToken)
    US->>UR: UPDATE User SET hashedRefreshToken
    AS->>US: updateStatus(userId, ONLINE)
    AS-->>AC: {accessToken, refreshToken, user}
    AC->>AC: res.cookie('refreshToken', ..., {httpOnly:true})
    AC-->>Utilisateur: 200 {accessToken, user}
  end

  Note over Utilisateur,AC: ② GET PROFIL (route protégée)
  Utilisateur->>AC: GET /auth/me [Authorization: Bearer accessToken]
  AC->>AC: JwtAuthGuard.validate(token)
  AC->>AS: getMe(userId)
  AS->>US: getProfile(userId)
  US->>UR: SELECT User WHERE id
  UR-->>US: User
  US-->>AS: ProfileResponseDto
  AS-->>AC: ProfileResponseDto
  AC-->>Utilisateur: 200 {user}

  Note over Utilisateur,AC: ③ REFRESH TOKEN
  Utilisateur->>AC: POST /auth/refresh [cookie: refreshToken]
  AC->>AS: refresh({refreshToken})
  AS->>AS: jwt.verify(refreshToken) → {sub: userId}
  AS->>US: validateRefreshToken(userId, refreshToken)
  US->>UR: SELECT User.hashedRefreshToken WHERE id
  UR-->>US: hashedRefreshToken
  US->>US: bcrypt.compare(refreshToken, hashedRefreshToken)
  alt Token invalide ou expiré
    AS-->>AC: ForbiddenException 403
    AC-->>Utilisateur: 403 Forbidden → force logout frontend
  else Token valide
    AS->>AS: generateAndSaveTokens(user) [rotation]
    AS-->>AC: {accessToken, refreshToken}
    AC->>AC: res.cookie('refreshToken', nouveau, {httpOnly:true})
    AC-->>Utilisateur: 200 {accessToken}
  end

  Note over Utilisateur,AC: ④ LOGOUT
  Utilisateur->>AC: POST /auth/logout [Authorization: Bearer accessToken]
  AC->>AS: logout(userId)
  AS->>US: removeRefreshToken(userId)
  US->>UR: UPDATE User SET hashedRefreshToken = null
  AS->>US: updateStatus(userId, OFFLINE)
  AC->>AC: res.clearCookie('refreshToken')
  AC-->>Utilisateur: 200 {message: "Déconnecté"}
```

---

## 8. Séquence BCE — Réconciliation Paiements

> **Acteur :** Système (Scheduler CRON)  
> **Scénario :** Vérification périodique des paiements bloqués et des eSIMs bientôt expirées

```mermaid
sequenceDiagram
  participant CRON as Scheduler<<Boundary>>
  participant RC  as ReconciliationService<<Control>>
  participant PR  as PaymentRepository<<Entity>>
  participant CTP as ClicToPayService<<Entity>>
  participant TS  as TransactionService<<Control>>
  participant EP  as EsimProducer<<Control>>
  participant TR  as TransactionRepository<<Entity>>
  participant AL  as AuditLogService<<Control>>
  participant NS  as NotificationService<<Control>>
  participant ER  as EsimRepository<<Entity>>

  Note over CRON,AL: ① RÉCONCILIATION PAIEMENTS BLOQUÉS (every 5 min)
  CRON->>RC: @Cron reconcileStalePayments()
  RC->>PR: findStalePayments(olderThanMs: 5*60*1000)
  PR-->>RC: Payment[] (status:PENDING, créés il y a +5min)

  loop Pour chaque paiement bloqué
    RC->>CTP: getOrderStatus(gatewayPaymentId)
    CTP-->>RC: {actionCode, status}

    alt actionCode = DEPOSITED (payé)
      RC->>TS: transition(transactionId, PAID)
      RC->>EP: enqueuePurchase({transactionId, userId, offerId})
      AL->>AL: log(PAYMENT, PAYMENT_CONFIRMED, trigger:SCHEDULER)

    else actionCode = DECLINED (refusé)
      RC->>PR: reversePayment(gatewayPaymentId)
      CTP-->>PR: OK
      RC->>TS: transition(transactionId, FAILED)
      AL->>AL: log(PAYMENT, PAYMENT_FAILED, trigger:SCHEDULER)
      RC->>NS: notifyUser(userId, 'activation_failed', ...)

    else actionCode = REGISTERED (toujours en attente)
      Note right of RC: Ignorer — réessayer au prochain cycle
    end
  end

  Note over CRON,TR: ② EXPIRATION TRANSACTIONS ABANDONNÉES
  RC->>RC: expireAbandonedTransactions()
  RC->>TR: findExpiredCandidates(expiryMs: 30*60*1000)
  TR-->>RC: Transaction[] (status:PENDING_PAYMENT, +30min)

  loop Pour chaque transaction abandonnée
    RC->>TS: transition(transactionId, EXPIRED)
    AL->>AL: log(PAYMENT, TRANSACTION_EXPIRED, trigger:SCHEDULER)
  end

  Note over CRON,NS: ③ NOTIFICATION EXPIRATION ESIM (8h quotidien)
  CRON->>RC: @Cron(EVERY_DAY_AT_8AM) notifyUpcomingExpiry()
  RC->>ER: findByStatus(ACTIVE) avec expiryDate dans 3 jours
  ER-->>RC: Esim[]

  loop Pour chaque eSIM bientôt expirée
    RC->>NS: notifyUser(userId, 'activation_retrying', {iccid, expiryDate})
    NS->>NS: sendPush(pushToken, "Votre eSIM expire bientôt", "...")
    NS->>NS: sendEmail(email, "Renouvelez votre eSIM", html)
  end
```

---

## MACHINES D'ÉTAT — Récapitulatif

### Transaction State Machine
```mermaid
stateDiagram-v2
  [*] --> PENDING : createInitial()

  PENDING --> PENDING_PAYMENT : B2C — paiement initié
  PENDING --> PROCESSING : B2B2C — wallet réservé

  PENDING_PAYMENT --> PAID : paiement confirmé (ClicToPay)
  PENDING_PAYMENT --> EXPIRED : abandon (+30 min)
  PENDING_PAYMENT --> FAILED : paiement refusé

  PAID --> PROVISIONING : job enfilé
  PROCESSING --> PROVISIONING : job enfilé

  PROVISIONING --> COMPLETED : eSIM créé OK
  PROVISIONING --> FAILED : erreur provider (max retries)

  COMPLETED --> REFUNDED : remboursement demandé
  FAILED --> [*]
  REFUNDED --> [*]
  EXPIRED --> [*]
```

### eSIM State Machine
```mermaid
stateDiagram-v2
  [*] --> PENDING : création initiale

  PENDING --> PROCESSING : requestActivation()
  PROCESSING --> NOT_ACTIVE : eSIM provisionné, non activé
  PROCESSING --> FAILED : échec provider

  NOT_ACTIVE --> ACTIVE : activation QR scan
  ACTIVE --> EXPIRED : expiryDate dépassée
  ACTIVE --> DELETED : soft-delete utilisateur

  FAILED --> PENDING : retry orchestrator
  EXPIRED --> DELETED : nettoyage
  DELETED --> [*]
```

### Wallet State Machine
```mermaid
stateDiagram-v2
  [*] --> RESERVED : ReserveAmount()

  RESERVED --> COMMITTED : commitReservedFunds() — succès provisioning
  RESERVED --> RELEASED : releaseReservedFunds() — échec provisioning

  COMMITTED --> [*]
  RELEASED --> [*]
```

### TopUpRequest State Machine
```mermaid
stateDiagram-v2
  [*] --> PENDING : initiateTopUp()

  PENDING --> PENDING_PAYMENT : CARD — gateway enregistré
  PENDING --> PENDING_CASH : CASH — en attente zone chief

  PENDING_PAYMENT --> APPROVED : paiement gateway confirmé
  PENDING_CASH --> APPROVED : zone chief confirme espèces

  APPROVED --> CREDITED : wallet crédité
  PENDING_PAYMENT --> FAILED : paiement refusé
  PENDING_CASH --> REJECTED : zone chief rejette

  CREDITED --> [*]
  FAILED --> [*]
  REJECTED --> [*]
```
