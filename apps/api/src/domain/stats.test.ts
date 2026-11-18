import { describe, expect, it } from "vitest";
import { computeStats, distribution, groupStats, summarize, type SalaryRow } from "./stats.js";

const row = (over: Partial<SalaryRow> = {}): SalaryRow => ({
  country: "United States",
  department: "Engineering",
  jobTitle: "Software Engineer",
  salary: 100_000,
  currency: "USD",
  ...over,
});

describe("computeStats", () => {
  it("returns zeros when there is nothing to measure", () => {
    expect(computeStats([])).toEqual({ count: 0, min: 0, avg: 0, median: 0, max: 0 });
  });

  it("handles a single value", () => {
    expect(computeStats([50])).toEqual({ count: 1, min: 50, avg: 50, median: 50, max: 50 });
  });

  it("finds the minimum, average and maximum", () => {
    expect(computeStats([10, 20, 60])).toEqual({ count: 3, min: 10, avg: 30, median: 20, max: 60 });
  });

  it("uses the middle value as the median of an odd count", () => {
    expect(computeStats([30, 10, 20]).median).toBe(20);
  });

  it("averages the two middle values for an even count", () => {
    expect(computeStats([10, 20, 30, 40]).median).toBe(25);
  });

  it("rounds to whole numbers", () => {
    expect(computeStats([1, 2]).avg).toBe(2);
    expect(computeStats([1, 2]).median).toBe(2);
  });

  it("shows why the median matters: one outlier drags the average but not the median", () => {
    const stats = computeStats([100, 100, 100, 100, 10_000]);

    expect(stats.median).toBe(100);
    expect(stats.avg).toBe(2_080);
  });

  it("does not change the list it is given", () => {
    const input = [3, 1, 2];

    computeStats(input);

    expect(input).toEqual([3, 1, 2]);
  });
});

describe("groupStats", () => {
  it("converts salaries to USD before grouping", () => {
    const rows = [
      row({ country: "Germany", salary: 50_000, currency: "EUR" }), // 54,000 USD
      row({ country: "Germany", salary: 100_000, currency: "EUR" }), // 108,000 USD
      row({ country: "United States", salary: 90_000 }),
    ];

    const germany = groupStats(rows, "country").find((g) => g.group === "Germany");

    expect(germany).toEqual({
      group: "Germany",
      count: 2,
      min: 54_000,
      avg: 81_000,
      median: 81_000,
      max: 108_000,
      totalUsd: 162_000,
    });
  });

  it("groups by department or job title when asked", () => {
    const rows = [
      row({ department: "Sales", jobTitle: "Rep" }),
      row({ department: "Sales", jobTitle: "Manager" }),
      row({ department: "Finance", jobTitle: "Rep" }),
    ];

    expect(groupStats(rows, "department").map((g) => g.group)).toEqual(["Sales", "Finance"]);
    expect(groupStats(rows, "jobTitle").map((g) => g.group)).toEqual(["Rep", "Manager"]);
  });

  it("lists the biggest group first, and breaks ties by name", () => {
    const rows = [
      row({ department: "Sales" }),
      row({ department: "Finance" }),
      row({ department: "Engineering" }),
      row({ department: "Engineering" }),
    ];

    expect(groupStats(rows, "department").map((g) => g.group)).toEqual(["Engineering", "Finance", "Sales"]);
  });

  it("returns nothing for no employees", () => {
    expect(groupStats([], "country")).toEqual([]);
  });

  it("the headcounts add up to the number of employees", () => {
    const rows = [row({ country: "India", currency: "INR" }), row(), row({ country: "India", currency: "INR" })];

    const total = groupStats(rows, "country").reduce((sum, g) => sum + g.count, 0);

    expect(total).toBe(3);
  });
});

describe("summarize", () => {
  it("reports the headline numbers in USD", () => {
    const rows = [
      row({ salary: 100_000 }),
      row({ salary: 200_000, currency: "EUR", country: "Germany", department: "Sales" }), // 216,000 USD
    ];

    expect(summarize(rows)).toEqual({
      count: 2,
      min: 100_000,
      avg: 158_000,
      median: 158_000,
      max: 216_000,
      totalPayrollUsd: 316_000,
      countries: 2,
      departments: 2,
    });
  });

  it("counts each country and department once", () => {
    const rows = [row(), row(), row({ department: "Sales" })];

    expect(summarize(rows)).toMatchObject({ countries: 1, departments: 2 });
  });

  it("handles an organisation with no employees", () => {
    expect(summarize([])).toEqual({
      count: 0,
      min: 0,
      avg: 0,
      median: 0,
      max: 0,
      totalPayrollUsd: 0,
      countries: 0,
      departments: 0,
    });
  });
});

describe("distribution", () => {
  const countIn = (rows: SalaryRow[], label: string) => distribution(rows).find((b) => b.label === label)?.count;

  it("counts employees into USD salary bands", () => {
    const rows = [row({ salary: 20_000 }), row({ salary: 60_000 }), row({ salary: 65_000 }), row({ salary: 500_000 })];

    expect(countIn(rows, "< $40k")).toBe(1);
    expect(countIn(rows, "$40k-$80k")).toBe(2);
    expect(countIn(rows, "$200k+")).toBe(1);
  });

  it("converts to USD before choosing a band", () => {
    // 5,000,000 INR is 60,000 USD
    expect(countIn([row({ salary: 5_000_000, currency: "INR" })], "$40k-$80k")).toBe(1);
  });

  it("puts a value exactly on a boundary in the higher band", () => {
    expect(countIn([row({ salary: 80_000 })], "$80k-$120k")).toBe(1);
    expect(countIn([row({ salary: 79_999 })], "$40k-$80k")).toBe(1);
  });

  it("always returns every band, in order, even when empty", () => {
    expect(distribution([]).map((b) => b.label)).toEqual(["< $40k", "$40k-$80k", "$80k-$120k", "$120k-$160k", "$160k-$200k", "$200k+"]);
    expect(distribution([]).every((b) => b.count === 0)).toBe(true);
  });

  it("puts every employee in exactly one band", () => {
    const rows = Array.from({ length: 50 }, (_, i) => row({ salary: 10_000 + i * 7_000 }));

    expect(distribution(rows).reduce((sum, b) => sum + b.count, 0)).toBe(50);
  });
});
