import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { DistributionBand, GroupStats, Summary } from "@acme/shared";
import { InsightsPage } from "./InsightsPage";

const summary: Summary = {
  count: 6,
  min: 28_800,
  avg: 79_617,
  median: 77_000,
  max: 140_000,
  totalPayrollUsd: 477_700,
  countries: 4,
  departments: 3,
};

const stats = (group: string, count: number, over: Partial<GroupStats> = {}): GroupStats => ({
  group,
  count,
  min: 54_000,
  avg: 81_000,
  median: 81_000,
  max: 108_000,
  totalUsd: 162_000,
  ...over,
});

const byCountry = [
  stats("Germany", 2),
  stats("United States", 2, { min: 100_000, avg: 120_000, median: 120_000, max: 140_000, totalUsd: 240_000 }),
  stats("India", 1, { min: 28_800, avg: 28_800, median: 28_800, max: 28_800, totalUsd: 28_800 }),
];
const byDepartment = [stats("Engineering", 3, { avg: 87_333 }), stats("Sales", 2)];

const bands: DistributionBand[] = [
  { label: "< $40k", from: 0, to: 40_000, count: 1 },
  { label: "$40k-$80k", from: 40_000, to: 80_000, count: 2 },
  { label: "$80k-$120k", from: 80_000, to: 120_000, count: 2 },
  { label: "$120k-$160k", from: 120_000, to: 160_000, count: 1 },
  { label: "$160k-$200k", from: 160_000, to: 200_000, count: 0 },
  { label: "$200k+", from: 200_000, to: null, count: 0 },
];

const respond = (body: unknown) => ({ ok: true, json: async () => body });

function fakeApi() {
  return vi.fn(async (url: string) => {
    const { pathname, searchParams } = new URL(url, "http://localhost");

    if (pathname === "/api/insights/summary") return respond(summary);
    if (pathname === "/api/insights/distribution") return respond(bands);
    if (pathname === "/api/insights/groups") return respond(searchParams.get("by") === "department" ? byDepartment : byCountry);
    throw new Error(`unexpected request ${url}`);
  });
}

const requested = () => vi.mocked(fetch).mock.calls.map((call) => String(call[0]));

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <InsightsPage />
    </QueryClientProvider>,
  );
}

const card = (name: string) => within(screen.getByRole("group", { name }));

describe("InsightsPage", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", fakeApi());
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  describe("summary cards", () => {
    it("shows the headline numbers in USD", async () => {
      renderPage();

      expect(await card("Employees").findByText("6")).toBeInTheDocument();
      expect(card("Total payroll").getByText("$477,700")).toBeInTheDocument();
      expect(card("Average salary").getByText("$79,617")).toBeInTheDocument();
      expect(card("Median salary").getByText("$77,000")).toBeInTheDocument();
    });

    it("mentions how many countries and departments there are", async () => {
      renderPage();

      expect(await card("Employees").findByText(/4 countries/)).toBeInTheDocument();
      expect(card("Employees").getByText(/3 departments/)).toBeInTheDocument();
    });

    it("shows a loading message first", () => {
      renderPage();

      expect(card("Employees").getByText(/loading/i)).toBeInTheDocument();
    });

    it("says so when the summary cannot be loaded, without hiding the rest of the page", async () => {
      vi.stubGlobal("fetch", vi.fn(async (url: string) => (String(url).includes("summary") ? { ok: false, status: 500, json: async () => ({}) } : fakeApi()(url))));

      renderPage();

      expect(await screen.findByText(/could not load the summary/i)).toBeInTheDocument();
      expect(await screen.findByRole("table", { name: /by country/i })).toBeInTheDocument();
    });
  });

  describe("breakdown by group", () => {
    it("starts with country and shows every group in a table", async () => {
      renderPage();

      const table = await screen.findByRole("table", { name: /salary statistics by country/i });
      expect(within(table).getAllByRole("row")).toHaveLength(4); // header + 3 groups
      expect(within(table).getByText("Germany")).toBeInTheDocument();
      expect(within(table).getByText("India")).toBeInTheDocument();
    });

    it("shows each group's statistics as USD", async () => {
      renderPage();

      const table = await screen.findByRole("table", { name: /by country/i });
      const row = within(table).getByRole("row", { name: /united states/i });

      expect(within(row).getByText("$100,000")).toBeInTheDocument(); // min
      expect(within(row).getAllByText("$120,000")).toHaveLength(2); // average and median
      expect(within(row).getByText("$140,000")).toBeInTheDocument(); // max
      expect(within(row).getByText("$240,000")).toBeInTheDocument(); // total payroll
    });

    it("loads another grouping when it is chosen", async () => {
      renderPage();
      await screen.findByRole("table", { name: /by country/i });

      await userEvent.selectOptions(screen.getByRole("combobox", { name: /group by/i }), "Department");

      const table = await screen.findByRole("table", { name: /salary statistics by department/i });
      expect(requested()).toContain("/api/insights/groups?by=department");
      expect(within(table).getByText("Engineering")).toBeInTheDocument();
    });

    it("offers country, department and job title", async () => {
      renderPage();
      await screen.findByRole("table", { name: /by country/i });

      const options = within(screen.getByRole("combobox", { name: /group by/i })).getAllByRole("option");

      expect(options.map((o) => o.textContent)).toEqual(["Country", "Department", "Job title"]);
    });

    it("shows every group in the table, however many there are", async () => {
      const twelve = Array.from({ length: 12 }, (_, i) => stats(`Role ${i + 1}`, 100 - i));
      vi.stubGlobal("fetch", vi.fn(async (url: string) => (String(url).includes("groups") ? respond(twelve) : fakeApi()(url))));

      renderPage();

      const table = await screen.findByRole("table", { name: /by country/i });
      expect(within(table).getAllByRole("row")).toHaveLength(13);
    });

    it("says so when there are no groups yet", async () => {
      vi.stubGlobal("fetch", vi.fn(async (url: string) => (String(url).includes("groups") ? respond([]) : fakeApi()(url))));

      renderPage();

      expect(await screen.findByText(/no employees yet/i)).toBeInTheDocument();
    });

    it("says so when the groups cannot be loaded", async () => {
      vi.stubGlobal("fetch", vi.fn(async (url: string) => (String(url).includes("groups") ? { ok: false, status: 500, json: async () => ({}) } : fakeApi()(url))));

      renderPage();

      expect(await screen.findByText(/could not load the breakdown/i)).toBeInTheDocument();
    });
  });

  describe("salary distribution", () => {
    it("lists every band with its head count", async () => {
      renderPage();

      const table = await screen.findByRole("table", { name: /employees per salary band/i });
      const rows = within(table).getAllByRole("row").slice(1);

      expect(rows.map((r) => r.textContent)).toEqual([
        "< $40k1",
        "$40k-$80k2",
        "$80k-$120k2",
        "$120k-$160k1",
        "$160k-$200k0",
        "$200k+0",
      ]);
    });

    it("says so when the distribution cannot be loaded", async () => {
      vi.stubGlobal("fetch", vi.fn(async (url: string) => (String(url).includes("distribution") ? { ok: false, status: 500, json: async () => ({}) } : fakeApi()(url))));

      renderPage();

      expect(await screen.findByText(/could not load the distribution/i)).toBeInTheDocument();
    });
  });

  it("explains that every amount is in USD at fixed rates", async () => {
    renderPage();

    expect(await screen.findByText(/all amounts are in usd/i)).toBeInTheDocument();
  });
});
