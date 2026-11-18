import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    env: { DATABASE_URL: "file:./test.db" },
    globalSetup: ["./src/db/global-setup.ts"],
    // all test files share one SQLite file, so they can't run in parallel
    fileParallelism: false,
  },
});
