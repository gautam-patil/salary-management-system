import { existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import helmet from "helmet";
import { APP_NAME } from "@acme/shared";
import { employeeRouter } from "./employees/employee-routes.js";
import { insightsRouter } from "./insights/insights-routes.js";
import { errorHandler } from "./middleware/error-handler.js";

const defaultWebDist = fileURLToPath(new URL("../../web/dist", import.meta.url));

export function createApp({ webDist = defaultWebDist }: { webDist?: string } = {}) {
  const app = express();
  app.use(helmet());
  app.use(express.json());

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", app: APP_NAME });
  });
  app.use("/api/employees", employeeRouter);
  app.use("/api/insights", insightsRouter);
  app.use("/api", (_req, res) => {
    res.status(404).json({ error: "Not found" });
  });

  // only in production, once the web app has been built
  const indexHtml = join(webDist, "index.html");
  if (existsSync(indexHtml)) {
    app.use(express.static(webDist));
    app.get("/{*path}", (_req, res) => {
      res.sendFile(indexHtml);
    });
  }

  app.use(errorHandler);

  return app;
}
