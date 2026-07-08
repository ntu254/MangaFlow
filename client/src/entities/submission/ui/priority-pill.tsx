import type { ReviewPriority } from "@/entities/submission/model/review-types";

const MAP: Record<ReviewPriority, string> = {
  BLOCKING: "bg-rose-100 text-rose-900 ring-1 ring-rose-200",
  HIGH: "bg-orange-100 text-orange-900 ring-1 ring-orange-200",
  MED: "bg-amber-100 text-amber-900 ring-1 ring-amber-200",
  LOW: "bg-zinc-100 text-zinc-700 ring-1 ring-zinc-200",
};
const LABEL: Record<ReviewPriority, string> = {
  BLOCKING: "Blocking",
  HIGH: "High",
  MED: "Med",
  LOW: "Low",
};

export function PriorityPill({ p }: { p: ReviewPriority }) {
  return (
    <span
      className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${MAP[p]}`}
    >
      {LABEL[p]}
    </span>
  );
}
