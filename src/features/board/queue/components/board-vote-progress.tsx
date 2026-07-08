import { BOARD_TOTAL } from "@/entities/proposal/model/proposal-types";
import type { BoardQueueItem } from "../../model/board-adapters";

interface BoardVoteProgressProps {
  item: BoardQueueItem;
}

export function BoardVoteProgress({ item }: BoardVoteProgressProps) {
  const { voteSummary } = item;
  const { approve, reject, pending, eligible } = voteSummary;
  const total = approve + reject + pending;

  const approvePct = eligible > 0 ? (approve / eligible) * 100 : 0;
  const rejectPct = eligible > 0 ? (reject / eligible) * 100 : 0;
  const pendingPct = eligible > 0 ? (pending / eligible) * 100 : 0;

  return (
    <div className="space-y-1">
      <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted">
        <div className="bg-emerald-600 transition-all" style={{ width: `${approvePct}%` }} />
        <div className="bg-rose-600 transition-all" style={{ width: `${rejectPct}%` }} />
        <div className="bg-zinc-400 transition-all" style={{ width: `${pendingPct}%` }} />
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span className="text-emerald-600 font-medium">{approve} approve</span>
        <span className="text-rose-600 font-medium">{reject} reject</span>
        <span className="text-zinc-500">{pending} pending</span>
      </div>
    </div>
  );
}
