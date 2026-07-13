import { useMemo, useState } from "react";
import { AlertTriangle, FileText, ListChecks, ShieldAlert, TrendingDown } from "lucide-react";
import { AtRiskDecisionPanel } from "./at-risk-decision-panel";
import {
  Notice,
  QueuePage,
  QueueTable,
  StatCard,
  StateBlock,
  StatusPill,
  type QueueAccent,
  type QueueColumn,
} from "@/shared/ui";
import { useRankingsListQuery } from "@/entities/series";
import {
  useBoardQueueQuery,
  useLatestAtRiskReportQuery,
  type AtRiskQueueItem,
} from "../../api/board-queries";

type BoardAtRiskRow = AtRiskQueueItem & {
  readerScore: number;
  voteCount: number;
  finalScore: number;
  rankingStatus: string;
  period: string;
};

function isAtRiskQueueItem(item: unknown): item is AtRiskQueueItem {
  return (
    typeof item === "object" &&
    item !== null &&
    (item as { seriesStatus?: string }).seriesStatus === "AT_RISK"
  );
}

export function AtRiskReviewsPage() {
  const {
    data: queue = [],
    isLoading: queueLoading,
    error: queueError,
  } = useBoardQueueQuery();
  const {
    data: rankings = [],
    isLoading: rankingsLoading,
    error: rankingsError,
  } = useRankingsListQuery();
  const atRiskItems = queue.filter(isAtRiskQueueItem);
  const rows = useMemo<BoardAtRiskRow[]>(
    () =>
      atRiskItems.map((item) => {
        const ranking = rankings.find((row) => row.seriesId === item.seriesId);
        return {
          ...item,
          readerScore: ranking?.readerScore ?? 0,
          voteCount: ranking?.voteCount ?? 0,
          finalScore: ranking?.finalScore ?? 0,
          rankingStatus: ranking?.status ?? "AT_RISK",
          period: ranking?.period ?? "Latest",
        };
      }),
    [atRiskItems, rankings],
  );
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const selected = rows.find((row) => row.id === selectedId) ?? rows[0];
  const {
    data: latestReport,
    isLoading: reportLoading,
    error: reportError,
  } = useLatestAtRiskReportQuery(selected?.seriesId ?? "");
  const isLoading = queueLoading || rankingsLoading;
  const loadError = queueError ?? rankingsError;

  const stats = useMemo(
    () => ({
      total: rows.length,
      lowScore: rows.filter((row) => row.finalScore < 5).length,
      reports: latestReport ? 1 : 0,
    }),
    [latestReport, rows],
  );

  const columns: QueueColumn<BoardAtRiskRow>[] = [
    {
      key: "series",
      header: "Series",
      className: "min-w-[180px]",
      render: (review) => (
        <span className="font-semibold text-[var(--admin-ink)]">{review.seriesTitle}</span>
      ),
    },
    {
      key: "score",
      header: "Final",
      render: (review) => (
        <span className="tabular-nums text-[var(--admin-muted)]">
          {review.finalScore.toFixed(1)}
        </span>
      ),
    },
    {
      key: "reader",
      header: "Reader",
      render: (review) => (
        <span className="tabular-nums text-[var(--admin-muted)]">
          {review.readerScore.toFixed(1)}
        </span>
      ),
    },
    {
      key: "votes",
      header: "Votes",
      render: (review) => (
        <span className="tabular-nums text-[var(--admin-muted)]">
          {review.voteCount.toLocaleString()}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: () => <StatusPill status="at_risk" />,
    },
  ];

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
            hint="Flagged by ranking"
          />
          <StatCard
            tone="amber"
            icon={<TrendingDown className="size-4" />}
            label="Low Score"
            value={stats.lowScore}
            hint="Final score below 5"
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
            value={rows.length}
            hint="Awaiting Board"
          />
        </>
      }
    >
      <div className="space-y-4">
        <Notice icon={<AlertTriangle className="size-5" />} title="Governance notice">
          The Board decision is blocked until the assigned Tantou Editor submits a report.
        </Notice>
        {isLoading ? (
          <StateBlock title="Loading at-risk decisions" description="Fetching ranking signals and Board queue." />
        ) : loadError ? (
          <StateBlock
            tone="danger"
            title="Could not load at-risk decisions"
            description={loadError instanceof Error ? loadError.message : "Please try again."}
          />
        ) : (
          <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
            <QueueTable
              columns={columns}
              rows={rows}
              getRowKey={(review) => review.id}
              getRowAccent={(review): QueueAccent => (review.finalScore < 5 ? "rose" : "amber")}
              onRowClick={(review) => setSelectedId(review.id)}
              isRowSelected={(review) => review.id === selected?.id}
              minWidth={560}
              empty="No series need review. New at-risk signals will appear here."
            />
            {selected ? (
            <div className="space-y-4">
              <section className="rounded-md border border-[var(--admin-border)] bg-[var(--admin-surface)] p-4 text-xs">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--admin-muted)]">
                  Ranking + report
                </p>
                <dl className="mt-3 grid grid-cols-2 gap-3">
                  <Metric label="Period" value={selected.period} />
                  <Metric label="Final score" value={selected.finalScore.toFixed(1)} />
                  <Metric label="Reader score" value={selected.readerScore.toFixed(1)} />
                  <Metric label="Votes" value={selected.voteCount.toLocaleString()} />
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
