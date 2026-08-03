import { Link } from "@tanstack/react-router";
import type { VotingSession } from "@/entities/board/model/voting-types";
import {
  SESSION_MODE_LABEL,
  SESSION_STATUS_HELP,
  SESSION_STATUS_LABEL,
  OUTCOME_LABEL,
} from "@/entities/board/model/voting-types";

const STATUS_TONE: Record<VotingSession["status"], string> = {
  DRAFT: "bg-zinc-100 text-zinc-700",
  OPEN: "bg-emerald-100 text-emerald-900",
  CLOSED: "bg-zinc-200 text-zinc-800",
  TIED: "bg-fuchsia-100 text-fuchsia-900",
  TIE_BREAK_REQUIRED: "bg-fuchsia-100 text-fuchsia-900",
  FINALIZED: "bg-blue-100 text-blue-900",
  NO_QUORUM: "bg-amber-100 text-amber-900",
  CANCELLED: "bg-rose-100 text-rose-900",
  CANCELED: "bg-rose-100 text-rose-900",
};

export function SessionCard({
  session,
  reVoteSession,
}: {
  session: VotingSession;
  reVoteSession?: VotingSession;
}) {
  const statusHelp = SESSION_STATUS_HELP[session.status];
  const tieCount = session.outcomes.filter((o) => o.decision === "TIE_BREAK_REQUIRED").length;
  const decided = session.outcomes.filter((o) =>
    ["APPROVED", "REJECTED", "TIE_BROKEN_APPROVED", "TIE_BROKEN_REJECTED"].includes(o.decision),
  ).length;
  return (
    <Link
      to="/app/board/sessions/$sid"
      params={{ sid: session.id }}
      className="block rounded-lg border border-border bg-card/40 p-4 transition hover:border-foreground/40 hover:bg-card"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            {SESSION_MODE_LABEL[session.mode]}
          </p>
          <h3 className="font-serif text-xl leading-tight">{session.title}</h3>
        </div>
        <span
          className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${STATUS_TONE[session.status]}`}
        >
          {SESSION_STATUS_LABEL[session.status]}
        </span>
      </div>
      <div className="mt-3 rounded-md border border-border/70 bg-background/70 px-3 py-2">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          What is happening
        </p>
        <p className="mt-1 text-xs font-semibold text-foreground">{statusHelp.description}</p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">Next: {statusHelp.nextStep}</p>
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-y-1 text-[11px] text-muted-foreground">
        <div>
          <dt className="font-semibold text-foreground">Proposals</dt>
          <dd>{session.proposalIds.length}</dd>
        </div>
        <div>
          <dt className="font-semibold text-foreground">Decided</dt>
          <dd>{decided}</dd>
        </div>
        <div>
          <dt className="font-semibold text-foreground">Round</dt>
          <dd>{session.reVoteOfSessionId ? "Re-vote after tie" : "First round"}</dd>
        </div>
        {tieCount > 0 ? (
          <div className="col-span-2 mt-1 rounded bg-fuchsia-100 px-2 py-1 text-fuchsia-900">
            {tieCount} historical tie-break record{tieCount === 1 ? "" : "s"} · read-only
          </div>
        ) : null}
        {reVoteSession ? (
          <div className="col-span-2 mt-1 rounded border border-emerald-300 bg-emerald-50 px-2 py-2 text-emerald-950">
            <p className="font-semibold">Fresh Board re-vote is open.</p>
            <p className="mt-0.5 text-[10px]">
              Open this card to review the tie, then use the re-vote session.
            </p>
          </div>
        ) : null}
        {session.scheduledFor ? (
          <div className="col-span-2">
            <dt className="font-semibold text-foreground">Schedule</dt>
            <dd>{new Date(session.scheduledFor).toLocaleString("vi-VN")}</dd>
          </div>
        ) : null}
      </dl>
      {session.outcomes.length > 0 ? (
        <ul className="mt-3 space-y-0.5 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
          {session.outcomes.slice(0, 3).map((o) => (
            <li key={o.proposalId}>
              Proposal {o.proposalId}: {OUTCOME_LABEL[o.decision]}
            </li>
          ))}
        </ul>
      ) : null}
    </Link>
  );
}
