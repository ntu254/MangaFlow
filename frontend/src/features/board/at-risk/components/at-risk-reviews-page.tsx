import { useMemo, useState } from "react";
import { ShieldAlert, TrendingDown, AlertTriangle, ListChecks } from "lucide-react";
import { AtRiskDecisionPanel } from "./at-risk-decision-panel";
import { PerformanceSnapshot } from "./performance-snapshot";
import {
  Notice,
  QueuePage,
  QueueTable,
  StatCard,
  StatusPill,
  type QueueAccent,
  type QueueColumn,
} from "@/shared/ui";
import type { AtRiskReview } from "@/entities/board/model/board-types";
import { useRankingsListQuery } from "@/entities/series";
import { isRankingAtRisk, mapRankingToAtRiskReview } from "../model/at-risk-review-adapter";

export function AtRiskReviewsPage() {
  const { data: rankings = [] } = useRankingsListQuery();
  const reviews = useMemo(
    () =>
      rankings
        .filter(isRankingAtRisk)
        .map(mapRankingToAtRiskReview)
        .sort((a, b) => (b.finalScore ?? 0) - (a.finalScore ?? 0)),
    [rankings],
  );
  const [selectedId, setSelectedId] = useState(reviews[0]?.id);
  const selected = reviews.find((review) => review.id === selectedId) ?? reviews[0];

  const stats = useMemo(
    () => ({
      total: reviews.length,
      critical: reviews.filter((r) => r.risk === "CRITICAL").length,
      high: reviews.filter((r) => r.risk === "HIGH").length,
      open: reviews.filter((r) => r.status === "OPEN").length,
    }),
    [reviews],
  );

  const columns: QueueColumn<AtRiskReview>[] = [
    {
      key: "series",
      header: "Series",
      className: "min-w-[180px]",
      render: (review) => (
        <span className="font-semibold text-[var(--admin-ink)]">{review.seriesTitle}</span>
      ),
    },
    {
      key: "risk",
      header: "Risk",
      render: (review) => (
        <StatusPill status={review.risk === "CRITICAL" ? "at_risk" : review.risk} />
      ),
    },
    {
      key: "period",
      header: "Period",
      render: (review) => <span className="text-[var(--admin-muted)]">{review.period ?? "-"}</span>,
    },
    {
      key: "score",
      header: "Score",
      render: (review) => (
        <span className="tabular-nums text-[var(--admin-muted)]">
          {(review.finalScore ?? review.readerScore).toFixed(1)}
        </span>
      ),
    },
    {
      key: "votes",
      header: "Votes",
      render: (review) => (
        <span className="tabular-nums text-[var(--admin-muted)]">
          {(review.voteCount ?? 0).toLocaleString()}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (review) => <StatusPill status={review.status} />,
    },
  ];

  return (
    <QueuePage
      eyebrow="Governance"
      title="At-risk Reviews"
      description="Review flagged series and record a manual governance decision."
      stats={
        <>
          <StatCard
            tone="rose"
            icon={<ShieldAlert className="size-4" />}
            label="At-risk Series"
            value={stats.total}
            hint="Total flagged"
          />
          <StatCard
            tone="rose"
            icon={<AlertTriangle className="size-4" />}
            label="Critical"
            value={stats.critical}
            hint="Highest risk"
          />
          <StatCard
            tone="amber"
            icon={<TrendingDown className="size-4" />}
            label="High"
            value={stats.high}
            hint="Declining signals"
          />
          <StatCard
            tone="blue"
            icon={<ListChecks className="size-4" />}
            label="Open Decisions"
            value={stats.open}
            hint="Awaiting board"
          />
        </>
      }
    >
      <div className="space-y-4">
        <Notice icon={<ShieldAlert className="size-5" />} title="Governance notice">
          Rankings only generate risk signals as a basis for evaluation and do not automatically
          cancel a series. All status changes must be performed manually by the board.
        </Notice>
        <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
          <QueueTable
            columns={columns}
            rows={reviews}
            getRowKey={(review) => review.id}
            getRowAccent={(review): QueueAccent =>
              review.risk === "CRITICAL" ? "rose" : review.risk === "HIGH" ? "amber" : null
            }
            onRowClick={(review) => setSelectedId(review.id)}
            isRowSelected={(review) => review.id === selected?.id}
            minWidth={560}
            empty="No series need review. New at-risk signals will appear here."
          />
          {selected ? (
            <div className="space-y-4">
              <PerformanceSnapshot review={selected} />
              <AtRiskDecisionPanel review={selected} />
            </div>
          ) : null}
        </div>
      </div>
    </QueuePage>
  );
}
