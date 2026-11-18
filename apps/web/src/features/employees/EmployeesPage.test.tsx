import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { Employee, EmployeeFilters, Paginated } from "@acme/shared";
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

const filterOptions: EmployeeFilters = {
  countries: ["Brazil", "Germany", "India", "United States"],
  departments: ["Engineering", "Sales"],
  jobTitles: ["Accountant", "Software Engineer"],
};

const respond = (body: unknown) => ({ ok: true, json: async () => body });

function fakeApi() {
  return vi.fn(async (url: string) => {
    const { pathname, searchParams } = new URL(url, "http://localhost");

    if (pathname === "/api/employees/filters") return respond(filterOptions);

    const page = Number(searchParams.get("page") ?? 1);
    // pretend nobody works in Brazil, to test the empty state
    const items = searchParams.get("country") === "Brazil" ? [] : (pages[page] ?? []);
    const total = items.length === 0 ? 0 : 60;
    const body: Paginated<Employee> = { items, total, page, pageSize: 25, totalPages: total === 0 ? 0 : 3 };
    return respond(body);
  });
}

// the query string of the most recent request for the employee list
function lastListParams() {
  const urls = vi.mocked(fetch).mock.calls.map((call) => String(call[0])).filter((u) => !u.includes("/filters"));
  return new URL(urls[urls.length - 1]!, "http://localhost").searchParams;
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

  describe("the table", () => {
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

    it("shows an error message when the API fails", async () => {
      vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, status: 500, json: async () => ({}) })));

      renderPage();

      expect(await screen.findByText(/could not load employees/i)).toBeInTheDocument();
    });
  });

  describe("paging", () => {
    it("loads the next page when Next is clicked", async () => {
      renderPage();
      await screen.findByText("Asha Rao");

      await userEvent.click(screen.getByRole("button", { name: /next/i }));

      expect(await screen.findByText("Lena Fischer")).toBeInTheDocument();
      expect(screen.getByText(/page 2 of 3/i)).toBeInTheDocument();
      expect(lastListParams().get("page")).toBe("2");
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
  });

  describe("filters", () => {
    it("fills the dropdowns with the values that exist in the data", async () => {
      renderPage();

      expect(await screen.findByRole("option", { name: "India" })).toBeInTheDocument();
      expect(screen.getByRole("option", { name: "Sales" })).toBeInTheDocument();
      expect(screen.getByRole("option", { name: "Accountant" })).toBeInTheDocument();
    });

    it("asks for a country when one is picked", async () => {
      renderPage();
      await screen.findByRole("option", { name: "India" });

      await userEvent.selectOptions(screen.getByRole("combobox", { name: /country/i }), "India");

      await waitFor(() => expect(lastListParams().get("country")).toBe("India"));
    });

    it("asks for a department and a job title when picked", async () => {
      renderPage();
      await screen.findByRole("option", { name: "Sales" });

      await userEvent.selectOptions(screen.getByRole("combobox", { name: /department/i }), "Sales");
      await userEvent.selectOptions(screen.getByRole("combobox", { name: /job title/i }), "Accountant");

      await waitFor(() => {
        expect(lastListParams().get("department")).toBe("Sales");
        expect(lastListParams().get("jobTitle")).toBe("Accountant");
      });
    });

    it("searches after the user stops typing", async () => {
      renderPage();
      await screen.findByText("Asha Rao");

      await userEvent.type(screen.getByRole("searchbox", { name: /search/i }), "asha");

      await waitFor(() => expect(lastListParams().get("search")).toBe("asha"));
    });

    it("does not send a request for every keystroke", async () => {
      renderPage();
      await screen.findByText("Asha Rao");

      await userEvent.type(screen.getByRole("searchbox", { name: /search/i }), "asha");
      await waitFor(() => expect(lastListParams().get("search")).toBe("asha"));

      const searches = vi.mocked(fetch).mock.calls.map((c) => new URL(String(c[0]), "http://localhost").searchParams.get("search"));
      expect(searches.filter((s) => s === "a" || s === "as" || s === "ash")).toEqual([]);
    });

    it("goes back to page 1 when a filter changes", async () => {
      renderPage();
      await screen.findByText("Asha Rao");
      await userEvent.click(screen.getByRole("button", { name: /next/i }));
      await screen.findByText("Lena Fischer");

      await userEvent.selectOptions(screen.getByRole("combobox", { name: /department/i }), "Sales");

      await waitFor(() => expect(lastListParams().get("page")).toBe("1"));
    });

    it("clears search and filters with Clear filters", async () => {
      renderPage();
      await screen.findByRole("option", { name: "India" });
      await userEvent.selectOptions(screen.getByRole("combobox", { name: /country/i }), "India");
      await userEvent.type(screen.getByRole("searchbox", { name: /search/i }), "asha");
      await waitFor(() => expect(lastListParams().get("search")).toBe("asha"));

      await userEvent.click(screen.getByRole("button", { name: /clear filters/i }));

      await waitFor(() => {
        expect(lastListParams().get("country")).toBeNull();
        expect(lastListParams().get("search")).toBeNull();
      });
      expect(screen.getByRole("combobox", { name: /country/i })).toHaveValue("");
      expect(screen.getByRole("searchbox", { name: /search/i })).toHaveValue("");
    });

    it("says so when nothing matches", async () => {
      renderPage();
      await screen.findByRole("option", { name: "Brazil" });

      await userEvent.selectOptions(screen.getByRole("combobox", { name: /country/i }), "Brazil");

      expect(await screen.findByText(/no employees match your filters/i)).toBeInTheDocument();
    });
  });

  describe("sorting", () => {
    it("sorts ascending on the first click and descending on the second", async () => {
      renderPage();
      await screen.findByText("Asha Rao");

      await userEvent.click(screen.getByRole("button", { name: /^country/i }));
      await waitFor(() => {
        expect(lastListParams().get("sortBy")).toBe("country");
        expect(lastListParams().get("sortDir")).toBe("asc");
      });

      await userEvent.click(screen.getByRole("button", { name: /^country/i }));
      await waitFor(() => expect(lastListParams().get("sortDir")).toBe("desc"));
    });

    it("starts ascending again when another column is chosen", async () => {
      renderPage();
      await screen.findByText("Asha Rao");
      await userEvent.click(screen.getByRole("button", { name: /^country/i }));
      await userEvent.click(screen.getByRole("button", { name: /^country/i }));

      await userEvent.click(screen.getByRole("button", { name: /^name/i }));

      await waitFor(() => {
        expect(lastListParams().get("sortBy")).toBe("fullName");
        expect(lastListParams().get("sortDir")).toBe("asc");
      });
    });

    it("marks the sorted column for screen readers", async () => {
      renderPage();
      await screen.findByText("Asha Rao");

      await userEvent.click(screen.getByRole("button", { name: /^salary/i }));

      expect(screen.getByRole("columnheader", { name: /salary/i })).toHaveAttribute("aria-sort", "ascending");
    });

    it("warns that salary sorting compares raw amounts until a country is chosen", async () => {
      renderPage();
      await screen.findByRole("option", { name: "India" });

      await userEvent.click(screen.getByRole("button", { name: /^salary/i }));
      expect(await screen.findByText(/filter by country to compare/i)).toBeInTheDocument();

      await userEvent.selectOptions(screen.getByRole("combobox", { name: /country/i }), "India");
      await waitFor(() => expect(screen.queryByText(/filter by country to compare/i)).not.toBeInTheDocument());
    });

    it("goes back to page 1 when the sort changes", async () => {
      renderPage();
      await screen.findByText("Asha Rao");
      await userEvent.click(screen.getByRole("button", { name: /next/i }));
      await screen.findByText("Lena Fischer");

      await userEvent.click(screen.getByRole("button", { name: /^name/i }));

      await waitFor(() => expect(lastListParams().get("page")).toBe("1"));
    });
  });
});
