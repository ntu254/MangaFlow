import type { SeriesProposal } from "@/entities/proposal/model/proposal-types";
import { UserCheck } from "lucide-react";

export function EditorRecommendationCard({ proposal }: { proposal: SeriesProposal }) {
  const forwarded = [...proposal.history].reverse().find((event) => event.type === "FORWARD");
  return (
    <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-2">
      <div className="flex items-center gap-2 text-xs font-semibold text-primary">
        <UserCheck className="size-4 shrink-0" />
        <span>Editor Evaluation & Recommendation</span>
      </div>
      <p className="text-xs leading-relaxed text-foreground italic bg-background/60 p-3 rounded-lg border border-border/50">
        "{forwarded?.comment ??
          "Editor marked this proposal ready for Board review based on concept clarity, serialization fit, and production feasibility."}"
      </p>
      <div className="text-[11px] text-muted-foreground flex items-center justify-between">
        <span>Assigned Editor: <strong className="text-foreground">{proposal.assignedEditorName ?? proposal.claimedByEditorName ?? "Unassigned"}</strong></span>
      </div>
    </div>
  );
}

