import type { ReactNode } from "react";
import type { EmployeeFilters } from "@acme/shared";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Select } from "../../components/ui/select";

export interface Filters {
  search: string;
  country: string;
  department: string;
  jobTitle: string;
}

interface Props {
  filters: Filters;
  options?: EmployeeFilters;
  onChange: (field: keyof Filters, value: string) => void;
  onClear: () => void;
  children?: ReactNode;
}

export function FilterBar({ filters, options, onChange, onClear, children }: Props) {
  const dropdowns = [
    { field: "country", label: "Country", all: "All countries", values: options?.countries },
    { field: "department", label: "Department", all: "All departments", values: options?.departments },
    { field: "jobTitle", label: "Job title", all: "All job titles", values: options?.jobTitles },
  ] as const;

  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 p-3">
      <Input
        type="search"
        aria-label="Search employees"
        placeholder="Search name or email"
        className="max-w-64"
        value={filters.search}
        onChange={(e) => onChange("search", e.target.value)}
      />
      {dropdowns.map(({ field, label, all, values }) => (
        <Select key={field} aria-label={label} value={filters[field]} onChange={(e) => onChange(field, e.target.value)}>
          <option value="">{all}</option>
          {values?.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </Select>
      ))}
      <Button variant="outline" size="sm" onClick={onClear}>
        Clear filters
      </Button>
      {children && <div className="ml-auto">{children}</div>}
    </div>
  );
}
