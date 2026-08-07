import { useState } from "react";
import { toast } from "sonner";
import { RestrictedActionTooltip } from "@/entities/access";
import { DecisionEffectPreview } from "@/entities/proposal";
import { Textarea } from "@/components/ui/textarea";
import { useAuth, isBoardChair } from "@/shared/auth";
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
  const [publicationType, setPublicationType] = useState<"WEEKLY" | "MONTHLY">(
    proposal.requestedPublicationType ?? "MONTHLY",
  );

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
        body: {
          expectedVersion: expectedVersion ?? undefined,
          publicationType,
        },
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

  const canFinalizeRole = user.role === "board" && isBoardChair(user.id);
  const isDecided = ["APPROVED", "REJECTED", "WITHDRAWN"].includes(proposal.status);
  const finalizeLocked = finalize.isPending || finalize.isSuccess || isDecided;
  const canFinalize =
    canFinalizeRole && !finalizeLocked && Boolean(sessionId) && Boolean(votesData?.tally.status);

  return (
    <div className="space-y-4 rounded-2xl border border-border/80 bg-card/80 p-5 shadow-xs backdrop-blur-md">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Executive Voting Workbench</h3>
        <span className="rounded-md border border-border/60 bg-muted/40 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
          Board Member
        </span>
      </div>


      {/* Live Tally Metric Cards */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-center space-y-0.5">
          <span className="font-serif text-2xl font-bold text-emerald-600 dark:text-emerald-400 leading-none">
            {votesData?.tally.approve ?? 0}
          </span>
          <span className="block text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
            Approve
          </span>
        </div>
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-center space-y-0.5">
          <span className="font-serif text-2xl font-bold text-rose-600 dark:text-rose-400 leading-none">
            {votesData?.tally.reject ?? 0}
          </span>
          <span className="block text-[10px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-300">
            Reject
          </span>
        </div>
      </div>

      {existing ? (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-800 dark:text-emerald-300 font-medium">
          You voted: <strong className="uppercase">{existing.decision}</strong>
        </div>
      ) : null}

      <div className="grid gap-2 grid-cols-2">
        {OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            disabled={Boolean(existing || disabledReason)}
            onClick={() => setDecision(option.value)}
            className={`rounded-xl px-3 py-2.5 text-xs font-bold text-white transition-all shadow-2xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${option.className} ${
              decision === option.value
                ? "ring-2 ring-foreground ring-offset-2 ring-offset-background scale-[1.02]"
                : ""
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <Textarea
        rows={3}
        value={comment}
        onChange={(event) => setComment(event.target.value)}
        placeholder={requiresComment ? "Reason is required for Rejection." : "Optional Board evaluation note..."}
        className="rounded-xl border-border/80 bg-background/60 text-xs"
      />


      {disabledReason ? (
        <RestrictedActionTooltip reason={disabledReason}>
          <button className="w-full rounded-xl bg-muted/60 px-3 py-2.5 text-xs font-semibold text-muted-foreground">
            Vote Unavailable
          </button>
        </RestrictedActionTooltip>
      ) : (
        <button
          type="button"
          disabled={!canSubmit || castVote.isPending}
          onClick={handleVote}
          className="w-full rounded-xl bg-primary px-3 py-2.5 text-xs font-bold text-primary-foreground transition-all hover:opacity-90 shadow-2xs disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {castVote.isPending ? "Submitting Vote..." : "Submit Vote"}
        </button>
      )}

      {canFinalizeRole && (
        <div className="pt-3 border-t border-border/60 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Chair Session Finalization
            </span>
            <span className="rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[9px] font-bold text-amber-700 dark:text-amber-400">
              Chair Only
            </span>
          </div>

          {isDecided ? (
            <div className="rounded-xl border border-border/60 bg-muted/30 p-3 text-xs text-muted-foreground">
              Session Finalized: <strong className="text-foreground font-semibold">{proposal.status}</strong>
            </div>
          ) : !sessionId ? (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-[11px] text-amber-800 dark:text-amber-300">
              No active voting session currently open for finalization.
            </div>
          ) : (
            <div className="space-y-3 rounded-xl border border-border/60 bg-background/50 p-3">
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>Active Session</span>
                <span className="font-mono font-semibold text-foreground text-[10px] truncate max-w-[140px]">{sessionId}</span>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-foreground">
                  Approved Series Publication Cadence
                </label>
                <select
                  value={publicationType}
                  onChange={(event) =>
                    setPublicationType(event.target.value as "WEEKLY" | "MONTHLY")
                  }
                  className="w-full rounded-lg border border-border/80 bg-background px-2.5 py-1.5 text-xs text-foreground outline-none focus:border-primary"
                >
                  <option value="WEEKLY">Weekly Publication</option>
                  <option value="MONTHLY">Monthly Publication</option>
                </select>
              </div>

              <button
                type="button"
                disabled={!canFinalize || finalize.isPending}
                onClick={handleFinalize}
                className="w-full rounded-xl bg-foreground px-3 py-2 text-xs font-bold text-background transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
              >
                {finalize.isPending ? "Closing Session..." : "Finalize & Close Session"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
