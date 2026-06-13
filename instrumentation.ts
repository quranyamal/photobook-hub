export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Phase 4: initialise OpenTelemetry SDK here.
    // See docs/adr/0005-observability-strategy.md and docs/observability.md.
    //
    // Target implementation:
    // const { NodeSDK } = await import("@opentelemetry/sdk-node");
    // const sdk = new NodeSDK({ ... });
    // sdk.start();
  }
}
