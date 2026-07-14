import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Plus, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProposalStatusPill } from "@/entities/proposal";
import type { ProposalStatus } from "@/entities/proposal/model/proposal-types";
import { STATUS_LABEL } from "@/entities/proposal/model/proposal-types";
import { useProposalsListQuery } from "@/features/proposals";
import { useAuth } from "@/shared/auth";
import {
  parseTableStateFromSearchParams,
  resetTableState,
  setTableFilter,
  tableStateToSearchParams,
  type TableState,
} from "@/shared/table";
import { DataPagination, PageHeader, ResolvedImage, SearchToolbar } from "@/shared/ui";
import { EmptyState } from "@/shared/ui/empty-state";

const STATUS_FILTERS: (ProposalStatus | "ALL")[] = [
  "ALL",
  "DRAFT",
  "PENDING_EDITOR",
  "CHANGES_REQUESTED",
  "PENDING_BOARD",
  "APPROVED",
  "REJECTED",
  "WITHDRAWN",
];

const PAGE_SIZE = 10;
const DEFAULT_PROPOSALS_TABLE_STATE: Partial<TableState> = {
  pageSize: PAGE_SIZE,
  sortBy: "updatedAt",
  sortDir: "desc",
};

function timeAgo(iso: string) {
  const d = (Date.now() - new Date(iso).getTime()) / 1000;
  if (d < 60) return "just now";
  if (d < 3600) return `${Math.floor(d / 60)}m`;
  if (d < 86400) return `${Math.floor(d / 3600)}h`;
  return `${Math.floor(d / 86400)}d`;
}

function useProposalsTableState() {
  const [tableState, setTableState] = useState(() =>
    parseTableStateFromSearchParams(
      typeof window === "undefined"
        ? new URLSearchParams()
        : new URLSearchParams(window.location.search),
      DEFAULT_PROPOSALS_TABLE_STATE,
    ),
  );

  useEffect(() => {
    const params = tableStateToSearchParams(tableState);
    const nextUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState(null, "", nextUrl);
  }, [tableState]);

  return [tableState, setTableState] as const;
}

export function SubmissionsListPage() {
  const user = useAuth((s) => s.user);
  const [tableState, setTableState] = useProposalsTableState();
  const { data: proposalsList, isLoading, error } = useProposalsListQuery(tableState, !!user);

  if (!user) return null;

  const proposals = proposalsList?.data ?? [];
  const pagination = proposalsList?.pagination ?? {
    page: tableState.page,
    pageSize: tableState.pageSize,
    total: 0,
  };
  const statusFilter =
    tableState.filters.status?.type === "select" ? String(tableState.filters.status.value) : "ALL";
  const editorScope =
    tableState.filters.assignedEditorId?.type === "select" &&
    tableState.filters.assignedEditorId.value === user.id
      ? "assigned"
      : "all";
  const sortValue = `${tableState.sortBy ?? "updatedAt"}:${tableState.sortDir}`;
  const filtersActive =
    tableState.q.trim().length > 0 || Object.keys(tableState.filters).length > 0;

  if (isLoading) {
    return (
      <div className="flex min-h-48 items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-6xl space-y-6">
        <PageHeader
          eyebrow="Phase 2 · Series Proposal"
          title="Submissions"
          description="Mangaka proposals series — Editor review — Board vote."
        />
        <EmptyState
          title="Could not load proposals"
          description={error instanceof Error ? error.message : "Please try again."}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        eyebrow="Phase 2 · Series Proposal"
        title="Submissions"
        description="Mangaka proposals series — Editor review — Board vote."
      >
        {user.role === "mangaka" && (
          <Link
            to="/app/submissions/new"
            className="inline-flex items-center gap-1.5 rounded bg-foreground px-3 py-2 text-xs font-semibold text-background hover:bg-foreground/90"
          >
            <Plus className="size-3.5" /> New proposal
          </Link>
        )}
      </PageHeader>

      <SearchToolbar
        query={tableState.q}
        onQueryChange={(q) => setTableState((state) => ({ ...state, q, page: 1 }))}
        placeholder="Search by title, author, synopsis..."
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
                {STATUS_FILTERS.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status === "ALL" ? "All status" : STATUS_LABEL[status]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {user.role === "editor" ? (
              <Select
                value={editorScope}
                onValueChange={(value) =>
                  setTableState((state) =>
                    setTableFilter(
                      state,
                      "assignedEditorId",
                      value === "assigned" ? { type: "select", value: user.id } : undefined,
                    ),
                  )
                }
              >
                <SelectTrigger className="h-10 w-[170px] rounded-[6px] border-[var(--admin-border)] bg-[var(--admin-surface)] text-[13px] shadow-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="assigned">Assigned to me</SelectItem>
                  <SelectItem value="all">All editorial</SelectItem>
                </SelectContent>
              </Select>
            ) : null}
            <Select
              value={sortValue}
              onValueChange={(value) => {
                const [sortBy, sortDir] = value.split(":") as [string, "asc" | "desc"];
                setTableState((state) => ({ ...state, sortBy, sortDir, page: 1 }));
              }}
            >
              <SelectTrigger className="h-10 w-[170px] rounded-[6px] border-[var(--admin-border)] bg-[var(--admin-surface)] text-[13px] shadow-sm">
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
            onClick={() => setTableState(resetTableState(DEFAULT_PROPOSALS_TABLE_STATE))}
            className="h-10 gap-2 rounded-[6px] border-[var(--admin-border)] bg-[var(--admin-surface)] px-4 text-[13px] shadow-sm"
          >
            <RotateCcw className="size-4" />
            Reset
          </Button>
        }
      />

      {proposals.length === 0 ? (
        <EmptyState
          title="No proposals yet"
          description={
            user.role === "mangaka"
              ? 'Click "New proposal" to start your first series proposal.'
              : "No proposals match the filters."
          }
        />
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-card/40">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="w-12 py-2 pl-3">Cover</th>
                <th className="py-2">Title</th>
                <th className="py-2">Mangaka</th>
                <th className="py-2">Status</th>
                <th className="py-2">Editor</th>
                <th className="py-2 pr-3 text-right">Updated</th>
              </tr>
            </thead>
            <tbody>
              {proposals.map((proposal) => (
                <tr key={proposal.id} className="border-t border-border/60 hover:bg-muted/30">
                  <td className="py-2 pl-3">
                    <ResolvedImage
                      fileKey={proposal.coverFileKey}
                      fallbackUrl={proposal.coverUrl}
                      alt=""
                      className="h-10 w-7 rounded object-cover"
                    />
                  </td>
                  <td className="py-2">
                    <Link
                      to="/app/submissions/$id"
                      params={{ id: proposal.id }}
                      className="font-serif text-base font-semibold hover:underline"
                    >
                      {proposal.title}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {proposal.genres.slice(0, 3).join(" · ")}
                    </p>
                  </td>
                  <td className="py-2 text-xs">{proposal.authorName}</td>
                  <td className="py-2">
                    <ProposalStatusPill status={proposal.status} />
                  </td>
                  <td className="py-2 text-xs text-muted-foreground">
                    {proposal.assignedEditorName ?? "—"}
                  </td>
                  <td className="py-2 pr-3 text-right text-xs text-muted-foreground">
                    {timeAgo(proposal.updatedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <DataPagination
        total={pagination.total}
        page={pagination.page}
        pageSize={pagination.pageSize}
        onPageChange={(page) => setTableState((state) => ({ ...state, page }))}
        itemName="proposals"
      />
    </div>
  );
}
