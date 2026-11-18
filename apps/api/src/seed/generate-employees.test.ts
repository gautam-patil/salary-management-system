import { describe, expect, it } from "vitest";
import { generateEmployees } from "./generate-employees.js";

describe("generateEmployees", () => {
  it("returns the requested number of employees", () => {
    expect(generateEmployees(250)).toHaveLength(250);
  });

  it("gives identical output for the same seed", () => {
    expect(generateEmployees(50, 7)).toEqual(generateEmployees(50, 7));
  });

  it("gives different output for a different seed", () => {
    expect(generateEmployees(50, 1)).not.toEqual(generateEmployees(50, 2));
  });

  it("generates a unique email for every employee", () => {
    const emails = generateEmployees(10_000).map((e) => e.email);

    expect(new Set(emails).size).toBe(10_000);
  });

  it("uses the currency of the employee's country", () => {
    const currencyByCountry = new Map<string, string>();

    for (const e of generateEmployees(2_000)) {
      const seen = currencyByCountry.get(e.country);
      if (seen) expect(e.currency).toBe(seen);
      else currencyByCountry.set(e.country, e.currency);
    }

    expect(currencyByCountry.get("India")).toBe("INR");
    expect(currencyByCountry.get("Germany")).toBe("EUR");
  });

  it("produces positive whole-number salaries", () => {
    for (const e of generateEmployees(2_000)) {
      expect(Number.isInteger(e.salary)).toBe(true);
      expect(e.salary).toBeGreaterThan(0);
    }
  });

  it("never produces a hire date in the future", () => {
    const now = new Date();

    for (const e of generateEmployees(2_000)) {
      expect(e.hireDate.getTime()).toBeLessThanOrEqual(now.getTime());
    }
  });

  it("spreads employees across several countries and departments", () => {
    const employees = generateEmployees(2_000);

    expect(new Set(employees.map((e) => e.country)).size).toBeGreaterThanOrEqual(8);
    expect(new Set(employees.map((e) => e.department)).size).toBeGreaterThanOrEqual(5);
  });

  it("pays the same role less in a lower-cost country", () => {
    const avg = (country: string) => {
      const pay = generateEmployees(10_000)
        .filter((e) => e.country === country && e.jobTitle === "Software Engineer")
        .map((e) => e.salary / (e.currency === "INR" ? 83 : 1));
      return pay.reduce((a, b) => a + b, 0) / pay.length;
    };

    expect(avg("India")).toBeLessThan(avg("United States"));
  });
});
