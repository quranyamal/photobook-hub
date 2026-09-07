import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  reactCompiler: true,
  // Prevent Next.js from bundling these server-only packages with webpack.
  // They must run as native Node.js modules.
  serverExternalPackages: [
    "pino",
    "pino-pretty",
    "@opentelemetry/sdk-node",
    "@opentelemetry/sdk-trace-node",
    "@opentelemetry/auto-instrumentations-node",
    "@opentelemetry/exporter-trace-otlp-http",
    "@opentelemetry/resources",
  ],
};

export default nextConfig;
