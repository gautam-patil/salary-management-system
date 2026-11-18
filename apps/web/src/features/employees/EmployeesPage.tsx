import { useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { fetchEmployees } from "../../api/employees";
import { Button } from "../../components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { formatDate, formatSalary } from "../../lib/format";

const PAGE_SIZE = 25;

export function EmployeesPage() {
  const [page, setPage] = useState(1);

  const { data, isPending, isError } = useQuery({
    queryKey: ["employees", page],
    queryFn: () => fetchEmployees(page, PAGE_SIZE),
    placeholderData: keepPreviousData,
  });

  if (isPending) return <p className="p-6 text-slate-500">Loading employees...</p>;
  if (isError) return <p className="p-6 text-red-600">Could not load employees. Please try again.</p>;

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Job title</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Country</TableHead>
            <TableHead className="text-right">Salary</TableHead>
            <TableHead>Hired</TableHead>
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
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="flex items-center justify-between border-t border-slate-200 px-3 py-3 text-sm">
        <span className="text-slate-500">{`${data.total.toLocaleString("en-US")} employees`}</span>
        <div className="flex items-center gap-3">
          <span>{`Page ${page} of ${data.totalPages}`}</span>
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            Previous
          </Button>
          <Button variant="outline" size="sm" disabled={page >= data.totalPages} onClick={() => setPage(page + 1)}>
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
