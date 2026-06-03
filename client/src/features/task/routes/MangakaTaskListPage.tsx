import { useAuth } from "@clerk/react";
import { ClipboardList, Loader2, RefreshCw, Search } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { listTasks, type Task, type TaskStatus, type TaskPriority } from "@/features/task/api/task";

type LoadState =
  | { status: "loading" }
  | { status: "ready"; tasks: Task[] }
  | { status: "error"; message: string };

const statusClassName: Record<TaskStatus, string> = {
  TODO: "bg-slate-100 text-slate-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  SUBMITTED: "bg-amber-100 text-amber-800",
  REVISION_REQUESTED: "bg-orange-100 text-orange-700",
  MANGAKA_APPROVED: "bg-emerald-100 text-emerald-700",
  EDITOR_APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700"
};

const priorityClassName: Record<TaskPriority, string> = {
  LOW: "bg-slate-100 text-slate-700",
  MEDIUM: "bg-blue-100 text-blue-700",
  HIGH: "bg-amber-100 text-amber-800",
  URGENT: "bg-red-100 text-red-700"
};

export function MangakaTaskListPage() {
  const { getToken } = useAuth();
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "ALL">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const loadTasks = useCallback(async () => {
    try {
      setState({ status: "loading" });
      const token = await getToken({ template: "mangaflow" });
      if (!token) throw new Error("Not authenticated");
      const tasks = await listTasks(token);
      setState({ status: "ready", tasks });
    } catch (error) {
      setState({
        status: "error",
        message: error instanceof Error ? error.message : "Failed to load tasks"
      });
    }
  }, [getToken]);

  useEffect(() => {
    void loadTasks();
  }, [loadTasks]);

  if (state.status === "loading") {
    return (
      <div className="container max-w-6xl py-8">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Loading tasks...
        </div>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="container max-w-6xl py-8">
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {state.message}
        </div>
      </div>
    );
  }

  const filtered = state.tasks.filter((task) => {
    if (statusFilter !== "ALL" && task.status !== statusFilter) return false;
    if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const statusCounts = state.tasks.reduce((acc, t) => {
    acc[t.status] = (acc[t.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-[#fff9fb]">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-[#2f243a]">Task Tracker</h1>
            <p className="mt-1 text-sm text-muted-foreground">Monitor tasks you have assigned across all series.</p>
          </div>
          <Button variant="outline" onClick={() => void loadTasks()}>
            <RefreshCw /> Refresh
          </Button>
        </div>

        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-[#eadff6] bg-white pl-9 pr-3 py-2 text-sm focus:border-[#9065d5] focus:outline-none"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setStatusFilter("ALL")}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                statusFilter === "ALL"
                  ? "bg-[#9065d5] text-white"
                  : "bg-white border border-[#eadff6] text-[#5f5270] hover:bg-[#f8f1ff]"
              }`}
            >
              All ({state.tasks.length})
            </button>
            {(["TODO", "IN_PROGRESS", "SUBMITTED", "MANGAKA_APPROVED", "EDITOR_APPROVED", "REJECTED"] as TaskStatus[])
              .filter(s => (statusCounts[s] ?? 0) > 0)
              .map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    statusFilter === s
                      ? "bg-[#9065d5] text-white"
                      : "bg-white border border-[#eadff6] text-[#5f5270] hover:bg-[#f8f1ff]"
                  }`}
                >
                  {s.replace(/_/g, " ")} ({statusCounts[s]})
                </button>
              ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <section className="rounded-lg border border-dashed bg-white p-8 text-center">
            <ClipboardList className="mx-auto size-8 text-muted-foreground" />
            <h2 className="mt-3 text-base font-semibold">No tasks found</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {statusFilter !== "ALL" ? "Try changing your filter." : "Create tasks from the Page Workspace."}
            </p>
          </section>
        ) : (
          <div className="grid gap-3">
            {filtered.map((task) => (
              <article key={task.id} className="rounded-lg border border-[#eadff6] bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-base font-semibold text-[#2f243a]">{task.title}</span>
                      <span className={`rounded-sm px-2 py-0.5 text-xs font-semibold ${statusClassName[task.status]}`}>
                        {task.status.replace(/_/g, " ")}
                      </span>
                      <span className={`rounded-sm px-2 py-0.5 text-xs font-semibold ${priorityClassName[task.priority]}`}>
                        {task.priority}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span>Type: {task.type}</span>
                      <span>Assigned to: {task.assignedTo}</span>
                      {task.dueDate && <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>}
                    </div>
                  </div>
                  <Link to={`/app/mangaka/pages/${task.pageId}/workspace`}>
                    <Button variant="outline" size="sm">View Page</Button>
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
