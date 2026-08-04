import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  testMatch: ["business-flow-contracts.spec.ts", "cache-invalidation-contracts.spec.ts"],
  fullyParallel: false,
  workers: 1,
  reporter: "line",
});
