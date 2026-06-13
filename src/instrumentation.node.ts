import { NodeSDK } from "@opentelemetry/sdk-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { ConsoleSpanExporter } from "@opentelemetry/sdk-trace-node";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { resourceFromAttributes } from "@opentelemetry/resources";

const resource = resourceFromAttributes({
  "service.name": process.env.OTEL_SERVICE_NAME ?? "photobook-hub",
  "service.version": "0.1.0",
  "deployment.environment": process.env.NODE_ENV ?? "development",
});

const otlpEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;

// Use OTLP when an endpoint is configured, otherwise print spans to console
const traceExporter = otlpEndpoint
  ? new OTLPTraceExporter({ url: `${otlpEndpoint}/v1/traces` })
  : new ConsoleSpanExporter();

const sdk = new NodeSDK({
  resource,
  traceExporter,
  instrumentations: [
    getNodeAutoInstrumentations({
      "@opentelemetry/instrumentation-fs": { enabled: false },
      "@opentelemetry/instrumentation-dns": { enabled: false },
    }),
  ],
});

sdk.start();

process.on("SIGTERM", () => {
  sdk.shutdown().catch(console.error);
});
