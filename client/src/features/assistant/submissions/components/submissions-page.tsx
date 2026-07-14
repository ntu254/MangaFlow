import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import type { StudioTask } from "@/entities/series/model/studio-types";
import {
  SUBMISSION_STATUS_BADGE,
  SUBMISSION_STATUS_LABEL,
  type AssistantSubmission,
  type SubmissionStatus,
} from "@/entities/submission/model/assistant-types";
import { buildTaskContext } from "@/entities/task";
import { useSubmissionsListQuery } from "@/features/series";
import { useAuth } from "@/shared/auth";
import { formatDateTime } from "@/shared/lib/format-date";
import {
  parseTableStateFromSearchParams,
  resetTableState,
  setTableFilter,
  tableStateToSearchParams,
  type TableState,
} from "@/shared/table";
import { PageHeader, SearchToolbar, ServerDataTable } from "@/shared/ui";
import { StatCard } from "@/shared/ui/stat-card";
import type { ColumnDef } from "@tanstack/react-table";
import { Link } from "@tanstack/react-router";
import {
  AlertOctagon,
  CheckCircle2,
  ExternalLink,
  RotateCcw,
  Send,
  X,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  useChaptersForSeriesQuery,
  useMySeriesQuery,
  useStudioTasksQuery,
} from "../../api/assistant-queries";

type StatusFilter = SubmissionStatus | "ALL";

const PAGE_SIZE = 10;
const DEFAULT_SUBMISSION_TABLE_STATE: Partial<TableState> = {
  pageSize: PAGE_SIZE,
  sortBy: "submittedAt",
  sortDir: "desc",
};

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "ALL", label: "All status" },
  ...(Object.keys(SUBMISSION_STATUS_LABEL) as SubmissionStatus[]).map((status) => ({
    value: status,
    label: SUBMISSION_STATUS_LABEL[status],
  })),
];

function useSubmissionTableState() {
  const [tableState, setTableState] = useState(() =>
    parseTableStateFromSearchParams(
      typeof window === "undefined"
        ? new URLSearchParams()
        : new URLSearchParams(window.location.search),
      DEFAULT_SUBMISSION_TABLE_STATE,
    ),
  );

  useEffect(() => {
    const params = tableStateToSearchParams(tableState);
    const nextUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState(null, "", nextUrl);
  }, [tableState]);

  return [tableState, setTableState] as const;
}

function statusCount(items: AssistantSubmission[], status: SubmissionStatus) {
  return items.filter((item) => item.status === status).length;
}

export function SubmissionsPage() {
  const user = useAuth((s) => s.user);
  const [tableState, setTableState] = useSubmissionTableState();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data: seriesList = [] } = useMySeriesQuery();
  const seriesIds = useMemo(() => seriesList.map((series) => series.id), [seriesList]);
  const { data: chapters = [] } = useChaptersForSeriesQuery(seriesIds);
  const { data: tasks = [] } = useStudioTasksQuery({});
  const { data: submissionList, isLoading, error } = useSubmissionsListQuery(tableState);

  const items = submissionList?.data ?? [];
  const pagination = submissionList?.pagination ?? {
    page: tableState.page,
    pageSize: tableState.pageSize,
    total: 0,
  };
  const selected = selectedId ? items.find((item) => item.id === selectedId) : undefined;
  const statusFilter =
    tableState.filters.status?.type === "select"
      ? (String(tableState.filters.status.value) as StatusFilter)
      : "ALL";
  const seriesFilter =
    tableState.filters.seriesId?.type === "select"
      ? String(tableState.filters.seriesId.value)
      : "ALL";
  const sortValue = `${tableState.sortBy ?? "submittedAt"}:${tableState.sortDir}`;
  const filtersActive =
    tableState.q.trim().length > 0 || Object.keys(tableState.filters).length > 0;

  const taskById = useMemo(() => new Map(tasks.map((task) => [task.id, task])), [tasks]);
  const columns = useMemo<ColumnDef<AssistantSubmission, unknown>[]>(
    () => [
      {
        id: "version",
        header: "Version",
        cell: ({ row }) => (
          <button
            type="button"
            onClick={() => setSelectedId(row.original.id)}
            className="text-left font-semibold text-[var(--admin-ink)]"
          >
            {row.original.versionLabel}
          </button>
        ),
      },
      {
        id: "taskId",
        header: "Task",
        cell: ({ row }) => {
          const task = taskById.get(row.original.taskId);
          return <span>{task?.title ?? row.original.taskId}</span>;
        },
      },
      {
        id: "seriesId",
        header: "Series",
        cell: ({ row }) => {
          const task = taskById.get(row.original.taskId);
          const ctx = task ? buildTaskContext(task, chapters, seriesList) : undefined;
          return <span className="text-muted-foreground">{ctx?.series?.title ?? "—"}</span>;
        },
      },
      {
        id: "chapterId",
        header: "Ch / Page",
        cell: ({ row }) => {
          const task = taskById.get(row.original.taskId);
          const ctx = task ? buildTaskContext(task, chapters, seriesList) : undefined;
          return (
            <span className="text-muted-foreground">
              Ch.{ctx?.chapter?.number ?? "—"} / P.{String(ctx?.pageIndex ?? 0).padStart(2, "0")}
            </span>
          );
        },
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => (
          <span
            className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${SUBMISSION_STATUS_BADGE[row.original.status]}`}
          >
            {SUBMISSION_STATUS_LABEL[row.original.status]}
          </span>
        ),
      },
      {
        id: "submittedAt",
        header: "Submitted",
        cell: ({ row }) => (
          <span className="text-muted-foreground">{formatDateTime(row.original.submittedAt)}</span>
        ),
      },
      {
        id: "reviewer",
        header: "Reviewer",
        cell: ({ row }) => (
          <span className="text-muted-foreground">{row.original.reviewedByName ?? "—"}</span>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const task = taskById.get(row.original.taskId);
          return (
            <div className="flex justify-end gap-2">
              {task ? (
                <Link
                  to="/app/assistant/tasks/$taskId/studio"
                  params={{ taskId: task.id }}
                  className="rounded bg-foreground px-2 py-1 text-[10px] font-semibold text-background hover:opacity-90"
                >
                  Studio
                </Link>
              ) : null}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSelectedId(row.original.id)}
                className="h-7 px-2 text-[10px]"
              >
                Details
              </Button>
            </div>
          );
        },
      },
    ],
    [chapters, seriesList, taskById],
  );

  if (!user) return null;

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Workspace"
        title="Submissions"
        description={`${pagination.total} submissions scoped to your assistant account.`}
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          tone="sky"
          icon={<Send className="size-4" />}
          label="Submitted"
          value={statusCount(items, "SUBMITTED")}
        />
        <StatCard
          tone="orange"
          icon={<AlertOctagon className="size-4" />}
          label="Revision"
          value={
            statusCount(items, "MANGAKA_REVISION_REQUESTED") +
            statusCount(items, "EDITOR_REVISION_REQUESTED")
          }
        />
        <StatCard
          tone="emerald"
          icon={<CheckCircle2 className="size-4" />}
          label="Approved"
          value={statusCount(items, "APPROVED")}
        />
        <StatCard
          tone="rose"
          icon={<XCircle className="size-4" />}
          label="Rejected"
          value={statusCount(items, "REJECTED")}
        />
      </div>

      <ServerDataTable
        data={items}
        columns={columns}
        getRowId={(submission) => submission.id}
        isLoading={isLoading}
        error={error}
        emptyTitle="You have not submitted anything yet"
        emptyDescription="Submit work from Task Studio to track status, reviewer feedback, and approved work here."
        skeletonRows={tableState.pageSize}
        toolbar={
          <SearchToolbar
            query={tableState.q}
            onQueryChange={(q) => setTableState((state) => ({ ...state, q, page: 1 }))}
            placeholder="Search file, reviewer note, task..."
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
                  value={sortValue}
                  onValueChange={(value) => {
                    const [sortBy, sortDir] = value.split(":") as [string, "asc" | "desc"];
                    setTableState((state) => ({ ...state, sortBy, sortDir, page: 1 }));
                  }}
                >
                  <SelectTrigger className="h-10 w-[180px] rounded-[6px] border-[var(--admin-border)] bg-[var(--admin-surface)] text-[13px] shadow-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="submittedAt:desc">Newest submitted</SelectItem>
                    <SelectItem value="submittedAt:asc">Oldest submitted</SelectItem>
                    <SelectItem value="status:asc">Status A-Z</SelectItem>
                    <SelectItem value="version:desc">Highest version</SelectItem>
                    <SelectItem value="updatedAt:desc">Recently updated</SelectItem>
                  </SelectContent>
                </Select>
              </>
            }
            actions={
              <Button
                type="button"
                variant="outline"
                disabled={!filtersActive}
                onClick={() => setTableState(resetTableState(DEFAULT_SUBMISSION_TABLE_STATE))}
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
          itemName: "submissions",
        }}
      />

      <SubmissionDetailDrawer
        submission={selected}
        getTask={(id) => taskById.get(id)}
        open={!!selected}
        onOpenChange={(open) => !open && setSelectedId(null)}
      />
    </div>
  );
}

function SubmissionDetailDrawer({
  submission,
  getTask,
  open,
  onOpenChange,
}: {
  submission?: AssistantSubmission;
  getTask: (id: string) => StudioTask | undefined;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  if (!submission) return null;
  const task = getTask(submission.taskId);
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full max-w-md overflow-y-auto p-0 sm:max-w-md">
        <div className="flex items-start justify-between border-b border-border p-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              {submission.versionLabel} · {SUBMISSION_STATUS_LABEL[submission.status]}
            </p>
            <p className="mt-1 font-serif text-xl">{task?.title ?? submission.taskId}</p>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="space-y-3 p-4 text-xs">
          <Row k="File" v={submission.fileName ?? "—"} />
          <Row
            k="Size"
            v={submission.fileSizeKB ? `${submission.fileSizeKB.toLocaleString()} KB` : "—"}
          />
          <Row k="Submitted" v={formatDateTime(submission.submittedAt)} />
          <Row k="Reviewer" v={submission.reviewedByName ?? "—"} />
          {submission.note ? (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Note
              </p>
              <p className="mt-1 whitespace-pre-line">{submission.note}</p>
            </div>
          ) : null}
          {submission.feedback ? (
            <div className="rounded border border-orange-200 bg-orange-50 p-2 text-orange-900">
              <p className="text-[10px] font-bold uppercase tracking-widest">Feedback</p>
              <p className="mt-1">{submission.feedback}</p>
            </div>
          ) : null}
          {task ? (
            <Link
              to="/app/assistant/tasks/$taskId/studio"
              params={{ taskId: task.id }}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-foreground px-3 py-2 text-xs font-semibold text-background hover:opacity-90"
            >
              <ExternalLink className="size-3.5" /> View Task Studio
            </Link>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        {k}
      </span>
      <span className="text-right font-semibold">{v}</span>
    </div>
  );
}
