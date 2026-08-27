import { defineConfig, devices } from "@playwright/test";

const TEST_DB_URL =
  process.env.TEST_DATABASE_URL ??
  "postgresql://photobook:photobook@localhost:5432/photobook_test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: "list",
  globalSetup: "./e2e/global-setup.ts",
  use: {
    baseURL: "http://localhost:3001",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: {
          executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
        },
      },
    },
  ],
  webServer: {
    command: "npx next dev -p 3001",
    port: 3001,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    env: {
      DATABASE_URL: TEST_DB_URL,
      UPLOAD_DIR: ".uploads-test",
    },
  },
});
