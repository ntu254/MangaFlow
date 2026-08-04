import {
  SESSION_MODE_LABEL,
  SESSION_STATUS_HELP,
  SESSION_STATUS_LABEL,
} from "@/entities/board/model/voting-types";
import { useProposalsQuery } from "@/features/proposals";
import { isBoardChair, useAuth } from "@/shared/auth";
import { EmptyState } from "@/shared/ui/empty-state";
import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  useCancelVotingSessionMutation,
  useCloseVotingSessionMutation,
  useResolveVotingTieMutation,
  useVotingSessionsQuery,
  useVotingSessionQuery,
} from "../api/sessions.queries";
import { SessionNotes } from "./session-notes";
import { SessionProposalRow } from "./session-proposal-row";
import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import { Textarea } from "@/components/ui/textarea";

interface SessionDetailPageProps {
  sessionId: string;
}

export function SessionDetailPage({ sessionId: sid }: SessionDetailPageProps) {
  const user = useAuth((s) => s.user);
  const { data: session, isLoading, isError } = useVotingSessionQuery(sid);
  const { data: allSessions = [] } = useVotingSessionsQuery();
  const { data: proposals = [] } = useProposalsQuery({
    status: "PENDING_BOARD,BOARD_REVIEW,APPROVED,REJECTED",
  });
  const closeSessionMutation = useCloseVotingSessionMutation();
  const resolveTieMutation = useResolveVotingTieMutation();
  const cancelSessionMutation = useCancelVotingSessionMutation();
  const navigate = useNavigate();
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [tieDecision, setTieDecision] = useState<"APPROVED" | "REJECTED" | null>(null);
  const [tieNote, setTieNote] = useState("");
  const [publicationType, setPublicationType] = useState<"WEEKLY" | "MONTHLY">("MONTHLY");
  const sessionProposal = session
    ? proposals.find((proposal) => session.proposalIds.includes(proposal.id))
    : undefined;
  useEffect(() => {
    if (sessionProposal?.requestedPublicationType) {
      setPublicationType(sessionProposal.requestedPublicationType);
    }
  }, [sessionProposal?.id, sessionProposal?.requestedPublicationType]);

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
  const canResolveTie =
    isChair &&
    session.status === "TIED" &&
    session.tiePolicy === "CHAIR_DECIDES" &&
    (session.tieResolution ?? "PENDING") === "PENDING" &&
    (session.votingRound ?? (session.reVoteOfSessionId ? 2 : 1)) >= 2;

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
          <div className="mt-4 flex flex-wrap items-end gap-2">
            <label className="grid gap-1 text-[11px] font-semibold">
              Approved cadence
              <select
                value={publicationType}
                onChange={(event) =>
                  setPublicationType(event.target.value as "WEEKLY" | "MONTHLY")
                }
                className="rounded border border-border bg-background px-2 py-1.5 text-xs font-normal"
              >
                <option value="WEEKLY">Weekly</option>
                <option value="MONTHLY">Monthly</option>
              </select>
            </label>
            <button
              onClick={async () => {
                try {
                  await closeSessionMutation.mutateAsync({
                    sessionId: session.id,
                    body: {
                      ...(session.version ? { expectedVersion: session.version } : {}),
                      publicationType,
                    },
                  });
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
        {canResolveTie ? (
          <div className="mt-4 space-y-3 rounded border border-amber-300 bg-amber-50 p-3 text-xs text-amber-950">
            <p className="font-semibold">Round 2 is still tied. Chair decision required.</p>
            <Textarea
              value={tieNote}
              onChange={(event) => setTieNote(event.target.value)}
              placeholder="Required reason for the Chair decision"
              rows={3}
            />
            <div className="flex flex-wrap gap-2">
              {(["APPROVED", "REJECTED"] as const).map((decision) => (
                <button
                  key={decision}
                  type="button"
                  disabled={!tieNote.trim() || resolveTieMutation.isPending}
                  onClick={async () => {
                    setTieDecision(decision);
                    try {
                      await resolveTieMutation.mutateAsync({
                        sessionId: session.id,
                        body: {
                          decision,
                          note: tieNote.trim(),
                          ...(session.version ? { expectedVersion: session.version } : {}),
                        },
                      });
                      toast.success(`Tie resolved as ${decision}.`);
                    } catch (e) {
                      toast.error(e instanceof Error ? e.message : "Something went wrong.");
                    } finally {
                      setTieDecision(null);
                    }
                  }}
                  className={`rounded px-3 py-1.5 font-semibold text-white disabled:opacity-40 ${
                    decision === "APPROVED" ? "bg-emerald-700" : "bg-rose-700"
                  }`}
                >
                  {resolveTieMutation.isPending && tieDecision === decision
                    ? "Saving..."
                    : `Resolve ${decision}`}
                </button>
              ))}
            </div>
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
        <p className="mt-1 text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">Round:</span>{" "}
          {session.votingRound ?? (session.reVoteOfSessionId ? 2 : 1)} ·{" "}
          <span className="font-semibold text-foreground">Tie policy:</span>{" "}
          {session.tiePolicy ?? "CHAIR_DECIDES"}
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
          <h2 className="font-serif text-xl">
            Proposals in this round ({session.proposalIds.length})
          </h2>
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
