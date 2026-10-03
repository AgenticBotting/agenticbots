import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end tests run against the app in DEMO MODE (seeded fictional
 * data, demo runtime, no external calls). `npm run test:e2e`.
 */
const PORT = Number(process.env.E2E_PORT ?? 3077);

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: { baseURL: `http://localhost:${PORT}`, trace: "retain-on-failure" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile-client", use: { ...devices["Pixel 7"] }, testMatch: /client\.spec\.ts/ },
  ],
  webServer: {
    command: `npx next dev -p ${PORT}`,
    url: `http://localhost:${PORT}/login`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: { DEMO_MODE: "true", DEMO_PERSIST: "false" },
  },
});
