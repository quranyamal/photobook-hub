import { trace } from "@opentelemetry/api";
import type { Logger } from "pino";
import { logger } from "@/lib/logger";

export type RequestLogger = Logger;

function resolveSpanContext(requestId: string): {
  traceId: string;
  spanId?: string;
} {
  const span = trace.getActiveSpan();
  if (!span) return { traceId: requestId };
  const ctx = span.spanContext();
  if (ctx.traceId === "00000000000000000000000000000000") {
    return { traceId: requestId };
  }
  return { traceId: ctx.traceId, spanId: ctx.spanId };
}

export function createRequestLogger(
  requestId: string,
  context?: { userId?: string; path?: string; method?: string }
): RequestLogger {
  return logger.child({
    requestId,
    ...resolveSpanContext(requestId),
    ...context,
  });
}

export function getRequestId(request: Request): string {
  return request.headers.get("x-request-id") ?? crypto.randomUUID();
}

/** Stamps the active OTel span with request.id for log-to-trace correlation. */
export function tagActiveSpan(requestId: string): void {
  const span = trace.getActiveSpan();
  if (span) span.setAttribute("request.id", requestId);
}

/**
 * Logs the final response with statusCode and durationMs.
 * Level is derived from status: 5xx → error, 4xx → warn, 2xx/3xx → info.
 */
export function logResponse(
  log: RequestLogger,
  statusCode: number,
  startTimeMs: number,
  context?: Record<string, unknown>
): void {
  const durationMs = Date.now() - startTimeMs;
  const data = { statusCode, durationMs, ...context };

  if (statusCode >= 500) {
    log.error(data, "Request failed");
  } else if (statusCode >= 400) {
    log.warn(data, "Request rejected");
  } else {
    log.info(data, "Request completed");
  }
}
