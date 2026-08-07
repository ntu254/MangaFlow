import { useMemo, useState } from "react";
import { ChevronDown, Eye, EyeOff } from "lucide-react";
import type { Chapter, ProductionSeries } from "@/entities/series/model/series-types";
import type { StudioTask, StudioTaskStatus } from "@/entities/series/model/studio-types";
import type { AssistantSubmission } from "@/entities/submission/model/assistant-types";
import { AssistantTaskCard } from "./assistant-task-card";

export type BoardColumnKey = "TODO" | "IN_PROGRESS" | "SUBMITTED" | "REVISION_REQUESTED" | "DONE";

const COLUMNS: {
  key: BoardColumnKey;
  label: string;
  statuses: StudioTaskStatus[];
  dot: string;
}[] = [
  {
    key: "TODO",
    label: "To do",
    statuses: ["TODO"],
    dot: "bg-zinc-400",
  },
  {
    key: "IN_PROGRESS",
    label: "In progress",
    statuses: ["IN_PROGRESS"],
    dot: "bg-amber-500",
  },
  {
    key: "SUBMITTED",
    label: "Submitted",
    statuses: ["SUBMITTED"],
    dot: "bg-sky-500",
  },
  {
    key: "REVISION_REQUESTED",
    label: "Revision",
    statuses: ["REVISION_REQUESTED"],
    dot: "bg-orange-500",
  },
  {
    key: "DONE",
    label: "Done",
    statuses: ["MANGAKA_APPROVED", "EDITOR_APPROVED", "COMPLETED"],
    dot: "bg-emerald-500",
  },
];

const INACTIVE_STATUSES: StudioTaskStatus[] = ["REJECTED", "CANCELLED"];

function columnFor(task: StudioTask): BoardColumnKey | "INACTIVE" {
  if (task.reassigned || task.reassignedAt) return "INACTIVE";
  const column = COLUMNS.find((c) => c.statuses.includes(task.status));
  return column?.key ?? (INACTIVE_STATUSES.includes(task.status) ? "INACTIVE" : "TODO");
}

const PRIORITY_ORDER: Record<string, number> = { high: 3, normal: 2, low: 1 };

function compareTasks(left: StudioTask, right: StudioTask) {
  const dueDiff =
    (left.dueAt ? new Date(left.dueAt).getTime() : Number.POSITIVE_INFINITY) -
    (right.dueAt ? new Date(right.dueAt).getTime() : Number.POSITIVE_INFINITY);
  if (dueDiff !== 0) return dueDiff;
  return (PRIORITY_ORDER[right.priority] ?? 0) - (PRIORITY_ORDER[left.priority] ?? 0);
}

export function AssistantTaskBoard({
  tasks,
  chapters,
  seriesList,
  latestSubmissionByTask,
  hiddenColumns,
  onToggleColumn,
  onSelect,
}: {
  tasks: StudioTask[];
  chapters: Chapter[];
  seriesList: ProductionSeries[];
  latestSubmissionByTask: Map<string, AssistantSubmission>;
  hiddenColumns: Set<BoardColumnKey>;
  onToggleColumn: (key: BoardColumnKey) => void;
  onSelect: (taskId: string) => void;
}) {
  const [showInactive, setShowInactive] = useState(false);

  const buckets = useMemo(() => {
    const byColumn = new Map<BoardColumnKey, StudioTask[]>();
    for (const column of COLUMNS) byColumn.set(column.key, []);
    const inactive: StudioTask[] = [];
    for (const task of tasks) {
      const bucket = columnFor(task);
      if (bucket === "INACTIVE") inactive.push(task);
      else byColumn.get(bucket)?.push(task);
    }
    for (const column of COLUMNS) {
      byColumn.get(column.key)?.sort(compareTasks);
    }
    inactive.sort(compareTasks);
    return { byColumn, inactive };
  }, [tasks]);

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto pb-2">
        <div className="flex min-w-max gap-3">
          {COLUMNS.map((column) => {
            const columnTasks = buckets.byColumn.get(column.key) ?? [];
            const hidden = hiddenColumns.has(column.key);
            return (
              <section key={column.key} className="flex w-72 shrink-0 flex-col">
                <header className="mb-2 flex items-center gap-2 px-1">
                  <span className={`size-2 rounded-full ${column.dot}`} />
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    {column.label}
                  </h3>
                  <span className="rounded-full border border-border bg-background px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                    {columnTasks.length}
                  </span>
                  <button
                    type="button"
                    onClick={() => onToggleColumn(column.key)}
                    aria-label={
                      hidden ? `Show ${column.label} column` : `Hide ${column.label} column`
                    }
                    title={hidden ? "Show column" : "Hide column"}
                    className="ml-auto grid size-6 place-items-center rounded text-muted-foreground/60 hover:bg-muted hover:text-foreground"
                  >
                    {hidden ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                  </button>
                </header>

                {hidden ? null : (
                  <div className="min-h-40 space-y-2 rounded-lg border border-border/70 bg-muted/20 p-2">
                    {columnTasks.length === 0 ? (
                      <p className="grid h-28 place-items-center text-[11px] text-muted-foreground/60">
                        No tasks
                      </p>
                    ) : (
                      columnTasks.map((task) => (
                        <AssistantTaskCard
                          key={task.id}
                          task={task}
                          chapters={chapters}
                          seriesList={seriesList}
                          latestSubmission={latestSubmissionByTask.get(task.id)}
                          onSelect={() => onSelect(task.id)}
                        />
                      ))
                    )}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      </div>

      {buckets.inactive.length > 0 ? (
        <div className="rounded-lg border border-border/70 bg-card/40">
          <button
            type="button"
            onClick={() => setShowInactive((v) => !v)}
            className="flex w-full items-center gap-2 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground"
          >
            <ChevronDown
              className={`size-3.5 transition-transform ${showInactive ? "" : "-rotate-90"}`}
            />
            Inactive ({buckets.inactive.length})
            <span className="ml-auto text-[10px] font-normal normal-case tracking-normal text-muted-foreground/70">
              Rejected, cancelled, reassigned
            </span>
          </button>
          {showInactive ? (
            <div className="grid gap-2 p-2 sm:grid-cols-2 lg:grid-cols-3">
              {buckets.inactive.map((task) => (
                <AssistantTaskCard
                  key={task.id}
                  task={task}
                  chapters={chapters}
                  seriesList={seriesList}
                  latestSubmission={latestSubmissionByTask.get(task.id)}
                  onSelect={() => onSelect(task.id)}
                />
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
