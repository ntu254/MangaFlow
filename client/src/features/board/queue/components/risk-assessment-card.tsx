import type { SeriesProposal } from "@/entities/proposal/model/proposal-types";

export function RiskAssessmentCard({ proposal }: { proposal: SeriesProposal }) {
  const revisionCount = proposal.requestedChanges.length;
  const risk = proposal.status === "TIE_BREAK" ? "HIGH" : revisionCount > 0 ? "MEDIUM" : "LOW";
  const tone =
    risk === "HIGH"
      ? "border-rose-300 bg-rose-50 text-rose-950"
      : risk === "MEDIUM"
        ? "border-amber-300 bg-amber-50 text-amber-950"
        : "border-emerald-300 bg-emerald-50 text-emerald-950";

  return (
    <section className={`rounded-md border p-4 ${tone}`}>
      <p className="text-[10px] font-bold uppercase tracking-widest">Risk Assessment</p>
      <p className="mt-2 font-serif text-2xl">{risk}</p>
      <p className="mt-1 text-xs">
        {risk === "HIGH"
          ? "Tie-break or governance disagreement requires focused discussion."
          : risk === "MEDIUM"
            ? "Revision history exists; Board should inspect editorial notes."
            : "No major governance risk detected for this proposal."}
      </p>
    </section>
  );
}
