import { useMemo, useState } from "react";
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
  StatCard,
  type QueueTab,
} from "@/shared/ui";
import {
  buildReviewQueue,
  buildSubmissionReviewItems,
  type ReviewItem,
} from "../../model/editor-access";
import {
  isItemCompleted,
  isItemOverdue,
  reviewQueueColumns,
  reviewRowAccent,
} from "./review-queue-table";

type TabKey = "ALL" | "NEEDS" | "RESUBMITTED" | "BLOCKING" | "OVERDUE" | "COMPLETED";

const PAGE_SIZE = 8;

function matchesTab(item: ReviewItem, tab: TabKey): boolean {
  switch (tab) {
    case "ALL":
      return true;
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
      NEEDS: queue.filter((i) => matchesTab(i, "NEEDS")).length,
      RESUBMITTED: queue.filter((i) => matchesTab(i, "RESUBMITTED")).length,
      BLOCKING: queue.filter((i) => matchesTab(i, "BLOCKING")).length,
      OVERDUE: queue.filter((i) => matchesTab(i, "OVERDUE")).length,
      COMPLETED: queue.filter((i) => matchesTab(i, "COMPLETED")).length,
    }),
    [queue],
  );

  const filtered = useMemo(() => queue.filter((item) => matchesTab(item, tab)), [queue, tab]);
  const paged = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page],
  );

  const tabs: QueueTab[] = [
    { key: "ALL", label: "All", count: counts.ALL },
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
      description="Review chapters and packages submitted by mangaka before publication."
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
      footer={
        <DataPagination
          total={filtered.length}
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
        fixed
        empty={isLoading ? "Loading review queue..." : "No items need review."}
      />
    </QueuePage>
  );
}
