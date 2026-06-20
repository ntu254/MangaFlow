import { Link } from "@tanstack/react-router";
import type { Task } from "@/entities";
import { findChapter, findSeries, findStaff } from "@/entities";
import { StatusBadge } from "@/shared/ui/site/StatusBadge";
import { deadlineClass, deadlineLabel, deadlineTone } from "@/features/tasks/lib/deadline";
import { ctaFor, normalizeStatus } from "../lib/taskLifecycle";
import { ArrowRight } from "lucide-react";

const INTENT_CLS: Record<string, string> = {
  primary:
    "bg-primary text-primary-foreground hover:bg-primary/90 border border-transparent",
  destructive:
    "bg-destructive text-destructive-foreground hover:bg-destructive/90 border border-transparent",
  neutral:
    "bg-background text-foreground border border-foreground/15 hover:border-foreground/30 hover:bg-muted",
  disabled:
    "bg-muted text-foreground/40 border border-foreground/10 cursor-not-allowed",
};

export function AssistantTaskCard({ task }: { task: Task }) {
  const ch = findChapter(task.chapterId);
  const series = ch ? findSeries(ch.seriesId) : null;
  const tone = deadlineTone(task.deadline);
  const cta = ctaFor(task.status);
  const normalized = normalizeStatus(task.status);
  const assignedBy = task.assignedById ? findStaff(task.assignedById) : null;
  const disabled = cta.intent === "disabled";

  const body = (
    <div className="rounded-md border border-foreground/10 bg-background p-3 transition hover:border-foreground/25 hover:bg-card">
      <div className="flex items-center justify-between gap-2">
        <StatusBadge status={normalized} />
        <span className={`text-[11px] tabular-nums ${deadlineClass(tone)}`}>
          {deadlineLabel(task.deadline, tone)}
        </span>
      </div>

      <div className="mt-2 text-[13px] font-medium text-foreground line-clamp-1">
        {task.title ?? `${task.type} pass`}
      </div>
      <div className="mt-0.5 text-[12px] text-foreground/60 line-clamp-1">
        {series?.title ?? "—"} · {ch?.number ?? "—"} · {task.pageRange}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <span className="inline-flex items-center rounded border border-foreground/10 bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-foreground/70">
          {task.type}
        </span>
        {task.priority && task.priority === "high" && (
          <span className="inline-flex items-center rounded border border-destructive/30 bg-destructive/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-destructive">
            High priority
          </span>
        )}
        {task.currentVersion ? (
          <span className="text-[11px] text-foreground/55">v{task.currentVersion}</span>
        ) : null}
        {assignedBy && (
          <span className="ml-auto text-[11px] text-foreground/55">
            from {assignedBy.name.split(" ")[0]}
          </span>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between gap-2 border-t border-foreground/10 pt-2.5">
        <div className="text-[11px] text-foreground/55">
          {normalized === "revision-requested"
            ? "Open feedback in Task Studio"
            : normalized === "mangaka-approved"
              ? "Waiting Editor final review"
              : normalized === "submitted"
                ? "Mangaka is reviewing"
                : normalized === "editor-approved"
                  ? "Earnings calculated"
                  : "Open in Task Studio"}
        </div>
        <span
          className={`inline-flex h-7 items-center gap-1 rounded-md px-2.5 text-[11px] font-medium transition ${
            INTENT_CLS[cta.intent]
          }`}
        >
          {cta.label}
          {!disabled && <ArrowRight className="h-3 w-3" />}
        </span>
      </div>
    </div>
  );

  if (disabled) {
    return <div className="block">{body}</div>;
  }

  return (
    <Link
      to="/app/assistant/tasks/$taskId/studio"
      params={{ taskId: task.id }}
      className="block"
    >
      {body}
    </Link>
  );
}
