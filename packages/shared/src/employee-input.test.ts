import { describe, expect, it } from "vitest";
import { CURRENCIES, SUPPORTED_COUNTRIES } from "./reference-data.js";
import { employeeInputSchema } from "./employee-input.js";

const valid = {
  fullName: "Asha Rao",
  email: "asha@acme.com",
  jobTitle: "Software Engineer",
  department: "Engineering",
  country: "India",
  salary: 2_400_000,
  currency: "INR",
  hireDate: "2022-03-14",
};

const today = () => new Date().toISOString().slice(0, 10);
const daysFromNow = (days: number) => new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10);

// the field names that failed validation
function failedFields(input: unknown) {
  const result = employeeInputSchema.safeParse(input);
  return result.success ? [] : result.error.issues.map((issue) => issue.path.join("."));
}

describe("employeeInputSchema", () => {
  it("accepts a valid employee", () => {
    expect(employeeInputSchema.parse(valid)).toEqual(valid);
  });

  it("trims text and lowercases the email", () => {
    const parsed = employeeInputSchema.parse({ ...valid, fullName: "  Asha Rao ", email: " ASHA@Acme.com " });

    expect(parsed.fullName).toBe("Asha Rao");
    expect(parsed.email).toBe("asha@acme.com");
  });

  it.each(["fullName", "email", "jobTitle", "department", "country", "salary", "currency", "hireDate"])(
    "requires %s",
    (field) => {
      const { [field]: _removed, ...rest } = valid as Record<string, unknown>;

      expect(failedFields(rest)).toEqual([field]);
    },
  );

  it.each(["fullName", "jobTitle", "department", "country"])("rejects a blank %s", (field) => {
    expect(failedFields({ ...valid, [field]: "   " })).toEqual([field]);
  });

  it("rejects a name longer than 100 characters", () => {
    expect(failedFields({ ...valid, fullName: "a".repeat(101) })).toEqual(["fullName"]);
  });

  it.each(["nope", "asha@", "@acme.com", "asha acme.com"])("rejects %s as an email", (email) => {
    expect(failedFields({ ...valid, email })).toEqual(["email"]);
  });

  describe("salary", () => {
    it.each([0, -5, 1.5, "100", null])("rejects %s", (salary) => {
      expect(failedFields({ ...valid, salary })).toEqual(["salary"]);
    });

    it("accepts the largest allowed amount and rejects one above it", () => {
      expect(failedFields({ ...valid, salary: 1_000_000_000 })).toEqual([]);
      expect(failedFields({ ...valid, salary: 1_000_000_001 })).toEqual(["salary"]);
    });
  });

  describe("country", () => {
    it.each(SUPPORTED_COUNTRIES)("accepts %s", (country) => {
      expect(failedFields({ ...valid, country })).toEqual([]);
    });

    it.each(["Narnia", "india", "IN"])("rejects %j", (country) => {
      expect(failedFields({ ...valid, country })).toEqual(["country"]);
    });

    it("says which countries are allowed", () => {
      const result = employeeInputSchema.safeParse({ ...valid, country: "Narnia" });

      expect(result.success ? "" : result.error.issues[0]?.message).toBe("Unsupported country");
    });
  });

  describe("currency", () => {
    it.each(CURRENCIES)("accepts %s", (currency) => {
      expect(failedFields({ ...valid, currency })).toEqual([]);
    });

    it.each(["XXX", "usd", "US", ""])("rejects %j", (currency) => {
      expect(failedFields({ ...valid, currency })).toEqual(["currency"]);
    });
  });

  describe("hire date", () => {
    it("accepts today", () => {
      expect(failedFields({ ...valid, hireDate: today() })).toEqual([]);
    });

    it("rejects a date in the future", () => {
      expect(failedFields({ ...valid, hireDate: daysFromNow(30) })).toEqual(["hireDate"]);
    });

    it.each(["14/03/2022", "2022-3-14", "yesterday", "2022-03-14T00:00:00Z"])("rejects the format %s", (hireDate) => {
      expect(failedFields({ ...valid, hireDate })).toEqual(["hireDate"]);
    });

    it("rejects a date that does not exist", () => {
      expect(failedFields({ ...valid, hireDate: "2022-02-31" })).toEqual(["hireDate"]);
    });
  });

  it("reports every problem at once", () => {
    expect(failedFields({ ...valid, email: "nope", salary: -1, currency: "XXX" }).sort()).toEqual(["currency", "email", "salary"]);
  });

  it("ignores fields it does not know about", () => {
    expect(employeeInputSchema.parse({ ...valid, id: 99, isAdmin: true })).toEqual(valid);
  });
});
