import type { SortField } from "@acme/shared";
import { TableHead } from "../../components/ui/table";

interface Props {
  label: string;
  field: SortField;
  sortBy?: SortField;
  sortDir?: "asc" | "desc";
  onSort: (field: SortField) => void;
  className?: string;
}

export function SortableHead({ label, field, sortBy, sortDir, onSort, className }: Props) {
  const active = sortBy === field;

  return (
    <TableHead className={className} aria-sort={active ? (sortDir === "desc" ? "descending" : "ascending") : undefined}>
      <button type="button" onClick={() => onSort(field)} className="inline-flex items-center gap-1 uppercase hover:text-slate-900">
        {label}
        <span aria-hidden="true" className="w-3 text-[10px]">
          {active ? (sortDir === "desc" ? "▼" : "▲") : ""}
        </span>
      </button>
    </TableHead>
  );
}
