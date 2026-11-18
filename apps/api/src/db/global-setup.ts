import { execFileSync } from "node:child_process";
import { rmSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

export default function setup() {
  // Delete the file rather than `db push --force-reset`, which Prisma blocks for AI agents.
  for (const suffix of ["", "-journal"]) {
    rmSync(fileURLToPath(new URL(`../../prisma/test.db${suffix}`, import.meta.url)), { force: true });
  }

  const prismaCli = createRequire(import.meta.url).resolve("prisma/build/index.js");

  execFileSync(process.execPath, [prismaCli, "db", "push", "--skip-generate"], {
    env: { ...process.env, DATABASE_URL: "file:./test.db" },
    stdio: "pipe",
  });
}
