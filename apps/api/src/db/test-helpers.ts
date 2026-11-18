import { prisma } from "./client.js";

export async function resetDb() {
  await prisma.employee.deleteMany();
}
