# Testing Guide

## Test Inventory

21 tests across 3 suites. Last updated: 2026-06-13.

### `POST /api/auth/register` — `src/tests/api/auth/register.test.ts`

**Success**
- returns 201 with user data on valid registration
- does not expose hashedPassword in the response
- accepts registration without an optional name

**Validation errors (400)**
- returns 400 when email is missing
- returns 400 when password is missing
- returns 400 when email format is invalid
- returns 400 when password is shorter than 8 characters
- returns 400 when request body is empty

**Conflict (409)**
- returns 409 when email is already registered

---

### `GET /api/docs` — `src/tests/api/docs.test.ts`

- returns 200
- returns Content-Type text/html
- renders Swagger UI bundle
- embeds the PhotoBook Hub OpenAPI spec

---

### `GET|POST /api/auth/[...nextauth]` — `src/tests/api/auth/nextauth.test.ts`

**GET /api/auth/session**
- delegates to the Auth.js GET handler
- returns 200 with empty session when unauthenticated

**GET /api/auth/providers**
- delegates to the Auth.js GET handler
- returns 200 with credentials provider in the list

**GET /api/auth/csrf**
- delegates to the Auth.js GET handler
- returns 200 with a csrfToken field

**POST /api/auth/signin**
- delegates to the Auth.js POST handler

**POST /api/auth/signout**
- delegates to the Auth.js POST handler

---

## Philosophy

This project follows **Test Driven Development (TDD)**:

1. Write a failing test that describes the expected behaviour
2. Write the minimum code to make it pass
3. Refactor while keeping tests green

Tests are not written after the fact. They define the contract first.

---

## Test Runner

| Tool | Purpose |
|---|---|
| Jest | Test runner and assertion library |
| `next/jest` | Next.js-aware Jest configuration (handles transforms, module aliases) |

---

## Running Tests

```bash
# Run all tests once
pnpm test

# Run in watch mode during development
pnpm test:watch

# Run a specific test file
pnpm test src/tests/api/auth/register.test.ts

# Run tests matching a name pattern
pnpm test --testNamePattern "returns 201"
```

---

## Test Structure

```
src/tests/
└── api/
    ├── auth/
    │   ├── register.test.ts     # POST /api/auth/register
    │   └── nextauth.test.ts     # GET|POST /api/auth/[...nextauth]
    └── docs.test.ts             # GET /api/docs
```

Tests live in `src/tests/` mirroring the structure of `src/app/api/`.

---

## Test Types

### Unit Tests

Test a single function or module in isolation. All dependencies are mocked.

Used for: domain logic, utility functions, business rules.

### Integration Tests (Route Handlers)

Test a Next.js route handler end-to-end by calling it directly with a `Request` object and asserting on the `Response`. The database is mocked; the HTTP layer is real.

Used for: API endpoints, validation, error handling.

Current test suites are integration tests at the route handler level.

### End-to-End Tests (E2E)

Drive a real browser through complete user flows. Not yet implemented.

Planned critical paths:
- Registration and login
- Photo upload
- Photobook creation
- Checkout and order placement

---

## Writing a Route Handler Test

Route handlers in Next.js App Router are plain async functions that accept a `Request` and return a `Response`. Tests call them directly — no HTTP server required.

```typescript
import { POST } from "@/app/api/auth/register/route";

it("returns 201 on valid registration", async () => {
  const req = new Request("http://localhost/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "user@example.com", password: "securepass" }),
  });

  const res = await POST(req);

  expect(res.status).toBe(201);
  const body = await res.json();
  expect(body.email).toBe("user@example.com");
});
```

---

## Mocking

### Database (`@/server/db`)

Never hit a real database in unit or integration tests. Mock the Prisma client at the module level.

```typescript
jest.mock("@/server/db", () => ({
  db: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}));

import { db } from "@/server/db";

const mockFindUnique = db.user.findUnique as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  mockFindUnique.mockResolvedValue(null); // default: no user found
});
```

### Password Hashing (`bcryptjs`)

`bcrypt.hash` is intentionally slow (cost factor 12). Mock it in tests to keep the suite fast.

```typescript
jest.mock("bcryptjs", () => ({
  hash: jest.fn().mockResolvedValue("hashed_password"),
  compare: jest.fn().mockResolvedValue(true),
}));
```

### Auth.js (`@/lib/auth`)

`next-auth` uses ESM and cannot be transformed by Jest's Babel pipeline. Mock `@/lib/auth` entirely in tests that touch Auth.js route handlers. This also keeps tests focused on your code, not the library's internals.

```typescript
jest.mock("@/lib/auth", () => ({
  handlers: {
    GET: jest.fn(),
    POST: jest.fn(),
  },
  signIn: jest.fn(),
  signOut: jest.fn(),
  auth: jest.fn(),
}));
```

---

## Test Environment

Environment variables for tests are set in `jest.setup.ts` (loaded via `setupFiles` in `jest.config.ts`):

```typescript
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";
process.env.NODE_ENV = "test";
process.env.AUTH_SECRET = "test-secret-for-jest-at-least-32-characters-long!!";
```

These values are fake — no real database connection is made during unit or integration tests.

---

## Coverage Targets

| Area | Target |
|---|---|
| Core business logic | 80%+ |
| Route handlers | All happy paths + key error cases |
| Auth.js handlers | Delegation contract only (not library internals) |

Run coverage report:

```bash
pnpm test --coverage
```

---

## What NOT to Test

| What | Why |
|---|---|
| Auth.js internals (JWT signing, cookie handling) | External library — covered by its own test suite |
| Prisma query builder | External library |
| Generated Prisma client (`src/generated/`) | Auto-generated, not maintained by us |
| UI rendering | Covered by E2E tests, not unit tests |

---

## Test Naming Convention

Use plain English sentences that read as specifications:

```
✅ returns 201 with user data on valid registration
✅ returns 409 when email is already registered
✅ does not expose hashedPassword in the response

❌ test1
❌ register happy path
❌ should work
```

A failing test message should immediately tell you what broke and why.

---

## Adding Tests for a New Route Handler

1. Create the test file at `src/tests/api/<domain>/<handler>.test.ts`
2. Write failing tests for each behaviour before implementing the handler
3. Mock `@/server/db` and any slow dependencies
4. Cover: happy path, validation errors, auth errors, not-found cases
5. Update the OpenAPI spec in `src/lib/openapi.ts` to document the new endpoint
