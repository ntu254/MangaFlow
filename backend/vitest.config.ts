import { defineConfig } from "vitest/config";

// MF-032: Vitest 4 runs in a parallel fork pool by default, which
// intermittently crashes a worker ("Worker exited unexpectedly") on
// Windows, making `harness story verify` flaky even though every test
// passes. Run in a single fork to make the suite deterministic without
// changing which tests run or weakening coverage.
export default defineConfig({
  test: {
    pool: "forks",
    singleFork: true,
    fileParallelism: false,
    hookTimeout: 30_000,
    testTimeout: 30_000,
    globals: true,
    include: ["src/**/*.{test,spec}.?(c|m)[jt]s?(x)"],
    exclude: ["dist/**", "node_modules/**"],
  },
});
