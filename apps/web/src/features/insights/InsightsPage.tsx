import { DistributionSection } from "./DistributionSection";
import { GroupBreakdown } from "./GroupBreakdown";
import { SummaryCards } from "./SummaryCards";

export function InsightsPage() {
  return (
    <div className="space-y-4 p-4">
      <SummaryCards />
      <GroupBreakdown />
      <DistributionSection />
      <p className="text-xs text-slate-500">All amounts are in USD, converted at fixed illustrative exchange rates.</p>
    </div>
  );
}
