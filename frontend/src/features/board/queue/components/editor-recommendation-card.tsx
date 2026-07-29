import type { SeriesProposal } from "@/entities/proposal/model/proposal-types";

export function EditorRecommendationCard({ proposal }: { proposal: SeriesProposal }) {
  const forwarded = [...proposal.history].reverse().find((event) => event.type === "FORWARD");
  return (
    <section className="rounded-md border border-border bg-card p-4">
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        Editor Recommendation
      </p>
      <p className="mt-2 text-sm text-foreground/80">
        {forwarded?.comment ??
          "Editor marked this proposal ready for Board review based on concept clarity, serialization fit, and production feasibility."}
      </p>
      <p className="mt-3 text-xs text-muted-foreground">
        Editor: {proposal.assignedEditorName ?? "Unassigned"}
      </p>
    </section>
  );
}
