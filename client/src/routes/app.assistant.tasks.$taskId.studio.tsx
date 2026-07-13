import { createFileRoute, Link } from "@tanstack/react-router";
import { RefreshCw } from "lucide-react";
import {
  canAssistantAccessTask,
  useChapterDetailQuery,
  useStudioTaskDetailQuery,
} from "@/features/assistant/task-studio";
import { SeriesStudioCanvas } from "@/features/series/detail";
import { useAuth } from "@/shared/auth";
import { EmptyState } from "@/shared/ui/empty-state";

export const Route = createFileRoute("/app/assistant/tasks/$taskId/studio")({
  head: () => ({
    meta: [
      { title: "Task Studio — beachRead Studio" },
      { name: "description", content: "Focused workspace for an Assistant task." },
    ],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  const { taskId } = Route.useParams();
  const user = useAuth((s) => s.user);
  const {
    data: task,
    isLoading: taskLoading,
    isError: taskIsError,
    error: taskError,
  } = useStudioTaskDetailQuery(taskId);
  const { data: chapter, isLoading: chapterLoading } = useChapterDetailQuery(
    task?.seriesId ? "" : (task?.chapterId ?? ""),
  );
  const seriesId = task?.seriesId ?? chapter?.seriesId;

  if (!user) return null;

  if (taskLoading || (task && !seriesId && chapterLoading)) {
    return (
      <div className="grid min-h-[420px] place-items-center rounded-md border border-border bg-card/60">
        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
          <RefreshCw className="size-3.5 animate-spin" />
          Opening Studio...
        </div>
      </div>
    );
  }

  if (taskIsError || !task) {
    return (
      <EmptyState
        title="Could not open Studio"
        description={taskError instanceof Error ? taskError.message : "Task not found."}
        action={<BackToTasksLink />}
      />
    );
  }

  if (!canAssistantAccessTask(task, user.id)) {
    return (
      <EmptyState
        title="You do not have permission to view this task"
        description="This task is not assigned to you."
        action={<BackToTasksLink />}
      />
    );
  }

  if (!seriesId) {
    return (
      <EmptyState
        title="Could not identify the series"
        description="This task is missing series/chapter context required to open the Studio canvas."
        action={<BackToTasksLink />}
      />
    );
  }

  return (
    <SeriesStudioCanvas
      seriesId={seriesId}
      initialChapterId={task.chapterId}
      initialPageId={task.pageId}
      initialTaskId={task.id}
      initialRegionId={task.regionId}
      backLink={<BackToTasksLink />}
    />
  );
}

function BackToTasksLink() {
  return (
    <Link
      to="/app/assistant/tasks"
      className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-semibold hover:bg-muted"
    >
      ← My Tasks
    </Link>
  );
}
