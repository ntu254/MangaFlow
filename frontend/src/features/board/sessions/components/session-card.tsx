import { Link } from "@tanstack/react-router";
import type { VotingSession } from "@/entities/board/model/voting-types";
import {
  SESSION_MODE_LABEL,
  SESSION_STATUS_HELP,
  SESSION_STATUS_LABEL,
  OUTCOME_LABEL,
} from "@/entities/board/model/voting-types";

const STATUS_TONE: Record<VotingSession["status"], string> = {
  OPEN: "bg-emerald-100 text-emerald-900",
  TIED: "bg-fuchsia-100 text-fuchsia-900",
  FINALIZED: "bg-blue-100 text-blue-900",
  NO_QUORUM: "bg-amber-100 text-amber-900",
  CANCELLED: "bg-rose-100 text-rose-900",
};

export function SessionCard({
  session,
  reVoteSession,
}: {
  session: VotingSession;
  reVoteSession?: VotingSession;
}) {
  const statusHelp = SESSION_STATUS_HELP[session.status];
  const decided = session.outcomes.filter((o) => ["APPROVED", "REJECTED"].includes(o.decision)).length;
  const chairTiePending =
    session.status === "TIED" &&
    session.tiePolicy === "CHAIR_DECIDES" &&
    (session.tieResolution ?? "PENDING") === "PENDING" &&
    (session.votingRound ?? (session.reVoteOfSessionId ? 2 : 1)) >= 2;
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
        {reVoteSession ? (
          <div className="col-span-2 mt-1 rounded border border-emerald-300 bg-emerald-50 px-2 py-2 text-emerald-950">
            <p className="font-semibold">Fresh Board re-vote is open.</p>
            <p className="mt-0.5 text-[10px]">
              Open this card to review the tie, then use the re-vote session.
            </p>
          </div>
        ) : null}
        {chairTiePending ? (
          <div className="col-span-2 mt-1 rounded border border-amber-300 bg-amber-50 px-2 py-2 text-amber-950">
            <p className="font-semibold">Chair decision required.</p>
            <p className="mt-0.5 text-[10px]">The second tied round cannot open another re-vote.</p>
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
