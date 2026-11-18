import { z } from "zod";
import { CURRENCIES, SUPPORTED_COUNTRIES } from "./reference-data.js";

const requiredText = (label: string) =>
  z
    .string({ error: `${label} is required` })
    .trim()
    .min(1, `${label} is required`)
    .max(100, `${label} must be 100 characters or fewer`);

const today = () => new Date().toISOString().slice(0, 10);

// iso.date checks the format and that the day really exists; pipe stops there if it fails
const hireDate = z.iso
  .date({ error: "Hire date must be a real date as YYYY-MM-DD" })
  .pipe(z.string().refine((date) => date <= today(), "Hire date cannot be in the future"));

export const employeeInputSchema = z.object({
  fullName: requiredText("Full name"),
  email: z
    .string({ error: "Email is required" })
    .trim()
    .toLowerCase()
    .pipe(z.email("Invalid email address")),
  jobTitle: requiredText("Job title"),
  department: requiredText("Department"),
  country: requiredText("Country").pipe(
    z.string().refine((country) => SUPPORTED_COUNTRIES.includes(country), "Unsupported country"),
  ),
  salary: z
    .number({ error: "Salary must be a number" })
    .int("Salary must be a whole number")
    .positive("Salary must be positive")
    .max(1_000_000_000, "Salary is too large"),
  currency: z.enum(CURRENCIES, { error: "Unsupported currency" }),
  hireDate,
});

export type EmployeeInput = z.infer<typeof employeeInputSchema>;
