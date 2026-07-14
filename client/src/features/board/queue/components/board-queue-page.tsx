import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProposalStatusPill } from "@/entities/proposal";
import {
  parseTableStateFromSearchParams,
  resetTableState,
  setTableFilter,
  tableStateToSearchParams,
  type TableState,
} from "@/shared/table";
import {
  DataPagination,
  EmptyState,
  QueueActionButton,
  QueuePage,
  QueueTable,
  SearchToolbar,
  StatCard,
  type QueueAccent,
  type QueueColumn,
} from "@/shared/ui";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { CheckCircle2, RefreshCw, RotateCcw, Scale, Vote } from "lucide-react";
import { useEffect, useState } from "react";
import { useBoardQueueListQuery } from "../../api/board-queries";
import type { BoardQueueItem } from "../../model/board-adapters";
import { BoardVoteProgress } from "./board-vote-progress";

const PAGE_SIZE = 8;
const DEFAULT_BOARD_QUEUE_TABLE_STATE: Partial<TableState> = {
  pageSize: PAGE_SIZE,
  sortBy: "updatedAt",
  sortDir: "desc",
};

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

function useBoardQueueTableState() {
  const [tableState, setTableState] = useState(() =>
    parseTableStateFromSearchParams(
      typeof window === "undefined"
        ? new URLSearchParams()
        : new URLSearchParams(window.location.search),
      DEFAULT_BOARD_QUEUE_TABLE_STATE,
    ),
  );

  useEffect(() => {
    const params = tableStateToSearchParams(tableState);
    const nextUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState(null, "", nextUrl);
  }, [tableState]);

  return [tableState, setTableState] as const;
}

export function BoardQueuePage() {
  const queryClient = useQueryClient();
  const [tableState, setTableState] = useBoardQueueTableState();
  const { data: queueList, isLoading, error } = useBoardQueueListQuery(tableState);

  const boardItems = queueList?.data ?? [];
  const pagination = queueList?.pagination ?? {
    page: tableState.page,
    pageSize: tableState.pageSize,
    total: 0,
  };
  const summary = queueList?.meta.summary ?? {
    total: 0,
    pending: 0,
    needsFinalize: 0,
    tieBreak: 0,
  };
  const statusFilter =
    tableState.filters.status?.type === "select" ? String(tableState.filters.status.value) : "ALL";
  const sortValue = `${tableState.sortBy ?? "updatedAt"}:${tableState.sortDir}`;
  const filtersActive =
    tableState.q.trim().length > 0 || Object.keys(tableState.filters).length > 0;
  const approvedOnPage = boardItems.filter((item) => getStatus(item) === "APPROVED").length;

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
          description={error instanceof Error ? error.message : "Board queue could not be loaded."}
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
          onClick={() => queryClient.invalidateQueries({ queryKey: ["board", "queue"] })}
        />
      }
      stats={
        <>
          <StatCard
            tone="blue"
            icon={<Vote className="size-4" />}
            label="Pending Vote"
            value={summary.pending}
            hint="Awaiting votes"
          />
          <StatCard
            tone="emerald"
            icon={<CheckCircle2 className="size-4" />}
            label="Needs Finalize"
            value={summary.needsFinalize}
            hint="Quorum reached"
          />
          <StatCard
            tone="amber"
            icon={<Scale className="size-4" />}
            label="Tie-break"
            value={summary.tieBreak}
            hint="Require resolution"
          />
          <StatCard
            tone="violet"
            icon={<CheckCircle2 className="size-4" />}
            label="Approved on Page"
            value={approvedOnPage}
            hint="Current result"
          />
        </>
      }
      toolbar={
        <SearchToolbar
          query={tableState.q}
          onQueryChange={(q) => setTableState((state) => ({ ...state, q, page: 1 }))}
          placeholder="Search proposal title, author, or synopsis"
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
                <SelectTrigger className="h-10 w-[170px] rounded-[6px] border-[var(--admin-border)] bg-[var(--admin-surface)] text-[13px] shadow-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All statuses</SelectItem>
                  <SelectItem value="PENDING_BOARD">Pending Board</SelectItem>
                  <SelectItem value="BOARD_VOTING">Board Voting</SelectItem>
                  <SelectItem value="TIE_BREAK">Tie-break</SelectItem>
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
                  <SelectItem value="updatedAt:desc">Newest updated</SelectItem>
                  <SelectItem value="updatedAt:asc">Oldest updated</SelectItem>
                  <SelectItem value="title:asc">Title A-Z</SelectItem>
                  <SelectItem value="title:desc">Title Z-A</SelectItem>
                  <SelectItem value="status:asc">Status A-Z</SelectItem>
                </SelectContent>
              </Select>
            </>
          }
          actions={
            <Button
              type="button"
              variant="outline"
              disabled={!filtersActive}
              onClick={() => setTableState(resetTableState(DEFAULT_BOARD_QUEUE_TABLE_STATE))}
              className="h-10 gap-2 rounded-[6px] border-[var(--admin-border)] bg-[var(--admin-surface)] px-4 text-[13px] shadow-sm"
            >
              <RotateCcw className="size-4" />
              Reset
            </Button>
          }
        />
      }
      footer={
        <DataPagination
          total={pagination.total}
          page={pagination.page}
          pageSize={pagination.pageSize}
          onPageChange={(page) => setTableState((state) => ({ ...state, page }))}
          itemName="proposals"
        />
      }
    >
      <QueueTable
        columns={columns}
        rows={boardItems}
        getRowKey={(item) => item.id}
        getRowAccent={(item): QueueAccent =>
          getStatus(item) === "TIE_BREAK" ? "amber" : needsFinalize(item) ? "emerald" : null
        }
        minWidth={820}
        empty={isLoading ? "Loading queue..." : "No proposals match the current filter."}
      />
    </QueuePage>
  );
}
