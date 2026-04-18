# NetyFly API Documentation

**Base URL:** `http://localhost:3000`  
**Interactive docs (dev only):** `http://localhost:3000/api/docs`

---

## Authentication

The API uses **JWT** with two tokens:

| Token | Transport | Lifetime |
|---|---|---|
| `access_token` | `Authorization: Bearer <token>` header | Short-lived |
| `refresh_token` | `refresh_token` HTTP-only cookie **or** request body | 30 days |

Endpoints marked 🔒 require a valid `access_token`.  
Endpoints marked 👑 additionally require a specific role.

---

## Amounts & Currency

All monetary amounts are in **minor units** (e.g. millimes for TND).  
`1800` = 1.800 TND. Divide by 1000 to display.

---

## Roles

| Role | Channel | Description |
|---|---|---|
| `ADMIN` | — | Platform administrator — manages salesmen, approves/rejects wallet top-up requests |
| `CLIENT` | B2C | Direct buyer — purchases eSIMs directly through the platform |
| `SALESMAN` | B2B2C | Reseller with a wallet — sells eSIMs to end customers |
| `CUSTOMER` | B2B2C | End customer — buys through a salesman |

---

## Endpoints

### Auth `/auth`

---

#### `POST /auth/signup`
Create a new user account.

**Request body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "firstname": "Amina",
  "lastname": "Diallo",
  "passportId": "P1234567"
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `email` | string | ✅ | Must be valid email |
| `password` | string | ✅ | Min 6 characters |
| `firstname` | string | ✅ | |
| `lastname` | string | ✅ | |
| `passportId` | string | ❌ | |

**Response `201`:**
```json
{
  "access_token": "eyJhbGci...",
  "refresh_token": "eyJhbGci...",
  "user": {
    "id": 42,
    "email": "user@example.com",
    "firstname": "Amina",
    "lastname": "Diallo",
    "role": "CLIENT",
    "balance": 0
  }
}
```

**Errors:** `409` Email already in use.

---

#### `POST /auth/login`
Login with email and password.

**Request body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response `200`:** Same shape as `/auth/signup`.

**Errors:** `401` Invalid credentials.

---

#### `GET /auth/me` 🔒
Get the currently authenticated user.

**Response `200`:**
```json
{
  "id": 42,
  "email": "user@example.com",
  "firstname": "Amina",
  "lastname": "Diallo",
  "role": "CUSTOMER",
  "balance": 12500
}
```

---

#### `POST /auth/logout` 🔒
Logout and clear the refresh token cookie.

**Response `201`:**
```json
{ "message": "Logged out successfully" }
```

---

#### `POST /auth/refresh`
Refresh the access token. Sends refresh token via cookie (set automatically on login) or request body.

**Request body (optional if cookie present):**
```json
{ "refreshToken": "eyJhbGci..." }
```

**Response `201`:**
```json
{
  "access_token": "eyJhbGci...",
  "refresh_token": "eyJhbGci..."
}
```

**Errors:** `401` Invalid or missing refresh token.

---

### Offers `/offers`

---

#### `GET /offers`
List all offers, or filter by country.

**Query params:**

| Param | Type | Required | Example |
|---|---|---|---|
| `country` | string | ❌ | `France` |

**Response `200`:** Array of offer objects (see offer shape below).

---

#### `GET /offers/popular`
List popular offers.

**Response `200`:** Array of offer objects.

---

#### `GET /offers/search`
Search offers by destination, region, title, or description.

**Query params:**

| Param | Type | Required | Example |
|---|---|---|---|
| `q` | string | ✅ | `France` |

**Response `200`:** Array of offer objects.

---

#### `GET /offers/destinations`
Get destination list with starting prices — useful for a country picker UI.

**Response `200`:**
```json
[
  {
    "country": "France",
    "Region": "Europe",
    "price": 1800
  }
]
```

---

#### `GET /offers/:id`
Get a single offer by ID.

**Response `200`:** Offer object (see below).

**Errors:** `404` Offer not found.

---

#### `POST /offers`
Create a new offer (admin).

**Request body:**
```json
{
  "country": "France",
  "Region": "Europe",
  "Destination": "Paris",
  "Category": "Tourism",
  "title": "France 5GB - 30 Days",
  "description": "Affordable eSIM package for short trips in France.",
  "popularity": "HIGH",
  "dataVolume": 5120,
  "validityDays": 30,
  "price": 1800,
  "InternalMargin": 250,
  "providerId": 3
}
```

**Response `201`:** Offer object.

---

#### Offer object shape

```json
{
  "id": 101,
  "country": "France",
  "Region": "Europe",
  "Destination": "Paris",
  "Category": "Tourism",
  "title": "France 5GB - 30 Days",
  "description": "Affordable eSIM package for short trips in France.",
  "popularity": "HIGH",
  "dataVolume": 5120,
  "validityDays": 30,
  "price": 1800,
  "InternalMargin": 250,
  "providerId": 3,
  "isDeleted": false,
  "createdAt": "2026-04-09T10:30:00.000Z",
  "updatedAt": "2026-04-09T10:30:00.000Z"
}
```

---

### eSIMs `/esims`

All eSIM endpoints require authentication 🔒.

---

#### `GET /esims` 🔒
Get all eSIMs for the authenticated user, grouped by status.

**Response `200`:**
```json
{
  "active": [ /* eSIM objects */ ],
  "expired": [ /* eSIM objects */ ]
}
```

---

#### `GET /esims/:id` 🔒
Get a single eSIM by ID (must belong to authenticated user).

**Response `200`:** eSIM object (see below).

**Errors:** `403` Not your eSIM. `404` Not found.

---

#### `POST /esims/:id/sync-usage` 🔒
Sync usage data from the eSIM provider.

**Response `201`:** Updated eSIM object.

**Errors:** `404` Not found.

---

#### `DELETE /esims/:id` 🔒
Soft-delete an eSIM (only if it has no remaining data).

**Response `200`:**
```json
{ "message": "eSIM deleted successfully" }
```

**Errors:** `400` Cannot delete active eSIM with remaining data. `403` Not your eSIM. `404` Not found.

---

#### eSIM object shape

```json
{
  "id": 77,
  "country": "France",
  "region": "Europe",
  "dataTotal": 5120,
  "dataUsed": 1200,
  "dataRemaining": 3920,
  "usagePercentage": 23,
  "status": "ACTIVE",
  "qrCode": "LPA:1$smdp.io$ACT-2026-ABC",
  "activatedAt": "2026-04-09T08:30:00.000Z",
  "expiresAt": "2026-05-09T08:30:00.000Z",
  "daysRemaining": 21,
  "createdAt": "2026-04-09T08:30:00.000Z"
}
```

| Field | Notes |
|---|---|
| `dataTotal` / `dataUsed` / `dataRemaining` | In MB |
| `usagePercentage` | 0–100 |
| `status` | `NOT_ACTIVE` \| `ACTIVE` |
| `qrCode` | LPA URI string, null until provisioned |
| `daysRemaining` | null if no expiry set |

---

### Transactions `/transaction`

---

#### `POST /transaction/purchase` 🔒
Purchase an eSIM offer (B2C flow).

**Request body:**
```json
{
  "offerId": 101,
  "paymentMethod": "WALLET"
}
```

| Field | Type | Values |
|---|---|---|
| `offerId` | number | ID from `/offers` |
| `paymentMethod` | string | `WALLET` \| `CASH` |

**Response `201`:**
```json
{
  "transactionId": 9001,
  "status": "PENDING",
  "message": "SUCCESS"
}
```

**Errors:** `400` Purchase failed. `401` Unauthorized. `404` Offer not found.

---

#### `GET /transaction` 🔒
Get all transactions for the authenticated user.

**Response `200`:**
```json
{
  "transactions": [
    {
      "id": 9001,
      "status": "SUCCEEDED",
      "channel": "B2C",
      "amount": 1800,
      "currency": "TND",
      "userId": 42,
      "offerId": 101,
      "createdAt": "2026-04-09T10:30:00.000Z",
      "updatedAt": "2026-04-09T10:35:00.000Z",
      "esims": [
        {
          "id": 77,
          "status": "ACTIVE",
          "qrCode": "LPA:1$smdp.io$ACT-2026-ABC"
        }
      ]
    }
  ]
}
```

---

#### `GET /transaction/:id` 🔒
Get detail of a single transaction.

**Response `200`:**
```json
{
  "transaction": {
    "id": 9001,
    "status": "SUCCEEDED",
    "channel": "B2C",
    "amount": 1800,
    "currency": "TND",
    "userId": 42,
    "offerId": 101,
    "createdAt": "2026-04-09T10:30:00.000Z",
    "updatedAt": "2026-04-09T10:35:00.000Z"
  },
  "esims": [
    {
      "id": 77,
      "status": "ACTIVE",
      "qrCode": "LPA:1$smdp.io$ACT-2026-ABC"
    }
  ]
}
```

**Errors:** `404` Transaction not found.

---

#### Transaction statuses

| Status | Meaning |
|---|---|
| `PENDING` | Created, payment not yet confirmed |
| `PROCESSING` | Payment confirmed, eSIM being provisioned |
| `SUCCEEDED` | eSIM provisioned and active |
| `FAILED` | Terminal failure, no retry |

---

### Wallet `/wallet`

All wallet endpoints require authentication 🔒. Role restrictions apply per route.

---

#### `GET /wallet/balance` 🔒 👑 SALESMAN
Get the authenticated salesman's wallet balance.

**Response `200`:**
```json
{
  "id": 42,
  "balance": 25000
}
```

---

#### `GET /wallet/history` 🔒 👑 SALESMAN
Get paginated wallet transaction history.

**Query params:**

| Param | Type | Default | Description |
|---|---|---|---|
| `page` | number | `1` | Page number |
| `limit` | number | `20` | Items per page |

**Response `200`:**
```json
{
  "data": [
    {
      "id": 71,
      "amount": 5000,
      "paymentMethod": "WALLET",
      "status": "COMMITTED",
      "balanceAfter": 20000,
      "createdAt": "2026-04-09T10:30:00.000Z",
      "ledgerEntries": [
        {
          "id": 11,
          "amount": 5000,
          "type": "DEBIT",
          "reason": "RESERVE",
          "referenceId": 9001,
          "createdAt": "2026-04-09T10:30:00.000Z"
        }
      ]
    }
  ],
  "total": 35,
  "page": 1,
  "limit": 20
}
```

---

#### `POST /wallet/topup/request` 🔒 👑 SALESMAN
Submit a wallet top-up request (pending admin approval).

**Request body:**
```json
{ "amount": 15000 }
```

| Field | Constraints |
|---|---|
| `amount` | Positive integer, min `1`, max `1000000` |

**Response `201`:**
```json
{
  "id": 25,
  "salesmanId": 42,
  "amount": 15000,
  "status": "PENDING",
  "reviewedBy": null,
  "createdAt": "2026-04-09T10:30:00.000Z",
  "updatedAt": "2026-04-09T10:30:00.000Z"
}
```

---

#### `GET /wallet/topup/history` 🔒 👑 SALESMAN
Get the authenticated salesman's top-up request history.

**Query params:** `page` (default `1`), `limit` (default `20`).

**Response `200`:**
```json
{
  "data": [ /* TopUpRequest objects */ ],
  "total": 12,
  "page": 1,
  "limit": 20
}
```

---

#### `GET /wallet/topup/pending` 🔒 👑 ADMIN
Get all pending top-up requests.

**Query params:** `page`, `limit`.

**Response `200`:**
```json
{
  "data": [
    {
      "id": 25,
      "salesmanId": 42,
      "amount": 15000,
      "status": "PENDING",
      "reviewedBy": null,
      "createdAt": "2026-04-09T10:30:00.000Z",
      "updatedAt": "2026-04-09T10:30:00.000Z",
      "salesman": {
        "id": 42,
        "email": "seller@example.com",
        "firstname": "Sami",
        "lastname": "Trabelsi"
      }
    }
  ],
  "total": 4,
  "page": 1,
  "limit": 20
}
```

---

#### `POST /wallet/topup/approve` 🔒 👑 ADMIN
Approve a pending top-up request. Credits the salesman's balance.

**Request body:**
```json
{ "topUpId": 25 }
```

**Response `200`:** Updated `TopUpRequest` object with `status: "APPROVED"`.

**Errors:** `404` Top-up request not found.

---

#### `POST /wallet/topup/reject` 🔒 👑 ADMIN
Reject a pending top-up request.

**Request body:**
```json
{ "topUpId": 25 }
```

**Response `200`:** Updated `TopUpRequest` object with `status: "REJECTED"`.

**Errors:** `404` Top-up request not found.

---

#### Wallet ledger reasons

| Reason | Type | Trigger |
|---|---|---|
| `RESERVE` | DEBIT | Salesman purchases an eSIM (balance held) |
| `COMMIT` | DEBIT | Purchase job succeeds (balance consumed) |
| `RELEASE` | CREDIT | Purchase job fails (balance refunded) |
| `TOP_UP` | CREDIT | Admin approves top-up request |

---

### User `/user`

---

#### `POST /user`
Create a user profile directly (admin / internal use).

**Request body:**
```json
{
  "email": "user@example.com",
  "firstname": "Amina",
  "lastname": "Diallo",
  "password": "password123",
  "passportId": "P1234567",
  "role": "CUSTOMER"
}
```

**Response `201`:** User object.

---

### Payment `/payment`

Internal endpoint used by the purchase flow. Not intended for direct frontend use.

#### `POST /payment`
Initiate payment for a transaction.

**Request body:**
```json
{
  "userId": 42,
  "amount": 1800
}
```

**Response `201`:**
```json
{
  "success": true,
  "paymentId": "pay_a1b2c3d4",
  "retryable": false
}
```

---

## Error Response Format

All error responses follow this shape:

```json
{
  "statusCode": 404,
  "message": "Offer not found",
  "error": "Not Found"
}
```

---

## B2C Purchase Flow (CLIENT role)

```
1. Client browses offers      GET /offers or GET /offers/search?q=...
2. Client selects offer       GET /offers/:id
3. Client initiates purchase  POST /transaction/purchase  { offerId, paymentMethod: "CASH" }
                              → returns { transactionId, status: "PENDING" }
4. Poll or navigate away      GET /transaction/:id  (check status)
                              → PENDING → PROCESSING → SUCCEEDED
5. On SUCCEEDED               GET /esims  (new eSIM appears in active list)
```

## B2B2C Flow (SALESMAN + CUSTOMER roles)

```
1. Salesman logs in           POST /auth/login  (role: SALESMAN)
2. Check balance              GET /wallet/balance
3. Sell eSIM to customer      POST /transaction/purchase  { offerId, paymentMethod: "WALLET" }
                              → deducted from salesman wallet, eSIM assigned to CUSTOMER
4. View wallet history        GET /wallet/history
5. Request top-up if low      POST /wallet/topup/request  { amount }
6. Admin approves top-up      POST /wallet/topup/approve  { topUpId }  (role: ADMIN)
                              → salesman balance credited
```
