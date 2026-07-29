import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, RefreshCw, Scale, Vote } from "lucide-react";
import {
  DataPagination,
  EmptyState,
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
import { ProposalStatusPill } from "@/entities/proposal";
import { BoardVoteProgress } from "./board-vote-progress";
import { useBoardQueueQuery } from "../../api/board-queries";
import type { BoardQueueItem } from "../../model/board-adapters";
import { useSortableData } from "@/shared/lib/use-sortable-data";

type TabKey = "ALL" | "PENDING" | "FINALIZE" | "TIE";

const PAGE_SIZE = 8;

function getStatus(item: BoardQueueItem): "PENDING_BOARD" | "BOARD_REVIEW" {
  return item.votingSessionId ? "BOARD_REVIEW" : "PENDING_BOARD";
}

function needsFinalize(item: BoardQueueItem) {
  return Boolean(item.votingSessionId) && item.voteSummary.canFinalize;
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
      return item.decisionStatus === "TIE_BREAK_REQUIRED";
  }
}

export function BoardQueuePage() {
  const queryClient = useQueryClient();
  const { data: items, isLoading, error } = useBoardQueueQuery();
  const [tab, setTab] = useState<TabKey>("ALL");
  const [query, setQuery] = useState("");
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
    }),
    [boardItems],
  );

  const tabbed = useMemo(
    () => boardItems.filter((item) => matchesTab(item, tab)),
    [boardItems, tab],
  );

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return tabbed;
    return tabbed.filter(
      (item) =>
        item.title.toLowerCase().includes(needle) ||
        item.seriesTitle.toLowerCase().includes(needle) ||
        item.genres.some((genre) => genre.toLowerCase().includes(needle)),
    );
  }, [tabbed, query]);

  const { sorted, sortKey, sortDirection, toggleSort } = useSortableData(filtered, {
    proposal: (item) => item.seriesTitle || item.title,
    status: (item) => getStatus(item),
    votes: (item) => item.voteCount,
    updatedAt: (item) => (item.updatedAt ? new Date(item.updatedAt) : undefined),
  });

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
    { key: "PENDING", label: "Pending Vote", count: counts.PENDING },
    { key: "FINALIZE", label: "Needs Finalize", count: counts.FINALIZE },
    { key: "TIE", label: "Tie-break", count: counts.TIE },
  ];

  const columns: QueueColumn<BoardQueueItem>[] = [
    {
      key: "proposal",
      header: "Proposal",
      sortable: true,
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
      sortable: true,
      render: (item) => <ProposalStatusPill status={getStatus(item)} />,
    },
    {
      key: "votes",
      header: "Vote Progress",
      sortable: true,
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
            label="Active Queue"
            value={counts.ALL}
            hint="Open governance items"
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
          placeholder="Search proposal or genre"
          inputClassName="w-64"
        />
      }
      footer={
        <DataPagination
          total={sorted.length}
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
        sortKey={sortKey}
        sortDirection={sortDirection}
        onSort={toggleSort}
        getRowAccent={(item): QueueAccent =>
          item.decisionStatus === "TIE_BREAK_REQUIRED"
            ? "amber"
            : needsFinalize(item)
              ? "emerald"
              : null
        }
        minWidth={820}
        empty={isLoading ? "Loading queue…" : "No proposals match the current filter."}
      />
    </QueuePage>
  );
}
