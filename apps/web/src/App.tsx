import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { EmployeesPage } from "./features/employees/EmployeesPage";

const queryClient = new QueryClient();

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <main className="mx-auto max-w-6xl p-6">
        <h1 className="mb-4 text-2xl font-semibold">Employees</h1>
        <div className="rounded-lg border border-slate-200 bg-white">
          <EmployeesPage />
        </div>
      </main>
    </QueryClientProvider>
  );
}
