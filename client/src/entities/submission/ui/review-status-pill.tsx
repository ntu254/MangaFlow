const MAP: Record<string, string> = {
  PENDING_EDITOR: "bg-amber-100 text-amber-900",
  CHANGES_REQUESTED: "bg-orange-100 text-orange-900",
  PENDING_BOARD: "bg-blue-100 text-blue-900",
  APPROVED: "bg-emerald-100 text-emerald-900",
  MANGAKA_APPROVED: "bg-blue-100 text-blue-900",
  EDITOR_APPROVED: "bg-emerald-200 text-emerald-900",
  REJECTED: "bg-rose-100 text-rose-900",
  REVISION: "bg-orange-100 text-orange-900",
  DRAFTING: "bg-violet-100 text-violet-900",
  SCHEDULED: "bg-indigo-100 text-indigo-900",
  PUBLISHED: "bg-emerald-200 text-emerald-900",
  SUBMITTED: "bg-cyan-100 text-cyan-900",
  DRAFT: "bg-zinc-200 text-zinc-800",
};

const LABEL: Record<string, string> = {
  PENDING_EDITOR: "Pending Editor",
  CHANGES_REQUESTED: "Changes Requested",
  PENDING_BOARD: "Pending Board",
  MANGAKA_APPROVED: "Mangaka Approved",
  EDITOR_APPROVED: "Editor Approved",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  WITHDRAWN: "Withdrawn",
  REVISION: "Revision",
  DRAFTING: "Drafting",
  SCHEDULED: "Scheduled",
  PUBLISHED: "Published",
  SUBMITTED: "Submitted",
  DRAFT: "Draft",
};

export function ReviewStatusPill({ status }: { status: string }) {
  const cls = MAP[status] ?? "bg-muted text-muted-foreground";
  return (
    <span
      className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${cls}`}
    >
      {LABEL[status] ?? status.replace(/_/g, " ")}
    </span>
  );
}
