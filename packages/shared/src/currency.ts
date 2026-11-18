export const CURRENCIES = ["USD", "EUR", "GBP", "INR", "CAD", "AUD", "SGD", "JPY", "BRL"] as const;

export type Currency = (typeof CURRENCIES)[number];

// a suggestion for the form, not a rule: an employee can be paid in any supported currency
export const DEFAULT_CURRENCY_BY_COUNTRY: Record<string, Currency> = {
  "United States": "USD",
  India: "INR",
  "United Kingdom": "GBP",
  Germany: "EUR",
  France: "EUR",
  Canada: "CAD",
  Australia: "AUD",
  Japan: "JPY",
  Brazil: "BRL",
  Singapore: "SGD",
};

export const SUPPORTED_COUNTRIES = Object.keys(DEFAULT_CURRENCY_BY_COUNTRY).sort();
