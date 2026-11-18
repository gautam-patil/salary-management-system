import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "../db/client.js";
import { resetDb } from "../db/test-helpers.js";
import { seedDatabase } from "./seed-database.js";

describe("seedDatabase", () => {
  beforeEach(resetDb);
  afterAll(() => prisma.$disconnect());

  it("inserts the requested number of employees, across more than one batch", async () => {
    await seedDatabase(2_500);

    expect(await prisma.employee.count()).toBe(2_500);
  });

  it("can be run again without duplicating employees", async () => {
    await seedDatabase(300);
    await seedDatabase(300);

    expect(await prisma.employee.count()).toBe(300);
  });

  it("replaces whatever was in the table before", async () => {
    await prisma.employee.create({
      data: {
        fullName: "Manual Entry",
        email: "manual@acme.com",
        jobTitle: "Tester",
        department: "QA",
        country: "India",
        salary: 1,
        currency: "INR",
        hireDate: new Date("2020-01-01"),
      },
    });

    await seedDatabase(10);

    expect(await prisma.employee.findUnique({ where: { email: "manual@acme.com" } })).toBeNull();
  });
});
