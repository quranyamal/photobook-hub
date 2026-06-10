# ADR-0004 Use Prisma as ORM

Status: Accepted

Date: 2026-06-10

---

## Context

The application requires a reliable, type-safe way to interact with PostgreSQL from TypeScript code.

The options range from raw SQL drivers (full control, no abstractions) to full ORMs (high abstraction, less control). The project uses TypeScript with strict mode, so type safety at the database boundary is important — runtime errors from mismatched query results and TypeScript types are a real source of bugs.

The team also needs a structured, version-controlled migration workflow that works safely across local development, CI, and production environments.

---

## Decision

Use **Prisma** as the ORM and migration tool.

- Schema defined in `prisma/schema.prisma` as the single source of truth
- Prisma Client auto-generated into `src/generated/prisma/` for type-safe queries
- `prisma migrate dev` for creating and applying migrations in development
- `prisma migrate deploy` for applying migrations in CI and production
- `prisma generate` run after any schema change to keep the client in sync

The Prisma Client is accessed only through the `src/server/` layer. Route Handlers and UI code must not import Prisma directly.

---

## Consequences

### Positive

* Fully type-safe database queries — TypeScript knows the shape of every query result at compile time
* Schema-first approach makes the data model explicit and reviewable in a single file
* First-class migration tooling with a clear dev/deploy workflow
* Prisma Studio available for visual database inspection during development
* Strong ecosystem support and active maintenance
* Generates a query client that works without raw SQL knowledge

### Negative

* Generated client adds build-time complexity and must be committed or regenerated in CI
* Complex queries (e.g. recursive CTEs, window functions) require dropping down to `$queryRaw`
* Prisma Client is heavier than lightweight query builders — startup time is slightly higher
* Schema changes require a migration file even for simple renames, which increases process overhead

---

## Alternatives Considered

### Drizzle ORM

A lightweight, SQL-first TypeScript ORM with type-safe queries.

Rejected because: migration tooling (`drizzle-kit`) is less mature than Prisma's at the time of this decision. Prisma's developer experience and documentation are better established for this stack.

### TypeORM

A decorator-based ORM popular in the NestJS ecosystem.

Rejected because: decorator-based models couple the domain layer to the ORM, which violates Clean Architecture principles. Better suited for NestJS when that extraction happens; not the right fit for the current Next.js stack.

### Kysely

A type-safe SQL query builder (not a full ORM).

Rejected because: Kysely has no built-in migration tooling. It would require a separate migration library (e.g. `db-migrate` or raw SQL files), adding complexity without a clear benefit at this stage.

### Raw SQL (`postgres.js` or `pg`)

Direct PostgreSQL driver with hand-written SQL.

Rejected because: no type safety on query results without significant boilerplate. No structured migration tooling. High risk of runtime type mismatches in a TypeScript-strict codebase.

---

## References

- `AGENTS.md` — Domain Model
- `CLAUDE.md` — Database Guidelines
- `prisma/schema.prisma` — Current schema definition
