import type { DeadlineRisk } from "@/entities/submission/model/review-types";

const MAP: Record<DeadlineRisk["tone"], string> = {
  rose: "bg-rose-100 text-rose-900",
  amber: "bg-amber-100 text-amber-900",
  emerald: "bg-emerald-100 text-emerald-900",
  neutral: "bg-muted text-muted-foreground",
};

export function DeadlineRiskPill({ risk }: { risk: DeadlineRisk }) {
  return (
    <span
      className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${MAP[risk.tone]}`}
    >
      {risk.label}
    </span>
  );
}
