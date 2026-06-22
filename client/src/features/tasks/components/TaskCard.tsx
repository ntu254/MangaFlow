import { Link } from "@tanstack/react-router";
import { findChapter, findSeries, findStaff, type Task } from "@/entities";
import { StatusBadge } from "@/shared/ui/site/StatusBadge";
import { jpy } from "@/shared/lib/format";
import { deadlineClass, deadlineLabel, deadlineTone } from "../lib/deadline";
import { statusHint } from "../lib/assistantTaskStatus";

export function TaskCard({
  task,
  showPayout,
  showAssignee,
}: {
  task: Task;
  showPayout: boolean;
  showAssignee: boolean;
}) {
  const ch = findChapter(task.chapterId);
  const series = ch ? findSeries(ch.seriesId) : null;
  const assignee = findStaff(task.assigneeId);
  const tone = deadlineTone(task.deadline);
  const hint = statusHint(task.status);
  const pageId = task.pageId;

  const content = (
    <>
      <div className="flex items-center justify-between gap-2">
        <StatusBadge status={task.status} />
        <span className={`text-[11px] tabular-nums ${deadlineClass(tone)}`}>
          {deadlineLabel(task.deadline, tone)}
        </span>
      </div>

      <div className="mt-2 text-[13px] font-medium text-foreground line-clamp-1">
        {series?.title ?? "—"}
      </div>
      <div className="mt-0.5 text-[12px] text-foreground/60">
        {ch?.number ?? "—"} · {task.pageRange}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <span className="inline-flex items-center rounded border border-foreground/10 bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-foreground/70">
          {task.type}
        </span>
        {showAssignee && assignee && (
          <span className="text-[11px] text-foreground/55">{assignee.name}</span>
        )}
        {showPayout && (
          <span className="ml-auto text-[11px] tabular-nums text-foreground/60">
            {jpy(task.payout)}
          </span>
        )}
      </div>

      {hint && (
        <div
          className={`mt-2 border-t border-foreground/10 pt-2 text-[11px] ${
            task.status === "rejected" ? "text-destructive" : "text-foreground/55"
          }`}
        >
          {hint}
        </div>
      )}
    </>
  );

  const className =
    "group flex flex-col rounded-md border border-foreground/10 bg-card p-3 shadow-sm transition-all hover:border-foreground/20 hover:shadow";

  if (!pageId) {
    return (
      <div className={`${className} cursor-default opacity-80`}>
        {content}
        <div className="mt-2 rounded border border-foreground/10 bg-muted px-2 py-1 text-[11px] text-foreground/50">
          No page is linked to this task yet.
        </div>
      </div>
    );
  }

  return (
    <Link
      to="/app/pages/$id/studio"
      params={{ id: pageId }}
      search={(prev: { seriesId?: string }) => ({ seriesId: prev?.seriesId ?? task.seriesId })}
      className={className}
    >
      {content}
    </Link>
  );
}
