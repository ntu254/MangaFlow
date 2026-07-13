import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowRight,
  Download,
  ExternalLink,
  Eye,
  FileText,
  GitCompare,
  MessageSquare,
  MoreVertical,
  Pencil,
  Send,
  Upload,
} from "lucide-react";
import { useAuth } from "@/shared/auth";
import type {
  SeriesProposal,
  ProposalStatus,
  SupportingMaterialKind,
} from "@/entities/proposal/model/proposal-types";
import { AUDIENCE_LABEL } from "@/entities/proposal/model/proposal-types";
import { ProposalStatusPill } from "@/entities/proposal";
import { ResubmitDialog } from "@/features/proposals";
import { EmptyState } from "@/shared/ui/empty-state";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatDate, formatDateTime } from "@/shared/lib/format-date";
import { checkAction } from "@/entities/proposal";
import type { ProductionSeries } from "@/entities/series/model/series-types";
import { useSeriesProposalQuery, useProposalActionMutation } from "@/features/proposals";
import { useTantouEditorQuery, type TantouEditor, mapApiError } from "../../api/series-queries";
import { cn } from "@/shared/lib/cn";

export function SeriesProposalTab({ series }: { series: ProductionSeries }) {
  const user = useAuth((s) => s.user);
  const { data: proposal, isLoading, isError, error } = useSeriesProposalQuery(series);
  const { data: tantouEditor } = useTantouEditorQuery(series.id);
  const actionMutation = useProposalActionMutation(series.proposalId ?? "", series.id);
  const [resubmitOpen, setResubmitOpen] = useState(false);
  const [showAllFeedback, setShowAllFeedback] = useState(false);

  if (!user) return null;

  if (!series.proposalId) {
    return (
      <EmptyState
        title="Series is not linked to a proposal"
        description="This series is not linked to a proposal yet. A proposal can be created or linked in a separate workflow."
        action={
          <span className="text-xs text-muted-foreground">
            Creating or linking a proposal will be completed in the next story.
          </span>
        }
      />
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-5">
        <div className="grid gap-5 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-48 animate-pulse rounded-xl border border-border bg-card" />
          ))}
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-xl border border-border bg-card" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    const msg = mapApiError(error);
    const is404 = error instanceof Error && error.message.includes("NOT_FOUND");
    const is403 = error instanceof Error && error.message.includes("FORBIDDEN");
    return (
      <EmptyState
        title={is404 ? "Proposal not found" : is403 ? "Access denied" : "Failed to load proposal"}
        description={msg}
        action={
          is403 || is404 ? (
            <Link to="/app/submissions" className="text-xs underline">
              View proposal list
            </Link>
          ) : null
        }
      />
    );
  }

  if (!proposal) {
    return (
      <EmptyState
        title="Series is not linked to a proposal"
        description="This series is not linked to a proposal yet. A proposal can be created or linked in a separate workflow."
        action={
          <span className="text-xs text-muted-foreground">
            Creating or linking a proposal will be completed in the next story.
          </span>
        }
      />
    );
  }

  const canResubmit = checkAction("RESUBMIT", user, proposal).ok;
  const canEdit = checkAction("EDIT", user, proposal).ok;

  return (
    <div className="space-y-5">
      {/* Row 1 — Status / Summary / Feedback */}
      <div className="grid gap-5 lg:grid-cols-3">
        <StatusCard
          proposal={proposal}
          canEdit={canEdit}
          canResubmit={canResubmit}
          onResubmit={() => setResubmitOpen(true)}
          tantouEditor={tantouEditor}
        />
        <SummaryCard proposal={proposal} />
        <RecentFeedbackCard
          proposal={proposal}
          onShowAll={() => setShowAllFeedback((v) => !v)}
          showAll={showAllFeedback}
        />
      </div>

      {/* Row 2 — Creative materials / Version history */}
      <div className="grid gap-5 lg:grid-cols-2">
        <CreativeMaterialsTable proposal={proposal} />
        <VersionHistoryTable proposal={proposal} />
      </div>

      {/* Row 3 — Quick actions */}
      <QuickActionsGrid
        proposal={proposal}
        canEdit={canEdit}
        canResubmit={canResubmit}
        onResubmit={() => setResubmitOpen(true)}
      />

      {showAllFeedback ? <FullFeedbackPanel proposal={proposal} /> : null}

      <ResubmitDialog
        proposal={proposal}
        user={user}
        open={resubmitOpen}
        onClose={() => setResubmitOpen(false)}
        onResubmit={(payload) => actionMutation.mutateAsync({ action: "RESUBMIT", payload })}
      />
    </div>
  );
}

// ---------------- Section helpers ----------------

function SectionHeader({
  index,
  title,
  action,
}: {
  index: number;
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-3 flex items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <span className="inline-flex size-5 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-foreground">
          {index}
        </span>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>
      {action}
    </div>
  );
}

function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <section className={cn("rounded-xl border border-border bg-card p-5", className)}>
      {children}
    </section>
  );
}

// ---------------- 1. Status ----------------

function StatusCard({
  proposal,
  canEdit,
  canResubmit,
  onResubmit,
  tantouEditor,
}: {
  proposal: SeriesProposal;
  canEdit: boolean;
  canResubmit: boolean;
  onResubmit: () => void;
  tantouEditor?: TantouEditor | null;
}) {
  const submitEvents = proposal.history.filter((h) => h.type === "SUBMIT" || h.type === "RESUBMIT");
  const lastSubmit = submitEvents[submitEvents.length - 1];
  const latestVersion = proposal.manuscripts.reduce((m, v) => Math.max(m, v.version), 0);
  const status = proposal.status;
  const alertMsg = STATUS_ALERT[status];

  return (
    <Card>
      <SectionHeader index={1} title="Proposal file status" />
      <div className="space-y-4">
        <ProposalStatusPill status={status} size="lg" />
        <dl className="space-y-2 text-xs">
          <Row label="Current version">v{latestVersion || 1}</Row>
          <Row label="Submitted date">
            {lastSubmit ? formatDate(lastSubmit.createdAt) : "Not submitted"}
          </Row>
          <Row label="Reviewer">
            {(tantouEditor?.userName ?? proposal.assignedEditorName) ? (
              <span className="inline-flex items-center gap-1.5">
                <span className="inline-flex size-5 items-center justify-center rounded-full bg-muted text-[9px] font-bold uppercase">
                  {initials(tantouEditor?.userName ?? proposal.assignedEditorName ?? "")}
                </span>
                {tantouEditor?.userName ?? proposal.assignedEditorName}
              </span>
            ) : (
              "—"
            )}
          </Row>
          <Row label="Last updated">{formatDateTime(proposal.updatedAt)}</Row>
        </dl>

        {alertMsg ? (
          <div className="flex items-start gap-2 rounded border border-orange-200 bg-orange-50 p-2.5 text-[11px] text-orange-900">
            <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
            <span>{alertMsg}</span>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2">
          {canEdit ? (
            <Link
              to="/app/submissions/$id"
              params={{ id: proposal.id }}
              className="inline-flex items-center gap-1.5 rounded bg-foreground px-3 py-1.5 text-xs font-semibold text-background hover:bg-foreground/90"
            >
              <Pencil className="size-3.5" /> Edit proposal
            </Link>
          ) : null}
          {canResubmit ? (
            <button
              type="button"
              onClick={onResubmit}
              className="inline-flex items-center gap-1.5 rounded border border-border bg-background px-3 py-1.5 text-xs font-semibold hover:bg-muted"
            >
              <Upload className="size-3.5" /> Resubmit
            </button>
          ) : null}
          <Link
            to="/app/submissions/$id"
            params={{ id: proposal.id }}
            className="inline-flex items-center gap-1.5 rounded border border-border bg-background px-3 py-1.5 text-xs font-semibold hover:bg-muted"
          >
            <Eye className="size-3.5" /> View details
          </Link>
        </div>
      </div>
    </Card>
  );
}

const STATUS_ALERT: Partial<Record<ProposalStatus, string>> = {
  CHANGES_REQUESTED: "Storyboard updates are required before resubmission.",
  REJECTED: "Proposal was rejected. See feedback for details.",
  TIE_BREAK: "Pending Editor-in-chief breaks ties.",
  DRAFT: "Complete and submit to Editor.",
};

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] items-start gap-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-foreground">{children}</dd>
    </div>
  );
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

// ---------------- 2. Summary ----------------

function SummaryCard({ proposal }: { proposal: SeriesProposal }) {
  const adv = proposal.advanced ?? {};
  const advEntries = [
    ["World setting", adv.worldSetting],
    ["Development direction", adv.seriesDirection],
    ["Production plan", adv.productionPlan],
    ["Assistant needs", adv.assistantNeeds],
    ["Comparable titles", adv.comparableTitles],
    ["AI disclosure", adv.aiDisclosure],
  ].filter(([, v]) => v && String(v).trim());

  return (
    <Card>
      <SectionHeader index={2} title="Proposal summary" />
      <dl className="space-y-2.5 text-xs">
        <SummaryRow label="Title">{proposal.title}</SummaryRow>
        <SummaryRow label="Genre">{proposal.genres.join(", ") || "—"}</SummaryRow>
        <SummaryRow label="Target audience">{AUDIENCE_LABEL[proposal.targetAudience]}</SummaryRow>
        {proposal.logline ? <SummaryRow label="Logline">{proposal.logline}</SummaryRow> : null}
        {proposal.hook ? (
          <SummaryRow label="Hook / Selling point">{proposal.hook}</SummaryRow>
        ) : null}
        <SummaryRow label="Short synopsis">{proposal.synopsis || "—"}</SummaryRow>
        {proposal.mainCharacters ? (
          <SummaryRow label="Main characters">{proposal.mainCharacters}</SummaryRow>
        ) : null}
      </dl>
      {advEntries.length > 0 ? (
        <details className="mt-3 rounded border border-border bg-background">
          <summary className="cursor-pointer list-none px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted/60">
            Advanced details
          </summary>
          <dl className="space-y-2 border-t border-border p-3 text-xs">
            {advEntries.map(([label, value]) => (
              <SummaryRow key={label as string} label={label as string}>
                {value as string}
              </SummaryRow>
            ))}
          </dl>
        </details>
      ) : null}
    </Card>
  );
}

function SummaryRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[minmax(0,110px)_minmax(0,1fr)] items-start gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="whitespace-pre-wrap text-foreground/90">{children}</dd>
    </div>
  );
}

// ---------------- 3. Recent feedback ----------------

type FeedbackEntry = {
  id: string;
  source: "EDITOR" | "BOARD";
  authorName: string;
  createdAt: string;
  body: string;
};

function buildFeedbackEntries(proposal: SeriesProposal): FeedbackEntry[] {
  const fromEditor = proposal.requestedChanges.map((r) => ({
    id: `r-${r.id}`,
    source: "EDITOR" as const,
    authorName: r.editorName,
    createdAt: r.createdAt,
    body:
      r.comment ||
      r.items
        .map((it) => it.text)
        .filter(Boolean)
        .join(" · ") ||
      "Editor requested changes.",
  }));
  const fromBoard = proposal.votes
    .filter((v) => v.comment && v.comment.trim())
    .map((v) => ({
      id: `b-${v.memberId}-${v.createdAt}`,
      source: "BOARD" as const,
      authorName: v.memberName,
      createdAt: v.createdAt,
      body: v.comment!,
    }));
  return [...fromEditor, ...fromBoard].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

function RecentFeedbackCard({
  proposal,
  showAll,
  onShowAll,
}: {
  proposal: SeriesProposal;
  showAll: boolean;
  onShowAll: () => void;
}) {
  const entries = buildFeedbackEntries(proposal);
  const recent = entries.slice(0, 3);

  return (
    <Card>
      <SectionHeader
        index={3}
        title="Recent feedback"
        action={
          entries.length > 0 ? (
            <button
              type="button"
              onClick={onShowAll}
              className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-accent hover:underline"
            >
              {showAll ? "Show less" : "View all"} <ArrowRight className="size-3" />
            </button>
          ) : null
        }
      />
      {recent.length === 0 ? (
        <p className="text-xs text-muted-foreground">No feedback from Editor or Board yet.</p>
      ) : (
        <ul className="space-y-3">
          {recent.map((e) => (
            <li
              key={e.id}
              className="space-y-1 border-b border-border pb-3 last:border-b-0 last:pb-0"
            >
              <div className="flex items-center justify-between gap-2 text-[11px]">
                <span className="inline-flex items-center gap-1.5">
                  <span
                    className={cn(
                      "rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider",
                      e.source === "EDITOR"
                        ? "bg-amber-100 text-amber-900"
                        : "bg-indigo-100 text-indigo-900",
                    )}
                  >
                    {e.source}
                  </span>
                  <span className="font-semibold text-foreground">{e.authorName}</span>
                </span>
                <span className="text-muted-foreground">{formatDate(e.createdAt)}</span>
              </div>
              <p className="line-clamp-2 text-xs text-foreground/90">{e.body}</p>
              <Link
                to="/app/submissions/$id"
                params={{ id: proposal.id }}
                className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-accent hover:underline"
              >
                View details <ArrowRight className="size-3" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function FullFeedbackPanel({ proposal }: { proposal: SeriesProposal }) {
  const entries = buildFeedbackEntries(proposal);
  return (
    <Card>
      <SectionHeader index={3} title="All feedback" />
      {entries.length === 0 ? (
        <p className="text-xs text-muted-foreground">No feedback yet.</p>
      ) : (
        <ul className="space-y-3">
          {entries.map((e) => (
            <li key={e.id} className="rounded border border-border bg-background p-3">
              <div className="flex items-center justify-between text-xs">
                <span className="inline-flex items-center gap-1.5">
                  <span
                    className={cn(
                      "rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider",
                      e.source === "EDITOR"
                        ? "bg-amber-100 text-amber-900"
                        : "bg-indigo-100 text-indigo-900",
                    )}
                  >
                    {e.source}
                  </span>
                  <span className="font-semibold">{e.authorName}</span>
                </span>
                <span className="text-muted-foreground">{formatDateTime(e.createdAt)}</span>
              </div>
              <p className="mt-1.5 whitespace-pre-wrap text-sm text-foreground/90">{e.body}</p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

// ---------------- 4. Creative materials ----------------

type MaterialRowDef = {
  key: string;
  label: string;
  kindLabel: string;
  required?: boolean;
  manuscripts?: boolean;
  materialKind?: SupportingMaterialKind;
};

const MATERIAL_ROWS: MaterialRowDef[] = [
  {
    key: "storyboard",
    label: "Name / Storyboard",
    kindLabel: "Storyboard",
    required: true,
    materialKind: "world",
  },
  {
    key: "manuscript",
    label: "Sample manuscript",
    kindLabel: "Manuscript",
    required: true,
    manuscripts: true,
  },
  {
    key: "character",
    label: "Character sheet",
    kindLabel: "Character Sheet",
    materialKind: "character",
  },
  {
    key: "reference",
    label: "Reference materials",
    kindLabel: "Reference",
    materialKind: "reference",
  },
];

function CreativeMaterialsTable({ proposal }: { proposal: SeriesProposal }) {
  const latestVersion = proposal.manuscripts.reduce((m, v) => Math.max(m, v.version), 0);

  return (
    <Card>
      <SectionHeader index={4} title="Creative materials" />
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="text-left text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            <tr className="border-b border-border">
              <th className="px-2 py-2">Type</th>
              <th className="px-2 py-2">Filename</th>
              <th className="px-2 py-2">Version</th>
              <th className="px-2 py-2">Upload date</th>
              <th className="px-2 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {MATERIAL_ROWS.map((def) => {
              const items = def.manuscripts
                ? proposal.manuscripts
                    .slice()
                    .sort((a, b) => b.version - a.version)
                    .map((m) => ({
                      id: m.id,
                      name: m.fileName,
                      version: m.version,
                      uploadedAt: m.uploadedAt,
                      url: m.fileUrl,
                      isLatest: m.version === latestVersion,
                    }))
                : proposal.materials
                    .filter((m) => m.kind === def.materialKind)
                    .map((m) => ({
                      id: m.id,
                      name: m.fileName,
                      version: undefined as number | undefined,
                      uploadedAt: m.uploadedAt,
                      url: m.fileUrl,
                      isLatest: false,
                    }));

              if (items.length === 0) {
                return (
                  <tr key={def.key} className="border-b border-border/60 last:border-b-0">
                    <td className="px-2 py-2.5 align-top">
                      <MaterialLabel label={def.label} required={def.required} />
                    </td>
                    <td className="px-2 py-2.5 text-muted-foreground" colSpan={3}>
                      Not uploaded
                    </td>
                    <td className="px-2 py-2.5 text-right text-muted-foreground">—</td>
                  </tr>
                );
              }

              return items.map((it, idx) => (
                <tr key={it.id} className="border-b border-border/60 last:border-b-0">
                  <td className="px-2 py-2.5 align-top">
                    {idx === 0 ? <MaterialLabel label={def.label} required={def.required} /> : null}
                  </td>
                  <td className="px-2 py-2.5">
                    <div className="flex items-center gap-2">
                      <FileText className="size-3.5 shrink-0 text-muted-foreground" />
                      <span className="truncate font-medium">{it.name}</span>
                    </div>
                    <div className="mt-0.5 text-[10px] text-muted-foreground">{def.kindLabel}</div>
                  </td>
                  <td className="px-2 py-2.5">
                    {it.version != null ? (
                      <span
                        className={cn(
                          "inline-flex items-center rounded border border-border bg-background px-1.5 py-0.5 text-[10px] font-semibold",
                          it.isLatest && "border-emerald-300 bg-emerald-50 text-emerald-900",
                        )}
                      >
                        v{it.version}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-2 py-2.5 text-muted-foreground">{formatDate(it.uploadedAt)}</td>
                  <td className="px-2 py-2.5">
                    <div className="flex items-center justify-end gap-1">
                      <a
                        href={it.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 rounded px-1.5 py-1 text-[11px] text-accent hover:bg-muted"
                      >
                        <Eye className="size-3" /> Xem
                      </a>
                      <a
                        href={it.url}
                        download
                        className="inline-flex items-center gap-1 rounded px-1.5 py-1 text-[11px] hover:bg-muted"
                      >
                        <Download className="size-3" /> Download
                      </a>
                      <button
                        type="button"
                        disabled
                        className="inline-flex cursor-not-allowed items-center rounded p-1 text-muted-foreground opacity-50"
                        title="Other options (coming soon)"
                      >
                        <MoreVertical className="size-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ));
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function MaterialLabel({ label, required }: { label: string; required?: boolean }) {
  return (
    <div>
      <p className="font-semibold text-foreground">{label}</p>
      {required ? <p className="text-[10px] font-semibold text-rose-600">(Required)</p> : null}
    </div>
  );
}

// ---------------- 5. Version history ----------------

function VersionHistoryTable({ proposal }: { proposal: SeriesProposal }) {
  const versions = proposal.manuscripts.slice().sort((a, b) => b.version - a.version);
  const submitEvents = proposal.history.filter((h) => h.type === "SUBMIT" || h.type === "RESUBMIT");
  const latest = versions[0]?.version ?? 0;

  return (
    <Card>
      <SectionHeader index={5} title="Version history" />
      {versions.length === 0 ? (
        <p className="text-xs text-muted-foreground">No versions yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="text-left text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              <tr className="border-b border-border">
                <th className="px-2 py-2">Version</th>
                <th className="px-2 py-2">Status</th>
                <th className="px-2 py-2">Submitted at</th>
                <th className="px-2 py-2">Reviewed by</th>
                <th className="px-2 py-2">Feedback</th>
                <th className="px-2 py-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {versions.map((v) => {
                const isLatest = v.version === latest;
                const ev = submitEvents.find((e) => e.createdAt >= v.uploadedAt);
                const feedbackCount = proposal.requestedChanges.filter(
                  (r) =>
                    r.createdAt >= v.uploadedAt &&
                    (!r.resolvedInVersion || r.resolvedInVersion >= v.version),
                ).length;
                const status: ProposalStatus = isLatest
                  ? proposal.status
                  : feedbackCount > 0
                    ? "CHANGES_REQUESTED"
                    : "REJECTED";
                const reviewer =
                  isLatest && proposal.status === "PENDING_EDITOR"
                    ? null
                    : proposal.assignedEditorName;

                return (
                  <tr
                    key={v.id}
                    className={cn(
                      "border-b border-border/60 last:border-b-0",
                      isLatest && "bg-muted/40",
                    )}
                  >
                    <td className="px-2 py-2.5 font-semibold">v{v.version}</td>
                    <td className="px-2 py-2.5">
                      <ProposalStatusPill status={status} />
                    </td>
                    <td className="px-2 py-2.5 text-muted-foreground">
                      {ev ? formatDate(ev.createdAt) : formatDate(v.uploadedAt)}
                    </td>
                    <td className="px-2 py-2.5 text-muted-foreground">
                      {reviewer ? (
                        <span className="inline-flex items-center gap-1.5">
                          <span className="inline-flex size-5 items-center justify-center rounded-full bg-muted text-[9px] font-bold uppercase">
                            {initials(reviewer)}
                          </span>
                          {reviewer}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-2 py-2.5 text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <MessageSquare className="size-3" /> {feedbackCount}
                      </span>
                    </td>
                    <td className="px-2 py-2.5 text-right">
                      <a
                        href={v.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-accent hover:underline"
                      >
                        Xem
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

// ---------------- 6. Quick actions ----------------

function QuickActionsGrid({
  proposal,
  canEdit,
  canResubmit,
  onResubmit,
}: {
  proposal: SeriesProposal;
  canEdit: boolean;
  canResubmit: boolean;
  onResubmit: () => void;
}) {
  const versions = proposal.manuscripts.length;

  return (
    <Card>
      <SectionHeader index={6} title="Quick actions" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <QuickAction
          icon={<Pencil className="size-4" />}
          title="Edit proposal"
          description="Open the proposal to update the content."
          to={{ to: "/app/submissions/$id", params: { id: proposal.id } }}
          disabled={!canEdit}
          disabledReason="Proposal cannot be edited right now."
        />
        <QuickAction
          icon={<Upload className="size-4" />}
          title="Upload revision"
          description="Upload a new storyboard or manuscript file."
          onClick={onResubmit}
          disabled={!canResubmit}
          disabledReason="Only available when the Editor requested changes."
        />
        <QuickAction
          icon={<GitCompare className="size-4" />}
          title="Compare versions"
          description="View changes between versions."
          disabled={versions < 2}
          disabledReason="At least 2 versions are required for comparison."
        />
        <QuickAction
          icon={<Send className="size-4" />}
          title="Resubmit proposal"
          description="Send it for editor review."
          onClick={onResubmit}
          disabled={!canResubmit}
          disabledReason="Only available when the Editor requested changes."
        />
      </div>
    </Card>
  );
}

function QuickAction({
  icon,
  title,
  description,
  to,
  onClick,
  disabled,
  disabledReason,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  to?: { to: "/app/submissions/$id"; params: { id: string } };
  onClick?: () => void;
  disabled?: boolean;
  disabledReason?: string;
}) {
  const body = (
    <div
      className={cn(
        "flex h-full items-start gap-3 rounded-lg border border-border bg-background p-3 text-left transition",
        disabled ? "cursor-not-allowed opacity-50" : "hover:border-foreground/30 hover:bg-muted/50",
      )}
    >
      <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-foreground">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="flex items-center justify-between gap-2 text-xs font-semibold text-foreground">
          {title}
          {!disabled ? <ArrowRight className="size-3.5 text-muted-foreground" /> : null}
        </p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">{description}</p>
      </div>
    </div>
  );

  if (disabled) {
    return (
      <TooltipProvider delayDuration={150}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div>{body}</div>
          </TooltipTrigger>
          {disabledReason ? <TooltipContent>{disabledReason}</TooltipContent> : null}
        </Tooltip>
      </TooltipProvider>
    );
  }
  if (to) {
    return (
      <Link to={to.to} params={to.params} className="block">
        {body}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className="block w-full text-left">
      {body}
    </button>
  );
}
