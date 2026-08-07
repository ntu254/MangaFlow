import { Check, ExternalLink, RotateCcw, X } from "lucide-react";
import { OpenTaskStudioAction } from "./open-task-studio-action";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { Chapter, ProductionSeries } from "@/entities/series/model/series-types";
import type { StudioComment, StudioTask } from "@/entities/series/model/studio-types";
import { REGION_TYPE_LABEL } from "@/entities/series/model/studio-types";
import {
  SUBMISSION_STATUS_BADGE,
  SUBMISSION_STATUS_LABEL,
} from "@/entities/submission/model/assistant-types";
import { formatDate, formatDateTime } from "@/shared/lib/format-date";
import { buildTaskContext, deadlineRisk, priorityBadge, priorityLabel } from "@/entities/task";
import { getTaskEdgeSummary } from "@/entities/task";
import { ResolvedFileLink } from "@/shared/ui/resolved-file-link";
import {
  useReopenTaskMutation,
  useStudioTaskActionMutation,
  useTaskSubmissionsQuery,
} from "../../api/assistant-queries";
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
  const taskId = task?.id ?? "";
  const assignmentMutation = useStudioTaskActionMutation(taskId);
  const reopenMutation = useReopenTaskMutation(taskId);
  const { data: submissions = [] } = useTaskSubmissionsQuery(taskId);

  if (!task) return null;
  const ctx = buildTaskContext(task, chapters, seriesList);
  const risk = deadlineRisk(task.dueAt);
  const taskComments = comments.filter((c) => c.taskId === task.id || c.pageId === task.pageId);
  const edgeSummary = getTaskEdgeSummary(task);
  const assignmentPending = task.assignmentStatus === "PENDING";
  const inRevision = task.status === "REVISION_REQUESTED";

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

  const reopenTask = () => {
    reopenMutation.mutate(
      { chapterId: task.chapterId, pageId: task.pageId },
      {
        onSuccess: () => toast.success("Task reopened. Incorporate the feedback and resubmit."),
        onError: () => toast.error("Could not reopen this task."),
      },
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full max-w-md overflow-y-auto bg-background p-0">
        <SheetHeader className="border-b border-border/70 px-5 pb-3 pt-5 text-left">
          <p className="truncate text-[11px] font-semibold text-muted-foreground">
            {ctx.series?.title ?? "Unknown series"}
          </p>
          <p className="text-[11px] font-medium text-muted-foreground">
            Chapter{" "}
            <span className="font-mono font-semibold text-foreground/70">
              {ctx.chapter?.number ?? "—"}
            </span>
            {" · "}Page{" "}
            <span className="font-mono font-semibold text-foreground/70">
              {String(ctx.pageIndex ?? 0).padStart(2, "0")}
            </span>
          </p>
          <SheetTitle className="font-serif text-xl font-bold">{task.title}</SheetTitle>
          <SheetDescription className="sr-only">Task details for {task.title}</SheetDescription>
        </SheetHeader>

        <div className="space-y-5 p-5">
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
            <div className="rounded border border-border/40 bg-muted/60 p-2.5 text-[11px] font-medium text-accent">
              {edgeSummary}
            </div>
          ) : null}

          <Section title="Task description">
            <p className="text-xs leading-relaxed text-muted-foreground">{task.instructions}</p>
          </Section>

          {assignmentPending ? (
            <Section title="Assignment decision">
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

          {inRevision ? (
            <Section title="Revision">
              <p className="mb-2 text-[11px] text-muted-foreground">
                The Mangaka asked for changes. Incorporate the feedback, then resubmit from the
                studio.
              </p>
              <button
                type="button"
                onClick={reopenTask}
                disabled={reopenMutation.isPending}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-amber-400/60 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900 hover:bg-amber-100 disabled:opacity-60"
              >
                <RotateCcw className="size-3.5" /> Reopen task
              </button>
            </Section>
          ) : null}

          <Section title={`Submission history (${submissions.length})`}>
            {submissions.length === 0 ? (
              <p className="text-[11px] text-muted-foreground">No submissions yet.</p>
            ) : (
              <ol className="space-y-2">
                {submissions.map((s) => (
                  <li
                    key={s.id}
                    className="rounded border border-border bg-background/60 p-2.5 text-[11px]"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-semibold">{s.versionLabel}</span>
                      <span
                        className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${SUBMISSION_STATUS_BADGE[s.status]}`}
                      >
                        {SUBMISSION_STATUS_LABEL[s.status]}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center justify-between gap-2 text-[10px] text-muted-foreground">
                      <span>
                        {formatDateTime(s.submittedAt)} · {s.reviewedByName ?? "—"}
                      </span>
                      <ResolvedFileLink
                        fileKey={s.fileKey}
                        fallbackUrl={s.fileUrl}
                        fileName={s.fileName}
                        ariaLabel={`Open ${s.versionLabel} file`}
                        className="inline-flex items-center gap-1 rounded border border-border px-1.5 py-0.5 font-semibold text-foreground hover:bg-muted"
                      >
                        Open file
                      </ResolvedFileLink>
                    </div>
                    {s.note ? (
                      <p className="mt-1.5 whitespace-pre-line text-[11px] text-foreground/80">
                        {s.note}
                      </p>
                    ) : null}
                    {s.feedback ? (
                      <p className="mt-1.5 rounded border border-orange-200 bg-orange-50 px-2 py-1.5 text-[11px] text-orange-900">
                        <span className="font-bold uppercase tracking-wider">Feedback: </span>
                        {s.feedback}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ol>
            )}
          </Section>

          <Section title={`Feedback (${taskComments.length})`}>
            {taskComments.length === 0 ? (
              <p className="text-[11px] text-muted-foreground">No feedback yet.</p>
            ) : (
              <ul className="max-h-64 space-y-2 overflow-y-auto pr-1">
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

          <OpenTaskStudioAction
            task={task}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-foreground px-3 py-2 text-xs font-semibold text-background hover:opacity-90 disabled:opacity-60"
          >
            <ExternalLink className="size-3.5" />{" "}
            {task.status === "TODO" ? "Start & Open Task Studio" : "Open Task Studio"}
          </OpenTaskStudioAction>
        </div>
      </SheetContent>
    </Sheet>
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
