# ADR-0002 Use Next.js as Full-Stack Framework

Status: Accepted

Date: 2026-06-10

---

## Context

PhotoBook Hub requires both a customer-facing frontend and a backend API for managing users, photobooks, orders, and production workflows.

At MVP stage, maintaining two separate applications (a dedicated frontend and a dedicated backend service) introduces friction: separate repositories or packages, separate deployment pipelines, separate dev server processes, and context switching between two different frameworks.

The team is small and velocity matters. The primary risk at this stage is building the wrong product, not scaling the right one.

---

## Decision

Use **Next.js** as the full-stack framework for the MVP.

- **Frontend**: Next.js App Router with React Server Components as the default. Client Components are used only when browser APIs or interactivity are required.
- **Backend**: Next.js Route Handlers (`app/api/...`) serve as the API layer for all server-side operations including database access, authentication, and business logic.
- **Language**: TypeScript throughout, with strict mode enabled.

This consolidates the entire application into a single deployable unit with one language, one framework, and one development server.

When the backend outgrows Route Handlers — due to complexity, team growth, or the need for features like dependency injection, interceptors, or queue consumers — it will be extracted to NestJS. See `AGENTS.md` for the long-term stack vision.

---

## Consequences

### Positive

* Single codebase and deployment unit — one `pnpm dev`, one CI pipeline, one Docker image
* Shared TypeScript types between frontend and backend with no serialization boundary
* React Server Components enable server-side data fetching without a separate API call from the browser
* Faster onboarding — one framework to understand
* Simpler local development environment

### Negative

* Route Handlers lack the structure of NestJS: no dependency injection, no decorators, no built-in interceptors or guards
* Business logic in Route Handlers can become disorganized without discipline — requires enforcing the `src/server/` layer convention
* Future extraction to NestJS will require a migration effort
* Less suited for long-running background jobs or queue consumers without additional tooling

---

## Alternatives Considered

### NestJS Backend from Day One

A separate NestJS application alongside the Next.js frontend, deployed independently.

Rejected because: two frameworks, two deployments, and two dev servers add overhead that is not justified at MVP stage. NestJS is the planned extraction target once complexity warrants it.

### Express.js Backend

A lightweight Express API alongside Next.js.

Rejected because: Express provides few conventions and limited TypeScript ergonomics. The project would likely outgrow it and need to migrate again.

### Remix

An alternative full-stack React framework.

Rejected because: the team has existing Next.js knowledge and the ecosystem (shadcn/ui, Prisma, Vercel) is better aligned with Next.js.

---

## References

- `AGENTS.md` — Long-Term Stack Vision
- `CLAUDE.md` — Technology Stack, Project Structure
