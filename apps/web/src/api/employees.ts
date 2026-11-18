import type { Employee, EmployeeFilters, EmployeeInput, ListQuery, Paginated } from "@acme/shared";
import { getJson, send } from "./http";

export type EmployeeParams = Pick<ListQuery, "page" | "pageSize"> & Partial<Omit<ListQuery, "page" | "pageSize">>;

const withJson = (method: string, body: unknown): RequestInit => ({
  method,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

export function fetchEmployees(params: EmployeeParams): Promise<Paginated<Employee>> {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") query.set(key, String(value));
  }
  return getJson(`/api/employees?${query}`);
}

export function fetchFilters(): Promise<EmployeeFilters> {
  return getJson("/api/employees/filters");
}

export async function createEmployee(input: EmployeeInput): Promise<Employee> {
  return (await send("/api/employees", withJson("POST", input))).json();
}

export async function updateEmployee(id: number, input: EmployeeInput): Promise<Employee> {
  return (await send(`/api/employees/${id}`, withJson("PUT", input))).json();
}

export async function deleteEmployee(id: number): Promise<void> {
  await send(`/api/employees/${id}`, { method: "DELETE" });
}
