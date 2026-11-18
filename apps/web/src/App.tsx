import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cn } from "./lib/utils";
import { EmployeesPage } from "./features/employees/EmployeesPage";
import { InsightsPage } from "./features/insights/InsightsPage";

const TABS = [
  { id: "employees", label: "Employees" },
  { id: "insights", label: "Insights" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function App() {
  const [queryClient] = useState(() => new QueryClient());
  const [tab, setTab] = useState<TabId>("employees");

  return (
    <QueryClientProvider client={queryClient}>
      <main className="mx-auto max-w-6xl p-6">
        <h1 className="mb-4 text-2xl font-semibold">ACME Salary Management</h1>

        <div role="tablist" aria-label="Sections" className="mb-4 flex gap-1 border-b border-slate-200">
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              role="tab"
              id={`tab-${id}`}
              aria-selected={tab === id}
              aria-controls={`panel-${id}`}
              onClick={() => setTab(id)}
              className={cn(
                "-mb-px border-b-2 px-4 py-2 text-sm font-medium",
                tab === id ? "border-slate-900 text-slate-900" : "border-transparent text-slate-500 hover:text-slate-900",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* always mounted but hidden, so the search, filters and page survive a visit to Insights */}
        <div role="tabpanel" id="panel-employees" aria-labelledby="tab-employees" hidden={tab !== "employees"} className="rounded-lg border border-slate-200 bg-white">
          <EmployeesPage />
        </div>

        {/* mounted only while open, so the numbers are always fresh */}
        {tab === "insights" && (
          <div role="tabpanel" id="panel-insights" aria-labelledby="tab-insights">
            <InsightsPage />
          </div>
        )}
      </main>
    </QueryClientProvider>
  );
}
