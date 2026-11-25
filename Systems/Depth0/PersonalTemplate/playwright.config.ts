import { defineConfig } from "@playwright/test";
import { evidenceFolder, workingCopyRoot } from "@super-app/project-tools/broccoli-folder";

export default defineConfig({
  testDir: ".",
  testMatch: /.*ui\.spec\.ts$/,
  // Screenshots and traces go to the browser evidence of this working copy, outside its working tree.
  outputDir: evidenceFolder(workingCopyRoot(import.meta.dirname), "browser"),
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
