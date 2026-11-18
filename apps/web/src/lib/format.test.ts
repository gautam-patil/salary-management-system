import { describe, expect, it } from "vitest";
import { formatDate, formatSalary, formatUsd } from "./format";

describe("formatSalary", () => {
  it("shows an amount in its own currency, without decimals", () => {
    expect(formatSalary(2_400_000, "INR")).toBe("₹2,400,000");
    expect(formatSalary(98_800, "USD")).toBe("$98,800");
    expect(formatSalary(70_000, "EUR")).toBe("€70,000");
  });
});

describe("formatUsd", () => {
  it("shows whole dollars with separators", () => {
    expect(formatUsd(79_617)).toBe("$79,617");
    expect(formatUsd(0)).toBe("$0");
  });
});

describe("formatDate", () => {
  it("keeps the date part of an ISO timestamp", () => {
    expect(formatDate("2022-03-14T00:00:00.000Z")).toBe("2022-03-14");
  });
});
