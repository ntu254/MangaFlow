import { createFileRoute, Link } from "@tanstack/react-router";
import { Vote } from "lucide-react";
import { PageHeader, EmptyState } from "@/layouts/AppShell";
import { useBoardReviewQueue } from "@/shared/queries/useBoardReview";

export const Route = createFileRoute("/app/board/series-review")({
  component: BoardReviewQueue,
});

function BoardReviewQueue() {
  const { data: queue = [], error, isLoading } = useBoardReviewQueue();

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader
        title="Board Review"
        jp="編集会議"
        description="Series forwarded by Editor — finalize Approve/Reject + publicationType."
      />
      <div className="divide-y divide-foreground/10 rounded-md border border-foreground/10 bg-card">
        {isLoading && (
          <div className="px-5 py-8 text-center text-sm text-foreground/55">
            Loading Board review queue...
          </div>
        )}
        {error && (
          <div className="border-b border-destructive/20 bg-destructive/5 px-5 py-3 text-sm text-destructive">
            Unable to load Board queue. Check that your account has BOARD permission.
          </div>
        )}
        {!isLoading && queue.length === 0 && (
          <EmptyState
            title="Nothing to vote on"
            hint="All forwarded series have been decided. New proposals will appear here once the Editor forwards them."
            icon={Vote}
          />
        )}
        {queue.map((item) => (
          <Link
            to="/app/board/series/$id/vote"
            params={{ id: item.id }}
            key={item.id}
            className="flex items-center gap-4 px-5 py-4 hover:bg-foreground/5"
          >
            <div className="flex h-16 w-12 items-center justify-center rounded bg-foreground/5 text-xs font-bold text-foreground/45">
              {item.seriesTitle.slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2">
                <div className="text-sm font-bold">{item.seriesTitle}</div>
                <div className="text-xs text-foreground/55">{item.seriesStatus}</div>
              </div>
              <div className="mt-0.5 text-xs text-foreground/65">
                {item.voteCount}/{item.quorum} vote(s) for quorum · decision {item.decisionStatus}
              </div>
              <div className="mt-1 text-xs text-foreground/55">
                Approve {item.voteSummary.APPROVE} · Reject {item.voteSummary.REJECT} · Revision{" "}
                {item.voteSummary.NEEDS_REVISION}
              </div>
            </div>
            <Vote className="h-4 w-4 text-foreground/40" />
          </Link>
        ))}
      </div>
    </div>
  );
}
