# Observability Standards

All services in PhotoBook Hub must be observable. This document defines the standards for logging, metrics, and tracing.

For the rationale behind these choices, see `docs/adr/0005-observability-strategy.md`.

---

## Logging Standard

### Library

**Pino** — structured JSON logger.

- Production: raw JSON written to stdout
- Development: `pino-pretty` for human-readable output

### Log Levels

| Level | When to use |
|---|---|
| `fatal` | Application cannot continue. Immediate intervention required. |
| `error` | Operation failed. Requires investigation. |
| `warn` | Unexpected state that was handled. May require attention. |
| `info` | Normal business events (request received, user registered, order placed). |
| `debug` | Internal state useful during development. Not emitted in production. |

### Required Fields

Every log line must include:

| Field | Type | Source | Example |
|---|---|---|---|
| `timestamp` | ISO 8601 string | Pino base config | `"2026-06-13T10:00:00.000Z"` |
| `level` | string | Pino | `"info"` |
| `service` | string | Pino base config | `"photobook-hub"` |
| `environment` | string | `NODE_ENV` | `"production"` |
| `requestId` | UUID string | `x-request-id` header | `"b3d2f1a0-..."` |
| `traceId` | UUID string | OTel (MVP: same as requestId) | `"b3d2f1a0-..."` |

### Conditional Fields

Include when available:

| Field | Type | When |
|---|---|---|
| `userId` | string | Authenticated requests |
| `method` | string | HTTP request logs |
| `path` | string | HTTP request logs |
| `statusCode` | number | HTTP response logs |
| `durationMs` | number | Request and database logs |
| `error` | object | Error logs (`message`, `stack`, `code`) |

### Example Log Lines

**Incoming request:**
```json
{
  "timestamp": "2026-06-13T10:00:00.000Z",
  "level": "info",
  "service": "photobook-hub",
  "environment": "production",
  "requestId": "b3d2f1a0-4c2e-4f1a-9b3d-2f1a0b3d2f1a",
  "traceId": "b3d2f1a0-4c2e-4f1a-9b3d-2f1a0b3d2f1a",
  "method": "POST",
  "path": "/api/auth/register",
  "msg": "Incoming request"
}
```

**Successful operation:**
```json
{
  "timestamp": "2026-06-13T10:00:00.123Z",
  "level": "info",
  "service": "photobook-hub",
  "environment": "production",
  "requestId": "b3d2f1a0-4c2e-4f1a-9b3d-2f1a0b3d2f1a",
  "traceId": "b3d2f1a0-4c2e-4f1a-9b3d-2f1a0b3d2f1a",
  "userId": "cm5abc123",
  "statusCode": 201,
  "durationMs": 123,
  "msg": "User registered successfully"
}
```

**Error:**
```json
{
  "timestamp": "2026-06-13T10:00:00.456Z",
  "level": "error",
  "service": "photobook-hub",
  "environment": "production",
  "requestId": "b3d2f1a0-4c2e-4f1a-9b3d-2f1a0b3d2f1a",
  "traceId": "b3d2f1a0-4c2e-4f1a-9b3d-2f1a0b3d2f1a",
  "error": {
    "message": "Connection refused",
    "code": "ECONNREFUSED"
  },
  "msg": "Database connection failed"
}
```

### Rules

- Never log passwords, tokens, secrets, or full credit card numbers.
- Never log raw request bodies that may contain sensitive data — log only validated, sanitised fields.
- Use child loggers per request to bind `requestId` and `traceId` automatically.
- Keep `msg` short and human-readable. Put structured data in separate fields.

### Request ID Propagation

Every inbound request receives an `x-request-id` header injected by Next.js middleware:

```
Browser → [Middleware: inject x-request-id] → Route Handler → [Child logger binds requestId]
```

The same ID is echoed back on the response header. Log aggregation tools use this to correlate all log lines for a single request.

---

## Metrics Standard

> **Status: Phase 4 — not yet implemented.**
> Metrics will be introduced alongside the Grafana LGTM stack. See `AGENTS.md` — Infrastructure Roadmap.

### Format

Prometheus text format, exposed at `GET /api/metrics`.

### Required Metrics

#### HTTP Metrics

| Metric | Type | Labels | Description |
|---|---|---|---|
| `http_requests_total` | Counter | `method`, `path`, `status_code` | Total number of HTTP requests |
| `http_request_errors_total` | Counter | `method`, `path`, `status_code` | Total number of HTTP errors (4xx, 5xx) |
| `http_request_duration_seconds` | Histogram | `method`, `path` | Request duration in seconds |

#### Database Metrics

| Metric | Type | Labels | Description |
|---|---|---|---|
| `db_query_duration_seconds` | Histogram | `operation`, `model` | Prisma query duration |
| `db_query_errors_total` | Counter | `operation`, `model` | Failed database queries |

#### Business Metrics

| Metric | Type | Labels | Description |
|---|---|---|---|
| `orders_total` | Counter | `status` | Orders placed by status |
| `registrations_total` | Counter | — | Customer registrations |
| `uploads_total` | Counter | `status` | Photo uploads by status |

### Histogram Buckets

Standard latency buckets (seconds):

```
0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10
```

### Example Prometheus Output

```
# HELP http_requests_total Total number of HTTP requests
# TYPE http_requests_total counter
http_requests_total{method="POST",path="/api/auth/register",status_code="201"} 42

# HELP http_request_duration_seconds HTTP request duration in seconds
# TYPE http_request_duration_seconds histogram
http_request_duration_seconds_bucket{method="POST",path="/api/auth/register",le="0.1"} 38
http_request_duration_seconds_bucket{method="POST",path="/api/auth/register",le="0.25"} 42
http_request_duration_seconds_sum{method="POST",path="/api/auth/register"} 4.312
http_request_duration_seconds_count{method="POST",path="/api/auth/register"} 42
```

---

## Tracing Standard

> **Status: Foundation in place (`instrumentation.ts`). SDK activation deferred to Phase 4.**

### Library

**OpenTelemetry** Node.js SDK, initialised in `instrumentation.ts` at server startup.

### Trace Scope

All of the following must produce spans:

| Operation | Span Name Pattern | Key Attributes |
|---|---|---|
| HTTP request | `HTTP {METHOD} {path}` | `http.method`, `http.route`, `http.status_code`, `requestId` |
| Database query | `db.{operation} {model}` | `db.system`, `db.operation`, `db.model`, `db.statement` |
| Queue processing | `queue.{operation}` | `messaging.system`, `messaging.operation` |

### Propagation

Use the **W3C Trace Context** standard (`traceparent` / `tracestate` headers) for propagation across service boundaries.

### Context Fields

| Field | Source | Notes |
|---|---|---|
| `traceId` | OTel SDK | 32-character hex string. At MVP: equals `requestId`. |
| `spanId` | OTel SDK | 16-character hex string |
| `parentSpanId` | Propagated header | Set when request comes from another service |

### Exporter Target

Phase 4 target: **Grafana Tempo** via OTLP HTTP exporter.

```
Application → OTLP HTTP → OTel Collector → Grafana Tempo
```

### MVP Placeholder

Until Phase 4:
- `instrumentation.ts` registers the Next.js hook but does not start the SDK
- `traceId` in logs is set to the value of `requestId`
- Spans are not exported

```typescript
// instrumentation.ts — current state
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Phase 4: initialise OpenTelemetry SDK here
  }
}
```

---

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `LOG_LEVEL` | No | `info` (prod), `debug` (dev) | Pino log level |
| `OTEL_SERVICE_NAME` | Phase 4 | `photobook-hub` | OTel service name |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | Phase 4 | — | OTLP collector endpoint |

---

## References

- `docs/adr/0005-observability-strategy.md`
- `AGENTS.md` — Observability Requirements
- Pino documentation: https://getpino.io
- OpenTelemetry Node.js: https://opentelemetry.io/docs/languages/js
- Prometheus data model: https://prometheus.io/docs/concepts/data_model
- W3C Trace Context: https://www.w3.org/TR/trace-context
