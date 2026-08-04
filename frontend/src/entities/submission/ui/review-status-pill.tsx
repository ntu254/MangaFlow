const MAP: Record<string, string> = {
  PENDING_EDITOR: "bg-amber-100 text-amber-900",
  CHANGES_REQUESTED: "bg-orange-100 text-orange-900",
  PENDING_BOARD: "bg-blue-100 text-blue-900",
  MANGAKA_APPROVED: "bg-blue-100 text-blue-900",
  REJECTED: "bg-rose-100 text-rose-900",
  REVISION_REQUESTED: "bg-orange-100 text-orange-900",
};

const LABEL: Record<string, string> = {
  PENDING_EDITOR: "Pending Editor",
  CHANGES_REQUESTED: "Changes Requested",
  PENDING_BOARD: "Pending Board",
  MANGAKA_APPROVED: "Mangaka Approved",
  REJECTED: "Rejected",
  WITHDRAWN: "Withdrawn",
  REVISION_REQUESTED: "Revision Requested",
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
