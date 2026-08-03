import { Check, ExternalLink, X } from "lucide-react";
import { OpenTaskStudioAction } from "./open-task-studio-action";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
} from "@/components/ui/modal";
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
import { useStudioTaskActionMutation } from "../../api/assistant-queries";
import { toast } from "sonner";
import type { ReactNode } from "react";

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
  const assignmentMutation = useStudioTaskActionMutation(task?.id ?? "");
  if (!task) return null;
  const ctx = buildTaskContext(task, chapters, seriesList);
  const risk = deadlineRisk(task.dueAt);
  const taskComments = comments
    .filter((c) => c.taskId === task.id || c.pageId === task.pageId)
    .slice(0, 5);
  const visualStatus = getVisualTaskStatus(task);
  const edgeSummary = getTaskEdgeSummary(task);
  const assignmentPending = task.assignmentStatus === "PENDING";

  const acceptAssignment = () => {
    assignmentMutation.mutate(
      { action: "ACCEPT", chapterId: task.chapterId, pageId: task.pageId },
      {
        onSuccess: () => toast.success("Task accepted."),
        onError: () => toast.error("Could not accept this task."),
      },
    );
  };

  const rejectAssignment = () => {
    const reason = window.prompt("Why are you rejecting this task?")?.trim();
    if (!reason) return;
    assignmentMutation.mutate(
      { action: "REJECT", payload: { reason }, chapterId: task.chapterId, pageId: task.pageId },
      {
        onSuccess: () => toast.success("Task rejected. It is awaiting Mangaka reassignment."),
        onError: () => toast.error("Could not reject this task."),
      },
    );
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <ModalHeader>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            {ctx.series?.title ?? "—"} · Ch.{ctx.chapter?.number ?? "—"}
          </p>
          <ModalTitle className="text-xl font-bold font-serif">{task.title}</ModalTitle>
          <ModalDescription className="sr-only">Task details for {task.title}</ModalDescription>
        </ModalHeader>

        <div className="space-y-4">
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

          <Section title="Task Description">
            <p className="text-xs leading-relaxed text-muted-foreground">{task.instructions}</p>
          </Section>

          {assignmentPending ? (
            <Section title="Assignment Decision">
              <p className="mb-3 text-[11px] text-muted-foreground">
                Review the brief before accepting. You must accept the assignment before you can
                start or submit work.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={acceptAssignment}
                  disabled={assignmentMutation.isPending}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md bg-emerald-700 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
                >
                  <Check className="size-3.5" /> Accept
                </button>
                <button
                  type="button"
                  onClick={rejectAssignment}
                  disabled={assignmentMutation.isPending}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md border border-rose-300 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-60"
                >
                  <X className="size-3.5" /> Reject
                </button>
              </div>
            </Section>
          ) : null}

          <Section title="Location">
            <dl className="grid grid-cols-2 gap-2 text-[11px]">
              <Item k="Series" v={ctx.series?.title ?? "—"} />
              <Item k="Chapter" v={`Ch. ${String(ctx.chapter?.number ?? 0).padStart(3, "0")}`} />
              <Item k="Page" v={`Page ${String(ctx.pageIndex ?? 0).padStart(2, "0")}`} />
              <Item k="Region" v={REGION_TYPE_LABEL[task.type]} />
            </dl>
          </Section>

          <Section title={`Feedback (${taskComments.length})`}>
            {taskComments.length === 0 ? (
              <p className="text-[11px] text-muted-foreground">No feedback yet.</p>
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
          </Section>

          <div className="pt-2">
            <OpenTaskStudioAction
              task={task}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-foreground px-3 py-2 text-xs font-semibold text-background hover:opacity-90 disabled:opacity-60 cursor-pointer"
            >
              <ExternalLink className="size-3.5" />{" "}
              {task.status === "TODO" ? "Start & Open Task Studio" : "Open Task Studio"}
            </OpenTaskStudioAction>
          </div>
        </div>
      </ModalContent>
    </Modal>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5 border-t border-border/50 pt-3">
      <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        {title}
      </h4>
      {children}
    </div>
  );
}

function Item({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded border border-border/60 bg-muted/30 p-2">
      <dt className="text-[10px] font-semibold text-muted-foreground">{k}</dt>
      <dd className="font-medium text-foreground truncate">{v}</dd>
    </div>
  );
}
