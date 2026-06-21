import { createFileRoute, Link } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { extractErrorMessage } from "@/shared/api/_client";
import { useTaskDetail } from "@/shared/queries/useTasks";
import { PageStudioWorkspace } from "@/features/page-studio/PageStudioWorkspace";

export const Route = createFileRoute("/app/assistant/tasks/$taskId/studio")({
  component: RouteComponent,
});

function RouteComponent() {
  const { taskId } = Route.useParams();
  const { data: task, isLoading, error } = useTaskDetail(taskId);
  const workspacePageId = task?.pageId;

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-background text-foreground/50">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        <span className="text-sm font-semibold uppercase tracking-wide">Loading Task Studio...</span>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-background">
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-6 text-sm text-rose-400">
          {error ? extractErrorMessage(error) : "Task not available."}
        </div>
      </div>
    );
  }

  if (!workspacePageId) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-background">
        <div className="max-w-sm rounded-xl border border-amber-500/20 bg-amber-500/5 p-6 text-center text-sm text-amber-300">
          <div className="font-semibold">Task chua duoc gan page/region hop le.</div>
          <p className="mt-2 text-amber-300/75">
            Hay yeu cau Mangaka gan task vao page hoac region truoc khi mo Task Studio.
          </p>
          <Link
            to="/app/assistant/tasks"
            className="mt-4 inline-flex rounded-md border border-amber-500/25 px-3 py-1.5 text-[12px] font-semibold hover:bg-amber-500/10"
          >
            Back to My Tasks
          </Link>
        </div>
      </div>
    );
  }

  return (
    <PageStudioWorkspace
      pageId={workspacePageId}
      seriesId={task.seriesId}
      assistantTask={task}
      backLabel="My Tasks"
      backTo="/app/assistant/tasks"
      embedded
    />
  );
}
