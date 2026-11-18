import { describe, expect, it } from "vitest";
import { CURRENCIES, DEFAULT_CURRENCY_BY_COUNTRY, SUPPORTED_COUNTRIES } from "./currency.js";

describe("SUPPORTED_COUNTRIES", () => {
  it("lists every country that has a currency suggestion, in alphabetical order", () => {
    expect(SUPPORTED_COUNTRIES).toEqual(Object.keys(DEFAULT_CURRENCY_BY_COUNTRY).sort());
  });

  it("includes countries with no employees yet", () => {
    expect(SUPPORTED_COUNTRIES).toContain("Brazil");
    expect(SUPPORTED_COUNTRIES).toHaveLength(10);
  });
});

describe("DEFAULT_CURRENCY_BY_COUNTRY", () => {
  it("suggests the local currency for a known country", () => {
    expect(DEFAULT_CURRENCY_BY_COUNTRY["India"]).toBe("INR");
    expect(DEFAULT_CURRENCY_BY_COUNTRY["Germany"]).toBe("EUR");
    expect(DEFAULT_CURRENCY_BY_COUNTRY["United States"]).toBe("USD");
  });

  it("only suggests currencies the API accepts", () => {
    for (const currency of Object.values(DEFAULT_CURRENCY_BY_COUNTRY)) {
      expect(CURRENCIES).toContain(currency);
    }
  });

  it("has no suggestion for an unknown country", () => {
    expect(DEFAULT_CURRENCY_BY_COUNTRY["Atlantis"]).toBeUndefined();
  });
});
