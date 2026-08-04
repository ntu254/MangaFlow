import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useAuth, isBoardChair } from "@/shared/auth";
import { SessionCard, useVotingSessionsQuery } from "@/features/board";
import {
  SESSION_STATUS_LABEL,
  type VotingSessionStatus,
} from "@/entities/board/model/voting-types";

export const Route = createFileRoute("/app/board/sessions/")({
  component: VotingSessionsList,
});

function VotingSessionsList() {
  const user = useAuth((s) => s.user);
  const { data: sessions = [], isLoading, isError } = useVotingSessionsQuery();
  const [filter, setFilter] = useState<"ALL" | VotingSessionStatus>("ALL");

  const visible = useMemo(
    () =>
      sessions
        .filter((vs) => filter === "ALL" || vs.status === filter)
        .sort((a, b) => b.openedAt.localeCompare(a.openedAt)),
    [sessions, filter],
  );

  if (!user) return null;
  const canAccess = user.role === "editor" || user.role === "board";
  if (!canAccess) {
    return (
      <div className="mx-auto max-w-2xl space-y-3 text-center">
        <h1 className="font-serif text-3xl">Access Denied</h1>
        <p className="text-sm text-muted-foreground">
          Only Board members and Editors can view voting sessions.
        </p>
        <Link to="/app/board" className="text-xs underline">
          Back to board
        </Link>
      </div>
    );
  }

  const canCreate = user.role === "board" && isBoardChair(user.id);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-accent">
            Governance
          </p>
          <h1 className="mt-1 font-serif text-4xl">Voting sessions</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Each card is one voting round. A first tie opens one re-vote; a second tie follows the
            session's configured policy.
          </p>
        </div>
        {canCreate ? (
          <Link
            to="/app/board/sessions/new"
            className="rounded bg-foreground px-3 py-1.5 text-xs font-semibold text-background hover:bg-foreground/90"
          >
            + Create session
          </Link>
        ) : null}
      </header>

      <section className="grid gap-2 rounded-lg border border-border bg-card/40 p-4 text-xs md:grid-cols-3">
        <div>
          <p className="font-bold text-emerald-800">OPEN</p>
          <p className="mt-1 text-muted-foreground">Board members are voting now.</p>
        </div>
        <div>
          <p className="font-bold text-fuchsia-800">TIED</p>
          <p className="mt-1 text-muted-foreground">
            This round is history; the next step follows the configured tie policy.
          </p>
        </div>
        <div>
          <p className="font-bold text-blue-800">FINALIZED</p>
          <p className="mt-1 text-muted-foreground">The Board decision is complete.</p>
        </div>
      </section>

      <nav className="flex flex-wrap gap-1">
        {(
          [
            "ALL",
            "OPEN",
            "TIED",
            "FINALIZED",
            "NO_QUORUM",
            "CANCELLED",
          ] as const
        ).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wider ${
              filter === f
                ? "border-foreground bg-foreground text-background"
                : "border-border bg-card text-muted-foreground hover:bg-muted"
            }`}
          >
            {f === "ALL" ? "All" : SESSION_STATUS_LABEL[f]}
          </button>
        ))}
      </nav>

      {isLoading ? (
        <p className="rounded border border-dashed border-border p-8 text-center text-xs text-muted-foreground">
          Loading sessions...
        </p>
      ) : isError ? (
        <p className="rounded border border-rose-200 bg-rose-50 p-8 text-center text-xs text-rose-900">
          Failed to load voting sessions.
        </p>
      ) : visible.length === 0 ? (
        <p className="rounded border border-dashed border-border p-8 text-center text-xs text-muted-foreground">
          No matching sessions found.
        </p>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {visible.map((vs) => (
            <li key={vs.id}>
              <SessionCard
                session={vs}
                reVoteSession={sessions.find(
                  (candidate) =>
                    candidate.reVoteOfSessionId === vs.id && candidate.status === "OPEN",
                )}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
