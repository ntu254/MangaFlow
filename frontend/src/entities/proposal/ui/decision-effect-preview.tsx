import type { SeriesProposal } from "@/entities/proposal/model/proposal-types";
import { decisionEffect } from "@/entities/proposal/model/decision-effect";

export function DecisionEffectPreview({
  proposal,
  decision,
}: {
  proposal: SeriesProposal;
  decision?: "APPROVE" | "REJECT";
}) {
  if (!decision) return null;

  const isApprove = decision === "APPROVE";

  return (
    <div
      className={`rounded-xl border p-3 text-xs space-y-0.5 transition-all ${
        isApprove
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"
          : "border-rose-500/30 bg-rose-500/10 text-rose-800 dark:text-rose-300"
      }`}
    >
      <p className="text-[10px] font-bold uppercase tracking-wider opacity-80">
        Decision Impact
      </p>
      <p className="font-medium leading-relaxed">{decisionEffect(proposal, decision)}</p>
    </div>
  );
}
