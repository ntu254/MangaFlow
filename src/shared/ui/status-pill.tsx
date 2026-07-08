import { cn } from "@/shared/lib/cn";

const VARIANTS: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  submitted: "bg-amber-100 text-amber-900",
  in_progress: "bg-blue-100 text-blue-900",
  todo: "bg-secondary text-secondary-foreground",
  revision_requested: "bg-orange-100 text-orange-900",
  mangaka_approved: "bg-emerald-50 text-emerald-800",
  editor_approved: "bg-emerald-100 text-emerald-900",
  rejected: "bg-rose-100 text-rose-900",
  cancelled: "bg-zinc-200 text-zinc-700",
  approved: "bg-emerald-100 text-emerald-900",
  ready: "bg-emerald-100 text-emerald-900",
  published: "bg-[var(--accent)] text-[var(--accent-foreground)]",
  scheduled: "bg-indigo-100 text-indigo-900",
  ongoing: "bg-emerald-100 text-emerald-900",
  at_risk: "bg-amber-100 text-amber-900",
  completed: "bg-zinc-200 text-zinc-800",
  paid: "bg-emerald-100 text-emerald-900",
  confirmed: "bg-blue-100 text-blue-900",
  pending: "bg-amber-100 text-amber-900",
  voided: "bg-zinc-200 text-zinc-700",
  active: "bg-emerald-100 text-emerald-900",
  locked: "bg-rose-100 text-rose-900",
};

const LABELS: Record<string, string> = {
  draft: "Draft",
  submitted: "Submitted",
  in_progress: "In progress",
  todo: "To do",
  revision_requested: "Revision requested",
  mangaka_approved: "Approved by Mangaka",
  editor_approved: "Approved by Editor",
  pending_editor: "Waiting for Editor",
  pending_board: "Waiting for Board",
  changes_requested: "Changes requested",
  rejected: "Rejected",
  cancelled: "Cancelled",
  approved: "Approved",
  ready: "Ready",
  published: "Published",
  scheduled: "Scheduled",
  ongoing: "Ongoing",
  at_risk: "At risk",
  completed: "Completed",
  paid: "Paid",
  confirmed: "Confirmed",
  pending: "Pending",
  voided: "Voided",
  active: "Active",
  locked: "Locked",
};

export function StatusPill({ status, className }: { status: string; className?: string }) {
  const key = status.toLowerCase();
  const variant = VARIANTS[key] ?? "bg-muted text-muted-foreground";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
        variant,
        className,
      )}
    >
      {LABELS[key] ?? key.replace(/_/g, " ")}
    </span>
  );
}
