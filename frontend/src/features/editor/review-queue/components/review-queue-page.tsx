import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Clock, FileWarning, RefreshCw, ShieldAlert } from "lucide-react";
import { useChaptersForSeriesQuery, useCommentsQuery, useMySeriesQuery } from "@/entities/series";
import { useProposalsQuery } from "@/features/proposals";
import { useEditorReviewQueueQuery } from "@/features/series";
import { useAuth } from "@/shared/auth";
import {
  DataPagination,
  QueueActionButton,
  QueuePage,
  QueueTable,
  QueueTabs,
  SearchToolbar,
  StatCard,
  type QueueTab,
} from "@/shared/ui";
import { useSortableData } from "@/shared/lib/use-sortable-data";
import {
  buildReviewQueue,
  buildSubmissionReviewItems,
  type ReviewItem,
} from "../../model/editor-access";
import {
  isItemCompleted,
  isItemOverdue,
  isNewReviewItem,
  reviewQueueColumns,
  reviewRowAccent,
} from "./review-queue-table";

type TabKey = "ALL" | "NEW" | "NEEDS" | "RESUBMITTED" | "BLOCKING" | "OVERDUE" | "COMPLETED";

const PAGE_SIZE = 8;
const PRIORITY_ORDER: Record<string, number> = { BLOCKING: 4, HIGH: 3, NORMAL: 2, LOW: 1 };

function matchesTab(item: ReviewItem, tab: TabKey): boolean {
  switch (tab) {
    case "ALL":
      return true;
    case "NEW":
      return isNewReviewItem(item);
    case "NEEDS":
      return !isItemCompleted(item);
    case "RESUBMITTED":
      return Boolean(item.revisionReturned);
    case "BLOCKING":
      return item.priority === "BLOCKING";
    case "OVERDUE":
      return isItemOverdue(item);
    case "COMPLETED":
      return isItemCompleted(item);
  }
}

export function ReviewQueuePage() {
  const user = useAuth((s) => s.user);
  const queryClient = useQueryClient();
  const { data: proposals = [] } = useProposalsQuery();
  const { data: series = [] } = useMySeriesQuery();
  const seriesIds = useMemo(() => series.map((item) => item.id), [series]);
  const { data: chapters = [] } = useChaptersForSeriesQuery(seriesIds);
  const { data: comments = [] } = useCommentsQuery({});
  const { data: liveSubmissions = [], isLoading } = useEditorReviewQueueQuery();
  const [tab, setTab] = useState<TabKey>("ALL");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const queue = useMemo(() => {
    if (!user) return [];
    return [
      ...buildSubmissionReviewItems(liveSubmissions),
      ...buildReviewQueue(proposals, chapters, series, comments, user.id),
    ];
  }, [user, liveSubmissions, proposals, chapters, series, comments]);

  const counts = useMemo(
    () => ({
      ALL: queue.length,
      NEW: queue.filter((i) => matchesTab(i, "NEW")).length,
      NEEDS: queue.filter((i) => matchesTab(i, "NEEDS")).length,
      RESUBMITTED: queue.filter((i) => matchesTab(i, "RESUBMITTED")).length,
      BLOCKING: queue.filter((i) => matchesTab(i, "BLOCKING")).length,
      OVERDUE: queue.filter((i) => matchesTab(i, "OVERDUE")).length,
      COMPLETED: queue.filter((i) => matchesTab(i, "COMPLETED")).length,
    }),
    [queue],
  );

  const tabbed = useMemo(() => queue.filter((item) => matchesTab(item, tab)), [queue, tab]);
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return tabbed;
    return tabbed.filter(
      (item) =>
        item.title.toLowerCase().includes(needle) ||
        (item.seriesTitle ?? "").toLowerCase().includes(needle) ||
        item.status.toLowerCase().includes(needle),
    );
  }, [tabbed, query]);

  const { sorted, sortKey, sortDirection, toggleSort } = useSortableData(
    filtered,
    {
      priority: (item) => PRIORITY_ORDER[item.priority] ?? 0,
      item: (item) => item.title,
      status: (item) => item.status,
      submitted: (item) => new Date(item.submittedAt),
      due: (item) => (item.deadline ? new Date(item.deadline) : undefined),
      revision: (item) => Number(Boolean(item.revisionReturned)),
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
    { key: "NEW", label: "New", count: counts.NEW },
    { key: "NEEDS", label: "Needs Review", count: counts.NEEDS },
    { key: "RESUBMITTED", label: "Resubmitted", count: counts.RESUBMITTED },
    { key: "BLOCKING", label: "Blocking", count: counts.BLOCKING },
    { key: "OVERDUE", label: "Overdue", count: counts.OVERDUE },
    { key: "COMPLETED", label: "Completed", count: counts.COMPLETED },
  ];

  if (!user) return null;

  return (
    <QueuePage
      eyebrow="Editorial"
      title="Editor Reviews"
      description="Newest submissions appear first. Review chapters and packages submitted by mangaka before publication."
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
            value={counts.NEEDS}
            hint="Awaiting editor review"
          />
          <StatCard
            tone="orange"
            icon={<ShieldAlert className="size-4" />}
            label="Blocking Issues"
            value={counts.BLOCKING}
            hint="Require attention"
          />
          <StatCard
            tone="rose"
            icon={<Clock className="size-4" />}
            label="Overdue"
            value={counts.OVERDUE}
            hint="Past due date"
          />
          <StatCard
            tone="emerald"
            icon={<CheckCircle2 className="size-4" />}
            label="Completed"
            value={counts.COMPLETED}
            hint="Cleared items"
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
          placeholder="Search review item"
          inputClassName="w-64"
        />
      }
      footer={
        <DataPagination
          total={sorted.length}
          page={page}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
          itemName="items"
        />
      }
    >
      <QueueTable
        columns={reviewQueueColumns(user.id)}
        rows={paged}
        getRowKey={(item) => item.id}
        getRowAccent={reviewRowAccent}
        sortKey={sortKey}
        sortDirection={sortDirection}
        onSort={toggleSort}
        fixed
        empty={isLoading ? "Loading review queue..." : "No items require review."}
      />
    </QueuePage>
  );
}
