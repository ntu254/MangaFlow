// Hallmark - pre-emit critique: P5 H5 E4 S5 R5 V4
// Hallmark - genre: product - macrostructure: Workbench register - design-system: existing tokens
import type { SeriesProposal } from "@/entities/proposal/model/proposal-types";
import { STATUS_LABEL as PROPOSAL_STATUS_LABEL } from "@/entities/proposal/model/proposal-types";
import {
  CADENCE_LABEL,
  SERIES_STATUS_LABEL,
  type Chapter,
  type ProductionSeries,
  type ProductionSeriesStatus,
} from "@/entities/series/model/series-types";
import {
  formatDeadline,
  PRIMARY_ACTION_LABEL,
  type SeriesPrimaryAction,
} from "@/entities/series/model/series-production";
import type { StudioTask } from "@/entities/series/model/studio-types";
import type {
  AssistantSubmission,
  SubmissionStatus,
} from "@/entities/submission/model/assistant-types";
import {
  mapApiError,
  useMyChaptersQuery,
  useMySeriesQuery,
  useStudioTasksQuery,
  useSubmissionsQuery,
} from "../../api/series-queries";
import { useProposalsQuery } from "@/features/proposals";
import { deriveProductionSummary } from "../../detail/model/series-production-helpers";
import { useAuth } from "@/shared/auth";
import {
  ActionButton,
  DataPagination,
  DataTable,
  EmptyState,
  FilterSelect,
  PageHeader,
  SearchToolbar,
  SortableHeader,
  StateBlock,
  StatCard,
  StatusPill,
  Surface,
  TextButton,
  ResolvedImage,
} from "@/shared/ui";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SelectItem } from "@/components/ui/select";
import { useSortableData } from "@/shared/lib/use-sortable-data";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  Eye,
  Flag,
  Layers,
  Plus,
  RefreshCw,
  SearchX,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

type StatusFilter = ProductionSeriesStatus | "ALL";
type WorkflowFilter = "ALL" | "REVIEW_NEEDED" | "OVERDUE" | "BLOCKED" | "WAITING_EDITOR";
type SortableSeriesKey =
  | "priority"
  | "title"
  | "status"
  | "progress"
  | "openWork"
  | "review"
  | "deadline"
  | "team"
  | "updated";

type SeriesRow = {
  series: ProductionSeries;
  proposal?: SeriesProposal;
  chapters: Chapter[];
  tasks: StudioTask[];
  submissions: AssistantSubmission[];
  progressPct: number;
  publishedCount: number;
  totalCount: number;
  openTaskCount: number;
  overdueTaskCount: number;
  blockedTaskCount: number;
  pendingReviewCount: number;
  waitingEditorCount: number;
  nextDeadline: string | null;
  nextDeadlineMs: number | null;
  currentChapterLabel: string;
  primaryAction: SeriesPrimaryAction;
  priorityScore: number;
  priorityLabel: string;
  actionTab: string;
  searchText: string;
};

const STATUSES: StatusFilter[] = [
  "ALL",
  "PRE_PRODUCTION",
  "PLANNING",
  "ONGOING",
  "HIATUS",
  "COMPLETED",
  "ARCHIVED",
];

const STATUS_LABEL: Record<StatusFilter, string> = {
  ALL: "All statuses",
  PRE_PRODUCTION: "Pre-production",
  PLANNING: "Planning",
  ONGOING: "Ongoing",
  HIATUS: "Hiatus",
  COMPLETED: "Completed",
  ARCHIVED: "Archived",
};

const WORKFLOW_LABEL: Record<WorkflowFilter, string> = {
  ALL: "All workflow",
  REVIEW_NEEDED: "Review needed",
  OVERDUE: "Overdue",
  BLOCKED: "Blocked",
  WAITING_EDITOR: "Waiting editor",
};

const REVIEW_SUBMISSION_STATUSES = new Set<SubmissionStatus>([
  "SUBMITTED",
  "PENDING",
  "REVISION_REQUESTED",
  "MANGAKA_REVISION_REQUESTED",
  "EDITOR_REVISION_REQUESTED",
]);

const ACTIVE_TASK_STATUSES = new Set<StudioTask["status"]>([
  "TODO",
  "IN_PROGRESS",
  "SUBMITTED",
  "REVISION_REQUESTED",
  "MANGAKA_REVIEWING",
  "MANGAKA_REVISION_REQUESTED",
  "MANGAKA_APPROVED",
  "EDITOR_REVIEWING",
  "EDITOR_REVISION_REQUESTED",
]);

function getInitials(title: string): string {
  return title
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

function getActionTab(action: SeriesPrimaryAction): string {
  switch (action) {
    case "review_submissions":
    case "setup_chapters":
    case "resume_planning":
      return "chapters";
    case "open_proposal":
      return "proposal";
    case "view_task_board":
    case "open_studio":
      return "studio";
    case "view_publication":
      return "calendar";
    default:
      return "overview";
  }
}

function formatShortDate(value: string | null): string {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatUpdated(value: string): string {
  const diffSeconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (diffSeconds < 60) return "just now";
  if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
  if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h ago`;
  return `${Math.floor(diffSeconds / 86400)}d ago`;
}

function getPriority(row: {
  overdueTaskCount: number;
  blockedTaskCount: number;
  pendingReviewCount: number;
  nextDeadlineMs: number | null;
}): { label: string; score: number } {
  const now = Date.now();
  const daysUntilDeadline =
    row.nextDeadlineMs == null ? Infinity : Math.ceil((row.nextDeadlineMs - now) / 86400000);

  if (row.overdueTaskCount > 0) return { label: "Overdue", score: 500 + row.overdueTaskCount };
  if (row.blockedTaskCount > 0) return { label: "Blocked", score: 400 + row.blockedTaskCount };
  if (row.pendingReviewCount > 0) {
    return { label: "Review", score: 300 + row.pendingReviewCount };
  }
  if (daysUntilDeadline <= 3) return { label: "Due soon", score: 200 + (4 - daysUntilDeadline) };
  return { label: "Healthy", score: 100 };
}

function getSeriesRows({
  series,
  chaptersBySeries,
  tasksBySeries,
  submissionsBySeries,
  proposalsById,
}: {
  series: ProductionSeries[];
  chaptersBySeries: Map<string, Chapter[]>;
  tasksBySeries: Map<string, StudioTask[]>;
  submissionsBySeries: Map<string, AssistantSubmission[]>;
  proposalsById: Map<string, SeriesProposal>;
}): SeriesRow[] {
  return series.map((item) => {
    const chapters = chaptersBySeries.get(item.id) ?? [];
    const tasks = tasksBySeries.get(item.id) ?? [];
    const submissions = submissionsBySeries.get(item.id) ?? [];
    const summary = deriveProductionSummary(item, chapters, tasks, submissions);
    const publishedCount = summary.publishedCount;
    const totalCount = chapters.length;
    const target = item.targetChapters || totalCount || 1;
    const progressPct = Math.min(100, Math.round((publishedCount / target) * 100));
    const openTaskCount = tasks.filter((task) => ACTIVE_TASK_STATUSES.has(task.status)).length;
    const overdueTaskCount = summary.overdueTaskCount;
    const blockedTaskCount =
      summary.blockedTaskCount +
      tasks.filter(
        (task) =>
          task.blocked ||
          task.status === "MANGAKA_REVISION_REQUESTED" ||
          task.status === "EDITOR_REVISION_REQUESTED",
      ).length;
    const waitingEditorCount = chapters.filter(
      (chapter) => chapter.status === "TANTOU_REVIEW",
    ).length;
    const pendingReviewCount =
      waitingEditorCount +
      submissions.filter((submission) => REVIEW_SUBMISSION_STATUSES.has(submission.status)).length;
    const nextDeadline = summary.nextDeadline;
    const nextDeadlineMs = nextDeadline ? new Date(nextDeadline).getTime() : null;
    const currentChapterLabel = summary.currentChapter
      ? `Ch. ${String(summary.currentChapter.number).padStart(3, "0")} - ${
          summary.currentChapter.title
        }`
      : "No active chapter";
    const priority = getPriority({
      overdueTaskCount,
      blockedTaskCount,
      pendingReviewCount,
      nextDeadlineMs,
    });
    const proposal = item.proposalId ? proposalsById.get(item.proposalId) : undefined;

    return {
      series: item,
      proposal,
      chapters,
      tasks,
      submissions,
      progressPct,
      publishedCount,
      totalCount,
      openTaskCount,
      overdueTaskCount,
      blockedTaskCount,
      pendingReviewCount,
      waitingEditorCount,
      nextDeadline,
      nextDeadlineMs,
      currentChapterLabel,
      primaryAction: summary.primaryAction,
      priorityScore: priority.score,
      priorityLabel: priority.label,
      actionTab: getActionTab(summary.primaryAction),
      searchText: [
        item.title,
        item.synopsis,
        item.authorName,
        item.editorName,
        item.genres.join(" "),
        proposal?.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase(),
    };
  });
}

export function SeriesListPage() {
  const user = useAuth((state) => state.user);
  const navigate = useNavigate();

  const {
    data: proposals = [],
    isLoading: isProposalsLoading,
    refetch: refetchProposals,
  } = useProposalsQuery(user?.role === "mangaka" ? { authorId: user.id } : undefined);
  const {
    data: series = [],
    isLoading: isSeriesLoading,
    isError,
    error,
    refetch: refetchSeries,
  } = useMySeriesQuery();
  const { data: allChapters = [] } = useMyChaptersQuery();
  const { data: allTasks = [] } = useStudioTasksQuery({});
  const { data: allSubmissions = [] } = useSubmissionsQuery({});

  const isLoading = isSeriesLoading || isProposalsLoading;

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [workflowFilter, setWorkflowFilter] = useState<WorkflowFilter>("ALL");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);

  const refetch = useCallback(async () => {
    await Promise.all([refetchSeries(), refetchProposals()]);
  }, [refetchSeries, refetchProposals]);

  const proposalsById = useMemo(
    () => new Map(proposals.map((proposal) => [proposal.id, proposal])),
    [proposals],
  );

  const activeProductionSeries = useMemo(() => {
    return series.filter((item) => {
      if (!item.proposalId) return true;
      const proposal = proposalsById.get(item.proposalId);
      if (!proposal) return true;
      return proposal.status === "APPROVED";
    });
  }, [series, proposalsById]);

  const pendingProposals = useMemo(() => {
    return proposals.filter((proposal) => proposal.status !== "APPROVED");
  }, [proposals]);

  const chaptersBySeries = useMemo(() => {
    const map = new Map<string, Chapter[]>();
    for (const chapter of allChapters) {
      const rows = map.get(chapter.seriesId) ?? [];
      rows.push(chapter);
      map.set(chapter.seriesId, rows);
    }
    return map;
  }, [allChapters]);

  const seriesIdByChapterId = useMemo(() => {
    const map = new Map<string, string>();
    for (const chapter of allChapters) {
      map.set(chapter.id, chapter.seriesId);
    }
    return map;
  }, [allChapters]);

  const tasksBySeries = useMemo(() => {
    const map = new Map<string, StudioTask[]>();
    for (const task of allTasks) {
      const seriesId = task.seriesId ?? seriesIdByChapterId.get(task.chapterId);
      if (!seriesId) continue;
      const rows = map.get(seriesId) ?? [];
      rows.push(task);
      map.set(seriesId, rows);
    }
    return map;
  }, [allTasks, seriesIdByChapterId]);

  const submissionsBySeries = useMemo(() => {
    const map = new Map<string, AssistantSubmission[]>();
    for (const submission of allSubmissions) {
      if (!submission.chapterId) continue;
      const seriesId = seriesIdByChapterId.get(submission.chapterId);
      if (!seriesId) continue;
      const rows = map.get(seriesId) ?? [];
      rows.push(submission);
      map.set(seriesId, rows);
    }
    return map;
  }, [allSubmissions, seriesIdByChapterId]);

  const rows = useMemo(
    () =>
      getSeriesRows({
        series: activeProductionSeries,
        chaptersBySeries,
        tasksBySeries,
        submissionsBySeries,
        proposalsById,
      }),
    [activeProductionSeries, chaptersBySeries, tasksBySeries, submissionsBySeries, proposalsById],
  );

  const kpis = useMemo(() => {
    const activeCount = rows.filter((row) => row.series.status !== "COMPLETED").length;
    const pendingReviewCount = rows.reduce((sum, row) => sum + row.pendingReviewCount, 0);
    const overdueCount = rows.reduce((sum, row) => sum + row.overdueTaskCount, 0);
    const nextDeadline = rows
      .map((row) => row.nextDeadlineMs)
      .filter((value): value is number => value != null && value > Date.now())
      .sort((a, b) => a - b)[0];

    return {
      activeCount,
      pendingReviewCount,
      overdueCount,
      nextDeadline: nextDeadline ? formatShortDate(new Date(nextDeadline).toISOString()) : null,
    };
  }, [rows]);

  const filteredRows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return rows
      .filter((row) => statusFilter === "ALL" || row.series.status === statusFilter)
      .filter((row) => {
        switch (workflowFilter) {
          case "REVIEW_NEEDED":
            return row.pendingReviewCount > 0;
          case "OVERDUE":
            return row.overdueTaskCount > 0;
          case "BLOCKED":
            return row.blockedTaskCount > 0;
          case "WAITING_EDITOR":
            return row.waitingEditorCount > 0;
          case "ALL":
          default:
            return true;
        }
      })
      .filter((row) => !needle || row.searchText.includes(needle));
  }, [rows, statusFilter, workflowFilter, query]);

  const { sorted, sortKey, sortDirection, toggleSort } = useSortableData<SeriesRow>(
    filteredRows,
    {
      priority: (row) => row.priorityScore,
      title: (row) => row.series.title,
      status: (row) => row.series.status,
      progress: (row) => row.progressPct,
      openWork: (row) => row.openTaskCount + row.blockedTaskCount + row.overdueTaskCount,
      review: (row) => row.pendingReviewCount,
      deadline: (row) => row.nextDeadlineMs,
      team: (row) => row.series.editorName,
      updated: (row) => new Date(row.series.updatedAt),
    } satisfies Record<SortableSeriesKey, (row: SeriesRow) => string | number | Date | null>,
    { key: "priority", direction: "desc" },
  );

  const priorityRows = useMemo(
    () => sorted.filter((row) => row.priorityScore >= 200).slice(0, 4),
    [sorted],
  );
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pagedRows = useMemo(
    () => sorted.slice((safePage - 1) * pageSize, safePage * pageSize),
    [sorted, safePage, pageSize],
  );

  useEffect(() => {
    setPage(1);
  }, [statusFilter, workflowFilter, query, pageSize]);

  const clearFilters = useCallback(() => {
    setStatusFilter("ALL");
    setWorkflowFilter("ALL");
    setQuery("");
  }, []);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl space-y-6">
        <PageHeader
          eyebrow="Production"
          title="Series register"
          description="Loading series, proposal, and production signals..."
        />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Surface key={index} className="h-[72px] animate-pulse" />
          ))}
        </div>
        <Surface className="h-[420px] animate-pulse" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mx-auto max-w-7xl space-y-6">
        <PageHeader
          eyebrow="Production"
          title="Series register"
          description="Manage approved series and proposal handoffs."
        />
        <StateBlock
          tone="danger"
          title="Unable to load series data"
          description={mapApiError(error)}
        />
      </div>
    );
  }

  const isFiltered = statusFilter !== "ALL" || workflowFilter !== "ALL" || query.trim() !== "";
  const hasNoItemsAtAll = pendingProposals.length === 0 && rows.length === 0;
  const hasOnlyPendingProposals = pendingProposals.length > 0 && rows.length === 0;

  return (
    <div className="mx-auto max-w-7xl space-y-7">
      <PageHeader
        eyebrow="Production"
        title="Series register"
        description="A focused queue for approved series, deadline risk, review load, and proposal handoff."
      >
        <ActionButton tone="primary" onClick={() => navigate({ to: "/app/submissions/new" })}>
          <Plus className="size-4" />
          Create proposal
        </ActionButton>
        <Link
          to="/app/submissions"
          className="inline-flex h-10 items-center rounded-[6px] border border-[var(--admin-border)] bg-[var(--admin-surface)] px-4 text-[13px] font-semibold text-[var(--admin-ink)] shadow-sm hover:bg-[var(--admin-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          Proposals
        </Link>
        <TextButton onClick={() => refetch()}>
          <RefreshCw className="size-4" />
          Refresh
        </TextButton>
      </PageHeader>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Layers className="size-4" />}
          tone="blue"
          label="Active series"
          value={kpis.activeCount}
          hint={`${rows.length} approved total`}
        />
        <StatCard
          icon={<Eye className="size-4" />}
          tone={kpis.pendingReviewCount ? "amber" : "neutral"}
          label="Review load"
          value={kpis.pendingReviewCount || "-"}
          hint={kpis.pendingReviewCount ? "Items awaiting decision" : "No review queue"}
        />
        <StatCard
          icon={<AlertTriangle className="size-4" />}
          tone={kpis.overdueCount ? "rose" : "neutral"}
          label="Overdue tasks"
          value={kpis.overdueCount || "-"}
          hint={kpis.overdueCount ? "Needs triage" : "On schedule"}
        />
        <StatCard
          icon={<CalendarClock className="size-4" />}
          tone="emerald"
          label="Next deadline"
          value={kpis.nextDeadline ?? "-"}
          hint={kpis.nextDeadline ? "Nearest active work" : "No active due date"}
        />
      </section>

      {hasNoItemsAtAll ? (
        <EmptyState
          title="You have no series proposals yet."
          description="Create the first proposal and upload a manuscript or sample pages for Editor review."
          action={
            <ActionButton tone="primary" onClick={() => navigate({ to: "/app/submissions/new" })}>
              <Plus className="size-4" />
              Create proposal
            </ActionButton>
          }
        />
      ) : hasOnlyPendingProposals ? (
        <EmptyState
          title="No approved series yet."
          description="Your proposal work is still in Draft, Editor review, or Board approval. Once approved, it becomes production work here."
          action={
            <Link
              to="/app/submissions"
              className="inline-flex h-10 items-center rounded-[6px] bg-[var(--admin-navy)] px-4 text-[13px] font-semibold text-[var(--admin-cream)] hover:bg-[var(--admin-navy-light)]"
            >
              Open proposals
            </Link>
          }
        />
      ) : (
        <>
          {priorityRows.length > 0 ? (
            <section className="grid gap-3 lg:grid-cols-4">
              {priorityRows.map((row) => (
                <PriorityTile key={row.series.id} row={row} />
              ))}
            </section>
          ) : null}

          <Surface className="space-y-4 overflow-hidden p-3 sm:p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-[18px] font-semibold text-[var(--admin-ink)]">
                  Production register
                </h2>
                <p className="mt-1 text-[13px] text-[var(--admin-muted)]">
                  Sort each operational column, then page through the filtered result.
                </p>
              </div>
              {isFiltered ? (
                <TextButton onClick={clearFilters} className="h-9 px-3">
                  <SearchX className="size-4" />
                  Clear filters
                </TextButton>
              ) : null}
            </div>

            <SearchToolbar
              query={query}
              onQueryChange={setQuery}
              placeholder="Search title, owner, editor, genre..."
              filters={
                <>
                  <FilterSelect
                    value={statusFilter}
                    onValueChange={(value) => setStatusFilter(value as StatusFilter)}
                  >
                    {STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        {STATUS_LABEL[status]}
                      </SelectItem>
                    ))}
                  </FilterSelect>
                  <FilterSelect
                    value={workflowFilter}
                    onValueChange={(value) => setWorkflowFilter(value as WorkflowFilter)}
                  >
                    {Object.entries(WORKFLOW_LABEL).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </FilterSelect>
                </>
              }
            />

            <div className="hidden lg:block">
              <DataTable
                isEmpty={sorted.length === 0}
                emptyTitle="No matching series"
                emptyDescription="Adjust search, status, or workflow filters."
                className="shadow-none"
                stateClassName="min-h-[220px]"
              >
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[280px]">
                        <SortableHeader
                          label="Series"
                          sortKey="title"
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
                          label="Progress"
                          sortKey="progress"
                          activeSortKey={sortKey}
                          direction={sortDirection}
                          onSort={toggleSort}
                        />
                      </TableHead>
                      <TableHead>
                        <SortableHeader
                          label="Open work"
                          sortKey="openWork"
                          activeSortKey={sortKey}
                          direction={sortDirection}
                          onSort={toggleSort}
                        />
                      </TableHead>
                      <TableHead>
                        <SortableHeader
                          label="Review"
                          sortKey="review"
                          activeSortKey={sortKey}
                          direction={sortDirection}
                          onSort={toggleSort}
                        />
                      </TableHead>
                      <TableHead>
                        <SortableHeader
                          label="Deadline"
                          sortKey="deadline"
                          activeSortKey={sortKey}
                          direction={sortDirection}
                          onSort={toggleSort}
                        />
                      </TableHead>
                      <TableHead>
                        <SortableHeader
                          label="Team"
                          sortKey="team"
                          activeSortKey={sortKey}
                          direction={sortDirection}
                          onSort={toggleSort}
                        />
                      </TableHead>
                      <TableHead>
                        <SortableHeader
                          label="Updated"
                          sortKey="updated"
                          activeSortKey={sortKey}
                          direction={sortDirection}
                          onSort={toggleSort}
                        />
                      </TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pagedRows.map((row) => (
                      <SeriesTableRow key={row.series.id} row={row} />
                    ))}
                  </TableBody>
                </Table>
                <DataPagination
                  total={sorted.length}
                  page={safePage}
                  pageSize={pageSize}
                  pageSizeOptions={[8, 12, 20]}
                  itemName="series"
                  onPageChange={setPage}
                  onPageSizeChange={setPageSize}
                />
              </DataTable>
            </div>

            <div className="space-y-3 lg:hidden">
              {sorted.length === 0 ? (
                <EmptyState
                  title="No matching series"
                  description="Adjust search, status, or workflow filters."
                />
              ) : (
                <>
                  <div className="grid min-w-0 gap-3">
                    {pagedRows.map((row) => (
                      <MobileSeriesCard key={row.series.id} row={row} />
                    ))}
                  </div>
                  <MobilePagination
                    total={sorted.length}
                    page={safePage}
                    pageSize={pageSize}
                    onPageChange={setPage}
                  />
                </>
              )}
            </div>
          </Surface>
        </>
      )}
    </div>
  );
}

function PriorityTile({ row }: { row: SeriesRow }) {
  const tone =
    row.overdueTaskCount > 0
      ? "border-rose-200 bg-rose-50/60"
      : row.blockedTaskCount > 0
        ? "border-amber-200 bg-amber-50/70"
        : "border-[var(--admin-border)] bg-[var(--admin-surface)]";

  return (
    <Link
      to="/app/series/$slug/$tab"
      params={{ slug: row.series.slug, tab: row.actionTab }}
      className={`rounded-[6px] border p-3 transition hover:-translate-y-0.5 hover:border-[var(--admin-navy)] ${tone}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[13px] font-semibold text-[var(--admin-ink)]">
            {row.series.title}
          </p>
          <p className="mt-1 text-[11px] text-[var(--admin-muted)]">{row.priorityLabel}</p>
        </div>
        <Flag className="size-4 shrink-0 text-[var(--admin-faint)]" />
      </div>
      <div className="mt-3 flex items-center justify-between gap-3 text-[11px] text-[var(--admin-muted)]">
        <span>{row.nextDeadline ? formatDeadline(row.nextDeadline) : "No due date"}</span>
        <span className="font-semibold text-[var(--admin-ink)]">
          {PRIMARY_ACTION_LABEL[row.primaryAction]}
        </span>
      </div>
    </Link>
  );
}

function SeriesTableRow({ row }: { row: SeriesRow }) {
  const cover = row.series.coverUrl || row.series.coverFileKey;

  return (
    <TableRow className="align-top">
      <TableCell>
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid h-16 w-11 shrink-0 place-items-center overflow-hidden rounded-[4px] border border-[var(--admin-border)] bg-[var(--admin-hover)] font-serif text-[15px] font-semibold text-[var(--admin-muted)]">
            {cover ? (
              <ResolvedImage
                fileKey={row.series.coverFileKey}
                fallbackUrl={row.series.coverUrl}
                alt=""
                className="size-full object-cover"
                fallback={getInitials(row.series.title)}
              />
            ) : (
              getInitials(row.series.title)
            )}
          </div>
          <div className="min-w-0">
            <Link
              to="/app/series/$slug/$tab"
              params={{ slug: row.series.slug, tab: "overview" }}
              className="block truncate text-[14px] font-semibold text-[var(--admin-ink)] hover:underline"
            >
              {row.series.title}
            </Link>
            <p className="mt-0.5 line-clamp-1 max-w-[34ch] text-[12px] text-[var(--admin-muted)]">
              {row.currentChapterLabel}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-[var(--admin-faint)]">
              <BookOpen className="size-3" />
              <span>{CADENCE_LABEL[row.series.cadence]}</span>
              <span>{row.series.genres.slice(0, 2).join(", ") || "No genre"}</span>
            </div>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div className="space-y-1">
          <StatusPill status={row.series.status.toLowerCase()} />
          {row.proposal ? (
            <p className="text-[11px] text-[var(--admin-faint)]">
              Proposal: {PROPOSAL_STATUS_LABEL[row.proposal.status]}
            </p>
          ) : null}
        </div>
      </TableCell>
      <TableCell>
        <div className="min-w-[128px] space-y-1.5">
          <div className="flex items-center justify-between text-[11px] text-[var(--admin-muted)]">
            <span>
              {row.publishedCount}/{row.series.targetChapters || row.totalCount || 0}
            </span>
            <span>{row.progressPct}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-[var(--admin-hover)]">
            <div
              className="h-full rounded-full bg-[var(--admin-navy)]"
              style={{ width: `${row.progressPct}%` }}
            />
          </div>
        </div>
      </TableCell>
      <TableCell>
        <WorkloadCell row={row} />
      </TableCell>
      <TableCell>
        <div className="space-y-1 text-[12px] text-[var(--admin-muted)]">
          <p className="font-medium text-[var(--admin-ink)]">{row.pendingReviewCount || "-"}</p>
          {row.waitingEditorCount > 0 ? <p>{row.waitingEditorCount} editor handoff</p> : null}
        </div>
      </TableCell>
      <TableCell>
        <div className="space-y-1 text-[12px]">
          <p className="font-medium text-[var(--admin-ink)]">{formatShortDate(row.nextDeadline)}</p>
          {row.nextDeadline ? (
            <p className="text-[11px] text-[var(--admin-muted)]">
              {formatDeadline(row.nextDeadline)}
            </p>
          ) : (
            <p className="text-[11px] text-[var(--admin-faint)]">Not scheduled</p>
          )}
        </div>
      </TableCell>
      <TableCell>
        <div className="space-y-1 text-[12px] text-[var(--admin-muted)]">
          <p className="font-medium text-[var(--admin-ink)]">{row.series.editorName}</p>
          <p className="flex items-center gap-1">
            <Users className="size-3" />
            {row.series.assistantIds.length} assistants
          </p>
        </div>
      </TableCell>
      <TableCell className="text-[12px] text-[var(--admin-muted)]">
        {formatUpdated(row.series.updatedAt)}
      </TableCell>
      <TableCell className="text-right">
        <Link
          to="/app/series/$slug/$tab"
          params={{ slug: row.series.slug, tab: row.actionTab }}
          className="inline-flex h-8 items-center gap-1.5 rounded-[5px] bg-[var(--admin-navy)] px-3 text-[12px] font-semibold text-[var(--admin-cream)] hover:bg-[var(--admin-navy-light)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          {PRIMARY_ACTION_LABEL[row.primaryAction]}
          <ArrowRight className="size-3.5" />
        </Link>
      </TableCell>
    </TableRow>
  );
}

function MobileSeriesCard({ row }: { row: SeriesRow }) {
  return (
    <Link
      to="/app/series/$slug/$tab"
      params={{ slug: row.series.slug, tab: row.actionTab }}
      className="block min-w-0 overflow-hidden rounded-[6px] border border-[var(--admin-border)] bg-[var(--admin-surface)] p-3"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[14px] font-semibold text-[var(--admin-ink)]">
            {row.series.title}
          </p>
          <p className="mt-1 line-clamp-1 text-[12px] text-[var(--admin-muted)]">
            {row.currentChapterLabel}
          </p>
        </div>
        <StatusPill status={row.series.status.toLowerCase()} className="shrink-0" />
      </div>

      <div className="mt-3 grid min-w-0 grid-cols-2 gap-2 text-[12px]">
        <MobileMetric label="Progress" value={`${row.progressPct}%`} />
        <MobileMetric label="Open work" value={row.openTaskCount || "-"} />
        <MobileMetric label="Review" value={row.pendingReviewCount || "-"} />
        <MobileMetric
          label="Deadline"
          value={row.nextDeadline ? formatDeadline(row.nextDeadline) : "-"}
        />
      </div>

      <div className="mt-3 flex min-w-0 items-center justify-between gap-3 border-t border-[var(--admin-border)] pt-3 text-[12px]">
        <span className="min-w-0 truncate text-[var(--admin-muted)]">{row.series.editorName}</span>
        <span className="inline-flex shrink-0 items-center gap-1 font-semibold text-[var(--admin-ink)]">
          {PRIMARY_ACTION_LABEL[row.primaryAction]}
          <ArrowRight className="size-3.5" />
        </span>
      </div>
    </Link>
  );
}

function MobileMetric({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0 rounded-[5px] border border-[var(--admin-border)] bg-[var(--admin-page)]/60 p-2">
      <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--admin-faint)]">
        {label}
      </p>
      <p className="mt-1 font-semibold text-[var(--admin-ink)]">{value}</p>
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
    <div className="flex items-center justify-between gap-2 rounded-[6px] border border-[var(--admin-border)] bg-[var(--admin-page)]/60 p-2 text-[12px] text-[var(--admin-muted)]">
      <TextButton
        className="h-8 px-2 text-[12px]"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        Prev
      </TextButton>
      <span className="min-w-0 text-center">
        {firstRow}-{lastRow} of {total}
      </span>
      <TextButton
        className="h-8 px-2 text-[12px]"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        Next
      </TextButton>
    </div>
  );
}

function WorkloadCell({ row }: { row: SeriesRow }) {
  if (row.openTaskCount === 0 && row.blockedTaskCount === 0 && row.overdueTaskCount === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-[12px] text-[var(--admin-muted)]">
        <CheckCircle2 className="size-3.5 text-[var(--role-editor)]" />
        Clear
      </span>
    );
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {row.openTaskCount > 0 ? (
        <WorkloadBadge tone="active" label={`${row.openTaskCount} open`} />
      ) : null}
      {row.overdueTaskCount > 0 ? (
        <WorkloadBadge tone="locked" label={`${row.overdueTaskCount} overdue`} />
      ) : null}
      {row.blockedTaskCount > 0 ? (
        <WorkloadBadge tone="risk" label={`${row.blockedTaskCount} blocked`} />
      ) : null}
    </div>
  );
}

function WorkloadBadge({ tone, label }: { tone: "active" | "locked" | "risk"; label: string }) {
  const className =
    tone === "locked"
      ? "bg-destructive/10 text-destructive"
      : tone === "risk"
        ? "bg-[var(--role-board)]/12 text-[var(--role-board)]"
        : "bg-[var(--role-editor)]/12 text-[var(--role-editor)]";

  return (
    <span className={`inline-flex rounded px-2 py-0.5 text-[11px] font-semibold ${className}`}>
      {label}
    </span>
  );
}
