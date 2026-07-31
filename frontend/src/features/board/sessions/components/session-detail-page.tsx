import {
  SESSION_MODE_LABEL,
  SESSION_STATUS_HELP,
  SESSION_STATUS_LABEL,
} from "@/entities/board/model/voting-types";
import { useProposalsQuery } from "@/features/proposals";
import { isBoardChair, useAuth } from "@/shared/auth";
import { EmptyState } from "@/shared/ui/empty-state";
import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import {
  useCancelVotingSessionMutation,
  useCloseVotingSessionMutation,
  useVotingSessionsQuery,
  useVotingSessionQuery,
} from "../api/sessions.queries";
import { SessionNotes } from "./session-notes";
import { SessionProposalRow } from "./session-proposal-row";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";

interface SessionDetailPageProps {
  sessionId: string;
}

export function SessionDetailPage({ sessionId: sid }: SessionDetailPageProps) {
  const user = useAuth((s) => s.user);
  const { data: session, isLoading, isError } = useVotingSessionQuery(sid);
  const { data: allSessions = [] } = useVotingSessionsQuery();
  const { data: proposals = [] } = useProposalsQuery({
    status: "PENDING_BOARD,BOARD_REVIEW,TIE_BREAK,APPROVED,REJECTED",
  });
  const closeSessionMutation = useCloseVotingSessionMutation();
  const cancelSessionMutation = useCancelVotingSessionMutation();
  const navigate = useNavigate();
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

  if (!user) return null;
  if (isLoading) {
    return (
      <p className="mx-auto max-w-5xl rounded border border-dashed border-border p-8 text-center text-xs text-muted-foreground">
        Loading session...
      </p>
    );
  }
  if (isError || !session)
    return (
      <EmptyState
        title="Session not found"
        description="Return to the list."
        action={
          <Link to="/app/board/sessions" className="text-xs underline">
            Sessions
          </Link>
        }
      />
    );

  const isChair = user.role === "board" && isBoardChair(user.id);
  const statusHelp = SESSION_STATUS_HELP[session.status];
  const openReVote = allSessions.find(
    (candidate) => candidate.reVoteOfSessionId === session.id && candidate.status === "OPEN",
  );
  const tieCount = session.outcomes.filter(
    (o) => session.status === "TIE_BREAK_REQUIRED" && o.decision === "TIE_BREAK_REQUIRED",
  ).length;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="border-b border-border pb-4">
        <Link to="/app/board/sessions" className="text-[11px] text-muted-foreground underline">
          ← Sessions
        </Link>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-serif text-3xl">{session.title}</h1>
            <p className="mt-1 text-xs text-muted-foreground">
              {SESSION_MODE_LABEL[session.mode]} - {SESSION_STATUS_LABEL[session.status]} - Opened
              by {session.createdByName}
            </p>
          </div>
          <div className="text-right text-[11px] text-muted-foreground">
            <p>Opened: {new Date(session.openedAt).toLocaleString("en-US")}</p>
            {session.scheduledFor ? (
              <p>Meeting: {new Date(session.scheduledFor).toLocaleString("en-US")}</p>
            ) : null}
            {session.closesAt ? (
              <p>Scheduled close: {new Date(session.closesAt).toLocaleString("en-US")}</p>
            ) : null}
            {session.closedAt ? (
              <p>Closed: {new Date(session.closedAt).toLocaleString("en-US")}</p>
            ) : null}
          </div>
        </div>
        {session.status === "OPEN" && isChair ? (
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={async () => {
                try {
                  await closeSessionMutation.mutateAsync(session.id);
                  toast.success("Session closed.");
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : "Something went wrong.");
                }
              }}
              disabled={closeSessionMutation.isPending}
              className="rounded bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800 disabled:opacity-40"
            >
              Close session
            </button>
            <button
              onClick={() => setCancelDialogOpen(true)}
              disabled={cancelSessionMutation.isPending}
              className="rounded border border-border bg-card px-3 py-1.5 text-xs font-semibold hover:bg-muted disabled:opacity-40"
            >
              Cancel
            </button>
          </div>
        ) : null}
        {openReVote ? (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs text-emerald-950">
            <span>A fresh Board re-vote is open for this tied round.</span>
            <Link
              to="/app/board/sessions/$sid"
              params={{ sid: openReVote.id }}
              className="rounded bg-foreground px-3 py-1.5 font-semibold text-background hover:bg-foreground/90"
            >
              Open re-vote
            </Link>
          </div>
        ) : null}
      </header>

      <section className="rounded-lg border border-foreground/15 bg-foreground/[0.03] p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Workflow status
            </p>
            <h2 className="mt-1 font-serif text-2xl">{SESSION_STATUS_LABEL[session.status]}</h2>
          </div>
          <span className="rounded-full border border-border bg-card px-3 py-1 text-[11px] font-semibold">
            {session.reVoteOfSessionId ? "Re-vote round" : "Original round"}
          </span>
        </div>
        <p className="mt-2 text-sm text-foreground/80">{statusHelp.description}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">Next step:</span> {statusHelp.nextStep}
        </p>
        {session.status === "OPEN" ? (
          <p className="mt-3 rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-900">
            Board members can vote from the proposal detail. Only the Board Chair can close or
            cancel this session.
          </p>
        ) : null}
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="font-serif text-xl">Proposals in this round ({session.proposalIds.length})</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Each proposal shows the current tally, round outcome, and link to its evidence.
          </p>
        </div>
        <ul className="space-y-3">
          {session.proposalIds.map((pid) => {
            const proposal = proposals.find((p) => p.id === pid);
            const outcome = session.outcomes.find((o) => o.proposalId === pid);
            if (!proposal || !outcome) return null;
            return (
              <li key={pid}>
                <SessionProposalRow proposal={proposal} outcome={outcome} />
              </li>
            );
          })}
        </ul>
      </section>

      {tieCount > 0 ? (
        <section className="space-y-3 rounded-lg border border-fuchsia-300 bg-fuchsia-50/40 p-4">
          <h2 className="font-serif text-xl text-fuchsia-950">Historical tie-break record</h2>
          <p className="text-xs text-fuchsia-950/80">
            {tieCount} tied proposal{tieCount === 1 ? "" : "s"} remain{tieCount === 1 ? "s" : ""} in
            this historical session. EIC tie-break voting is retired; new ties automatically open
            a fresh Board re-vote.
          </p>
        </section>
      ) : null}

      <SessionNotes session={session} user={user} />

      <ConfirmDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        title="Cancel session"
        description="Are you sure you want to cancel this session? The proposals in it will return to their previous status."
        confirmLabel="Cancel session"
        cancelLabel="No"
        variant="danger"
        onConfirm={async () => {
          try {
            await cancelSessionMutation.mutateAsync(session.id);
            toast.info("Session cancelled.");
            navigate({ to: "/app/board/sessions" });
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "Something went wrong.");
          }
        }}
        isLoading={cancelSessionMutation.isPending}
      />
    </div>
  );
}
