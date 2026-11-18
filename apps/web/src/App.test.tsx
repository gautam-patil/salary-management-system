import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Employee } from "@acme/shared";
import { App } from "./App";

const asha: Employee = {
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
};

const summary = {
  count: 1,
  min: 28_800,
  avg: 28_800,
  median: 28_800,
  max: 28_800,
  totalPayrollUsd: 28_800,
  countries: 1,
  departments: 1,
};

const respond = (body: unknown) => ({ ok: true, json: async () => body });

function fakeApi() {
  return vi.fn(async (url: string) => {
    const { pathname } = new URL(url, "http://localhost");

    if (pathname === "/api/employees/filters") return respond({ countries: ["India"], departments: ["Engineering"], jobTitles: ["Software Engineer"] });
    if (pathname === "/api/employees") return respond({ items: [asha], total: 1, page: 1, pageSize: 25, totalPages: 1 });
    if (pathname === "/api/insights/summary") return respond(summary);
    if (pathname === "/api/insights/groups") return respond([]);
    if (pathname === "/api/insights/distribution") return respond([]);
    throw new Error(`unexpected request ${url}`);
  });
}

describe("App", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", fakeApi());
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("opens on the Employees tab", async () => {
    render(<App />);

    expect(screen.getByRole("tab", { name: "Employees" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tab", { name: "Insights" })).toHaveAttribute("aria-selected", "false");
    expect(await screen.findByText("Asha Rao")).toBeInTheDocument();
  });

  it("does not ask for insights until the Insights tab is opened", async () => {
    render(<App />);
    await screen.findByText("Asha Rao");

    const urls = vi.mocked(fetch).mock.calls.map((c) => String(c[0]));
    expect(urls.some((u) => u.includes("/api/insights"))).toBe(false);
  });

  it("shows the insights when the Insights tab is chosen", async () => {
    render(<App />);
    await screen.findByText("Asha Rao");

    await userEvent.click(screen.getByRole("tab", { name: "Insights" }));

    expect(screen.getByRole("tab", { name: "Insights" })).toHaveAttribute("aria-selected", "true");
    expect(await screen.findByRole("group", { name: "Median salary" })).toBeInTheDocument();
    expect(screen.getByRole("tabpanel", { name: "Insights" })).toBeVisible();

    // a hidden panel has no accessible name, so find it through the tab that controls it
    const employeesPanelId = screen.getByRole("tab", { name: "Employees" }).getAttribute("aria-controls")!;
    expect(document.getElementById(employeesPanelId)).not.toBeVisible();
  });

  it("keeps the search and filters when going to Insights and back", async () => {
    render(<App />);
    await screen.findByText("Asha Rao");
    await userEvent.type(screen.getByRole("searchbox", { name: /search/i }), "asha");

    await userEvent.click(screen.getByRole("tab", { name: "Insights" }));
    await userEvent.click(screen.getByRole("tab", { name: "Employees" }));

    expect(screen.getByRole("searchbox", { name: /search/i })).toHaveValue("asha");
  });
});
