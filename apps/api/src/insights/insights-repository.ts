import { prisma } from "../db/client.js";
import type { SalaryRow } from "../domain/stats.js";

// only the columns the calculations need; 10,000 of these is a few hundred KB
export function listSalaryRows(): Promise<SalaryRow[]> {
  return prisma.employee.findMany({
    select: { country: true, department: true, jobTitle: true, salary: true, currency: true },
  });
}
