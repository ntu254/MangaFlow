import type { BoardTallySnapshot, SeriesProposal } from "@/entities/proposal/model/proposal-types";
import { BOARD_TOTAL } from "@/entities/proposal/model/proposal-types";
import { summarizeVotes } from "../../model/board-access";

export function VoteProgress({
  proposal,
  tally,
  eligible,
}: {
  proposal: SeriesProposal;
  tally?: BoardTallySnapshot;
  eligible?: number;
}) {
  const votes = tally ?? summarizeVotes(proposal);
  const eligibleVoters = eligible ?? BOARD_TOTAL;
  const approvePct = Math.min(100, (votes.approve / eligibleVoters) * 100);
  const rejectPct = Math.min(100, (votes.reject / eligibleVoters) * 100);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        <span>Vote Progress</span>
        <span>
          {votes.total}/{eligibleVoters}
        </span>
      </div>
      <div className="flex h-2 overflow-hidden rounded bg-muted">
        <div className="bg-emerald-600" style={{ width: `${approvePct}%` }} />
        <div className="bg-rose-600" style={{ width: `${rejectPct}%` }} />
      </div>
      <p className="text-[11px] text-muted-foreground">{votes.reason}</p>
    </div>
  );
}
