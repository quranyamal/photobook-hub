import { trace, SpanStatusCode, type Attributes } from "@opentelemetry/api";

const tracer = trace.getTracer("photobook-hub", "0.1.0");

/**
 * Wraps an async operation in an OTel span.
 * Sets status to OK on success, ERROR on exception.
 *
 * Usage:
 *   const user = await withSpan("db.user.create", () => db.user.create(...));
 */
export async function withSpan<T>(
  name: string,
  fn: () => Promise<T>,
  attributes?: Attributes
): Promise<T> {
  return tracer.startActiveSpan(name, async (span) => {
    if (attributes) span.setAttributes(attributes);
    try {
      const result = await fn();
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      span.setStatus({ code: SpanStatusCode.ERROR, message: String(error) });
      span.recordException(error as Error);
      throw error;
    } finally {
      span.end();
    }
  });
}

export { tracer };
