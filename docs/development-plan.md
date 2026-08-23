# MVP Development Plan

## Objective

Deliver the minimum viable PhotoBook Hub platform: a customer can register, upload photos, create a basic photobook, place an order with manual bank transfer, and receive a printed product from the in-house production team.

**MVP success criteria:**
1. First successful customer order placed
2. First successful printed photobook delivered
3. Positive gross margin per order

---

## Current State (Sprint 3 Session 1 — Completed)

| Area | Status |
|---|---|
| Next.js application | ✅ Initialized |
| PostgreSQL + Docker Compose | ✅ Running |
| Prisma ORM + User schema | ✅ Migrated |
| Authentication API (register) | ✅ Route handler + Zod validation |
| Auth.js v5 (credentials provider) | ✅ Configured |
| Swagger UI at `/api/docs` | ✅ Live |
| Structured logging (Pino) | ✅ All required fields |
| OpenTelemetry + Jaeger | ✅ Traces verified |
| Test suite (80 tests, TDD) | ✅ Passing |
| Documentation (CLAUDE.md, AGENTS.md, ADRs 0001–0007) | ✅ Current |
| Register + Login pages (shadcn/ui forms) | ✅ Live |
| Auth middleware — `/(app)/**` route protection | ✅ Live |
| Dashboard page (Server Component, session-aware) | ✅ Live |
| Project + Photo Prisma models + migration | ✅ Applied |
| `StorageProvider` interface + `LocalStorage` impl | ✅ Done |
| Photo upload API (6 endpoints + file serving) | ✅ Done |
| Photo upload UI (projects list + project detail) | ✅ Done |
| Photobook editor (schema, API, UI) | ✅ Done |
| Order placement (schema, API, UI) | ✅ Done |
| Test suite | ✅ 113 tests passing |

**Not yet implemented:** Admin panel, Sprint 7 polish.

---

## Critical Path to First Order

```
Auth UI          → Sprint 2  ✅ Done
Photo Upload     → Sprint 3  ✅ Done
Photobook Editor → Sprint 4
Order Placement  → Sprint 5
Admin Panel      → Sprint 6
MVP Launch       → Sprint 7
```

Each sprint is one week at side-project pace (~3 sessions × 2–3 hours).

---

## Sprint 2 — Authentication UI & Route Protection

**Goal:** A customer can register and log in via the browser, access a protected dashboard, and be redirected to login when unauthenticated.

### Session 1 — UI Foundation

- Install and configure **shadcn/ui** with Tailwind v4
- Create route groups: `(auth)` for public pages, `(app)` for protected pages
- Add root layout with font and global styles
- Write ADR-0006: UI component strategy

**Output:** Styled base, shadcn Button / Input / Form components available.

### Session 2 — Register & Login Pages

**Register** `src/app/(auth)/register/page.tsx`
- Email, password, name fields with client-side Zod validation
- `POST /api/auth/register` on submit
- Redirect to `/login` on success
- Inline field-level error messages from API

**Login** `src/app/(auth)/login/page.tsx`
- Email and password fields
- Auth.js `signIn("credentials")` on submit
- Redirect to `/dashboard` on success
- Generic "Invalid credentials" on failure

### Session 3 — Protected Dashboard & Middleware

**Middleware** `src/middleware.ts`
- Extend to check Auth.js session token
- Redirect unauthenticated users away from `/(app)/**` to `/login`
- Preserve existing `x-request-id` injection

**Dashboard** `src/app/(app)/dashboard/page.tsx`
- Server Component; reads session via `auth()`
- Displays user name, email, join date
- Logout button (`signOut()`)
- Placeholder cards for Projects and Orders

### New Database Models

None — User model is sufficient for this sprint.

### New API Endpoints

None — existing Auth.js + register routes cover this sprint.

### Definition of Done

- [x] Customer can register via browser form
- [x] Customer can log in via browser form
- [x] `/dashboard` requires authentication
- [x] Logout redirects to `/login`
- [x] All new pages have unit/integration tests
- [x] `pnpm test`, `pnpm lint`, `pnpm tsc --noEmit` pass

---

## Sprint 3 — Photo Upload

**Goal:** A logged-in customer can create a project and upload photos to it.

### Session 1 — Schema & Storage ✅ Completed

**New Prisma models:** `Project`, `Photo`, `ProjectStatus` enum — migration `add-project-photo` applied.

**Storage abstraction** `src/server/storage.ts`
- `StorageProvider` interface: `upload(key, data, mimeType)`, `getUrl(key)`, `delete(key)`
- `LocalStorage` implementation — writes to `UPLOAD_DIR` (`.uploads/` by default)
- `getUrl` returns `/api/files/${key}` — served by route handler in Session 2
- ADR-0007 written: storage strategy (local → MinIO → S3)

### Session 2 — Photo Upload API ✅ Completed

Route handlers implemented (all session-guarded, 401 on unauthenticated):
- `POST /api/projects` — create project
- `GET /api/projects` — list user's projects
- `GET /api/projects/[id]` — get single project detail with photos
- `POST /api/projects/[id]/photos` — upload photo (multipart/form-data)
- `GET /api/projects/[id]/photos` — list photos with URLs
- `DELETE /api/projects/[id]/photos/[photoId]` — delete from storage + DB
- `GET /api/files/[...key]` — serve uploaded files (path-traversal protected)

Validation: JPEG/PNG only, max 20 MB. Swagger spec updated with Projects + Photos tags.

### Session 3 — Photo Upload UI ✅ Completed

**Projects page** `src/app/(app)/projects/page.tsx`
- Lists projects with DRAFT/IN_PROGRESS/READY status badge and photo count
- Empty state with dashed border + "New project" prompt
- "New project" modal (title input, create → redirect to project)

**Project detail** `src/app/(app)/projects/[id]/page.tsx`
- Drag-and-drop upload zone with per-file XHR progress bar
- Photo thumbnail grid (2–4 columns responsive)
- Hover overlay with filename + delete button; delete calls API then `router.refresh()`
- Dashboard Projects card now links to `/projects`

### Definition of Done

- [x] Customer can create a project
- [x] Customer can upload JPEG/PNG photos (max 20 MB each)
- [x] Photos display as thumbnails in the project
- [x] Customer can delete a photo
- [x] File type and size validation enforced on API
- [x] All route handlers have tests
- [x] `pnpm test`, `pnpm lint`, `pnpm tsc --noEmit` pass

---

## Sprint 4 — Photobook Editor

**Goal:** A customer can create a basic photobook from uploaded photos, select a size, and preview it.

### Session 1 — Photobook Schema & Catalog

**New Prisma models:**

```prisma
model Photobook {
  id        String         @id @default(cuid())
  projectId String         @unique
  title     String
  size      PhotobookSize  @default(A4)
  coverType CoverType      @default(SOFTCOVER)
  pageCount Int            @default(0)
  project   Project        @relation(fields: [projectId], references: [id])
  pages     PhotobookPage[]
  @@map("photobooks")
}

model PhotobookPage {
  id          String      @id @default(cuid())
  photobookId String
  pageNumber  Int
  photoId     String?
  layout      Json
  photobook   Photobook   @relation(fields: [photobookId], references: [id])
  @@map("photobook_pages")
}

enum PhotobookSize { A4 A5 SQUARE }
enum CoverType    { SOFTCOVER HARDCOVER }
```

Pricing hardcoded in `src/config/pricing.ts` (no ProductVariant table for MVP).

### Session 2 — Editor API ✅ Completed

- `POST /api/projects/[id]/photobook` — create photobook; auto-assigns photos to pages sequentially; 409 if already exists
- `GET /api/projects/[id]/photobook` — get photobook with pages and photo URLs
- `PUT /api/projects/[id]/photobook` — update size / cover type
- `PUT /api/projects/[id]/photobook/pages/[num]` — update a single page's photoId
- 17 new tests (97 total passing)

### Session 3 — Basic Editor UI ✅ Completed

**Editor** `src/app/(app)/projects/[id]/editor/page.tsx`
- Size selector (A4 / A5 / Square) and cover type selector (Softcover / Hardcover)
- Live price display from `src/config/pricing.ts`
- "Create photobook" button — auto-assigns photos server-side on POST
- Page preview grid — aspect-ratio-correct cards with photo thumbnails
- "Save options" updates size/cover on existing photobook
- "Proceed to order" links to `/checkout/[photobookId]` (Sprint 5)
- Project detail page gains "Create photobook" button when photos exist

### Definition of Done

- [x] Customer can create a photobook from a project
- [x] Customer can select size and cover type
- [x] Photos are auto-assigned to pages
- [x] Customer can preview all pages
- [x] Layout is persisted
- [x] `pnpm test`, `pnpm lint`, `pnpm tsc --noEmit` pass

---

## Sprint 5 — Order Placement

**Goal:** A customer can place an order for their photobook with manual bank transfer as the payment method.

### Session 1 — Order Schema & Pricing

**New Prisma models:**

```prisma
model Order {
  id           String      @id @default(cuid())
  orderNumber  String      @unique
  userId       String
  status       OrderStatus @default(PENDING_PAYMENT)
  subtotal     Decimal     @db.Decimal(10, 2)
  shippingCost Decimal     @db.Decimal(10, 2)
  totalAmount  Decimal     @db.Decimal(10, 2)
  createdAt    DateTime    @default(now())
  updatedAt    DateTime    @updatedAt
  user         User        @relation(fields: [userId], references: [id])
  items        OrderItem[]
  payment      Payment?
  @@map("orders")
}

model OrderItem {
  id          String    @id @default(cuid())
  orderId     String
  photobookId String
  quantity    Int       @default(1)
  unitPrice   Decimal   @db.Decimal(10, 2)
  order       Order     @relation(fields: [orderId], references: [id])
  @@map("order_items")
}

model Payment {
  id            String        @id @default(cuid())
  orderId       String        @unique
  method        PaymentMethod @default(BANK_TRANSFER)
  amount        Decimal       @db.Decimal(10, 2)
  status        PaymentStatus @default(AWAITING)
  referenceCode String?
  paidAt        DateTime?
  order         Order         @relation(fields: [orderId], references: [id])
  @@map("payments")
}

enum OrderStatus   { PENDING_PAYMENT PAID IN_PRODUCTION SHIPPED DELIVERED CANCELLED }
enum PaymentMethod { BANK_TRANSFER }
enum PaymentStatus { AWAITING CONFIRMED FAILED }
```

Pricing and flat-rate shipping ($9.99) in `src/config/pricing.ts`.
Shipping address as scalar fields on `Order`. Migration: `add-orders`.

### Session 2 — Checkout API ✅ Completed

- `POST /api/orders` — create order from photobook with pricing + address
- `GET /api/orders` — list user's orders
- `GET /api/orders/[id]` — order detail with payment status
- `POST /api/orders/[id]/payment` — submit bank transfer reference code
- 16 new tests (113 total passing)

### Session 3 — Checkout UI ✅ Completed

- `src/app/(app)/checkout/[photobookId]/page.tsx` — server component fetching photobook, renders `CheckoutForm` (address fields + order summary + total breakdown)
- `src/app/(app)/orders/[id]/page.tsx` — order confirmation with bank transfer instructions, reference code submission, 5-step status tracker
- `src/app/(app)/orders/page.tsx` — orders table with status badges
- Middleware updated: `checkout` added to protected route regex
- Dashboard Orders card now links to `/orders`

### Definition of Done

- [x] Customer can proceed from editor to checkout
- [x] Order is created with correct pricing
- [x] Customer sees bank transfer instructions
- [x] Customer can submit payment reference code
- [x] Order status updates to `PENDING_PAYMENT` then `PAID`
- [x] All route handlers have tests
- [x] `pnpm test`, `pnpm lint`, `pnpm tsc --noEmit` pass

---

## Sprint 6 — Admin Panel

**Goal:** The production team can view orders, confirm payments, download print-ready assets, and update order status.

### Session 1 — Admin Schema & Auth

- Add admin role check to middleware — only `UserRole.ADMIN` can access `/admin/**`
- Seed one admin user via a migration or seed script

### Session 2 — Admin API

- `GET /api/admin/orders` — list all orders with status filter
- `PUT /api/admin/orders/[id]/payment` — confirm or reject payment
- `GET /api/admin/orders/[id]/assets` — generate download link for print-ready files
- `PUT /api/admin/orders/[id]/status` — update order status (IN_PRODUCTION → SHIPPED etc.)

### Session 3 — Admin UI

**Admin orders** `src/app/admin/orders/page.tsx`
- Filterable table: All / Pending Payment / Paid / In Production / Shipped
- Columns: order number, customer name, photobook details, total, status, date

**Admin order detail** `src/app/admin/orders/[id]/page.tsx`
- Customer and order info
- Payment confirmation (confirm / reject with reference code)
- Status update dropdown
- "Download print assets" button (ZIP of all page photos)
- Shipment tracking input (courier + tracking number)

### Definition of Done

- [ ] Admin can log in (same login page, role-gated)
- [ ] Admin can view all orders
- [ ] Admin can confirm or reject payment
- [ ] Admin can download print-ready assets
- [ ] Admin can update order status through to `SHIPPED`
- [ ] Customer-facing order status updates when admin changes it
- [ ] `pnpm test`, `pnpm lint`, `pnpm tsc --noEmit` pass

---

## Sprint 7 — MVP Polish & Launch Prep

**Goal:** The platform is stable, observable, and ready for the first real customer.

### Session 1 — End-to-End Testing

- Write Playwright E2E tests for the full critical path:
  - Registration → Login → Create Project → Upload Photos → Create Photobook → Place Order → Submit Payment
- Fix any discovered issues

### Session 2 — Security & Hardening

- Security review: input validation, file upload safety, auth on all protected routes
- Rate limiting on register and login endpoints
- `.env` audit — confirm no secrets committed
- CORS headers review

### Session 3 — Deployment & Monitoring

- Write `Dockerfile` for the Next.js app
- Update `docker-compose.yaml` for production-like local run
- Verify all environment variables documented
- Write `docs/runbooks/deployment.md`
- Confirm Jaeger traces and Pino logs working end-to-end in containerised run
- Final smoke test of the full customer flow

### Definition of Done

- [ ] E2E tests pass for the full order flow
- [ ] No critical security issues
- [ ] Dockerfile builds and runs successfully
- [ ] All runbooks written
- [ ] First internal test order placed and fulfilled
- [ ] MVP success criteria met (end-to-end order works)

---

## Schema Evolution Summary

| Sprint | New Models |
|---|---|
| 1 (done) | `User` |
| 2 | — |
| 3 | `Project`, `Photo` |
| 4 | `Photobook`, `PhotobookPage` |
| 5 | `Order`, `OrderItem`, `Payment` |
| 6 | — (admin role on `User`) |

---

## API Endpoint Roadmap

| Endpoint | Sprint |
|---|---|
| `POST /api/auth/register` | ✅ Done |
| `POST /api/auth/signin` | ✅ Done (Auth.js) |
| `POST /api/projects` | 3 |
| `GET /api/projects` | 3 |
| `GET /api/projects/[id]` | 3 |
| `POST /api/projects/[id]/photos` | 3 |
| `GET /api/projects/[id]/photos` | 3 |
| `DELETE /api/projects/[id]/photos/[photoId]` | 3 |
| `POST /api/projects/[id]/photobook` | 4 |
| `GET /api/projects/[id]/photobook` | 4 |
| `PUT /api/projects/[id]/photobook` | 4 |
| `POST /api/orders` | 5 |
| `GET /api/orders` | 5 |
| `GET /api/orders/[id]` | 5 |
| `POST /api/orders/[id]/payment` | 5 |
| `GET /api/admin/orders` | 6 |
| `PUT /api/admin/orders/[id]/payment` | 6 |
| `PUT /api/admin/orders/[id]/status` | 6 |
| `GET /api/admin/orders/[id]/assets` | 6 |

---

## ADR Roadmap

| ADR | Topic | Sprint |
|---|---|---|
| 0001–0005 | ✅ Done | — |
| 0006 | UI component strategy (shadcn/ui) | 2 |
| 0007 | Storage strategy (local → MinIO → S3) | 3 |
| 0008 | Pricing model (hardcoded vs dynamic) | 5 |

---

## Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| shadcn/ui + Tailwind v4 compatibility issues | Medium | Medium | Spike in Session 1 of Sprint 2; fall back to bare Tailwind |
| File upload performance with large photos | Low | Low | Enforce 20 MB limit; async processing later |
| Bank transfer UX friction leading to drop-off | High | High | Keep instructions simple; follow up with customers manually |
| Photobook editor complexity underestimated | Medium | High | Auto-layout only for MVP; no drag-and-drop |
| Admin panel scope creep | Medium | Medium | Strict MVP scope; no production team portal |
