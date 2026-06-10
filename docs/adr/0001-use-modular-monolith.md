# ADR-0001 Use Modular Monolith Architecture

Status: Accepted

Date: 2026-06-10

---

## Context

PhotoBook Hub is at MVP stage with a small team and an unvalidated business model.

The core question is: what application architecture best supports rapid iteration now while not creating irreversible structural debt if the product succeeds and needs to scale?

Microservices offer independent scalability and team autonomy, but introduce significant operational and development overhead — service discovery, distributed tracing, inter-service communication, independent deployments — that is unjustified before product-market fit is established.

A completely flat monolith, on the other hand, offers simplicity but tends to accumulate coupling over time, making future extraction into services difficult.

---

## Decision

Adopt a **modular monolith** architecture.

The application is deployed as a single unit, but code is organized into clearly bounded domain modules (Customer, Catalog, Order, Production, Notification). Each module owns its own logic, data access, and types. Cross-module dependencies are explicit and minimized.

Domain boundaries follow the DDD model defined in `AGENTS.md`. Internal module structure follows Clean Architecture layers: domain → application → infrastructure → presentation.

Architecture will evolve along this path only when justified by real operational need:

```
Monolith → Modular Monolith → Service Extraction → Event-Driven
```

---

## Consequences

### Positive

* Single deployment unit — simpler CI/CD, infrastructure, and debugging
* Shared database transactions across domains without distributed coordination
* Fast iteration — no inter-service contracts to maintain during early product changes
* Module boundaries enforce discipline and make future service extraction tractable
* Lower operational cost during the MVP phase

### Negative

* All modules share the same runtime — a memory leak or CPU spike in one module affects all
* Requires team discipline to respect module boundaries; no hard enforcement by the runtime
* Single deployment unit means all modules must be deployed together, even for small changes
* Will require architectural migration effort if a module needs independent scaling later

---

## Alternatives Considered

### Microservices from Day One

Each domain (Customer, Order, Production, etc.) deployed as an independent service.

Rejected because: the operational overhead of service mesh, distributed tracing, independent CI/CD pipelines, and inter-service contracts is disproportionate to the team size and product maturity at this stage.

### Flat Monolith (No Module Boundaries)

A single application with no enforced domain separation.

Rejected because: without boundaries, coupling accumulates quickly. Extracting services later becomes expensive and risky.

---

## References

- `AGENTS.md` — Architecture Principles, Domain Model
- `CLAUDE.md` — Guiding Principles (Incremental Complexity)
