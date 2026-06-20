import { createFileRoute } from "@tanstack/react-router";
import { Search, ChevronDown, MoreVertical } from "lucide-react";
import { useState } from "react";
import { useTasksBySeries } from "@/shared/queries/useTasks";
import type { Task } from "@/entities/task/model";

export const Route = createFileRoute("/app/series/$id/tasks")({
  component: TasksPage,
});

function TasksPage() {
  const { id } = Route.useParams();
  const { data: tasks, isLoading } = useTasksBySeries(id);
  const [search, setSearch] = useState("");

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "in-progress":
      case "in_progress":
        return (
          <span className="rounded bg-blue-100 px-2 py-1 text-[10px] font-bold text-blue-600 uppercase tracking-wider">
            In progress
          </span>
        );
      case "submitted":
        return (
          <span className="rounded bg-indigo-100 px-2 py-1 text-[10px] font-bold text-indigo-600 uppercase tracking-wider">
            Waiting Mangaka review
          </span>
        );
      case "mangaka-approved":
      case "mangaka_approved":
        return (
          <span className="rounded bg-emerald-100 px-2 py-1 text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
            Waiting Editor final review
          </span>
        );
      case "editor-approved":
      case "editor_approved":
        return (
          <span className="rounded bg-emerald-100 px-2 py-1 text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
            Final approved
          </span>
        );
      case "revision-requested":
      case "revision_requested":
        return (
          <span className="rounded bg-orange-100 px-2 py-1 text-[10px] font-bold text-orange-600 uppercase tracking-wider">
            Revision requested
          </span>
        );
      case "rejected":
        return (
          <span className="rounded bg-red-100 px-2 py-1 text-[10px] font-bold text-red-600 uppercase tracking-wider">
            Rejected
          </span>
        );
      case "cancelled":
        return (
          <span className="rounded bg-slate-200 px-2 py-1 text-[10px] font-bold text-slate-700 uppercase tracking-wider">
            Cancelled
          </span>
        );
      case "pending":
      case "todo":
      default:
        return (
          <span className="rounded bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-600 uppercase tracking-wider border border-border">
            Assigned
          </span>
        );
    }
  };

  const getPriority = (priorityStr: string) => {
    if (priorityStr === "high" || priorityStr === "HIGH")
      return { label: "High", color: "bg-red-500" };
    if (priorityStr === "medium" || priorityStr === "MEDIUM")
      return { label: "Medium", color: "bg-orange-500" };
    return { label: "Low", color: "bg-emerald-500" };
  };

  const getSubmission = (status: string) => {
    if (status === "pending") return "—";
    if (status === "in-progress") return "v1 draft";
    if (status === "submitted") return "v1 submitted";
    if (status === "editor-approved" || status === "mangaka-approved") return "approved";
    if (status === "rejected") return "needs revision";
    return "—";
  };

  const getActionBtn = (status: string) => {
    if (status === "pending") return "Start";
    if (status === "in-progress") return "Open";
    if (status === "submitted") return "Review";
    if (status === "rejected") return "Open";
    if (status === "editor-approved" || status === "mangaka-approved") return "View";
    return "Open";
  };

  if (isLoading || !tasks) {
    return <div className="p-8 text-center text-foreground/50 text-sm">Loading tasks...</div>;
  }

  const filteredTasks = tasks.filter(
    (t: Task) =>
      t.title?.toLowerCase().includes(search.toLowerCase()) ||
      t.assigneeName?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="mx-auto max-w-7xl pb-12">
      {/* Main Content Area */}
      <div className="rounded-xl border border-[#E5DFD3] bg-card dark:border-border overflow-hidden shadow-sm mt-6">
        {/* Header */}
        <div className="p-6 pb-5 border-b border-[#E5DFD3] dark:border-border">
          <h2 className="text-xl font-bold tracking-tight text-foreground">All Tasks</h2>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Region and page tasks created from Page Studio and chapter workflow.
          </p>

          {/* Top Filter Bar */}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search task by title, assignee..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 w-full rounded-md border border-border bg-background pl-9 pr-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {["Chapter", "Page", "Status", "Task Type", "Assignee"].map((filter) => (
                <button
                  key={filter}
                  className="flex h-9 items-center gap-2 rounded-md border border-border bg-background px-3 text-[12px] font-medium text-foreground hover:bg-accent dark:hover:bg-muted"
                >
                  {filter}
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-[#E5DFD3] dark:border-border text-muted-foreground bg-[#FCFAEF]/50 dark:bg-muted/20">
                <th className="px-6 py-3.5 font-semibold">Task</th>
                <th className="px-6 py-3.5 font-semibold">Assignee</th>
                <th className="px-6 py-3.5 font-semibold">Status</th>
                <th className="px-6 py-3.5 font-semibold">Due Date</th>
                <th className="px-6 py-3.5 font-semibold">Submission</th>
                <th className="px-6 py-3.5 font-semibold">Priority</th>
                <th className="px-6 py-3.5 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5DFD3] dark:divide-border">
              {filteredTasks.map((task: Task, idx: number) => {
                const title = task.title || "Untitled Task";
                const staffName = task.assigneeName || "Unassigned";
                const initial =
                  staffName !== "Unassigned" ? staffName.charAt(0).toUpperCase() : "?";
                const priority = getPriority(task.priority || "medium");

                const rowHighlight = idx === 0 ? "bg-[#FCFAEF] dark:bg-muted/20" : "bg-transparent";

                return (
                  <tr
                    key={task.id}
                    className={`transition-colors hover:bg-[#F5EFE6] dark:hover:bg-muted/30 ${rowHighlight} group`}
                  >
                    <td className="px-6 py-4 font-bold text-foreground">{title}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-200 text-[11px] font-bold text-slate-600 dark:bg-slate-700 dark:text-slate-200">
                          {initial}
                        </div>
                        <span className="font-medium text-foreground">{staffName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(task.status)}</td>
                    <td className="px-6 py-4 font-medium text-foreground">
                      {task.deadline ? task.deadline : "—"}
                    </td>
                    <td className="px-6 py-4 font-medium text-foreground">
                      {getSubmission(task.status)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 font-medium text-foreground">
                        <div className={`h-2 w-2 rounded-full ${priority.color}`} />
                        {priority.label}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button className="rounded-md border border-[#E5DFD3] bg-[#F5EFE6] px-4 py-1.5 text-[12px] font-bold text-foreground shadow-sm hover:bg-[#EAE4D8] dark:border-border dark:bg-muted dark:hover:bg-muted/80">
                          {getActionBtn(task.status)}
                        </button>
                        <button className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-[#EAE4D8] dark:hover:bg-muted">
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredTasks.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">
                    No tasks found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="flex items-center justify-between border-t border-[#E5DFD3] p-4 px-6 text-[13px] text-muted-foreground dark:border-border bg-[#FCFAEF]/30 dark:bg-muted/10">
          <div>
            Showing 1-{filteredTasks.length} of {tasks.length} tasks
          </div>
          <div className="flex items-center gap-1">
            <button className="flex h-8 w-8 items-center justify-center rounded-md border border-[#E5DFD3] bg-background hover:bg-[#F5EFE6] dark:border-border dark:bg-muted/50 dark:hover:bg-muted">
              &lt;
            </button>
            <button className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-900 font-medium text-white shadow-sm dark:bg-white dark:text-slate-900">
              1
            </button>
            <button className="flex h-8 w-8 items-center justify-center rounded-md border border-[#E5DFD3] bg-background hover:bg-[#F5EFE6] dark:border-border dark:bg-muted/50 dark:hover:bg-muted">
              &gt;
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span>Rows per page:</span>
            <button className="flex h-8 items-center gap-1 rounded-md border border-[#E5DFD3] bg-background px-2 hover:bg-[#F5EFE6] dark:border-border dark:bg-muted/50 dark:hover:bg-muted">
              10 <ChevronDown className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
