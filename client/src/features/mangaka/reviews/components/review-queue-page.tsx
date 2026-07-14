import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AssistantSubmission } from "@/entities/submission/model/assistant-types";
import { buildTaskContext } from "@/entities/task";
import {
  useMyChaptersQuery,
  useMySeriesQuery,
  useStudioTasksQuery,
  useSubmissionsListQuery,
} from "@/features/series";
import { useAuth } from "@/shared/auth";
import { timeAgo } from "@/shared/lib/format-date";
import {
  parseTableStateFromSearchParams,
  resetTableState,
  tableStateToSearchParams,
  type TableState,
} from "@/shared/table";
import {
  QueueActionButton,
  QueuePage,
  SearchToolbar,
  ServerDataTable,
  StatCard,
  StateBlock,
} from "@/shared/ui";
import type { ColumnDef } from "@tanstack/react-table";
import { Link } from "@tanstack/react-router";
import { FileCheck2, FileWarning, RefreshCw, RotateCcw, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const PAGE_SIZE = 8;
const PENDING_REVIEW_FILTER = { status: { type: "select" as const, value: "PENDING" } };
const DEFAULT_REVIEW_QUEUE_TABLE_STATE: Partial<TableState> = {
  pageSize: PAGE_SIZE,
  sortBy: "submittedAt",
  sortDir: "desc",
  filters: PENDING_REVIEW_FILTER,
};
const EMPTY_SUBMISSIONS: AssistantSubmission[] = [];

function hasFile(submission: AssistantSubmission) {
  return Boolean(submission.fileUrl || submission.fileKey);
}

function useReviewQueueTableState() {
  const [tableState, setTableState] = useState<TableState>(() => {
    const parsed = parseTableStateFromSearchParams(
      typeof window === "undefined"
        ? new URLSearchParams()
        : new URLSearchParams(window.location.search),
      DEFAULT_REVIEW_QUEUE_TABLE_STATE,
    );
    return {
      ...parsed,
      filters: {
        ...parsed.filters,
        ...PENDING_REVIEW_FILTER,
      },
    };
  });

  useEffect(() => {
    const params = tableStateToSearchParams(tableState);
    const nextUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState(null, "", nextUrl);
  }, [tableState]);

  return [tableState, setTableState] as const;
}

export function ReviewQueuePage() {
  const user = useAuth((s) => s.user);
  const [tableState, setTableState] = useReviewQueueTableState();
  const {
    data: submissionsList,
    isLoading,
    error: submissionsError,
  } = useSubmissionsListQuery(tableState);
  const { data: tasks = [], error: tasksError } = useStudioTasksQuery({});
  const { data: chapters = [], error: chaptersError } = useMyChaptersQuery();
  const { data: seriesList = [], error: seriesError } = useMySeriesQuery();

  const submissions = submissionsList?.data ?? EMPTY_SUBMISSIONS;
  const pagination = submissionsList?.pagination ?? {
    page: tableState.page,
    pageSize: tableState.pageSize,
    total: 0,
  };
  const sortValue = `${tableState.sortBy ?? "submittedAt"}:${tableState.sortDir}`;
  const filtersActive = tableState.q.trim().length > 0;

  const rows = useMemo(() => {
    return submissions.map((submission) => {
      const task = tasks.find((candidate) => candidate.id === submission.taskId);
      const ctx = task ? buildTaskContext(task, chapters, seriesList) : undefined;
      return {
        submission,
        task,
        taskTitle: task?.title ?? submission.taskId,
        seriesTitle: ctx?.series?.title ?? "—",
        chapterNumber: ctx?.chapter?.number,
      };
    });
  }, [submissions, tasks, chapters, seriesList]);

  const pageStats = useMemo(
    () => ({
      withFile: submissions.filter(hasFile).length,
      needsFile: submissions.filter((submission) => !hasFile(submission)).length,
      assistants: new Set(submissions.map((submission) => submission.assistantId)).size,
    }),
    [submissions],
  );

  const columns = useMemo<ColumnDef<(typeof rows)[number], unknown>[]>(
    () => [
      {
        id: "task",
        header: "Task",
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="truncate font-semibold text-[var(--admin-ink)]">
              {row.original.taskTitle}
            </p>
            <p className="truncate text-[11px] text-[var(--admin-faint)]">
              {row.original.seriesTitle} · Ch.{row.original.chapterNumber ?? "—"}
            </p>
          </div>
        ),
      },
      {
        id: "assistant",
        header: "Assistant",
        cell: ({ row }) => (
          <span className="text-[12px] text-[var(--admin-muted)]">
            {row.original.submission.assistantId}
          </span>
        ),
      },
      {
        id: "version",
        header: "Version",
        cell: ({ row }) => (
          <span className="text-[12px] font-semibold text-[var(--admin-ink)]">
            {row.original.submission.versionLabel}
          </span>
        ),
      },
      {
        id: "file",
        header: "File",
        cell: ({ row }) => (
          <span
            className={
              hasFile(row.original.submission)
                ? "rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-800"
                : "rounded border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-800"
            }
          >
            {hasFile(row.original.submission) ? "Attached" : "Missing"}
          </span>
        ),
      },
      {
        id: "submitted",
        header: "Submitted",
        cell: ({ row }) => (
          <span className="text-[12px] text-[var(--admin-faint)]">
            {timeAgo(row.original.submission.submittedAt)}
          </span>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex justify-end">
            <Link
              to="/app/review/$submissionId"
              params={{ submissionId: row.original.submission.id }}
              className="inline-flex justify-center rounded-[6px] bg-[var(--admin-navy)] px-3 py-1.5 text-[11px] font-semibold text-[var(--admin-cream)] hover:bg-[var(--admin-navy-light)]"
            >
              Open Review
            </Link>
          </div>
        ),
      },
    ],
    [],
  );

  if (!user) return null;

  if (user.role !== "mangaka") {
    return (
      <QueuePage
        eyebrow="Mangaka"
        title="Review Queue"
        description="Assistant submissions awaiting Mangaka owner review."
      >
        <StateBlock
          tone="danger"
          title="Mangaka access required"
          description="Only the Mangaka owner of a series can review assistant submissions here."
        />
      </QueuePage>
    );
  }

  const loadError = submissionsError ?? tasksError ?? chaptersError ?? seriesError;

  if (loadError) {
    return (
      <QueuePage
        eyebrow="Mangaka"
        title="Review Queue"
        description="Assistant submissions awaiting your review."
        actions={
          <QueueActionButton
            icon={<RefreshCw className="size-4" />}
            label="Refresh"
            onClick={() => window.location.reload()}
          />
        }
      >
        <StateBlock
          tone="danger"
          title="Could not load review queue"
          description={loadError instanceof Error ? loadError.message : "Please try again."}
        />
      </QueuePage>
    );
  }

  return (
    <QueuePage
      eyebrow="Mangaka"
      title="Review Queue"
      description="Assistant submissions awaiting your review."
      actions={
        <QueueActionButton
          icon={<RefreshCw className="size-4" />}
          label="Refresh"
          onClick={() => window.location.reload()}
        />
      }
      stats={
        <>
          <StatCard
            tone="rose"
            icon={<FileWarning className="size-4" />}
            label="Needs Review"
            value={pagination.total}
            hint="Server-scoped queue"
          />
          <StatCard
            tone="emerald"
            icon={<FileCheck2 className="size-4" />}
            label="With File"
            value={pageStats.withFile}
            hint="Current page"
          />
          <StatCard
            tone="amber"
            icon={<FileWarning className="size-4" />}
            label="Needs File"
            value={pageStats.needsFile}
            hint="Current page"
          />
          <StatCard
            tone="blue"
            icon={<Users className="size-4" />}
            label="Assistants"
            value={pageStats.assistants}
            hint="Current page"
          />
        </>
      }
    >
      <ServerDataTable
        data={rows}
        columns={columns}
        getRowId={(row) => row.submission.id}
        isLoading={isLoading}
        error={submissionsError}
        emptyTitle="No submissions need review"
        emptyDescription="When an Assistant submits work for a Series you own, it appears here."
        skeletonRows={tableState.pageSize}
        toolbar={
          <SearchToolbar
            query={tableState.q}
            onQueryChange={(q) => setTableState((state) => ({ ...state, q, page: 1 }))}
            placeholder="Search task, file, reviewer note..."
            filters={
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
                  <SelectItem value="version:desc">Highest version</SelectItem>
                  <SelectItem value="updatedAt:desc">Recently updated</SelectItem>
                </SelectContent>
              </Select>
            }
            actions={
              <Button
                type="button"
                variant="outline"
                disabled={!filtersActive}
                onClick={() => setTableState(resetTableState(DEFAULT_REVIEW_QUEUE_TABLE_STATE))}
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
    </QueuePage>
  );
}
