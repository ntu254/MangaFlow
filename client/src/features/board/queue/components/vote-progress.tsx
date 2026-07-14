import type { SeriesProposal } from "@/entities/proposal/model/proposal-types";
import { BOARD_TOTAL } from "@/entities/proposal/model/proposal-types";
import { summarizeVotes } from "../../model/board-access";

export function VoteProgress({ proposal }: { proposal: SeriesProposal }) {
  const votes = summarizeVotes(proposal);
  const approvePct = Math.min(100, (votes.approve / BOARD_TOTAL) * 100);
  const rejectPct = Math.min(100, (votes.reject / BOARD_TOTAL) * 100);
  const abstainPct = Math.min(100, (votes.abstain / BOARD_TOTAL) * 100);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        <span>Vote Progress</span>
        <span>
          {votes.total}/{BOARD_TOTAL}
        </span>
      </div>
      <div className="flex h-2 overflow-hidden rounded bg-muted">
        <div className="bg-emerald-600" style={{ width: `${approvePct}%` }} />
        <div className="bg-rose-600" style={{ width: `${rejectPct}%` }} />
        <div className="bg-amber-500" style={{ width: `${abstainPct}%` }} />
      </div>
      <p className="text-[11px] text-muted-foreground">{votes.reason}</p>
    </div>
  );
}
