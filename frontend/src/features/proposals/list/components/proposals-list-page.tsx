import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileText,
  Loader2,
  Plus,
  Search,
  Users,
} from "lucide-react";
import { useAuth } from "@/shared/auth";
import { DataPagination, DataTable, ResolvedImage, SortableHeader, Surface } from "@/shared/ui";
import { useProposalsQuery } from "@/features/proposals";
import { ProposalStatusPill } from "@/entities/proposal";
import type { ProposalStatus, SeriesProposal } from "@/entities/proposal/model/proposal-types";
import { useSortableData } from "@/shared/lib/use-sortable-data";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const STATUS_FILTERS: { value: ProposalStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "All Statuses" },
  { value: "DRAFT", label: "Draft" },
  { value: "PENDING_EDITOR", label: "Pending Editor" },
  { value: "CHANGES_REQUESTED", label: "Changes Requested" },
  { value: "PENDING_BOARD", label: "Pending Board" },
  { value: "APPROVED", label: "Approved (Series)" },
  { value: "REJECTED", label: "Rejected" },
  { value: "WITHDRAWN", label: "Withdrawn" },
];

type SortableProposalKey = "title" | "author" | "status" | "editor" | "updated";

function timeAgo(iso: string) {
  const d = (Date.now() - new Date(iso).getTime()) / 1000;
  if (d < 60) return "just now";
  if (d < 3600) return `${Math.floor(d / 60)}m ago`;
  if (d < 86400) return `${Math.floor(d / 3600)}h ago`;
  return `${Math.floor(d / 86400)}d ago`;
}

export function ProposalsListPage() {
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

  const stats = useMemo(() => {
    return {
      total: proposals.length,
      inReview: proposals.filter((p) =>
        ["PENDING_EDITOR", "EDITOR_REVIEWING", "CHANGES_REQUESTED"].includes(p.status),
      ).length,
      pendingBoard: proposals.filter((p) => ["PENDING_BOARD", "BOARD_REVIEW"].includes(p.status))
        .length,
      approved: proposals.filter((p) => p.status === "APPROVED").length,
    };
  }, [proposals]);

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

  if (isLoading) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col gap-4 border-b border-border/60 pb-5 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground font-serif">
            Series Proposals Register
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Track manga series proposals from draft creation through editor review, Board approval,
            and production greenlight.
          </p>
        </div>

        {user.role === "mangaka" && (
          <Link
            to="/app/proposals/new"
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm hover:opacity-95 transition-all shrink-0"
          >
            <Plus className="size-4" /> New Proposal
          </Link>
        )}
      </div>

      {/* SaaS Metric Strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 bg-card/60 p-3 rounded-xl border border-border/80 text-xs">
        <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-background/80 border border-border/40">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 font-bold">
            <FileText className="size-4" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-muted-foreground">Total Proposals</p>
            <p className="text-base font-bold tracking-tight">{stats.total}</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-background/80 border border-border/40">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-400">
            <Clock className="size-4" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-muted-foreground">Editor Review</p>
            <p className="text-base font-bold tracking-tight">{stats.inReview}</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-background/80 border border-border/40">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-purple-500/10 text-purple-700 dark:text-purple-400">
            <Users className="size-4" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-muted-foreground">Board Vote</p>
            <p className="text-base font-bold tracking-tight">{stats.pendingBoard}</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-background/80 border border-border/40">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 className="size-4" />
          </div>
          <div>
            <p className="text-[11px] font-medium text-muted-foreground">Greenlit Series</p>
            <p className="text-base font-bold tracking-tight">{stats.approved}</p>
          </div>
        </div>
      </div>

      {/* Main Table Register Surface */}
      <Surface className="space-y-4 overflow-hidden p-4 rounded-xl border-border/80 shadow-xs">
        {/* Search & Filter Controls */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search title, mangaka, editor, or genre..."
              className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as typeof status)}
              className="h-9 rounded-md border border-input bg-background px-3 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {STATUS_FILTERS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>

            {user.role === "editor" && (
              <div className="flex h-9 overflow-hidden rounded-md border border-input bg-muted/40 text-xs">
                {(["assigned", "all"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setScope(s)}
                    className={`px-3 font-semibold transition-colors ${
                      scope === s
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {s === "assigned" ? "Assigned to Me" : "All Editorial"}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* High-density Proposals Data Table */}
        <DataTable
          isEmpty={sorted.length === 0}
          emptyTitle="No proposals found"
          emptyDescription="Adjust your search query or filter selection."
          className="shadow-none border-none"
        >
          <Table className="text-xs">
            <TableHeader className="bg-muted/40 uppercase tracking-wider text-[10px] font-semibold text-muted-foreground border-b border-border">
              <TableRow>
                <TableHead className="w-12">Cover</TableHead>
                <TableHead className="min-w-[260px]">
                  <SortableHeader
                    label="Title & Genres"
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
                    label="Assigned Editor"
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
                <TableHead className="w-24 text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-border">
              {paged.map((proposal) => {
                const isEdit =
                  proposal.status === "DRAFT" || proposal.status === "CHANGES_REQUESTED";
                const isEditorReview = ["PENDING_EDITOR", "EDITOR_REVIEWING"].includes(
                  proposal.status,
                );
                const isBoardReview = ["PENDING_BOARD", "BOARD_REVIEW"].includes(proposal.status);

                let actionLabel = "View";
                let actionStyle =
                  "border border-primary/20 bg-primary/10 text-primary hover:bg-primary/20 font-semibold";

                if (isEdit && user.role === "mangaka") {
                  actionLabel = "Edit Draft";
                  actionStyle =
                    "border border-amber-500/30 bg-amber-500/15 text-amber-800 dark:text-amber-300 hover:bg-amber-500/25 font-semibold";
                } else if (isEditorReview && user.role === "editor") {
                  actionLabel = "Review";
                  actionStyle =
                    "bg-purple-600 text-white hover:bg-purple-700 shadow-xs font-semibold";
                } else if (isBoardReview && user.role === "board") {
                  actionLabel = "Vote";
                  actionStyle =
                    "bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs font-semibold";
                }

                return (
                  <TableRow key={proposal.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell>
                      <ResolvedImage
                        fileKey={proposal.coverFileKey}
                        fallbackUrl={proposal.coverUrl}
                        alt=""
                        className="h-10 w-7 rounded border border-border/60 object-cover shadow-2xs"
                      />
                    </TableCell>
                    <TableCell>
                      <Link
                        to="/app/proposals/$proposalId"
                        params={{ proposalId: proposal.id }}
                        search={isEdit ? { edit: 1 } : undefined}
                        className="block max-w-[34ch] truncate font-bold text-foreground hover:text-primary hover:underline transition-colors"
                      >
                        {proposal.title}
                      </Link>
                      <p className="mt-0.5 line-clamp-1 text-[11px] text-muted-foreground">
                        {proposal.genres.slice(0, 3).join(" / ") || "No genre"} ·{" "}
                        {proposal.chaptersPlanned ?? 12} Chs
                      </p>
                    </TableCell>
                    <TableCell className="font-medium text-foreground">
                      {proposal.authorName}
                    </TableCell>
                    <TableCell>
                      <ProposalStatusPill status={proposal.status} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {proposal.assignedEditorName ?? "—"}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {timeAgo(proposal.updatedAt)}
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <Link
                        to="/app/proposals/$proposalId"
                        params={{ proposalId: proposal.id }}
                        search={isEdit ? { edit: 1 } : undefined}
                        className={`inline-flex items-center gap-1 rounded px-2.5 py-1 text-[11px] transition-all ${actionStyle}`}
                      >
                        {actionLabel} <ChevronRight className="size-3" />
                      </Link>
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

export { ProposalsListPage as SubmissionsListPage };
