export interface SalaryStats {
  count: number;
  min: number;
  avg: number;
  median: number;
  max: number;
}

export type GroupBy = "country" | "department" | "jobTitle";

// every money figure in the insights is in USD
export interface GroupStats extends SalaryStats {
  group: string;
  totalUsd: number;
}

export interface Summary extends SalaryStats {
  totalPayrollUsd: number;
  countries: number;
  departments: number;
}

export interface DistributionBand {
  label: string;
  from: number;
  to: number | null;
  count: number;
}
