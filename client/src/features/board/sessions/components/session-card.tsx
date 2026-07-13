import { Link } from "@tanstack/react-router";
import type { VotingSession } from "@/entities/board/model/voting-types";
import {
  SESSION_MODE_LABEL,
  SESSION_STATUS_LABEL,
  OUTCOME_LABEL,
} from "@/entities/board/model/voting-types";

const STATUS_TONE: Record<VotingSession["status"], string> = {
  OPEN: "bg-emerald-100 text-emerald-900",
  CLOSED: "bg-zinc-200 text-zinc-800",
  CANCELED: "bg-rose-100 text-rose-900",
};

export function SessionCard({ session }: { session: VotingSession }) {
  const tieCount = session.outcomes.filter((o) => o.decision === "NO_QUORUM").length;
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
      <dl className="mt-3 grid grid-cols-2 gap-y-1 text-[11px] text-muted-foreground">
        <div>
          <dt className="font-semibold text-foreground">Proposals</dt>
          <dd>{session.proposalIds.length}</dd>
        </div>
        <div>
          <dt className="font-semibold text-foreground">Decided</dt>
          <dd>{decided}</dd>
        </div>
        {tieCount > 0 ? (
          <div className="col-span-2 mt-1 rounded bg-fuchsia-100 px-2 py-1 text-fuchsia-900">
            {tieCount} proposals awaiting Editor-in-chief tie-break
          </div>
        ) : null}
        {session.scheduledFor ? (
          <div className="col-span-2">
            <dt className="font-semibold text-foreground">Scheduled meeting</dt>
            <dd>{new Date(session.scheduledFor).toLocaleString("vi-VN")}</dd>
          </div>
        ) : null}
      </dl>
      {session.outcomes.length > 0 ? (
        <ul className="mt-3 space-y-0.5 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
          {session.outcomes.slice(0, 3).map((o) => (
            <li key={o.proposalId}>
              {o.proposalId}: {OUTCOME_LABEL[o.decision]}
            </li>
          ))}
        </ul>
      ) : null}
    </Link>
  );
}
