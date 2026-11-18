import { useId, useState, type FormEvent, type ReactNode } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CURRENCIES,
  DEFAULT_CURRENCY_BY_COUNTRY,
  SUPPORTED_COUNTRIES,
  employeeInputSchema,
  type Employee,
  type EmployeeInput,
} from "@acme/shared";
import { createEmployee, updateEmployee } from "../../api/employees";
import { ApiError } from "../../api/http";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Modal } from "../../components/ui/modal";
import { Select } from "../../components/ui/select";

const todayIso = () => new Date().toISOString().slice(0, 10);

interface Values {
  fullName: string;
  email: string;
  jobTitle: string;
  department: string;
  country: string;
  salary: string;
  currency: string;
  hireDate: string;
}

type Errors = Record<string, string>;

function initialValues(employee?: Employee): Values {
  if (!employee) {
    return { fullName: "", email: "", jobTitle: "", department: "", country: "", salary: "", currency: "USD", hireDate: "" };
  }
  return {
    fullName: employee.fullName,
    email: employee.email,
    jobTitle: employee.jobTitle,
    department: employee.department,
    country: employee.country,
    salary: String(employee.salary),
    currency: employee.currency,
    hireDate: employee.hireDate.slice(0, 10),
  };
}

// one message per field: the first problem found
function firstMessages(issues: { path: PropertyKey[]; message: string }[]): Errors {
  const messages: Errors = {};
  for (const issue of issues) {
    const field = String(issue.path[0]);
    messages[field] ??= issue.message;
  }
  return messages;
}

interface FieldProps {
  id: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
}

function Field({ label, error, children }: { label: string; error?: string; children: (props: FieldProps) => ReactNode }) {
  const id = useId();
  const errorId = `${id}-error`;

  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium">
        {label}
      </label>
      {children({ id, "aria-invalid": error ? true : undefined, "aria-describedby": error ? errorId : undefined })}
      {error && (
        <p id={errorId} className="mt-1 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

interface Props {
  employee?: Employee;
  countries: string[];
  onClose: () => void;
  onSaved: (message: string) => void;
}

export function EmployeeFormDialog({ employee, countries, onClose, onSaved }: Props) {
  const queryClient = useQueryClient();
  const [values, setValues] = useState(() => initialValues(employee));
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string>();

  // supported countries (so a new office can get its first employee), countries already in the data,
  // and this employee's own country in case the list has not loaded yet
  const countryOptions = [...new Set([...SUPPORTED_COUNTRIES, ...countries, ...(employee ? [employee.country] : [])])].sort();

  const mutation = useMutation({
    mutationFn: (input: EmployeeInput) => (employee ? updateEmployee(employee.id, input) : createEmployee(input)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      queryClient.invalidateQueries({ queryKey: ["employee-filters"] });
      onSaved(employee ? "Employee updated" : "Employee added");
    },
    onError: (error) => {
      if (error instanceof ApiError && error.status === 409) {
        setErrors({ email: error.message });
      } else if (error instanceof ApiError && error.status === 400 && error.details) {
        setErrors(Object.fromEntries(error.details.map((d) => [d.field, d.message])));
      } else {
        setFormError("Could not save the employee. Please try again.");
      }
    },
  });

  function change(field: keyof Values, value: string) {
    const next = { ...values, [field]: value };
    // suggest the country's currency; the user can still change it
    if (field === "country") next.currency = DEFAULT_CURRENCY_BY_COUNTRY[value] ?? values.currency;

    setValues(next);
    setErrors(({ [field]: _cleared, ...rest }) => rest);
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    setFormError(undefined);

    const parsed = employeeInputSchema.safeParse({
      fullName: values.fullName,
      email: values.email || undefined,
      jobTitle: values.jobTitle,
      department: values.department,
      country: values.country,
      salary: values.salary === "" ? undefined : Number(values.salary),
      currency: values.currency,
      hireDate: values.hireDate || undefined,
    });

    if (!parsed.success) {
      setErrors(firstMessages(parsed.error.issues));
      return;
    }
    setErrors({});
    mutation.mutate(parsed.data);
  }

  const text = (field: keyof Values) => ({
    value: values[field],
    onChange: (e: { target: { value: string } }) => change(field, e.target.value),
  });

  return (
    <Modal title={employee ? "Edit employee" : "Add employee"} onClose={onClose}>
      <form onSubmit={submit} noValidate className="space-y-3">
        <Field label="Full name" error={errors.fullName}>
          {(props) => <Input {...props} {...text("fullName")} autoFocus />}
        </Field>
        <Field label="Email" error={errors.email}>
          {(props) => <Input {...props} {...text("email")} type="email" />}
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Job title" error={errors.jobTitle}>
            {(props) => <Input {...props} {...text("jobTitle")} />}
          </Field>
          <Field label="Department" error={errors.department}>
            {(props) => <Input {...props} {...text("department")} />}
          </Field>
        </div>
        <Field label="Country" error={errors.country}>
          {(props) => (
            <Select {...props} {...text("country")} className="w-full">
              <option value="">Select a country</option>
              {countryOptions.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Salary" error={errors.salary}>
            {(props) => <Input {...props} {...text("salary")} type="number" inputMode="numeric" min={1} step={1} />}
          </Field>
          <Field label="Currency" error={errors.currency}>
            {(props) => (
              <Select {...props} {...text("currency")} className="w-full">
                {CURRENCIES.map((currency) => (
                  <option key={currency} value={currency}>
                    {currency}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        </div>
        <Field label="Hire date" error={errors.hireDate}>
          {(props) => <Input {...props} {...text("hireDate")} type="date" max={todayIso()} />}
        </Field>

        {formError && <p className="text-sm text-red-600">{formError}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Saving..." : "Save"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
