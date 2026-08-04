// DESIGN CONTRACT — /app/mangaka/submissions/review queue
// THESIS: The mangaka review queue organizes assistant submissions into a space-optimized
// Chapter & Page production hierarchy (Series → Chapter → Page → Role Tasks) alongside a high-density
// flat register for power users.
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  ChevronRight,
  FileCheck2,
  RefreshCcw,
  RefreshCw,
  Search,
  SearchX,
  XCircle,
  Layers,
  List,
  Filter,
  BookOpen,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useAuth } from "@/shared/auth";
import {
  useStudioTasksQuery,
  useSubmissionsQuery,
  useMyChaptersQuery,
  useMySeriesQuery,
} from "@/features/series";
import { buildTaskContext } from "@/entities/task";
import { ReviewStatusPill } from "@/entities/submission";
import type { AssistantSubmission } from "@/entities/submission/model/assistant-types";
import { DataPagination, DataTable, SortableHeader, Surface } from "@/shared/ui";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { timeAgo } from "@/shared/lib/format-date";
import { useSortableData } from "@/shared/lib/use-sortable-data";

type Row = {
  sub: AssistantSubmission;
  taskTitle: string;
  seriesId?: string;
  seriesTitle: string;
  chapterId?: string;
  chapterNumber?: number;
  chapterTitle?: string;
  pageIndex?: number;
  assistantName: string;
};

type TabKey = "ALL" | "NEEDS_REVIEW" | "APPROVED" | "REVISION" | "REJECTED";
type ViewMode = "grouped" | "flat";

const PAGE_SIZE = 10;

const NEEDS_REVIEW_STATUSES = new Set(["PENDING"]);
const REVISION_STATUSES = new Set(["REVISION_REQUESTED"]);
const APPROVED_STATUSES = new Set(["MANGAKA_APPROVED"]);

function hasFile(sub: AssistantSubmission) {
  return Boolean(sub.fileUrl || sub.fileKey);
}

export function ReviewQueuePage() {
  const user = useAuth((s) => s.user);
  const queryClient = useQueryClient();
  const { data: submissions = [], isLoading } = useSubmissionsQuery({});
  const { data: tasks = [] } = useStudioTasksQuery({});
  const { data: chapters = [] } = useMyChaptersQuery();
  const { data: seriesList = [] } = useMySeriesQuery();

  const [tab, setTab] = useState<TabKey>("ALL");
  const [viewMode, setViewMode] = useState<ViewMode>("grouped");
  const [selectedSeriesId, setSelectedSeriesId] = useState<string>("ALL");
  const [selectedChapterId, setSelectedChapterId] = useState<string>("ALL");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const rows = useMemo<Row[]>(() => {
    return submissions.map((sub) => {
      const task = tasks.find((t) => t.id === sub.taskId);
      const ctx = task ? buildTaskContext(task, chapters, seriesList) : undefined;
      const assistantName = sub.assistantName || task?.assigneeName || sub.assistantId;
      return {
        sub,
        taskTitle: task?.title ?? sub.taskId,
        seriesId: ctx?.series?.id,
        seriesTitle: ctx?.series?.title ?? "—",
        chapterId: ctx?.chapter?.id,
        chapterNumber: ctx?.chapter?.number,
        chapterTitle: ctx?.chapter?.title,
        pageIndex: ctx?.pageIndex != null ? ctx.pageIndex + 1 : undefined,
        assistantName,
      };
    });
  }, [submissions, tasks, chapters, seriesList]);

  // Series & Chapter options
  const availableSeries = useMemo(() => {
    const map = new Map<string, string>();
    rows.forEach((r) => {
      if (r.seriesId && r.seriesTitle !== "—") {
        map.set(r.seriesId, r.seriesTitle);
      }
    });
    return Array.from(map.entries()).map(([id, title]) => ({ id, title }));
  }, [rows]);

  const availableChapters = useMemo(() => {
    const map = new Map<string, { id: string; number?: number; title?: string }>();
    rows.forEach((r) => {
      if (r.chapterId && (selectedSeriesId === "ALL" || r.seriesId === selectedSeriesId)) {
        map.set(r.chapterId, { id: r.chapterId, number: r.chapterNumber, title: r.chapterTitle });
      }
    });
    return Array.from(map.values()).sort((a, b) => (a.number ?? 0) - (b.number ?? 0));
  }, [rows, selectedSeriesId]);

  const counts = useMemo(
    () => ({
      ALL: rows.length,
      NEEDS_REVIEW: rows.filter((r) => NEEDS_REVIEW_STATUSES.has(r.sub.status)).length,
      APPROVED: rows.filter((r) => APPROVED_STATUSES.has(r.sub.status)).length,
      REVISION: rows.filter((r) => REVISION_STATUSES.has(r.sub.status)).length,
      REJECTED: rows.filter((r) => r.sub.status === "REJECTED").length,
    }),
    [rows],
  );

  const tabbed = useMemo(() => {
    if (tab === "NEEDS_REVIEW") return rows.filter((r) => NEEDS_REVIEW_STATUSES.has(r.sub.status));
    if (tab === "APPROVED") return rows.filter((r) => APPROVED_STATUSES.has(r.sub.status));
    if (tab === "REVISION") return rows.filter((r) => REVISION_STATUSES.has(r.sub.status));
    if (tab === "REJECTED") return rows.filter((r) => r.sub.status === "REJECTED");
    return rows;
  }, [rows, tab]);

  const seriesFiltered = useMemo(() => {
    let list = tabbed;
    if (selectedSeriesId !== "ALL") {
      list = list.filter((r) => r.seriesId === selectedSeriesId);
    }
    if (selectedChapterId !== "ALL") {
      list = list.filter((r) => r.chapterId === selectedChapterId);
    }
    return list;
  }, [tabbed, selectedSeriesId, selectedChapterId]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return seriesFiltered;
    return seriesFiltered.filter(
      (row) =>
        row.taskTitle.toLowerCase().includes(needle) ||
        row.seriesTitle.toLowerCase().includes(needle) ||
        row.assistantName.toLowerCase().includes(needle) ||
        row.sub.assistantId.toLowerCase().includes(needle) ||
        row.sub.versionLabel.toLowerCase().includes(needle),
    );
  }, [seriesFiltered, query]);

  const { sorted, sortKey, sortDirection, toggleSort } = useSortableData(
    filtered,
    {
      task: (row) => row.taskTitle,
      assistant: (row) => row.assistantName,
      version: (row) => row.sub.version,
      status: (row) => row.sub.status,
      submitted: (row) => (row.sub.submittedAt ? new Date(row.sub.submittedAt) : undefined),
    },
    { key: "submitted", direction: "desc" },
  );

  useEffect(() => {
    setPage(1);
  }, [query, tab, selectedSeriesId, selectedChapterId]);

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
    if (page > totalPages) setPage(totalPages);
  }, [page, sorted.length]);

  const paged = useMemo(
    () => sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [sorted, page],
  );

  const tabs: { key: TabKey; label: string; count: number }[] = [
    { key: "ALL", label: "All", count: counts.ALL },
    { key: "NEEDS_REVIEW", label: "Needs review", count: counts.NEEDS_REVIEW },
    { key: "APPROVED", label: "Approved", count: counts.APPROVED },
    { key: "REVISION", label: "Revision", count: counts.REVISION },
    { key: "REJECTED", label: "Rejected", count: counts.REJECTED },
  ];

  if (!user) return null;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col gap-4 border-b border-border/60 pb-5 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-serif text-2xl font-bold tracking-tight text-foreground">
              Review Queue
            </h1>
            <span className="rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-[10px] font-bold text-primary">
              Mangaka Studio
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Monitor assistant submissions grouped by Chapter & Page hierarchy or flat queue.
          </p>
        </div>

        <button
          type="button"
          onClick={() => queryClient.invalidateQueries()}
          className="inline-flex items-center gap-1.5 self-start rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-semibold text-foreground shadow-2xs transition-colors hover:bg-muted md:self-auto cursor-pointer"
        >
          <RefreshCw className="size-3.5 text-primary" />
          Refresh
        </button>
      </div>

      {/* Metric Strip */}
      <div className="grid grid-cols-2 gap-3 rounded-2xl border border-border/80 bg-card/60 p-3.5 text-xs sm:grid-cols-4 backdrop-blur-xs shadow-2xs">
        <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-background/80 p-3 shadow-2xs">
          <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-rose-500/10 text-rose-500">
            <FileCheck2 className="size-4" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Needs Review</p>
            <p className="text-lg font-bold tracking-tight tabular-nums">{counts.NEEDS_REVIEW}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-background/80 p-3 shadow-2xs">
          <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-emerald-500/10 text-emerald-500">
            <CheckCircle2 className="size-4" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Approved</p>
            <p className="text-lg font-bold tracking-tight tabular-nums">{counts.APPROVED}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-background/80 p-3 shadow-2xs">
          <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-amber-500/10 text-amber-500">
            <RefreshCcw className="size-4" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Revision</p>
            <p className="text-lg font-bold tracking-tight tabular-nums">{counts.REVISION}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-background/80 p-3 shadow-2xs">
          <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-indigo-500/10 text-indigo-500">
            <XCircle className="size-4" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Rejected</p>
            <p className="text-lg font-bold tracking-tight tabular-nums">{counts.REJECTED}</p>
          </div>
        </div>
      </div>

      <Surface className="space-y-4 overflow-hidden rounded-2xl border-border/80 p-5 shadow-xs backdrop-blur-xs">
        {/* Filters & View Switcher Bar */}
        <div className="flex flex-col gap-3.5 border-b border-border/60 pb-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            {/* Status Tabs */}
            <div className="flex flex-wrap items-center gap-1 rounded-xl bg-muted/60 p-1 text-xs font-medium border border-border/60">
              {tabs.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => {
                    setTab(item.key);
                    setPage(1);
                  }}
                  aria-pressed={tab === item.key}
                  className={`rounded-lg px-3 py-1.5 text-xs transition-all cursor-pointer ${
                    tab === item.key
                      ? "bg-background text-foreground shadow-2xs font-bold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {item.label}
                  <span className={`ml-1 ${tab === item.key ? "font-bold text-primary" : "text-muted-foreground"}`}>
                    ({item.count})
                  </span>
                </button>
              ))}
            </div>

            {/* View Mode Switcher */}
            <div className="flex items-center gap-1 rounded-xl bg-muted/60 p-1 border border-border/60 self-start lg:self-auto">
              <button
                type="button"
                onClick={() => setViewMode("grouped")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                  viewMode === "grouped"
                    ? "bg-background text-primary shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Layers className="size-3.5" />
                Chapter / Page View
              </button>
              <button
                type="button"
                onClick={() => setViewMode("flat")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                  viewMode === "flat"
                    ? "bg-background text-primary shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <List className="size-3.5" />
                Flat Table View
              </button>
            </div>
          </div>

          {/* Quick Dropdown Selectors (Series, Chapter) & Search */}
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
            {availableSeries.length > 0 && (
              <div className="flex items-center gap-1.5">
                <Filter className="size-3.5 text-muted-foreground shrink-0" />
                <select
                  value={selectedSeriesId}
                  onChange={(e) => {
                    setSelectedSeriesId(e.target.value);
                    setSelectedChapterId("ALL");
                  }}
                  className="h-9 rounded-xl border border-border/80 bg-background/80 px-3 text-xs font-bold text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary shadow-2xs"
                >
                  <option value="ALL">All Series ({availableSeries.length})</option>
                  {availableSeries.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {availableChapters.length > 0 && (
              <select
                value={selectedChapterId}
                onChange={(e) => setSelectedChapterId(e.target.value)}
                className="h-9 rounded-xl border border-border/80 bg-background/80 px-3 text-xs font-bold text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary shadow-2xs"
              >
                <option value="ALL">All Chapters</option>
                {availableChapters.map((c) => (
                  <option key={c.id} value={c.id}>
                    Ch. {c.number ?? "—"}: {c.title || "Untitled Chapter"}
                  </option>
                ))}
              </select>
            )}

            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search task title, assistant, version..."
                aria-label="Search submissions"
                className="h-9 w-full rounded-xl border border-border/80 bg-background/80 pl-9 pr-3 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary shadow-2xs"
              />
            </div>
          </div>
        </div>

        {/* Content View Modes */}
        {viewMode === "grouped" ? (
          <GroupedQueueView
            rows={sorted}
            isLoading={isLoading}
          />
        ) : (
          <>
            <div className="hidden lg:block">
              <DataTable
                isLoading={isLoading}
                isEmpty={sorted.length === 0}
                emptyTitle="No submissions in this view"
                emptyDescription="Adjust the status tab or search query."
                className="shadow-none border-none"
                stateClassName="min-h-[220px]"
              >
                <Table className="text-xs">
                  <TableHeader className="bg-muted/40 uppercase tracking-wider text-[10px] font-semibold text-muted-foreground border-b border-border">
                    <TableRow>
                      <TableHead className="min-w-[220px]">
                        <SortableHeader
                          label="Task"
                          sortKey="task"
                          activeSortKey={sortKey}
                          direction={sortDirection}
                          onSort={toggleSort}
                        />
                      </TableHead>
                      <TableHead>
                        <SortableHeader
                          label="Assistant"
                          sortKey="assistant"
                          activeSortKey={sortKey}
                          direction={sortDirection}
                          onSort={toggleSort}
                        />
                      </TableHead>
                      <TableHead>
                        <SortableHeader
                          label="Version"
                          sortKey="version"
                          activeSortKey={sortKey}
                          direction={sortDirection}
                          onSort={toggleSort}
                        />
                      </TableHead>
                      <TableHead>
                        <SortableHeader
                          label="Status"
                          sortKey="status"
                          activeSortKey={sortKey}
                          direction={sortDirection}
                          onSort={toggleSort}
                        />
                      </TableHead>
                      <TableHead>
                        <SortableHeader
                          label="Submitted"
                          sortKey="submitted"
                          activeSortKey={sortKey}
                          direction={sortDirection}
                          onSort={toggleSort}
                        />
                      </TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-border">
                    {paged.map((row) => (
                      <QueueRow key={row.sub.id} row={row} />
                    ))}
                  </TableBody>
                </Table>
                <DataPagination
                  total={sorted.length}
                  page={page}
                  pageSize={PAGE_SIZE}
                  onPageChange={setPage}
                  itemName="submissions"
                />
              </DataTable>
            </div>

            <div className="space-y-3 lg:hidden">
              {isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="h-32 rounded-xl bg-muted/30 animate-pulse" />
                  ))}
                </div>
              ) : sorted.length === 0 ? (
                <EmptyQueueState
                  icon={<SearchX className="size-5" />}
                  title="No submissions in this view"
                  description="Adjust the status tab or search query."
                />
              ) : (
                <>
                  <div className="grid min-w-0 gap-3">
                    {paged.map((row) => (
                      <MobileQueueCard key={row.sub.id} row={row} />
                    ))}
                  </div>
                  <MobilePagination
                    total={sorted.length}
                    page={page}
                    pageSize={PAGE_SIZE}
                    onPageChange={setPage}
                  />
                </>
              )}
            </div>
          </>
        )}
      </Surface>
    </div>
  );
}

// Grouped Chapter & Page Matrix Component
function GroupedQueueView({
  rows,
  isLoading,
}: {
  rows: Row[];
  isLoading?: boolean;
}) {
  const chapterGroups = useMemo(() => {
    const map = new Map<
      string,
      {
        chapterKey: string;
        seriesTitle: string;
        chapterNumber?: number;
        chapterTitle?: string;
        rows: Row[];
      }
    >();

    rows.forEach((r) => {
      const key = r.chapterId ?? `${r.seriesTitle}-ch-${r.chapterNumber ?? 0}`;
      if (!map.has(key)) {
        map.set(key, {
          chapterKey: key,
          seriesTitle: r.seriesTitle,
          chapterNumber: r.chapterNumber,
          chapterTitle: r.chapterTitle,
          rows: [],
        });
      }
      map.get(key)!.rows.push(r);
    });

    return Array.from(map.values()).sort((a, b) => (a.chapterNumber ?? 0) - (b.chapterNumber ?? 0));
  }, [rows]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-36 rounded-2xl bg-muted/30 animate-pulse" />
        ))}
      </div>
    );
  }

  if (chapterGroups.length === 0) {
    return (
      <EmptyQueueState
        icon={<SearchX className="size-5" />}
        title="No submissions found"
        description="Try clearing search query or changing filters."
      />
    );
  }

  return (
    <div className="space-y-5">
      {chapterGroups.map((group) => {
        const total = group.rows.length;
        const approved = group.rows.filter((r) => APPROVED_STATUSES.has(r.sub.status)).length;
        const isComplete = total > 0 && approved === total;

        // Group rows inside chapter by pageIndex
        const pageMap = new Map<string, { pageIndex?: number; rows: Row[] }>();
        group.rows.forEach((r) => {
          const pKey = r.pageIndex != null ? `page-${r.pageIndex}` : "general";
          if (!pageMap.has(pKey)) {
            pageMap.set(pKey, { pageIndex: r.pageIndex, rows: [] });
          }
          pageMap.get(pKey)!.rows.push(r);
        });
        const pageGroups = Array.from(pageMap.values()).sort(
          (a, b) => (a.pageIndex ?? 999) - (b.pageIndex ?? 999),
        );

        return (
          <div
            key={group.chapterKey}
            className="rounded-2xl border border-border/80 bg-card/60 p-4 sm:p-5 shadow-2xs backdrop-blur-xs space-y-4"
          >
            {/* Chapter Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-border/60 pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="grid size-8 place-items-center rounded-xl bg-primary/10 text-primary font-bold">
                  <BookOpen className="size-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      {group.seriesTitle}
                    </span>
                    <span className="rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-[10px] font-bold text-primary tabular-nums">
                      Ch. {group.chapterNumber ?? "—"}
                    </span>
                  </div>
                  <h3 className="text-sm font-serif font-bold text-foreground">
                    {group.chapterTitle || `Chapter ${group.chapterNumber ?? ""}`}
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-semibold text-muted-foreground">
                  {total} submission{total > 1 ? "s" : ""}
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border tabular-nums ${
                    isComplete
                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                      : "bg-amber-500/10 border-amber-500/20 text-amber-500"
                  }`}
                >
                  {approved} / {total} Approved
                </span>
              </div>
            </div>

            {/* Pages Grid / List */}
            <div className="space-y-3.5">
              {pageGroups.map((pg, pIdx) => {
                const pageApproved = pg.rows.filter((r) => APPROVED_STATUSES.has(r.sub.status)).length;
                const pageTotal = pg.rows.length;

                return (
                  <div
                    key={pIdx}
                    className="rounded-xl border border-border/60 bg-background/60 p-3.5 space-y-2.5"
                  >
                    <div className="flex items-center justify-between border-b border-border/40 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-bold text-foreground">
                          {pg.pageIndex != null ? `Page ${pg.pageIndex}` : "General Tasks"}
                        </span>
                        <span className="text-[10px] font-medium text-muted-foreground">
                          ({pageApproved}/{pageTotal} completed)
                        </span>
                      </div>

                      {/* Mini Task Role Indicators */}
                      <div className="flex flex-wrap gap-1">
                        {pg.rows.map((r) => (
                          <span
                            key={r.sub.id}
                            className={`rounded-md px-1.5 py-0.5 text-[9px] font-semibold ${
                              APPROVED_STATUSES.has(r.sub.status)
                                ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                                : NEEDS_REVIEW_STATUSES.has(r.sub.status)
                                  ? "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                                  : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                            }`}
                          >
                            {r.taskTitle}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Task Rows */}
                    <div className="space-y-2">
                      {pg.rows.map((row) => (
                        <div
                          key={row.sub.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 rounded-lg border border-border/60 bg-card p-2.5 shadow-2xs hover:border-primary/40 transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-xs text-foreground truncate">
                                  {row.taskTitle}
                                </span>
                                <span className="rounded bg-muted px-1.5 py-0.2 text-[10px] font-semibold text-muted-foreground">
                                  {row.sub.versionLabel}
                                </span>
                              </div>
                              <p className="text-[10px] text-muted-foreground truncate pt-0.5">
                                Assistant: <strong className="text-foreground font-semibold">{row.assistantName}</strong> · Submitted {timeAgo(row.sub.submittedAt)}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-auto">
                            <ReviewStatusPill status={row.sub.status} />
                            <Link
                              to="/app/mangaka/submissions/$submissionId/review"
                              params={{ submissionId: row.sub.id }}
                              className="inline-flex items-center gap-1 rounded-lg border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary transition-all hover:bg-primary/20"
                            >
                              Open Review <ChevronRight className="size-3.5" />
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function QueueRow({ row }: { row: Row }) {
  const missingFile = !hasFile(row.sub);

  return (
    <TableRow
      className={`transition-colors align-middle ${
        missingFile ? "bg-amber-50/40 dark:bg-amber-500/[0.06]" : ""
      } hover:bg-muted/30`}
    >
      <TableCell>
        <div className="min-w-0">
          <p className="truncate text-xs font-bold text-foreground">{row.taskTitle}</p>
          <p className="truncate text-[11px] text-muted-foreground">
            {row.seriesTitle} · Ch.{row.chapterNumber ?? "—"} {row.pageIndex ? `· Page ${row.pageIndex}` : ""}
          </p>
        </div>
      </TableCell>
      <TableCell className="text-muted-foreground font-medium">{row.assistantName}</TableCell>
      <TableCell className="font-semibold text-foreground">{row.sub.versionLabel}</TableCell>
      <TableCell>
        <ReviewStatusPill status={row.sub.status} />
      </TableCell>
      <TableCell className="whitespace-nowrap text-muted-foreground">
        {timeAgo(row.sub.submittedAt)}
      </TableCell>
      <TableCell className="text-right whitespace-nowrap">
        <Link
          to="/app/mangaka/submissions/$submissionId/review"
          params={{ submissionId: row.sub.id }}
          className="inline-flex items-center gap-1 rounded-lg border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary transition-all hover:bg-primary/20"
        >
          Open Review <ChevronRight className="size-3.5" />
        </Link>
      </TableCell>
    </TableRow>
  );
}

function MobileQueueCard({ row }: { row: Row }) {
  const missingFile = !hasFile(row.sub);

  return (
    <div
      className={`min-w-0 overflow-hidden rounded-xl border bg-card p-4 shadow-2xs ${
        missingFile ? "border-amber-300/70 dark:border-amber-500/40" : "border-border/80"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[13px] font-bold text-foreground">{row.taskTitle}</p>
          <p className="mt-1 line-clamp-1 text-[11px] text-muted-foreground">
            {row.seriesTitle} · Ch.{row.chapterNumber ?? "—"} {row.pageIndex ? `· Page ${row.pageIndex}` : ""}
          </p>
        </div>
        <ReviewStatusPill status={row.sub.status} />
      </div>

      <div className="mt-3 grid min-w-0 grid-cols-2 gap-2">
        <MobileMetric label="Assistant" value={row.assistantName} />
        <MobileMetric label="Version" value={row.sub.versionLabel} />
        <MobileMetric label="Submitted" value={timeAgo(row.sub.submittedAt)} />
        <MobileMetric label="File" value={missingFile ? "Missing" : "Attached"} />
      </div>

      <div className="mt-3 flex min-w-0 items-center justify-between gap-3 border-t border-border/60 pt-3">
        <span className="text-[11px] text-muted-foreground">
          {missingFile ? "Needs file attached" : "File attached"}
        </span>
        <Link
          to="/app/mangaka/submissions/$submissionId/review"
          params={{ submissionId: row.sub.id }}
          className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary transition-all hover:bg-primary/20"
        >
          Open Review <ChevronRight className="size-3.5" />
        </Link>
      </div>
    </div>
  );
}

function MobileMetric({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="min-w-0 rounded-lg border border-border/60 bg-background p-2">
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 truncate font-semibold text-foreground">{value}</p>
    </div>
  );
}

function MobilePagination({
  total,
  page,
  pageSize,
  onPageChange,
}: {
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const firstRow = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastRow = Math.min(page * pageSize, total);

  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border border-border/80 bg-card p-2 text-xs text-muted-foreground">
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className="rounded-md border border-border bg-background px-2.5 py-1 font-semibold text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
      >
        Prev
      </button>
      <span className="min-w-0 text-center">
        {firstRow}-{lastRow} of {total}
      </span>
      <button
        type="button"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        className="rounded-md border border-border bg-background px-2.5 py-1 font-semibold text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
      >
        Next
      </button>
    </div>
  );
}

function EmptyQueueState({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-card/40 px-6 py-12 text-center">
      <div className="grid size-10 place-items-center rounded-xl border border-border/60 bg-background text-muted-foreground shadow-2xs">
        {icon}
      </div>
      <h3 className="mt-3 font-serif text-lg font-bold text-foreground">{title}</h3>
      <p className="mt-1 max-w-md text-xs leading-relaxed text-muted-foreground">{description}</p>
    </div>
  );
}
