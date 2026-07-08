import { useBoardDecisionHistoryQuery } from "../api/decisions.queries";
import {
  DataManagementTableCard,
  ErrorState,
  PageHeader,
  PageShell,
  TableSkeleton,
  TableToolbar,
} from "@/shared/layout/page-layout";
import { EmptyState } from "@/shared/ui/empty-state";
import { StatusPill } from "@/shared/ui/status-pill";
import { Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";

const FILTERS = ["All", "Proposal", "At-risk", "Session"] as const;

export function DecisionHistoryPage() {
  const { data: history = [], isLoading, isError, error } = useBoardDecisionHistoryQuery();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const rows = useMemo(
    () => history.filter((row) => filter === "All" || row.type === filter),
    [filter, history],
  );

  return (
    <PageShell>
      <PageHeader
        eyebrow="Governance"
        title="Decision history"
        description="Proposal decisions, at-risk outcomes, and voting session outcomes."
      />
      <DataManagementTableCard>
        <TableToolbar>
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((item) => (
              <button
                key={item}
                onClick={() => setFilter(item)}
                className={`rounded border px-3 py-1.5 text-xs font-semibold ${
                  filter === item
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-card hover:bg-muted"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </TableToolbar>

        {isLoading ? (
          <TableSkeleton rows={3} columns={5} />
        ) : isError ? (
          <ErrorState
            title="Không thể tải decision history"
            description={error instanceof Error ? error.message : "Vui lòng thử lại sau."}
          />
        ) : rows.length === 0 ? (
          <EmptyState title="Chưa có decision history" />
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="py-2 pl-3">Type</th>
                <th className="py-2">Series / Session</th>
                <th className="py-2">Decision</th>
                <th className="py-2">Date</th>
                <th className="py-2 pr-3">Detail</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={`${row.type}-${row.id}`} className="border-t border-border/60">
                  <td className="py-2 pl-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    {row.type}
                  </td>
                  <td className="py-2 font-medium">{row.title}</td>
                  <td className="py-2">
                    <StatusPill status={row.status} />
                  </td>
                  <td className="py-2 text-xs text-muted-foreground">
                    {row.date ? new Date(row.date).toLocaleString("vi-VN") : "—"}
                  </td>
                  <td className="py-2 pr-3">
                    <Link to={row.href as never} className="text-xs font-semibold underline">
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </DataManagementTableCard>
    </PageShell>
  );
}
