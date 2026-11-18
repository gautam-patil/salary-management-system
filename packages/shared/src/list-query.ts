import { z } from "zod";

export const MAX_PAGE_SIZE = 100;

export const SORT_FIELDS = ["fullName", "jobTitle", "department", "country", "salary", "hireDate"] as const;
export type SortField = (typeof SORT_FIELDS)[number];

// an empty search box or filter means "not set"
const optionalText = z
  .string()
  .trim()
  .transform((value) => value || undefined)
  .optional();

// query string values arrive as text, so numbers are coerced
export const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(25),
  search: optionalText,
  country: optionalText,
  department: optionalText,
  jobTitle: optionalText,
  sortBy: z.enum(SORT_FIELDS).optional(),
  sortDir: z.enum(["asc", "desc"]).optional(),
});

export type ListQuery = z.infer<typeof listQuerySchema>;

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
