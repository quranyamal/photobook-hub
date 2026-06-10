# AGENTS.md

## Product Vision

PhotoBook Hub is a platform where customers create and order personalized photobooks, fulfilled by an in-house production team.

---

## Business Goals

### MVP Goals
Validate that customers are willing to purchase personalized photobooks online.

Success criteria:
1. First successful customer order placed
2. First successful printed photobook delivered
3. Positive gross margin per order

### Phase 2 — Growth
Increase conversion rate. Improve photobook editor UX. Expand template catalog.

### Phase 3 — Scale
Expand in-house production capacity. Geographic expansion. Volume pricing.

---

## Architecture Principles

1. Start with a monolith — do not introduce microservices prematurely
2. Business logic must not depend on infrastructure frameworks (Clean Architecture)
3. Every significant architectural decision requires an ADR in `docs/adr/`

Evolution path:
```
Monolith → Modular Monolith → Service Extraction → Event-Driven
```

Do not advance the evolution path without explicit agreement.

---

## Domain Model (DDD)

### Customer Domain
- Registration, authentication, profile, addresses

### Catalog Domain
- Photobook templates, product variants, pricing tiers

### Order Domain
- Cart, checkout, orders, payments

### Production Domain
- Production jobs, status tracking, shipments

### Notification Domain
- Email and messaging notifications

---

## API Standards

- REST APIs with OpenAPI documentation
- Versioned endpoints (`/api/v1/...`)
- Consistent error response shape
- Structured input validation (Zod)
- Serve OpenAPI spec via Swagger UI at `/api/docs`

---

## Observability Requirements

All services must be observable.

### Logging
Structured JSON. Required fields: `timestamp`, `service`, `environment`, `requestId`, `traceId`, `userId`.

### Metrics
Prometheus-compatible. Required: request count, error count, request duration, database latency.

### Tracing
OpenTelemetry across HTTP requests, database calls, and queue processing.

---

## CI/CD Standards

Every pull request must pass: lint → test → build.

Deployment pipeline:
```
Lint → Test → Build → Security Scan → Container Build → Deploy
```

---

## Infrastructure Roadmap

| Phase | Stack |
|---|---|
| 1 | Docker Compose — single application deployment |
| 2 | Kubernetes + Helm |
| 3 | GitOps — ArgoCD |
| 4 | OpenTelemetry + Grafana LGTM |
| 5 | SLO monitoring + incident response |

Do not advance phases without explicit agreement.

---

## Documentation Requirements

### Architecture Decision Records (ADR)
Required for every significant technical decision.
Location: `docs/adr/`
Fields: Context, Decision, Consequences, Alternatives.

### Runbooks
Required for operational scenarios.
Location: `docs/runbooks/`
Scenarios: deployment failures, database issues, service outages, high latency.

---

## Long-Term Stack Vision

Once the Next.js monolith justifies extraction:

| Layer | Technology |
|---|---|
| Backend | NestJS (Clean Architecture: Domain, Application, Infrastructure, Presentation) |
| Cache | Redis |
| Storage | S3-compatible (MinIO locally, AWS S3 in production) |

This project also serves as a Solution Architect portfolio demonstrating:
- Modern software architecture
- Cloud-native engineering
- Platform engineering practices
- OpenTelemetry observability
- GitOps and CI/CD
- SLO-driven operations
- AI-assisted software development
