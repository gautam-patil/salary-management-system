import type { Employee, EmployeeFilters, ListQuery, Paginated } from "@acme/shared";

export type EmployeeParams = Pick<ListQuery, "page" | "pageSize"> & Partial<Omit<ListQuery, "page" | "pageSize">>;

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
  return res.json();
}

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
