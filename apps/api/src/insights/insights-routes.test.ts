import { afterAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../app.js";
import { prisma } from "../db/client.js";
import { resetDb } from "../db/test-helpers.js";

const app = createApp();

let nextEmail = 0;
const person = (country: string, department: string, jobTitle: string, salary: number, currency: string) => ({
  fullName: `Person ${++nextEmail}`,
  email: `person${nextEmail}@acme.com`,
  country,
  department,
  jobTitle,
  salary,
  currency,
  hireDate: new Date("2021-01-01"),
});

// in USD: 100,000  140,000  54,000  108,000  28,800  46,900
const staff = [
  person("United States", "Engineering", "Software Engineer", 100_000, "USD"),
  person("United States", "Sales", "Sales Manager", 140_000, "USD"),
  person("Germany", "Engineering", "Software Engineer", 50_000, "EUR"),
  person("Germany", "Engineering", "QA Engineer", 100_000, "EUR"),
  person("India", "Finance", "Accountant", 2_400_000, "INR"),
  person("Japan", "Sales", "Sales Representative", 7_000_000, "JPY"),
];

describe("insights", () => {
  beforeEach(async () => {
    await resetDb();
    await prisma.employee.createMany({ data: staff });
  });
  afterAll(() => prisma.$disconnect());

  describe("GET /api/insights/summary", () => {
    it("reports the headline numbers in USD", async () => {
      const res = await request(app).get("/api/insights/summary");

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        count: 6,
        min: 28_800,
        avg: 79_617,
        median: 77_000,
        max: 140_000,
        totalPayrollUsd: 477_700,
        countries: 4,
        departments: 3,
      });
    });

    it("follows the data: a new employee changes the numbers", async () => {
      await prisma.employee.create({ data: person("India", "Finance", "Accountant", 5_000_000, "INR") }); // 60,000 USD

      const res = await request(app).get("/api/insights/summary");

      expect(res.body).toMatchObject({ count: 7, totalPayrollUsd: 537_700 });
    });

    it("gives zeros for an organisation with no employees", async () => {
      await resetDb();

      const res = await request(app).get("/api/insights/summary");

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        count: 0,
        min: 0,
        avg: 0,
        median: 0,
        max: 0,
        totalPayrollUsd: 0,
        countries: 0,
        departments: 0,
      });
    });
  });

  describe("GET /api/insights/groups", () => {
    const groups = (by: string) => request(app).get(`/api/insights/groups?by=${by}`);

    it("groups by country, biggest first and ties by name", async () => {
      const res = await groups("country");

      expect(res.status).toBe(200);
      expect(res.body.map((g: { group: string }) => g.group)).toEqual(["Germany", "United States", "India", "Japan"]);
      expect(res.body[0]).toEqual({
        group: "Germany",
        count: 2,
        min: 54_000,
        avg: 81_000,
        median: 81_000,
        max: 108_000,
        totalUsd: 162_000,
      });
    });

    it("groups by department", async () => {
      const res = await groups("department");

      expect(res.body.map((g: { group: string; count: number }) => [g.group, g.count])).toEqual([
        ["Engineering", 3],
        ["Sales", 2],
        ["Finance", 1],
      ]);
      expect(res.body[0]).toMatchObject({ min: 54_000, avg: 87_333, median: 100_000, max: 108_000, totalUsd: 262_000 });
    });

    it("groups by job title", async () => {
      const res = await groups("jobTitle");

      expect(res.body.map((g: { group: string }) => g.group)).toEqual([
        "Software Engineer",
        "Accountant",
        "QA Engineer",
        "Sales Manager",
        "Sales Representative",
      ]);
    });

    it("counts every employee exactly once in each grouping", async () => {
      for (const by of ["country", "department", "jobTitle"]) {
        const res = await groups(by);

        expect(res.body.reduce((sum: number, g: { count: number }) => sum + g.count, 0)).toBe(6);
      }
    });

    it("returns an empty list when there are no employees", async () => {
      await resetDb();

      const res = await groups("country");

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it.each(["", "?by=", "?by=Country", "?by=salary", "?by=password"])("rejects %j with a 400", async (query) => {
      const res = await request(app).get(`/api/insights/groups${query}`);

      expect(res.status).toBe(400);
      expect(res.body.details).toEqual([{ field: "by", message: expect.any(String) }]);
    });
  });

  describe("GET /api/insights/distribution", () => {
    it("counts employees into USD salary bands", async () => {
      const res = await request(app).get("/api/insights/distribution");

      expect(res.status).toBe(200);
      expect(res.body.map((b: { label: string; count: number }) => [b.label, b.count])).toEqual([
        ["< $40k", 1],
        ["$40k-$80k", 2],
        ["$80k-$120k", 2],
        ["$120k-$160k", 1],
        ["$160k-$200k", 0],
        ["$200k+", 0],
      ]);
    });

    it("puts every employee in exactly one band", async () => {
      const res = await request(app).get("/api/insights/distribution");

      expect(res.body.reduce((sum: number, b: { count: number }) => sum + b.count, 0)).toBe(6);
    });

    it("returns every band, all zero, when there are no employees", async () => {
      await resetDb();

      const res = await request(app).get("/api/insights/distribution");

      expect(res.body).toHaveLength(6);
      expect(res.body.every((b: { count: number }) => b.count === 0)).toBe(true);
    });
  });
});
