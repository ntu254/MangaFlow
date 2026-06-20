import { useEffect, useState } from "react";
import { PageHeader } from "@/layouts/AppShell";
import { currentUserByRole } from "@/entities";
import { useRole } from "@/shared/lib/role";
import { useMyTasks } from "@/shared/queries/useTasks";
import { TaskSummaryStrip } from "./TaskSummaryStrip";
import { TaskToolbar, type ViewMode } from "./TaskToolbar";
import { TaskKanban } from "./TaskKanban";
import { TaskList } from "./TaskList";
import { useTaskFilters } from "../hooks/useTaskFilters";
import { Inbox } from "lucide-react";

const VIEW_KEY = "assistant.tasks.view";

export function TasksWorkspace() {
  const { role } = useRole();
  const me = currentUserByRole[role];
  const isAssistant = role === "assistant";

  const { data: myTasksData, isLoading } = useMyTasks();
  const mine = myTasksData || [];

  const [view, setView] = useState<ViewMode>("kanban");
  const [showApproved, setShowApproved] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(VIEW_KEY);
    if (stored === "kanban" || stored === "list") setView(stored);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(VIEW_KEY, view);
  }, [view]);

  const { state, setters, options, filtered, hasActiveFilter, clear } = useTaskFilters(mine);

  const visible = showApproved ? filtered : filtered.filter((t) => t.status !== "approved");

  const title = isAssistant ? "My tasks" : "Tasks (read-only)";
  const description = isAssistant
    ? "Mọi task được giao cho bạn. Mở Task Studio để bắt đầu, nộp, hoặc xử lý revision."
    : "Tổng hợp task của team. Review và approve được thực hiện trong chapter workspace.";

  return (
    <div className="space-y-5">
      <PageHeader title={title} jp="アシスタント業務" description={description} />

      {isLoading ? (
        <div className="flex justify-center p-8 text-[13px] text-foreground/50">
          Loading tasks...
        </div>
      ) : (
        <>
          <TaskSummaryStrip tasks={mine} />

          <TaskToolbar
            search={state.search}
            setSearch={setters.setSearch}
            seriesOptions={options.seriesOptions}
            seriesFilter={state.seriesFilter}
            setSeriesFilter={setters.setSeriesFilter}
            typeOptions={options.typeOptions}
            typeFilter={state.typeFilter}
            setTypeFilter={setters.setTypeFilter}
            dueFilter={state.dueFilter}
            setDueFilter={setters.setDueFilter}
            showApproved={showApproved}
            setShowApproved={setShowApproved}
            view={view}
            setView={setView}
          />

          {mine.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 rounded-md border border-dashed border-foreground/15 bg-card py-20 text-foreground/55">
              <Inbox className="h-6 w-6" />
              <div className="text-[13px] font-medium text-foreground">Chưa có task nào</div>
              <div className="text-[12px]">Mangaka sẽ giao việc khi chapter sẵn sàng.</div>
            </div>
          ) : visible.length === 0 ? (
            <div className="flex items-center justify-between rounded-md border border-foreground/10 bg-card px-4 py-3 text-[12px] text-foreground/60">
              <span>No tasks match the current filters.</span>
              {hasActiveFilter && (
                <button
                  type="button"
                  onClick={clear}
                  className="rounded-md border border-foreground/15 bg-background px-2 py-1 text-[11px] font-medium text-foreground hover:bg-muted"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : view === "kanban" ? (
            <TaskKanban
              tasks={visible}
              showApproved={showApproved}
              showPayout={isAssistant}
              showAssignee={!isAssistant}
            />
          ) : (
            <TaskList tasks={visible} showPayout={isAssistant} showAssignee={!isAssistant} />
          )}
        </>
      )}
    </div>
  );
}
