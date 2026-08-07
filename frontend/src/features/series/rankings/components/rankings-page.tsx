import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DataTable,
  EmptyState,
  MetricCard,
  MetricGrid,
  PageHeader,
  StateBlock,
  StatusPill,
  type QueueTab,
} from "@/shared/ui";
import { Link } from "@tanstack/react-router";
import { Award, BookOpen, ShieldAlert, TrendingUp, Vote } from "lucide-react";
import { useMemo, useState } from "react";
import { useAuth } from "@/shared/auth";
import {
  mapApiError,
  type SeriesRanking,
  useMySeriesQuery,
  useRankingsListQuery,
  useRankingsQuery,
} from "../../api/series-queries";

export function RankingsPage() {
  const user = useAuth((state) => state.user);
  const isEditor = user?.role === "editor";
  const isMangaka = user?.role === "mangaka";
  const allRankingsQuery = useRankingsListQuery(isEditor || isMangaka);
  const {
    data: seriesList = [],
    isLoading: isSeriesLoading,
    isError: isSeriesError,
    error: seriesError,
  } = useMySeriesQuery(!isEditor && !isMangaka);
  const activeSeriesId = seriesList[0]?.id || "";
  const activeSeries = useMemo(
    () => seriesList.find((series) => series.id === activeSeriesId),
    [seriesList, activeSeriesId],
  );
  const {
    data: rankings = [],
    isLoading: isRankingsLoading,
    isError: isRankingsError,
    error: rankingsError,
  } = useRankingsQuery(activeSeriesId);
  const latest = rankings[0];

  if (isEditor) {
    return <AllSeriesRankingsPage query={allRankingsQuery} />;
  }

  if (isMangaka) {
    return (
      <AllSeriesRankingsPage
        query={allRankingsQuery}
        title="Published series rankings"
        description="Compare the latest reader response across all published series."
      />
    );
  }

  if (isSeriesLoading) {
    return (
      <div className="mx-auto max-w-6xl space-y-6">
        <PageHeader
          eyebrow="Analytics"
          title="Rankings & Reviews"
          description="Loading series list and ranking data."
        />
        <DataTable isLoading skeletonRows={6} skeletonColumns={5} />
      </div>
    );
  }

  if (isSeriesError) {
    return (
      <div className="mx-auto max-w-6xl space-y-6">
        <PageHeader
          eyebrow="Analytics"
          title="Rankings & Reviews"
          description="Track performance and reader feedback weekly."
        />
        <StateBlock
          tone="danger"
          title="Failed to load series list"
          description={mapApiError(seriesError)}
        />
      </div>
    );
  }

  if (seriesList.length === 0) {
    return (
      <div className="mx-auto max-w-6xl space-y-6">
        <PageHeader
          eyebrow="Analytics"
          title="Rankings & Reviews"
          description="Track performance and reader feedback weekly."
        />
        <EmptyState
          icon={<BookOpen className="size-5" />}
          title="No series yet"
          description="You do not own any series in production to view ranking data."
          action={
            <Link
              to="/app/series"
              className="inline-flex h-10 items-center rounded-[6px] border border-[var(--admin-navy)] bg-[var(--admin-navy)] px-4 text-[13px] font-semibold text-[var(--admin-cream)] hover:bg-[var(--admin-navy-light)]"
            >
              Back to Series
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        eyebrow="Analytics"
        title="Rankings & Reviews"
        description="Track reader feedback, average scores, and series health alerts."
      />

      <>
          {isRankingsError ? (
            <StateBlock
              tone="danger"
              title="Failed to load ranking data"
              description={mapApiError(rankingsError)}
            />
          ) : null}

          {!isRankingsError && !isRankingsLoading && rankings.length > 0 ? (
            <MetricGrid>
              <MetricCard
                icon={<TrendingUp className="size-5" />}
                label="Final Score"
                value={latest?.finalScore?.toFixed(1) ?? "-"}
                hint="Latest composite score"
              />
              <MetricCard
                icon={<Award className="size-5" />}
                label="Reader Score"
                value={`${latest?.readerScore?.toFixed(1) ?? "-"}/10`}
                hint="Average reader vote score"
              />
              <MetricCard
                icon={<Vote className="size-5" />}
                label="Total votes"
                value={latest?.voteCount?.toLocaleString("en-US") ?? "-"}
                hint="Votes in the current week"
              />
              <MetricCard
                icon={<ShieldAlert className="size-5" />}
                label="Risk status"
                value={latest?.atRisk ? "At risk" : "Stable"}
                hint={
                  latest?.atRisk
                    ? "Vote count is declining and needs attention."
                    : "Engagement metrics are stable."
                }
                tone={latest?.atRisk ? "danger" : "success"}
              />
            </MetricGrid>
          ) : null}

          {isRankingsLoading ? (
            <DataTable isLoading skeletonRows={6} skeletonColumns={5} />
          ) : isRankingsError ? null : rankings.length === 0 ? (
            <DataTable
              isEmpty
              emptyTitle="No ranking data yet"
              emptyDescription={`No weekly data available for series "${activeSeries?.title ?? ""}".`}
            />
          ) : (
            <DataTable>
              <div className="border-b border-[var(--admin-border)] px-5 py-4">
                <h2 className="font-serif text-[18px] font-semibold text-[var(--admin-ink)]">
                  Weekly ranking history
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="border-b border-[var(--admin-border)] text-left font-serif text-[14px] text-[var(--admin-ink)]">
                      <th className="px-5 py-3 font-semibold">Week</th>
                      <th className="px-3 py-3 text-right font-semibold">Votes</th>
                      <th className="px-3 py-3 text-right font-semibold">Reader Score</th>
                      <th className="px-3 py-3 text-right font-semibold">Final Score</th>
                      <th className="px-5 py-3 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rankings.map((ranking: SeriesRanking) => (
                      <tr
                        key={ranking.id}
                        className="border-b border-[var(--admin-border)] last:border-0 hover:bg-[var(--admin-hover)]"
                      >
                        <td className="px-5 py-3 font-semibold text-[var(--admin-ink)]">
                          {ranking.period}
                        </td>
                        <td className="px-3 py-3 text-right text-[var(--admin-muted)] tabular-nums">
                          {ranking.voteCount?.toLocaleString("en-US")}
                        </td>
                        <td className="px-3 py-3 text-right text-[var(--admin-muted)] tabular-nums">
                          {ranking.readerScore?.toFixed(1)}
                        </td>
                        <td className="px-3 py-3 text-right font-semibold text-[var(--admin-ink)] tabular-nums">
                          {ranking.finalScore?.toFixed(1)}
                        </td>
                        <td className="px-5 py-3">
                          <StatusPill
                            status={ranking.status || (ranking.atRisk ? "at_risk" : "submitted")}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </DataTable>
          )}
      </>
    </div>
  );
}

function AllSeriesRankingsPage({
  query,
  title = "Series rankings",
  description = "Review ranking performance across the full editorial series slate.",
}: {
  query: ReturnType<typeof useRankingsListQuery>;
  title?: string;
  description?: string;
}) {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        eyebrow="Editorial analytics"
        title={title}
        description={description}
      />
      <AllSeriesRankingsTable query={query} />
    </div>
  );
}

function AllSeriesRankingsTable({ query }: { query: ReturnType<typeof useRankingsListQuery> }) {
  const rankings = useMemo(() => query.data ?? [], [query.data]);
  const periods = useMemo(() => Array.from(new Set(rankings.map((row) => row.period))), [rankings]);
  const [selectedPeriod, setSelectedPeriod] = useState("");
  const period = selectedPeriod || periods[0] || "";
  const rows = useMemo(
    () =>
      rankings
        .filter((ranking) => ranking.period === period)
        .sort((a, b) => (b.finalScore ?? 0) - (a.finalScore ?? 0)),
    [rankings, period],
  );

  return (
    <>
      {query.isLoading ? <DataTable isLoading skeletonRows={6} skeletonColumns={7} /> : null}
      {query.isError ? (
        <StateBlock
          tone="danger"
          title="Failed to load ranking data"
          description={mapApiError(query.error)}
        />
      ) : null}
      {!query.isLoading && !query.isError && rankings.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="size-5" />}
          title="No ranking data yet"
          description="The Board has not imported ranking data for any series."
        />
      ) : null}
      {!query.isLoading && !query.isError && rankings.length > 0 ? (
        <>
          <div className="flex items-center gap-3">
            <label
              htmlFor="ranking-period"
              className="text-[12px] font-semibold text-[var(--admin-muted)]"
            >
              Period
            </label>
            <Select value={period} onValueChange={setSelectedPeriod}>
              <SelectTrigger
                id="ranking-period"
                className="h-10 w-56 rounded-[6px] border-[var(--admin-border)] bg-[var(--admin-surface)] text-[13px]"
              >
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                {periods.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DataTable>
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-[var(--admin-border)] text-left font-serif text-[14px] text-[var(--admin-ink)]">
                    <th className="px-5 py-3 font-semibold">Rank</th>
                    <th className="px-3 py-3 font-semibold">Series</th>
                    <th className="px-3 py-3 text-right font-semibold">Votes</th>
                    <th className="px-3 py-3 text-right font-semibold">Reader score</th>
                    <th className="px-3 py-3 text-right font-semibold">Final score</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((ranking, index) => (
                    <tr
                      key={ranking.id}
                      className="border-b border-[var(--admin-border)] last:border-0 hover:bg-[var(--admin-hover)]"
                    >
                      <td className="px-5 py-3 font-mono font-semibold text-[var(--admin-ink)]">
                        {index + 1}
                      </td>
                      <td className="px-3 py-3 font-semibold text-[var(--admin-ink)]">
                        {ranking.seriesTitle}
                      </td>
                      <td className="px-3 py-3 text-right text-[var(--admin-muted)] tabular-nums">
                        {ranking.voteCount?.toLocaleString("en-US") ?? "-"}
                      </td>
                      <td className="px-3 py-3 text-right text-[var(--admin-muted)] tabular-nums">
                        {ranking.readerScore?.toFixed(1) ?? "-"}
                      </td>
                      <td className="px-3 py-3 text-right font-semibold text-[var(--admin-ink)] tabular-nums">
                        {ranking.finalScore?.toFixed(1) ?? "-"}
                      </td>
                      <td className="px-5 py-3">
                        <StatusPill
                          status={ranking.status || (ranking.atRisk ? "at_risk" : "submitted")}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </DataTable>
        </>
      ) : null}
    </>
  );
}
