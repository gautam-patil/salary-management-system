import { afterAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../app.js";
import { prisma } from "../db/client.js";
import { resetDb } from "../db/test-helpers.js";

const app = createApp();

const OLD = new Date("2020-01-01T00:00:00.000Z");
const futureDate = () => new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10);

const base = {
  jobTitle: "Software Engineer",
  department: "Engineering",
  country: "India",
  salary: 2_400_000,
  currency: "INR",
  hireDate: new Date("2022-03-14"),
  createdAt: OLD,
  updatedAt: OLD,
};

let asha: { id: number };
let mike: { id: number };

// what the client sends to replace Asha's record
const change = (over: Record<string, unknown> = {}) => ({
  fullName: "Asha Rao-Iyer",
  email: "asha@acme.com",
  jobTitle: "Senior Software Engineer",
  department: "Engineering",
  country: "India",
  salary: 3_000_000,
  currency: "INR",
  hireDate: "2022-03-14",
  ...over,
});

const put = (id: number | string, body: unknown) => request(app).put(`/api/employees/${id}`).send(body as object);
const remove = (id: number | string) => request(app).delete(`/api/employees/${id}`);
const reload = (id: number) => prisma.employee.findUnique({ where: { id } });

describe("employee update and delete", () => {
  beforeEach(async () => {
    await resetDb();
    asha = await prisma.employee.create({ data: { ...base, fullName: "Asha Rao", email: "asha@acme.com" } });
    mike = await prisma.employee.create({
      data: { ...base, fullName: "Mike Brown", email: "mike@acme.com", country: "United States", currency: "USD", salary: 130_000 },
    });
  });
  afterAll(() => prisma.$disconnect());

  describe("PUT /api/employees/:id", () => {
    it("changes the employee and returns the new values", async () => {
      const res = await put(asha.id, change());

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ id: asha.id, fullName: "Asha Rao-Iyer", jobTitle: "Senior Software Engineer", salary: 3_000_000 });
      expect(await reload(asha.id)).toMatchObject({ fullName: "Asha Rao-Iyer", salary: 3_000_000 });
    });

    it("moves updatedAt forward and leaves createdAt alone", async () => {
      const res = await put(asha.id, change());

      expect(new Date(res.body.createdAt)).toEqual(OLD);
      expect(new Date(res.body.updatedAt).getTime()).toBeGreaterThan(OLD.getTime());
    });

    it("does not touch other employees", async () => {
      await put(asha.id, change());

      expect(await reload(mike.id)).toMatchObject({ fullName: "Mike Brown", salary: 130_000 });
    });

    it("trims text and lowercases the email", async () => {
      const res = await put(asha.id, change({ fullName: "  Asha  ", email: " Asha.New@Acme.com " }));

      expect(res.body).toMatchObject({ fullName: "Asha", email: "asha.new@acme.com" });
    });

    it("lets an employee keep their own email, whatever its case", async () => {
      const res = await put(asha.id, change({ email: "ASHA@acme.com" }));

      expect(res.status).toBe(200);
    });

    it("returns 409 when the email belongs to another employee, and changes nothing", async () => {
      const res = await put(asha.id, change({ email: "mike@acme.com" }));

      expect(res.status).toBe(409);
      expect(res.body).toEqual({ error: "An employee with this email already exists" });
      expect(await reload(asha.id)).toMatchObject({ fullName: "Asha Rao", email: "asha@acme.com" });
    });

    it.each([
      ["a missing name", { fullName: undefined }, "fullName"],
      ["an invalid email", { email: "nope" }, "email"],
      ["a negative salary", { salary: -1 }, "salary"],
      ["an unsupported currency", { currency: "XXX" }, "currency"],
      ["a hire date in the future", { hireDate: futureDate() }, "hireDate"],
    ])("rejects %s and changes nothing", async (_label, over, field) => {
      const res = await put(asha.id, change(over));

      expect(res.status).toBe(400);
      expect(res.body.details).toEqual([{ field, message: expect.any(String) }]);
      expect(await reload(asha.id)).toMatchObject({ fullName: "Asha Rao", salary: 2_400_000 });
    });

    it("returns 404 for an employee that does not exist", async () => {
      const res = await put(99_999, change());

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: "Employee not found" });
    });

    it.each(["abc", "0", "-1", "1.5", "1e3", "99999999999"])("returns 400 for the id %s", async (id) => {
      const res = await put(id, change());

      expect(res.status).toBe(400);
      expect(res.body.error).toBeTruthy();
    });
  });

  describe("DELETE /api/employees/:id", () => {
    it("removes the employee and returns 204 with no body", async () => {
      const res = await remove(asha.id);

      expect(res.status).toBe(204);
      expect(res.text).toBe("");
      expect(await reload(asha.id)).toBeNull();
    });

    it("removes only that employee", async () => {
      await remove(asha.id);

      expect(await prisma.employee.count()).toBe(1);
      expect(await reload(mike.id)).not.toBeNull();
    });

    it("returns 404 the second time", async () => {
      await remove(asha.id);

      const res = await remove(asha.id);

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: "Employee not found" });
    });

    it("returns 404 for an employee that does not exist", async () => {
      expect((await remove(99_999)).status).toBe(404);
    });

    it.each(["abc", "0", "-1"])("returns 400 for the id %s", async (id) => {
      expect((await remove(id)).status).toBe(400);
    });

    it("frees the email so it can be used again", async () => {
      await remove(asha.id);

      const res = await request(app)
        .post("/api/employees")
        .send({ ...change(), fullName: "New Asha", salary: 1_000_000 });

      expect(res.status).toBe(201);
    });
  });
});
