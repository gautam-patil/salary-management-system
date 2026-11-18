import { describe, expect, it } from "vitest";
import { groupsQuerySchema } from "./insights.js";

describe("groupsQuerySchema", () => {
  it.each(["country", "department", "jobTitle"])("accepts by=%s", (by) => {
    expect(groupsQuerySchema.parse({ by })).toEqual({ by });
  });

  it.each([undefined, "", "Country", "salary", "password"])("rejects by=%s", (by) => {
    expect(groupsQuerySchema.safeParse({ by }).success).toBe(false);
  });

  it("rejects a missing by", () => {
    expect(groupsQuerySchema.safeParse({}).success).toBe(false);
  });
});
