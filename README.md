# Zorvyn — Finance Data Processing & Access Control Backend

A production-oriented REST API for financial transaction management with role-based access control, analytics dashboards, and layered security. Built with **Node.js**, **Express v5**, **TypeScript**, **Prisma v7**, and **PostgreSQL**.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Setup &amp; Installation](#setup--installation)
- [Environment Variables](#environment-variables)
- [Running the App](#running-the-app)
- [Docker &amp; Deployment (Render)](#docker--deployment-render)
- [Database](#database)
- [API Reference](#api-reference)
  - [Auth](#auth)
  - [Transactions](#transactions)
  - [Users](#users)
  - [Dashboard](#dashboard)
- [Authentication &amp; Authorization](#authentication--authorization)
- [Data Model](#data-model)
- [System Design](#system-design)
- [Coding Practices](#coding-practices)
- [Assumptions Made](#assumptions-made)
- [Tradeoffs Considered](#tradeoffs-considered)
- [Known Limitations &amp; Future Work](#known-limitations--future-work)

---

## Tech Stack

| Layer           | Technology                                   | Version |
| --------------- | -------------------------------------------- | ------- |
| Runtime         | Node.js                                      | ≥ 20   |
| Framework       | Express                                      | v5      |
| Language        | TypeScript                                   | v6      |
| ORM             | Prisma                                       | v7      |
| Database Driver | `@prisma/adapter-pg` + `pg`              | v7 / v8 |
| Database        | PostgreSQL                                   | ≥ 14   |
| Auth            | `jsonwebtoken` + `bcryptjs`              | —      |
| Validation      | Zod                                          | v4      |
| Security        | `helmet`, `cors`, `express-rate-limit` | —      |
| Dev Tooling     | `tsx`, `nodemon`, `ts-node`            | —      |

---

## Project Structure

```
zorvyn-finance-backend/
├── prisma.config.ts           # Prisma v7 config (schema path, migrations, seed)
├── tsconfig.json              # TypeScript compiler config
├── package.json
├── .env                       # Local environment variables (git-ignored)
├── .env.example               # Environment variable template
└── src/
    ├── server.ts              # HTTP server — binds Express app to a port
    ├── app.ts                 # Express app — middleware stack + route mounting
    ├── config/
    │   └── env.ts             # Zod-validated environment config (fail-fast at startup)
    ├── lib/
    │   └── prisma.ts          # Singleton Prisma client with pg adapter
    ├── middleware/
    │   ├── authenticate.ts    # JWT Bearer token verification → sets req.user
    │   ├── authorizeRole.ts   # RBAC role guard (allowedRoles[])
    │   ├── errorHandler.ts    # Global error handler (AppError-aware)
    │   └── validate.ts        # Zod middleware for body / query / params
    ├── modules/               # Feature modules (self-contained)
    │   ├── auth/              # Register, Login
    │   ├── transactions/      # CRUD for financial transactions
    │   ├── users/             # User management (Admin-only)
    │   └── dashboard/         # Aggregated analytics endpoints
    ├── prisma/
    │   ├── schema.prisma      # Database schema
    │   ├── migrations/        # Prisma migration history
    │   └── seed.ts            # Database seed script
    ├── types/
    │   ├── index.ts           # Shared TypeScript types & interfaces
    │   └── express.d.ts       # Express Request augmentation (req.user)
    └── utils/
        ├── AppError.ts        # Custom operational error class
        ├── apiResponse.ts     # Standardised success/error response builder
        ├── asyncHandler.ts    # Async route error forwarding wrapper
        ├── pagination.ts      # Reusable offset pagination helper
        └── rateLimiter.ts     # Global + auth-specific rate limiters
```

Each module follows the same internal structure:

```
modules/<domain>/
├── <domain>.router.ts      # Route definitions, middleware application
├── <domain>.service.ts     # Business logic, domain rules
├── <domain>.repository.ts  # Prisma queries, data access only
└── <domain>.schema.ts      # Zod validation schemas + inferred TS types
```

---

## Setup & Installation

### Prerequisites

- Node.js ≥ 20
- npm ≥ 10
- PostgreSQL ≥ 14 (local or hosted, e.g. Supabase, Neon, Railway)

### Steps

```bash
# 1. Clone the repository
git clone <repo-url>
cd zorvyn-Finance-Data-Processing-and-Access-Control-Backend

# 2. Install dependencies
npm install

# 3. Copy the environment template and fill in your values
cp .env.example .env

# 4. Generate Prisma Client
npx prisma generate

# 5. Run database migrations
npx prisma migrate dev

# 6. (Optional) Seed the database with test users and sample transactions
npx prisma db seed
```

---

## Environment Variables

Copy `.env.example` to `.env` and fill in all values. The app validates these at startup using Zod — a missing or malformed value will immediately throw a descriptive error before the server starts.

| Variable                  | Required | Description                                                                   |
| ------------------------- | -------- | ----------------------------------------------------------------------------- |
| `DATABASE_URL`          | ✅       | PostgreSQL connection string, e.g.`postgresql://user:pass@host:5432/dbname` |
| `JWT_SECRET`            | ✅       | Secret for signing JWTs.**Must be at least 32 characters.**             |
| `PORT`                  | ❌       | HTTP port. Defaults to `3000`.                                              |
| `NODE_ENV`              | ❌       | `development`, `production`, or `test`. Defaults to `development`.    |
| `SEED_ADMIN_PASSWORD`   | ❌       | Override default admin seed password. Defaults to `Admin1234!`              |
| `SEED_ANALYST_PASSWORD` | ❌       | Override default analyst seed password. Defaults to `Analyst1234!`          |
| `SEED_VIEWER_PASSWORD`  | ❌       | Override default viewer seed password. Defaults to `Viewer1234!`            |

**Generating a secure JWT secret:**

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**.env.example**

```env
DATABASE_URL="postgresql://user:password@localhost:5432/zorvyn"
JWT_SECRET="paste-your-generated-secret-here-minimum-32-chars"
NODE_ENV="development"
PORT=3000
```

---

## Running the App

```bash
# Development (hot reload with nodemon + tsx)
npm run dev

# Production build
npm run build
npm start

# Prisma utilities
npm run db:migrate     # Run pending migrations
npm run db:generate    # Regenerate Prisma Client after schema changes
npm run db:studio      # Open Prisma Studio (visual DB browser)

# Database seed
npx prisma db seed
```

The server starts at: `http://localhost:3000`

Health check: `GET http://localhost:3000/healthCheck` → `{ "message": "OK" }`

### Build &amp; run locally with Docker

```bash
# Build the image
docker build -t zorvyn-backend .

# Run with secrets passed inline (local testing only — do NOT script this with real values)
docker run --rm \
  -e DATABASE_URL="postgresql://user:pass@host:5432/zorvyn" \
  -e JWT_SECRET="your-secret-here" \
  -e NODE_ENV=production \
  -p 3000:3000 \
  zorvyn-backend
```

Health check: `GET http://localhost:3000/healthCheck`

> **Tip:** For local development, keep using `npm run dev` (hot reload). Docker is for staging/production validation only.

## Database

### Migrations

This project uses Prisma Migrate. The schema lives in `src/prisma/schema.prisma` and migrations in `src/prisma/migrations/`.

```bash
# Create and apply a new migration after editing schema.prisma
npx prisma migrate dev --name <migration-name>

# Apply migrations in production (no dev tooling)
npx prisma migrate deploy
```

### Seed

The seed script creates three users (one per role) and 20 sample transactions linked to the admin account:

| Email                  | Role    | Default Password |
| ---------------------- | ------- | ---------------- |
| `admin@zorvyn.com`   | ADMIN   | `Admin1234!`   |
| `analyst@zorvyn.com` | ANALYST | `Analyst1234!` |
| `viewer@zorvyn.com`  | VIEWER  | `Viewer1234!`  |

Override seed passwords via environment variables (`SEED_ADMIN_PASSWORD`, etc.) before running in CI or staging.

---

## API Reference

All API responses follow a consistent envelope:

**Success:**

```json
{
  "success": true,
  "message": "OK",
  "data": { }
}
```

**Error:**

```json
{
  "success": false,
  "error": {
    "message": "Human-readable error",
    "details": [
      { "field": "email", "message": "Invalid email address" }
    ]
  }
}
```

`details` is only present on validation errors (HTTP 400).

---

### Auth

Base path: `/api/auth`

Rate limit: **10 requests per 15 minutes** per IP.

#### `POST /api/auth/register`

Create a new user account.

**Request body:**

```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "SecurePass1",
  "role": "VIEWER"
}
```

| Field        | Type                                   | Rules                                 |
| ------------ | -------------------------------------- | ------------------------------------- |
| `name`     | string                                 | min 2 characters                      |
| `email`    | string                                 | valid email format                    |
| `password` | string                                 | min 8 chars, ≥1 uppercase, ≥1 digit |
| `role`     | `VIEWER` \| `ANALYST` \| `ADMIN` | optional, defaults to `VIEWER`      |

> ⚠️ **Security note:** The `role` field in the public register endpoint is a known issue. In a hardened setup, role assignment should be restricted to admins only.

**Response `201`:**

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": { "id": "...", "name": "Jane Doe", "email": "...", "role": "VIEWER", "isActive": true, "createdAt": "..." },
    "token": "<jwt>"
  }
}
```

---

#### `POST /api/auth/login`

Authenticate and receive a JWT.

**Request body:**

```json
{
  "email": "admin@zorvyn.com",
  "password": "Admin1234!"
}
```

**Response `200`:**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "<jwt>",
    "user": { "id": "...", "name": "Super Admin", "email": "...", "role": "ADMIN", "isActive": true }
  }
}
```

**Error cases:**

| Condition                 | HTTP Status |
| ------------------------- | ----------- |
| Invalid email or password | `401`     |
| Account is deactivated    | `403`     |

---

### Transactions

Base path: `/api/transactions`

All endpoints require a valid `Authorization: Bearer <token>` header.

#### `GET /api/transactions`

List transactions with optional filtering and pagination.

**Allowed roles:** VIEWER, ANALYST, ADMIN

> VIEWERs and ANALYSTs see only their own transactions. ADMINs see all.

**Query parameters:**

| Param              | Type                      | Description                                                  |
| ------------------ | ------------------------- | ------------------------------------------------------------ |
| `page`           | integer                   | Page number. Default:`1`                                   |
| `limit`          | integer                   | Items per page (1–100). Default:`20`                      |
| `type`           | `INCOME` \| `EXPENSE` | Filter by transaction type                                   |
| `category`       | string                    | Case-insensitive partial match on category                   |
| `from`           | ISO date string           | Filter transactions on or after this date                    |
| `to`             | ISO date string           | Filter transactions on or before this date                   |
| `includeDeleted` | boolean                   | Include soft-deleted records (ADMIN only, ignored otherwise) |

**Response `200`:**

```json
{
  "success": true,
  "message": "OK",
  "data": {
    "data": [
      {
        "id": "...",
        "amount": "3200.50",
        "type": "INCOME",
        "category": "salary",
        "date": "2024-01-15T00:00:00.000Z",
        "notes": "January salary",
        "isDeleted": false,
        "createdAt": "...",
        "updatedAt": "...",
        "userId": "...",
        "user": { "id": "...", "name": "Super Admin", "email": "admin@zorvyn.com" }
      }
    ],
    "meta": {
      "total": 42,
      "page": 1,
      "limit": 20,
      "totalPages": 3
    }
  }
}
```

---

#### `GET /api/transactions/:id`

Get a single transaction by ID.

**Allowed roles:** VIEWER, ANALYST, ADMIN

> Non-admins receive a `404` if the transaction exists but belongs to another user (avoids resource enumeration).

**Response `200`:** Single transaction object with `user` relation.

---

#### `POST /api/transactions`

Create a new transaction.

**Allowed roles:** ADMIN only

**Request body:**

```json
{
  "amount": 1500.00,
  "type": "INCOME",
  "category": "freelance",
  "date": "2024-06-01",
  "notes": "Website project"
}
```

| Field        | Type                      | Rules                        |
| ------------ | ------------------------- | ---------------------------- |
| `amount`   | number                    | > 0, max 2 decimal places    |
| `type`     | `INCOME` \| `EXPENSE` | required                     |
| `category` | string                    | 1–50 characters             |
| `date`     | date string               | any parseable date format    |
| `notes`    | string                    | optional, max 500 characters |

**Response `201`:** Created transaction object.

---

#### `PATCH /api/transactions/:id`

Update one or more fields of a transaction.

**Allowed roles:** ADMIN only

**Request body:** Any subset of `createTransaction` fields (all optional).

**Response `200`:** Updated transaction object.

---

#### `DELETE /api/transactions/:id`

Soft-delete a transaction (`isDeleted = true`). The record is retained in the database for audit purposes.

**Allowed roles:** ADMIN only

**Response `200`:**

```json
{ "success": true, "message": "Transaction deleted successfully", "data": null }
```

---

### Users

Base path: `/api/users`

All endpoints require a valid `Authorization: Bearer <token>` header.

#### `GET /api/users/me`

Get the currently authenticated user's profile.

**Allowed roles:** VIEWER, ANALYST, ADMIN

---

#### `GET /api/users`

List all users with optional filtering and pagination.

**Allowed roles:** ADMIN only

**Query parameters:**

| Param        | Type                                   | Description              |
| ------------ | -------------------------------------- | ------------------------ |
| `page`     | integer                                | Default:`1`            |
| `limit`    | integer                                | 1–100. Default:`20`   |
| `role`     | `VIEWER` \| `ANALYST` \| `ADMIN` | Filter by role           |
| `isActive` | boolean                                | Filter by account status |

**Response:** Paginated list. `passwordHash` is never returned.

---

#### `GET /api/users/:id`

Get a specific user by ID.

**Allowed roles:** ADMIN only

---

#### `POST /api/users`

Create a new user (admin-initiated, bypasses public registration).

**Allowed roles:** ADMIN only

**Request body:** Same fields as `/auth/register`.

---

#### `PATCH /api/users/:id`

Update a user's name, email, role, or active status.

**Allowed roles:** ADMIN only

> Admins cannot set `isActive: false` on their own account.

---

#### `DELETE /api/users/:id`

Soft-deactivate a user account (`isActive = false`). The user can no longer log in but their data is retained.

**Allowed roles:** ADMIN only

> An admin cannot deactivate their own account.

---

### Dashboard

Base path: `/api/dashboard`

All endpoints require a valid `Authorization: Bearer <token>` header.

#### `GET /api/dashboard/summary`

Global financial totals across all transactions.

**Allowed roles:** VIEWER, ANALYST, ADMIN

**Response `200`:**

```json
{
  "data": {
    "totalIncome": 58200.00,
    "totalExpenses": 32100.50,
    "netBalance": 26099.50,
    "transactionCount": 84
  }
}
```

---

#### `GET /api/dashboard/by-category`

Aggregated totals grouped by category and type, ordered by total amount descending.

**Allowed roles:** ANALYST, ADMIN

**Response `200`:**

```json
{
  "data": [
    { "category": "salary", "type": "INCOME", "total": 36000.00, "count": 12 },
    { "category": "rent",   "type": "EXPENSE", "total": 18000.00, "count": 12 }
  ]
}
```

---

#### `GET /api/dashboard/trends`

Income vs expenses grouped by time period (monthly or weekly).

**Allowed roles:** ANALYST, ADMIN

**Query parameters:**

| Param      | Type                      | Description                          |
| ---------- | ------------------------- | ------------------------------------ |
| `period` | `monthly` \| `weekly` | Grouping period. Default:`monthly` |
| `from`   | ISO date string           | Start of date range (optional)       |
| `to`     | ISO date string           | End of date range (optional)         |

**Response `200`:**

```json
{
  "data": [
    { "label": "2024-01", "income": 5200.00, "expenses": 2800.00, "net": 2400.00 },
    { "label": "2024-02", "income": 4800.00, "expenses": 3100.50, "net": 1699.50 }
  ]
}
```

Weekly label format: `"2024-W03"` (ISO week number).

---

#### `GET /api/dashboard/recent`

The most recent transactions across the system.

**Allowed roles:** VIEWER, ANALYST, ADMIN

**Query parameters:**

| Param     | Type    | Description                                    |
| --------- | ------- | ---------------------------------------------- |
| `limit` | integer | Number of transactions (1–50). Default:`10` |

---

## Authentication & Authorization

### JWT Flow

```
POST /api/auth/login
  → validates credentials
  → issues signed JWT (HS256, 24h expiry)

Subsequent requests:
  Authorization: Bearer <token>
  → authenticate middleware verifies signature + expiry
  → sets req.user = { userId, role }
  → authorizeRole middleware checks role against allowedRoles[]
```

### Role Permissions Matrix

| Endpoint                         | VIEWER | ANALYST | ADMIN |
| -------------------------------- | ------ | ------- | ----- |
| `POST /auth/register`          | ✅     | ✅      | ✅    |
| `POST /auth/login`             | ✅     | ✅      | ✅    |
| `GET /transactions` (own only) | ✅     | ✅      | —    |
| `GET /transactions` (all)      | —     | —      | ✅    |
| `POST /transactions`           | ❌     | ❌      | ✅    |
| `PATCH /transactions/:id`      | ❌     | ❌      | ✅    |
| `DELETE /transactions/:id`     | ❌     | ❌      | ✅    |
| `GET /users/me`                | ✅     | ✅      | ✅    |
| `GET /users` (admin list)      | ❌     | ❌      | ✅    |
| `POST /users`                  | ❌     | ❌      | ✅    |
| `PATCH/DELETE /users/:id`      | ❌     | ❌      | ✅    |
| `GET /dashboard/summary`       | ✅     | ✅      | ✅    |
| `GET /dashboard/recent`        | ✅     | ✅      | ✅    |
| `GET /dashboard/by-category`   | ❌     | ✅      | ✅    |
| `GET /dashboard/trends`        | ❌     | ✅      | ✅    |

### Rate Limiting

| Limiter           | Applies to           | Limit                            |
| ----------------- | -------------------- | -------------------------------- |
| `globalLimiter` | All routes           | 100 requests / 15 minutes per IP |
| `authLimiter`   | `/api/auth/*` only | 10 requests / 15 minutes per IP  |

Auth routes are subject to **both** limiters (stacked). Rate limit headers follow the IETF `RateLimit` draft-8 standard.

---

## Data Model

![Entity Relationship Diagram](docs/erd.png)

| Model       | Field            | Type                         | Notes                |
| ----------- | ---------------- | ---------------------------- | -------------------- |
| User        | `id`           | `String` PK                | cuid()               |
| User        | `email`        | `String`                   | UNIQUE               |
| User        | `passwordHash` | `String`                   | never exposed in API |
| User        | `role`         | `VIEWER \| ANALYST \| ADMIN` | —                   |
| User        | `isActive`     | `Boolean`                  | soft-delete flag     |
| Transaction | `id`           | `String` PK                | cuid()               |
| Transaction | `amount`       | `Decimal(12,2)`            | exact precision      |
| Transaction | `type`         | `INCOME \| EXPENSE`         | —                   |
| Transaction | `isDeleted`    | `Boolean`                  | soft-delete flag     |
| Transaction | `userId`       | `String` FK                | → User.id           |

**Indexes on `transactions`:** `date`, `type`, `category`, `userId`, `isDeleted`
These directly support the most common query patterns: filtering by date range, type, category, ownership, and excluding deleted records.

**Soft Deletes on both models:**

- Users: `isActive = false` (deactivation preserves history)
- Transactions: `isDeleted = true` (financial audit trail requirement)

**`amount` as `Decimal(12,2)`** — not a JavaScript float — eliminates floating-point precision errors in financial calculations.

---

## System Design

### Architecture Overview

![System Architecture](docs/system_architecture.png)

The application is structured as a layered Express app where every request passes through security middleware before reaching feature routers, which delegate to typed service and repository layers backed by Prisma + PostgreSQL.

### Request Lifecycle

![Request Lifecycle](docs/request_lifecycle.png)

Every authenticated request passes through the following pipeline (illustrated above for `POST /api/transactions`):

| Stage          | Middleware / Layer                     | Failure response           |
| -------------- | -------------------------------------- | -------------------------- |
| Rate limit     | `globalLimiter`                      | `429 Too Many Requests`  |
| Authentication | `authenticate.ts`                    | `401 Unauthorized`       |
| Authorization  | `authorizeRole(roles)`               | `403 Forbidden`          |
| Validation     | `validate({ body/query/params })`    | `400 Bad Request`        |
| Business logic | `asyncHandler → Service`            | propagated to errorHandler |
| Data access    | `Repository → Prisma → PostgreSQL` | —                         |
| Success        | `apiResponse.success(data)`          | —                         |

### Prisma Client

A **singleton** `PrismaClient` is used (see `lib/prisma.ts`). During development, the instance is cached on `globalThis` to survive hot-module reloads without leaking connection pool slots. In production, a single instance is created once per process.

The `@prisma/adapter-pg` driver adapter is used instead of Prisma's default driver, enabling direct use of the `pg` connection pool.

### Pagination

All list endpoints use **offset pagination**:

```
skip = (page - 1) × limit
take = limit
```

`paginate()` caps `page` at `1` minimum and `limit` between `1` and `100`. Every paginated response includes a `meta` object: `{ total, page, limit, totalPages }`.

Both the `findMany` and `count` queries run in a single **Prisma interactive transaction** to ensure consistent pagination results if rows are inserted concurrently.

---

## Coding Practices

### Separation of Concerns

Each module is strictly split into three layers:

| Layer                | Responsibility                                                |
| -------------------- | ------------------------------------------------------------- |
| **Router**     | Route definition, middleware chaining, request/response shape |
| **Service**    | Business rules, domain logic, authorization at data level     |
| **Repository** | Prisma queries only — no business logic                      |

This makes each layer independently testable and replaceable.

### Naming Conventions

| Thing             | Convention                                          | Example                               |
| ----------------- | --------------------------------------------------- | ------------------------------------- |
| Files             | `<domain>.<role>.ts`                              | `transactions.service.ts`           |
| Classes           | PascalCase                                          | `TransactionService`                |
| Singleton exports | camelCase                                           | `transactionService`                |
| HTTP status codes | Named constants via `AppError`                    | `new AppError('Not found', 404)`    |
| DB column names   | camelCase (Prisma maps to snake_case via `@@map`) | `passwordHash` → `password_hash` |

### Error Handling

- All route handlers are wrapped in `asyncHandler()` which forwards promise rejections to Express's error chain via `.catch(next)` — no `try/catch` boilerplate in routes.
- `AppError` is a typed operational error class with a `statusCode` and optional `details[]` for field-level validation failures.
- The global `errorHandler` middleware distinguishes between `AppError` (expected, returns structured error) and unexpected errors (logs and returns a generic `500`).
- In `development`, stack traces are included in `500` responses. In `production`, they are suppressed.

### Type Safety

- `strict: true` TypeScript configuration.
- All Zod schemas use `z.infer<typeof schema>` — validation types and TypeScript types are always in sync.
- `req.user` is typed via Express namespace augmentation in `types/express.d.ts` rather than casting.
- Shared types live in `types/index.ts` as the single source of truth.

### Security Practices

- Passwords hashed with `bcrypt` at cost factor **12**.
- JWT secret validated to ≥ 32 characters at startup.
- `passwordHash` is never returned in any API response (`safeSelect` in `UserRepository`).
- Non-admin users receive `404` (not `403`) when accessing another user's transaction — prevents resource enumeration.
- Error messages for invalid credentials are identical regardless of whether the email or password is wrong — prevents user enumeration.

---

## Assumptions Made

1. **Single database instance** — The app is designed for a single PostgreSQL instance. The rate limiter uses in-memory storage, which is acceptable for a single-process deployment.
2. **Transactions are owned by users** — Every transaction has exactly one owner (`userId`). There is no concept of shared or team-owned transactions.
3. **Dashboard data is system-wide** — The dashboard endpoints (`/summary`, `/by-category`, `/trends`, `/recent`) return global aggregates, not scoped to the requesting user. This is appropriate for an internal finance analytics platform where all authenticated users are company employees.
4. **Soft delete = archived** — Soft-deleted transactions are retained indefinitely for audit compliance. No hard-delete mechanism is exposed via the API.
5. **Role assignment is trusted at registration** — The public `/register` endpoint accepts a `role` parameter. This assumes the API is used in a controlled environment or behind a gateway. In a fully public deployment this should be locked down.
6. **UTC timestamps** — All dates are stored and returned in UTC. No timezone conversion is performed server-side.
7. **CORS unrestricted** — The `cors()` middleware is configured with no origin whitelist, assuming the API is only consumed by known internal clients. A production deployment should set an explicit `origin` list.

---

## Tradeoffs Considered

### 1. Offset Pagination vs. Cursor Pagination

**Chosen:** Offset pagination (`skip`/`take`)

**Why:** Simpler to implement, works well with filter combinations, familiar to frontend developers. Cursor-based pagination is more efficient at scale (no `OFFSET` scan), but adds complexity around cursor serialization and is harder to combine with arbitrary filters.

**Tradeoff:** Performance degrades on high page numbers when the dataset is large (PostgreSQL must scan and discard `skip` rows). Acceptable for this use case; can be migrated to cursor-based later.

---

### 2. JWT Stateless Auth vs. Session-Based Auth

**Chosen:** Stateless JWT (24h expiry)

**Why:** No server-side session store needed; scales horizontally without sticky sessions; simpler infrastructure.

**Tradeoff:** Tokens cannot be invalidated before expiry. Logout is client-side only (discard the token). A compromised token is valid for up to 24 hours. A short-lived access token + refresh token flow would solve this but adds database round-trips and complexity.

---

### 3. In-Memory Rate Limiter vs. Redis-Backed

**Chosen:** In-memory (`express-rate-limit` default)

**Why:** No external dependency; zero configuration; works perfectly for a single-process app.

**Tradeoff:** Does not work across multiple Node processes or replicas. If the app is scaled horizontally (pm2 cluster, Docker replicas), each process has an independent counter and the effective limit multiplies by the process count. Use `rate-limit-redis` to share state when scaling.

---

### 4. Trends Grouped In-Memory vs. SQL GROUP BY

**Chosen:** Fetch all matching transactions, group in JavaScript (`Map`)

**Why:** Monthly/weekly grouping is not trivially portable SQL across PostgreSQL versions without functions like `date_trunc`. JavaScript grouping is readable, testable, and avoids raw SQL.

**Tradeoff:** Fetches all matching transactions into memory. For large date ranges with millions of transactions this could be a bottleneck. A `date_trunc`-based SQL `GROUP BY` (via `prisma.$queryRaw`) would be more scalable.

---

### 5. `Decimal` type for amounts vs. `Float`

**Chosen:** `Decimal(12,2)` (Prisma maps to PostgreSQL `NUMERIC(12,2)`)

**Why:** Financial amounts must be exact. JavaScript Float (IEEE 754) introduces rounding errors (e.g. `0.1 + 0.2 ≠ 0.3`). `NUMERIC` in PostgreSQL stores exact decimal values.

**Tradeoff:** Prisma returns `Decimal` objects (from the `decimal.js` library), not native numbers. All monetary values must be converted with `Number(decimal)` before arithmetic or JSON serialisation.

---

## Known Limitations & Future Work

| Area               | Current State        | Recommended Improvement                                |
| ------------------ | -------------------- | ------------------------------------------------------ |
| Token invalidation | No logout/revocation | Add refresh token flow with DB-persisted tokens        |
| CORS               | Open (all origins)   | Add explicit `origin` allowlist                      |
| Role on register   | Self-assignable      | Restrict `role` to admin-only on public register     |
| Rate limit store   | In-memory            | Use `rate-limit-redis` for multi-process deployments |
| Dashboard scoping  | Global data          | Add per-user scoping option for VIEWER/ANALYST         |
| Tests              | None                 | Add integration tests with `vitest` + `supertest`  |
| Logging            | `console.log`      | Structured logging with `pino` or `winston`        |
| Trends query       | In-memory grouping   | Use `date_trunc` SQL for large datasets              |
| API versioning     | None                 | Add `/api/v1/` prefix for forward compatibility      |
| Input sanitisation | Zod validates shape  | Add `DOMPurify` or similar for freetext fields       |
