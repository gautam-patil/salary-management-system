import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { Employee, Paginated } from "@acme/shared";
import { EmployeesPage } from "./EmployeesPage";

const employee = (over: Partial<Employee>): Employee => ({
  id: 1,
  fullName: "Asha Rao",
  email: "asha@acme.com",
  jobTitle: "Software Engineer",
  department: "Engineering",
  country: "India",
  salary: 2_400_000,
  currency: "INR",
  hireDate: "2022-03-14T00:00:00.000Z",
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
  ...over,
});

const pages: Record<number, Employee[]> = {
  1: [
    employee({}),
    employee({ id: 2, fullName: "Mike Brown", email: "mike@acme.com", country: "United States", salary: 98_800, currency: "USD" }),
  ],
  2: [employee({ id: 3, fullName: "Lena Fischer", email: "lena@acme.com", country: "Germany", salary: 70_000, currency: "EUR" })],
  3: [employee({ id: 4, fullName: "Yuki Sato", email: "yuki@acme.com", country: "Japan", salary: 9_000_000, currency: "JPY" })],
};

function fakeApi() {
  return vi.fn(async (url: string) => {
    const page = Number(new URL(url, "http://localhost").searchParams.get("page") ?? 1);
    const body: Paginated<Employee> = { items: pages[page] ?? [], total: 60, page, pageSize: 25, totalPages: 3 };
    return { ok: true, json: async () => body };
  });
}

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <EmployeesPage />
    </QueryClientProvider>,
  );
}

describe("EmployeesPage", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", fakeApi());
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("shows a loading message, then the employees", async () => {
    renderPage();

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
    expect(await screen.findByText("Asha Rao")).toBeInTheDocument();
    expect(screen.getByText("Mike Brown")).toBeInTheDocument();
  });

  it("shows each salary in the employee's own currency", async () => {
    renderPage();

    expect(await screen.findByText("₹2,400,000")).toBeInTheDocument();
    expect(screen.getByText("$98,800")).toBeInTheDocument();
  });

  it("shows which page we are on and the total number of employees", async () => {
    renderPage();

    expect(await screen.findByText(/page 1 of 3/i)).toBeInTheDocument();
    expect(screen.getByText(/60 employees/i)).toBeInTheDocument();
  });

  it("loads the next page when Next is clicked", async () => {
    renderPage();
    await screen.findByText("Asha Rao");

    await userEvent.click(screen.getByRole("button", { name: /next/i }));

    expect(await screen.findByText("Lena Fischer")).toBeInTheDocument();
    expect(screen.getByText(/page 2 of 3/i)).toBeInTheDocument();
    expect(fetch).toHaveBeenLastCalledWith(expect.stringContaining("page=2"));
  });

  it("goes back with Previous", async () => {
    renderPage();
    await screen.findByText("Asha Rao");
    await userEvent.click(screen.getByRole("button", { name: /next/i }));
    await screen.findByText("Lena Fischer");

    await userEvent.click(screen.getByRole("button", { name: /previous/i }));

    expect(await screen.findByText("Asha Rao")).toBeInTheDocument();
  });

  it("disables Previous on the first page and Next on the last", async () => {
    renderPage();
    await screen.findByText("Asha Rao");
    expect(screen.getByRole("button", { name: /previous/i })).toBeDisabled();

    await userEvent.click(screen.getByRole("button", { name: /next/i }));
    await screen.findByText("Lena Fischer");
    await userEvent.click(screen.getByRole("button", { name: /next/i }));
    await screen.findByText("Yuki Sato");

    expect(screen.getByRole("button", { name: /next/i })).toBeDisabled();
  });

  it("shows an error message when the API fails", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, status: 500, json: async () => ({}) })));

    renderPage();

    expect(await screen.findByText(/could not load employees/i)).toBeInTheDocument();
  });
});
