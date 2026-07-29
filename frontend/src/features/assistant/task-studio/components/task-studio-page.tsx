import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { mapApiMaterialToSeriesMaterial } from "@/entities/proposal/model/map-material";
import type { SeriesMaterial } from "@/entities/series/model/series-types";
import { REGION_TYPE_LABEL, UNSUPPORTED_MVP } from "@/entities/series/model/studio-types";
import {
  buildTaskContext,
  deadlineRisk,
  getTaskBlockedReason,
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
  useStudioRegionsQuery,
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
import { useMemo, useState } from "react";
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
  const { data: regions = [] } = useStudioRegionsQuery(
    {
      chapterId: task?.chapterId ?? "",
      pageId: task?.pageId ?? "",
    },
    !!task,
  );
  const { data: comments = [] } = useTaskCommentsQuery(task?.id ?? "");
  const taskActionMutation = useStudioTaskActionMutation(taskId);
  const reopenTaskMutation = useReopenTaskMutation(taskId);
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [blockReason, setBlockReason] = useState("");
  const { data: rawMaterials = [] } = useSeriesMaterialsQuery(seriesId);
  const materials = useMemo(() => rawMaterials.map(mapApiMaterialToSeriesMaterial), [rawMaterials]);
  const { data: submissions = [] } = useTaskSubmissionsQuery(task?.id ?? "");
  const ctx = task ? buildTaskContext(task, chapters, seriesList) : undefined;
  const page = ctx?.chapter?.pages.find((p) => p.id === task?.pageId);
  const region = task?.regionId
    ? regions.find((r) => r.id === task.regionId)
    : regions.find((r) => r.pageId === task?.pageId && r.type === task?.type);
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

  function blockWork() {
    if (!task || blockReason.trim().length < 3) return;
    taskActionMutation.mutate(
      {
        action: "block",
        payload: { blockedReason: blockReason.trim() },
        chapterId: task.chapterId,
        pageId: task.pageId,
      },
      {
        onSuccess: () => {
          setBlockDialogOpen(false);
          setBlockReason("");
          toast.success("Task blocked.");
        },
        onError: (error) =>
          toast.error(error instanceof Error ? error.message : "Could not block task."),
      },
    );
  }

  function unblockWork() {
    if (!task) return;
    taskActionMutation.mutate(
      { action: "unblock", chapterId: task.chapterId, pageId: task.pageId },
      {
        onSuccess: () => toast.success("Task unblocked."),
        onError: (error) =>
          toast.error(error instanceof Error ? error.message : "Could not unblock task."),
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
              region={region}
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
                    task.status === "MANGAKA_REVISION_REQUESTED" ||
                    task.status === "EDITOR_REVISION_REQUESTED"
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
            onStart={startWork}
            onReopen={reopenWork}
            onBlock={() => setBlockDialogOpen(true)}
            onUnblock={unblockWork}
            actionBusy={reopenTaskMutation.isPending || taskActionMutation.isPending}
          />
        </footer>
      </div>

      <Dialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Block task</DialogTitle>
            <DialogDescription>
              Record the dependency preventing progress. The task stays assigned and can be resumed
              after it is unblocked.
            </DialogDescription>
          </DialogHeader>
          <div>
            <label
              htmlFor="assistant-task-block-reason"
              className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground"
            >
              Blocking reason
            </label>
            <Textarea
              id="assistant-task-block-reason"
              value={blockReason}
              onChange={(event) => setBlockReason(event.target.value)}
              placeholder="Explain what is blocking this task..."
              rows={4}
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <button
              type="button"
              onClick={() => setBlockDialogOpen(false)}
              className="rounded-md border border-border bg-background px-3 py-2 text-xs font-semibold hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={blockWork}
              disabled={blockReason.trim().length < 3 || taskActionMutation.isPending}
              className="rounded-md bg-rose-700 px-3 py-2 text-xs font-semibold text-white hover:bg-rose-800 disabled:opacity-50"
            >
              {taskActionMutation.isPending ? "Blocking..." : "Confirm block"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function BottomActions({
  task,
  readOnly,
  onStart,
  onReopen,
  onBlock,
  onUnblock,
  actionBusy,
}: {
  task: import("@/entities/series/model/studio-types").StudioTask;
  readOnly: boolean;
  onStart: () => void;
  onReopen: () => void;
  onBlock: () => void;
  onUnblock: () => void;
  actionBusy: boolean;
}) {
  const visualStatus = getVisualTaskStatus(task);
  const isBlocked = visualStatus === "BLOCKED";
  const blockedReason = getTaskBlockedReason(task) ?? "Task is blocked";

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
  if (task.status === "TODO") {
    if (isBlocked) {
      return (
        <>
          <span className="max-w-xl text-xs text-amber-800">Blocked: {blockedReason}</span>
          <button
            type="button"
            onClick={onUnblock}
            disabled={actionBusy}
            className="inline-flex items-center gap-1.5 rounded-md bg-amber-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-800 disabled:opacity-50"
          >
            {actionBusy ? "Unblocking..." : "Unblock Task"}
          </button>
        </>
      );
    }
    const btn = (
      <button
        onClick={onStart}
        disabled={actionBusy}
        className="inline-flex items-center gap-1.5 rounded-md bg-foreground px-3 py-1.5 text-xs font-semibold text-background hover:opacity-90 disabled:opacity-50"
      >
        <Play className="size-3.5" /> Start Work
      </button>
    );

    return (
      <>
        <button
          type="button"
          onClick={onBlock}
          disabled={actionBusy}
          className="inline-flex items-center gap-1.5 rounded-md border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-800 hover:bg-rose-100 disabled:opacity-50"
        >
          <Ban className="size-3.5" /> Block Task
        </button>
        {btn}
      </>
    );
  }
  if (task.status === "IN_PROGRESS") {
    if (isBlocked) {
      return (
        <>
          <span className="max-w-xl text-xs text-amber-800">Blocked: {blockedReason}</span>
          <button
            type="button"
            onClick={onUnblock}
            disabled={actionBusy}
            className="inline-flex items-center gap-1.5 rounded-md bg-amber-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-800 disabled:opacity-50"
          >
            {actionBusy ? "Unblocking..." : "Unblock Task"}
          </button>
        </>
      );
    }
    const btn = (
      <button
        onClick={() => undefined}
        disabled
        className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold ${
          isBlocked
            ? "border border-border bg-background text-muted-foreground opacity-60 cursor-not-allowed"
            : "border border-border bg-background text-muted-foreground opacity-60 cursor-not-allowed"
        }`}
      >
        <Send className="size-3.5" /> Use Submit tab
      </button>
    );

    return (
      <>
        <DisabledAction label="Save Draft (use Submit tab)" />
        <button
          type="button"
          onClick={onBlock}
          disabled={actionBusy}
          className="inline-flex items-center gap-1.5 rounded-md border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-800 hover:bg-rose-100 disabled:opacity-50"
        >
          <Ban className="size-3.5" /> Block Task
        </button>
        {btn}
      </>
    );
  }
  if (
    task.status === "REVISION_REQUESTED" ||
    task.status === "MANGAKA_REVISION_REQUESTED" ||
    task.status === "EDITOR_REVISION_REQUESTED"
  ) {
    const btn = (
      <button
        onClick={onReopen}
        disabled={isBlocked || actionBusy}
        className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold ${
          isBlocked
            ? "border border-border bg-background text-muted-foreground opacity-60 cursor-not-allowed"
            : "bg-foreground text-background hover:opacity-90"
        }`}
      >
        <RefreshCw className="size-3.5" /> {actionBusy ? "Reopening..." : "Reopen Task"}
      </button>
    );

    return (
      <>
        <DisabledAction label="Feedback lifecycle uses canonical review actions" />
        {isBlocked ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div>{btn}</div>
              </TooltipTrigger>
              <TooltipContent>{blockedReason}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          btn
        )}
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
