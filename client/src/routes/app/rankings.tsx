import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, BarChart3, Filter, Lock, Send } from "lucide-react";
import { useMemo, useState } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { EmptyState } from "@/layouts/AppShell";
import { useFinalizeRanking, useRankings, useSubmitRanking } from "@/shared/queries/useRankings";
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
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/shared/ui/shadcn/chart";

export const Route = createFileRoute("/app/rankings")({
  component: RankingBoardPage,
});

type RankingRow = {
  id: string;
  period: string;
  seriesId: string;
  title: string;
  votes: number;
  readerScore: number;
  finalScore: number;
  rank: number;
  status: string;
  canPersist: boolean;
};

const trendConfig = {
  votes: { label: "Votes", color: "hsl(var(--chart-1))" },
  score: { label: "Avg score", color: "hsl(var(--chart-2))" },
} satisfies ChartConfig;

const barConfig = {
  finalScore: { label: "Final score", color: "hsl(var(--chart-1))" },
} satisfies ChartConfig;

function RankingBoardPage() {
  const { data: remoteRankings = [], isLoading, error } = useRankings();
  const finalizeRanking = useFinalizeRanking();
  const submitRanking = useSubmitRanking();

  const fallbackRows: RankingRow[] = fallbackRankings.flatMap((period) =>
    period.entries.map((entry) => {
      const series = findSeries(entry.seriesId);
      return {
        id: period.id + "-" + entry.seriesId,
        period: period.period,
        seriesId: entry.seriesId,
        title: series?.title ?? entry.seriesId,
        votes: entry.votes,
        readerScore: Math.max(1, 10 - entry.rank * 0.7),
        finalScore: Math.max(1, 100 - entry.rank * 8),
        rank: entry.rank,
        status: period.locked ? "FINALIZED" : "DRAFT",
        canPersist: false,
      };
    }),
  );

  const remoteRows: RankingRow[] = remoteRankings.map((item) => {
    const series = typeof item.seriesId === "string" ? undefined : item.seriesId;
    return {
      id:
        item.id ??
        item._id ??
        item.period + "-" + (typeof item.seriesId === "string" ? item.seriesId : series?.id),
      period: item.period,
      seriesId:
        typeof item.seriesId === "string" ? item.seriesId : (series?.id ?? series?._id ?? ""),
      title: series?.title ?? "Series",
      votes: item.voteCount,
      readerScore: item.readerScore,
      finalScore: item.finalScore,
      rank: 0,
      status: item.status,
      canPersist: Boolean(item.id ?? item._id),
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
  const totalVotes = visibleRows.reduce((sum, row) => sum + row.votes, 0);
  const averageScore = visibleRows.length
    ? visibleRows.reduce((sum, row) => sum + row.finalScore, 0) / visibleRows.length
    : 0;
  const finalizedCount = visibleRows.filter((row) => row.status === "FINALIZED").length;

  const trendData = useMemo(() => {
    return periods.map((item) => {
      const periodRows = rows.filter((row) => row.period === item);
      const votes = periodRows.reduce((sum, row) => sum + row.votes, 0);
      const score = periodRows.length
        ? periodRows.reduce((sum, row) => sum + row.finalScore, 0) / periodRows.length
        : 0;
      return { period: item, votes, score: Number(score.toFixed(1)) };
    });
  }, [periods, rows]);

  return (
    <DecisionPortalShell
      active="/app/rankings"
      title="Ranking analytics"
      description="Analyze reader signals, compare series performance, and lock ranking states through the backend workflow."
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

      <section className="grid gap-3 md:grid-cols-4">
        <AnalyticsMetric label="Total votes" value={num(totalVotes)} />
        <AnalyticsMetric label="Average score" value={averageScore.toFixed(1)} />
        <AnalyticsMetric label="Risk cases" value={String(riskRows.length)} />
        <AnalyticsMetric label="Finalized" value={String(finalizedCount)} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_0.8fr]">
        <PortalCard
          title="Period trend"
          description="Vote volume and average final score by period."
        >
          <div className="p-4">
            <ChartContainer config={trendConfig} className="h-[280px] w-full">
              <AreaChart data={trendData} margin={{ left: 12, right: 12 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="period" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  dataKey="votes"
                  type="monotone"
                  fill="var(--color-votes)"
                  fillOpacity={0.18}
                  stroke="var(--color-votes)"
                  strokeWidth={2}
                />
                <Area
                  dataKey="score"
                  type="monotone"
                  fill="var(--color-score)"
                  fillOpacity={0.12}
                  stroke="var(--color-score)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          </div>
        </PortalCard>

        <PortalCard title="Top series" description="Highest final score in the selected view.">
          <div className="p-4">
            <ChartContainer config={barConfig} className="h-[280px] w-full">
              <BarChart data={visibleRows.slice(0, 6)} layout="vertical" margin={{ left: 24 }}>
                <CartesianGrid horizontal={false} />
                <XAxis type="number" hide domain={[0, "dataMax"]} />
                <YAxis
                  type="category"
                  dataKey="title"
                  tickLine={false}
                  axisLine={false}
                  width={92}
                  tick={{ fontSize: 11 }}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="finalScore" fill="var(--color-finalScore)" radius={4} />
              </BarChart>
            </ChartContainer>
          </div>
        </PortalCard>
      </section>

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

      <section className="grid gap-4 lg:grid-cols-[1fr_0.34fr]">
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
                <RankingAction
                  row={row}
                  onSubmit={() => submitRanking.mutate(row.id)}
                  onFinalize={() => finalizeRanking.mutate(row.id)}
                  disabled={submitRanking.isPending || finalizeRanking.isPending}
                />
              </div>
            ))
          )}
        </PortalCard>

        <aside className="space-y-4">
          <PortalCard title="Risk series" description="Candidates for cancellation review.">
            <div className="space-y-2 p-3">
              {riskRows.length ? (
                riskRows.slice(0, 5).map((row) => (
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

function AnalyticsMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-card p-4">
      <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-2 font-mono text-3xl font-semibold tracking-tight">{value}</div>
    </div>
  );
}

function RankingAction({
  row,
  onSubmit,
  onFinalize,
  disabled,
}: {
  row: RankingRow;
  onSubmit: () => void;
  onFinalize: () => void;
  disabled: boolean;
}) {
  if (!row.canPersist) {
    return <span className="text-xs text-muted-foreground">Preview</span>;
  }
  if (row.status === "DRAFT") {
    return (
      <button
        type="button"
        disabled={disabled}
        onClick={onSubmit}
        className="inline-flex h-7 items-center gap-1 rounded-md border border-border px-2 text-xs disabled:opacity-45"
      >
        <Send className="h-3.5 w-3.5" /> Submit
      </button>
    );
  }
  return (
    <button
      type="button"
      disabled={row.status !== "SUBMITTED" || disabled}
      onClick={onFinalize}
      className="inline-flex h-7 items-center gap-1 rounded-md border border-border px-2 text-xs disabled:opacity-45"
    >
      <Lock className="h-3.5 w-3.5" /> {row.status === "FINALIZED" ? "Final" : "Finalize"}
    </button>
  );
}
