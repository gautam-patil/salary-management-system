import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { GroupBy } from "@acme/shared";
import { fetchGroups } from "../../api/insights";
import { Select } from "../../components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { formatUsd } from "../../lib/format";

const OPTIONS: { value: GroupBy; label: string }[] = [
  { value: "country", label: "Country" },
  { value: "department", label: "Department" },
  { value: "jobTitle", label: "Job title" },
];

export function GroupBreakdown() {
  const [by, setBy] = useState<GroupBy>("country");
  const label = OPTIONS.find((option) => option.value === by)!.label;
  const noun = label.toLowerCase();

  const { data, isPending, isError } = useQuery({ queryKey: ["insights", "groups", by], queryFn: () => fetchGroups(by), gcTime: 0 });

  return (
    <section className="rounded-lg border border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-200 p-3">
        <h2 className="font-semibold">{`Pay by ${noun}`}</h2>
        <Select aria-label="Group by" value={by} onChange={(e) => setBy(e.target.value as GroupBy)}>
          {OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </div>

      {isPending && <p className="p-4 text-slate-500">Loading...</p>}
      {isError && <p className="p-4 text-red-600">Could not load the breakdown. Please try again.</p>}
      {data?.length === 0 && <p className="p-4 text-slate-500">No employees yet.</p>}

      {data && data.length > 0 && (
        <Table aria-label={`Salary statistics by ${noun}`}>
          <TableHeader>
            <TableRow>
              <TableHead>{label}</TableHead>
              <TableHead className="text-right">Employees</TableHead>
              <TableHead className="text-right">Minimum</TableHead>
              <TableHead className="text-right">Average</TableHead>
              <TableHead className="text-right">Median</TableHead>
              <TableHead className="text-right">Maximum</TableHead>
              <TableHead className="text-right">Total payroll</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((g) => (
              <TableRow key={g.group}>
                <TableCell className="font-medium">{g.group}</TableCell>
                <TableCell className="text-right tabular-nums">{g.count.toLocaleString("en-US")}</TableCell>
                <TableCell className="text-right tabular-nums">{formatUsd(g.min)}</TableCell>
                <TableCell className="text-right tabular-nums">{formatUsd(g.avg)}</TableCell>
                <TableCell className="text-right tabular-nums">{formatUsd(g.median)}</TableCell>
                <TableCell className="text-right tabular-nums">{formatUsd(g.max)}</TableCell>
                <TableCell className="text-right tabular-nums">{formatUsd(g.totalUsd)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </section>
  );
}
