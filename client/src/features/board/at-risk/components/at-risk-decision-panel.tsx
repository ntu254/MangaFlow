import { useState } from "react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { ActionButton, Panel, StateBlock } from "@/shared/ui";
import type { AtRiskReport } from "../../api/board-queries";
import { useAtRiskDecisionMutation } from "../../api/board-queries";

const DECISIONS = [
  { value: "CONTINUE", label: "Continue" },
  { value: "RESCHEDULE", label: "Reschedule" },
  { value: "HIATUS", label: "Hiatus" },
  { value: "CANCELLED", label: "Cancelled" },
] as const;

type Decision = (typeof DECISIONS)[number]["value"];

export function AtRiskDecisionPanel({
  seriesId,
  report,
}: {
  seriesId: string;
  report?: AtRiskReport | null;
}) {
  const decideMutation = useAtRiskDecisionMutation();
  const [decision, setDecision] = useState<Decision>("CONTINUE");
  const [publicationType, setPublicationType] = useState<"WEEKLY" | "MONTHLY">("MONTHLY");
  const [note, setNote] = useState("");
  const hasReport = Boolean(report);
  const canSubmit = hasReport && (!["HIATUS", "CANCELLED"].includes(decision) || note.trim());

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
        {DECISIONS.map((item) => (
          <button
            key={item.value}
            type="button"
            disabled={!hasReport}
            onClick={() => setDecision(item.value)}
            className={`h-10 rounded-[5px] border px-3 text-[12px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
              decision === item.value
                ? "border-[var(--admin-navy)] bg-[var(--admin-navy)] text-[var(--admin-cream)]"
                : "border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-ink)] hover:bg-[var(--admin-hover)]"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {decision === "RESCHEDULE" ? (
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-[var(--admin-muted)]">
            Publication type
          </label>
          <div className="grid grid-cols-2 gap-2">
            {(["WEEKLY", "MONTHLY"] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setPublicationType(type)}
                className={`rounded border px-3 py-2 text-xs font-semibold ${
                  publicationType === type
                    ? "border-[var(--admin-navy)] bg-[var(--admin-navy)] text-[var(--admin-cream)]"
                    : "border-[var(--admin-border)] bg-[var(--admin-surface)]"
                }`}
              >
                {type === "WEEKLY" ? "Weekly" : "Monthly"}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div>
        <label className="mb-1 block text-[11px] font-semibold text-[var(--admin-muted)]">
          Decision note {["HIATUS", "CANCELLED"].includes(decision) ? "*" : ""}
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
