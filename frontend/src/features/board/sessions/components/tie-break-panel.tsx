import type { VotingSession } from "@/entities/board/model/voting-types";
import type { SeriesProposal } from "@/entities/proposal/model/proposal-types";
import type { User } from "@/shared/auth";

export function TieBreakPanel({ proposal }: {
  session: VotingSession;
  proposal: SeriesProposal;
  user: User;
}) {
  return (
    <div className="rounded border border-fuchsia-300 bg-background p-3">
      <div className="flex items-center justify-between">
        <p className="font-serif text-base">{proposal.title}</p>
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          {proposal.votes.filter((v) => v.decision === "APPROVE").length} APPROVE ·{" "}
          {proposal.votes.filter((v) => v.decision === "REJECT").length} REJECT
        </span>
      </div>
      <p className="mt-3 text-xs text-fuchsia-950">
        Historical tie-break record. New ties now create a fresh Board re-vote session.
      </p>
    </div>
  );
}
