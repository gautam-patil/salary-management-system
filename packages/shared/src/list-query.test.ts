import { describe, expect, it } from "vitest";
import { listQuerySchema } from "./list-query.js";

describe("listQuerySchema", () => {
  it("defaults to the first page of 25", () => {
    expect(listQuerySchema.parse({})).toEqual({ page: 1, pageSize: 25 });
  });

  it("converts numbers that arrive as text in the URL", () => {
    expect(listQuerySchema.parse({ page: "3", pageSize: "50" })).toEqual({ page: 3, pageSize: 50 });
  });

  it("rejects a page below 1", () => {
    expect(listQuerySchema.safeParse({ page: "0" }).success).toBe(false);
  });

  it("rejects a page size above 100", () => {
    expect(listQuerySchema.safeParse({ pageSize: "101" }).success).toBe(false);
  });

  it("accepts a page size of exactly 100", () => {
    expect(listQuerySchema.parse({ pageSize: "100" }).pageSize).toBe(100);
  });

  it.each(["abc", "1.5", "-2"])("rejects %s as a page", (page) => {
    expect(listQuerySchema.safeParse({ page }).success).toBe(false);
  });
});
