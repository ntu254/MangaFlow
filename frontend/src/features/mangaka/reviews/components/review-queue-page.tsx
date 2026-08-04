// DESIGN CONTRACT — /app/mangaka/submissions/review queue
// THESIS: The mangaka review queue makes the review decision scannable — which
// submissions need the mangaka now, and what was decided before — in one dense
// register; it refuses the cream admin-* editorial palette in favor of the
// light register world shared by /app/proposals, /app/series, and the dashboards.
// OWN-WORLD: standard MangaFlow tokens (white --card, paper --background, ink
// --primary), serif page title, metric strip of four tinted icon-chip tiles,
// segmented status tabs with counts, high-density table with muted uppercase
// tracked header, tinted action pills, amber row tint for missing files,
// dashed-light empty states.
// STORY: a mangaka lands, reads four KPI tiles, picks a status tab, searches by
// task/assistant, sorts any column, opens the review workspace, and returns to
// find the decision filed under its status — never lost.
// FIRST VIEWPORT: header bar (serif "Review Queue" + subtitle, bordered Refresh),
// metric strip, then the register surface: status tabs + search, a sortable
// table of task/assistant/version/status/submitted with per-row "Open Review"
// pills, and pagination.
// FORM: port of the established proposals/dashboard/series light world; no new
// visual system.
// FINISH: unreviewed and undocumented is unfinished; this build ends with the
// finish review, the verdict, and DESIGN.md.
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
  seriesTitle: string;
  chapterNumber?: number;
  assistantName: string;
};

type TabKey = "ALL" | "NEEDS_REVIEW" | "APPROVED" | "REVISION" | "REJECTED";

const PAGE_SIZE = 8;

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
        seriesTitle: ctx?.series?.title ?? "—",
        chapterNumber: ctx?.chapter?.number,
        assistantName,
      };
    });
  }, [submissions, tasks, chapters, seriesList]);

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

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return tabbed;
    return tabbed.filter(
      (row) =>
        row.taskTitle.toLowerCase().includes(needle) ||
        row.seriesTitle.toLowerCase().includes(needle) ||
        row.assistantName.toLowerCase().includes(needle) ||
        row.sub.assistantId.toLowerCase().includes(needle) ||
        row.sub.versionLabel.toLowerCase().includes(needle),
    );
  }, [tabbed, query]);

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
  }, [query, tab]);

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
          <h1 className="font-serif text-2xl font-bold tracking-tight text-foreground">
            Review Queue
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Assistant submissions and your past review decisions.
          </p>
        </div>

        <button
          type="button"
          onClick={() => queryClient.invalidateQueries()}
          className="inline-flex items-center gap-1.5 self-start rounded-lg border border-border bg-card px-3.5 py-2 text-xs font-semibold text-foreground shadow-xs transition-colors hover:bg-muted md:self-auto"
        >
          <RefreshCw className="size-3.5" />
          Refresh
        </button>
      </div>

      {/* Metric Strip */}
      <div className="grid grid-cols-2 gap-3 rounded-xl border border-border/80 bg-card/60 p-3 text-xs sm:grid-cols-4">
        <div className="flex items-center gap-2.5 rounded-lg border border-border/40 bg-background/80 p-2.5">
          <div className="grid size-8 shrink-0 place-items-center rounded-md bg-rose-500/10 text-rose-700 dark:text-rose-400">
            <FileCheck2 className="size-4" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-muted-foreground">Needs Review</p>
            <p className="text-base font-bold tracking-tight">{counts.NEEDS_REVIEW}</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 rounded-lg border border-border/40 bg-background/80 p-2.5">
          <div className="grid size-8 shrink-0 place-items-center rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 className="size-4" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-muted-foreground">Approved</p>
            <p className="text-base font-bold tracking-tight">{counts.APPROVED}</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 rounded-lg border border-border/40 bg-background/80 p-2.5">
          <div className="grid size-8 shrink-0 place-items-center rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-400">
            <RefreshCcw className="size-4" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-muted-foreground">Revision</p>
            <p className="text-base font-bold tracking-tight">{counts.REVISION}</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 rounded-lg border border-border/40 bg-background/80 p-2.5">
          <div className="grid size-8 shrink-0 place-items-center rounded-md bg-indigo-500/10 text-indigo-700 dark:text-indigo-400">
            <XCircle className="size-4" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-muted-foreground">Rejected</p>
            <p className="text-base font-bold tracking-tight">{counts.REJECTED}</p>
          </div>
        </div>
      </div>

      <Surface className="space-y-4 overflow-hidden rounded-xl border-border/80 p-4 shadow-xs">
        {/* Tabs + Search */}
        <div className="flex flex-col gap-3 border-b border-border/60 pb-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-1 rounded-lg bg-muted p-0.5 text-xs font-medium">
            {tabs.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => {
                  setTab(item.key);
                  setPage(1);
                }}
                aria-pressed={tab === item.key}
                className={`rounded-md px-2.5 py-1 text-[11px] transition-all ${
                  tab === item.key
                    ? "bg-background text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {item.label}
                <span className={tab === item.key ? "font-semibold" : ""}> ({item.count})</span>
              </button>
            ))}
          </div>

          <div className="relative w-full lg:max-w-md">
            <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search task, series, assistant, or version"
              aria-label="Search submissions"
              className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
        </div>

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
      </Surface>
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
            {row.seriesTitle} · Ch.{row.chapterNumber ?? "—"}
          </p>
        </div>
      </TableCell>
      <TableCell className="text-muted-foreground">{row.assistantName}</TableCell>
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
          className="inline-flex items-center gap-1 rounded border border-primary/20 bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary transition-all hover:bg-primary/20"
        >
          Open Review <ChevronRight className="size-3" />
        </Link>
      </TableCell>
    </TableRow>
  );
}

function MobileQueueCard({ row }: { row: Row }) {
  const missingFile = !hasFile(row.sub);

  return (
    <div
      className={`min-w-0 overflow-hidden rounded-xl border bg-card p-4 shadow-xs ${
        missingFile ? "border-amber-300/70 dark:border-amber-500/40" : "border-border/80"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[13px] font-bold text-foreground">{row.taskTitle}</p>
          <p className="mt-1 line-clamp-1 text-[11px] text-muted-foreground">
            {row.seriesTitle} · Ch.{row.chapterNumber ?? "—"}
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
          className="inline-flex shrink-0 items-center gap-1 rounded border border-primary/20 bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary transition-all hover:bg-primary/20"
        >
          Open Review <ChevronRight className="size-3" />
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
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/80 bg-card/40 px-6 py-12 text-center">
      <div className="grid size-10 place-items-center rounded-lg border border-border/60 bg-background text-muted-foreground">
        {icon}
      </div>
      <h3 className="mt-3 font-serif text-lg font-semibold text-foreground">{title}</h3>
      <p className="mt-1 max-w-md text-xs leading-relaxed text-muted-foreground">{description}</p>
    </div>
  );
}
