import type { ListQuery } from "@acme/shared";
import { prisma } from "../db/client.js";

export async function listEmployees({ page, pageSize }: ListQuery) {
  // fixed order by id, otherwise pages can repeat or skip rows
  const [items, total] = await prisma.$transaction([
    prisma.employee.findMany({
      orderBy: { id: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.employee.count(),
  ]);

  return { items, total };
}
