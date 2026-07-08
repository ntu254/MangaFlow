import type { SeriesProposal } from "@/entities/proposal/model/proposal-types";
import { decisionEffect } from "@/entities/proposal/model/decision-effect";

export function DecisionEffectPreview({
  proposal,
  decision,
}: {
  proposal: SeriesProposal;
  decision?: "APPROVE" | "REJECT" | "NEEDS_REVISION" | "ABSTAIN";
}) {
  return (
    <div className="rounded-md border border-border bg-background p-3 text-xs">
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        Decision Effect Preview
      </p>
      <p className="mt-2 text-foreground/80">{decisionEffect(proposal, decision)}</p>
    </div>
  );
}
