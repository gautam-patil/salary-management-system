import { afterAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import type { Employee, EmployeeFilters, Paginated } from "@acme/shared";
import { createApp } from "../app.js";
import { prisma } from "../db/client.js";
import { resetDb } from "../db/test-helpers.js";

const app = createApp();

const person = (fullName: string, email: string, jobTitle: string, department: string, country: string, salary: number, currency: string, hireDate: string) => ({
  fullName,
  email,
  jobTitle,
  department,
  country,
  salary,
  currency,
  hireDate: new Date(hireDate),
});

const staff = [
  person("Asha Rao", "asha@acme.com", "Software Engineer", "Engineering", "India", 2_400_000, "INR", "2022-03-14"),
  person("Mike Brown", "mike@acme.com", "Sales Manager", "Sales", "United States", 130_000, "USD", "2019-06-01"),
  person("Lena Fischer", "lena@acme.com", "Software Engineer", "Engineering", "Germany", 90_000, "EUR", "2021-01-10"),
  person("Ashok Verma", "ashok.verma@acme.com", "Accountant", "Finance", "India", 1_200_000, "INR", "2018-09-09"),
  person("Yuki Sato", "yuki@acme.com", "Sales Representative", "Sales", "Japan", 7_000_000, "JPY", "2020-02-02"),
  person("Priya Nair", "priya@acme.com", "Software Engineer", "Engineering", "India", 3_000_000, "INR", "2023-04-04"),
];

const list = async (query: string) => {
  const res = await request(app).get(`/api/employees?${query}`);
  return { status: res.status, body: res.body as Paginated<Employee> };
};
const names = (body: Paginated<Employee>) => body.items.map((e) => e.fullName);

describe("employee search, filters and sorting", () => {
  beforeEach(async () => {
    await resetDb();
    await prisma.employee.createMany({ data: staff });
  });
  afterAll(() => prisma.$disconnect());

  describe("search", () => {
    it("matches part of a name, ignoring case", async () => {
      const { body } = await list("search=ASH");

      expect(names(body).sort()).toEqual(["Asha Rao", "Ashok Verma"]);
    });

    it("matches part of an email", async () => {
      const { body } = await list("search=lena@");

      expect(names(body)).toEqual(["Lena Fischer"]);
    });

    it("ignores a blank search", async () => {
      const { body } = await list("search=");

      expect(body.total).toBe(6);
    });
  });

  describe("filters", () => {
    it("filters by country", async () => {
      const { body } = await list("country=India");

      expect(body.total).toBe(3);
      expect(body.items.every((e) => e.country === "India")).toBe(true);
    });

    it("filters by department and by job title", async () => {
      expect((await list("department=Sales")).body.total).toBe(2);
      expect((await list("jobTitle=Accountant")).body.total).toBe(1);
    });

    it("combines filters", async () => {
      const { body } = await list("country=India&department=Engineering");

      expect(names(body).sort()).toEqual(["Asha Rao", "Priya Nair"]);
    });

    it("combines search with filters", async () => {
      const { body } = await list("search=ash&country=India&department=Finance");

      expect(names(body)).toEqual(["Ashok Verma"]);
    });

    it("returns an empty result, not an error, when nothing matches", async () => {
      const { status, body } = await list("country=Brazil");

      expect(status).toBe(200);
      expect(body).toMatchObject({ items: [], total: 0, totalPages: 0 });
    });

    it("counts the total over the filtered rows, across pages", async () => {
      const { body } = await list("country=India&pageSize=2&page=2");

      expect(body).toMatchObject({ total: 3, totalPages: 2 });
      expect(body.items).toHaveLength(1);
    });
  });

  describe("sorting", () => {
    it("sorts by name ascending and descending", async () => {
      expect(names((await list("sortBy=fullName&sortDir=asc")).body)[0]).toBe("Asha Rao");
      expect(names((await list("sortBy=fullName&sortDir=desc")).body)[0]).toBe("Yuki Sato");
    });

    it("sorts ascending when no direction is given", async () => {
      expect(names((await list("sortBy=fullName")).body)[0]).toBe("Asha Rao");
    });

    it("sorts by salary within one country", async () => {
      const { body } = await list("country=India&sortBy=salary&sortDir=desc");

      expect(names(body)).toEqual(["Priya Nair", "Asha Rao", "Ashok Verma"]);
    });

    it("sorts by hire date", async () => {
      const { body } = await list("sortBy=hireDate&sortDir=asc");

      expect(names(body)[0]).toBe("Ashok Verma");
    });

    it("keeps paging stable when many rows share the sort value", async () => {
      const seen: number[] = [];
      for (const page of [1, 2, 3]) {
        const { body } = await list(`sortBy=department&pageSize=2&page=${page}`);
        seen.push(...body.items.map((e) => e.id));
      }

      expect(new Set(seen).size).toBe(6);
    });
  });

  it("rejects an unknown sort column with a 400", async () => {
    const { status } = await list("sortBy=password");

    expect(status).toBe(400);
  });
});

describe("GET /api/employees/filters", () => {
  beforeEach(async () => {
    await resetDb();
    await prisma.employee.createMany({ data: staff });
  });
  afterAll(() => prisma.$disconnect());

  it("lists each country, department and job title once, in alphabetical order", async () => {
    const res = await request(app).get("/api/employees/filters");
    const body: EmployeeFilters = res.body;

    expect(res.status).toBe(200);
    expect(body.countries).toEqual(["Germany", "India", "Japan", "United States"]);
    expect(body.departments).toEqual(["Engineering", "Finance", "Sales"]);
    expect(body.jobTitles).toEqual(["Accountant", "Sales Manager", "Sales Representative", "Software Engineer"]);
  });

  it("returns empty lists for an empty database", async () => {
    await resetDb();

    const res = await request(app).get("/api/employees/filters");

    expect(res.body).toEqual({ countries: [], departments: [], jobTitles: [] });
  });
});
