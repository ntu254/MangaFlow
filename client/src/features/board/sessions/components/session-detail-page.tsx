import { SESSION_MODE_LABEL, SESSION_STATUS_LABEL } from "@/entities/board/model/voting-types";
import { useProposalsQuery } from "@/features/proposals";
import { isEditorInChief, useAuth } from "@/shared/auth";
import { EmptyState } from "@/shared/ui/empty-state";
import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import {
  useCancelVotingSessionMutation,
  useCloseVotingSessionMutation,
  useVotingSessionQuery,
} from "../api/sessions.queries";
import { SessionNotes } from "./session-notes";
import { SessionProposalRow } from "./session-proposal-row";
import { TieBreakPanel } from "./tie-break-panel";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";

interface SessionDetailPageProps {
  sessionId: string;
}

export function SessionDetailPage({ sessionId: sid }: SessionDetailPageProps) {
  const user = useAuth((s) => s.user);
  const { data: session, isLoading, isError } = useVotingSessionQuery(sid);
  const { data: proposals = [] } = useProposalsQuery({
    status: "PENDING_BOARD,TIE_BREAK,APPROVED,REJECTED",
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
        description="Back to list."
        action={
          <Link to="/app/board/sessions" className="text-xs underline">
            Sessions
          </Link>
        }
      />
    );

  const isModerator = user.role === "editor" || user.role === "admin" || user.role === "board";
  const isEiC = (user.role === "editor" && isEditorInChief(user)) || user.role === "admin";
  const tieCount = session.outcomes.filter(
    (o) =>
      o.decision === "NO_QUORUM" &&
      proposals.find((p) => p.id === o.proposalId)?.status === "TIE_BREAK",
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
            <p>Opened: {new Date(session.openedAt).toLocaleString("vi-VN")}</p>
            {session.scheduledFor ? (
              <p>Meeting: {new Date(session.scheduledFor).toLocaleString("vi-VN")}</p>
            ) : null}
            {session.closesAt ? (
              <p>Expected close: {new Date(session.closesAt).toLocaleString("vi-VN")}</p>
            ) : null}
            {session.closedAt ? (
              <p>Closed: {new Date(session.closedAt).toLocaleString("vi-VN")}</p>
            ) : null}
          </div>
        </div>
        {session.status === "OPEN" && isModerator ? (
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={async () => {
                try {
                  await closeSessionMutation.mutateAsync(session.id);
                  toast.success("Closed session.");
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : "Error.");
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
      </header>

      <section className="space-y-3">
        <h2 className="font-serif text-xl">
          Proposals trong session ({session.proposalIds.length})
        </h2>
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

      {isEiC && tieCount > 0 ? (
        <section className="space-y-3 rounded-lg border border-fuchsia-300 bg-fuchsia-50/40 p-4">
          <h2 className="font-serif text-xl text-fuchsia-950">Tie-break panel (Editor-in-chief)</h2>
          <p className="text-xs text-fuchsia-950/80">
            {tieCount} proposals need tie-breaking. Your vote has weight 2 and will finalize
            proposal status immediately.
          </p>
          {session.proposalIds.map((pid) => {
            const proposal = proposals.find((p) => p.id === pid);
            const outcome = session.outcomes.find((o) => o.proposalId === pid);
            if (
              !proposal ||
              !outcome ||
              outcome.decision !== "NO_QUORUM" ||
              proposal.status !== "TIE_BREAK"
            )
              return null;
            return <TieBreakPanel key={pid} session={session} proposal={proposal} user={user} />;
          })}
        </section>
      ) : null}

      <SessionNotes session={session} user={user} />

      <ConfirmDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        title="Cancel session"
        description="Are you sure you want to cancel this session? Proposals in the session will return to their previous status."
        confirmLabel="Cancel session"
        cancelLabel="No"
        variant="danger"
        onConfirm={async () => {
          try {
            await cancelSessionMutation.mutateAsync(session.id);
            toast.info("Session canceled.");
            navigate({ to: "/app/board/sessions" });
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "Error.");
          }
        }}
        isLoading={cancelSessionMutation.isPending}
      />
    </div>
  );
}
