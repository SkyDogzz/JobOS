import { defineConfig, devices } from "@playwright/test";

const webPort = Number(process.env.E2E_WEB_PORT ?? 3000);
const apiPort = Number(process.env.E2E_API_PORT ?? 4000);

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: `http://localhost:${webPort}`,
    trace: "on-first-retry"
  },
  webServer: {
    command: "node scripts/e2e-server.mjs",
    url: `http://localhost:${webPort}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      E2E_WEB_PORT: String(webPort),
      E2E_API_PORT: String(apiPort),
      NEXT_PUBLIC_API_URL: `http://localhost:${apiPort}`
    }
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] }
    }
  ]
});
