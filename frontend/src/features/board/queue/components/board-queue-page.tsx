import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CheckCircle2, RefreshCw, Vote } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DataPagination,
  EmptyState,
  QueueActionButton,
  QueuePage,
  QueueTable,
  QueueTabs,
  ResolvedImage,
  SearchToolbar,
  StatCard,
  type QueueAccent,
  type QueueColumn,
  type QueueTab,
} from "@/shared/ui";
import { ProposalStatusPill } from "@/entities/proposal";
import { BoardVoteProgress } from "./board-vote-progress";
import {
  useBoardQueueQuery,
  useCreateVotingSessionMutation,
  useVotingSessionsQuery,
} from "../../api/board-queries";
import type { BoardQueueItem } from "../../model/board-adapters";
import { useSortableData } from "@/shared/lib/use-sortable-data";
import { isBoardChair, useAuth } from "@/shared/auth";
import { SESSION_STATUS_LABEL } from "@/entities/board/model/voting-types";

type TabKey = "ATTENTION" | "ALL" | "PENDING" | "FINALIZE";

const PAGE_SIZE = 8;

function getStatus(item: BoardQueueItem): BoardQueueItem["proposalStatus"] {
  return item.proposalStatus;
}

function needsFinalize(item: BoardQueueItem) {
  return Boolean(item.votingSessionId) && item.voteSummary.canFinalize;
}

function matchesTab(item: BoardQueueItem, tab: TabKey): boolean {
  const status = getStatus(item);
  switch (tab) {
    case "ATTENTION":
      return status === "PENDING_BOARD" || status === "BOARD_REVIEW";
    case "ALL":
      return true;
    case "PENDING":
      return status === "PENDING_BOARD" && !needsFinalize(item);
    case "FINALIZE":
      return needsFinalize(item);
  }
}

export function BoardQueuePage() {
  const queryClient = useQueryClient();
  const user = useAuth((state) => state.user);
  const { data: items, isLoading, error } = useBoardQueueQuery();
  const { data: sessions = [] } = useVotingSessionsQuery();
  const [tab, setTab] = useState<TabKey>("ALL");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [sessionTarget, setSessionTarget] = useState<BoardQueueItem | null>(null);
  const canCreateSession = Boolean(user?.role === "board" && user.id && isBoardChair(user.id));

  const boardItems = useMemo(
    () => (items ?? []).filter((i): i is BoardQueueItem => i.riskStatus !== "AT_RISK"),
    [items],
  );

  const counts = useMemo(
    () => ({
      ALL: boardItems.length,
      ATTENTION: boardItems.filter((i) => matchesTab(i, "ATTENTION")).length,
      PENDING: boardItems.filter((i) => matchesTab(i, "PENDING")).length,
      FINALIZE: boardItems.filter((i) => matchesTab(i, "FINALIZE")).length,
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
  const sessionsByProposal = useMemo(
    () =>
      new Map(
        [...sessions]
          .sort(
            (left, right) =>
              Number(right.status === "OPEN") - Number(left.status === "OPEN") ||
              right.openedAt.localeCompare(left.openedAt),
          )
          .flatMap((session) => session.proposalIds.map((id) => [id, session] as const)),
      ),
    [sessions],
  );

  const tabs: QueueTab[] = [
    { key: "ALL", label: "All", count: counts.ALL },
    { key: "FINALIZE", label: "Ready to Finalize", count: counts.FINALIZE },
    { key: "PENDING", label: "Needs Session", count: counts.PENDING },
    { key: "ATTENTION", label: "Needs attention", count: counts.ATTENTION },
  ];

  const columns: QueueColumn<BoardQueueItem>[] = [
    {
      key: "proposal",
      header: "Proposal",
      sortable: true,
      className: "min-w-[280px]",
      render: (item) => (
        <div className="flex min-w-0 items-center gap-3">
          <ResolvedImage
            fileKey={item.coverFileKey}
            fallbackUrl={item.coverUrl}
            alt=""
            className="size-10 shrink-0 rounded-[5px] object-cover"
            fallback={
              <div className="grid size-10 shrink-0 place-items-center rounded-[5px] bg-[var(--admin-page)] text-[10px] font-bold text-[var(--admin-faint)]">
                {(item.seriesTitle || item.title).slice(0, 2).toUpperCase()}
              </div>
            }
          />
          <div className="min-w-0">
          <p className="truncate font-semibold text-[var(--admin-ink)]">
            {item.seriesTitle || item.title}
          </p>
          <p className="truncate text-[11px] text-[var(--admin-faint)]">
            {item.genres.slice(0, 2).join(" / ") || "—"}
          </p>
          </div>
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
      key: "session",
      header: "Session",
      render: (item) => {
        const session = sessionsByProposal.get(item.id);
        if (!session) return <span className="text-[11px] text-[var(--admin-faint)]">Not opened</span>;
        return (
          <div className="min-w-[120px]">
            <p className="font-semibold text-[var(--admin-ink)]">{SESSION_STATUS_LABEL[session.status]}</p>
            <p className="text-[11px] text-[var(--admin-faint)]">
              {session.reVoteOfSessionId ? "Re-vote" : "Round 1"} · {new Date(session.closedAt ?? session.openedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </p>
          </div>
        );
      },
    },
    {
      key: "action",
      header: "Action",
      align: "right",
      className: "w-[150px]",
      render: (item) => (
        <div className="flex justify-end">
          {needsFinalize(item) ? (
            <Link
              to="/app/board/proposals/$proposalId"
              params={{ proposalId: item.id }}
              className="inline-flex justify-center rounded-[6px] bg-emerald-700 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-emerald-800"
            >
              Finalize
            </Link>
          ) : item.votingSessionId ? (
            <Link
              to="/app/board/proposals/$proposalId"
              params={{ proposalId: item.id }}
              className="inline-flex justify-center rounded-[6px] bg-[var(--admin-navy)] px-3 py-1.5 text-[11px] font-semibold text-[var(--admin-cream)] hover:bg-[var(--admin-navy-light)]"
            >
              Review & vote
            </Link>
          ) : item.proposalStatus === "APPROVED" || item.proposalStatus === "REJECTED" ? (
            <Link
              to="/app/board/proposals/$proposalId"
              params={{ proposalId: item.id }}
              className="inline-flex justify-center rounded-[6px] border border-[var(--admin-border)] px-3 py-1.5 text-[11px] font-semibold text-[var(--admin-ink)] hover:border-[var(--admin-navy)]"
            >
              View decision
            </Link>
          ) : canCreateSession ? (
            <button
              type="button"
              onClick={() => setSessionTarget(item)}
              className="inline-flex justify-center rounded-[6px] bg-[var(--admin-navy)] px-3 py-1.5 text-[11px] font-semibold text-[var(--admin-cream)] hover:bg-[var(--admin-navy-light)]"
            >
              Create session
            </button>
          ) : (
            <span className="text-[11px] text-[var(--admin-faint)]">Waiting for Chair</span>
          )}
        </div>
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
      title="Board Review Queue"
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
            label="Needs Session"
            value={counts.PENDING}
          hint="Chair must open a session"
          />
          <StatCard
            tone="emerald"
            icon={<CheckCircle2 className="size-4" />}
            label="Ready to Finalize"
            value={counts.FINALIZE}
            hint="Quorum reached"
          />
          <StatCard
            tone="violet"
            icon={<CheckCircle2 className="size-4" />}
            label="Open Reviews"
            value={counts.ATTENTION}
            hint="Pending vote or finalization"
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
        getRowAccent={(item): QueueAccent => (needsFinalize(item) ? "emerald" : null)}
        minWidth={900}
        empty={isLoading ? "Loading queue…" : "No proposals match the current filter."}
      />
      <CreateSessionDialog
        item={sessionTarget}
        open={Boolean(sessionTarget)}
        onOpenChange={(open) => {
          if (!open) setSessionTarget(null);
        }}
      />
    </QueuePage>
  );
}

function CreateSessionDialog({
  item,
  open,
  onOpenChange,
}: {
  item: BoardQueueItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const createSession = useCreateVotingSessionMutation();
  const [title, setTitle] = useState("");
  const [tiePolicy, setTiePolicy] = useState<"CHAIR_DECIDES" | "REJECT" | "RETURN_TO_BOARD">(
    "CHAIR_DECIDES",
  );

  useEffect(() => {
    if (item) {
      setTitle(`Board review — ${item.seriesTitle}`);
      setTiePolicy("CHAIR_DECIDES");
    }
  }, [item]);

  async function submit() {
    if (!item) return;
    try {
      await createSession.mutateAsync({
        title: title.trim() || `Board review — ${item.seriesTitle}`,
        mode: "AD_HOC",
        proposalId: item.id,
        tiePolicy,
      });
      toast.success("Voting session opened.");
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not open the voting session.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">Open board review</DialogTitle>
          <DialogDescription>
            Open a voting session for this proposal. Board members can vote from the proposal detail.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-muted/30 p-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Proposal
            </p>
            <p className="mt-1 font-semibold text-foreground">{item?.seriesTitle}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              The current proposal version will be frozen for this voting round.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="board-session-title">Session title</Label>
            <Input
              id="board-session-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={200}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="board-session-tie-policy">Tie policy</Label>
            <select
              id="board-session-tie-policy"
              value={tiePolicy}
              onChange={(event) => setTiePolicy(event.target.value as typeof tiePolicy)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="CHAIR_DECIDES">Chair decides after re-vote</option>
              <option value="REJECT">Reject if still tied</option>
              <option value="RETURN_TO_BOARD">Return to Board queue</option>
            </select>
          </div>
        </div>

        <DialogFooter>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={createSession.isPending}
            className="rounded-md border border-border px-3 py-2 text-sm font-semibold hover:bg-muted disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void submit()}
            disabled={!item || createSession.isPending}
            className="rounded-md bg-[var(--admin-navy)] px-3 py-2 text-sm font-semibold text-[var(--admin-cream)] hover:bg-[var(--admin-navy-light)] disabled:opacity-50"
          >
            {createSession.isPending ? "Opening…" : "Create & open voting"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
