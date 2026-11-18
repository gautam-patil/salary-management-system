import express from "express";
import helmet from "helmet";
import { APP_NAME } from "@acme/shared";

export function createApp() {
  const app = express();
  app.use(helmet());
  app.use(express.json());

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", app: APP_NAME });
  });

  return app;
}
