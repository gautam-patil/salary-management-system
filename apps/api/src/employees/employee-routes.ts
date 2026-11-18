import { Router } from "express";
import type { Employee as EmployeeDto, EmployeeInput, ListQuery, Paginated } from "@acme/shared";
import { employeeInputSchema, listQuerySchema } from "@acme/shared";
import type { Employee } from "@prisma/client";
import { z } from "zod";
import { validateBody, validateParams, validateQuery } from "../middleware/validate.js";
import { createEmployee, deleteEmployee, listEmployees, listFilterValues, updateEmployee } from "./employee-repository.js";

const MAX_ID = 2_147_483_647; // the largest id the database can hold

// digits only, so "1.5", "1e3" and "-1" are rejected rather than guessed at
const idParamSchema = z.object({
  id: z
    .string()
    .regex(/^[1-9]\d*$/, "Id must be a positive whole number")
    .transform(Number)
    .pipe(z.number().max(MAX_ID, "Id is too large")),
});
type IdParam = z.infer<typeof idParamSchema>;

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

employeeRouter.put("/:id", validateParams(idParamSchema), validateBody(employeeInputSchema), async (_req, res) => {
  const { id }: IdParam = res.locals.params;
  const input: EmployeeInput = res.locals.body;
  const employee = await updateEmployee(id, input);

  res.json(toDto(employee));
});

employeeRouter.delete("/:id", validateParams(idParamSchema), async (_req, res) => {
  const { id }: IdParam = res.locals.params;
  await deleteEmployee(id);

  res.status(204).end();
});
