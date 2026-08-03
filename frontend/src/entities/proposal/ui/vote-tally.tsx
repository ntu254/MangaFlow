import type { BoardVote, SeriesProposal } from "@/entities/proposal/model/proposal-types";
import { BOARD_TOTAL } from "@/entities/proposal/model/proposal-types";
import { evaluateBoardTally } from "@/entities/proposal/model/board-tally";

export function VoteTally({
  votes,
  status,
  quorum = Math.ceil(BOARD_TOTAL / 2),
}: {
  votes: BoardVote[];
  status?: SeriesProposal["status"];
  quorum?: number;
}) {
  const tally = evaluateBoardTally(votes, quorum);
  const approve = tally.approve;
  const reject = tally.reject;
  const abstain = tally.abstain;
  return (
    <div className="rounded-md border border-border bg-card/40 p-4">
      <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        Board votes · quorum {quorum}/{BOARD_TOTAL}
      </p>
      {status === "TIE_BREAK" ? (
        <div className="mb-3 rounded border border-fuchsia-300 bg-fuchsia-50 p-2 text-[11px] text-fuchsia-900">
          Historical tied vote. This round is read-only; close it to open a fresh Board re-vote.
        </div>
      ) : null}
      <div className="grid grid-cols-3 gap-2 text-center">
        <Tally label="Approve" count={approve} tone="emerald" />
        <Tally label="Reject" count={reject} tone="rose" />
        <Tally label="Abstain" count={abstain} tone="zinc" />
      </div>
      {votes.length > 0 ? (
        <ul className="mt-4 space-y-1.5 text-xs">
          {votes.map((v) => (
            <li
              key={v.memberId}
              className="flex items-center justify-between gap-2 border-t border-border/60 pt-1.5"
            >
              <span className="font-medium">
                {v.memberName}
                {v.isEditorInChief ? (
                  <span className="ml-2 rounded bg-fuchsia-100 px-1.5 text-[10px] font-bold text-fuchsia-900">
                    Editor-in-chief
                  </span>
                ) : v.isChair ? (
                  <span className="ml-2 rounded bg-amber-100 px-1.5 text-[10px] font-bold text-amber-900">
                    Chair
                  </span>
                ) : null}
              </span>
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                {v.decision}
                {v.weight && v.weight > 1 ? ` · w${v.weight}` : ""}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-xs text-muted-foreground">No votes yet.</p>
      )}
      <p className="mt-3 text-[10px] text-muted-foreground">{tally.reason}</p>
    </div>
  );
}

function Tally({
  label,
  count,
  tone,
}: {
  label: string;
  count: number;
  tone: "emerald" | "rose" | "zinc";
}) {
  const cls =
    tone === "emerald"
      ? "bg-emerald-100 text-emerald-900"
      : tone === "rose"
        ? "bg-rose-100 text-rose-900"
        : "bg-zinc-200 text-zinc-800";
  return (
    <div className={`rounded ${cls} px-2 py-2`}>
      <p className="font-serif text-2xl leading-none">{count}</p>
      <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider">{label}</p>
    </div>
  );
}
