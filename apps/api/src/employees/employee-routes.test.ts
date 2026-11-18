import { afterAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import type { Employee, Paginated } from "@acme/shared";
import { createApp } from "../app.js";
import { prisma } from "../db/client.js";
import { resetDb } from "../db/test-helpers.js";
import { generateEmployees } from "../seed/generate-employees.js";

const app = createApp();

describe("GET /api/employees", () => {
  beforeEach(async () => {
    await resetDb();
    await prisma.employee.createMany({ data: generateEmployees(45) });
  });
  afterAll(() => prisma.$disconnect());

  it("returns the first page of 25 by default", async () => {
    const res = await request(app).get("/api/employees");
    const body: Paginated<Employee> = res.body;

    expect(res.status).toBe(200);
    expect(body).toMatchObject({ total: 45, page: 1, pageSize: 25, totalPages: 2 });
    expect(body.items).toHaveLength(25);
  });

  it("returns the requested page", async () => {
    const page1: Paginated<Employee> = (await request(app).get("/api/employees?page=1&pageSize=10")).body;
    const page2: Paginated<Employee> = (await request(app).get("/api/employees?page=2&pageSize=10")).body;

    expect(page2.items).toHaveLength(10);
    expect(page2.page).toBe(2);
    expect(page2.totalPages).toBe(5);
    expect(page2.items[0]!.id).toBeGreaterThan(page1.items[9]!.id);
  });

  it("returns a short last page", async () => {
    const res = await request(app).get("/api/employees?page=5&pageSize=10");

    expect(res.body.items).toHaveLength(5);
  });

  it("returns an empty list for a page past the end", async () => {
    const res = await request(app).get("/api/employees?page=99");

    expect(res.status).toBe(200);
    expect(res.body.items).toEqual([]);
    expect(res.body.total).toBe(45);
  });

  it("returns employees in the shape of the shared Employee type, with ISO dates", async () => {
    const res = await request(app).get("/api/employees?pageSize=1");
    const employee: Employee = res.body.items[0];

    expect(employee).toMatchObject({
      fullName: expect.any(String),
      email: expect.stringContaining("@"),
      salary: expect.any(Number),
      currency: expect.any(String),
    });
    expect(employee.hireDate).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(employee.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it.each(["page=0", "page=abc", "pageSize=101", "pageSize=0"])("rejects ?%s with a 400", async (query) => {
    const res = await request(app).get(`/api/employees?${query}`);

    expect(res.status).toBe(400);
    expect(res.body.error).toBeTruthy();
    expect(res.body.details).toEqual(expect.arrayContaining([expect.objectContaining({ field: expect.any(String) })]));
  });
});
