import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { Employee, EmployeeFilters } from "@acme/shared";
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

const asha = employee({});
const mike = employee({ id: 2, fullName: "Mike Brown", email: "mike@acme.com", country: "United States", salary: 98_800, currency: "USD" });
const lena = employee({ id: 3, fullName: "Lena Fischer", email: "lena@acme.com", country: "Germany", salary: 70_000, currency: "EUR" });

// Switzerland is in the data but is not a supported country; Brazil is supported but has no employees
const filterOptions: EmployeeFilters = {
  countries: ["Germany", "India", "Switzerland", "United States"],
  departments: ["Engineering"],
  jobTitles: ["Software Engineer"],
};

const respond = (status: number, body?: unknown) => ({ ok: status < 400, status, json: async () => body ?? {} });

// set by a test to make the next create, edit or delete fail
let failWrites: { status: number; body?: unknown } | undefined;

function fakeApi() {
  return vi.fn(async (url: string, init?: RequestInit) => {
    const { pathname, searchParams } = new URL(url, "http://localhost");
    const method = init?.method ?? "GET";

    if (method !== "GET") {
      if (failWrites) return respond(failWrites.status, failWrites.body);
      if (method === "DELETE") return respond(204);
      return respond(method === "POST" ? 201 : 200, { ...JSON.parse(String(init?.body)), id: 99 });
    }

    if (pathname === "/api/employees/filters") return respond(200, filterOptions);

    const page = Number(searchParams.get("page") ?? 1);
    return respond(200, { items: page === 1 ? [asha, mike] : [lena], total: 3, page, pageSize: 2, totalPages: 2 });
  });
}

const calls = () => vi.mocked(fetch).mock.calls;
const writes = () => calls().filter(([, init]) => init?.method && init.method !== "GET");
const bodyOf = (call: (typeof calls extends () => infer R ? R : never)[number]) => JSON.parse(String(call[1]?.body));
const listRequests = () => calls().filter(([url]) => String(url).startsWith("/api/employees?"));
const filterRequests = () => calls().filter(([url]) => String(url).includes("/filters"));
const dialog = () => within(screen.getByRole("dialog"));

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <EmployeesPage />
    </QueryClientProvider>,
  );
}

async function openAddForm() {
  renderPage();
  await screen.findByText("Asha Rao");
  await userEvent.click(screen.getByRole("button", { name: "Add employee" }));
  await dialog().findByRole("option", { name: "India" });
}

async function fillValidForm() {
  const form = dialog();
  await userEvent.type(form.getByLabelText("Full name"), "Priya Nair");
  await userEvent.type(form.getByLabelText("Email"), "Priya@Acme.com");
  await userEvent.type(form.getByLabelText("Job title"), "Accountant");
  await userEvent.type(form.getByLabelText("Department"), "Finance");
  await userEvent.selectOptions(form.getByLabelText("Country"), "India");
  await userEvent.type(form.getByLabelText("Salary"), "1200000");
  fireEvent.change(form.getByLabelText("Hire date"), { target: { value: "2024-01-15" } });
}

const save = () => userEvent.click(dialog().getByRole("button", { name: "Save" }));

describe("adding, editing and deleting employees", () => {
  beforeEach(() => {
    failWrites = undefined;
    vi.stubGlobal("fetch", fakeApi());
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  describe("adding", () => {
    it("opens an empty form from the Add employee button", async () => {
      await openAddForm();

      expect(screen.getByRole("dialog", { name: "Add employee" })).toBeInTheDocument();
      expect(dialog().getByLabelText("Full name")).toHaveValue("");
    });

    it("sends the new employee, with the email in lowercase", async () => {
      await openAddForm();
      await fillValidForm();

      await save();

      await waitFor(() => expect(writes()).toHaveLength(1));
      const [url, init] = writes()[0]!;
      expect(url).toBe("/api/employees");
      expect(init?.method).toBe("POST");
      expect(bodyOf(writes()[0]!)).toEqual({
        fullName: "Priya Nair",
        email: "priya@acme.com",
        jobTitle: "Accountant",
        department: "Finance",
        country: "India",
        salary: 1_200_000,
        currency: "INR",
        hireDate: "2024-01-15",
      });
    });

    it("closes the form and confirms once it is saved", async () => {
      await openAddForm();
      await fillValidForm();

      await save();

      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
      expect(screen.getByRole("status")).toHaveTextContent("Employee added");
    });

    it("refreshes the table and the filter dropdowns after saving", async () => {
      await openAddForm();
      await fillValidForm();
      const listBefore = listRequests().length;
      const filtersBefore = filterRequests().length;

      await save();

      await waitFor(() => expect(listRequests().length).toBeGreaterThan(listBefore));
      await waitFor(() => expect(filterRequests().length).toBeGreaterThan(filtersBefore));
    });

    it("shows what is wrong and sends nothing when the form is incomplete", async () => {
      await openAddForm();

      await save();

      const form = dialog();
      expect(await form.findByText("Full name is required")).toBeInTheDocument();
      expect(form.getByText("Email is required")).toBeInTheDocument();
      expect(form.getByText("Country is required")).toBeInTheDocument();
      expect(form.getByText("Salary must be a number")).toBeInTheDocument();
      expect(writes()).toHaveLength(0);
    });

    it("ties each message to its field for screen readers", async () => {
      await openAddForm();
      await userEvent.type(dialog().getByLabelText("Email"), "nope");

      await save();

      const email = dialog().getByLabelText("Email");
      expect(email).toBeInvalid();
      expect(email).toHaveAccessibleDescription("Invalid email address");
    });

    it("shows the server's answer under the email when it is already used", async () => {
      failWrites = { status: 409, body: { error: "An employee with this email already exists" } };
      await openAddForm();
      await fillValidForm();

      await save();

      expect(await dialog().findByText("An employee with this email already exists")).toBeInTheDocument();
      expect(dialog().getByLabelText("Email")).toHaveAccessibleDescription("An employee with this email already exists");
    });

    it("keeps the form open with a general message when the server fails", async () => {
      failWrites = { status: 500, body: { error: "Internal server error" } };
      await openAddForm();
      await fillValidForm();

      await save();

      expect(await dialog().findByText("Could not save the employee. Please try again.")).toBeInTheDocument();
      expect(dialog().getByLabelText("Full name")).toHaveValue("Priya Nair");
    });

    it("suggests the country's currency, which can still be changed", async () => {
      await openAddForm();
      const form = dialog();

      await userEvent.selectOptions(form.getByLabelText("Country"), "India");
      expect(form.getByLabelText("Currency")).toHaveValue("INR");

      await userEvent.selectOptions(form.getByLabelText("Country"), "United States");
      expect(form.getByLabelText("Currency")).toHaveValue("USD");

      await userEvent.selectOptions(form.getByLabelText("Currency"), "EUR");
      expect(form.getByLabelText("Currency")).toHaveValue("EUR");
    });

    it("limits the hire date to today", async () => {
      await openAddForm();

      expect(dialog().getByLabelText("Hire date")).toHaveAttribute("max", new Date().toISOString().slice(0, 10));
    });

    it("lists every supported country, even one with no employees yet", async () => {
      await openAddForm();

      expect(dialog().getByRole("option", { name: "Brazil" })).toBeInTheDocument();
      expect(dialog().getByRole("option", { name: "Singapore" })).toBeInTheDocument();
    });

    it("also lists a country that is already in the data", async () => {
      await openAddForm();

      expect(dialog().getByRole("option", { name: "Switzerland" })).toBeInTheDocument();
    });

    it("does not offer free-text countries", async () => {
      await openAddForm();

      expect(dialog().queryByRole("option", { name: /other/i })).not.toBeInTheDocument();
      expect(dialog().queryByLabelText(/new country/i)).not.toBeInTheDocument();
    });

    it("can add the first employee in a country that has none yet", async () => {
      await openAddForm();
      await fillValidForm();

      await userEvent.selectOptions(dialog().getByLabelText("Country"), "Brazil");
      expect(dialog().getByLabelText("Currency")).toHaveValue("BRL");
      await save();

      await waitFor(() => expect(writes()).toHaveLength(1));
      expect(bodyOf(writes()[0]!)).toMatchObject({ country: "Brazil", currency: "BRL" });
    });

    it("closes with Cancel without sending anything", async () => {
      await openAddForm();
      await fillValidForm();

      await userEvent.click(dialog().getByRole("button", { name: "Cancel" }));

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(writes()).toHaveLength(0);
    });

    it("closes with the Escape key", async () => {
      await openAddForm();

      await userEvent.keyboard("{Escape}");

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  describe("editing", () => {
    async function openEditForm() {
      renderPage();
      await screen.findByText("Asha Rao");
      await userEvent.click(screen.getByRole("button", { name: "Edit Asha Rao" }));
      await dialog().findByRole("option", { name: "India" });
    }

    it("opens the form filled in with the employee's details", async () => {
      await openEditForm();
      const form = dialog();

      expect(screen.getByRole("dialog", { name: "Edit employee" })).toBeInTheDocument();
      expect(form.getByLabelText("Full name")).toHaveValue("Asha Rao");
      expect(form.getByLabelText("Email")).toHaveValue("asha@acme.com");
      expect(form.getByLabelText("Country")).toHaveValue("India");
      expect(form.getByLabelText("Salary")).toHaveValue(2_400_000);
      expect(form.getByLabelText("Currency")).toHaveValue("INR");
      expect(form.getByLabelText("Hire date")).toHaveValue("2022-03-14");
    });

    it("saves the change for that employee and confirms it", async () => {
      await openEditForm();
      const salary = dialog().getByLabelText("Salary");
      await userEvent.clear(salary);
      await userEvent.type(salary, "3000000");

      await save();

      await waitFor(() => expect(writes()).toHaveLength(1));
      const [url, init] = writes()[0]!;
      expect(url).toBe("/api/employees/1");
      expect(init?.method).toBe("PUT");
      expect(bodyOf(writes()[0]!)).toMatchObject({ fullName: "Asha Rao", salary: 3_000_000, hireDate: "2022-03-14" });
      expect(await screen.findByRole("status")).toHaveTextContent("Employee updated");
    });

    it("does not change the currency when the country is already set", async () => {
      await openEditForm();

      await save();

      await waitFor(() => expect(writes()).toHaveLength(1));
      expect(bodyOf(writes()[0]!)).toMatchObject({ country: "India", currency: "INR" });
    });
  });

  describe("deleting", () => {
    async function askToDelete() {
      renderPage();
      await screen.findByText("Asha Rao");
      await userEvent.click(screen.getByRole("button", { name: "Delete Asha Rao" }));
    }

    it("asks for confirmation and names the employee", async () => {
      await askToDelete();

      expect(screen.getByRole("dialog", { name: "Delete employee" })).toBeInTheDocument();
      expect(dialog().getByText(/delete asha rao\?/i)).toBeInTheDocument();
      expect(dialog().getByText(/this cannot be undone/i)).toBeInTheDocument();
      expect(writes()).toHaveLength(0);
    });

    it("deletes that employee once confirmed", async () => {
      await askToDelete();

      await userEvent.click(dialog().getByRole("button", { name: "Delete" }));

      await waitFor(() => expect(writes()).toHaveLength(1));
      const [url, init] = writes()[0]!;
      expect(url).toBe("/api/employees/1");
      expect(init?.method).toBe("DELETE");
      expect(await screen.findByRole("status")).toHaveTextContent("Employee deleted");
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("sends nothing when cancelled", async () => {
      await askToDelete();

      await userEvent.click(dialog().getByRole("button", { name: "Cancel" }));

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(writes()).toHaveLength(0);
    });

    it("keeps the dialog open with a message when the delete fails", async () => {
      failWrites = { status: 500 };
      await askToDelete();

      await userEvent.click(dialog().getByRole("button", { name: "Delete" }));

      expect(await dialog().findByText("Could not delete the employee. Please try again.")).toBeInTheDocument();
    });

    it("refreshes the table and the filter dropdowns after deleting", async () => {
      await askToDelete();
      const listBefore = listRequests().length;
      const filtersBefore = filterRequests().length;

      await userEvent.click(dialog().getByRole("button", { name: "Delete" }));

      await waitFor(() => expect(listRequests().length).toBeGreaterThan(listBefore));
      await waitFor(() => expect(filterRequests().length).toBeGreaterThan(filtersBefore));
    });

    it("steps back a page when the last employee on the last page is deleted", async () => {
      renderPage();
      await screen.findByText("Asha Rao");
      await userEvent.click(screen.getByRole("button", { name: /next/i }));
      await screen.findByText("Lena Fischer");
      await userEvent.click(screen.getByRole("button", { name: "Delete Lena Fischer" }));

      await userEvent.click(dialog().getByRole("button", { name: "Delete" }));

      await waitFor(() => {
        const last = listRequests().at(-1)!;
        expect(new URL(String(last[0]), "http://localhost").searchParams.get("page")).toBe("1");
      });
    });
  });
});
