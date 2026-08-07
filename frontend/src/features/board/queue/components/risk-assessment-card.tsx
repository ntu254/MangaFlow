import type { SeriesProposal } from "@/entities/proposal/model/proposal-types";
import { AlertTriangle, ShieldCheck } from "lucide-react";

export function RiskAssessmentCard({ proposal }: { proposal: SeriesProposal }) {
  const revisionCount = proposal.requestedChanges.length;
  const risk = revisionCount > 0 ? "MEDIUM" : "LOW";
  const isMedium = risk === "MEDIUM";

  return (
    <div
      className={`rounded-xl border p-4 space-y-2 ${
        isMedium
          ? "border-amber-500/30 bg-amber-500/10 text-amber-950 dark:text-amber-200"
          : "border-emerald-500/30 bg-emerald-500/10 text-emerald-950 dark:text-emerald-200"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-semibold">
          {isMedium ? (
            <AlertTriangle className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
          ) : (
            <ShieldCheck className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          )}
          <span>Governance Risk Assessment</span>
        </div>
        <span
          className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
            isMedium
              ? "bg-amber-500/20 text-amber-800 dark:text-amber-300"
              : "bg-emerald-500/20 text-emerald-800 dark:text-emerald-300"
          }`}
        >
          {risk} RISK
        </span>
      </div>
      <p className="text-xs leading-relaxed">
        {isMedium
          ? "Revision history exists on this proposal. Board members should inspect previous requested changes before voting."
          : "No major governance or editorial risk detected for this proposal package."}
      </p>
    </div>
  );
}

