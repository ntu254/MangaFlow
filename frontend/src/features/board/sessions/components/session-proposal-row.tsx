import { Link } from "@tanstack/react-router";
import type { SeriesProposal } from "@/entities/proposal/model/proposal-types";
import type { SessionProposalOutcome } from "@/entities/board/model/voting-types";
import { OUTCOME_LABEL } from "@/entities/board/model/voting-types";
import { ProposalStatusPill } from "@/entities/proposal";
import { BOARD_TOTAL } from "@/entities/proposal/model/proposal-types";
import { ResolvedImage } from "@/shared/ui";

const OUTCOME_TONE: Record<SessionProposalOutcome["decision"], string> = {
  APPROVED: "bg-emerald-100 text-emerald-900",
  REJECTED: "bg-rose-100 text-rose-900",
  TIED: "bg-fuchsia-100 text-fuchsia-900",
  TIE_BREAK_REQUIRED: "bg-fuchsia-100 text-fuchsia-900",
  TIE_BROKEN_APPROVED: "bg-emerald-100 text-emerald-900 ring-1 ring-fuchsia-400",
  TIE_BROKEN_REJECTED: "bg-rose-100 text-rose-900 ring-1 ring-fuchsia-400",
  NO_QUORUM: "bg-amber-100 text-amber-900",
  PENDING: "bg-zinc-200 text-zinc-800",
};

export function SessionProposalRow({
  proposal,
  outcome,
}: {
  proposal: SeriesProposal;
  outcome: SessionProposalOutcome;
}) {
  return (
    <div className="flex gap-3 rounded-lg border border-border bg-card/40 p-3">
      <ResolvedImage
        fileKey={proposal.coverFileKey}
        fallbackUrl={proposal.coverUrl}
        alt=""
        className="h-24 w-16 rounded object-cover"
      />
      <div className="flex-1 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <Link
              to="/app/submissions/$id"
              params={{ id: proposal.id }}
              className="font-serif text-lg leading-tight underline-offset-4 hover:underline"
            >
              {proposal.title}
            </Link>
            <p className="text-[11px] text-muted-foreground">{proposal.authorName}</p>
          </div>
          <ProposalStatusPill status={proposal.status} />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          <span
            className={`rounded px-2 py-0.5 font-bold uppercase tracking-wider ${OUTCOME_TONE[outcome.decision]}`}
          >
            {OUTCOME_LABEL[outcome.decision]}
          </span>
          <span className="font-mono text-muted-foreground">
            A {outcome.approve} · R {outcome.reject} · ABS {outcome.abstain} ·{" "}
            {outcome.approve + outcome.reject + outcome.abstain}/{BOARD_TOTAL}
          </span>
          <Link
            to="/app/board/$id"
            params={{ id: proposal.id }}
            className="ml-auto rounded border border-border bg-background px-2 py-0.5 text-[10px] font-semibold hover:bg-muted"
          >
            Open vote
          </Link>
        </div>
        <p className="text-[11px] text-muted-foreground">{outcome.reason}</p>
        {outcome.tieBreakByName ? (
          <p className="text-[11px] text-fuchsia-900">
            Tie broken by {outcome.tieBreakByName} → {outcome.tieBreakDecision}
            {outcome.decidedAt ? ` · ${new Date(outcome.decidedAt).toLocaleString("en-US")}` : ""}
          </p>
        ) : null}
      </div>
    </div>
  );
}
