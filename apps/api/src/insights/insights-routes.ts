import { Router } from "express";
import { groupsQuerySchema, type DistributionBand, type GroupBy, type GroupStats, type Summary } from "@acme/shared";
import { distribution, groupStats, summarize } from "../domain/stats.js";
import { validateQuery } from "../middleware/validate.js";
import { listSalaryRows } from "./insights-repository.js";

export const insightsRouter = Router();

insightsRouter.get("/summary", async (_req, res) => {
  const body: Summary = summarize(await listSalaryRows());
  res.json(body);
});

insightsRouter.get("/groups", validateQuery(groupsQuerySchema), async (_req, res) => {
  const { by }: { by: GroupBy } = res.locals.query;
  const body: GroupStats[] = groupStats(await listSalaryRows(), by);
  res.json(body);
});

insightsRouter.get("/distribution", async (_req, res) => {
  const body: DistributionBand[] = distribution(await listSalaryRows());
  res.json(body);
});
