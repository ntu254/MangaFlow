import type { Chapter, ProductionSeries } from "@/entities/series/model/series-types";
import type { StudioTask } from "@/entities/series/model/studio-types";
import { REGION_TYPE_LABEL } from "@/entities/series/model/studio-types";
import {
  buildTaskContext,
  deadlineRisk,
  getTaskEdgeSummary,
  getTaskStatusLabel,
  getVisualTaskStatus,
  getVisualTaskStatusClass,
  priorityBadge,
  priorityLabel,
} from "@/entities/task";
import {
  primaryActionForTaskStatus,
  TASK_ACTION_LABEL,
} from "@/entities/task/model/assistant-types";
import { formatDate } from "@/shared/lib/format-date";
import { Surface } from "@/shared/ui";
import { MoreHorizontal } from "lucide-react";
import { OpenTaskStudioAction } from "./open-task-studio-action";

export function AssistantTaskCard({
  task,
  chapters,
  seriesList,
  latestFeedback,
  onSelect,
}: {
  task: StudioTask;
  chapters: Chapter[];
  seriesList: ProductionSeries[];
  latestFeedback?: string;
  onSelect: () => void;
}) {
  const ctx = buildTaskContext(task, chapters, seriesList);
  const risk = deadlineRisk(task.dueAt);
  const action = primaryActionForTaskStatus(task.status);
  const visualStatus = getVisualTaskStatus(task);
  const edgeSummary = getTaskEdgeSummary(task);

  return (
    <Surface
      onClick={onSelect}
      className="flex cursor-pointer flex-col gap-2 p-4 transition-colors hover:border-[var(--admin-navy)]/35 hover:bg-[var(--admin-hover)]"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-sm font-semibold">{task.title}</p>
          {edgeSummary ? <p className="text-[10px] text-accent mt-0.5">{edgeSummary}</p> : null}
        </div>
        <span
          className={`shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${getVisualTaskStatusClass(visualStatus)}`}
        >
          {getTaskStatusLabel(visualStatus)}
        </span>
      </div>
      <p className="text-[11px] text-muted-foreground">
        {ctx.series?.title ?? "—"} · Ch.{ctx.chapter?.number ?? "—"} · P.
        {String(ctx.pageIndex ?? 0).padStart(2, "0")}
      </p>
      <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
        <span className="rounded bg-muted px-1.5 py-0.5 font-semibold text-muted-foreground">
          {REGION_TYPE_LABEL[task.type]}
        </span>
        <span
          className={`rounded px-1.5 py-0.5 font-bold uppercase ${priorityBadge(task.priority)}`}
        >
          {priorityLabel(task.priority)}
        </span>
        <span
          className={`ml-auto rounded px-1.5 py-0.5 font-bold uppercase ${
            risk.tone === "rose"
              ? "bg-rose-100 text-rose-900"
              : risk.tone === "amber"
                ? "bg-amber-100 text-amber-900"
                : "bg-emerald-100 text-emerald-900"
          }`}
        >
          {formatDate(task.dueAt)} · {risk.label}
        </span>
      </div>
      {latestFeedback ? (
        <p className="line-clamp-2 rounded border border-orange-200 bg-orange-50 px-2 py-1.5 text-[11px] text-orange-900">
          {latestFeedback}
        </p>
      ) : null}
      <div className="mt-1 flex items-center gap-2">
        <OpenTaskStudioAction
          task={task}
          onClick={(e) => e.stopPropagation()}
          className="inline-flex h-9 flex-1 items-center justify-center rounded-[5px] bg-[var(--admin-navy)] px-3 text-[11px] font-semibold text-[var(--admin-cream)] hover:bg-[var(--admin-navy-light)] disabled:opacity-60"
        >
          {visualStatus === "CANCELLED" ? "View only" : TASK_ACTION_LABEL[action]}
        </OpenTaskStudioAction>
        <button
          type="button"
          onClick={onSelect}
          title="Task details"
          aria-label="Open task details"
          className="grid size-9 place-items-center rounded-[5px] border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-muted)] hover:bg-[var(--admin-hover)]"
        >
          <MoreHorizontal className="size-4" />
        </button>
      </div>
    </Surface>
  );
}
