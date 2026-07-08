import { Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Search, Loader2 } from "lucide-react";
import { useAuth } from "@/shared/auth";
import { PageHeader, ResolvedImage } from "@/shared/ui";
import { useProposalsQuery } from "@/features/proposals";
import { ProposalStatusPill } from "@/entities/proposal";
import { EmptyState } from "@/shared/ui/empty-state";
import type { ProposalStatus, SeriesProposal } from "@/entities/proposal/model/proposal-types";
import { STATUS_LABEL } from "@/entities/proposal/model/proposal-types";

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

function timeAgo(iso: string) {
  const d = (Date.now() - new Date(iso).getTime()) / 1000;
  if (d < 60) return "vừa xong";
  if (d < 3600) return `${Math.floor(d / 60)}m`;
  if (d < 86400) return `${Math.floor(d / 3600)}h`;
  return `${Math.floor(d / 86400)}d`;
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
        (p) => p.title.toLowerCase().includes(t) || p.authorName.toLowerCase().includes(t),
      );
    }
    return [...list].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [proposals, user, q, status, scope]);

  if (!user) return null;

  if (isLoading) {
    return (
      <div className="flex min-h-48 items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        eyebrow="Phase 2 · Series Proposal"
        title="Submissions"
        description="Mangaka đề xuất series — Editor review — Board vote."
      >
        {(user.role === "mangaka" || user.role === "admin") && (
          <Link
            to="/app/submissions/new"
            className="inline-flex items-center gap-1.5 rounded bg-foreground px-3 py-2 text-xs font-semibold text-background hover:bg-foreground/90"
          >
            <Plus className="size-3.5" /> New proposal
          </Link>
        )}
      </PageHeader>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm theo tên hoặc tác giả…"
            className="h-9 rounded border border-border bg-background pl-8 pr-3 text-sm w-64"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as typeof status)}
          className="h-9 rounded border border-border bg-background px-2 text-sm"
        >
          {STATUS_FILTERS.map((s) => (
            <option key={s} value={s}>
              {s === "ALL" ? "Tất cả status" : STATUS_LABEL[s as ProposalStatus]}
            </option>
          ))}
        </select>
        {user.role === "editor" ? (
          <div className="ml-auto flex rounded border border-border bg-card text-xs">
            {(["assigned", "all"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setScope(s)}
                className={`px-3 py-1.5 font-medium ${scope === s ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted"}`}
              >
                {s === "assigned" ? "Assigned to me" : "All editorial"}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="Chưa có proposal nào"
          description={
            user.role === "mangaka"
              ? "Bấm “New proposal” để bắt đầu đề xuất series đầu tiên."
              : "Không có proposal khớp filter."
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
              {filtered.map((p) => (
                <tr key={p.id} className="border-t border-border/60 hover:bg-muted/30">
                  <td className="py-2 pl-3">
                    <ResolvedImage
                      fileKey={p.coverFileKey}
                      fallbackUrl={p.coverUrl}
                      alt=""
                      className="h-10 w-7 rounded object-cover"
                    />
                  </td>
                  <td className="py-2">
                    <Link
                      to="/app/submissions/$id"
                      params={{ id: p.id }}
                      className="font-serif text-base font-semibold hover:underline"
                    >
                      {p.title}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {p.genres.slice(0, 3).join(" · ")}
                    </p>
                  </td>
                  <td className="py-2 text-xs">{p.authorName}</td>
                  <td className="py-2">
                    <ProposalStatusPill status={p.status} />
                  </td>
                  <td className="py-2 text-xs text-muted-foreground">
                    {p.assignedEditorName ?? "—"}
                  </td>
                  <td className="py-2 pr-3 text-right text-xs text-muted-foreground">
                    {timeAgo(p.updatedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
