import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { prisma } from "./db/client.js";
import { seedIfEmpty } from "./seed/seed-database.js";

// production entry point: set up the database, then start the server
const prismaCli = createRequire(import.meta.url).resolve("prisma/build/index.js");
execFileSync(process.execPath, [prismaCli, "migrate", "deploy"], { stdio: "inherit" });

if (await seedIfEmpty(10_000)) {
  console.log("Database was empty, seeded 10000 employees");
}
await prisma.$disconnect();

await import("./server.js");
