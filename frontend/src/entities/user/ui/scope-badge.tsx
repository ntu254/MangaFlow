import { SCOPE_LABEL, type AccessScope } from "@/entities/access/model/access-labels";

const SCOPE_CLASS: Record<AccessScope, string> = {
  OWNER: "border-emerald-300 bg-emerald-50 text-emerald-900",
  FULL_SERIES: "border-blue-300 bg-blue-50 text-blue-900",
  ASSIGNED_SERIES: "border-indigo-300 bg-indigo-50 text-indigo-900",
  EDITORIAL_QUEUE: "border-slate-300 bg-slate-50 text-slate-900",
  CHAPTER_SCOPE: "border-sky-300 bg-sky-50 text-sky-900",
  TASK_ONLY: "border-amber-300 bg-amber-50 text-amber-900",
  BOARD_REVIEW_ONLY: "border-fuchsia-300 bg-fuchsia-50 text-fuchsia-900",
  READ_ONLY: "border-zinc-300 bg-zinc-50 text-zinc-800",
  GLOBAL: "border-rose-300 bg-rose-50 text-rose-900",
};

export function ScopeBadge({ scope }: { scope: AccessScope }) {
  return (
    <span
      className={`inline-flex rounded border px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${SCOPE_CLASS[scope]}`}
    >
      {SCOPE_LABEL[scope]}
    </span>
  );
}
