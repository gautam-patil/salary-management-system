import { useQuery } from "@tanstack/react-query";
import { fetchDistribution } from "../../api/insights";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";

export function DistributionSection() {
  const { data, isPending, isError } = useQuery({ queryKey: ["insights", "distribution"], queryFn: fetchDistribution, gcTime: 0 });

  return (
    <section className="rounded-lg border border-slate-200 bg-white">
      <h2 className="border-b border-slate-200 p-3 font-semibold">Salary distribution</h2>

      {isPending && <p className="p-4 text-slate-500">Loading...</p>}
      {isError && <p className="p-4 text-red-600">Could not load the distribution. Please try again.</p>}

      {data && (
        <Table aria-label="Employees per salary band">
          <TableHeader>
            <TableRow>
              <TableHead>Salary band (USD)</TableHead>
              <TableHead className="text-right">Employees</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((band) => (
              <TableRow key={band.label}>
                <TableCell>{band.label}</TableCell>
                <TableCell className="text-right tabular-nums">{band.count}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </section>
  );
}
