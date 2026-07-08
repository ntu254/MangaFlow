import { useState } from "react";
import { toast } from "sonner";
import { RestrictedActionTooltip } from "@/entities/access";
import { DecisionEffectPreview } from "@/entities/proposal";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/shared/auth";
import { canShowAction } from "@/entities/access/model/permission-guard";
import { checkAction } from "@/entities/proposal";
import { SeparationOfDutiesWarning } from "@/entities/access";
import type {
  SeriesProposal,
  VoteDecision,
  BoardVote,
} from "@/entities/proposal/model/proposal-types";
import {
  useCastBoardVoteMutation,
  useFinalizeDecisionMutation,
  useBoardVotesQuery,
  mapBoardApiError,
} from "../../api/board-queries";

type PanelDecision = VoteDecision | "NEEDS_REVISION";

const OPTIONS: { value: PanelDecision; label: string; className: string }[] = [
  { value: "APPROVE", label: "Approve", className: "bg-emerald-700 hover:bg-emerald-800" },
  { value: "REJECT", label: "Reject", className: "bg-rose-700 hover:bg-rose-800" },
  {
    value: "NEEDS_REVISION",
    label: "Needs Revision",
    className: "bg-amber-600 hover:bg-amber-700",
  },
  { value: "ABSTAIN", label: "Abstain", className: "bg-zinc-700 hover:bg-zinc-800" },
];

export function VotingPanel({ proposal }: { proposal: SeriesProposal }) {
  const user = useAuth((s) => s.user);
  const { data: votesData } = useBoardVotesQuery(proposal.id);
  const castVote = useCastBoardVoteMutation();
  const finalize = useFinalizeDecisionMutation();
  const [decision, setDecision] = useState<PanelDecision | undefined>();
  const [comment, setComment] = useState("");
  const [publicationType, setPublicationType] = useState<"WEEKLY" | "MONTHLY" | undefined>();

  if (!user) return null;

  const existing = votesData?.votes.find((v: BoardVote) => v.memberId === user.id);
  const voteCheck = checkAction("VOTE", user, proposal);
  const guard = canShowAction({ role: user.role, action: "vote", currentUserId: user.id });
  const disabledReason = existing
    ? undefined
    : !guard.allowed
      ? guard.reason
      : !voteCheck.ok
        ? "ONLY_BOARD_MEMBERS_CAN_VOTE"
        : undefined;
  const requiresComment = decision === "REJECT" || decision === "NEEDS_REVISION";
  const canSubmit =
    !existing && !disabledReason && decision && (!requiresComment || comment.trim().length > 0);

  const handleVote = () => {
    if (!decision) return;
    castVote.mutate(
      {
        seriesId: proposal.id,
        body: {
          voteDecision: decision === "NEEDS_REVISION" ? "REJECT" : decision,
          comment: comment.trim() || undefined,
        },
      },
      {
        onSuccess: () => {
          toast.success("Đã ghi nhận vote.");
          setDecision(undefined);
          setComment("");
        },
        onError: (err) => {
          toast.error(mapBoardApiError(err));
        },
      },
    );
  };

  const handleFinalize = (finalDecision: "APPROVED" | "REJECTED") => {
    finalize.mutate(
      {
        seriesId: proposal.id,
        body: {
          decision: finalDecision,
          note: comment.trim() || undefined,
          publicationType: finalDecision === "APPROVED" ? publicationType : undefined,
        },
      },
      {
        onSuccess: () => {
          toast.success(`Đã finalize: ${finalDecision}`);
          setComment("");
          setPublicationType(undefined);
        },
        onError: (err) => {
          toast.error(mapBoardApiError(err));
        },
      },
    );
  };

  const canFinalizeRole = user.role === "admin" || user.role === "board";
  // Once a final decision exists (or one is in flight), lock BOTH finalize
  // buttons so an Approve can't be overridden by a later Reject (and vice versa).
  const isDecided = ["APPROVED", "REJECTED", "WITHDRAWN"].includes(proposal.status);
  const finalizeLocked = finalize.isPending || finalize.isSuccess || isDecided;
  const canFinalize = canFinalizeRole && !existing && !finalizeLocked;

  return (
    <aside className="sticky top-20 space-y-3 rounded-md border border-border bg-card p-4">
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        Voting Panel
      </p>

      <div className="mb-2">
        <SeparationOfDutiesWarning>
          Cảnh báo phân tách nhiệm vụ (Vote vs Finalize): Thành viên hội đồng thực hiện bỏ phiếu
          (voting) nhưng việc chốt quyết định cuối cùng (finalize) phải do Board/Admin thực hiện.
        </SeparationOfDutiesWarning>
      </div>

      {existing ? (
        <div className="rounded border border-emerald-300 bg-emerald-50 p-3 text-xs text-emerald-950">
          Bạn đã vote: <strong>{existing.decision}</strong>
        </div>
      ) : null}
      <div className="grid gap-2">
        {OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            disabled={Boolean(existing || disabledReason)}
            onClick={() => setDecision(option.value)}
            className={`rounded px-3 py-2 text-xs font-bold text-white transition disabled:opacity-40 ${option.className} ${decision === option.value ? "ring-2 ring-foreground ring-offset-2 ring-offset-background" : ""}`}
          >
            {option.label}
          </button>
        ))}
      </div>
      <Textarea
        rows={4}
        value={comment}
        onChange={(event) => setComment(event.target.value)}
        placeholder={requiresComment ? "Bắt buộc nhập lý do..." : "Ghi chú tùy chọn..."}
      />
      <DecisionEffectPreview proposal={proposal} decision={decision} />
      {disabledReason ? (
        <RestrictedActionTooltip reason={disabledReason}>
          <button className="w-full rounded bg-muted px-3 py-2 text-xs font-semibold text-muted-foreground">
            Chưa thể vote
          </button>
        </RestrictedActionTooltip>
      ) : (
        <button
          type="button"
          disabled={!canSubmit || castVote.isPending}
          onClick={handleVote}
          className="w-full rounded bg-foreground px-3 py-2 text-xs font-semibold text-background hover:bg-foreground/90 disabled:opacity-40"
        >
          {castVote.isPending ? "Đang gửi..." : "Submit vote"}
        </button>
      )}

      {canFinalizeRole && (
        <>
          <hr className="border-border" />
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Finalize (Board/Admin)
          </p>

          {isDecided ? (
            <div className="rounded border border-border bg-muted/40 p-3 text-xs font-semibold text-foreground">
              Đã finalize: {proposal.status}. Không thể thay đổi quyết định.
            </div>
          ) : (
            <>
              <div className="space-y-1.5">
                <p className="text-[10px] font-semibold text-foreground">
                  Publication type (bắt buộc khi Approve)
                </p>
                <div className="grid gap-1 rounded border border-border bg-muted/30 p-2 text-[11px] text-muted-foreground">
                  <span>
                    Mangaka requested: {proposal.requestedPublicationType ?? "Not provided"}
                  </span>
                  <span>
                    Editor suggested: {proposal.editorSuggestedPublicationType ?? "Not provided"}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {(["WEEKLY", "MONTHLY"] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setPublicationType(type)}
                      className={`rounded px-2 py-1.5 text-[11px] font-semibold transition ${
                        publicationType === type
                          ? "bg-foreground text-background"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      {type === "WEEKLY" ? "Weekly" : "Monthly"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={!canFinalize || finalize.isPending || !publicationType}
                  onClick={() => handleFinalize("APPROVED")}
                  className="rounded bg-emerald-800 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-900 disabled:opacity-40"
                >
                  {finalize.isPending ? "..." : "→ Approve"}
                </button>
                <button
                  type="button"
                  disabled={!canFinalize || finalize.isPending}
                  onClick={() => handleFinalize("REJECTED")}
                  className="rounded bg-rose-800 px-3 py-2 text-xs font-bold text-white hover:bg-rose-900 disabled:opacity-40"
                >
                  {finalize.isPending ? "..." : "→ Reject"}
                </button>
              </div>
            </>
          )}
        </>
      )}
    </aside>
  );
}
