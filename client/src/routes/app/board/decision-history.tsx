import { createFileRoute, Link } from "@tanstack/react-router";
import { Filter, History } from "lucide-react";
import { useMemo, useState } from "react";
import { useDecisionHistory } from "@/shared/queries/useBoardReview";
import {
  DecisionPortalShell,
  PortalCard,
  PortalLoadingRows,
  PortalPill,
} from "@/features/board/components/DecisionPortal";

export const Route = createFileRoute("/app/board/decision-history")({
  component: DecisionHistoryPage,
});

function DecisionHistoryPage() {
  const [filter, setFilter] = useState("all");
  const { data: visible = [], isLoading, error } = useDecisionHistory(filter);
  const types = useMemo(() => ["Series Approval", "Cancellation Review", "Ranking"], []);

  return (
    <DecisionPortalShell
      active="/app/board/decision-history"
      title="Decision History"
      description="Inspect real Board approvals, ranking finalizations, and cancellation review decisions."
    >
      <div className="flex items-center justify-between rounded-md border border-border bg-card p-4">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Filter className="h-4 w-4 text-muted-foreground" /> Filter decisions
        </div>
        <select
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          className="h-9 rounded-md border border-border bg-background px-3 text-sm"
        >
          <option value="all">All decisions</option>
          {types.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      <PortalCard
        title="Decision ledger"
        description="Board-readable history from live decision APIs."
      >
        <div className="grid grid-cols-[0.9fr_1fr_1.3fr_0.8fr_0.8fr_auto] gap-3 border-b border-border bg-foreground/5 px-4 py-2.5 text-[11px] uppercase tracking-wider text-muted-foreground">
          <span>Type</span>
          <span>Target</span>
          <span>Result</span>
          <span>Actor</span>
          <span>Date</span>
          <span />
        </div>
        {isLoading ? (
          <PortalLoadingRows count={5} />
        ) : error ? (
          <div className="px-4 py-8 text-sm text-destructive">
            Unable to load Board decision history.
          </div>
        ) : visible.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-muted-foreground">
            No decision history found.
          </div>
        ) : (
          visible.map((item) => (
            <div
              key={item.id + item.type}
              className="grid grid-cols-[0.9fr_1fr_1.3fr_0.8fr_0.8fr_auto] items-center gap-3 border-b border-border px-4 py-3 text-[13px] last:border-b-0"
            >
              <span>
                <PortalPill tone={item.type === "Cancellation Review" ? "warn" : "primary"}>
                  {item.type}
                </PortalPill>
              </span>
              <span className="font-semibold">{item.target}</span>
              <span>{item.result}</span>
              <span className="text-muted-foreground">{item.actor || "Board"}</span>
              <span className="font-mono text-xs text-muted-foreground">
                {item.date ? new Date(item.date).toLocaleDateString() : "No date"}
              </span>
              <button
                type="button"
                title={item.detail || item.result}
                className="rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-foreground/5"
              >
                Inspect
              </button>
            </div>
          ))
        )}
      </PortalCard>

      <Link
        to="/app/board/voting-sessions"
        className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm transition hover:bg-foreground/5"
      >
        <History className="h-4 w-4" /> Back to active voting
      </Link>
    </DecisionPortalShell>
  );
}
