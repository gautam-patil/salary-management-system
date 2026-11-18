import { afterEach, describe, expect, it, vi } from "vitest";
import express from "express";
import request from "supertest";
import { AppError } from "../errors.js";
import { errorHandler } from "./error-handler.js";

// a tiny app whose only route throws whatever it is told to
function appThrowing(error: unknown) {
  const app = express();
  app.get("/boom", () => {
    throw error;
  });
  app.use(errorHandler);
  return app;
}

describe("errorHandler", () => {
  afterEach(() => vi.restoreAllMocks());

  it("turns an AppError into its status and message", async () => {
    const res = await request(appThrowing(new AppError(409, "Already exists"))).get("/boom");

    expect(res.status).toBe(409);
    expect(res.body).toEqual({ error: "Already exists" });
  });

  it("includes the details of an AppError when it has them", async () => {
    const details = [{ field: "email", message: "Invalid email" }];

    const res = await request(appThrowing(new AppError(400, "Invalid request body", details))).get("/boom");

    expect(res.body).toEqual({ error: "Invalid request body", details });
  });

  it("hides the internals of an unexpected error", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});

    const res = await request(appThrowing(new Error("database password is hunter2"))).get("/boom");

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: "Internal server error" });
    expect(JSON.stringify(res.body)).not.toContain("hunter2");
  });

  it("logs unexpected errors so they can be investigated", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});

    await request(appThrowing(new Error("kaboom"))).get("/boom");

    expect(log).toHaveBeenCalled();
  });

  it("does not log expected errors", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});

    await request(appThrowing(new AppError(404, "Not found"))).get("/boom");

    expect(log).not.toHaveBeenCalled();
  });
});
