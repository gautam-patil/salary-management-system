import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "./client.js";
import { resetDb } from "./test-helpers.js";

const asha = {
  fullName: "Asha Rao",
  email: "asha@acme.com",
  jobTitle: "Software Engineer",
  department: "Engineering",
  country: "India",
  salary: 2_400_000,
  currency: "INR",
  hireDate: new Date("2022-03-14"),
};

describe("employee table", () => {
  beforeEach(resetDb);
  afterAll(() => prisma.$disconnect());

  it("saves an employee and reads it back", async () => {
    const saved = await prisma.employee.create({ data: asha });

    const found = await prisma.employee.findUnique({ where: { id: saved.id } });

    expect(found).toMatchObject(asha);
    expect(found?.createdAt).toBeInstanceOf(Date);
  });

  it("rejects a second employee with the same email", async () => {
    await prisma.employee.create({ data: asha });

    await expect(prisma.employee.create({ data: { ...asha, fullName: "Other" } })).rejects.toThrow();
  });

  it("starts every test with an empty table", async () => {
    expect(await prisma.employee.count()).toBe(0);
  });
});
