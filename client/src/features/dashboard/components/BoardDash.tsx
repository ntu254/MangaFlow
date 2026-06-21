import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CalendarClock,
  ClipboardCheck,
  Clock3,
  History,
  ShieldAlert,
  Vote,
} from "lucide-react";
import { useDashboard } from "@/shared/queries/useDashboard";
import { useBoardReviewQueue } from "@/shared/queries/useBoardReview";
import { rankings, series } from "@/entities";
import {
  boardFlowSteps,
  DecisionPortalShell,
  DecisionTimeline,
  PortalAction,
  PortalCard,
  PortalLoadingRows,
  PortalMetric,
  PortalPill,
} from "@/features/board/components/DecisionPortal";

export function BoardDash() {
  const { data: summary } = useDashboard("board");
  const { data: queue = [], isLoading } = useBoardReviewQueue();
  const atRiskSeries = series.filter((item) => item.status === "at-risk");
  const latestRanking = rankings[0];
  const rankingAlerts = latestRanking?.entries.filter((entry) => entry.rank >= 4).slice(0, 3) ?? [];

  const pendingVotes =
    Number(summary?.boardQueue?.pendingVotes ?? 0) ||
    queue.length ||
    series.filter((s) => s.status === "board-review").length;
  const atRiskReviews = Number(summary?.boardQueue?.atRiskReviews ?? 0) || atRiskSeries.length;

  return (
    <DecisionPortalShell
      active="/app/dashboard"
      title="Board decision portal"
      description="A single review surface for proposal evidence, Board voting, reader ranking signals, cancellation cases, and decision history."
      actions={
        <Link
          to="/app/board/series-review"
          className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground transition active:translate-y-px"
        >
          Open review workspace <ArrowRight className="h-4 w-4" />
        </Link>
      }
    >
      <DecisionTimeline steps={boardFlowSteps} activeStep={0} />

      <section className="grid gap-3 md:grid-cols-4">
        <PortalMetric
          icon={ClipboardCheck}
          label="Pending approvals"
          value={String(pendingVotes)}
          hint="Series in Board review"
        />
        <PortalMetric
          icon={Vote}
          label="Open voting"
          value={String(queue.length || pendingVotes)}
          hint="Active decision sessions"
        />
        <PortalMetric
          icon={BarChart3}
          label="Ranking alerts"
          value={String(rankingAlerts.length)}
          hint={latestRanking?.period ?? "No period"}
        />
        <PortalMetric
          icon={ShieldAlert}
          label="At-risk reviews"
          value={String(atRiskReviews)}
          hint="Needs Board decision"
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <PortalCard
          title="Open voting sessions"
          description="Track quorum, current result, and Chair finalization readiness."
          action={
            <Link to="/app/board/voting-sessions" className="text-xs font-medium text-primary">
              View all
            </Link>
          }
        >
          <div className="divide-y divide-border">
            {isLoading ? (
              <PortalLoadingRows />
            ) : queue.length ? (
              queue.slice(0, 4).map((item) => (
                <Link
                  key={item.id}
                  to="/app/board/series/$id/vote"
                  params={{ id: item.id }}
                  className="grid gap-3 px-4 py-3 transition hover:bg-foreground/5 md:grid-cols-[1fr_auto]"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold">{item.seriesTitle}</div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <PortalPill tone="primary">
                        {item.voteCount}/{item.quorum} quorum
                      </PortalPill>
                      <span>{item.decisionStatus}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Vote className="h-4 w-4" />A {item.voteSummary.APPROVE} / R{" "}
                    {item.voteSummary.REJECT} / Rev {item.voteSummary.NEEDS_REVISION}
                  </div>
                </Link>
              ))
            ) : (
              <div className="px-4 py-10 text-center text-sm text-muted-foreground">
                No open Board voting sessions.
              </div>
            )}
          </div>
        </PortalCard>

        <div className="grid gap-3">
          <PortalAction
            icon={ClipboardCheck}
            title="Review workspace"
            text="Open proposals, inspect manuscript context, and prepare a vote."
            to="/app/board/series-review"
          />
          <PortalAction
            icon={CalendarClock}
            title="Publishing schedule"
            text="Confirm weekly, monthly, or special release intent after approval."
            to="/app/board/publishing-schedule"
          />
          <PortalAction
            icon={BarChart3}
            title="Reader vote data"
            text="Validate reader inputs and update ranking analytics."
            to="/app/board/reader-votes"
          />
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <PortalCard
          title="Ranking alerts"
          description="Signals that may require a cancellation review case."
          action={
            <Link to="/app/rankings" className="text-xs font-medium text-primary">
              Open analytics
            </Link>
          }
        >
          <div className="divide-y divide-border px-4">
            {rankingAlerts.length ? (
              rankingAlerts.map((entry) => (
                <div
                  key={entry.seriesId}
                  className="flex items-center justify-between py-3 text-sm"
                >
                  <span className="font-medium">Rank #{entry.rank}</span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {entry.votes.toLocaleString()} votes
                  </span>
                </div>
              ))
            ) : (
              <div className="py-8 text-sm text-muted-foreground">
                No ranking alerts for the current period.
              </div>
            )}
          </div>
        </PortalCard>

        <PortalCard
          title="Cancellation review"
          description="Low-ranking series that need continue, hold, cancel, or final action."
          action={
            <Link to="/app/board/cancellation-review" className="text-xs font-medium text-primary">
              Review cases
            </Link>
          }
        >
          <div className="divide-y divide-border px-4">
            {atRiskSeries.length ? (
              atRiskSeries.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-3 text-sm">
                  <span className="font-medium">{item.title}</span>
                  <PortalPill tone="warn">
                    <AlertTriangle className="h-3.5 w-3.5" /> at risk
                  </PortalPill>
                </div>
              ))
            ) : (
              <div className="py-8 text-sm text-muted-foreground">
                No low-ranking series need review.
              </div>
            )}
          </div>
        </PortalCard>
      </section>

      <Link
        to="/app/board/decision-history"
        className="flex items-center justify-between rounded-md border border-border bg-card px-4 py-3 text-sm transition hover:bg-foreground/5"
      >
        <span className="inline-flex items-center gap-2 font-medium">
          <History className="h-4 w-4" /> Decision history
        </span>
        <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
          <Clock3 className="h-3.5 w-3.5" /> Inspect prior Board actions
        </span>
      </Link>
    </DecisionPortalShell>
  );
}
