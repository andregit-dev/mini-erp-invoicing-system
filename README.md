# Mini ERP Invoicing System

A production-ready Mini ERP Invoicing System built with NestJS and Next.js, designed with clean architecture and prepared for future microservice & micro frontend evolution.

---

## Tech Stack

### Backend
| Layer | Tech |
|---|---|
| Framework | NestJS (modular architecture) |
| ORM | Prisma 6 |
| Database | SQLite (dev) → PostgreSQL (prod-ready) |
| Auth | JWT via httpOnly Cookie |
| Validation | class-validator + class-transformer |
| Rate Limiting | @nestjs/throttler |
| API Docs | Swagger (`/api/docs`) |

### Frontend
| Layer | Tech |
|---|---|
| Framework | Next.js 14 (App Router + RSC) |
| Styling | TailwindCSS |
| State Management | Zustand |
| Form Validation | React Hook Form + Zod |
| HTTP Client | Axios |
| Notifications | Sonner |

### Why These Choices?

**Why SQLite for Development?**
- Zero configuration required
- Quick setup for testing
- Easy migration to PostgreSQL (one-line env change via Prisma)
- Sufficient for development scale

**Why Next.js 14 & Prisma 6?**
- Stability: Both are production-ready with proven track records
- Evaluation: Clean code structure that is easy to assess
- Extensibility: Clear path to enterprise features
- Documentation: Well-supported by official docs

**Why Zustand over Redux?**
Zustand is lightweight, boilerplate-free, and sufficient for the scope of this app. Redux introduces unnecessary complexity at this scale. Zustand also integrates cleanly with React Server Components.

---

## Prerequisites

- Node.js >= 22.x (aligned with project codebase)
- npm 10.9.2
- Git

Tested on:
- Pop!_OS 22.04 (local development)
- Debian 13 (VPS deployment)

---

## Installation & Running Locally

For full setup details, environment variable references, and troubleshooting, refer to `_docs/`.

### 1. Clone the Repository

```bash
git clone git@github.com:andregit-dev/mini-erp-invoicing-system.git
cd mini-erp-invoicing-system
```

### 2. Backend

```bash
cd backend
cp .env.example .env
npm install
npx prisma generate
npx prisma migrate dev
npm run start:dev
```
Backend runs at: `http://localhost:3000`
Swagger docs: `http://localhost:3000/api/docs`


### 3. Frontend

```bash
cd ../frontend
cp .env.example .env.local
npm install
npm run dev
```

Frontend runs at: `http://localhost:3001`

### 4. Seed (Optional)

```bash
cd ../backend
npm run seed          # basic seed
npm run seed:faker    # seed with faker data
```

### 5. Troubleshooting

#### Prisma & Database Reset

If you encounter Prisma Client errors—especially when switching between **from Docker to Local environments**—use these commands to clean and reset your state.

#### a. Fix Corrupted / Missing Prisma Client

```bash
# Clean up old build artifacts
rm -rf prisma/generated node_modules/.prisma

# Regenerate fresh Prisma client
npx prisma generate

```

#### b. Hard Reset Local SQLite Database

If you need to wipe out the local database completely due to data conflicts or constraints:

```bash
# Remove physical SQLite database files and journals
rm -f prisma/*.db prisma/*.db-journal

# Re-initialize everything from scratch
npx prisma generate
npx prisma migrate dev

```

---

## Project Structure

```
mini-erp-invoicing-system/
├── backend/
│   ├── src/
│   │   ├── auth/           # JWT auth module
│   │   ├── customers/      # Customer CRUD
│   │   ├── invoices/       # Invoice + items logic
│   │   └── common/         # Guards, interceptors, filters, validators
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── migrations/
│   │   └── seed/
│   └── _docs/
│       ├── mini-erp-erd.png
│       ├── Mini ERP Invoicing System.postman_collection.json
│       └── scripts.md
├── frontend/
│   ├── app/                # Next.js App Router pages
│   ├── components/
│   │   ├── layout/         # Sidebar, Header
│   │   └── ui/             # Button, Card, Modal, Input, StatusBadge, etc.
│   ├── lib/
│   │   ├── store/          # Zustand auth store
│   │   ├── validations/    # Zod schemas
│   │   ├── api.ts          # Axios instance
│   │   └── pdf-generator.ts
├── docker-compose.local.yml
└── docker-compose.prod.yml
```

---

## Database Schema (ERD)

ERD diagram is available at `_docs/mini-erp-erd.png`.

### Relationships

```
User     ──< Customer     (1:N)
User     ──< Invoice      (1:N)
Customer ──< Invoice      (1:N, onDelete: Cascade)
Invoice  ──< InvoiceItem  (1:N, onDelete: Cascade)
```

---

## API Documentation

### Swagger
Interactive API docs available at:
```
http://localhost:3000/api/docs
```

Swagger supports Bearer token authentication as a fallback alongside cookie-based auth.

### Postman
Import `_docs/Mini ERP Invoicing System.postman_collection.json` (Collection v2.1) into Postman to test all endpoints with pre-configured examples.

---

## Authentication Flow

- JWT is issued on login and stored as an **httpOnly cookie** — not accessible via JavaScript, preventing XSS attacks
- All protected routes are guarded by `JwtAuthGuard`
- Token extraction supports both cookie and `Authorization: Bearer` header (for Swagger compatibility)
- On logout, the cookie is explicitly cleared server-side

> **Future:** Redis will be integrated for token blacklisting (logout invalidation) and session caching, enabling proper token revocation without database hits.

---

## Rate Limiting

A global throttler is applied across all API endpoints via `@nestjs/throttler`:

- **Global**: 100 requests per 60 seconds per IP
- **Auth endpoints** (`POST /auth/login`, `POST /auth/register`): stricter limit of 5 requests per 60 seconds

This protects against brute-force login attempts and general API abuse. Status update and other mutation endpoints are covered under the global limit.

---

## Invoice Status Flow

### Status Definitions

| Status | Description | Can Transition To |
|---|---|---|
| `DRAFT` | Invoice is being prepared | `SENT` |
| `SENT` | Invoice sent to customer | `PAID`, `OVERDUE`, `CANCELLED` |
| `PAID` | Payment received | None (Terminal) |
| `OVERDUE` | Payment deadline passed | `PAID`, `CANCELLED` |
| `CANCELLED` | Invoice voided | None (Terminal) |

### Status Flow Diagram

```
┌─────────┐
│  DRAFT  │
└────┬────┘
     │
     ▼
┌─────────┐
│  SENT   │──────────────┐
└────┬────┘              │
     │                   │
     ├───────┬───────────┤
     ▼       ▼           ▼
┌─────────┐┌─────────┐┌─────────┐
│  PAID   ││ OVERDUE ││CANCELLED│
└─────────┘└────┬────┘└─────────┘
                │
                ├───────┐
                ▼       ▼
          ┌─────────┐┌─────────┐
          │  PAID   ││CANCELLED│
          └─────────┘└─────────┘
```

### Status Validation Logic

```typescript
const statusFlow: Record<InvoiceStatus, InvoiceStatus[]> = {
  DRAFT: ['SENT'],
  SENT: ['PAID', 'OVERDUE', 'CANCELLED'],
  PAID: [],        // Terminal state
  OVERDUE: ['PAID', 'CANCELLED'],
  CANCELLED: []    // Terminal state
};

if (!statusFlow[currentStatus]?.includes(newStatus)) {
  throw new BadRequestException(
    `Cannot change status from ${currentStatus} to ${newStatus}`
  );
}
```

### Business Rules

- `DRAFT → SENT`: Only allowed forward transition from draft
- `SENT → PAID`: Payment confirmation
- `SENT → OVERDUE`: When due date passes
- `OVERDUE → PAID`: Late payment received
- `OVERDUE → CANCELLED`: Void overdue invoice
- No Deletion: Invoices are permanent financial records

---

## ERP Business Flow

### Complete User Journey

```
[User Login] → [Dashboard]
                    │
          ┌─────────┼──────────┐
          ▼         ▼          ▼
   [Customers]  [Invoices]  [Stats]
          │         │
   Add/Edit/     Create Invoice:
   Soft Delete    1. Select or create Customer inline
                  2. Add Line Items
                  3. Set Due Date
                  4. Save as DRAFT
                       │
                  Mark as SENT
                       │
              ┌────────┴────────┐
              ▼                 ▼
           PAID             OVERDUE
                             │
                    ┌────────┴────────┐
                    ▼                 ▼
                  PAID           CANCELLED
```

Dashboard surfaces: total invoices, revenue (PAID only), status breakdown, and recent invoices.

---

## Invoice Creation with Database Transaction

Creating an invoice involves multiple write operations:
1. Validate customer exists
2. Insert `Invoice` record with calculated subtotal, tax (11%), and total
3. Insert all `InvoiceItem` records with per-item totals
4. Generate invoice number in format `INV-YYYYMMDD-XXXX`

All steps are wrapped in a **Prisma transaction (`$transaction`)** to guarantee atomicity — if any step fails, the entire operation is rolled back. No partial invoices.

---

## Soft Delete & Data Integrity

- **Customer** uses **soft delete** — records are flagged with `deletedAt` timestamp, not physically removed
- **Invoice has no delete feature** by design — invoices are financial records and must be retained for audit trails
- When a customer is soft-deleted, their associated invoices **remain intact and accessible** in the database, but the customer is no longer selectable for new invoices
- `InvoiceItem` uses `onDelete: Cascade` — items are removed if the parent invoice is deleted (admin/dev only)

---

## Logging

- HTTP requests are logged via `LoggingInterceptor` to **stdout (terminal)**: method, URL, status code, and response duration
- Unhandled exceptions are captured by `AllExceptionsFilter`, which maps Prisma error codes (P2002, P2025, etc.) to appropriate HTTP responses and logs the stack trace
- Environment variables are validated at startup via `validateEnvironment()` — the app refuses to start if required vars are missing
- **Audit log** (who changed what, when) is not yet implemented — deferred until RBAC is in place, since audit trails are only meaningful when user roles and actions are clearly defined

---

## Due Date Flexibility

- Invoice `dueDate` can be set to today, a future date, or a past date (backdating support)
- This is intentional — common for recording offline invoices or correcting data entry
- The `IsFutureDate` validator exists in the codebase but is intentionally commented out for this reason
- **Future:** Restrict backdating to `ADMIN` role only when RBAC is implemented

---

## Architectural Decisions & Assumptions

1. **Modular NestJS architecture** — each domain (auth, customers, invoices) is a self-contained module with its own controller, service, and DTOs. Designed for easy extraction into microservices.

2. **Service layer separation** — business logic lives in services, not controllers. Controllers only handle HTTP concerns (routing, guards, request/response shaping).

3. **httpOnly cookie for JWT** — token is never exposed to JavaScript, preventing XSS. Bearer token fallback is provided for Swagger testing only.

4. **Zod on the frontend** — all form inputs are validated client-side with Zod schemas (auth, customer, invoice) before hitting the API, reducing invalid requests and improving UX feedback.

5. **SQLite for development** — zero config, instant setup. Prisma binary targets include `debian-openssl-3.0.x` and `debian-openssl-1.1.x` to ensure compatibility across dev (Pop!_OS) and production (Debian 13) environments.

6. **No audit log yet** — deferred intentionally. Audit logging requires user identity in context, which becomes meaningful once role-based access is in place.

7. **Client-side PDF generation** — invoices can be exported to PDF via `jsPDF` + `jspdf-autotable` without any backend involvement, reducing server load.

8. **Customer CSV export** — customer list can be exported to CSV via `react-csv` directly from the browser.

---

## Known Limitations

- No email integration yet
- No payment gateway
- No multi-language support
- Basic error handling (can be enhanced with more granular Prisma error mapping)

---

## Future Improvements

- KYC with image upload (customer photo, ID card)
- File attachment for invoices (PDF, receipts)
- Cloud storage integration (AWS S3 / Cloudinary)
- RBAC (Admin, Staff roles)
- Redis for token blacklisting & caching
- Audit log (change history per record)
- Email notifications on status transitions
- Payment gateway integration

---

## Live Demo

A live version is available on a VPS (Debian 13) with limited resources. First load may take a few seconds (cold start).

| Service | URL |
|---------|-----|
| **Frontend** | [https://mini-erp.appndre.uk/](https://mini-erp.appndre.uk/) |
| **Backend API** | [https://mini-erp.appndre.uk/api](https://mini-erp.appndre.uk/api) |
| **Swagger Docs** | [https://mini-erp.appndre.uk/api/docs](https://mini-erp.appndre.uk/api/docs) |

---

### Test Credentials (After Seeding)

After running the seed command, you can use the following account to test the application:

| Field | Value |
|-------|-------|
| **Email** | `admin@example.com` |
| **Password** | `password123` |

> This account is automatically created during the seeding process (`npm run seed:faker`). Make sure to run the seed command first if you're running locally.
>
> **Note:** These credentials work for **both** the local environment (after running `npm run seed:faker`) and the live demo.
>
> For detailed seeding and setup instructions, see **`_docs/scripts.md`**.

---

## Future Improvements

### Microservices Strategy

```yaml
Phase 1 - Current (Monolithic):
  - Single deployment
  - Shared database
  - All modules in one codebase

Phase 2 - Modular Monolith:
  - Domain modules with clear boundaries
  - Event-driven internal communication

Phase 3 - Microservices:
  - auth-service       (port 3001)
  - customer-service   (port 3002)
  - invoice-service    (port 3003)
  - API Gateway        (port 3000)
  - Database per service
  - Message Broker: RabbitMQ / Kafka
```

### Micro Frontend Strategy

```yaml
Phase 1 - Current:
  - Single Next.js app
  - Feature-based folder structure

Phase 2 - Module Federation:
  - customer-mfe  (port 3002)
  - invoice-mfe   (port 3003)
  - host shell    (port 3001)
  - Shared UI component library

Phase 3 - Full MFE:
  - Independent CI/CD per team
  - Autonomous deployments
  - Unified design system
```

---
