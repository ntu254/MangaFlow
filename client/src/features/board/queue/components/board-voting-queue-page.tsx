import { Link } from "@tanstack/react-router";
import { useAuth } from "@/shared/auth";
import { useBoardQueueQuery } from "../../api/board-queries";
import { EmptyState } from "@/shared/ui/empty-state";
import { PageHeader } from "@/shared/ui";
import { BOARD_QUORUM, BOARD_TOTAL } from "@/entities/proposal/model/proposal-types";
import type { BoardQueueItem } from "../../model/board-adapters";

export function BoardVotingQueuePage() {
  const user = useAuth((s) => s.user);
  const { data: queueItems, isLoading } = useBoardQueueQuery();

  if (!user) return null;

  const proposalItems = (queueItems ?? []).filter(
    (item): item is BoardQueueItem => item.seriesStatus !== "AT_RISK",
  );

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        eyebrow="Governance"
        title="Board voting queue"
        description={`Quorum ${BOARD_QUORUM}/${BOARD_TOTAL} → APPROVED. ${BOARD_QUORUM} reject → REJECTED. Tied → Editor-in-chief breaks ties.`}
      />

      {isLoading ? (
        <div className="py-12 text-center text-sm text-muted-foreground">Loading queue...</div>
      ) : proposalItems.length === 0 ? (
        <EmptyState
          title="Queue is empty"
          description="There are no proposals waiting for Board votes."
        />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {proposalItems.map((item) => {
            const approve = item.voteSummary?.approve ?? 0;
            const reject = item.voteSummary?.reject ?? 0;
            const voteCount = item.voteCount ?? 0;
            return (
              <li
                key={item.id}
                className="overflow-hidden rounded-lg border border-border bg-card/40"
              >
                <div className="flex gap-4 p-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-serif text-xl leading-tight">
                          {item.seriesTitle || item.title}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {item.genres?.slice(0, 3).join(" · ")}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          item.decisionStatus === "TIE_BREAK_REQUIRED"
                            ? "bg-fuchsia-100 text-fuchsia-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {item.decisionStatus === "TIE_BREAK_REQUIRED" ? "TIE BREAK" : "PENDING"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                        Approve {approve} · Reject {reject} · {voteCount}/{BOARD_TOTAL}
                      </span>
                      <Link
                        to="/app/board/$id"
                        params={{ id: item.seriesId }}
                        className="rounded bg-foreground px-2.5 py-1 text-[11px] font-semibold text-background hover:bg-foreground/90"
                      >
                        Vote
                      </Link>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
