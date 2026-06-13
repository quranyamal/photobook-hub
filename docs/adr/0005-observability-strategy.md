# ADR-0005 Observability Strategy

Status: Proposed

Date: 2026-06-13

---

## Context

PhotoBook Hub is a customer-facing platform handling orders, payments, and production workflows. Without observability, diagnosing production incidents — a failed order, a slow checkout, a broken upload — requires guesswork rather than evidence.

Observability consists of three pillars:

- **Logging** — what happened and when
- **Tracing** — how a request flowed through the system
- **Metrics** — how the system is performing over time

At MVP stage, the platform runs as a single Next.js application. The observability strategy must be practical for a small team, add minimal operational overhead now, and evolve cleanly as the platform grows toward Kubernetes, microservices, and a dedicated observability stack (Phase 4 of the infrastructure roadmap).

Two questions drive this decision:

1. What logging library and format should we standardise on?
2. What is the migration path from MVP logging to full OpenTelemetry tracing?

---

## Decision

### Logging — Pino

Use **Pino** as the structured logger throughout the application.

Pino writes newline-delimited JSON to stdout. Each log line includes the required fields defined in `AGENTS.md`:

```json
{
  "timestamp": "2026-06-13T10:00:00.000Z",
  "level": "info",
  "service": "photobook-hub",
  "environment": "production",
  "requestId": "b3d2f1a0-...",
  "traceId": "b3d2f1a0-...",
  "msg": "User registered successfully",
  "userId": "cm5abc123"
}
```

In development, `pino-pretty` formats logs for human readability. In production, raw JSON is written to stdout and collected by the container runtime or log aggregator (Loki, CloudWatch, etc.).

A **child logger** is created per request from a shared base logger instance, binding `requestId` and `traceId` to every log line for that request. This avoids passing context manually through every function call.

### Request ID Propagation — Next.js Middleware

A **request ID** (`x-request-id`) is injected by Next.js middleware on every inbound request using `crypto.randomUUID()`. This runs on the Edge Runtime before any route handler executes. The ID is forwarded on the request headers and echoed back on the response headers, enabling end-to-end correlation across browser, CDN, and server logs.

### Tracing Foundation — Next.js Instrumentation Hook

Next.js provides a built-in `instrumentation.ts` registration hook that executes once when the server starts. This is the designated entry point for the OpenTelemetry Node.js SDK.

At MVP stage, the hook is registered but the SDK is not yet initialised. The `traceId` field in logs is populated with the `requestId` value as a placeholder until OTel tracing is active.

When Phase 4 begins (OTel + Grafana LGTM), the SDK is wired in `instrumentation.ts` without touching any application code:

```typescript
// instrumentation.ts — Phase 4 target state
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { NodeSDK } = await import("@opentelemetry/sdk-node");
    const sdk = new NodeSDK({ /* exporters, resources */ });
    sdk.start();
  }
}
```

### Metrics — Deferred to Phase 4

Prometheus-compatible metrics (request count, error count, duration, database latency) require either a sidecar exporter or an `/api/metrics` scrape endpoint. This overhead is not justified at MVP stage.

Metrics will be introduced alongside the Grafana LGTM stack in Phase 4.

### Implementation Phases

| Phase | Observability State |
|---|---|
| MVP (now) | Pino structured JSON logs, request ID propagation, `instrumentation.ts` hook registered |
| Phase 2 (K8s) | Log aggregation via Loki; logs shipped from container stdout |
| Phase 3 (GitOps) | Centralised log retention and alerting |
| Phase 4 (OTel) | OpenTelemetry SDK active; distributed tracing to Grafana Tempo; Prometheus metrics via Grafana Mimir |
| Phase 5 (SLO) | SLO dashboards built on top of Phase 4 metrics and traces |

---

## Consequences

### Positive

* Pino is the fastest Node.js JSON logger — negligible performance impact
* Stdout-based logging is compatible with every log aggregation system (Loki, Datadog, CloudWatch, Elastic) without changing application code
* Request ID correlation links browser errors, CDN access logs, and server logs from day one
* `instrumentation.ts` hook is in place — enabling full OTel tracing in Phase 4 requires no changes to route handlers or business logic
* Child logger pattern keeps context (requestId, userId) out of function signatures

### Negative

* `traceId` is a placeholder (equal to `requestId`) until OTel is active — cross-service trace correlation is not available at MVP
* No metrics until Phase 4 — capacity and latency trends must be inferred from logs during MVP
* `pino-pretty` must be a devDependency; production containers must not include it
* Next.js middleware runs on Edge Runtime — Pino cannot be used there; only the request ID injection step runs at that layer

---

## Alternatives Considered

### Winston

A widely used Node.js logger with a rich plugin ecosystem.

Rejected because: significantly slower than Pino, more complex configuration, and the plugin model adds unnecessary abstraction for a project that writes JSON to stdout.

### Console.log with JSON.stringify

The simplest possible structured logging approach — no dependencies.

Rejected because: no log levels, no child logger / context binding, no stream control, and no easy path to integrating with OTel's logging API later.

### OpenTelemetry Logging SDK (now)

Use OTel's logging API from day one, replacing Pino.

Rejected because: the OTel Logs SDK for Node.js is still maturing, and adding a full OTel collector to the MVP stack introduces operational overhead before there is any infrastructure to receive the data. Pino's output is compatible with OTel-compatible log shippers and can be bridged when Phase 4 infrastructure exists.

### Datadog Agent / New Relic APM

Full managed observability platforms with agents installed alongside the application.

Rejected because: vendor lock-in, cost at MVP scale, and the architecture roadmap targets an open-source Grafana LGTM stack. These platforms can receive OTel data if needed later.

---

## References

- `AGENTS.md` — Observability Requirements
- `AGENTS.md` — Infrastructure Roadmap (Phase 4)
- `docs/adr/0002-use-nextjs-fullstack.md` — Next.js middleware and instrumentation context
- Pino documentation: https://getpino.io
- Next.js Instrumentation: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
- OpenTelemetry Node.js SDK: https://opentelemetry.io/docs/languages/js/getting-started/nodejs/
