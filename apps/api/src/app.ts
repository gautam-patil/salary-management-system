import express from "express";
import helmet from "helmet";
import { APP_NAME } from "@acme/shared";
import { employeeRouter } from "./employees/employee-routes.js";

export function createApp() {
  const app = express();
  app.use(helmet());
  app.use(express.json());

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", app: APP_NAME });
  });
  app.use("/api/employees", employeeRouter);

  return app;
}
