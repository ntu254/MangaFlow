import { createFileRoute, Link } from "@tanstack/react-router";
import { ClipboardCheck, Vote } from "lucide-react";
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

export const Route = createFileRoute("/app/board/series-review")({
  component: BoardReviewQueue,
});

function BoardReviewQueue() {
  const { data: queue = [], error, isLoading } = useBoardReviewQueue();

  return (
    <DecisionPortalShell
      active="/app/board/series-review"
      title="Review workspace"
      description="Inspect submitted proposals, manuscript evidence, quorum status, and the current vote mix before opening a decision panel."
      actions={
        <Link
          to="/app/board/voting-sessions"
          className="inline-flex h-9 items-center gap-2 rounded-md border border-border px-3 text-sm font-medium transition hover:bg-foreground/5 active:translate-y-px"
        >
          <Vote className="h-4 w-4" /> Voting sessions
        </Link>
      }
    >
      <DecisionTimeline steps={boardFlowSteps} activeStep={1} />

      <PortalCard
        title="Submitted series"
        description="Each row opens the Board vote panel with proposal context and audit trail."
      >
        <div className="grid grid-cols-[1.5fr_0.8fr_0.8fr_1fr_auto] gap-3 border-b border-border bg-foreground/5 px-4 py-2.5 text-[11px] uppercase tracking-wider text-muted-foreground">
          <span>Submitted series</span>
          <span>Status</span>
          <span>Quorum</span>
          <span>Vote summary</span>
          <span />
        </div>

        {isLoading ? (
          <PortalLoadingRows count={4} />
        ) : error ? (
          <div className="px-4 py-8 text-sm text-destructive">
            Unable to load Board queue. Check that your account has BOARD permission.
          </div>
        ) : queue.length === 0 ? (
          <EmptyState
            title="Nothing to vote on"
            hint="New proposals appear here once an Editor forwards them to Board review."
            icon={ClipboardCheck}
          />
        ) : (
          queue.map((item) => (
            <Link
              to="/app/board/series/$id/vote"
              params={{ id: item.id }}
              key={item.id}
              className="grid grid-cols-[1.5fr_0.8fr_0.8fr_1fr_auto] items-center gap-3 border-b border-border px-4 py-3 text-[13px] transition last:border-b-0 hover:bg-foreground/5"
            >
              <div className="min-w-0">
                <div className="truncate font-semibold">{item.seriesTitle}</div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  Proposal evidence and manuscript review
                </div>
              </div>
              <span className="text-xs text-muted-foreground">{item.seriesStatus}</span>
              <PortalPill tone={item.canFinalize ? "success" : "primary"}>
                {item.voteCount}/{item.quorum}
              </PortalPill>
              <span className="text-xs text-muted-foreground">
                A {item.voteSummary.APPROVE} / R {item.voteSummary.REJECT} / Rev{" "}
                {item.voteSummary.NEEDS_REVISION}
              </span>
              <span className="rounded-md border border-border px-3 py-1.5 text-xs font-medium">
                Review
              </span>
            </Link>
          ))
        )}
      </PortalCard>
    </DecisionPortalShell>
  );
}
