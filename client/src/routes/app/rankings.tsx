import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, BarChart3, Filter, Lock } from "lucide-react";
import { useMemo, useState } from "react";
import { EmptyState } from "@/layouts/AppShell";
import { useFinalizeRanking, useRankings } from "@/shared/queries/useRankings";
import { rankings as fallbackRankings, findSeries } from "@/entities";
import { num } from "@/shared/lib/format";
import {
  boardFlowSteps,
  DecisionPortalShell,
  DecisionTimeline,
  PortalCard,
  PortalLoadingRows,
  PortalPill,
} from "@/features/board/components/DecisionPortal";

export const Route = createFileRoute("/app/rankings")({
  component: RankingBoardPage,
});

function RankingBoardPage() {
  const { data: remoteRankings = [], isLoading, error } = useRankings();
  const finalizeRanking = useFinalizeRanking();
  const fallbackRows = fallbackRankings.flatMap((period) =>
    period.entries.map((entry) => {
      const series = findSeries(entry.seriesId);
      return {
        id: `${period.id}-${entry.seriesId}`,
        period: period.period,
        seriesId: entry.seriesId,
        title: series?.title ?? entry.seriesId,
        votes: entry.votes,
        readerScore: Math.max(1, 10 - entry.rank * 0.7),
        finalScore: Math.max(1, 100 - entry.rank * 8),
        rank: entry.rank,
        status: period.locked ? "FINALIZED" : "DRAFT",
        canFinalize: false,
      };
    }),
  );

  const remoteRows = remoteRankings.map((item) => {
    const series = typeof item.seriesId === "string" ? undefined : item.seriesId;
    return {
      id:
        item.id ??
        item._id ??
        `${item.period}-${typeof item.seriesId === "string" ? item.seriesId : series?.id}`,
      period: item.period,
      seriesId:
        typeof item.seriesId === "string" ? item.seriesId : (series?.id ?? series?._id ?? ""),
      title: series?.title ?? "Series",
      votes: item.voteCount,
      readerScore: item.readerScore,
      finalScore: item.finalScore,
      rank: 0,
      status: item.status,
      canFinalize: Boolean(item.id ?? item._id),
    };
  });

  const rows = remoteRows.length ? remoteRows : fallbackRows;
  const periods = Array.from(new Set(rows.map((row) => row.period)));
  const [period, setPeriod] = useState("all");
  const visibleRows = useMemo(() => {
    const filtered = period === "all" ? rows : rows.filter((row) => row.period === period);
    return [...filtered]
      .sort((a, b) => b.finalScore - a.finalScore)
      .map((row, index) => ({ ...row, rank: row.rank || index + 1 }));
  }, [period, rows]);
  const riskRows = visibleRows.filter((row) => row.rank >= 5 || row.finalScore < 55);

  return (
    <DecisionPortalShell
      active="/app/rankings"
      title="Ranking analytics"
      description="Filter reader vote periods, compare series performance, identify risk cases, and finalize ranking entries."
      actions={
        <Link
          to="/app/board/reader-votes"
          className="inline-flex h-9 items-center gap-2 rounded-md border border-border px-3 text-sm font-medium transition hover:bg-foreground/5 active:translate-y-px"
        >
          <BarChart3 className="h-4 w-4" /> Enter vote data
        </Link>
      }
    >
      <DecisionTimeline steps={boardFlowSteps} activeStep={4} />

      <div className="flex flex-col gap-3 rounded-md border border-border bg-card p-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Filter className="h-4 w-4 text-muted-foreground" /> Filter by period
        </div>
        <select
          value={period}
          onChange={(event) => setPeriod(event.target.value)}
          className="h-9 rounded-md border border-border bg-background px-3 text-sm"
        >
          <option value="all">All periods</option>
          {periods.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>

      <section className="grid gap-4 lg:grid-cols-[1fr_0.38fr]">
        <PortalCard
          title="Ranking table"
          description="Sorted by final score for the selected period."
        >
          <div className="grid grid-cols-[0.4fr_1.3fr_0.8fr_0.8fr_0.8fr_0.8fr_auto] gap-3 border-b border-border bg-foreground/5 px-4 py-2.5 text-[11px] uppercase tracking-wider text-muted-foreground">
            <span>Rank</span>
            <span>Series</span>
            <span>Period</span>
            <span>Votes</span>
            <span>Reader</span>
            <span>Score</span>
            <span />
          </div>

          {isLoading ? (
            <PortalLoadingRows count={5} />
          ) : error && rows.length === 0 ? (
            <div className="px-4 py-8 text-sm text-destructive">Unable to load ranking data.</div>
          ) : visibleRows.length === 0 ? (
            <EmptyState
              title="No ranking entries"
              hint="Import reader vote data to generate a ranking board."
              icon={BarChart3}
            />
          ) : (
            visibleRows.map((row) => (
              <div
                key={row.id}
                className="grid grid-cols-[0.4fr_1.3fr_0.8fr_0.8fr_0.8fr_0.8fr_auto] items-center gap-3 border-b border-border px-4 py-3 text-[13px] last:border-b-0"
              >
                <span className="font-mono text-xs text-muted-foreground">#{row.rank}</span>
                <span className="font-semibold">{row.title}</span>
                <span className="text-xs text-muted-foreground">{row.period}</span>
                <span className="font-mono text-xs">{num(row.votes)}</span>
                <span className="font-mono text-xs">{row.readerScore.toFixed(1)}</span>
                <PortalPill tone={row.finalScore < 55 ? "warn" : "primary"}>
                  {row.finalScore.toFixed(1)}
                </PortalPill>
                <button
                  type="button"
                  disabled={
                    !row.canFinalize || row.status === "FINALIZED" || finalizeRanking.isPending
                  }
                  onClick={() => finalizeRanking.mutate(row.id)}
                  className="inline-flex h-7 items-center gap-1 rounded-md border border-border px-2 text-xs disabled:opacity-45"
                >
                  <Lock className="h-3.5 w-3.5" />
                  {row.status === "FINALIZED" ? "Final" : "Finalize"}
                </button>
              </div>
            ))
          )}
        </PortalCard>

        <aside className="space-y-4">
          <PortalCard title="Compare series" description="Top series by final score.">
            <div className="mt-3 space-y-2">
              {visibleRows.slice(0, 4).map((row) => (
                <div key={row.id} className="rounded-md bg-foreground/5 p-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{row.title}</span>
                    <span className="font-mono text-xs">#{row.rank}</span>
                  </div>
                  <div className="mt-2 h-1.5 rounded-full bg-background">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${Math.min(100, Math.max(4, row.finalScore))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </PortalCard>

          <PortalCard title="Risk series" description="Candidates for cancellation review.">
            <div className="mt-2 space-y-2">
              {riskRows.length ? (
                riskRows.slice(0, 4).map((row) => (
                  <Link
                    key={row.id}
                    to="/app/board/cancellation-review"
                    className="flex items-center justify-between rounded-md border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-sm"
                  >
                    <span>{row.title}</span>
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                  </Link>
                ))
              ) : (
                <div className="py-6 text-sm text-muted-foreground">
                  No risk series in this period.
                </div>
              )}
            </div>
          </PortalCard>
        </aside>
      </section>
    </DecisionPortalShell>
  );
}
