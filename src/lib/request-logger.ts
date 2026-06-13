import { trace } from "@opentelemetry/api";
import type { Logger } from "pino";
import { logger } from "@/lib/logger";

export type RequestLogger = Logger;

function resolveTraceId(requestId: string): string {
  const span = trace.getActiveSpan();
  if (!span) return requestId;
  const traceId = span.spanContext().traceId;
  // All-zero traceId means no active trace (OTel SDK not yet active)
  return traceId === "00000000000000000000000000000000" ? requestId : traceId;
}

export function createRequestLogger(
  requestId: string,
  context?: { userId?: string; path?: string; method?: string }
): RequestLogger {
  return logger.child({
    requestId,
    traceId: resolveTraceId(requestId),
    ...context,
  });
}

export function getRequestId(request: Request): string {
  return request.headers.get("x-request-id") ?? crypto.randomUUID();
}
