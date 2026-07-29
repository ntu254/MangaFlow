import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/live",
  testMatch: ["**/*.spec.ts"],
  globalSetup: "./tests/live/global-setup.ts",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  outputDir: "artifacts/e2e-live/test-results",
  reporter: [
    ["line"],
    ["json", { outputFile: "artifacts/e2e-live/results.json" }],
    ["html", { outputFolder: "artifacts/e2e-live/html-report", open: "never" }],
  ],
  use: {
    ...devices["Desktop Chrome"],
    baseURL: "http://localhost:3100",
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
});
