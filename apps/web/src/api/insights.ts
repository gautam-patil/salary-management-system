import type { DistributionBand, GroupBy, GroupStats, Summary } from "@acme/shared";
import { getJson } from "./http";

export const fetchSummary = () => getJson<Summary>("/api/insights/summary");

export const fetchGroups = (by: GroupBy) => getJson<GroupStats[]>(`/api/insights/groups?by=${by}`);

export const fetchDistribution = () => getJson<DistributionBand[]>("/api/insights/distribution");
