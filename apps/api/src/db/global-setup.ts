import { execFileSync } from "node:child_process";
import { rmSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

export default function setup() {
  // start from a missing file, then build it from the real migrations
  for (const suffix of ["", "-journal"]) {
    rmSync(fileURLToPath(new URL(`../../prisma/test.db${suffix}`, import.meta.url)), { force: true });
  }

  const prismaCli = createRequire(import.meta.url).resolve("prisma/build/index.js");

  execFileSync(process.execPath, [prismaCli, "migrate", "deploy"], {
    env: { ...process.env, DATABASE_URL: "file:./test.db" },
    stdio: "pipe",
  });
}
