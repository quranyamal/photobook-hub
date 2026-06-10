# ADR-0003 Use PostgreSQL as Primary Database

Status: Accepted

Date: 2026-06-10

---

## Context

PhotoBook Hub requires a persistent data store for all core domain data: users, photo uploads, photobooks, orders, payments, and production status.

The data model is inherently relational. Orders contain order items. Order items reference photobooks. Photobooks reference photo uploads. Users own all of the above. These relationships benefit from foreign key constraints, joins, and transactional consistency.

The platform also needs to run locally for development (via Docker) and on a managed cloud service in production.

---

## Decision

Use **PostgreSQL** as the primary relational database.

- Local development: PostgreSQL 18 via Docker Compose
- Production: managed PostgreSQL (e.g. Supabase, Neon, AWS RDS)
- All schema changes managed through Prisma migrations
- No manual schema edits in any environment

PostgreSQL is chosen for its ACID compliance, strong support for complex relational queries, excellent JSON column support (useful for flexible photobook page layout data), and first-class support from Prisma.

---

## Consequences

### Positive

* ACID transactions ensure order and payment data integrity
* Strong relational modeling with foreign keys, indexes, and constraints
* Native JSON/JSONB columns for semi-structured data (e.g. page layout configurations)
* Excellent ecosystem: Prisma, PostgREST, pgvector (future AI features), pg_cron
* Wide availability as a managed service across all major cloud providers
* Full-text search available natively without an additional service at MVP scale

### Negative

* Requires schema migrations for every structural change — more process than a schemaless store
* Vertical scaling has limits; horizontal sharding is complex if write volume grows significantly
* Slightly more operational setup than embedded databases (requires Docker locally)

---

## Alternatives Considered

### MongoDB

A document-oriented NoSQL database with a flexible schema.

Rejected because: the relational nature of orders, users, and photobooks makes a document model awkward. Many-to-many relationships and transactional integrity across documents are harder to guarantee. PostgreSQL's JSONB covers the flexible schema use cases where needed.

### SQLite

An embedded file-based relational database.

Rejected because: not suitable for concurrent write access in a multi-user web application. Cannot be used with a managed cloud service.

### MySQL

A widely used relational database.

Rejected because: PostgreSQL has stronger JSONB support, better standards compliance, and a richer feature set for the use cases expected (full-text search, array types, advanced indexing). Both are viable; PostgreSQL is the stronger choice for this stack.

---

## References

- `AGENTS.md` — Domain Model, Infrastructure Roadmap
- `CLAUDE.md` — Database Guidelines
- `docker-compose.yaml` — Local PostgreSQL setup
