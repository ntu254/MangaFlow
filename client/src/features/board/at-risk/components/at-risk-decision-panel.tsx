import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { AtRiskReview } from "@/entities/board/model/board-types";
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
import { useState } from "react";
import { toast } from "sonner";

export function AtRiskDecisionPanel({ review }: { review: AtRiskReview }) {
  const decideMutation = useAtRiskDecisionMutation();
  const [decision, setDecision] = useState<VisualAtRiskDecision | undefined>(review.decision);
  const [reason, setReason] = useState(review.decisionReason ?? "");
  const disabled = review.status === "DECIDED";
  const reasonRequired = decision ? requiresAtRiskDecisionReason(decision) : false;
  const canSubmit =
    decision &&
    !disabled &&
    isAtRiskDecisionSupported(decision) &&
    (!reasonRequired || reason.trim().length > 0);

  return (
    <Panel
      title="At-risk decision"
      description="Các quyết định thay đổi trạng thái tác phẩm"
      contentClassName="space-y-4"
    >
      <div className="grid grid-cols-2 gap-2">
        {VISUAL_AT_RISK_DECISIONS.map((item) => {
          const supported = isAtRiskDecisionSupported(item);
          const active = decision === item;
          const button = (
            <button
              type="button"
              disabled={disabled || !supported}
              onClick={() => setDecision(item)}
              className={`h-10 w-full rounded-[5px] border px-3 text-[12px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                active
                  ? "border-[var(--admin-navy)] bg-[var(--admin-navy)] text-[var(--admin-cream)]"
                  : "border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-ink)] hover:bg-[var(--admin-hover)]"
              }`}
            >
              {getAtRiskDecisionLabel(item)}
            </button>
          );

          if (!supported) {
            return (
              <TooltipProvider key={item}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="block w-full cursor-not-allowed">{button}</span>
                  </TooltipTrigger>
                  <TooltipContent>Chưa hỗ trợ trong MVP</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          }

          return <div key={item}>{button}</div>;
        })}
      </div>

      {decision && (
        <StateBlock title="Hiệu ứng dự kiến" description={getAtRiskDecisionEffect(decision)} />
      )}

      <div>
        <label className="mb-1 block text-[11px] font-semibold text-[var(--admin-muted)]">
          Lý do thực hiện {reasonRequired && <span className="text-rose-500">*</span>}
        </label>
        <Textarea
          rows={4}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder={
            reasonRequired
              ? "Bắt buộc điền lý do cho các quyết định cảnh báo hoặc huỷ bỏ..."
              : "Ghi chú quyết định..."
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
                decision,
                note: reason.trim() || undefined,
              },
            },
            {
              onSuccess: () => toast.success("Đã ghi nhận at-risk decision."),
              onError: (e) => toast.error(e instanceof Error ? e.message : "Lỗi."),
            },
          );
        }}
        className="w-full"
      >
        {decideMutation.isPending ? "Đang xử lý..." : "Record decision"}
      </ActionButton>
    </Panel>
  );
}
