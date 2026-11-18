import { useQuery } from "@tanstack/react-query";
import { fetchSummary } from "../../api/insights";
import { formatUsd } from "../../lib/format";

export function SummaryCards() {
  // gcTime 0: no cached numbers shown while fresh ones load
  const { data, isPending, isError } = useQuery({ queryKey: ["insights", "summary"], queryFn: fetchSummary, gcTime: 0 });

  if (isError) return <p className="text-sm text-red-600">Could not load the summary. Please try again.</p>;

  const cards = [
    {
      label: "Employees",
      value: data?.count.toLocaleString("en-US"),
      note: data && `${data.countries} countries, ${data.departments} departments`,
    },
    { label: "Total payroll", value: data && formatUsd(data.totalPayrollUsd), note: "per year" },
    { label: "Average salary", value: data && formatUsd(data.avg) },
    { label: "Median salary", value: data && formatUsd(data.median), note: "half earn more, half less" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {cards.map(({ label, value, note }) => (
        <div key={label} role="group" aria-label={label} className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{isPending ? "Loading..." : value}</p>
          {!isPending && note && <p className="mt-1 text-xs text-slate-500">{note}</p>}
        </div>
      ))}
    </div>
  );
}
