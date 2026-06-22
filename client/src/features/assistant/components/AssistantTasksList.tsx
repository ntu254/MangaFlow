import { useMemo, useState } from "react";
import { useRole } from "@/shared/lib/role";
import { currentUserByRole, type Task } from "@/entities";
import { PageHeader } from "@/layouts/AppShell";
import { useAssistantTasks } from "../hooks/useAssistantTasks";
import { AssistantTaskCard } from "./AssistantTaskCard";
import {
  KANBAN_COLUMNS,
  LIFECYCLE_META,
  normalizeStatus,
  type AssistantStatus,
} from "../lib/taskLifecycle";
import { Inbox, LayoutGrid, List, Search } from "lucide-react";
import { useTaskFilters } from "@/features/tasks/hooks/useTaskFilters";
import { readStorageString, writeStorageString } from "@/shared/lib/storage";

type TabKey = AssistantStatus | "all";
const TABS: { key: TabKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "todo", label: "To do" },
  { key: "in-progress", label: "In progress" },
  { key: "submitted", label: "Submitted" },
  { key: "revision-requested", label: "Revision" },
  { key: "editor-approved", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
];

const VIEW_KEY = "assistant.tasks.view";

export function AssistantTasksList() {
  const { role } = useRole();
  const me = currentUserByRole[role];
  const { mine, counts, query } = useAssistantTasks(me.id);

  const [tab, setTab] = useState<TabKey>("all");
  const [view, setView] = useState<"kanban" | "list">(() => {
    const stored = readStorageString(VIEW_KEY);
    return stored === "list" ? "list" : "kanban";
  });

  function changeView(v: "kanban" | "list") {
    setView(v);
    writeStorageString(VIEW_KEY, v);
  }

  const scoped = useMemo(
    () => (tab === "all" ? mine : mine.filter((t) => normalizeStatus(t.status) === tab)),
    [mine, tab],
  );

  const { state, setters, options, filtered, hasActiveFilter, clear } = useTaskFilters(scoped);

  return (
    <div className="space-y-5">
      <PageHeader
        title="My tasks"
        jp="マイタスク"
        description="Tasks assigned to you. Open Task Studio to start, submit, or address revisions."
      />

      <div className="flex flex-wrap items-center gap-1 border-b border-foreground/10 pb-2">
        {TABS.map((t) => {
          const active = tab === t.key;
          const count = counts[t.key as keyof typeof counts] ?? 0;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[12px] font-medium transition ${
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground/70 hover:bg-muted hover:text-foreground"
              }`}
            >
              {t.label}
              <span
                className={`inline-flex h-4 min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] tabular-nums ${
                  active
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-muted text-foreground/60"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-foreground/40" />
          <input
            value={state.search}
            onChange={(e) => setters.setSearch(e.target.value)}
            placeholder="Search title, series, chapter…"
            className="h-8 w-64 rounded-md border border-foreground/15 bg-background pl-8 pr-2 text-[12px] text-foreground placeholder:text-foreground/40 focus:border-foreground/30 focus:outline-none"
          />
        </div>
        <select
          value={state.seriesFilter}
          onChange={(e) => setters.setSeriesFilter(e.target.value)}
          className="h-8 rounded-md border border-foreground/15 bg-background px-2 text-[12px]"
        >
          <option value="all">All series</option>
          {options.seriesOptions.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
        <select
          value={state.typeFilter}
          onChange={(e) => setters.setTypeFilter(e.target.value)}
          className="h-8 rounded-md border border-foreground/15 bg-background px-2 text-[12px]"
        >
          <option value="all">All types</option>
          {options.typeOptions.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <select
          value={state.dueFilter}
          onChange={(e) => setters.setDueFilter(e.target.value as typeof state.dueFilter)}
          className="h-8 rounded-md border border-foreground/15 bg-background px-2 text-[12px]"
        >
          <option value="all">Any deadline</option>
          <option value="overdue">Overdue</option>
          <option value="week">Due in 7 days</option>
        </select>

        {hasActiveFilter && (
          <button
            type="button"
            onClick={clear}
            className="h-8 rounded-md border border-foreground/15 bg-background px-2 text-[11px] text-foreground/70 hover:bg-muted"
          >
            Clear
          </button>
        )}

        <div className="ml-auto inline-flex h-8 items-center rounded-md border border-foreground/15 bg-background p-0.5">
          <button
            type="button"
            onClick={() => changeView("kanban")}
            className={`inline-flex h-7 items-center gap-1 rounded px-2 text-[11px] font-medium transition ${
              view === "kanban"
                ? "bg-primary text-primary-foreground"
                : "text-foreground/70 hover:text-foreground"
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5" /> Kanban
          </button>
          <button
            type="button"
            onClick={() => changeView("list")}
            className={`inline-flex h-7 items-center gap-1 rounded px-2 text-[11px] font-medium transition ${
              view === "list"
                ? "bg-primary text-primary-foreground"
                : "text-foreground/70 hover:text-foreground"
            }`}
          >
            <List className="h-3.5 w-3.5" /> List
          </button>
        </div>
      </div>

      {query.isLoading ? (
        <div className="rounded-md border border-dashed border-foreground/15 bg-card py-16 text-center text-[12px] text-foreground/55">
          Loading assigned tasks…
        </div>
      ) : query.isError ? (
        <div className="rounded-md border border-destructive/20 bg-destructive/5 px-4 py-3 text-[12px] text-destructive">
          {query.error instanceof Error ? query.error.message : "Could not load assigned tasks."}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-md border border-dashed border-foreground/15 bg-card py-16 text-foreground/55">
          <Inbox className="h-5 w-5" />
          <div className="text-[13px] font-medium text-foreground">No tasks here</div>
          <div className="text-[12px]">Try changing the tab or clearing filters.</div>
        </div>
      ) : view === "kanban" ? (
        <KanbanView tasks={filtered} />
      ) : (
        <ListView tasks={filtered} />
      )}
    </div>
  );
}

function KanbanView({ tasks }: { tasks: Task[] }) {
  const cols = KANBAN_COLUMNS;
  const grouped: Record<AssistantStatus, Task[]> = {
    todo: [],
    "in-progress": [],
    submitted: [],
    "revision-requested": [],
    "mangaka-approved": [],
    "editor-approved": [],
    rejected: [],
    cancelled: [],
  };
  for (const t of tasks) grouped[normalizeStatus(t.status)].push(t);

  return (
    <div className="-mx-2 overflow-x-auto pb-2">
      <div
        className="mx-2 grid gap-3"
        style={{ gridTemplateColumns: `repeat(${cols.length}, minmax(280px, 1fr))` }}
      >
        {cols.map((key) => {
          const meta = LIFECYCLE_META[key];
          const items = grouped[key];
          return (
            <section
              key={key}
              className="flex min-h-[220px] flex-col rounded-md border border-foreground/10 bg-card"
            >
              <header className="flex items-center justify-between border-b border-foreground/10 px-3 py-2">
                <div>
                  <div className="text-[12px] font-semibold text-foreground">{meta.label}</div>
                  <div className="text-[10px] text-foreground/50">{meta.hint}</div>
                </div>
                <span className="rounded-full border border-foreground/15 bg-muted px-2 py-0.5 text-[11px] tabular-nums text-foreground/70">
                  {items.length}
                </span>
              </header>
              <div className="flex-1 space-y-2 p-2">
                {items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-1 py-8 text-foreground/40">
                    <Inbox className="h-4 w-4" />
                    <span className="text-[11px]">No tasks</span>
                  </div>
                ) : (
                  items.map((t, index) => (
                    <AssistantTaskCard key={taskRenderKey(t, index)} task={t} />
                  ))
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function ListView({ tasks }: { tasks: Task[] }) {
  return (
    <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
      {tasks.map((t) => (
        <AssistantTaskCard key={taskRenderKey(t)} task={t} />
      ))}
    </div>
  );
}

function taskRenderKey(task: Task, index = 0) {
  return (
    task.id || `${task.chapterId}-${task.pageId ?? "chapter"}-${task.title ?? task.type}-${index}`
  );
}
