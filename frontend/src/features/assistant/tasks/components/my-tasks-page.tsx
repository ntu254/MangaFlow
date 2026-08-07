import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TaskStatusSummary } from "@/entities/task";
import {
  useChaptersForSeriesQuery,
  useCommentsQuery,
  useMySeriesQuery,
  useStudioTasksQuery,
  useSubmissionsQuery,
} from "../../api/assistant-queries";
import { tasksForAssistant } from "../../model/assistant-access";
import { useAuth } from "@/shared/auth";
import { PageShell } from "@/shared/layout/page-layout";
import { PageHeader, SearchToolbar, StateBlock } from "@/shared/ui";
import { RotateCcw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AssistantTaskDetailDrawer } from "./assistant-task-detail-drawer";
import { AssistantTaskBoard, type BoardColumnKey } from "./assistant-task-board";

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
  const { data: submissions = [] } = useSubmissionsQuery({ assistantId: user?.id ?? "" });
  const { data: comments = [] } = useCommentsQuery({});
  const [query, setQuery] = useState("");
  const [seriesFilter, setSeriesFilter] = useState<string>("ALL");
  const [chapterFilter, setChapterFilter] = useState<string>("ALL");
  const [priority, setPriority] = useState<string>("ALL");
  const [hiddenColumns, setHiddenColumns] = useState<Set<BoardColumnKey>>(new Set());
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const mine = useMemo(() => (user ? tasksForAssistant(tasks, user.id) : []), [tasks, user]);

  const chaptersForSeries = useMemo(() => {
    return chapters
      .filter((c) => seriesFilter === "ALL" || c.seriesId === seriesFilter)
      .sort((a, b) => a.number - b.number);
  }, [chapters, seriesFilter]);

  const onSeriesChange = (value: string) => {
    setSeriesFilter(value);
    setChapterFilter("ALL");
  };

  const latestSubmissionByTask = useMemo(() => {
    const map = new Map<string, (typeof submissions)[number]>();
    for (const submission of submissions) {
      const current = map.get(submission.taskId);
      if (!current || submission.version > current.version) {
        map.set(submission.taskId, submission);
      }
    }
    return map;
  }, [submissions]);

  const filtered = useMemo(() => {
    return mine
      .filter((t) => (priority === "ALL" ? true : t.priority === priority))
      .filter((t) => {
        if (seriesFilter === "ALL") return true;
        const c = chapters.find((chapter) => chapter.id === t.chapterId);
        return c?.seriesId === seriesFilter;
      })
      .filter((t) => (chapterFilter === "ALL" ? true : t.chapterId === chapterFilter))
      .filter((t) => (query ? t.title.toLowerCase().includes(query.toLowerCase()) : true));
  }, [mine, priority, seriesFilter, chapterFilter, query, chapters]);

  const selected = selectedId ? mine.find((t) => t.id === selectedId) : undefined;
  const filtersActive =
    query.trim().length > 0 ||
    seriesFilter !== "ALL" ||
    chapterFilter !== "ALL" ||
    priority !== "ALL" ||
    hiddenColumns.size > 0;

  const clearFilters = () => {
    setQuery("");
    setSeriesFilter("ALL");
    setChapterFilter("ALL");
    setPriority("ALL");
    setHiddenColumns(new Set());
  };

  const toggleColumn = (key: BoardColumnKey) => {
    setHiddenColumns((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
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
        description={`${mine.length} assigned tasks across the production workflow.`}
      />

      <TaskStatusSummary tasks={mine} />

      <div className="space-y-4">
        <SearchToolbar
          query={query}
          onQueryChange={setQuery}
          placeholder="Search tasks..."
          filters={
            <>
              <Select value={seriesFilter} onValueChange={onSeriesChange}>
                <SelectTrigger
                  aria-label="Filter by series"
                  className="h-10 w-44 rounded-[6px] border-[var(--admin-border)] bg-[var(--admin-surface)] text-[13px]"
                >
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
              <Select value={chapterFilter} onValueChange={setChapterFilter}>
                <SelectTrigger
                  aria-label="Filter by chapter"
                  className="h-10 w-48 rounded-[6px] border-[var(--admin-border)] bg-[var(--admin-surface)] text-[13px]"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All chapters</SelectItem>
                  {chaptersForSeries.map((chapter) => (
                    <SelectItem key={chapter.id} value={chapter.id}>
                      Ch. {chapter.number}
                      {chapter.title ? ` · ${chapter.title}` : ""}
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
                  <SelectItem value="ALL">All priorities</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
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

        {tasksLoading ? (
          <div className="flex gap-3 overflow-x-auto pb-2">
            {[0, 1, 2].map((index) => (
              <div key={index} className="w-72 shrink-0 space-y-2">
                <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                <div className="space-y-2 rounded-lg border border-border/70 bg-muted/20 p-2">
                  <div className="h-24 animate-pulse rounded-md bg-muted" />
                  <div className="h-24 animate-pulse rounded-md bg-muted" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-md border border-dashed border-border bg-card/40 p-10 text-center text-sm text-muted-foreground">
            {mine.length === 0 ? (
              <>
                <p className="font-semibold text-foreground">No assigned tasks yet</p>
                <p className="mt-1 text-xs">New tasks assigned by a Mangaka will appear here.</p>
              </>
            ) : (
              <>
                <p className="font-semibold text-foreground">No tasks match the filters</p>
                <p className="mt-1 text-xs">Try changing the search or filter settings.</p>
              </>
            )}
          </div>
        ) : (
          <AssistantTaskBoard
            tasks={filtered}
            chapters={chapters}
            seriesList={seriesList}
            latestSubmissionByTask={latestSubmissionByTask}
            hiddenColumns={hiddenColumns}
            onToggleColumn={toggleColumn}
            onSelect={setSelectedId}
          />
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
