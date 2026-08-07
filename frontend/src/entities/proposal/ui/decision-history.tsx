import type { BoardTallySnapshot, SeriesProposal } from "@/entities/proposal/model/proposal-types";
import { BOARD_TOTAL } from "@/entities/proposal/model/proposal-types";
import { evaluateBoardTally } from "@/entities/proposal/model/board-tally";
import { useMemo } from "react";

const DECISIVE = new Set(["DECIDE", "REJECT", "FORWARD", "RECALL"]);

export function DecisionHistory({
  proposal,
  tally: serverTally,
  quorum = Math.ceil(BOARD_TOTAL / 2),
  eligible = BOARD_TOTAL,
}: {
  proposal: SeriesProposal;
  tally?: BoardTallySnapshot;
  quorum?: number;
  eligible?: number;
}) {
  const events = useMemo(
    () =>
      proposal.history
        .filter((e) => DECISIVE.has(e.type))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [proposal.history],
  );
  const tally = serverTally ?? evaluateBoardTally(proposal.votes, quorum);

  const chairVoter = proposal.votes.find((v) => v.isChair);

  return (
    <div className="rounded-xl border border-border/60 bg-background/50 p-4 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
          Decision Milestones & Audit Timeline
        </h4>
        <span className="rounded-md border border-border/60 bg-background px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
          {events.length} events
        </span>
      </div>

      {events.length === 0 ? (
        <p className="text-xs text-muted-foreground italic py-1">No decision milestone events recorded yet.</p>
      ) : (
        <ol className="relative space-y-3.5 border-l border-border/70 pl-5 ml-1">
          {events.map((e) => {
            const isActorChair =
              (chairVoter && (chairVoter.voterId === e.actorId || chairVoter.voterName === e.actorName)) ||
              (e as any).actorRole === "BOARD_CHAIR" ||
              (e as any).actorRole === "CHAIR";

            return (
              <li key={e.id} className="relative space-y-1">
                <span className="absolute -left-[26px] top-1.5 size-2.5 rounded-full border-2 border-background bg-primary" />

                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-foreground">
                    {e.type} · {e.actorName}
                  </span>
                  {isActorChair ? (
                    <span className="rounded-md border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                      Board Chair
                    </span>
                  ) : null}
                </div>

                <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                  Status transition: {e.fromStatus ?? "INITIAL"} → {e.toStatus ?? "ACTIVE"}
                </p>

                {e.comment ? (
                  <p className="mt-1 rounded-lg border-l-2 border-primary bg-card/60 px-3 py-1.5 text-xs text-foreground/90 leading-relaxed">
                    {e.comment}
                  </p>
                ) : null}

                <p className="text-[10px] text-muted-foreground/80 pt-0.5">
                  {new Date(e.createdAt).toLocaleString("en-US")}
                </p>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
