import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  testMatch: /.*ui\.spec\.ts$/,
  outputDir: "test-results",
  // Each spec file owns its application, so files run in parallel.
  workers: 2,
  // Hang guards, not speed verdicts: a passing test finishes as soon as its conditions hold.
  timeout: 120_000,
  expect: { timeout: 30_000 },
  use: {
    actionTimeout: 30_000,
    navigationTimeout: 30_000,
    viewport: { width: 1440, height: 950 },
  },
});
