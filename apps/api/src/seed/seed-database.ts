import { prisma } from "../db/client.js";
import { generateEmployees } from "./generate-employees.js";

const BATCH_SIZE = 1_000;

export async function seedDatabase(count: number, seed?: number) {
  const employees = generateEmployees(count, seed);

  // one transaction, so a failure never leaves a half-filled table
  await prisma.$transaction(
    async (tx) => {
      await tx.employee.deleteMany();

      for (let i = 0; i < employees.length; i += BATCH_SIZE) {
        await tx.employee.createMany({ data: employees.slice(i, i + BATCH_SIZE) });
      }
    },
    { timeout: 60_000 },
  );
}
