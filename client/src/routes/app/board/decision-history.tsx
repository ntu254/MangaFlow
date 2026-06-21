import { createFileRoute, Link } from "@tanstack/react-router";
import { Filter, History } from "lucide-react";
import { useMemo, useState } from "react";
import {
  DecisionPortalShell,
  PortalCard,
  PortalNotice,
  PortalPill,
} from "@/features/board/components/DecisionPortal";

export const Route = createFileRoute("/app/board/decision-history")({
  component: DecisionHistoryPage,
});

const decisionHistory = [
  {
    id: "decision-jojo-approve",
    type: "Series Approval",
    series: "Steel Ball Run",
    result: "Approved for monthly release",
    actor: "Board Chair",
    date: "2026-06-20",
    detail: "Quorum reached. Publication type set to monthly.",
  },
  {
    id: "decision-vagabond-warning",
    type: "Cancellation Review",
    series: "Vagabond",
    result: "Hold with warning",
    actor: "Board Chair",
    date: "2026-06-18",
    detail: "Ranking decline requires two-week recovery plan.",
  },
  {
    id: "decision-ranking-final",
    type: "Ranking",
    series: "2026-W24",
    result: "Ranking finalized",
    actor: "Board",
    date: "2026-06-17",
    detail: "Reader vote data locked for the issue period.",
  },
];

function DecisionHistoryPage() {
  const [filter, setFilter] = useState("all");
  const visible = useMemo(
    () =>
      filter === "all" ? decisionHistory : decisionHistory.filter((item) => item.type === filter),
    [filter],
  );
  const types = Array.from(new Set(decisionHistory.map((item) => item.type)));

  return (
    <DecisionPortalShell
      active="/app/board/decision-history"
      title="Decision History"
      description="Inspect past approvals, ranking finalizations, and cancellation review decisions."
    >
      <PortalNotice>
        Board audit history needs a Board-readable endpoint. This screen is shaped for that contract
        and currently uses local operational examples.
      </PortalNotice>

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

      <PortalCard title="Decision ledger" description="Filter and inspect Board-level actions.">
        <div className="grid grid-cols-[0.9fr_1fr_1.3fr_0.8fr_0.8fr_auto] gap-3 border-b border-border bg-foreground/5 px-4 py-2.5 text-[11px] uppercase tracking-wider text-muted-foreground">
          <span>Type</span>
          <span>Target</span>
          <span>Result</span>
          <span>Actor</span>
          <span>Date</span>
          <span />
        </div>
        {visible.map((item) => (
          <div
            key={item.id}
            className="grid grid-cols-[0.9fr_1fr_1.3fr_0.8fr_0.8fr_auto] items-center gap-3 border-b border-border px-4 py-3 text-[13px] last:border-b-0"
          >
            <span>
              <PortalPill tone="primary">{item.type}</PortalPill>
            </span>
            <span className="font-semibold">{item.series}</span>
            <span>{item.result}</span>
            <span className="text-muted-foreground">{item.actor}</span>
            <span className="font-mono text-xs text-muted-foreground">{item.date}</span>
            <button
              type="button"
              title={item.detail}
              className="rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-foreground/5"
            >
              Inspect
            </button>
          </div>
        ))}
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
