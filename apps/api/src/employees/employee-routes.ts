import { Router } from "express";
import type { Employee as EmployeeDto, EmployeeInput, ListQuery, Paginated } from "@acme/shared";
import { employeeInputSchema, listQuerySchema } from "@acme/shared";
import type { Employee } from "@prisma/client";
import { validateBody, validateQuery } from "../middleware/validate.js";
import { createEmployee, listEmployees, listFilterValues } from "./employee-repository.js";

function toDto(e: Employee): EmployeeDto {
  return {
    ...e,
    hireDate: e.hireDate.toISOString(),
    createdAt: e.createdAt.toISOString(),
    updatedAt: e.updatedAt.toISOString(),
  };
}

export const employeeRouter = Router();

employeeRouter.get("/filters", async (_req, res) => {
  res.json(await listFilterValues());
});

employeeRouter.get("/", validateQuery(listQuerySchema), async (_req, res) => {
  const query: ListQuery = res.locals.query;
  const { items, total } = await listEmployees(query);

  const body: Paginated<EmployeeDto> = {
    items: items.map(toDto),
    total,
    page: query.page,
    pageSize: query.pageSize,
    totalPages: Math.ceil(total / query.pageSize),
  };
  res.json(body);
});

employeeRouter.post("/", validateBody(employeeInputSchema), async (_req, res) => {
  const input: EmployeeInput = res.locals.body;
  const employee = await createEmployee(input);

  res.status(201).json(toDto(employee));
});
