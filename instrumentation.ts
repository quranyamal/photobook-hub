export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Load .env for hosts that don't inject env vars into the process (e.g. Plesk).
    if (!process.env.DATABASE_URL) {
      const path = await import("path");
      const { config } = await import("dotenv");
      config({ path: path.join(process.cwd(), ".env") });
    }
    await import("./src/instrumentation.node");
  }
}
