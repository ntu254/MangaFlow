import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { ActionButton, Panel, StateBlock } from "@/shared/ui";
import {
  AT_RISK_DECISIONS,
  AT_RISK_DECISION_EFFECT,
  AT_RISK_DECISION_LABEL,
  requiresAtRiskDecisionReason,
  type AtRiskDecisionKind,
} from "@/entities/board/model/board-types";
import type { AtRiskReport } from "../../api/board-queries";
import { useAtRiskDecisionMutation } from "../../api/board-queries";

export function AtRiskDecisionPanel({
  seriesId,
  report,
}: {
  seriesId: string;
  report?: AtRiskReport | null;
}) {
  const decideMutation = useAtRiskDecisionMutation();
  const [decision, setDecision] = useState<AtRiskDecisionKind>("CONTINUE");
  const [publicationType, setPublicationType] = useState<"WEEKLY" | "MONTHLY">("MONTHLY");
  const [note, setNote] = useState("");
  const hasReport = Boolean(report);
  const reasonRequired = requiresAtRiskDecisionReason(decision);
  const canSubmit = hasReport && (!reasonRequired || note.trim().length > 0);

  useEffect(() => {
    setDecision("CONTINUE");
    setPublicationType("MONTHLY");
    setNote("");
  }, [seriesId, report?.id]);

  return (
    <Panel
      title="At-risk decision"
      description="Board decision after the submitted Tantou report"
      contentClassName="space-y-4"
    >
      {!hasReport ? (
        <StateBlock
          title="Report required"
          description="The Board can decide only after the Tantou Editor submits an at-risk report."
        />
      ) : (
        <StateBlock
          title="Latest Tantou recommendation"
          description={`${report?.recommendation ?? "No recommendation"} - ${report?.rankingSummary ?? ""}`}
        />
      )}

      <div className="grid grid-cols-2 gap-2">
        {AT_RISK_DECISIONS.map((item) => (
          <button
            key={item}
            type="button"
            disabled={!hasReport}
            onClick={() => setDecision(item)}
            className={`h-10 rounded-[5px] border px-3 text-[12px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
              decision === item
                ? "border-(--admin-navy) bg-(--admin-navy) text-(--admin-cream)"
                : "border-(--admin-border) bg-(--admin-surface) text-(--admin-ink) hover:bg-(--admin-hover)"
            }`}
            title={AT_RISK_DECISION_EFFECT[item]}
          >
            {AT_RISK_DECISION_LABEL[item]}
          </button>
        ))}
      </div>

      {decision === "RESCHEDULE" ? (
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-(--admin-muted)">Publication type</label>
          <div className="grid grid-cols-2 gap-2">
            {(["WEEKLY", "MONTHLY"] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setPublicationType(type)}
                className={`rounded border px-3 py-2 text-xs font-semibold ${
                  publicationType === type
                    ? "border-(--admin-navy) bg-(--admin-navy) text-(--admin-cream)"
                    : "border-(--admin-border) bg-(--admin-surface)"
                }`}
              >
                {type === "WEEKLY" ? "Weekly" : "Monthly"}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div>
        <label className="mb-1 block text-[11px] font-semibold text-(--admin-muted)">
          Decision note {reasonRequired ? "*" : ""}
        </label>
        <Textarea
          rows={4}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Decision rationale..."
        />
      </div>

      <ActionButton
        tone="primary"
        disabled={!canSubmit || decideMutation.isPending}
        onClick={() => {
          decideMutation.mutate(
            {
              seriesId,
              body: {
                decision,
                note: note.trim() || undefined,
                publicationType: decision === "RESCHEDULE" ? publicationType : undefined,
              },
            },
            {
              onSuccess: () => toast.success("At-risk decision recorded."),
              onError: (error) =>
                toast.error(error instanceof Error ? error.message : "Decision failed."),
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
