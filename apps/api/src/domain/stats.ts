import { convertToUsd, type DistributionBand, type GroupBy, type GroupStats, type SalaryStats, type Summary } from "@acme/shared";

// just the columns the calculations need, so they do not depend on the database
export interface SalaryRow {
  country: string;
  department: string;
  jobTitle: string;
  salary: number;
  currency: string;
}

const toUsd = (row: SalaryRow) => convertToUsd(row.salary, row.currency);
const sum = (values: number[]) => values.reduce((total, value) => total + value, 0);

export function computeStats(values: number[]): SalaryStats {
  if (values.length === 0) return { count: 0, min: 0, avg: 0, median: 0, max: 0 };

  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 === 1 ? sorted[middle]! : (sorted[middle - 1]! + sorted[middle]!) / 2;

  return {
    count: sorted.length,
    min: sorted[0]!,
    avg: Math.round(sum(sorted) / sorted.length),
    median: Math.round(median),
    max: sorted[sorted.length - 1]!,
  };
}

export function groupStats(rows: SalaryRow[], by: GroupBy): GroupStats[] {
  const groups = new Map<string, number[]>();
  for (const row of rows) {
    groups.set(row[by], [...(groups.get(row[by]) ?? []), toUsd(row)]);
  }

  return [...groups.entries()]
    .map(([group, values]) => ({ group, ...computeStats(values), totalUsd: sum(values) }))
    .sort((a, b) => b.count - a.count || a.group.localeCompare(b.group));
}

export function summarize(rows: SalaryRow[]): Summary {
  const values = rows.map(toUsd);

  return {
    ...computeStats(values),
    totalPayrollUsd: sum(values),
    countries: new Set(rows.map((row) => row.country)).size,
    departments: new Set(rows.map((row) => row.department)).size,
  };
}

// lower edge of each USD band; a value on an edge belongs to the band above it
const BAND_EDGES = [0, 40_000, 80_000, 120_000, 160_000, 200_000];

function bandLabel(from: number, to: number | null) {
  const k = (amount: number) => `$${amount / 1000}k`;

  if (from === 0) return `< ${k(to!)}`;
  if (to === null) return `${k(from)}+`;
  return `${k(from)}-${k(to)}`;
}

export function distribution(rows: SalaryRow[]): DistributionBand[] {
  const bands = BAND_EDGES.map((from, i) => {
    const to = BAND_EDGES[i + 1] ?? null;
    return { label: bandLabel(from, to), from, to, count: 0 };
  });

  for (const row of rows) {
    const usd = toUsd(row);
    const band = bands.find((b) => usd >= b.from && (b.to === null || usd < b.to));
    if (band) band.count += 1;
  }
  return bands;
}
