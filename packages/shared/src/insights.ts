import { z } from "zod";

export interface SalaryStats {
  count: number;
  min: number;
  avg: number;
  median: number;
  max: number;
}

export const GROUP_BY_FIELDS = ["country", "department", "jobTitle"] as const;
export type GroupBy = (typeof GROUP_BY_FIELDS)[number];

// query string of GET /api/insights/groups
export const groupsQuerySchema = z.object({ by: z.enum(GROUP_BY_FIELDS) });

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
