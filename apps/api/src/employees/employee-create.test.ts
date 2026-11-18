import { afterAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../app.js";
import { prisma } from "../db/client.js";
import { resetDb } from "../db/test-helpers.js";

const app = createApp();

const asha = {
  fullName: "Asha Rao",
  email: "asha@acme.com",
  jobTitle: "Software Engineer",
  department: "Engineering",
  country: "India",
  salary: 2_400_000,
  currency: "INR",
  hireDate: "2022-03-14",
};

const post = (body: unknown) => request(app).post("/api/employees").send(body as object);
const futureDate = () => new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10);

describe("POST /api/employees", () => {
  beforeEach(resetDb);
  afterAll(() => prisma.$disconnect());

  describe("with valid data", () => {
    it("creates the employee and returns it with an id", async () => {
      const res = await post(asha);
      const { hireDate: _sent, ...rest } = asha;

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({ ...rest, id: expect.any(Number) });
      expect(res.body.hireDate).toBe("2022-03-14T00:00:00.000Z");
      expect(res.body.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it("saves it to the database", async () => {
      const res = await post(asha);

      const saved = await prisma.employee.findUnique({ where: { id: res.body.id } });
      expect(saved).toMatchObject({ fullName: "Asha Rao", salary: 2_400_000, currency: "INR" });
      expect(await prisma.employee.count()).toBe(1);
    });

    it("trims text and stores the email in lowercase", async () => {
      const res = await post({ ...asha, fullName: "  Asha Rao  ", email: " ASHA@Acme.com " });

      expect(res.body).toMatchObject({ fullName: "Asha Rao", email: "asha@acme.com" });
    });

    it("ignores fields the client should not set", async () => {
      const res = await post({ ...asha, id: 999, createdAt: "2000-01-01T00:00:00.000Z" });

      expect(res.body.id).not.toBe(999);
      expect(res.body.createdAt).not.toBe("2000-01-01T00:00:00.000Z");
    });
  });

  describe("with invalid data", () => {
    it.each([
      ["a missing name", { fullName: undefined }, "fullName"],
      ["a blank job title", { jobTitle: "  " }, "jobTitle"],
      ["an invalid email", { email: "not-an-email" }, "email"],
      ["a zero salary", { salary: 0 }, "salary"],
      ["a negative salary", { salary: -100 }, "salary"],
      ["a fractional salary", { salary: 1000.5 }, "salary"],
      ["a salary sent as text", { salary: "100000" }, "salary"],
      ["an unsupported currency", { currency: "XXX" }, "currency"],
      ["an unsupported country", { country: "Narnia" }, "country"],
      ["a badly formatted hire date", { hireDate: "14/03/2022" }, "hireDate"],
      ["a hire date in the future", { hireDate: futureDate() }, "hireDate"],
    ])("rejects %s", async (_label, change, field) => {
      const res = await post({ ...asha, ...change });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Invalid request body");
      expect(res.body.details).toEqual([{ field, message: expect.any(String) }]);
      expect(await prisma.employee.count()).toBe(0);
    });

    it("reports every problem at once", async () => {
      const res = await post({ ...asha, email: "nope", salary: -1 });

      expect(res.status).toBe(400);
      expect(res.body.details.map((d: { field: string }) => d.field).sort()).toEqual(["email", "salary"]);
    });

    it("rejects an empty body", async () => {
      const res = await post({});

      expect(res.status).toBe(400);
      expect(res.body.details.length).toBe(8);
    });

    it("rejects malformed JSON with a clean 400", async () => {
      const res = await request(app).post("/api/employees").set("Content-Type", "application/json").send("{ not json");

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: "Invalid JSON" });
    });
  });

  describe("duplicate email", () => {
    it("returns 409 and keeps only the first employee", async () => {
      await post(asha);

      const res = await post({ ...asha, fullName: "Someone Else" });

      expect(res.status).toBe(409);
      expect(res.body).toEqual({ error: "An employee with this email already exists" });
      expect(await prisma.employee.count()).toBe(1);
    });

    it("treats emails that differ only in case as the same", async () => {
      await post(asha);

      const res = await post({ ...asha, email: "ASHA@ACME.COM" });

      expect(res.status).toBe(409);
    });
  });
});
