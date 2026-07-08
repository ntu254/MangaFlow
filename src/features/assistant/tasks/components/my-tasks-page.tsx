import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { deadlineRisk, TaskStatusSummary } from "@/entities/task";
import {
  useChaptersForSeriesQuery,
  useCommentsQuery,
  useMySeriesQuery,
  useStudioTasksQuery,
} from "../../api/assistant-queries";
import { tasksForAssistant } from "../../model/assistant-access";
import { useAuth } from "@/shared/auth";
import { GridSkeleton, PageShell } from "@/shared/layout/page-layout";
import { DataTable, PageHeader, SearchToolbar, StateBlock, TextButton } from "@/shared/ui";
import { RotateCcw } from "lucide-react";
import { useMemo, useState } from "react";
import { AssistantTaskDetailDrawer } from "./assistant-task-detail-drawer";
import { AssistantTaskTable } from "./assistant-task-table";

import { getVisualTaskStatus, type VisualTaskStatus } from "@/entities/task";

type TabKey = "ALL" | VisualTaskStatus;

const TABS: { key: TabKey; label: string }[] = [
  { key: "ALL", label: "Tất cả" },
  { key: "TODO", label: "To do" },
  { key: "IN_PROGRESS", label: "In progress" },
  { key: "SUBMITTED", label: "Submitted" },
  { key: "MANGAKA_REVISION_REQUESTED", label: "Revision" },
  { key: "EDITOR_REVISION_REQUESTED", label: "Editor Revision" },
  { key: "MANGAKA_APPROVED", label: "Approved" },
  { key: "EDITOR_APPROVED", label: "Editor Approved" },
  { key: "BLOCKED", label: "Blocked" },
  { key: "OVERDUE", label: "Overdue" },
  { key: "REASSIGNED", label: "Reassigned" },
  { key: "CANCELLED", label: "Cancelled" },
];

export function MyTasksPage() {
  const user = useAuth((s) => s.user);
  const { data: seriesList = [] } = useMySeriesQuery();
  const seriesIds = useMemo(() => seriesList.map((series) => series.id), [seriesList]);
  const { data: chapters = [] } = useChaptersForSeriesQuery(seriesIds);
  const {
    data: tasks = [],
    isLoading: tasksLoading,
    isError: tasksError,
    error,
  } = useStudioTasksQuery({
    assigneeId: user?.id ?? "",
  });
  const { data: comments = [] } = useCommentsQuery({});
  const [tab, setTab] = useState<TabKey>("ALL");
  const [query, setQuery] = useState("");
  const [seriesFilter, setSeriesFilter] = useState<string>("ALL");
  const [priority, setPriority] = useState<string>("ALL");
  const [dueSoonOnly, setDueSoonOnly] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const mine = useMemo(() => (user ? tasksForAssistant(tasks, user.id) : []), [tasks, user]);

  const filtered = useMemo(() => {
    return mine
      .filter((t) => tab === "ALL" || getVisualTaskStatus(t) === tab)
      .filter((t) => (priority === "ALL" ? true : t.priority === priority))
      .filter((t) => (dueSoonOnly ? deadlineRisk(t.dueAt).tone !== "emerald" : true))
      .filter((t) => {
        if (seriesFilter === "ALL") return true;
        const c = chapters.find((c) => c.id === t.chapterId);
        return c?.seriesId === seriesFilter;
      })
      .filter((t) => (query ? t.title.toLowerCase().includes(query.toLowerCase()) : true));
  }, [mine, tab, priority, dueSoonOnly, seriesFilter, query, chapters]);

  const selected = selectedId ? mine.find((t) => t.id === selectedId) : undefined;
  const filtersActive =
    tab !== "ALL" ||
    query.trim().length > 0 ||
    seriesFilter !== "ALL" ||
    priority !== "ALL" ||
    dueSoonOnly;

  const clearFilters = () => {
    setTab("ALL");
    setQuery("");
    setSeriesFilter("ALL");
    setPriority("ALL");
    setDueSoonOnly(false);
  };

  if (!user) return null;

  if (tasksError) {
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
        description={`${mine.length} task được giao, bao gồm deadline, feedback và trạng thái xử lý.`}
      />

      <TaskStatusSummary tasks={mine} />

      <div className="space-y-4">
        <SearchToolbar
          query={query}
          onQueryChange={setQuery}
          placeholder="Tìm task..."
          filters={
            <>
              <Select value={seriesFilter} onValueChange={setSeriesFilter}>
                <SelectTrigger
                  aria-label="Filter by series"
                  className="h-10 w-44 rounded-[6px] border-[var(--admin-border)] bg-[var(--admin-surface)] text-[13px]"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tất cả series</SelectItem>
                  {seriesList.map((series) => (
                    <SelectItem key={series.id} value={series.id}>
                      {series.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger
                  aria-label="Filter by priority"
                  className="h-10 w-40 rounded-[6px] border-[var(--admin-border)] bg-[var(--admin-surface)] text-[13px]"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tất cả priority</SelectItem>
                  <SelectItem value="high">Cao</SelectItem>
                  <SelectItem value="normal">Bình thường</SelectItem>
                  <SelectItem value="low">Thấp</SelectItem>
                </SelectContent>
              </Select>
              <TextButton
                aria-pressed={dueSoonOnly}
                onClick={() => setDueSoonOnly((value) => !value)}
                className={
                  dueSoonOnly
                    ? "border-[var(--admin-navy)] bg-[var(--admin-navy)] text-[var(--admin-cream)] hover:bg-[var(--admin-navy-light)]"
                    : undefined
                }
              >
                Due soon
              </TextButton>
            </>
          }
          actions={
            <div className="flex items-center gap-2">
              {filtersActive ? (
                <button
                  type="button"
                  onClick={clearFilters}
                  aria-label="Clear task filters"
                  title="Clear filters"
                  className="grid size-10 place-items-center rounded-[6px] border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-muted)] hover:bg-[var(--admin-hover)]"
                >
                  <RotateCcw className="size-4" />
                </button>
              ) : null}
            </div>
          }
        />

        <div className="flex gap-1 overflow-x-auto border-b border-[var(--admin-border)]">
          {TABS.map((t) => (
            <button
              type="button"
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`-mb-px shrink-0 border-b-2 px-3 py-2 text-[12px] font-semibold ${
                tab === t.key
                  ? "border-[var(--admin-navy)] text-[var(--admin-ink)]"
                  : "border-transparent text-[var(--admin-faint)] hover:text-[var(--admin-ink)]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tasksLoading ? (
          <DataTable isLoading skeletonRows={5} skeletonColumns={9} />
        ) : filtered.length === 0 ? (
          <DataTable
            isEmpty
            emptyTitle={
              mine.length === 0 ? "Bạn chưa có task nào được giao" : "Không có task khớp filter"
            }
            emptyDescription={
              mine.length === 0
                ? "Khi Mangaka tạo task mới và assign cho bạn, task sẽ hiển thị tại đây."
                : "Thử thay đổi trạng thái hoặc bộ lọc tìm kiếm."
            }
          />
        ) : (
          <DataTable>
            <AssistantTaskTable
              tasks={filtered}
              chapters={chapters}
              seriesList={seriesList}
              onSelect={setSelectedId}
            />
          </DataTable>
        )}
      </div>

      <AssistantTaskDetailDrawer
        task={selected}
        chapters={chapters}
        seriesList={seriesList}
        comments={comments}
        open={!!selected}
        onOpenChange={(o) => !o && setSelectedId(null)}
      />
    </PageShell>
  );
}
