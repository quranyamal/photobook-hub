# Observability Standards

All services in PhotoBook Hub must be observable. This document reflects the **current implementation** and defines the standards for logging, metrics, and tracing.

For architectural rationale, see `docs/adr/0005-observability-strategy.md`.

---

## Logging Standard

### Library

**Pino** — structured JSON logger.

- Production: raw JSON written to stdout, collected by the container runtime
- Development: `pino-pretty` for human-readable coloured output

### Log Levels

| Level | When to use |
|---|---|
| `fatal` | Application cannot continue. Immediate intervention required. |
| `error` | Operation failed. Requires investigation. |
| `warn` | Unexpected state that was handled. May require attention. |
| `info` | Normal business events (request received, user registered, order placed). |
| `debug` | Internal state useful during development. Not emitted in production. |
| `trace` | Fine-grained diagnostics. Never emitted outside explicit debugging sessions. |

### Required Fields

Every log line emitted by a request logger includes:

| Field | Type | Source | Example |
|---|---|---|---|
| `timestamp` | ISO 8601 string | Pino base config | `"2026-06-14T10:00:00.000Z"` |
| `level` | string | Pino | `"info"` |
| `service` | string | Pino base config | `"photobook-hub"` |
| `environment` | string | `NODE_ENV` | `"production"` |
| `requestId` | UUID string | `x-request-id` header | `"b3d2f1a0-..."` |
| `traceId` | hex string | OTel active span (fallback: `requestId`) | `"a0227530f0e3c3e0..."` |
| `spanId` | hex string | OTel active span (omitted when SDK inactive) | `"eb8d4776fce759cf"` |

### Conditional Fields

Included when available:

| Field | Type | When |
|---|---|---|
| `userId` | string | Authenticated requests |
| `method` | string | HTTP request logs |
| `path` | string | HTTP request logs |
| `statusCode` | number | Response logs (via `logResponse`) |
| `durationMs` | number | Response logs (via `logResponse`) |
| `error` | object | Error logs — `{ message, stack }` |

### Example Log Lines

**Incoming request:**
```json
{
  "timestamp": "2026-06-14T10:00:00.000Z",
  "level": "info",
  "service": "photobook-hub",
  "environment": "production",
  "requestId": "b3d2f1a0-4c2e-4f1a-9b3d-2f1a0b3d2f1a",
  "traceId": "a0227530f0e3c3e0eb8d4776fce759cf",
  "spanId": "eb8d4776fce759cf",
  "method": "POST",
  "path": "/api/auth/register",
  "msg": "Incoming request"
}
```

**Successful response (201):**
```json
{
  "timestamp": "2026-06-14T10:00:00.123Z",
  "level": "info",
  "service": "photobook-hub",
  "environment": "production",
  "requestId": "b3d2f1a0-4c2e-4f1a-9b3d-2f1a0b3d2f1a",
  "traceId": "a0227530f0e3c3e0eb8d4776fce759cf",
  "spanId": "eb8d4776fce759cf",
  "statusCode": 201,
  "durationMs": 123,
  "userId": "cm5abc123",
  "msg": "Request completed"
}
```

**Rejected response (4xx):**
```json
{
  "timestamp": "2026-06-14T10:00:00.050Z",
  "level": "warn",
  "service": "photobook-hub",
  "environment": "production",
  "requestId": "b3d2f1a0-4c2e-4f1a-9b3d-2f1a0b3d2f1a",
  "traceId": "a0227530f0e3c3e0eb8d4776fce759cf",
  "spanId": "eb8d4776fce759cf",
  "statusCode": 409,
  "durationMs": 45,
  "email": "existing@example.com",
  "msg": "Request rejected"
}
```

**Unhandled error (5xx):**
```json
{
  "timestamp": "2026-06-14T10:00:00.200Z",
  "level": "error",
  "service": "photobook-hub",
  "environment": "production",
  "requestId": "b3d2f1a0-4c2e-4f1a-9b3d-2f1a0b3d2f1a",
  "traceId": "a0227530f0e3c3e0eb8d4776fce759cf",
  "spanId": "eb8d4776fce759cf",
  "statusCode": 500,
  "durationMs": 200,
  "error": {
    "message": "Connection refused",
    "stack": "Error: Connection refused\n    at ..."
  },
  "msg": "Request failed"
}
```

### Rules

- Never log passwords, tokens, secrets, or card numbers.
- Never log raw request bodies — log only validated, sanitised fields.
- Use child loggers per request to bind `requestId`, `traceId`, and `spanId` automatically.
- Keep `msg` short and human-readable. Put structured data in separate named fields.

### Request ID Propagation

Every inbound request receives an `x-request-id` header injected by `src/middleware.ts`:

```
Browser → [Middleware: inject x-request-id] → Route Handler → [createRequestLogger binds requestId]
```

The same ID is echoed back on the response header and stamped on the active OTel span as `request.id`.

### Standard Pattern for Route Handlers

Every route handler must follow this four-step pattern:

```typescript
import { createRequestLogger, getRequestId, tagActiveSpan, logResponse } from "@/lib/request-logger";

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  const log = createRequestLogger(requestId, { method: "POST", path: "/api/..." });
  const start = Date.now();

  log.info("Incoming request");
  tagActiveSpan(requestId);         // stamps request.id on the active OTel span

  try {
    // ... handler logic ...
    logResponse(log, 201, start, { userId });   // statusCode + durationMs + context
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const err = error as Error;
    logResponse(log, 500, start, { error: { message: err.message, stack: err.stack } });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

`logResponse` derives the log level from the status code: `5xx` → `error`, `4xx` → `warn`, `2xx/3xx` → `info`.

---

## Metrics Standard

> **Status: Phase 4 — not yet implemented.**
> Metrics will be introduced alongside the Grafana LGTM stack.

### Format

Prometheus text format, exposed at `GET /api/metrics`.

### Required Metrics

#### HTTP Metrics

| Metric | Type | Labels | Description |
|---|---|---|---|
| `http_requests_total` | Counter | `method`, `path`, `status_code` | Total HTTP requests |
| `http_request_errors_total` | Counter | `method`, `path`, `status_code` | Total HTTP errors (4xx, 5xx) |
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

```
0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10
```

---

## Tracing Standard

> **Status: Implemented and active.** Traces exported to Jaeger in development, Grafana Tempo in production (Phase 4).

### Library

**OpenTelemetry Node.js SDK** (`@opentelemetry/sdk-node`), initialised in `src/instrumentation.node.ts` via the Next.js `instrumentation.ts` registration hook at server startup.

### Auto-Instrumentation

The following are instrumented automatically via `@opentelemetry/auto-instrumentations-node`:

| Layer | Spans produced |
|---|---|
| HTTP (inbound) | `POST /api/auth/register`, `executing api route (app) /api/auth/register`, etc. |
| PostgreSQL (pg) | `pg.connect`, `pg-pool.connect`, `pg.query:SELECT ...`, `pg.query:INSERT ...` |

Disabled: `@opentelemetry/instrumentation-fs` (too noisy), `@opentelemetry/instrumentation-dns`.

### Manual Instrumentation

Use `withSpan()` from `src/lib/tracer.ts` to create spans around significant business operations:

```typescript
import { withSpan } from "@/lib/tracer";

const user = await withSpan(
  "db.user.create",
  () => db.user.create({ ... }),
  { "user.email": email }    // optional span attributes
);
```

`withSpan` sets span status to `OK` on success and `ERROR` (with exception recorded) on throw.

### Span Naming Conventions

| Operation | Span name | Example |
|---|---|---|
| HTTP request (auto) | `{METHOD} {path}` | `POST /api/auth/register` |
| Database query (auto) | `pg.query:{SQL_VERB} {db}` | `pg.query:SELECT photobook` |
| Manual DB operation | `db.{model}.{operation}` | `db.user.findUnique` |
| Manual business operation | `{domain}.{action}` | `order.checkout` |

### Span Attributes

| Attribute | Source | Value |
|---|---|---|
| `request.id` | `tagActiveSpan(requestId)` in route handler | UUID matching log `requestId` |
| `user.email` | Passed to `withSpan` attributes | Email address being processed |
| `http.method`, `http.route`, `http.status_code` | Auto-instrumentation | Standard HTTP semantics |
| `db.system`, `db.statement` | Auto-instrumentation (pg) | PostgreSQL query details |

### Log-to-Trace Correlation

`traceId` and `spanId` in every log line match the active OTel span. `request.id` on every span matches `requestId` in logs. This enables:

```
Log line (requestId) → Span (request.id) → Trace (traceId) → Full waterfall in Jaeger
```

### Propagation

W3C Trace Context (`traceparent` / `tracestate` headers) for cross-service propagation.

### Exporters

| Environment | Exporter | Destination |
|---|---|---|
| Development | OTLP HTTP (when `OTEL_EXPORTER_OTLP_ENDPOINT` set) | Jaeger (`http://localhost:4318`) |
| Development (no endpoint) | `ConsoleSpanExporter` | Terminal stdout |
| Production (Phase 4) | OTLP HTTP | Grafana Tempo via OTel Collector |

---

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `LOG_LEVEL` | No | `info` (prod), `debug` (dev), `silent` (test) | Pino log level |
| `OTEL_SERVICE_NAME` | No | `photobook-hub` | Service name on spans and resources |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | No | — | OTLP collector URL. If unset, `ConsoleSpanExporter` is used |

---

## Local Development Setup

Start the full observability stack with:

```bash
docker compose up -d
```

This starts:
- PostgreSQL on `:5432`
- Jaeger on `:16686` (UI) and `:4318` (OTLP HTTP)

View traces at **http://localhost:16686** — select service `photobook-hub`.

---

## References

- `docs/adr/0005-observability-strategy.md`
- `AGENTS.md` — Observability Requirements
- `src/lib/logger.ts` — Pino base logger
- `src/lib/request-logger.ts` — Per-request child logger, `tagActiveSpan`, `logResponse`
- `src/lib/tracer.ts` — `withSpan` utility
- `src/instrumentation.node.ts` — OTel SDK initialisation
- `src/middleware.ts` — Request ID injection
- Pino: https://getpino.io
- OpenTelemetry Node.js: https://opentelemetry.io/docs/languages/js
- Jaeger: https://www.jaegertracing.io
- Prometheus: https://prometheus.io/docs/concepts/data_model
- W3C Trace Context: https://www.w3.org/TR/trace-context
