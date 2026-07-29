import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { useAuth } from "@/shared/auth";
import {
  DataPagination,
  DataTable,
  PageHeader,
  ResolvedImage,
  SearchToolbar,
  SortableHeader,
  Surface,
} from "@/shared/ui";
import { useProposalsQuery } from "@/features/proposals";
import { ProposalStatusPill } from "@/entities/proposal";
import type { ProposalStatus, SeriesProposal } from "@/entities/proposal/model/proposal-types";
import { STATUS_LABEL } from "@/entities/proposal/model/proposal-types";
import { useSortableData } from "@/shared/lib/use-sortable-data";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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

type SortableProposalKey = "title" | "author" | "status" | "editor" | "updated";

function timeAgo(iso: string) {
  const d = (Date.now() - new Date(iso).getTime()) / 1000;
  if (d < 60) return "just now";
  if (d < 3600) return `${Math.floor(d / 60)}m`;
  if (d < 86400) return `${Math.floor(d / 3600)}h`;
  return `${Math.floor(d / 86400)}d`;
}

function getPageCopy(role: string) {
  if (role === "mangaka") {
    return {
      eyebrow: "Proposal workflow",
      title: "Proposals",
      description:
        "Draft, submit, and track Editor or Board approval before a series enters production.",
    };
  }
  if (role === "editor") {
    return {
      eyebrow: "Editorial",
      title: "Proposal queue",
      description: "Review assigned proposals and move strong candidates to Board approval.",
    };
  }
  if (role === "board") {
    return {
      eyebrow: "Governance",
      title: "Board proposals",
      description: "Inspect proposals currently in Board decision history or awaiting vote.",
    };
  }
  return {
    eyebrow: "Proposal workflow",
    title: "Proposals",
    description: "Search and review proposal records visible to your role.",
  };
}

export function SubmissionsListPage() {
  const user = useAuth((s) => s.user);
  const { data: proposals = [], isLoading } = useProposalsQuery(
    user?.role === "mangaka" ? { authorId: user.id } : undefined,
  );
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<ProposalStatus | "ALL">("ALL");
  const [scope, setScope] = useState<"mine" | "assigned" | "all">(
    user?.role === "mangaka" ? "mine" : user?.role === "editor" ? "assigned" : "all",
  );
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);

  const filtered = useMemo<SeriesProposal[]>(() => {
    if (!user) return [];
    let list = proposals;
    if (user.role === "mangaka") list = list.filter((p) => p.authorId === user.id);
    else if (user.role === "editor") {
      list = list.filter((p) =>
        scope === "assigned"
          ? p.assignedEditorId === user.id
          : scope === "mine"
            ? p.assignedEditorId === user.id
            : [
                "PENDING_EDITOR",
                "CHANGES_REQUESTED",
                "PENDING_BOARD",
                "APPROVED",
                "REJECTED",
              ].includes(p.status),
      );
    } else if (user.role === "board") {
      list = list.filter((p) => ["PENDING_BOARD", "APPROVED", "REJECTED"].includes(p.status));
    } else if (user.role === "assistant") {
      list = list.filter((p) => ["APPROVED"].includes(p.status));
    }
    if (status !== "ALL") list = list.filter((p) => p.status === status);
    if (q.trim()) {
      const t = q.toLowerCase();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(t) ||
          p.authorName.toLowerCase().includes(t) ||
          (p.assignedEditorName ?? "").toLowerCase().includes(t) ||
          p.genres.join(" ").toLowerCase().includes(t),
      );
    }
    return list;
  }, [proposals, user, q, status, scope]);

  const { sorted, sortKey, sortDirection, toggleSort } = useSortableData<SeriesProposal>(
    filtered,
    {
      title: (proposal) => proposal.title,
      author: (proposal) => proposal.authorName,
      status: (proposal) => proposal.status,
      editor: (proposal) => proposal.assignedEditorName,
      updated: (proposal) => new Date(proposal.updatedAt),
    } satisfies Record<
      SortableProposalKey,
      (proposal: SeriesProposal) => string | number | Date | null | undefined
    >,
    { key: "updated", direction: "desc" },
  );

  useEffect(() => {
    setPage(1);
  }, [q, status, scope, pageSize]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paged = useMemo(
    () => sorted.slice((safePage - 1) * pageSize, safePage * pageSize),
    [sorted, safePage, pageSize],
  );

  if (!user) return null;

  const copy = getPageCopy(user.role);

  if (isLoading) {
    return (
      <div className="flex min-h-48 items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader eyebrow={copy.eyebrow} title={copy.title} description={copy.description}>
        {(user.role === "mangaka" || user.role === "admin") && (
          <Link
            to="/app/submissions/new"
            className="inline-flex items-center gap-1.5 rounded-[6px] bg-foreground px-3 py-2 text-xs font-semibold text-background hover:bg-foreground/90"
          >
            <Plus className="size-3.5" /> New proposal
          </Link>
        )}
      </PageHeader>

      <Surface className="space-y-4 overflow-hidden p-3 sm:p-4">
        <SearchToolbar
          query={q}
          onQueryChange={setQ}
          placeholder="Search title, mangaka, editor, or genre..."
          filters={
            <>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as typeof status)}
                className="h-10 rounded-[6px] border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 text-[13px]"
              >
                {STATUS_FILTERS.map((s) => (
                  <option key={s} value={s}>
                    {s === "ALL" ? "All statuses" : STATUS_LABEL[s as ProposalStatus]}
                  </option>
                ))}
              </select>
              {user.role === "editor" ? (
                <div className="flex h-10 overflow-hidden rounded-[6px] border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[12px]">
                  {(["assigned", "all"] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setScope(s)}
                      className={
                        scope === s
                          ? "bg-[var(--admin-navy)] px-3 font-semibold text-[var(--admin-cream)]"
                          : "px-3 font-semibold text-[var(--admin-muted)] hover:bg-[var(--admin-hover)]"
                      }
                    >
                      {s === "assigned" ? "Assigned" : "All editorial"}
                    </button>
                  ))}
                </div>
              ) : null}
            </>
          }
        />

        <DataTable
          isEmpty={sorted.length === 0}
          emptyTitle="No proposals found"
          emptyDescription="Adjust search, status, or scope filters."
          className="shadow-none"
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">Cover</TableHead>
                <TableHead className="min-w-[260px]">
                  <SortableHeader
                    label="Title"
                    sortKey="title"
                    activeSortKey={sortKey}
                    direction={sortDirection}
                    onSort={toggleSort}
                  />
                </TableHead>
                <TableHead>
                  <SortableHeader
                    label="Mangaka"
                    sortKey="author"
                    activeSortKey={sortKey}
                    direction={sortDirection}
                    onSort={toggleSort}
                  />
                </TableHead>
                <TableHead>
                  <SortableHeader
                    label="Status"
                    sortKey="status"
                    activeSortKey={sortKey}
                    direction={sortDirection}
                    onSort={toggleSort}
                  />
                </TableHead>
                <TableHead>
                  <SortableHeader
                    label="Editor"
                    sortKey="editor"
                    activeSortKey={sortKey}
                    direction={sortDirection}
                    onSort={toggleSort}
                  />
                </TableHead>
                <TableHead className="text-right">
                  <SortableHeader
                    label="Updated"
                    sortKey="updated"
                    activeSortKey={sortKey}
                    direction={sortDirection}
                    onSort={toggleSort}
                    className="justify-end"
                  />
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.map((proposal) => {
                const isEdit =
                  proposal.status === "DRAFT" || proposal.status === "CHANGES_REQUESTED";
                return (
                  <TableRow key={proposal.id}>
                    <TableCell>
                      <ResolvedImage
                        fileKey={proposal.coverFileKey}
                        fallbackUrl={proposal.coverUrl}
                        alt=""
                        className="h-10 w-7 rounded object-cover"
                      />
                    </TableCell>
                    <TableCell>
                      <Link
                        to="/app/submissions/$id"
                        params={{ id: proposal.id }}
                        search={isEdit ? { edit: 1 } : undefined}
                        className="block max-w-[34ch] truncate text-[14px] font-semibold text-[var(--admin-ink)] hover:underline"
                      >
                        {proposal.title}
                      </Link>
                      <p className="mt-0.5 line-clamp-1 text-[12px] text-[var(--admin-muted)]">
                        {proposal.genres.slice(0, 3).join(" / ") || "No genre"}
                      </p>
                    </TableCell>
                    <TableCell className="text-[12px] text-[var(--admin-muted)]">
                      {proposal.authorName}
                    </TableCell>
                    <TableCell>
                      <ProposalStatusPill status={proposal.status} />
                    </TableCell>
                    <TableCell className="text-[12px] text-[var(--admin-muted)]">
                      {proposal.assignedEditorName ?? "-"}
                    </TableCell>
                    <TableCell className="text-right text-[12px] text-[var(--admin-muted)]">
                      {timeAgo(proposal.updatedAt)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          <DataPagination
            total={sorted.length}
            page={safePage}
            pageSize={pageSize}
            pageSizeOptions={[8, 12, 20]}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            itemName="proposals"
          />
        </DataTable>
      </Surface>
    </div>
  );
}
