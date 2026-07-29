import { cn } from "@/shared/lib/cn";

// Editorial tokens only. Semantic families reuse the existing role/accent
// palette so status colour stays on-system (no raw Tailwind, no parallel token
// set): success → editor-green, warning → board-gold, info → assistant-teal,
// danger → destructive, attention → crimson accent, scheduled → mangaka-purple,
// neutral → muted.
const SUCCESS = "bg-[var(--role-editor)]/12 text-[var(--role-editor)]";
const WARNING = "bg-[var(--role-board)]/12 text-[var(--role-board)]";
const INFO = "bg-[var(--role-assistant)]/12 text-[var(--role-assistant)]";
const DANGER = "bg-destructive/10 text-destructive";
const ATTENTION = "bg-accent/10 text-accent";
const SCHEDULED = "bg-[var(--role-mangaka)]/12 text-[var(--role-mangaka)]";
const NEUTRAL = "bg-muted text-muted-foreground";

const VARIANTS: Record<string, string> = {
  draft: NEUTRAL,
  submitted: WARNING,
  in_progress: INFO,
  todo: "bg-secondary text-secondary-foreground",
  revision_requested: ATTENTION,
  mangaka_approved: SUCCESS,
  editor_approved: SUCCESS,
  rejected: DANGER,
  cancelled: NEUTRAL,
  approved: SUCCESS,
  ready: SUCCESS,
  published: "bg-[var(--accent)] text-[var(--accent-foreground)]",
  scheduled: SCHEDULED,
  ongoing: SUCCESS,
  at_risk: WARNING,
  completed: NEUTRAL,
  paid: SUCCESS,
  confirmed: INFO,
  pending: WARNING,
  voided: NEUTRAL,
  active: SUCCESS,
  locked: DANGER,
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
