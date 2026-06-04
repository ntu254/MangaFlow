import { useAuth } from "@/shared/hooks/useAuth";
import { BriefcaseBusiness, Loader2, Play, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { listTasks, startTask, type Task } from "@/features/task/api/task";

type LoadState =
  | { status: "loading" }
  | { status: "ready"; tasks: Task[] }
  | { status: "error"; message: string };

const priorityClassName: Record<Task["priority"], string> = {
  LOW: "bg-slate-100 text-slate-700",
  MEDIUM: "bg-blue-100 text-blue-700",
  HIGH: "bg-amber-100 text-amber-800",
  URGENT: "bg-red-100 text-red-700"
};

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0
  }).format(value);
}

export function AssistantDashboardPage() {
  const { getToken } = useAuth();
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [actionError, setActionError] = useState<string | null>(null);
  const [startingTaskId, setStartingTaskId] = useState<string | null>(null);

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

  async function handleStart(taskId: string) {
    if (state.status !== "ready") return;

    try {
      setStartingTaskId(taskId);
      setActionError(null);
      const token = await getToken({ template: "mangaflow" });
      if (!token) throw new Error("Not authenticated");
      const updated = await startTask(token, taskId);
      setState({
        status: "ready",
        tasks: state.tasks.map((task) => (task.id === updated.id ? updated : task))
      });
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Failed to start task");
    } finally {
      setStartingTaskId(null);
    }
  }

  if (state.status === "loading") {
    return (
      <div className="container max-w-6xl py-8">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Loading assigned tasks
        </div>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="container max-w-5xl py-8">
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {state.message}
        </div>
      </div>
    );
  }

  const openTasks = state.tasks.filter((task) => !["EDITOR_APPROVED", "MANGAKA_APPROVED", "REJECTED"].includes(task.status));

  return (
    <div className="min-h-screen bg-[#fff9fb] pb-12">
      <section className="bg-gradient-to-r from-[#f8f1ff] via-[#fff3f8] to-[#fff7ec] border-b border-[#eadff6] py-10 px-6 sm:px-12 mb-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <Badge variant="outline" className="text-[#9065d5] border-[#eadff6] mb-2 bg-[#f8f1ff]">
              Assistant Panel
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight text-[#2f243a] mb-2">
              Assistant Tasks
            </h1>
            <p className="text-[#5f5270] max-w-xl text-sm sm:text-base">
              Assigned work ready for production.
            </p>
          </div>
          <Button variant="outline" onClick={() => void loadTasks()} className="border-[#eadff6] bg-white hover:bg-[#f8f1ff]">
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh
          </Button>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-6 sm:px-12">

        {actionError ? (
          <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {actionError}
          </div>
        ) : null}

        {openTasks.length === 0 ? (
          <section className="rounded-lg border border-dashed bg-white p-8 text-center">
            <BriefcaseBusiness className="mx-auto size-8 text-muted-foreground" />
            <h2 className="mt-3 text-base font-semibold">No active assigned tasks</h2>
            <p className="mt-1 text-sm text-muted-foreground">New assignments will appear here after a Mangaka creates them.</p>
          </section>
        ) : (
          <div className="grid gap-3">
            {openTasks.map((task) => (
              <article key={task.id} className="rounded-lg border border-[#eadff6] bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        to={`/app/assistant/tasks/${task.id}`}
                        className="text-base font-semibold text-[#2f243a] hover:text-primary"
                      >
                        {task.title}
                      </Link>
                      <Badge variant="outline">{task.status}</Badge>
                      <span className={`rounded-sm px-2 py-0.5 text-xs font-semibold ${priorityClassName[task.priority]}`}>
                        {task.priority}
                      </span>
                    </div>
                    <p className="mt-2 max-w-3xl text-sm leading-5 text-muted-foreground">{task.description}</p>
                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span>Type {task.type}</span>
                      <span>Page {task.pageId}</span>
                      {task.regionId ? <span>Region {task.regionId}</span> : null}
                      {task.dueDate ? <span>Due {new Date(task.dueDate).toLocaleDateString()}</span> : null}
                      <span>Rate {formatMoney(task.baseRate + task.bonusAmount)}</span>
                    </div>
                  </div>
                  <Button
                    onClick={() => void handleStart(task.id)}
                    disabled={task.status !== "TODO" || startingTaskId === task.id}
                  >
                    {startingTaskId === task.id ? <Loader2 className="animate-spin" /> : <Play />}
                    {task.status === "TODO" ? "Start" : "Started"}
                  </Button>
                  <Link to={`/app/assistant/tasks/${task.id}`}>
                    <Button variant="outline">Open</Button>
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
