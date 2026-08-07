import type {
  BoardTallySnapshot,
  BoardVote,
  SeriesProposal,
} from "@/entities/proposal/model/proposal-types";

export function VoteTally({
  votes,
}: {
  votes: BoardVote[];
  status?: SeriesProposal["status"];
  quorum?: number;
  tally?: BoardTallySnapshot;
  eligible?: number;
}) {
  const safeVotes = votes ?? [];

  return (
    <div className="rounded-xl border border-border/60 bg-background/50 p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
          Board Votes & Member Actions
        </h4>
        <span className="rounded-md border border-border/60 bg-background px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
          {safeVotes.length} votes recorded
        </span>
      </div>

      {safeVotes.length > 0 ? (
        <ul className="space-y-1.5 text-xs">
          {safeVotes.map((v) => (
            <li
              key={v.voterId}
              className="flex items-center justify-between gap-2 rounded-lg border border-border/40 bg-card/60 px-3 py-2"
            >
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground">{v.voterName}</span>
                {v.isChair ? (
                  <span className="rounded-md border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                    Board Chair
                  </span>
                ) : null}
              </div>
              <span
                className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                  v.decision === "APPROVE"
                    ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                    : "bg-rose-500/20 text-rose-600 dark:text-rose-400"
                }`}
              >
                {v.decision}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-muted-foreground italic py-1">No member votes recorded yet in this session.</p>
      )}
    </div>
  );
}


