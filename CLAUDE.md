# CLAUDE.md

## Project

PhotoBook Hub — a web platform for creating, ordering, and fulfilling personalized photobooks.

Business model:
- Customers create photobooks
- PhotoBook Hub receives orders
- Production partners handle printing
- Customers receive printed products

Current stage: **MVP** — validating that customers will purchase personalized photobooks online.

---

## MVP Scope

### Included
- Customer registration and authentication
- Photo uploads
- Photobook creation
- Order placement
- Order management

### Excluded
- Mobile applications
- AI-generated layouts
- Referral systems
- Loyalty programs
- Multi-country support
- Complex workflow automation

Do not implement excluded features unless explicitly requested.

---

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js, React, TypeScript, Tailwind CSS, shadcn/ui |
| Backend | Next.js Route Handlers |
| ORM | Prisma |
| Database | PostgreSQL |
| Validation | Zod |
| Package manager | pnpm |
| Infrastructure | Docker |

Backend will be extracted to NestJS when operational complexity justifies it. See `AGENTS.md` for long-term stack vision.

---

## Project Structure

```
src/
├── app/           # Next.js App Router — pages and route handlers
├── components/    # Shared UI components (shadcn/ui)
├── features/      # Feature modules (colocated UI, logic, hooks)
├── lib/           # Shared utilities and helpers
├── server/        # Server-only logic (DB access, services)
├── config/        # Environment configuration
└── types/         # Shared TypeScript types
docs/
├── adr/           # Architecture Decision Records
└── runbooks/      # Operational runbooks
prisma/
├── schema.prisma
└── migrations/
```

---

## Guiding Principles

1. Business value over engineering elegance
2. Simplicity over abstraction
3. Prefer server-side execution
4. Avoid premature optimization
5. Keep dependencies minimal
6. Increase complexity incrementally — only when justified by a real problem

Every major technical decision must answer: *What business problem does this solve?*

---

## Coding Standards

### TypeScript
- Strict mode enabled
- Avoid `any`
- Prefer explicit types over inference for public APIs

### React
- Default to Server Components
- Use Client Components only for interactivity or browser APIs

### Validation
- Use Zod for all external input
- Validate at route handler boundaries

### Environment Variables
- Access only through `src/config/env.ts`
- Never read `process.env` directly outside that module

### General
- Readability over cleverness
- Explicit naming
- Small, focused functions
- No premature abstractions

---

## Database Guidelines

All schema changes must go through Prisma migrations.

Workflow:
1. Update `prisma/schema.prisma`
2. `pnpm prisma migrate dev --name <description>`
3. Commit both `schema.prisma` and migration files together
4. `pnpm prisma generate`

Never edit committed migration files.
Never modify a production schema manually.

---

## Feature Development Workflow

Before implementing:
1. Define user story and acceptance criteria
2. Identify database schema impact
3. Define API contract (inputs, outputs, errors)

Implementation order:
1. Database schema
2. Server logic / Route Handler
3. Input validation (Zod)
4. UI
5. Tests

---

## Testing Standards

Follow TDD (Test Driven Development):
1. Write a failing test
2. Write the minimum code to pass it
3. Refactor

Test types:
- **Unit**: domain logic, business rules, utilities
- **Integration**: route handlers, database interactions
- **E2E**: registration, login, photo upload, checkout, order tracking

Target 80%+ coverage for core business logic.

---

## Security

Never:
- Commit secrets, credentials, or tokens
- Hardcode environment-specific values

Always:
- Source environment variables through `src/config/env.ts`
- Validate all user input with Zod
- Check authorization on every protected route handler
- Validate uploaded files (type, size)

---

## Definition of Done

A task is complete when:
- Code compiles without errors
- `pnpm lint` passes
- TypeScript type-check passes (`pnpm tsc --noEmit`)
- Database migration runs cleanly
- Acceptance criteria are satisfied
- Documentation updated where required
- Observability added (structured logging at minimum)
- Security reviewed

---

## AI Instructions

When implementing features:
- Read this file before starting
- Review existing code before generating new code
- Reuse existing patterns and utilities
- Do not introduce unnecessary dependencies
- Do not perform large refactors without explicit instruction
- Do not implement MVP-excluded features unless explicitly asked
- Do not make architectural assumptions without documenting trade-offs in `docs/adr/`

For large changes:
- Propose a plan first, then implement incrementally
- Prefer small, reviewable pull-request-sized changes

Claude Code is a primary development tool. Responsibilities include:
- Generating implementation plans, code, tests, documentation
- Writing Architecture Decision Records
- Writing operational runbooks
