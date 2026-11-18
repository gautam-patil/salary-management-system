// Static on purpose: the one place to add a currency or a country.

// illustrative USD value of one unit of each currency
const USD_PER_UNIT = {
  USD: 1,
  EUR: 1.08,
  GBP: 1.27,
  INR: 0.012,
  CAD: 0.74,
  AUD: 0.66,
  SGD: 0.74,
  JPY: 0.0067,
  BRL: 0.2,
} as const;

export type Currency = keyof typeof USD_PER_UNIT;

export const CURRENCIES = Object.keys(USD_PER_UNIT) as [Currency, ...Currency[]];

export const COUNTRIES: { name: string; currency: Currency }[] = [
  { name: "United States", currency: "USD" },
  { name: "India", currency: "INR" },
  { name: "United Kingdom", currency: "GBP" },
  { name: "Germany", currency: "EUR" },
  { name: "France", currency: "EUR" },
  { name: "Canada", currency: "CAD" },
  { name: "Australia", currency: "AUD" },
  { name: "Japan", currency: "JPY" },
  { name: "Brazil", currency: "BRL" },
  { name: "Singapore", currency: "SGD" },
];

// a suggestion for the form, not a rule: an employee can be paid in any supported currency
export const DEFAULT_CURRENCY_BY_COUNTRY: Record<string, Currency> = Object.fromEntries(
  COUNTRIES.map(({ name, currency }) => [name, currency]),
);

export const SUPPORTED_COUNTRIES = COUNTRIES.map((country) => country.name).sort();

export function convertToUsd(amount: number, currency: string): number {
  if (!Object.hasOwn(USD_PER_UNIT, currency)) throw new Error(`Unsupported currency: ${currency}`);

  return Math.round(amount * USD_PER_UNIT[currency as Currency]);
}

// how many units of a currency one US dollar buys
export function unitsPerUsd(currency: Currency): number {
  return 1 / USD_PER_UNIT[currency];
}
