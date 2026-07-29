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
import { SearchToolbar, SortableHeader } from "@/shared/ui";
import { useSortableData } from "@/shared/lib/use-sortable-data";
import { Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";

const FILTERS = ["All", "Proposal", "At-risk", "Session"] as const;

export function DecisionHistoryPage() {
  const { data: history = [], isLoading, isError, error } = useBoardDecisionHistoryQuery();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const [query, setQuery] = useState("");
  const filteredRows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return history
      .filter((row) => filter === "All" || row.type === filter)
      .filter((row) => !needle || row.title.toLowerCase().includes(needle));
  }, [filter, query, history]);

  const {
    sorted: rows,
    sortKey,
    sortDirection,
    toggleSort,
  } = useSortableData(
    filteredRows,
    {
      type: (row) => row.type,
      title: (row) => row.title,
      status: (row) => row.status,
      date: (row) => (row.date ? new Date(row.date) : undefined),
    },
    { key: "date", direction: "desc" },
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

        <div className="px-3 pb-2">
          <SearchToolbar
            query={query}
            onQueryChange={setQuery}
            placeholder="Search series or session"
          />
        </div>

        {isLoading ? (
          <TableSkeleton rows={3} columns={5} />
        ) : isError ? (
          <ErrorState
            title="Unable to load decision history"
            description={error instanceof Error ? error.message : "Please try again later."}
          />
        ) : rows.length === 0 ? (
          <EmptyState title="No decision history yet" />
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="py-2 pl-3">
                  <SortableHeader
                    label="Type"
                    sortKey="type"
                    activeSortKey={sortKey}
                    direction={sortDirection}
                    onSort={toggleSort}
                  />
                </th>
                <th className="py-2">
                  <SortableHeader
                    label="Series / Session"
                    sortKey="title"
                    activeSortKey={sortKey}
                    direction={sortDirection}
                    onSort={toggleSort}
                  />
                </th>
                <th className="py-2">
                  <SortableHeader
                    label="Decision"
                    sortKey="status"
                    activeSortKey={sortKey}
                    direction={sortDirection}
                    onSort={toggleSort}
                  />
                </th>
                <th className="py-2">
                  <SortableHeader
                    label="Date"
                    sortKey="date"
                    activeSortKey={sortKey}
                    direction={sortDirection}
                    onSort={toggleSort}
                  />
                </th>
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
                    {row.date ? new Date(row.date).toLocaleString("en-US") : "—"}
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
