import { useState } from "react";
import { toast } from "sonner";
import { RestrictedActionTooltip } from "@/entities/access";
import { DecisionEffectPreview } from "@/entities/proposal";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/shared/auth";
import { canShowAction } from "@/entities/access/model/permission-guard";
import { SeparationOfDutiesWarning } from "@/entities/access";
import type {
  BoardVote,
  SeriesProposal,
  VoteDecision,
} from "@/entities/proposal/model/proposal-types";
import {
  mapBoardApiError,
  useBoardVotesQuery,
  useCastBoardVoteMutation,
  useFinalizeDecisionMutation,
} from "../../api/board-queries";
import { useActiveVotingSession } from "../../api/use-active-voting-session";

type PanelDecision = "APPROVE" | "REJECT";

const OPTIONS: { value: PanelDecision; label: string; className: string }[] = [
  { value: "APPROVE", label: "Approve", className: "bg-emerald-700 hover:bg-emerald-800" },
  { value: "REJECT", label: "Reject", className: "bg-rose-700 hover:bg-rose-800" },
];

export function VotingPanel({ proposal }: { proposal: SeriesProposal }) {
  const user = useAuth((s) => s.user);
  const { data: votesData } = useBoardVotesQuery(proposal.id);
  const { sessionId, expectedVersion, hasActiveSession } = useActiveVotingSession(proposal.id);
  const castVote = useCastBoardVoteMutation();
  const finalize = useFinalizeDecisionMutation();
  const [decision, setDecision] = useState<PanelDecision | undefined>();
  const [comment, setComment] = useState("");

  if (!user) return null;

  const existing = votesData?.votes.find((v: BoardVote) => v.voterId === user.id);
  const guard = canShowAction({ role: user.role, action: "vote", currentUserId: user.id });
  // hasActiveSession is the source of truth: only an OPEN session accepts votes.
  const disabledReason = existing
    ? undefined
    : !hasActiveSession
      ? "NO_ACTIVE_VOTING_SESSION"
      : !guard.allowed
        ? guard.reason
        : undefined;
  const requiresComment = decision === "REJECT";
  const canSubmit =
    !existing && !disabledReason && decision && (!requiresComment || comment.trim().length > 0);

  const handleVote = () => {
    if (!decision || !sessionId) return;

    castVote.mutate(
      {
        seriesId: proposal.id,
        body: {
          voteDecision: decision,
          comment: comment.trim() || undefined,
          sessionId,
          expectedVersion: expectedVersion ?? undefined,
        },
      },
      {
        onSuccess: () => {
          toast.success("Vote recorded.");
          setDecision(undefined);
          setComment("");
        },
        onError: (err) => {
          toast.error(mapBoardApiError(err));
        },
      },
    );
  };

  const handleFinalize = () => {
    if (!sessionId) {
      toast.error("An active VotingSession is required before finalization.");
      return;
    }

    finalize.mutate(
      {
        seriesId: proposal.id,
        sessionId,
        body: { expectedVersion: expectedVersion ?? undefined },
      },
      {
        onSuccess: () => {
          toast.success("VotingSession closed. Backend resolved quorum and result.");
        },
        onError: (err) => {
          toast.error(mapBoardApiError(err));
        },
      },
    );
  };

  const canFinalizeRole = user.role === "board";
  const isDecided = ["APPROVED", "REJECTED", "WITHDRAWN"].includes(proposal.status);
  const finalizeLocked = finalize.isPending || finalize.isSuccess || isDecided;
  const canFinalize =
    canFinalizeRole && !finalizeLocked && Boolean(sessionId) && Boolean(votesData?.tally.status);

  return (
    <aside className="sticky top-20 space-y-3 rounded-md border border-border bg-card p-4">
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        Voting Panel
      </p>

      <div className="mb-2">
        <SeparationOfDutiesWarning>
          Board members vote here. Finalization closes the active VotingSession and lets the backend
          resolve quorum, re-vote, approval, rejection, and audit state.
        </SeparationOfDutiesWarning>
      </div>

      {existing ? (
        <div className="rounded border border-emerald-300 bg-emerald-50 p-3 text-xs text-emerald-950">
          You voted: <strong>{existing.decision}</strong>
        </div>
      ) : null}

      <div className="grid gap-2">
        {OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            disabled={Boolean(existing || disabledReason)}
            onClick={() => setDecision(option.value)}
            className={`rounded px-3 py-2 text-xs font-bold text-white transition disabled:opacity-40 ${option.className} ${
              decision === option.value
                ? "ring-2 ring-foreground ring-offset-2 ring-offset-background"
                : ""
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <Textarea
        rows={4}
        value={comment}
        onChange={(event) => setComment(event.target.value)}
        placeholder={requiresComment ? "Reason is required." : "Optional Board note."}
      />

      <DecisionEffectPreview proposal={proposal} decision={decision} />

      {disabledReason ? (
        <RestrictedActionTooltip reason={disabledReason}>
          <button className="w-full rounded bg-muted px-3 py-2 text-xs font-semibold text-muted-foreground">
            Vote unavailable
          </button>
        </RestrictedActionTooltip>
      ) : (
        <button
          type="button"
          disabled={!canSubmit || castVote.isPending}
          onClick={handleVote}
          className="w-full rounded bg-foreground px-3 py-2 text-xs font-semibold text-background hover:bg-foreground/90 disabled:opacity-40"
        >
          {castVote.isPending ? "Submitting..." : "Submit vote"}
        </button>
      )}

      {canFinalizeRole && (
        <>
          <hr className="border-border" />
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            VotingSession Finalization
          </p>

          {isDecided ? (
            <div className="rounded border border-border bg-muted/40 p-3 text-xs font-semibold text-foreground">
              Finalized: {proposal.status}. This decision cannot be changed from the normal Board
              workflow.
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid gap-1 rounded border border-border bg-muted/30 p-2 text-[11px] text-muted-foreground">
                <span>Active session: {sessionId ?? "Missing"}</span>
                <span>
                  Backend-owned result: quorum, no quorum, re-vote, approval, and rejection.
                </span>
              </div>
              <button
                type="button"
                disabled={!canFinalize || finalize.isPending}
                onClick={handleFinalize}
                className="w-full rounded bg-foreground px-3 py-2 text-xs font-bold text-background hover:bg-foreground/90 disabled:opacity-40"
              >
                {finalize.isPending ? "Closing..." : "Close VotingSession"}
              </button>
            </div>
          )}
        </>
      )}
    </aside>
  );
}
