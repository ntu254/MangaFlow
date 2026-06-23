import type { ChapterStatus, SeriesStatus } from "@/entities";

const STATUS_MAP: Record<
  string,
  {
    tone:
      | "neutral"
      | "success"
      | "warn"
      | "danger"
      | "info"
      | "teal"
      | "slate"
      | "sky"
      | "purple"
      | "blue"
      | "orange";
    label: string;
  }
> = {
  draft: { tone: "slate", label: "Draft" },
  "editor-review": { tone: "blue", label: "Editor Review" },
  "revision-requested": { tone: "warn", label: "Needs Revision" },
  "board-review": { tone: "purple", label: "Board Review" },
  approved: { tone: "success", label: "Approved" },
  "in-production": { tone: "teal", label: "In Production" },
  "ready-for-publication": { tone: "purple", label: "Ready for Publication" },
  "ready-for-editor": { tone: "blue", label: "Ready for Editor" },
  archived: { tone: "slate", label: "Archived" },
  scheduled: { tone: "info", label: "Scheduled" },
  published: { tone: "success", label: "Published" },
  rejected: { tone: "danger", label: "Rejected" },
  ongoing: { tone: "teal", label: "In Production" },
  "at-risk": { tone: "orange", label: "At Risk" },
  completed: { tone: "slate", label: "Completed" },
  cancelled: { tone: "danger", label: "Cancelled" },
  ready: { tone: "info", label: "Ready" },

  pending: { tone: "warn", label: "Pending" },
  confirmed: { tone: "info", label: "Confirmed" },
  paid: { tone: "success", label: "Paid" },
  assigned: { tone: "neutral", label: "Assigned" },
  todo: { tone: "neutral", label: "To do" },
  "in-progress": { tone: "info", label: "In progress" },
  submitted: { tone: "warn", label: "Waiting review" },
  "mangaka-approved": { tone: "teal", label: "Mangaka approved" },
  "editor-approved": { tone: "success", label: "Editor approved" },
  calculated: { tone: "warn", label: "Calculated" },
  voided: { tone: "slate", label: "Voided" },
  open: { tone: "info", label: "Open" },
  closed: { tone: "neutral", label: "Closed" },
};

const TONE_CLASS = {
  neutral: "bg-foreground/40",
  success: "bg-emerald-500",
  warn: "bg-amber-500",
  danger: "bg-destructive",
  info: "bg-sky-500",
  teal: "bg-teal-500",
  slate: "bg-slate-400",
  sky: "bg-sky-500",
  purple: "bg-purple-500",
  blue: "bg-blue-600",
  orange: "bg-orange-500",
} as const;

export function StatusBadge({
  status,
  variant = "dot",
}: {
  status: ChapterStatus | SeriesStatus | string;
  variant?: "dot" | "solid";
}) {
  const normalizedStatus = String(status).toLowerCase().replace(/_/g, "-");
  const m = STATUS_MAP[normalizedStatus] ?? { tone: "neutral" as const, label: status };

  if (variant === "solid") {
    return (
      <span
        className={`inline-flex items-center justify-center rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm ${TONE_CLASS[m.tone]}`}
      >
        {m.label}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded border border-foreground/15 bg-foreground/5 px-2 py-0.5 text-[11px] font-medium text-foreground/80">
      <span className={`h-1.5 w-1.5 rounded-full ${TONE_CLASS[m.tone]}`} />
      {m.label}
    </span>
  );
}
