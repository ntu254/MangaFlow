import { ExternalLink } from "lucide-react";
import { OpenTaskStudioAction } from "./open-task-studio-action";
import { DetailDrawer, DrawerSection } from "@/shared/layout/detail-drawer";
import type { Chapter, ProductionSeries } from "@/entities/series/model/series-types";
import type { StudioComment, StudioTask } from "@/entities/series/model/studio-types";
import { REGION_TYPE_LABEL } from "@/entities/series/model/studio-types";
import { formatDate, formatDateTime } from "@/shared/lib/format-date";
import { buildTaskContext, deadlineRisk, priorityBadge, priorityLabel } from "@/entities/task";
import {
  getVisualTaskStatus,
  getVisualTaskStatusClass,
  getTaskStatusLabel,
  getTaskEdgeSummary,
} from "@/entities/task";

export function AssistantTaskDetailDrawer({
  task,
  chapters,
  seriesList,
  comments,
  open,
  onOpenChange,
}: {
  task?: StudioTask;
  chapters: Chapter[];
  seriesList: ProductionSeries[];
  comments: StudioComment[];
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  if (!task) return null;
  const ctx = buildTaskContext(task, chapters, seriesList);
  const risk = deadlineRisk(task.dueAt);
  const taskComments = comments
    .filter((c) => c.taskId === task.id || c.pageId === task.pageId)
    .slice(0, 5);
  const visualStatus = getVisualTaskStatus(task);
  const edgeSummary = getTaskEdgeSummary(task);

  return (
    <DetailDrawer
      open={open}
      onOpenChange={onOpenChange}
      eyebrow={`${ctx.series?.title ?? "—"} · Ch.${ctx.chapter?.number ?? "—"}`}
      title={task.title}
    >
      <div className="mb-6 space-y-3">
        <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
          <span
            className={`rounded border px-1.5 py-0.5 font-bold uppercase ${getVisualTaskStatusClass(visualStatus)}`}
          >
            {getTaskStatusLabel(visualStatus)}
          </span>
          <span className="rounded bg-muted px-1.5 py-0.5 font-semibold text-muted-foreground">
            {REGION_TYPE_LABEL[task.type]}
          </span>
          <span
            className={`rounded px-1.5 py-0.5 font-bold uppercase ${priorityBadge(task.priority)}`}
          >
            {priorityLabel(task.priority)}
          </span>
          <span
            className={`rounded px-1.5 py-0.5 font-bold uppercase ${
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
        {edgeSummary ? (
          <div className="rounded bg-muted/60 p-2.5 text-[11px] text-accent border border-border/40 font-medium">
            {edgeSummary}
          </div>
        ) : null}
      </div>

      <DrawerSection title="Mô tả nhiệm vụ">
        <p className="text-xs leading-relaxed text-muted-foreground">{task.instructions}</p>
      </DrawerSection>
      <DrawerSection title="Vị trí">
        <dl className="grid grid-cols-2 gap-2 text-[11px]">
          <Item k="Series" v={ctx.series?.title ?? "—"} />
          <Item k="Chapter" v={`Ch. ${String(ctx.chapter?.number ?? 0).padStart(3, "0")}`} />
          <Item k="Page" v={`Page ${String(ctx.pageIndex ?? 0).padStart(2, "0")}`} />
          <Item k="Region" v={REGION_TYPE_LABEL[task.type]} />
        </dl>
      </DrawerSection>
      <DrawerSection title={`Feedback (${taskComments.length})`}>
        {taskComments.length === 0 ? (
          <p className="text-[11px] text-muted-foreground">Chưa có feedback.</p>
        ) : (
          <ul className="space-y-2">
            {taskComments.map((c) => (
              <li
                key={c.id}
                className="rounded border border-border bg-background/60 p-2 text-[11px]"
              >
                <p className="font-semibold">{c.authorName}</p>
                <p className="mt-0.5 text-muted-foreground">{c.text}</p>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  {formatDateTime(c.createdAt)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </DrawerSection>

      <div className="mt-6">
        <OpenTaskStudioAction
          task={task}
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-foreground px-3 py-2 text-xs font-semibold text-background hover:opacity-90 disabled:opacity-60"
        >
          <ExternalLink className="size-3.5" />{" "}
          {task.status === "TODO" ? "Start & Open Task Studio" : "Open Task Studio"}
        </OpenTaskStudioAction>
      </div>
    </DetailDrawer>
  );
}

function Item({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="text-muted-foreground">{k}</dt>
      <dd className="font-semibold">{v}</dd>
    </div>
  );
}
