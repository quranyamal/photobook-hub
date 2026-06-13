import type { Logger } from "pino";
import { logger } from "@/lib/logger";

export type RequestLogger = Logger;

export function createRequestLogger(
  requestId: string,
  context?: { userId?: string; path?: string; method?: string }
): RequestLogger {
  return logger.child({
    requestId,
    traceId: requestId, // placeholder until OpenTelemetry SDK is active (Phase 4)
    ...context,
  });
}

export function getRequestId(request: Request): string {
  return request.headers.get("x-request-id") ?? crypto.randomUUID();
}
