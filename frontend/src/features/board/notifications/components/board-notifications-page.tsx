import {
  mapNotificationError,
  useMarkReadMutation,
  useNotificationsQuery,
  NotificationDetailSheet,
} from "@/features/notifications";
import { EmptyState } from "@/shared/ui/empty-state";
import { PageHeader } from "@/shared/ui";
import { toast } from "sonner";
import { useState } from "react";

const GOVERNANCE_KINDS = [
  "PROPOSAL_READY",
  "VOTE_DEADLINE",
  "TIE_BREAK",
  "RANKING_FINALIZED",
  "AT_RISK_FLAGGED",
  "AT_RISK_DECIDED",
  "PUBLICATION_STRATEGY",
  "proposal.board",
  "proposal.vote",
  "proposal.decided",
  "session.created",
  "session.closed",
  "session.tiebreak_needed",
];

export function BoardNotificationsPage() {
  const { data: allItems = [], isLoading } = useNotificationsQuery();
  const markRead = useMarkReadMutation();
  const [detailId, setDetailId] = useState<string | null>(null);

  const items = allItems.filter((item) => GOVERNANCE_KINDS.includes(item.kind));
  const detailItem = allItems.find((item) => item.id === detailId);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        eyebrow="Governance"
        title="Board notifications"
        description="Proposal, vote, tie-break, ranking, and at-risk signals only."
      />
      {isLoading ? (
        <div className="py-12 text-center text-sm text-muted-foreground">Loading...</div>
      ) : items.length === 0 ? (
        <EmptyState
          title="No new notifications"
          description="The governance notification queue is empty."
        />
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <article key={item.id} className="rounded-md border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    {item.kind}
                  </p>
                  <p className="mt-1 text-sm">{item.message}</p>
                </div>
                <span className="text-[10px] text-muted-foreground">
                  {new Date(item.createdAt).toLocaleString("en-US")}
                </span>
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setDetailId(item.id)}
                  className="rounded border border-border px-3 py-1.5 text-xs font-semibold hover:bg-muted"
                >
                  View details
                </button>
                {!item.readAt ? (
                  <button
                    onClick={() =>
                      markRead.mutate(item.id, {
                        onError: (e) => toast.error(mapNotificationError(e)),
                      })
                    }
                    className="rounded border border-border px-3 py-1.5 text-xs font-semibold hover:bg-muted"
                  >
                    Mark read
                  </button>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}
      <NotificationDetailSheet
        notification={detailItem}
        open={!!detailItem}
        onOpenChange={(open) => !open && setDetailId(null)}
        onMarkRead={(id) =>
          markRead.mutate(id, {
            onError: (error) => toast.error(mapNotificationError(error)),
          })
        }
        busy={markRead.isPending}
      />
    </div>
  );
}
