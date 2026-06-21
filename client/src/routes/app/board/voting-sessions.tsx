import { createFileRoute, Link } from "@tanstack/react-router";
import { Vote } from "lucide-react";
import { EmptyState } from "@/layouts/AppShell";
import { useBoardReviewQueue } from "@/shared/queries/useBoardReview";
import {
  boardFlowSteps,
  DecisionPortalShell,
  DecisionTimeline,
  PortalCard,
  PortalLoadingRows,
  PortalPill,
} from "@/features/board/components/DecisionPortal";

export const Route = createFileRoute("/app/board/voting-sessions")({
  component: VotingSessionsPage,
});

function VotingSessionsPage() {
  const { data: queue = [], error, isLoading } = useBoardReviewQueue();

  return (
    <DecisionPortalShell
      active="/app/board/voting-sessions"
      title="Voting panel"
      description="View active Board votes, inspect quorum, submit individual votes, and finalize results when the Chair has enough signal."
    >
      <DecisionTimeline steps={boardFlowSteps} activeStep={2} />

      <PortalCard
        title="Active voting"
        description="Open a session to cast approve, reject, or revision votes."
      >
        <div className="grid grid-cols-[1.4fr_0.7fr_0.8fr_1fr_auto] gap-3 border-b border-border bg-foreground/5 px-4 py-2.5 text-[11px] uppercase tracking-wider text-muted-foreground">
          <span>Series</span>
          <span>Quorum</span>
          <span>Decision</span>
          <span>Vote result</span>
          <span />
        </div>

        {isLoading ? (
          <PortalLoadingRows count={4} />
        ) : error ? (
          <div className="px-4 py-8 text-sm text-destructive">
            Unable to load voting sessions for this Board account.
          </div>
        ) : queue.length === 0 ? (
          <EmptyState
            title="No active voting sessions"
            hint="Series forwarded by Editors will appear here when Board voting opens."
            icon={Vote}
          />
        ) : (
          queue.map((item) => (
            <div
              key={item.id}
              className="grid grid-cols-[1.4fr_0.7fr_0.8fr_1fr_auto] items-center gap-3 border-b border-border px-4 py-3 text-[13px] last:border-b-0"
            >
              <div>
                <div className="font-semibold">{item.seriesTitle}</div>
                <div className="mt-0.5 text-xs text-muted-foreground">{item.seriesStatus}</div>
              </div>
              <PortalPill tone={item.canFinalize ? "success" : "primary"}>
                {item.voteCount}/{item.quorum}
              </PortalPill>
              <span className="text-xs text-muted-foreground">{item.decisionStatus}</span>
              <span className="text-xs text-muted-foreground">
                A {item.voteSummary.APPROVE} / R {item.voteSummary.REJECT} / Rev{" "}
                {item.voteSummary.NEEDS_REVISION}
              </span>
              <Link
                to="/app/board/series/$id/vote"
                params={{ id: item.id }}
                className="rounded-md border border-border px-3 py-1.5 text-xs font-medium transition hover:bg-foreground/5"
              >
                Open
              </Link>
            </div>
          ))
        )}
      </PortalCard>
    </DecisionPortalShell>
  );
}
