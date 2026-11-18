import { describe, it, expect } from "vitest";
import request from "supertest";
import { APP_NAME } from "@acme/shared";
import { createApp } from "./app.js";

describe("GET /api/health", () => {
  it("returns ok and the app name from the shared package", async () => {
    const res = await request(createApp()).get("/api/health");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok", app: APP_NAME });
  });
});
