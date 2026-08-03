import type { BoardTallySnapshot, SeriesProposal } from "@/entities/proposal/model/proposal-types";
import { BOARD_TOTAL } from "@/entities/proposal/model/proposal-types";
import { evaluateBoardTally } from "@/entities/proposal/model/board-tally";
import { useMemo } from "react";

const DECISIVE = new Set(["DECIDE", "REJECT", "TIE_BREAK", "FORCE_STATUS", "FORWARD", "RECALL"]);

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

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-card/40 p-4">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Decision rules
        </p>
        <ul className="space-y-1 text-xs text-foreground/85">
          <li>
            Quorum: {quorum}/{eligible} votes of the same type {"->"} APPROVED or REJECTED
            immediately.
          </li>
          <li>If neither side reaches quorum, closing the session records NO_QUORUM.</li>
          <li>
            Exact tie {"->"} close the round as TIED and open a fresh Board re-vote. The old round
            remains read-only for audit.
          </li>
        </ul>
      </div>

      <div className="rounded-lg border border-border bg-card/40 p-4">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Final votes
        </p>
        {proposal.votes.length === 0 ? (
          <p className="text-xs text-muted-foreground">No votes yet.</p>
        ) : (
          <ul className="space-y-1 text-xs">
            {proposal.votes.map((v) => (
              <li
                key={v.memberId}
                className="flex items-center justify-between gap-2 border-t border-border/60 pt-1.5"
              >
                <span className="font-medium">
                  {v.memberName}
                  {v.isChair ? (
                    <span className="ml-2 rounded bg-amber-100 px-1.5 text-[10px] font-bold text-amber-900">
                      Chair
                    </span>
                  ) : null}
                </span>
                <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  {v.decision}
                  {v.weight && v.weight > 1 ? ` - w${v.weight}` : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-2 text-[10px] text-muted-foreground">{tally.reason}</p>
      </div>

      <div>
        <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Decision milestones
        </p>
        {events.length === 0 ? (
          <p className="text-xs text-muted-foreground">No decisions yet.</p>
        ) : (
          <ol className="relative space-y-3 border-l border-border pl-5">
            {events.map((e) => (
              <li key={e.id} className="relative">
                <span className="absolute -left-[27px] top-1.5 size-2.5 rounded-full border-2 border-background bg-foreground" />
                <p className="text-xs font-semibold">
                  {e.type} - {e.actorName}
                </p>
                <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                  {e.fromStatus ?? "-"} to {e.toStatus ?? "-"}
                </p>
                {e.comment ? (
                  <p className="mt-1 rounded border-l-2 border-accent bg-muted/40 px-3 py-1.5 text-xs text-foreground/80">
                    {e.comment}
                  </p>
                ) : null}
                <p className="mt-0.5 text-[10px] text-muted-foreground">
                  {new Date(e.createdAt).toLocaleString("en-US")}
                </p>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
