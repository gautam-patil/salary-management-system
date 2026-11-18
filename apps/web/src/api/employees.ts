import type { Employee, EmployeeFilters, EmployeeInput, ListQuery, Paginated } from "@acme/shared";

export type EmployeeParams = Pick<ListQuery, "page" | "pageSize"> & Partial<Omit<ListQuery, "page" | "pageSize">>;

interface FieldError {
  field: string;
  message: string;
}

// an error answer from the API, with its status so the screen can react to it
export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly details?: FieldError[],
  ) {
    super(message);
  }
}

async function send(url: string, init?: RequestInit): Promise<Response> {
  const res = await fetch(url, init);

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body.error ?? `Request failed with status ${res.status}`, body.details);
  }
  return res;
}

async function getJson<T>(url: string): Promise<T> {
  return (await send(url)).json();
}

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
