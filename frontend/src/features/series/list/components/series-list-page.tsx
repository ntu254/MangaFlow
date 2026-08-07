// DESIGN CONTRACT — /app/series register
// THESIS: The production register shows the operator which series needs their
// next decision, in a queue they can sort, filter, and scan in one pass; it
// refuses the cream editorial palette of the admin-* tokens in favor of the
// light register world shared by /app/proposals and the role dashboards.
// OWN-WORLD: standard MangaFlow tokens (white --card, paper --background,
// neutral --border, ink --primary), serif register title, metric strip with
// tinted icon chips, high-density table with muted uppercase tracked header,
// compact tinted action pills, dashed-light empty states.
// STORY: an operator lands, reads four KPI tiles, sees up to four priority
// tiles for series needing attention, then searches, filters by status and
// workflow, sorts any column, and pages a dense register.
// FIRST VIEWPORT: header bar (serif "Series Register" + subtitle, ink primary
// "Create proposal", bordered secondary actions); metric strip of four tiles;
// priority tiles; search + two selects + sortable table with cover thumbnails
// and per-row action pills.
// FORM: port of the established proposals/dashboard visual world into this
// surface; no new visual system.
// FINISH: unreviewed and undocumented is unfinished; this build ends with the
// finish review, the verdict, and DESIGN.md.
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
  DataPagination,
  DataTable,
  ResolvedImage,
  SortableHeader,
  StatusPill,
  Surface,
} from "@/shared/ui";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useSortableData } from "@/shared/lib/use-sortable-data";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Eye,
  FileText,
  Layers,
  Plus,
  RefreshCw,
  Search,
  SearchX,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

type StatusFilter = ProductionSeriesStatus | "ALL";
type WorkflowFilter = "ALL" | "REVIEW_NEEDED" | "OVERDUE" | "REVISION_NEEDED" | "WAITING_EDITOR";
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
  revisionTaskCount: number;
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
  REVISION_NEEDED: "Revision needed",
  WAITING_EDITOR: "Waiting editor",
};

const REVIEW_SUBMISSION_STATUSES = new Set<SubmissionStatus>([
  "PENDING",
  "REVISION_REQUESTED",
]);

const ACTIVE_TASK_STATUSES = new Set<StudioTask["status"]>([
  "TODO",
  "IN_PROGRESS",
  "REVISION_REQUESTED",
  "MANGAKA_APPROVED",
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
  revisionTaskCount: number;
  pendingReviewCount: number;
  nextDeadlineMs: number | null;
}): { label: string; score: number } {
  const now = Date.now();
  const daysUntilDeadline =
    row.nextDeadlineMs == null ? Infinity : Math.ceil((row.nextDeadlineMs - now) / 86400000);

  if (row.overdueTaskCount > 0) return { label: "Overdue", score: 500 + row.overdueTaskCount };
  if (row.revisionTaskCount > 0)
    return { label: "Revision needed", score: 400 + row.revisionTaskCount };
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
    const revisionTaskCount = summary.revisionTaskCount;
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
      revisionTaskCount,
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
      revisionTaskCount,
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
          case "REVISION_NEEDED":
            return row.revisionTaskCount > 0;
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
      openWork: (row) => row.openTaskCount + row.revisionTaskCount + row.overdueTaskCount,
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
        <div className="h-16 rounded-xl bg-muted/40 animate-pulse" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-24 rounded-xl bg-muted/30 animate-pulse" />
          ))}
        </div>
        <div className="h-[420px] rounded-xl bg-muted/25 animate-pulse" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 border-b border-border/60 pb-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="font-serif text-2xl font-bold tracking-tight text-foreground">
              Series Register
            </h1>
            <p className="mt-1 text-xs text-muted-foreground">
              Manage approved series and proposal handoffs.
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
          <div>
            <p className="text-xs font-bold text-destructive">Unable to load series data</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{mapApiError(error)}</p>
          </div>
        </div>
      </div>
    );
  }

  const isFiltered = statusFilter !== "ALL" || workflowFilter !== "ALL" || query.trim() !== "";
  const hasNoItemsAtAll = pendingProposals.length === 0 && rows.length === 0;
  const hasOnlyPendingProposals = pendingProposals.length > 0 && rows.length === 0;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col gap-4 border-b border-border/60 pb-5 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold tracking-tight text-foreground">
            Series Register
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            A focused queue for approved series, deadline risk, review load, and proposal handoff.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            to="/app/proposals/new"
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition-all hover:opacity-95 shrink-0"
          >
            <Plus className="size-4" /> Create Proposal
          </Link>
          <Link
            to="/app/proposals"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3.5 py-2 text-xs font-semibold text-foreground shadow-xs transition-colors hover:bg-muted"
          >
            Proposals
          </Link>
          <button
            type="button"
            onClick={() => void refetch()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3.5 py-2 text-xs font-semibold text-foreground shadow-xs transition-colors hover:bg-muted"
          >
            <RefreshCw className="size-3.5" />
            Refresh
          </button>
        </div>
      </div>

      {/* Metric Strip */}
      <div className="grid grid-cols-2 gap-3 rounded-xl border border-border/80 bg-card/60 p-3 text-xs sm:grid-cols-4">
        <div className="flex items-center gap-2.5 rounded-lg border border-border/40 bg-background/80 p-2.5">
          <div className="grid size-8 shrink-0 place-items-center rounded-md bg-indigo-500/10 font-bold text-indigo-700 dark:text-indigo-400">
            <Layers className="size-4" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-muted-foreground">Active Series</p>
            <p className="text-base font-bold tracking-tight">{kpis.activeCount}</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 rounded-lg border border-border/40 bg-background/80 p-2.5">
          <div className="grid size-8 shrink-0 place-items-center rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-400">
            <Eye className="size-4" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-muted-foreground">Review Load</p>
            <p className="text-base font-bold tracking-tight">{kpis.pendingReviewCount || "-"}</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 rounded-lg border border-border/40 bg-background/80 p-2.5">
          <div className="grid size-8 shrink-0 place-items-center rounded-md bg-rose-500/10 text-rose-700 dark:text-rose-400">
            <AlertTriangle className="size-4" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-muted-foreground">Overdue Tasks</p>
            <p className="text-base font-bold tracking-tight">{kpis.overdueCount || "-"}</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 rounded-lg border border-border/40 bg-background/80 p-2.5">
          <div className="grid size-8 shrink-0 place-items-center rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
            <CalendarClock className="size-4" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-muted-foreground">Next Deadline</p>
            <p className="text-base font-bold tracking-tight">{kpis.nextDeadline ?? "-"}</p>
          </div>
        </div>
      </div>

      {hasNoItemsAtAll ? (
        <EmptyRegisterState
          icon={<FileText className="size-5" />}
          title="You have no series proposals yet."
          description="Create the first proposal and upload a manuscript or sample pages for Editor review."
          action={
            <button
              type="button"
              onClick={() => navigate({ to: "/app/proposals/new" })}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition-all hover:opacity-95"
            >
              <Plus className="size-4" /> Create Proposal
            </button>
          }
        />
      ) : hasOnlyPendingProposals ? (
        <EmptyRegisterState
          icon={<BookOpen className="size-5" />}
          title="No approved series yet."
          description="Your proposal work is still in Draft, Editor review, or Board approval. Once approved, it becomes production work here."
          action={
            <Link
              to="/app/proposals"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3.5 py-2 text-xs font-semibold text-foreground shadow-xs transition-colors hover:bg-muted"
            >
              Open Proposals
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

          <Surface className="space-y-4 overflow-hidden rounded-xl border-border/80 p-4 shadow-xs">
            <div className="flex flex-col gap-3 border-b border-border/60 pb-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-sm font-bold text-foreground">Production Register</h2>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  Sort each operational column, then page through the filtered result.
                </p>
              </div>
              {isFiltered ? (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1.5 text-[11px] font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <SearchX className="size-3.5" />
                  Clear filters
                </button>
              ) : null}
            </div>

            {/* Search & Filter Controls */}
            <div className="flex flex-col gap-3 border-b border-border/60 pb-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search title, owner, editor, genre..."
                  aria-label="Search series"
                  className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                  aria-label="Filter by series status"
                  className="h-9 rounded-md border border-input bg-background px-3 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  {STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {STATUS_LABEL[status]}
                    </option>
                  ))}
                </select>

                <select
                  value={workflowFilter}
                  onChange={(e) => setWorkflowFilter(e.target.value as WorkflowFilter)}
                  aria-label="Filter by workflow"
                  className="h-9 rounded-md border border-input bg-background px-3 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  {Object.entries(WORKFLOW_LABEL).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="hidden lg:block">
              <DataTable
                isEmpty={sorted.length === 0}
                emptyTitle="No matching series"
                emptyDescription="Adjust search, status, or workflow filters."
                className="shadow-none border-none"
                stateClassName="min-h-[220px]"
              >
                <Table className="text-xs">
                  <TableHeader className="bg-muted/40 uppercase tracking-wider text-[10px] font-semibold text-muted-foreground border-b border-border">
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
                  <TableBody className="divide-y divide-border">
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
                <EmptyRegisterState
                  icon={<SearchX className="size-5" />}
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

function EmptyRegisterState({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/80 bg-card/40 px-6 py-12 text-center">
      <div className="grid size-10 place-items-center rounded-lg border border-border/60 bg-background text-muted-foreground">
        {icon}
      </div>
      <h3 className="mt-3 font-serif text-lg font-semibold text-foreground">{title}</h3>
      <p className="mt-1 max-w-md text-xs leading-relaxed text-muted-foreground">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

function PriorityTile({ row }: { row: SeriesRow }) {
  const tone =
    row.overdueTaskCount > 0
      ? {
          card: "border-rose-200 bg-rose-50/50 dark:border-rose-500/30 dark:bg-rose-500/10",
          badge: "bg-rose-500/10 text-rose-700 dark:text-rose-300",
        }
      : row.revisionTaskCount > 0
        ? {
            card: "border-amber-200 bg-amber-50/50 dark:border-amber-500/30 dark:bg-amber-500/10",
            badge: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
          }
        : {
            card: "border-border/80 bg-card",
            badge: "bg-muted text-muted-foreground",
          };

  return (
    <Link
      to="/app/series/$slug/$tab"
      params={{ slug: row.series.slug, tab: row.actionTab }}
      className={`rounded-xl border p-4 shadow-xs transition-all hover:-translate-y-0.5 hover:shadow-md ${tone.card}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[13px] font-bold text-foreground">{row.series.title}</p>
          <p className="mt-1 text-[11px] text-muted-foreground">{row.currentChapterLabel}</p>
        </div>
        <span
          className={`shrink-0 rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${tone.badge}`}
        >
          {row.priorityLabel}
        </span>
      </div>
      <div className="mt-3 flex items-center justify-between gap-3 border-t border-border/40 pt-2 text-[11px] text-muted-foreground">
        <span>{row.nextDeadline ? formatDeadline(row.nextDeadline) : "No due date"}</span>
        <span className="inline-flex items-center gap-0.5 font-semibold text-foreground">
          {PRIMARY_ACTION_LABEL[row.primaryAction]}
          <ChevronRight className="size-3" />
        </span>
      </div>
    </Link>
  );
}

function SeriesTableRow({ row }: { row: SeriesRow }) {
  const cover = row.series.coverUrl || row.series.coverFileKey;

  return (
    <TableRow className="hover:bg-muted/30 transition-colors align-top">
      <TableCell>
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid h-10 w-7 shrink-0 place-items-center overflow-hidden rounded border border-border/60 bg-muted font-serif text-[10px] font-semibold text-muted-foreground">
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
              className="block max-w-[30ch] truncate text-xs font-bold text-foreground transition-colors hover:text-primary hover:underline"
            >
              {row.series.title}
            </Link>
            <p className="mt-0.5 line-clamp-1 max-w-[32ch] text-[11px] text-muted-foreground">
              {row.currentChapterLabel}
            </p>
            <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <BookOpen className="size-3" />
              <span>{CADENCE_LABEL[row.series.cadence]}</span>
              <span>·</span>
              <span className="line-clamp-1">
                {row.series.genres.slice(0, 2).join(", ") || "No genre"}
              </span>
            </p>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div className="space-y-1">
          <StatusPill status={row.series.status.toLowerCase()} />
          {row.proposal ? (
            <p className="text-[11px] text-muted-foreground">
              Proposal: {PROPOSAL_STATUS_LABEL[row.proposal.status]}
            </p>
          ) : null}
        </div>
      </TableCell>
      <TableCell>
        <div className="min-w-[128px] space-y-1.5">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span>
              {row.publishedCount}/{row.series.targetChapters || row.totalCount || 0}
            </span>
            <span className="font-medium text-foreground">{row.progressPct}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${row.progressPct}%` }}
            />
          </div>
        </div>
      </TableCell>
      <TableCell>
        <WorkloadCell row={row} />
      </TableCell>
      <TableCell>
        <div className="space-y-1 text-[11px] text-muted-foreground">
          <p className="font-medium text-foreground">{row.pendingReviewCount || "-"}</p>
          {row.waitingEditorCount > 0 ? (
            <p>
              {row.waitingEditorCount} editor handoff{row.waitingEditorCount > 1 ? "s" : ""}
            </p>
          ) : null}
        </div>
      </TableCell>
      <TableCell>
        <div className="space-y-1 text-[11px]">
          <p className="font-medium text-foreground">{formatShortDate(row.nextDeadline)}</p>
          {row.nextDeadline ? (
            <p className="text-[11px] text-muted-foreground">{formatDeadline(row.nextDeadline)}</p>
          ) : (
            <p className="text-[11px] text-muted-foreground">Not scheduled</p>
          )}
        </div>
      </TableCell>
      <TableCell>
        <div className="space-y-1 text-[11px] text-muted-foreground">
          <p className="font-medium text-foreground">{row.series.editorName}</p>
          <p className="flex items-center gap-1">
            <Users className="size-3" />
            {row.series.assistantIds.length} assistants
          </p>
        </div>
      </TableCell>
      <TableCell className="text-[11px] text-muted-foreground">
        {formatUpdated(row.series.updatedAt)}
      </TableCell>
      <TableCell className="text-right">
        <Link
          to="/app/series/$slug/$tab"
          params={{ slug: row.series.slug, tab: "overview" }}
          className="inline-flex items-center gap-1 whitespace-nowrap rounded border border-primary/20 bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary transition-all hover:bg-primary/20"
        >
          View
          <ChevronRight className="size-3" />
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
      className="block min-w-0 overflow-hidden rounded-xl border border-border/80 bg-card p-4 shadow-xs"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[13px] font-bold text-foreground">{row.series.title}</p>
          <p className="mt-1 line-clamp-1 text-[11px] text-muted-foreground">
            {row.currentChapterLabel}
          </p>
        </div>
        <StatusPill status={row.series.status.toLowerCase()} className="shrink-0" />
      </div>

      <div className="mt-3 grid min-w-0 grid-cols-2 gap-2">
        <MobileMetric label="Progress" value={`${row.progressPct}%`} />
        <MobileMetric label="Open work" value={row.openTaskCount || "-"} />
        <MobileMetric label="Review" value={row.pendingReviewCount || "-"} />
        <MobileMetric
          label="Deadline"
          value={row.nextDeadline ? formatDeadline(row.nextDeadline) : "-"}
        />
      </div>

      <div className="mt-3 flex min-w-0 items-center justify-between gap-3 border-t border-border/60 pt-3 text-[11px]">
        <span className="min-w-0 truncate text-muted-foreground">{row.series.editorName}</span>
        <span className="inline-flex shrink-0 items-center gap-1 font-semibold text-foreground">
          {PRIMARY_ACTION_LABEL[row.primaryAction]}
          <ArrowRight className="size-3.5" />
        </span>
      </div>
    </Link>
  );
}

function MobileMetric({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="min-w-0 rounded-lg border border-border/60 bg-background p-2">
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 font-semibold text-foreground">{value}</p>
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

function WorkloadCell({ row }: { row: SeriesRow }) {
  if (row.openTaskCount === 0 && row.revisionTaskCount === 0 && row.overdueTaskCount === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
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
      {row.revisionTaskCount > 0 ? (
        <WorkloadBadge tone="risk" label={`${row.revisionTaskCount} revision needed`} />
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
