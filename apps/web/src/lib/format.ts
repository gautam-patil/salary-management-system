export function formatSalary(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export const formatUsd = (amount: number) => formatSalary(amount, "USD");

export function formatDate(iso: string) {
  return iso.slice(0, 10);
}
