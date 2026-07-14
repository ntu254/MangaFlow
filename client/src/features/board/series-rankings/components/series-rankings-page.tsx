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
  setTableFilter,
  tableStateToSearchParams,
  type TableState,
} from "@/shared/table";
import {
  Notice,
  PageHeader,
  QueueTabs,
  SearchToolbar,
  ServerDataTable,
  StatCard,
  type QueueTab,
} from "@/shared/ui";
import type { ColumnDef } from "@tanstack/react-table";
import { BarChart3, RotateCcw, ShieldAlert, TrendingUp, TriangleAlert } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { RankingImportPanel } from "../../rankings";

const DEFAULT_RANKING_TABLE_STATE: Partial<TableState> = {
  pageSize: 10,
  sortBy: "finalScore",
  sortDir: "desc",
};

function useRankingTableState() {
  const [tableState, setTableState] = useState(() =>
    parseTableStateFromSearchParams(
      typeof window === "undefined"
        ? new URLSearchParams()
        : new URLSearchParams(window.location.search),
      DEFAULT_RANKING_TABLE_STATE,
    ),
  );

  useEffect(() => {
    const params = tableStateToSearchParams(tableState);
    const nextUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState(null, "", nextUrl);
  }, [tableState]);

  return [tableState, setTableState] as const;
}

function formatScore(value: unknown) {
  return typeof value === "number" ? value.toFixed(1) : "—";
}

function formatNumber(value: unknown) {
  return typeof value === "number" ? value.toLocaleString() : "—";
}

function isAtRisk(row: SeriesRanking) {
  return row.atRisk || row.status === "AT_RISK";
}

function RiskBadge({ row }: { row: SeriesRanking }) {
  const risk = isAtRisk(row);
  return (
    <span
      className={
        risk
          ? "inline-flex rounded border border-rose-300 bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-900"
          : "inline-flex rounded border border-emerald-300 bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-900"
      }
    >
      {risk ? "AT RISK" : "STABLE"}
    </span>
  );
}

export function SeriesRankingsPage() {
  const [tab, setTab] = useState<"rankings" | "import">("rankings");
  const [tableState, setTableState] = useRankingTableState();
  const { data: rankingList, isLoading, error } = useRankingsListContractQuery(tableState);

  const rankings = rankingList?.data ?? [];
  const pagination = rankingList?.pagination ?? {
    page: tableState.page,
    pageSize: tableState.pageSize,
    total: 0,
  };
  const summary = rankingList?.meta.summary ?? {
    total: 0,
    atRisk: 0,
    byStatus: {},
  };
  const atRiskFilter =
    tableState.filters.atRisk?.type === "boolean"
      ? tableState.filters.atRisk.value
        ? "AT_RISK"
        : "STABLE"
      : "ALL";
  const statusFilter =
    tableState.filters.status?.type === "select" ? String(tableState.filters.status.value) : "ALL";
  const sortValue = `${tableState.sortBy ?? "finalScore"}:${tableState.sortDir}`;
  const filtersActive =
    tableState.q.trim().length > 0 || Object.keys(tableState.filters).length > 0;
  const topSeries = rankings[0]?.seriesTitle ?? "—";

  const columns = useMemo<ColumnDef<SeriesRanking, unknown>[]>(
    () => [
      {
        id: "seriesTitle",
        header: "Series",
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="truncate font-semibold text-[var(--admin-ink)]">
              {row.original.seriesTitle}
            </p>
            <p className="truncate text-[11px] text-[var(--admin-faint)]">
              {row.original.seriesId}
            </p>
          </div>
        ),
      },
      {
        id: "period",
        header: "Period",
        cell: ({ row }) => (
          <span className="font-mono text-xs text-[var(--admin-muted)]">{row.original.period}</span>
        ),
      },
      {
        id: "finalScore",
        header: "Final score",
        cell: ({ row }) => (
          <span className="font-mono font-semibold tabular-nums">
            {formatScore(row.original.finalScore)}
          </span>
        ),
      },
      {
        id: "readerScore",
        header: "Reader score",
        cell: ({ row }) => (
          <span className="font-mono tabular-nums">{formatScore(row.original.readerScore)}</span>
        ),
      },
      {
        id: "voteCount",
        header: "Votes",
        cell: ({ row }) => (
          <span className="font-mono tabular-nums">{formatNumber(row.original.voteCount)}</span>
        ),
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => <RiskBadge row={row.original} />,
      },
    ],
    [],
  );

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        eyebrow="Governance"
        title="Series rankings"
        description="Reader score, votes, final score, and at-risk signals from imported ranking data."
      />
      <Notice icon={<ShieldAlert className="size-5" />} title="Governance notice">
        Rankings create risk signals only. Lifecycle decisions still require a Tantou at-risk report
        and a Board decision.
      </Notice>

      <QueueTabs
        tabs={
          [
            { key: "rankings", label: "Rankings" },
            { key: "import", label: "Import CSV" },
          ] satisfies QueueTab[]
        }
        active={tab}
        onChange={(key) => setTab(key as "rankings" | "import")}
      />

      {tab === "rankings" ? (
        <>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              icon={<BarChart3 className="size-4" />}
              tone="blue"
              label="Rows"
              value={summary.total}
              hint="current query"
            />
            <StatCard
              icon={<TriangleAlert className="size-4" />}
              tone="rose"
              label="At-risk"
              value={summary.atRisk}
              hint="requires report"
            />
            <StatCard
              icon={<TrendingUp className="size-4" />}
              tone="emerald"
              label="Top on page"
              value={topSeries}
              hint="sorted result"
            />
            <StatCard
              icon={<ShieldAlert className="size-4" />}
              tone="neutral"
              label="Active"
              value={summary.byStatus.ACTIVE ?? 0}
              hint="stable status"
            />
          </div>

          <ServerDataTable
            data={rankings}
            columns={columns}
            getRowId={(row) => row.id}
            isLoading={isLoading}
            error={error}
            emptyTitle="No ranking rows"
            emptyDescription="Try another search, reset filters, or import a ranking CSV."
            skeletonRows={tableState.pageSize}
            toolbar={
              <SearchToolbar
                query={tableState.q}
                onQueryChange={(q) => setTableState((state) => ({ ...state, q, page: 1 }))}
                placeholder="Search series, period, or status"
                filters={
                  <>
                    <Select
                      value={atRiskFilter}
                      onValueChange={(value) =>
                        setTableState((state) =>
                          setTableFilter(
                            state,
                            "atRisk",
                            value === "ALL"
                              ? undefined
                              : { type: "boolean", value: value === "AT_RISK" },
                          ),
                        )
                      }
                    >
                      <SelectTrigger className="h-10 w-[150px] rounded-[6px] border-[var(--admin-border)] bg-[var(--admin-surface)] text-[13px] shadow-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">All risk</SelectItem>
                        <SelectItem value="AT_RISK">At-risk</SelectItem>
                        <SelectItem value="STABLE">Stable</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select
                      value={statusFilter}
                      onValueChange={(value) =>
                        setTableState((state) =>
                          setTableFilter(
                            state,
                            "status",
                            value === "ALL" ? undefined : { type: "select", value },
                          ),
                        )
                      }
                    >
                      <SelectTrigger className="h-10 w-[150px] rounded-[6px] border-[var(--admin-border)] bg-[var(--admin-surface)] text-[13px] shadow-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">All status</SelectItem>
                        <SelectItem value="ACTIVE">Active</SelectItem>
                        <SelectItem value="AT_RISK">At-risk</SelectItem>
                      </SelectContent>
                    </Select>
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
                        <SelectItem value="finalScore:desc">Highest score</SelectItem>
                        <SelectItem value="finalScore:asc">Lowest score</SelectItem>
                        <SelectItem value="voteCount:desc">Most votes</SelectItem>
                        <SelectItem value="seriesTitle:asc">Series A-Z</SelectItem>
                        <SelectItem value="period:desc">Latest period</SelectItem>
                      </SelectContent>
                    </Select>
                  </>
                }
                actions={
                  <Button
                    type="button"
                    variant="outline"
                    disabled={!filtersActive}
                    onClick={() => setTableState(resetTableState(DEFAULT_RANKING_TABLE_STATE))}
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
              itemName: "rankings",
            }}
          />
        </>
      ) : (
        <RankingImportPanel />
      )}
    </div>
  );
}
