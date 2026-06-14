# NetyFly eSIM Platform — Getting Started

> Author: Behij Gharbi  
> Stack: NestJS (backend) + React Native Expo (frontend)

---

## Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| Node.js | v18+ | |
| npm | v9+ | |
| Docker | Latest | Required for Redis |
| PostgreSQL | v14+ | Local install or cloud (e.g. Neon) |
| Expo Go | Latest | Install on your phone for mobile testing |
| Android Studio | Latest | For Android emulator (optional) |

---

## Project Structure

```
PFE/
├── esim-backend/       NestJS API (port 3000)
├── esim-mobile/        React Native (Expo) app
├── Docs/               Architecture and API documentation
└── GETTING_STARTED.md  This file
```

---

## Backend Setup (`esim-backend/`)

### 1. Install dependencies

```bash
cd esim-backend
npm install
```

### 2. Configure environment variables

Create a `.env` file in `esim-backend/` with the following keys:

```env
# Server
PORT=3000

# Database (PostgreSQL)
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/netyfly

# JWT
JWT_SECRET=your_jwt_secret_here
JWT_REFRESH_SECRET=your_jwt_refresh_secret_here

# Redis (used for BullMQ job queue and idempotency)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_TLS=false

# eSIM Provider
PROVIDER_TYPE=mock
PROVIDER_API_KEY=
PROVIDER_API_URL=

# ClicToPay Payment Gateway
CLICTOPAY_USERNAME=your_username
CLICTOPAY_PASSWORD=your_password
CLICTOPAY_BASE_URL=https://test.clictopay.com/payment/rest
CLICTOPAY_SUCCESS_URL=http://localhost:3000/payment/redirect/success
CLICTOPAY_FAIL_URL=http://localhost:3000/payment/redirect/fail
CLICTOPAY_WEBHOOK_URL=http://localhost:3000/payment/webhook
APP_URL=http://localhost:3000

# Mail (Postmark)
POSTMARK_SERVER_TOKEN=

# TLS (set to 0 for local dev)
NODE_TLS_REJECT_UNAUTHORIZED=0
```

> **Note:** `PROVIDER_TYPE=mock` uses the built-in mock provider — no real eSIM credentials needed for development.

### 3. Start Redis (via Docker)

```bash
cd esim-backend
docker compose up -d
```

This starts a Redis instance on port `6379`.

### 4. Run database migrations

```bash
npx prisma migrate dev
```

### 5. Seed the database (providers, offers, test users)

```bash
npx prisma db seed
```

### 6. Start the backend

```bash
# Development (watch mode)
npm run start:dev

# Production
npm run build
npm run start:prod
```

The API will be available at **http://localhost:3000**

### Useful URLs (once running)

| URL | Description |
|-----|-------------|
| http://localhost:3000/api/docs | Swagger / OpenAPI documentation |
| http://localhost:3000/queues | BullMQ job queue dashboard |

---

## Frontend Setup (`esim-mobile/`)

### 1. Install dependencies

```bash
cd esim-mobile
npm install
```

### 2. Configure environment variables

Create a `.env` file in `esim-mobile/` with:

```env
# Point to your backend
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_WS_URL=http://localhost:3000
```

> **Android emulator note:** Replace `localhost` with `10.0.2.2` when running on an Android emulator:
> ```env
> EXPO_PUBLIC_API_URL=http://10.0.2.2:3000
> EXPO_PUBLIC_WS_URL=http://10.0.2.2:3000
> ```

### 3. Start the Expo development server

```bash
npm start
```

Then:
- Press **`a`** to open on Android emulator
- Press **`i`** to open on iOS simulator
- Scan the QR code with the **Expo Go** app on a physical device

---

## Test Users (after seeding)

The seed script creates the following test accounts:

| Role | Email | Password |
|------|-------|----------|
| Customer | `client@netyfly.com` | `password123` |
| Salesman (Reseller) | `salesman@netyfly.com` | `password123` |
| Zone Chief | `zonechief@netyfly.com` | `password123` |
| Admin | `admin@netyfly.com` | `password123` |

> Check `esim-backend/prisma/seed.ts` for the exact credentials seeded.

---

## Common Issues

**Redis connection error**  
Make sure Docker is running and `docker compose up -d` was executed inside `esim-backend/`.

**Database connection error**  
Verify `DATABASE_URL` in `.env` points to a running PostgreSQL instance and migrations have been applied.

**Expo "Network request failed"**  
Check that `EXPO_PUBLIC_API_URL` matches the machine IP accessible from the emulator/device. Use `10.0.2.2` for Android emulator, or your local network IP (e.g. `192.168.x.x`) for physical devices.

**Prisma client not generated**  
Run `npx prisma generate` before `npm run start:dev`.
