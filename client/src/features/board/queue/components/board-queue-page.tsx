import { Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, RefreshCw, Scale, Vote } from "lucide-react";
import {
  DataPagination,
  EmptyState,
  QueueActionButton,
  QueuePage,
  QueueTable,
  QueueTabs,
  StatCard,
  type QueueAccent,
  type QueueColumn,
  type QueueTab,
} from "@/shared/ui";
import { ProposalStatusPill } from "@/entities/proposal";
import { BoardVoteProgress } from "./board-vote-progress";
import { useBoardQueueQuery } from "../../api/board-queries";
import type { BoardQueueItem } from "../../model/board-adapters";

type TabKey = "ALL" | "PENDING" | "FINALIZE" | "TIE" | "APPROVED" | "REJECTED";

const PAGE_SIZE = 8;

function getStatus(item: BoardQueueItem): "PENDING_BOARD" | "TIE_BREAK" | "APPROVED" | "REJECTED" {
  if (item.decisionStatus === "TIE_BREAK_REQUIRED") return "TIE_BREAK";
  if (item.voteSummary.canFinalize) {
    if (item.voteSummary.approve > item.voteSummary.reject) return "APPROVED";
    if (item.voteSummary.reject > item.voteSummary.approve) return "REJECTED";
  }
  return "PENDING_BOARD";
}

function needsFinalize(item: BoardQueueItem) {
  return getStatus(item) === "PENDING_BOARD" && item.voteSummary.canFinalize;
}

function matchesTab(item: BoardQueueItem, tab: TabKey): boolean {
  const status = getStatus(item);
  switch (tab) {
    case "ALL":
      return true;
    case "PENDING":
      return status === "PENDING_BOARD" && !needsFinalize(item);
    case "FINALIZE":
      return needsFinalize(item);
    case "TIE":
      return status === "TIE_BREAK";
    case "APPROVED":
      return status === "APPROVED";
    case "REJECTED":
      return status === "REJECTED";
  }
}

export function BoardQueuePage() {
  const queryClient = useQueryClient();
  const { data: items, isLoading, error } = useBoardQueueQuery();
  const [tab, setTab] = useState<TabKey>("ALL");
  const [page, setPage] = useState(1);

  const boardItems = useMemo(
    () => (items ?? []).filter((i): i is BoardQueueItem => i.seriesStatus !== "AT_RISK"),
    [items],
  );

  const counts = useMemo(
    () => ({
      ALL: boardItems.length,
      PENDING: boardItems.filter((i) => matchesTab(i, "PENDING")).length,
      FINALIZE: boardItems.filter((i) => matchesTab(i, "FINALIZE")).length,
      TIE: boardItems.filter((i) => matchesTab(i, "TIE")).length,
      APPROVED: boardItems.filter((i) => matchesTab(i, "APPROVED")).length,
      REJECTED: boardItems.filter((i) => matchesTab(i, "REJECTED")).length,
    }),
    [boardItems],
  );

  const filtered = useMemo(
    () => boardItems.filter((item) => matchesTab(item, tab)),
    [boardItems, tab],
  );
  const paged = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page],
  );

  const tabs: QueueTab[] = [
    { key: "ALL", label: "All", count: counts.ALL },
    { key: "PENDING", label: "Pending Vote", count: counts.PENDING },
    { key: "FINALIZE", label: "Needs Finalize", count: counts.FINALIZE },
    { key: "TIE", label: "Tie-break", count: counts.TIE },
    { key: "APPROVED", label: "Approved", count: counts.APPROVED },
    { key: "REJECTED", label: "Rejected", count: counts.REJECTED },
  ];

  const columns: QueueColumn<BoardQueueItem>[] = [
    {
      key: "proposal",
      header: "Proposal",
      className: "min-w-[220px]",
      render: (item) => (
        <div className="min-w-0">
          <p className="truncate font-semibold text-[var(--admin-ink)]">
            {item.seriesTitle || item.title}
          </p>
          <p className="truncate text-[11px] text-[var(--admin-faint)]">
            {item.genres.slice(0, 2).join(" / ") || "—"}
          </p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (item) => <ProposalStatusPill status={getStatus(item)} />,
    },
    {
      key: "votes",
      header: "Vote Progress",
      className: "w-[340px]",
      render: (item) => <BoardVoteProgress item={item} />,
    },
    {
      key: "action",
      header: "Action",
      align: "right",
      className: "w-[120px]",
      render: (item) => (
        <Link
          to="/app/board/proposals/$proposalId"
          params={{ proposalId: item.id }}
          className="inline-flex justify-center rounded-[6px] bg-[var(--admin-navy)] px-3 py-1.5 text-[11px] font-semibold text-[var(--admin-cream)] hover:bg-[var(--admin-navy-light)]"
        >
          {needsFinalize(item) ? "Finalize" : "Vote"}
        </Link>
      ),
    },
  ];

  if (error) {
    return (
      <div className="mx-auto max-w-7xl p-6">
        <EmptyState
          title="Unable to load queue"
          description="An error occurred while loading data from the server."
        />
      </div>
    );
  }

  return (
    <QueuePage
      eyebrow="Governance"
      title="Board Queue"
      description="Vote, finalize, and inspect proposal decision packages."
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
            tone="blue"
            icon={<Vote className="size-4" />}
            label="Pending Vote"
            value={counts.PENDING}
            hint="Awaiting votes"
          />
          <StatCard
            tone="emerald"
            icon={<CheckCircle2 className="size-4" />}
            label="Needs Finalize"
            value={counts.FINALIZE}
            hint="Quorum reached"
          />
          <StatCard
            tone="amber"
            icon={<Scale className="size-4" />}
            label="Tie-break"
            value={counts.TIE}
            hint="Require resolution"
          />
          <StatCard
            tone="violet"
            icon={<CheckCircle2 className="size-4" />}
            label="Approved"
            value={counts.APPROVED}
            hint="Decided approve"
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
          itemName="proposals"
        />
      }
    >
      <QueueTable
        columns={columns}
        rows={paged}
        getRowKey={(item) => item.id}
        getRowAccent={(item): QueueAccent =>
          getStatus(item) === "TIE_BREAK" ? "amber" : needsFinalize(item) ? "emerald" : null
        }
        minWidth={820}
        empty={isLoading ? "Loading queue…" : "No proposals match the current filter."}
      />
    </QueuePage>
  );
}
