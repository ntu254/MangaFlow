import { Textarea } from "@/components/ui/textarea";
import { AT_RISK_DECISION_LABEL, type AtRiskReview } from "@/entities/board/model/board-types";
import { ActionButton, Panel, StateBlock } from "@/shared/ui";
import { useAtRiskDecisionMutation } from "../../api/board-queries";
import {
  VISUAL_AT_RISK_DECISIONS,
  getAtRiskDecisionEffect,
  getAtRiskDecisionLabel,
  isAtRiskDecisionSupported,
  requiresAtRiskDecisionReason,
  type VisualAtRiskDecision,
} from "../model/at-risk-decision-utils";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";

export function AtRiskDecisionPanel({ review }: { review: AtRiskReview }) {
  const decideMutation = useAtRiskDecisionMutation();
  const [decision, setDecision] = useState<VisualAtRiskDecision | undefined>(
    isAtRiskDecisionSupported(review.decision) ? review.decision : undefined,
  );
  const [reason, setReason] = useState(review.decisionReason ?? "");
  const [publicationType, setPublicationType] = useState<"WEEKLY" | "MONTHLY">("MONTHLY");
  useEffect(() => {
    setDecision(isAtRiskDecisionSupported(review.decision) ? review.decision : undefined);
    setReason(review.decisionReason ?? "");
  }, [review.id, review.decision, review.decisionReason]);
  const disabled = review.status === "DECIDED";
  const reasonRequired = decision ? requiresAtRiskDecisionReason(decision) : false;
  const canSubmit =
    decision &&
    !disabled &&
    isAtRiskDecisionSupported(decision) &&
    (!reasonRequired || reason.trim().length > 0);

  if (disabled && review.decision) {
    return (
      <Panel
        title="Decision recorded"
        description="This at-risk review is complete."
        contentClassName="space-y-4"
      >
        <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-950">
          <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">Decision</p>
          <p className="mt-1 font-semibold">
            {AT_RISK_DECISION_LABEL[review.decision] ?? review.decision}
          </p>
        </div>
        <dl className="space-y-2 text-xs">
          {review.decisionReason ? (
            <div>
              <dt className="font-semibold text-[var(--admin-muted)]">Reason</dt>
              <dd className="mt-0.5 text-[var(--admin-ink)]">{review.decisionReason}</dd>
            </div>
          ) : null}
          {review.decidedByName ? (
            <div>
              <dt className="font-semibold text-[var(--admin-muted)]">Recorded by</dt>
              <dd className="mt-0.5 text-[var(--admin-ink)]">{review.decidedByName}</dd>
            </div>
          ) : null}
          {review.decidedAt ? (
            <div>
              <dt className="font-semibold text-[var(--admin-muted)]">Recorded at</dt>
              <dd className="mt-0.5 text-[var(--admin-ink)]">
                {new Date(review.decidedAt).toLocaleString("en-US")}
              </dd>
            </div>
          ) : null}
        </dl>
        <p className="text-xs text-[var(--admin-muted)]">
          The decision is saved in the governance record. CANCEL archives the series and cancels
          its publication schedule immediately; other decisions do not automatically change the
          series status.
        </p>
        <Link to="/app/board/decisions" className="text-xs font-semibold underline">
          View decision history
        </Link>
      </Panel>
    );
  }

  return (
    <Panel
      title="At-risk decision"
      description="Manual response for a flagged series"
      contentClassName="space-y-4"
    >
      <div className="grid grid-cols-2 gap-2">
        {VISUAL_AT_RISK_DECISIONS.map((item) => {
          const active = decision === item;
          return (
            <div key={item}>
              <button
                type="button"
                disabled={disabled}
                onClick={() => setDecision(item)}
                className={`h-10 w-full rounded-[5px] border px-3 text-[12px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                  active
                    ? "border-[var(--admin-navy)] bg-[var(--admin-navy)] text-[var(--admin-cream)]"
                    : "border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-ink)] hover:bg-[var(--admin-hover)]"
                }`}
              >
                {getAtRiskDecisionLabel(item)}
              </button>
            </div>
          );
        })}
      </div>

      {decision && (
        <StateBlock title="Expected effect" description={getAtRiskDecisionEffect(decision)} />
      )}

      {decision === "CHANGE_FORMAT" ? (
        <label className="grid gap-1 text-xs font-semibold">
          New publication cadence
          <select
            value={publicationType}
            onChange={(event) =>
              setPublicationType(event.target.value as "WEEKLY" | "MONTHLY")
            }
            className="rounded border border-[var(--admin-border)] bg-[var(--admin-surface)] px-2 py-2 text-xs font-normal"
          >
            <option value="WEEKLY">Weekly</option>
            <option value="MONTHLY">Monthly</option>
          </select>
        </label>
      ) : null}

      <div>
        <label className="mb-1 block text-[11px] font-semibold text-[var(--admin-muted)]">
          Reason {reasonRequired && <span className="text-rose-500">*</span>}
        </label>
        <Textarea
          rows={4}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder={
            reasonRequired ? "A reason is required for this decision..." : "Decision notes..."
          }
        />
      </div>

      <ActionButton
        tone="primary"
        disabled={!canSubmit || decideMutation.isPending}
        onClick={() => {
          if (!decision || !isAtRiskDecisionSupported(decision)) return;
          decideMutation.mutate(
            {
              seriesId: review.seriesId,
              body: {
                rankingId: review.rankingId,
                decision,
                note: reason.trim() || undefined,
                ...(decision === "CHANGE_FORMAT" ? { publicationType } : {}),
              },
            },
            {
              onSuccess: () => toast.success("At-risk decision recorded."),
              onError: (e) => toast.error(e instanceof Error ? e.message : "Error."),
            },
          );
        }}
        className="w-full"
      >
        {decideMutation.isPending ? "Processing..." : "Record decision"}
      </ActionButton>
    </Panel>
  );
}
