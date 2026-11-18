import { describe, expect, it } from "vitest";
import {
  COUNTRIES,
  CURRENCIES,
  DEFAULT_CURRENCY_BY_COUNTRY,
  SUPPORTED_COUNTRIES,
  convertToUsd,
} from "./reference-data.js";

describe("convertToUsd", () => {
  it("leaves dollars unchanged", () => {
    expect(convertToUsd(100_000, "USD")).toBe(100_000);
  });

  it("converts with the rate in the table", () => {
    expect(convertToUsd(50_000, "EUR")).toBe(54_000);
    expect(convertToUsd(2_400_000, "INR")).toBe(28_800);
    expect(convertToUsd(7_000_000, "JPY")).toBe(46_900);
  });

  it("rounds to whole dollars", () => {
    expect(convertToUsd(1, "GBP")).toBe(1);
    expect(convertToUsd(1, "JPY")).toBe(0);
  });

  it("throws for a currency it has no rate for, instead of guessing", () => {
    expect(() => convertToUsd(1, "XXX")).toThrow(/unsupported currency/i);
  });

  it("does not mistake object properties for currencies", () => {
    expect(() => convertToUsd(1, "constructor")).toThrow(/unsupported currency/i);
  });
});

describe("the reference data hangs together", () => {
  it("has a rate for every supported currency", () => {
    for (const currency of CURRENCIES) {
      expect(convertToUsd(1_000_000, currency)).toBeGreaterThan(0);
    }
  });

  it("only gives countries a currency that has a rate", () => {
    for (const { currency } of COUNTRIES) {
      expect(CURRENCIES).toContain(currency);
    }
  });

  it("lists the nine supported currencies", () => {
    expect([...CURRENCIES].sort()).toEqual(["AUD", "BRL", "CAD", "EUR", "GBP", "INR", "JPY", "SGD", "USD"]);
  });
});

describe("DEFAULT_CURRENCY_BY_COUNTRY", () => {
  it("suggests the local currency for a known country", () => {
    expect(DEFAULT_CURRENCY_BY_COUNTRY["India"]).toBe("INR");
    expect(DEFAULT_CURRENCY_BY_COUNTRY["Germany"]).toBe("EUR");
    expect(DEFAULT_CURRENCY_BY_COUNTRY["United States"]).toBe("USD");
  });

  it("has no suggestion for an unknown country", () => {
    expect(DEFAULT_CURRENCY_BY_COUNTRY["Atlantis"]).toBeUndefined();
  });
});

describe("SUPPORTED_COUNTRIES", () => {
  it("lists every country, in alphabetical order", () => {
    expect(SUPPORTED_COUNTRIES).toEqual(COUNTRIES.map((c) => c.name).sort());
  });

  it("includes countries with no employees yet", () => {
    expect(SUPPORTED_COUNTRIES).toContain("Brazil");
    expect(SUPPORTED_COUNTRIES).toHaveLength(10);
  });
});
