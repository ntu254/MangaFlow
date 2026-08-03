import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { mapApiMaterialToSeriesMaterial } from "@/entities/proposal/model/map-material";
import type { SeriesMaterial } from "@/entities/series/model/series-types";
import { REGION_TYPE_LABEL, UNSUPPORTED_MVP } from "@/entities/series/model/studio-types";
import {
  buildTaskContext,
  deadlineRisk,
  getTaskStatusLabel,
  getVisualTaskStatus,
  getVisualTaskStatusClass,
  priorityBadge,
  priorityLabel,
} from "@/entities/task";
import {
  useChapterDetailQuery,
  useReopenTaskMutation,
  useSeriesDetailQuery,
  useSeriesMaterialsQuery,
  useStudioTaskActionMutation,
  useStudioTaskDetailQuery,
  useTaskCommentsQuery,
  useTaskSubmissionsQuery,
} from "../../api/assistant-queries";
import { canAssistantAccessTask, isAssistantTaskReadOnly } from "../../model/assistant-access";
import { useAuth } from "@/shared/auth";
import { formatDate } from "@/shared/lib/format-date";
import { EmptyState } from "@/shared/ui/empty-state";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Ban, CheckCircle2, ExternalLink, Play, RefreshCw, Send } from "lucide-react";
import { useMemo } from "react";
import { toast } from "sonner";
import { SubmissionHistory } from "./submission-history";
import { TaskBriefPanel } from "./task-brief-panel";
import { TaskFeedbackPanel } from "./task-feedback-panel";
import { TaskRegionPreview } from "./task-region-preview";
import { TaskSubmissionPanel } from "./task-submission-panel";
import { deriveTaskStudioSubmissionState } from "@/entities/task/model/submission-state";

export function TaskStudioPage({ taskId }: { taskId: string }) {
  const navigate = useNavigate();
  const user = useAuth((s) => s.user);
  const {
    data: task,
    isLoading: taskLoading,
    isError: taskIsError,
    error: taskError,
  } = useStudioTaskDetailQuery(taskId);
  const { data: chapter } = useChapterDetailQuery(task?.chapterId ?? "");
  const seriesId = task?.seriesId ?? chapter?.seriesId ?? "";
  const { data: series } = useSeriesDetailQuery(seriesId);
  const chapters = useMemo(() => (chapter ? [chapter] : []), [chapter]);
  const seriesList = useMemo(() => (series ? [series] : []), [series]);
  const { data: comments = [] } = useTaskCommentsQuery(task?.id ?? "");
  const taskActionMutation = useStudioTaskActionMutation(taskId);
  const reopenTaskMutation = useReopenTaskMutation(taskId);
  const { data: rawMaterials = [] } = useSeriesMaterialsQuery(seriesId);
  const materials = useMemo(() => rawMaterials.map(mapApiMaterialToSeriesMaterial), [rawMaterials]);
  const { data: submissions = [] } = useTaskSubmissionsQuery(task?.id ?? "");
  const ctx = task ? buildTaskContext(task, chapters, seriesList) : undefined;
  const page = ctx?.chapter?.pages.find((p) => p.id === task?.pageId);
  const taskComments = useMemo(
    () => comments.filter((c) => c.taskId === task?.id || c.pageId === task?.pageId),
    [comments, task],
  );
  const taskSubs = useMemo(
    () =>
      [...submissions].sort(
        (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
      ),
    [submissions],
  );
  const submissionState = task
    ? deriveTaskStudioSubmissionState(task, taskSubs)
    : {
        mode: "NOT_STARTED" as const,
        canSubmit: false,
        defaultTab: "submit" as const,
      };
  const references = useMemo(
    () =>
      materials
        .filter((m) => m.seriesId === ctx?.series?.id)
        .filter(
          (m) =>
            m.kind === "reference" ||
            m.kind === "moodboard" ||
            m.kind === "character" ||
            m.kind === "background",
        )
        .slice(0, 12) as SeriesMaterial[],
    [materials, ctx],
  );

  if (!user) return null;

  if (taskLoading) {
    return (
      <div className="grid min-h-[420px] place-items-center rounded-md border border-border bg-card/60">
        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
          <RefreshCw className="size-3.5 animate-spin" />
          Loading Task Studio...
        </div>
      </div>
    );
  }

  if (taskIsError) {
    return (
      <EmptyState
        title="Could not open Task Studio"
        description={taskError instanceof Error ? taskError.message : "Task detail API error."}
        action={
          <Link
            to="/app/assistant/tasks"
            className="inline-flex items-center gap-1.5 rounded-md bg-foreground px-3 py-1.5 text-xs font-semibold text-background"
          >
            ← Back to My Tasks
          </Link>
        }
      />
    );
  }

  if (!task) {
    return (
      <EmptyState
        title="Task not found"
        description="The task may have been deleted or the URL is invalid."
        action={
          <Link
            to="/app/assistant/tasks"
            className="inline-flex items-center gap-1.5 rounded-md bg-foreground px-3 py-1.5 text-xs font-semibold text-background"
          >
            ← Back to My Tasks
          </Link>
        }
      />
    );
  }

  if (!canAssistantAccessTask(task, user.id)) {
    return (
      <EmptyState
        title="You do not have access to this task"
        description="This task is not assigned to you."
        action={
          <Link
            to="/app/assistant/tasks"
            className="inline-flex items-center gap-1.5 rounded-md bg-foreground px-3 py-1.5 text-xs font-semibold text-background"
          >
            ← Back to My Tasks
          </Link>
        }
      />
    );
  }

  const visualStatus = getVisualTaskStatus(task);
  const readOnly = isAssistantTaskReadOnly(task, user.id);
  const risk = deadlineRisk(task.dueAt);
  const initialTab =
    submissionState.defaultTab === "submit" && readOnly
      ? taskSubs.length > 0
        ? "history"
        : taskComments.length > 0
          ? "feedback"
          : "submit"
      : submissionState.defaultTab;

  function startWork() {
    if (!task) return;
    taskActionMutation.mutate(
      { action: "start", chapterId: task.chapterId, pageId: task.pageId },
      {
        onSuccess: () => toast.success("Task started."),
        onError: () => toast.error("Error updating task."),
      },
    );
  }

  function acceptWork() {
    if (!task) return;
    taskActionMutation.mutate(
      { action: "ACCEPT", chapterId: task.chapterId, pageId: task.pageId },
      {
        onSuccess: () => toast.success("Task accepted."),
        onError: (error) =>
          toast.error(error instanceof Error ? error.message : "Could not accept task."),
      },
    );
  }

  function rejectWork() {
    if (!task) return;
    const reason = window.prompt("Why are you rejecting this task?")?.trim();
    if (!reason) return;
    taskActionMutation.mutate(
      {
        action: "REJECT",
        payload: { reason },
        chapterId: task.chapterId,
        pageId: task.pageId,
      },
      {
        onSuccess: () => toast.success("Task rejected and sent back for reassignment."),
        onError: (error) =>
          toast.error(error instanceof Error ? error.message : "Could not reject task."),
      },
    );
  }

  function reopenWork() {
    if (!task) return;
    reopenTaskMutation.mutate(
      { chapterId: task.chapterId, pageId: task.pageId },
      {
        onSuccess: () => toast.success("Task reopened. Submit new work from the Submit tab."),
        onError: (error) =>
          toast.error(error instanceof Error ? error.message : "Could not reopen task."),
      },
    );
  }

  return (
    <>
      <div className="-mx-6 -my-6 flex h-[calc(100vh-3.5rem)] flex-col bg-background lg:-mx-10 lg:-my-10">
        {/* Top context bar */}
        <header className="flex flex-wrap items-center gap-3 border-b border-border bg-card/60 px-4 py-2.5">
          <button
            onClick={() => navigate({ to: "/app/assistant/tasks" })}
            className="inline-flex items-center gap-1 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Back"
          >
            <ArrowLeft className="size-3.5" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              {ctx?.series?.title} · Ch.{ctx?.chapter?.number} · P.
              {String(ctx?.pageIndex ?? 0).padStart(2, "0")} · {REGION_TYPE_LABEL[task.type]}
            </p>
            <p className="truncate font-serif text-base">{task.title}</p>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
            {ctx?.series ? (
              <Link
                to="/app/assistant/series/$seriesId/studio"
                params={{ seriesId: ctx.series.id }}
                search={{ chapterId: task.chapterId, pageId: task.pageId }}
                className="inline-flex items-center gap-1 rounded border border-border bg-background px-2 py-0.5 font-semibold uppercase tracking-wider hover:bg-muted"
              >
                <ExternalLink className="size-3" /> Open Studio Canvas
              </Link>
            ) : null}
            {readOnly ? (
              <span className="rounded border border-zinc-300 bg-zinc-100 px-1.5 py-0.5 font-bold uppercase tracking-wider text-zinc-700">
                View only
              </span>
            ) : null}
            <span
              className={`rounded border px-1.5 py-0.5 font-bold uppercase tracking-wider ${getVisualTaskStatusClass(visualStatus)}`}
            >
              {getTaskStatusLabel(visualStatus)}
            </span>
            <span
              className={`rounded px-1.5 py-0.5 font-bold uppercase tracking-wider ${priorityBadge(task.priority)}`}
            >
              {priorityLabel(task.priority)}
            </span>
            <span
              className={`rounded px-1.5 py-0.5 font-bold uppercase tracking-wider ${
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
        </header>

        {/* Body */}
        <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)_360px]">
          <div className="hidden border-r border-border bg-card/40 lg:block">
            <div className="space-y-3 p-3">
              <TaskBriefPanel
                task={task}
                chapter={ctx?.chapter}
                series={ctx?.series}
                references={references}
              />
            </div>
          </div>
          <div className="min-w-0 overflow-hidden p-3">
            <TaskRegionPreview
              page={page}
              comments={taskComments}
              coverFallback={ctx?.series?.coverUrl}
            />
          </div>
          <div className="border-l border-border bg-card/40">
            <Tabs
              key={`${task.id}-${submissionState.mode}`}
              defaultValue={initialTab}
              className="flex h-full flex-col"
            >
              <TabsList className="m-2 grid grid-cols-3">
                <TabsTrigger value="submit" className="text-[11px]">
                  {submissionState.canSubmit ? "Submit" : "Status"}
                </TabsTrigger>
                <TabsTrigger value="feedback" className="text-[11px]">
                  Feedback
                  {taskComments.length > 0 ? (
                    <span className="ml-1 rounded-full bg-rose-500 px-1.5 text-[9px] font-bold text-white">
                      {taskComments.length}
                    </span>
                  ) : null}
                </TabsTrigger>
                <TabsTrigger value="history" className="text-[11px]">
                  History
                </TabsTrigger>
              </TabsList>
              <TabsContent value="submit" className="flex-1 overflow-y-auto">
                <TaskSubmissionPanel
                  task={task}
                  user={user}
                  readOnly={readOnly}
                  onSubmitted={() => undefined}
                />
              </TabsContent>
              <TabsContent value="feedback" className="flex-1 overflow-y-auto">
                <TaskFeedbackPanel
                  task={task}
                  comments={taskComments}
                  highlight={
                    task.status === "REVISION_REQUESTED"
                  }
                  readOnly={readOnly}
                />
              </TabsContent>
              <TabsContent value="history" className="flex-1 overflow-y-auto">
                <SubmissionHistory submissions={taskSubs} />
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Bottom actions */}
        <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-border bg-card/60 px-4 py-2.5">
          <BottomActions
            task={task}
            readOnly={readOnly}
            onAccept={acceptWork}
            onReject={rejectWork}
            onStart={startWork}
            onReopen={reopenWork}
            actionBusy={reopenTaskMutation.isPending || taskActionMutation.isPending}
          />
        </footer>
      </div>
    </>
  );
}

function BottomActions({
  task,
  readOnly,
  onAccept,
  onReject,
  onStart,
  onReopen,
  actionBusy,
}: {
  task: import("@/entities/series/model/studio-types").StudioTask;
  readOnly: boolean;
  onAccept: () => void;
  onReject: () => void;
  onStart: () => void;
  onReopen: () => void;
  actionBusy: boolean;
}) {
  const visualStatus = getVisualTaskStatus(task);

  if (visualStatus === "CANCELLED") {
    return (
      <span className="text-xs text-rose-600 font-semibold">
        View only — task has been cancelled.
      </span>
    );
  }
  if (visualStatus === "REASSIGNED") {
    return (
      <span className="text-xs text-amber-600 font-semibold">
        View only — task has been reassigned.
      </span>
    );
  }
  if (readOnly) {
    return <span className="text-xs text-muted-foreground">View only — task is closed.</span>;
  }
  if (task.assignmentStatus === "PENDING") {
    return (
      <>
        <span className="mr-auto text-xs text-muted-foreground">
          Review the brief, then accept or reject this assignment.
        </span>
        <button
          type="button"
          onClick={onReject}
          disabled={actionBusy}
          className="inline-flex items-center gap-1.5 rounded-md border border-rose-300 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50"
        >
          Reject
        </button>
        <button
          type="button"
          onClick={onAccept}
          disabled={actionBusy}
          className="inline-flex items-center gap-1.5 rounded-md bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
        >
          <CheckCircle2 className="size-3.5" /> Accept
        </button>
      </>
    );
  }
  if (task.assignmentStatus === "REJECTED") {
    return (
      <span className="mr-auto text-xs font-semibold text-rose-700">
        View only — this assignment was rejected and is waiting for reassignment.
      </span>
    );
  }
  if (task.status === "TODO") {
    return (
      <button
        onClick={onStart}
        disabled={actionBusy}
        className="inline-flex items-center gap-1.5 rounded-md bg-foreground px-3 py-1.5 text-xs font-semibold text-background hover:opacity-90 disabled:opacity-50"
      >
        <Play className="size-3.5" /> Start Work
      </button>
    );
  }
  if (task.status === "IN_PROGRESS") {
    const btn = (
      <button
        onClick={() => undefined}
        disabled
        className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-semibold text-muted-foreground opacity-60"
      >
        <Send className="size-3.5" /> Use Submit tab
      </button>
    );

    return (
      <>
        <DisabledAction label="Save Draft (use Submit tab)" />
        {btn}
      </>
    );
  }
  if (task.status === "REVISION_REQUESTED") {
    const btn = (
      <button
        onClick={onReopen}
        disabled={actionBusy}
        className="inline-flex items-center gap-1.5 rounded-md bg-foreground px-3 py-1.5 text-xs font-semibold text-background hover:opacity-90 disabled:opacity-60"
      >
        <RefreshCw className="size-3.5" /> {actionBusy ? "Reopening..." : "Reopen Task"}
      </button>
    );

    return (
      <>
        <DisabledAction label="Feedback lifecycle uses canonical review actions" />
        {btn}
      </>
    );
  }
  if (task.status === "SUBMITTED") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
        <CheckCircle2 className="size-3.5 text-emerald-600" /> Awaiting Mangaka review.
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      <Ban className="size-3.5" /> No actions available.
    </span>
  );
}

function DisabledAction({ label }: { label: string }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            disabled
            className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-semibold text-muted-foreground opacity-60"
          >
            {label}
          </button>
        </TooltipTrigger>
        <TooltipContent>{UNSUPPORTED_MVP}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
