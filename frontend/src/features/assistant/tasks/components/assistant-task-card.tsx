import type { Chapter, ProductionSeries } from "@/entities/series/model/series-types";
import type { StudioTask } from "@/entities/series/model/studio-types";
import { REGION_TYPE_LABEL } from "@/entities/series/model/studio-types";
import type { AssistantSubmission } from "@/entities/submission/model/assistant-types";
import { SUBMISSION_STATUS_LABEL } from "@/entities/submission/model/assistant-types";
import {
  buildTaskContext,
  deadlineRisk,
  isTaskOverdue,
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
  latestSubmission,
  onSelect,
}: {
  task: StudioTask;
  chapters: Chapter[];
  seriesList: ProductionSeries[];
  latestSubmission?: AssistantSubmission;
  onSelect: () => void;
}) {
  const ctx = buildTaskContext(task, chapters, seriesList);
  const risk = deadlineRisk(task.dueAt);
  const action = primaryActionForTaskStatus(task.status);
  const overdue = isTaskOverdue(task);
  const awaitingAcceptance = task.assignmentStatus === "PENDING";

  return (
    <Surface
      onClick={onSelect}
      className={`flex cursor-pointer flex-col gap-2 p-3.5 transition-colors hover:border-[var(--admin-navy)]/35 hover:bg-[var(--admin-hover)] ${
        overdue ? "border-rose-300/70 bg-rose-50/40" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="line-clamp-2 text-[13px] font-semibold leading-snug">{task.title}</p>
        {overdue ? (
          <span className="shrink-0 rounded border border-rose-300 bg-rose-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-rose-900">
            Overdue
          </span>
        ) : null}
      </div>
      <p className="truncate text-[11px] font-semibold text-foreground/80">
        {ctx.series?.title ?? "Unknown series"}
      </p>
      <p className="text-[11px] font-medium text-muted-foreground">
        Ch.{" "}
        <span className="font-mono font-semibold text-foreground/70">
          {ctx.chapter?.number ?? "—"}
        </span>
        {" · "}Page{" "}
        <span className="font-mono font-semibold text-foreground/70">
          {String(ctx.pageIndex ?? 0).padStart(2, "0")}
        </span>
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
          className={`ml-auto rounded px-1.5 py-0.5 font-semibold ${
            overdue
              ? "bg-rose-100 text-rose-900"
              : risk.tone === "amber"
                ? "bg-amber-100 text-amber-900"
                : "bg-emerald-100 text-emerald-900"
          }`}
        >
          {formatDate(task.dueAt)}
          {overdue ? null : <> · {risk.label}</>}
        </span>
      </div>

      {awaitingAcceptance ? (
        <span className="rounded border border-amber-300 bg-amber-50 px-1.5 py-1 text-[10px] font-semibold text-amber-900">
          Awaiting your acceptance
        </span>
      ) : null}

      {latestSubmission ? (
        <span
          title={SUBMISSION_STATUS_LABEL[latestSubmission.status]}
          className="w-fit rounded bg-background px-1.5 py-0.5 font-mono text-[10px] font-semibold text-muted-foreground"
        >
          {latestSubmission.versionLabel}
        </span>
      ) : null}

      <div className="mt-1 flex items-center gap-2">
        <OpenTaskStudioAction
          task={task}
          onClick={(e) => e.stopPropagation()}
          className="inline-flex h-8 flex-1 items-center justify-center rounded-[5px] bg-[var(--admin-navy)] px-3 text-[10px] font-semibold text-[var(--admin-cream)] hover:bg-[var(--admin-navy-light)] disabled:opacity-60"
        >
          {TASK_ACTION_LABEL[action]}
        </OpenTaskStudioAction>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
          title="Task details"
          aria-label="Open task details"
          className="grid size-8 place-items-center rounded-[5px] border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-muted)] hover:bg-[var(--admin-hover)]"
        >
          <MoreHorizontal className="size-4" />
        </button>
      </div>
    </Surface>
  );
}
