import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Chapter, ProductionSeries } from "@/entities/series/model/series-types";
import type { StudioTask, StudioTaskStatus } from "@/entities/series/model/studio-types";
import { REGION_TYPE_LABEL } from "@/entities/series/model/studio-types";
import {
  buildTaskContext,
  deadlineRisk,
  getTaskEdgeSummary,
  getTaskStatusLabel,
  getVisualTaskStatus,
  getVisualTaskStatusClass,
  priorityBadge,
  priorityLabel,
  TaskStatusSummary,
} from "@/entities/task";
import { useStudioTasksListQuery } from "@/features/series";
import { formatDate } from "@/shared/lib/format-date";
import {
  parseTableStateFromSearchParams,
  resetTableState,
  setTableFilter,
  tableStateToSearchParams,
  type TableState,
} from "@/shared/table";
import { PageHeader, SearchToolbar, ServerDataTable, StateBlock } from "@/shared/ui";
import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  useChaptersForSeriesQuery,
  useCommentsQuery,
  useMySeriesQuery,
} from "../../api/assistant-queries";
import { useAuth } from "@/shared/auth";
import { PageShell } from "@/shared/layout/page-layout";
import { OpenTaskStudioAction } from "./open-task-studio-action";
import { AssistantTaskDetailDrawer } from "./assistant-task-detail-drawer";

type StatusFilter = StudioTaskStatus | "ALL";
type PriorityFilter = StudioTask["priority"] | "ALL";

const PAGE_SIZE = 10;
const DEFAULT_TASK_TABLE_STATE: Partial<TableState> = {
  pageSize: PAGE_SIZE,
  sortBy: "dueAt",
  sortDir: "asc",
};

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "ALL", label: "All status" },
  { value: "TODO", label: "To do" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "SUBMITTED", label: "Submitted" },
  { value: "MANGAKA_REVISION_REQUESTED", label: "Revision requested" },
  { value: "MANGAKA_APPROVED", label: "Mangaka approved" },
  { value: "EDITOR_REVISION_REQUESTED", label: "Editor revision" },
  { value: "EDITOR_APPROVED", label: "Editor approved" },
  { value: "REJECTED", label: "Rejected" },
  { value: "CANCELLED", label: "Cancelled" },
];

const PRIORITY_FILTERS: { value: PriorityFilter; label: string }[] = [
  { value: "ALL", label: "All priority" },
  { value: "high", label: "High" },
  { value: "normal", label: "Normal" },
  { value: "low", label: "Low" },
];

function useTaskTableState() {
  const [tableState, setTableState] = useState(() =>
    parseTableStateFromSearchParams(
      typeof window === "undefined"
        ? new URLSearchParams()
        : new URLSearchParams(window.location.search),
      DEFAULT_TASK_TABLE_STATE,
    ),
  );

  useEffect(() => {
    const params = tableStateToSearchParams(tableState);
    const nextUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState(null, "", nextUrl);
  }, [tableState]);

  return [tableState, setTableState] as const;
}

function dueSoonFilter() {
  const sevenDays = new Date();
  sevenDays.setDate(sevenDays.getDate() + 7);
  return { type: "dateRange" as const, to: sevenDays.toISOString() };
}

function taskSeriesId(
  task: StudioTask,
  chapterById: Map<string, Chapter>,
  seriesById: Map<string, ProductionSeries>,
) {
  if (task.seriesId && seriesById.has(task.seriesId)) return task.seriesId;
  return chapterById.get(task.chapterId)?.seriesId;
}

export function MyTasksPage() {
  const user = useAuth((s) => s.user);
  const [tableState, setTableState] = useTaskTableState();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data: seriesList = [] } = useMySeriesQuery();
  const seriesIds = useMemo(() => seriesList.map((series) => series.id), [seriesList]);
  const { data: chapters = [] } = useChaptersForSeriesQuery(seriesIds);
  const { data: taskList, isLoading, isError, error } = useStudioTasksListQuery(tableState);
  const { data: comments = [] } = useCommentsQuery({});

  const tasks = taskList?.data ?? [];
  const pagination = taskList?.pagination ?? {
    page: tableState.page,
    pageSize: tableState.pageSize,
    total: 0,
  };
  const statusFilter =
    tableState.filters.status?.type === "select"
      ? (String(tableState.filters.status.value) as StatusFilter)
      : "ALL";
  const priorityFilter =
    tableState.filters.priority?.type === "select"
      ? (String(tableState.filters.priority.value) as PriorityFilter)
      : "ALL";
  const seriesFilter =
    tableState.filters.seriesId?.type === "select"
      ? String(tableState.filters.seriesId.value)
      : "ALL";
  const dueSoonOnly = tableState.filters.dueAt?.type === "dateRange";
  const sortValue = `${tableState.sortBy ?? "dueAt"}:${tableState.sortDir}`;
  const filtersActive =
    tableState.q.trim().length > 0 || Object.keys(tableState.filters).length > 0;

  const chapterById = useMemo(
    () => new Map(chapters.map((chapter) => [chapter.id, chapter])),
    [chapters],
  );
  const seriesById = useMemo(
    () => new Map(seriesList.map((series) => [series.id, series])),
    [seriesList],
  );
  const selected = selectedId ? tasks.find((task) => task.id === selectedId) : undefined;

  const columns = useMemo<ColumnDef<StudioTask, unknown>[]>(
    () => [
      {
        id: "title",
        header: "Task",
        cell: ({ row }) => {
          const task = row.original;
          const ctx = buildTaskContext(task, chapters, seriesList);
          const edgeSummary = getTaskEdgeSummary(task);
          return (
            <button
              type="button"
              onClick={() => setSelectedId(task.id)}
              className="min-w-56 text-left"
            >
              <p className="truncate font-semibold text-[var(--admin-ink)]">{task.title}</p>
              <p className="truncate text-[11px] text-[var(--admin-faint)]">
                {ctx.series?.title ?? "—"}
              </p>
              {edgeSummary ? (
                <p className="mt-0.5 truncate text-[10px] text-accent">{edgeSummary}</p>
              ) : null}
            </button>
          );
        },
      },
      {
        id: "seriesId",
        header: "Series",
        cell: ({ row }) => {
          const seriesId = taskSeriesId(row.original, chapterById, seriesById);
          return (
            <span className="text-[var(--admin-muted)]">
              {seriesId ? (seriesById.get(seriesId)?.title ?? seriesId) : "—"}
            </span>
          );
        },
      },
      {
        id: "chapterId",
        header: "Chapter / Page",
        cell: ({ row }) => {
          const ctx = buildTaskContext(row.original, chapters, seriesList);
          return (
            <span className="text-[var(--admin-muted)]">
              Ch.{ctx.chapter?.number ?? "—"} / P.{String(ctx.pageIndex ?? 0).padStart(2, "0")}
            </span>
          );
        },
      },
      {
        id: "type",
        header: "Type",
        cell: ({ row }) => (
          <span className="text-[var(--admin-muted)]">{REGION_TYPE_LABEL[row.original.type]}</span>
        ),
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => {
          const visualStatus = getVisualTaskStatus(row.original);
          return (
            <span
              className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${getVisualTaskStatusClass(visualStatus)}`}
            >
              {getTaskStatusLabel(visualStatus)}
            </span>
          );
        },
      },
      {
        id: "dueAt",
        header: "Due",
        cell: ({ row }) => {
          const risk = deadlineRisk(row.original.dueAt);
          return (
            <div className="flex flex-col">
              <span className="tabular-nums">{formatDate(row.original.dueAt)}</span>
              <span
                className={`text-[10px] font-semibold ${
                  risk.tone === "rose"
                    ? "text-rose-600"
                    : risk.tone === "amber"
                      ? "text-amber-700"
                      : "text-emerald-700"
                }`}
              >
                {risk.label}
              </span>
            </div>
          );
        },
      },
      {
        id: "priority",
        header: "Priority",
        cell: ({ row }) => (
          <span
            className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${priorityBadge(row.original.priority)}`}
          >
            {priorityLabel(row.original.priority)}
          </span>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex justify-end gap-1">
            <OpenTaskStudioAction
              task={row.original}
              className="rounded-[5px] bg-[var(--admin-navy)] px-2 py-1 text-[10px] font-semibold text-[var(--admin-cream)] hover:bg-[var(--admin-navy-light)] disabled:opacity-60"
            >
              Open
            </OpenTaskStudioAction>
            <button
              type="button"
              onClick={() => setSelectedId(row.original.id)}
              className="grid size-7 place-items-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Details"
            >
              <MoreHorizontal className="size-4" />
            </button>
          </div>
        ),
      },
    ],
    [chapterById, chapters, seriesById, seriesList],
  );

  if (!user) return null;

  if (isError) {
    return (
      <PageShell>
        <PageHeader
          eyebrow="Production"
          title="My tasks"
          description="Assigned work queue with task scope, status, deadline, feedback, and studio entry."
        />
        <StateBlock
          tone="danger"
          title="Could not load your tasks"
          description={
            error instanceof Error
              ? error.message
              : "Please try again after the backend is available."
          }
        />
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHeader
        eyebrow="Production"
        title="My tasks"
        description={`${pagination.total} assigned tasks, including deadlines, feedback, and processing status.`}
      />

      <TaskStatusSummary tasks={tasks} />

      <ServerDataTable
        data={tasks}
        columns={columns}
        getRowId={(task) => task.id}
        isLoading={isLoading}
        error={error}
        emptyTitle="You have no matching tasks"
        emptyDescription="When a Mangaka assigns work to you, it appears here. Try resetting filters if you expected tasks."
        skeletonRows={tableState.pageSize}
        toolbar={
          <SearchToolbar
            query={tableState.q}
            onQueryChange={(q) => setTableState((state) => ({ ...state, q, page: 1 }))}
            placeholder="Search tasks, type, instructions..."
            filters={
              <>
                <Select
                  value={statusFilter}
                  onValueChange={(value) =>
                    setTableState((state) =>
                      setTableFilter(
                        state,
                        "status",
                        value === "ALL" ? undefined : { type: "select", value },
                      ),
                    )
                  }
                >
                  <SelectTrigger className="h-10 w-[190px] rounded-[6px] border-[var(--admin-border)] bg-[var(--admin-surface)] text-[13px] shadow-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_FILTERS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={seriesFilter}
                  onValueChange={(value) =>
                    setTableState((state) =>
                      setTableFilter(
                        state,
                        "seriesId",
                        value === "ALL" ? undefined : { type: "select", value },
                      ),
                    )
                  }
                >
                  <SelectTrigger className="h-10 w-[180px] rounded-[6px] border-[var(--admin-border)] bg-[var(--admin-surface)] text-[13px] shadow-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All series</SelectItem>
                    {seriesList.map((series) => (
                      <SelectItem key={series.id} value={series.id}>
                        {series.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={priorityFilter}
                  onValueChange={(value) =>
                    setTableState((state) =>
                      setTableFilter(
                        state,
                        "priority",
                        value === "ALL" ? undefined : { type: "select", value },
                      ),
                    )
                  }
                >
                  <SelectTrigger className="h-10 w-[150px] rounded-[6px] border-[var(--admin-border)] bg-[var(--admin-surface)] text-[13px] shadow-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITY_FILTERS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={sortValue}
                  onValueChange={(value) => {
                    const [sortBy, sortDir] = value.split(":") as [string, "asc" | "desc"];
                    setTableState((state) => ({ ...state, sortBy, sortDir, page: 1 }));
                  }}
                >
                  <SelectTrigger className="h-10 w-[170px] rounded-[6px] border-[var(--admin-border)] bg-[var(--admin-surface)] text-[13px] shadow-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dueAt:asc">Due soonest</SelectItem>
                    <SelectItem value="dueAt:desc">Due latest</SelectItem>
                    <SelectItem value="priority:desc">Priority high</SelectItem>
                    <SelectItem value="updatedAt:desc">Recently updated</SelectItem>
                    <SelectItem value="title:asc">Task A-Z</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant={dueSoonOnly ? "default" : "outline"}
                  onClick={() =>
                    setTableState((state) =>
                      setTableFilter(state, "dueAt", dueSoonOnly ? undefined : dueSoonFilter()),
                    )
                  }
                  className="h-10 rounded-[6px] px-4 text-[13px]"
                >
                  Due soon
                </Button>
              </>
            }
            actions={
              <Button
                type="button"
                variant="outline"
                disabled={!filtersActive}
                onClick={() => setTableState(resetTableState(DEFAULT_TASK_TABLE_STATE))}
                className="h-10 gap-2 rounded-[6px] border-[var(--admin-border)] bg-[var(--admin-surface)] px-4 text-[13px] shadow-sm"
              >
                <RotateCcw className="size-4" />
                Reset
              </Button>
            }
          />
        }
        pagination={{
          total: pagination.total,
          page: pagination.page,
          pageSize: pagination.pageSize,
          onPageChange: (page) => setTableState((state) => ({ ...state, page })),
          itemName: "tasks",
        }}
      />

      <AssistantTaskDetailDrawer
        task={selected}
        chapters={chapters}
        seriesList={seriesList}
        comments={comments}
        open={!!selected}
        onOpenChange={(open) => !open && setSelectedId(null)}
      />
    </PageShell>
  );
}
