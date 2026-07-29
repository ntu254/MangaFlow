import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { FileCheck2, FileWarning, RefreshCw, Users } from "lucide-react";
import { useAuth } from "@/shared/auth";
import {
  useStudioTasksQuery,
  useMangakaReviewQueueQuery,
  useMyChaptersQuery,
  useMySeriesQuery,
} from "@/features/series";
import { buildTaskContext } from "@/entities/task";
import { ReviewStatusPill } from "@/entities/submission";
import type { AssistantSubmission } from "@/entities/submission/model/assistant-types";
import {
  DataPagination,
  QueueActionButton,
  QueuePage,
  QueueTable,
  QueueTabs,
  SearchToolbar,
  StatCard,
  type QueueAccent,
  type QueueColumn,
  type QueueTab,
} from "@/shared/ui";
import { timeAgo } from "@/shared/lib/format-date";
import { useSortableData } from "@/shared/lib/use-sortable-data";

type Row = {
  sub: AssistantSubmission;
  taskTitle: string;
  seriesTitle: string;
  chapterNumber?: number;
};

type TabKey = "ALL" | "WITH_FILE" | "NEEDS_FILE";

const PAGE_SIZE = 8;

function hasFile(sub: AssistantSubmission) {
  return Boolean(sub.fileUrl || sub.fileKey);
}

export function ReviewQueuePage() {
  const user = useAuth((s) => s.user);
  const queryClient = useQueryClient();
  const { data: submissions = [], isLoading } = useMangakaReviewQueueQuery();
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
      return {
        sub,
        taskTitle: task?.title ?? sub.taskId,
        seriesTitle: ctx?.series?.title ?? "—",
        chapterNumber: ctx?.chapter?.number,
      };
    });
  }, [submissions, tasks, chapters, seriesList]);

  const counts = useMemo(
    () => ({
      ALL: rows.length,
      WITH_FILE: rows.filter((r) => hasFile(r.sub)).length,
      NEEDS_FILE: rows.filter((r) => !hasFile(r.sub)).length,
      assistants: new Set(rows.map((r) => r.sub.assistantId)).size,
    }),
    [rows],
  );

  const tabbed = useMemo(() => {
    if (tab === "WITH_FILE") return rows.filter((r) => hasFile(r.sub));
    if (tab === "NEEDS_FILE") return rows.filter((r) => !hasFile(r.sub));
    return rows;
  }, [rows, tab]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return tabbed;
    return tabbed.filter(
      (row) =>
        row.taskTitle.toLowerCase().includes(needle) ||
        row.seriesTitle.toLowerCase().includes(needle) ||
        row.sub.assistantId.toLowerCase().includes(needle) ||
        row.sub.versionLabel.toLowerCase().includes(needle),
    );
  }, [tabbed, query]);

  const { sorted, sortKey, sortDirection, toggleSort } = useSortableData(
    filtered,
    {
      task: (row) => row.taskTitle,
      assistant: (row) => row.sub.assistantId,
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

  const tabs: QueueTab[] = [
    { key: "ALL", label: "All", count: counts.ALL },
    { key: "WITH_FILE", label: "With file", count: counts.WITH_FILE },
    { key: "NEEDS_FILE", label: "Needs file", count: counts.NEEDS_FILE },
  ];

  const columns: QueueColumn<Row>[] = [
    {
      key: "task",
      header: "Task",
      sortable: true,
      className: "min-w-[220px]",
      render: (row) => (
        <div className="min-w-0">
          <p className="truncate font-semibold text-[var(--admin-ink)]">{row.taskTitle}</p>
          <p className="truncate text-[11px] text-[var(--admin-faint)]">
            {row.seriesTitle} · Ch.{row.chapterNumber ?? "—"}
          </p>
        </div>
      ),
    },
    {
      key: "assistant",
      header: "Assistant",
      sortable: true,
      render: (row) => (
        <span className="text-[12px] text-[var(--admin-muted)]">{row.sub.assistantId}</span>
      ),
    },
    {
      key: "version",
      header: "Version",
      sortable: true,
      render: (row) => (
        <span className="text-[12px] font-semibold text-[var(--admin-ink)]">
          {row.sub.versionLabel}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (row) => <ReviewStatusPill status={row.sub.status} />,
    },
    {
      key: "submitted",
      header: "Submitted",
      sortable: true,
      render: (row) => (
        <span className="text-[12px] text-[var(--admin-faint)]">
          {timeAgo(row.sub.submittedAt)}
        </span>
      ),
    },
    {
      key: "action",
      header: "Action",
      align: "right",
      className: "w-[120px]",
      render: (row) => (
        <Link
          to="/app/mangaka/submissions/$submissionId/review"
          params={{ submissionId: row.sub.id }}
          className="inline-flex justify-center rounded-[6px] bg-[var(--admin-navy)] px-3 py-1.5 text-[11px] font-semibold text-[var(--admin-cream)] hover:bg-[var(--admin-navy-light)]"
        >
          Open Review
        </Link>
      ),
    },
  ];

  if (!user) return null;

  return (
    <QueuePage
      eyebrow="Mangaka"
      title="Review Queue"
      description="Submissions from assistants awaiting your review."
      actions={
        <QueueActionButton
          icon={<RefreshCw className="size-4" />}
          label="Refresh"
          onClick={() => queryClient.invalidateQueries()}
        />
      }
      stats={
        <>
          <StatCard
            tone="rose"
            icon={<FileWarning className="size-4" />}
            label="Needs Review"
            value={counts.ALL}
            hint="Submissions awaiting review"
          />
          <StatCard
            tone="emerald"
            icon={<FileCheck2 className="size-4" />}
            label="With File"
            value={counts.WITH_FILE}
            hint="Has file attached"
          />
          <StatCard
            tone="amber"
            icon={<FileWarning className="size-4" />}
            label="Needs File"
            value={counts.NEEDS_FILE}
            hint="Missing file"
          />
          <StatCard
            tone="blue"
            icon={<Users className="size-4" />}
            label="Assistants"
            value={counts.assistants}
            hint="Submitters"
          />
        </>
      }
      tabs={
        <QueueTabs
          tabs={tabs}
          active={tab}
          onChange={(key) => {
            setTab(key as TabKey);
            setPage(1);
          }}
        />
      }
      toolbar={
        <SearchToolbar
          query={query}
          onQueryChange={setQuery}
          placeholder="Search task or assistant"
          inputClassName="w-64"
        />
      }
      footer={
        <DataPagination
          total={sorted.length}
          page={page}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
          itemName="submissions"
        />
      }
    >
      <QueueTable
        columns={columns}
        rows={paged}
        getRowKey={(row) => row.sub.id}
        getRowAccent={(row): QueueAccent => (!hasFile(row.sub) ? "amber" : null)}
        sortKey={sortKey}
        sortDirection={sortDirection}
        onSort={toggleSort}
        minWidth={820}
        empty={isLoading ? "Loading submissions..." : "No submissions to review."}
      />
    </QueuePage>
  );
}
