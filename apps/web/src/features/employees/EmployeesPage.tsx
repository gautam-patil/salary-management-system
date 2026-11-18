import { useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { Employee, SortField } from "@acme/shared";
import { fetchEmployees, fetchFilters } from "../../api/employees";
import { Button } from "../../components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { useDebounce } from "../../hooks/useDebounce";
import { formatDate, formatSalary } from "../../lib/format";
import { ConfirmDeleteDialog } from "./ConfirmDeleteDialog";
import { EmployeeFormDialog } from "./EmployeeFormDialog";
import { FilterBar, type Filters } from "./FilterBar";
import { SortableHead } from "./SortableHead";

const PAGE_SIZE = 25;
const SEARCH_DELAY_MS = 300;

const noFilters: Filters = { search: "", country: "", department: "", jobTitle: "" };

interface Sort {
  sortBy?: SortField;
  sortDir?: "asc" | "desc";
}

type DialogState = { kind: "add" } | { kind: "edit"; employee: Employee } | { kind: "delete"; employee: Employee } | null;

export function EmployeesPage() {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState(noFilters);
  const [sort, setSort] = useState<Sort>({});
  const [dialog, setDialog] = useState<DialogState>(null);
  const [notice, setNotice] = useState<string>();

  // wait for a pause in typing, but clear straight away when the box is emptied
  const debouncedSearch = useDebounce(filters.search, SEARCH_DELAY_MS);
  const search = filters.search === "" ? "" : debouncedSearch;

  const params = { page, pageSize: PAGE_SIZE, ...filters, search, ...sort };
  const employees = useQuery({
    queryKey: ["employees", params],
    queryFn: () => fetchEmployees(params),
    placeholderData: keepPreviousData,
  });
  const filterOptions = useQuery({ queryKey: ["employee-filters"], queryFn: fetchFilters, staleTime: Infinity });

  // any change to the results starts again from page 1
  function changeFilter(field: keyof Filters, value: string) {
    setFilters({ ...filters, [field]: value });
    setPage(1);
  }

  function clearFilters() {
    setFilters(noFilters);
    setPage(1);
  }

  function sortBy(field: SortField) {
    const sameColumn = sort.sortBy === field;
    setSort({ sortBy: field, sortDir: sameColumn && sort.sortDir === "asc" ? "desc" : "asc" });
    setPage(1);
  }

  const head = (label: string, field: SortField, className?: string) => (
    <SortableHead label={label} field={field} sortBy={sort.sortBy} sortDir={sort.sortDir} onSort={sortBy} className={className} />
  );

  const { data } = employees;

  function openDialog(next: DialogState) {
    setNotice(undefined);
    setDialog(next);
  }

  function finished(message: string) {
    setDialog(null);
    setNotice(message);
  }

  function deleted() {
    // deleting the only employee on the last page would leave an empty page
    if (page > 1 && data?.items.length === 1) setPage(page - 1);
    finished("Employee deleted");
  }

  return (
    <div>
      <FilterBar filters={filters} options={filterOptions.data} onChange={changeFilter} onClear={clearFilters}>
        <Button onClick={() => openDialog({ kind: "add" })}>Add employee</Button>
      </FilterBar>

      {notice && (
        <div role="status" className="flex items-center justify-between border-b border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
          <span>{notice}</span>
          <button type="button" className="text-xs underline" onClick={() => setNotice(undefined)}>
            Dismiss
          </button>
        </div>
      )}

      {sort.sortBy === "salary" && !filters.country && (
        <p className="border-b border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          Salary sorts by raw amount, so different currencies are not comparable. Filter by country to compare.
        </p>
      )}

      {employees.isPending && <p className="p-6 text-slate-500">Loading employees...</p>}
      {employees.isError && <p className="p-6 text-red-600">Could not load employees. Please try again.</p>}
      {data && data.items.length === 0 && <p className="p-6 text-slate-500">No employees match your filters.</p>}

      {data && data.items.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              {head("Name", "fullName")}
              {head("Job title", "jobTitle")}
              {head("Department", "department")}
              {head("Country", "country")}
              {head("Salary", "salary", "text-right")}
              {head("Hired", "hireDate")}
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.items.map((e) => (
              <TableRow key={e.id}>
                <TableCell>
                  <div className="font-medium">{e.fullName}</div>
                  <div className="text-xs text-slate-500">{e.email}</div>
                </TableCell>
                <TableCell>{e.jobTitle}</TableCell>
                <TableCell>{e.department}</TableCell>
                <TableCell>{e.country}</TableCell>
                <TableCell className="text-right tabular-nums">{formatSalary(e.salary, e.currency)}</TableCell>
                <TableCell>{formatDate(e.hireDate)}</TableCell>
                <TableCell className="space-x-2 whitespace-nowrap text-right">
                  <Button variant="outline" size="sm" aria-label={`Edit ${e.fullName}`} onClick={() => openDialog({ kind: "edit", employee: e })}>
                    Edit
                  </Button>
                  <Button variant="outline" size="sm" aria-label={`Delete ${e.fullName}`} onClick={() => openDialog({ kind: "delete", employee: e })}>
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {data && (
        <div className="flex items-center justify-between border-t border-slate-200 px-3 py-3 text-sm">
          <span className="text-slate-500">{`${data.total.toLocaleString("en-US")} employees`}</span>
          <div className="flex items-center gap-3">
            <span>{`Page ${page} of ${Math.max(data.totalPages, 1)}`}</span>
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled={page >= data.totalPages} onClick={() => setPage(page + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}

      {(dialog?.kind === "add" || dialog?.kind === "edit") && (
        <EmployeeFormDialog
          employee={dialog.kind === "edit" ? dialog.employee : undefined}
          countries={filterOptions.data?.countries ?? []}
          onClose={() => setDialog(null)}
          onSaved={finished}
        />
      )}
      {dialog?.kind === "delete" && (
        <ConfirmDeleteDialog employee={dialog.employee} onClose={() => setDialog(null)} onDeleted={deleted} />
      )}
    </div>
  );
}
