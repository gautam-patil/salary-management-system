export const CURRENCIES = ["USD", "EUR", "GBP", "INR", "CAD", "AUD", "SGD", "JPY", "BRL"] as const;

export type Currency = (typeof CURRENCIES)[number];
