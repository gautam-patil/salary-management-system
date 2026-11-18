import type { Employee, Paginated } from "@acme/shared";

export async function fetchEmployees(page: number, pageSize: number): Promise<Paginated<Employee>> {
  const res = await fetch(`/api/employees?page=${page}&pageSize=${pageSize}`);
  if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
  return res.json();
}
