import { prisma } from "../db/client.js";
import { seedDatabase } from "./seed-database.js";

const COUNT = 10_000;

const started = Date.now();
await seedDatabase(COUNT);
console.log(`Seeded ${COUNT} employees in ${Date.now() - started}ms`);

await prisma.$disconnect();
