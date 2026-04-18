# B2C API Contract (Strict)

This document is the source of truth for the current frontend-backend sync.

## Scope
- Included now: B2C only.
- Deferred: all B2B2C wallet/topup flows.

## Auth Contract

### Login (`POST /auth/login`)
Request:
```json
{
  "email": "user@example.com",
  "password": "secret"
}
```

Success response:
```json
{
  "access_token": "...",
  "refresh_token": "...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "firstname": "Jane",
    "lastname": "Doe",
    "role": "CLIENT",
    "balance": 0
  }
}
```

### Refresh (`POST /auth/refresh`)
Request:
```json
{
  "refreshToken": "..."
}
```

Success response:
```json
{
  "access_token": "...",
  "refresh_token": "..."
}
```

## Offer Contract

### Popular offers (`GET /offers/popular`)
### Search offers (`GET /offers/search?q=...`)
### Offer detail (`GET /offers/:id`)
### Destinations (`GET /offers/destinations`)

Offer payload fields consumed by frontend:
```json
{
  "id": 1,
  "country": "France",
  "Region": "Europe",
  "Destination": "France",
  "dataVolume": 10240,
  "validityDays": 30,
  "price": 1200,
  "createdAt": "2026-01-01T00:00:00.000Z",
  "updatedAt": "2026-01-01T00:00:00.000Z"
}
```

## Purchase Contract (B2C)

### Create purchase (`POST /transaction/purchase`)
Auth required: `Bearer <access_token>`

Request:
```json
{
  "offerId": 1,
  "paymentMethod": "card"
}
```

Success response:
```json
{
  "transactionId": 42,
  "status": "PENDING",
  "message": "SUCCESS"
}
```

Failure response:
```json
{
  "transactionId": 42,
  "status": "FAILED",
  "message": "QUEUE_FAILED",
  "error": "..."
}
```

Message values:
- `SUCCESS`
- `PAYMENT_FAILED`
- `QUEUE_FAILED`

## Transaction Contract

### My transactions (`GET /transaction`)
Auth required.

Success response:
```json
{
  "transactions": [
    {
      "id": 42,
      "status": "PENDING",
      "channel": "B2C",
      "amount": 1200,
      "currency": "TND",
      "userId": 1,
      "offerId": 1,
      "createdAt": "2026-01-01T00:00:00.000Z",
      "updatedAt": "2026-01-01T00:00:00.000Z",
      "esims": []
    }
  ]
}
```

### Transaction detail (`GET /transaction/:id`)
Auth required.

Success response:
```json
{
  "transaction": {
    "id": 42,
    "status": "PROCESSING",
    "channel": "B2C",
    "amount": 1200,
    "currency": "TND",
    "userId": 1,
    "offerId": 1,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-01-01T00:00:00.000Z"
  },
  "esims": [
    {
      "id": 10,
      "status": "ACTIVE",
      "qrCode": "..."
    }
  ]
}
```

## Status Enums Used By Frontend
- Transaction: `PENDING`, `PROCESSING`, `SUCCEEDED`, `FAILED`
- eSIM: `NOT_ACTIVE`, `ACTIVE`, `EXPIRED`, `DELETED`

## Deferred B2B2C Items
- `POST /wallet/topup/request`
- `GET /wallet/history`
- `GET /wallet/topup/pending`
- `POST /wallet/topup/approve`
- `POST /wallet/topup/reject`
