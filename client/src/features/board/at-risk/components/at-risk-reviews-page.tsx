import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { SeriesRanking } from "@/entities/series";
import { useRankingsListContractQuery } from "@/entities/series";
import {
  parseTableStateFromSearchParams,
  resetTableState,
  tableStateToSearchParams,
  type TableState,
} from "@/shared/table";
import {
  Notice,
  QueuePage,
  SearchToolbar,
  ServerDataTable,
  StatCard,
  StateBlock,
  StatusPill,
} from "@/shared/ui";
import type { ColumnDef } from "@tanstack/react-table";
import {
  AlertTriangle,
  FileText,
  ListChecks,
  RotateCcw,
  ShieldAlert,
  TrendingDown,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLatestAtRiskReportQuery } from "../../api/board-queries";
import { AtRiskDecisionPanel } from "./at-risk-decision-panel";

const PAGE_SIZE = 8;
const AT_RISK_FILTER = { atRisk: { type: "boolean" as const, value: true } };
const DEFAULT_AT_RISK_TABLE_STATE: Partial<TableState> = {
  pageSize: PAGE_SIZE,
  sortBy: "finalScore",
  sortDir: "asc",
  filters: AT_RISK_FILTER,
};
const EMPTY_RANKINGS: SeriesRanking[] = [];

function useAtRiskTableState() {
  const [tableState, setTableState] = useState<TableState>(() => {
    const parsed = parseTableStateFromSearchParams(
      typeof window === "undefined"
        ? new URLSearchParams()
        : new URLSearchParams(window.location.search),
      DEFAULT_AT_RISK_TABLE_STATE,
    );
    return {
      ...parsed,
      filters: {
        ...parsed.filters,
        ...AT_RISK_FILTER,
      },
    };
  });

  useEffect(() => {
    const params = tableStateToSearchParams(tableState);
    const nextUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState(null, "", nextUrl);
  }, [tableState]);

  return [tableState, setTableState] as const;
}

function score(value: unknown) {
  return typeof value === "number" ? value.toFixed(1) : "—";
}

export function AtRiskReviewsPage() {
  const [tableState, setTableState] = useAtRiskTableState();
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const { data: rankingList, isLoading, error } = useRankingsListContractQuery(tableState);

  const rows = rankingList?.data ?? EMPTY_RANKINGS;
  const pagination = rankingList?.pagination ?? {
    page: tableState.page,
    pageSize: tableState.pageSize,
    total: 0,
  };
  const selected = rows.find((row) => row.id === selectedId) ?? rows[0];
  const {
    data: latestReport,
    isLoading: reportLoading,
    error: reportError,
  } = useLatestAtRiskReportQuery(selected?.seriesId ?? "");
  const sortValue = `${tableState.sortBy ?? "finalScore"}:${tableState.sortDir}`;
  const filtersActive = tableState.q.trim().length > 0;

  const stats = useMemo(
    () => ({
      total: pagination.total,
      lowScore: rows.filter((row) => (row.finalScore ?? 0) < 5).length,
      reports: latestReport ? 1 : 0,
    }),
    [latestReport, pagination.total, rows],
  );

  const columns = useMemo<ColumnDef<SeriesRanking, unknown>[]>(
    () => [
      {
        id: "seriesTitle",
        header: "Series",
        cell: ({ row }) => (
          <button
            type="button"
            onClick={() => setSelectedId(row.original.id)}
            className="min-w-[180px] text-left font-semibold text-[var(--admin-ink)]"
          >
            {row.original.seriesTitle}
          </button>
        ),
      },
      {
        id: "finalScore",
        header: "Final",
        cell: ({ row }) => (
          <span className="tabular-nums text-[var(--admin-muted)]">
            {score(row.original.finalScore)}
          </span>
        ),
      },
      {
        id: "readerScore",
        header: "Reader",
        cell: ({ row }) => (
          <span className="tabular-nums text-[var(--admin-muted)]">
            {score(row.original.readerScore)}
          </span>
        ),
      },
      {
        id: "voteCount",
        header: "Votes",
        cell: ({ row }) => (
          <span className="tabular-nums text-[var(--admin-muted)]">
            {(row.original.voteCount ?? 0).toLocaleString()}
          </span>
        ),
      },
      {
        id: "status",
        header: "Status",
        cell: () => <StatusPill status="at_risk" />,
      },
    ],
    [],
  );

  return (
    <QueuePage
      eyebrow="Governance"
      title="At-risk Decision Detail"
      description="Review ranking signals and the latest Tantou report before deciding."
      stats={
        <>
          <StatCard
            tone="rose"
            icon={<ShieldAlert className="size-4" />}
            label="At-risk Series"
            value={stats.total}
            hint="Server-filtered"
          />
          <StatCard
            tone="amber"
            icon={<TrendingDown className="size-4" />}
            label="Low Score"
            value={stats.lowScore}
            hint="Current page below 5"
          />
          <StatCard
            tone="blue"
            icon={<FileText className="size-4" />}
            label="Selected Report"
            value={stats.reports}
            hint="Latest submitted"
          />
          <StatCard
            tone="blue"
            icon={<ListChecks className="size-4" />}
            label="Open Decisions"
            value={pagination.total}
            hint="Awaiting Board"
          />
        </>
      }
    >
      <div className="space-y-4">
        <Notice icon={<AlertTriangle className="size-5" />} title="Governance notice">
          The Board decision is blocked until the assigned Tantou Editor submits a report.
        </Notice>
        {error ? (
          <StateBlock
            tone="danger"
            title="Could not load at-risk decisions"
            description={error instanceof Error ? error.message : "Please try again."}
          />
        ) : (
          <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
            <ServerDataTable
              data={rows}
              columns={columns}
              getRowId={(row) => row.id}
              isLoading={isLoading}
              error={error}
              emptyTitle="No series need review"
              emptyDescription="New at-risk ranking signals will appear here."
              skeletonRows={tableState.pageSize}
              toolbar={
                <SearchToolbar
                  query={tableState.q}
                  onQueryChange={(q) => setTableState((state) => ({ ...state, q, page: 1 }))}
                  placeholder="Search series, period, or status..."
                  filters={
                    <Select
                      value={sortValue}
                      onValueChange={(value) => {
                        const [sortBy, sortDir] = value.split(":") as [string, "asc" | "desc"];
                        setTableState((state) => ({ ...state, sortBy, sortDir, page: 1 }));
                      }}
                    >
                      <SelectTrigger className="h-10 w-[180px] rounded-[6px] border-[var(--admin-border)] bg-[var(--admin-surface)] text-[13px] shadow-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="finalScore:asc">Lowest score</SelectItem>
                        <SelectItem value="finalScore:desc">Highest score</SelectItem>
                        <SelectItem value="voteCount:desc">Most votes</SelectItem>
                        <SelectItem value="period:desc">Latest period</SelectItem>
                      </SelectContent>
                    </Select>
                  }
                  actions={
                    <Button
                      type="button"
                      variant="outline"
                      disabled={!filtersActive}
                      onClick={() => setTableState(resetTableState(DEFAULT_AT_RISK_TABLE_STATE))}
                      className="h-10 gap-2 rounded-[6px] border-[var(--admin-border)] bg-[var(--admin-surface)] px-4 text-[13px] shadow-sm"
                    >
                      <RotateCcw className="size-4" />
                      Reset
                    </Button>
                  }
                />
              }
              pagination={{
                total: pagination.total,
                page: pagination.page,
                pageSize: pagination.pageSize,
                onPageChange: (page) => setTableState((state) => ({ ...state, page })),
                itemName: "series",
              }}
            />
            {selected ? (
              <div className="space-y-4">
                <section className="rounded-md border border-[var(--admin-border)] bg-[var(--admin-surface)] p-4 text-xs">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--admin-muted)]">
                    Ranking + report
                  </p>
                  <dl className="mt-3 grid grid-cols-2 gap-3">
                    <Metric label="Period" value={selected.period} />
                    <Metric label="Final score" value={score(selected.finalScore)} />
                    <Metric label="Reader score" value={score(selected.readerScore)} />
                    <Metric label="Votes" value={(selected.voteCount ?? 0).toLocaleString()} />
                  </dl>
                  <div className="mt-4 border-t border-[var(--admin-border)] pt-3">
                    {reportLoading ? (
                      <p className="text-[var(--admin-muted)]">Loading latest report...</p>
                    ) : reportError ? (
                      <StateBlock
                        tone="danger"
                        title="Could not load report"
                        description={
                          reportError instanceof Error ? reportError.message : "Please try again."
                        }
                      />
                    ) : latestReport ? (
                      <>
                        <p className="font-semibold text-[var(--admin-ink)]">
                          {latestReport.editorName ?? latestReport.editorId}
                        </p>
                        <p className="mt-1 text-[var(--admin-muted)]">
                          Recommendation: {latestReport.recommendation}
                        </p>
                        <p className="mt-2 text-[var(--admin-ink)]">
                          {latestReport.rankingSummary}
                        </p>
                        {latestReport.notes ? (
                          <p className="mt-2 text-[var(--admin-muted)]">{latestReport.notes}</p>
                        ) : null}
                      </>
                    ) : (
                      <p className="text-[var(--admin-muted)]">No submitted report yet.</p>
                    )}
                  </div>
                </section>
                <AtRiskDecisionPanel seriesId={selected.seriesId} report={latestReport} />
              </div>
            ) : null}
          </div>
        )}
      </div>
    </QueuePage>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] font-semibold uppercase tracking-wider text-[var(--admin-muted)]">
        {label}
      </dt>
      <dd className="font-semibold text-[var(--admin-ink)]">{value}</dd>
    </div>
  );
}
