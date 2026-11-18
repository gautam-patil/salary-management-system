import { Prisma, type Employee } from "@prisma/client";
import type { EmployeeFilters, EmployeeInput, ListQuery } from "@acme/shared";
import { prisma } from "../db/client.js";
import { AppError } from "../errors.js";

const UNIQUE_CONSTRAINT_FAILED = "P2002";
const RECORD_NOT_FOUND = "P2025";

// turn the database errors we expect into errors the API can answer with
function translate(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === UNIQUE_CONSTRAINT_FAILED) throw new AppError(409, "An employee with this email already exists");
    if (error.code === RECORD_NOT_FOUND) throw new AppError(404, "Employee not found");
  }
  throw error;
}

export async function createEmployee(input: EmployeeInput) {
  try {
    return await prisma.employee.create({ data: { ...input, hireDate: new Date(input.hireDate) } });
  } catch (error) {
    translate(error);
  }
}

export async function updateEmployee(id: number, input: EmployeeInput) {
  try {
    return await prisma.employee.update({ where: { id }, data: { ...input, hireDate: new Date(input.hireDate) } });
  } catch (error) {
    translate(error);
  }
}

export async function deleteEmployee(id: number) {
  try {
    await prisma.employee.delete({ where: { id } });
  } catch (error) {
    translate(error);
  }
}

function buildWhere({ search, country, department, jobTitle }: ListQuery): Prisma.EmployeeWhereInput {
  return {
    // undefined values are ignored by Prisma
    country,
    department,
    jobTitle,
    // SQLite's contains is case-insensitive for plain letters
    ...(search && { OR: [{ fullName: { contains: search } }, { email: { contains: search } }] }),
  };
}

function buildOrderBy({ sortBy, sortDir }: ListQuery): Prisma.EmployeeOrderByWithRelationInput[] {
  if (!sortBy) return [{ id: "asc" }];

  // id as a tie-breaker, otherwise pages can repeat or skip rows when values are equal
  return [{ [sortBy]: sortDir ?? "asc" }, { id: "asc" }];
}

export async function listEmployees(query: ListQuery) {
  const where = buildWhere(query);

  const [items, total] = await prisma.$transaction([
    prisma.employee.findMany({
      where,
      orderBy: buildOrderBy(query),
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.employee.count({ where }),
  ]);

  return { items, total };
}

export async function listFilterValues(): Promise<EmployeeFilters> {
  type Field = "country" | "department" | "jobTitle";

  const distinct = async (field: Field) => {
    const rows: Pick<Employee, Field>[] = await prisma.employee.findMany({
      select: { country: true, department: true, jobTitle: true },
      distinct: [field],
      orderBy: { [field]: "asc" },
    });
    return rows.map((row) => row[field]);
  };

  const [countries, departments, jobTitles] = await Promise.all([
    distinct("country"),
    distinct("department"),
    distinct("jobTitle"),
  ]);
  return { countries, departments, jobTitles };
}
