import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  AlertCircle,
  BookOpen,
  Clock,
  Download,
  Eye,
  FileText,
  Layers,
  MessageSquare,
  Pencil,
  ShieldCheck,
  Sparkles,
  Upload,
  ChevronDown,
  ChevronUp,
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
import { formatDate, formatDateTime } from "@/shared/lib/format-date";
import { checkAction } from "@/entities/proposal";
import type { ProductionSeries } from "@/entities/series/model/series-types";
import { useSeriesProposalQuery, useProposalActionMutation } from "@/features/proposals";
import { useTantouEditorQuery, type TantouEditor, mapApiError } from "../../api/series-queries";
import { cn } from "@/shared/lib/cn";
import { SortableHeader } from "@/shared/ui";
import { useSortableData } from "@/shared/lib/use-sortable-data";
import { MaterialDownloadLink } from "./material-file-controls";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ResolvedImage } from "@/shared/ui";
import { isRenderableFileUrl } from "@/shared/lib/file-url";

type ProposalTabKey = "overview" | "materials" | "history";

type PreviewItemDef = {
  fileName: string;
  fileKey?: string | null;
  fileUrl?: string | null;
  version?: number;
  kindLabel?: string;
};

export function SeriesProposalTab({ series }: { series: ProductionSeries }) {
  const user = useAuth((s) => s.user);
  const { data: proposal, isLoading, isError, error } = useSeriesProposalQuery(series);
  const { data: tantouEditor } = useTantouEditorQuery(series.id);
  const actionMutation = useProposalActionMutation(series.proposalId ?? "", series.id);
  const [resubmitOpen, setResubmitOpen] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ProposalTabKey>("overview");
  const [previewItem, setPreviewItem] = useState<PreviewItemDef | null>(null);

  if (!user) return null;

  if (!series.proposalId) {
    return (
      <EmptyState
        title="Series not linked to a proposal"
        description="This series is not linked to an active editorial proposal. A proposal can be created or linked in a separate workflow."
      />
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-64 animate-pulse rounded-2xl border border-border bg-card" />
      </div>
    );
  }

  if (isError) {
    const msg = mapApiError(error);
    const is404 = error instanceof Error && error.message.includes("NOT_FOUND");
    const is403 = error instanceof Error && error.message.includes("FORBIDDEN");
    return (
      <EmptyState
        title={is404 ? "Proposal not found" : is403 ? "Access denied" : "Error loading proposal"}
        description={msg}
        action={
          is403 || is404 ? (
            <Link to="/app/submissions" className="text-xs underline font-semibold">
              View all submissions
            </Link>
          ) : null
        }
      />
    );
  }

  if (!proposal) {
    return <EmptyState title="Proposal details unavailable" description="Proposal record could not be found." />;
  }

  const canResubmit = checkAction("RESUBMIT", user, proposal).ok;
  const canEdit = checkAction("EDIT", user, proposal).ok;
  const latestVersion = (proposal.manuscripts ?? []).reduce((m, v) => Math.max(m, v.version), 1);
  const feedbackEntries = buildFeedbackEntries(proposal);
  const materialsCount = (proposal.manuscripts ?? []).length + (proposal.materials ?? []).length;

  return (
    <div className="space-y-6">
      {/* Unified Executive Proposal Workspace Card */}
      <section className="rounded-2xl border border-border/80 bg-card shadow-2xs overflow-hidden">
        {/* Sub-Tab Navigation Bar */}
        <div className="flex flex-wrap items-center gap-1 border-b border-border/60 bg-muted/20 px-4 pt-3">
          <TabButton
            active={activeTab === "overview"}
            onClick={() => setActiveTab("overview")}
            icon={<BookOpen className="size-3.5" />}
            label="Overview & Pitch Dossier"
          />
          <TabButton
            active={activeTab === "materials"}
            onClick={() => setActiveTab("materials")}
            icon={<FileText className="size-3.5" />}
            label="Creative Assets & Manuscripts"
            count={materialsCount}
          />
          <TabButton
            active={activeTab === "history"}
            onClick={() => setActiveTab("history")}
            icon={<Clock className="size-3.5" />}
            label="Version Audit Trail"
            count={(proposal.manuscripts ?? []).length}
          />
        </div>

        {/* Sub-Tab Content View */}
        <div className="p-5 md:p-6">
          {activeTab === "overview" ? (
            <OverviewAndPitchSection
              proposal={proposal}
              tantouEditor={tantouEditor}
              canEdit={canEdit}
              canResubmit={canResubmit}
              onResubmit={() => setResubmitOpen(true)}
              latestVersion={latestVersion}
              advancedOpen={advancedOpen}
              onToggleAdvanced={() => setAdvancedOpen((v) => !v)}
            />
          ) : activeTab === "materials" ? (
            <CreativeMaterialsSection
              proposal={proposal}
              onPreview={(item) => setPreviewItem(item)}
            />
          ) : (
            <VersionHistorySection
              proposal={proposal}
              onPreview={(item) => setPreviewItem(item)}
            />
          )}
        </div>
      </section>

      {/* Resubmit Modal Dialog */}
      <ResubmitDialog
        proposal={proposal}
        user={user}
        open={resubmitOpen}
        onClose={() => setResubmitOpen(false)}
        onResubmit={(payload) => actionMutation.mutateAsync({ action: "RESUBMIT", payload })}
      />

      {/* File Preview Dialog */}
      <FilePreviewDialog
        item={previewItem}
        open={Boolean(previewItem)}
        onClose={() => setPreviewItem(null)}
      />
    </div>
  );
}

// ---------------- Tab Button Component ----------------

function TabButton({
  active,
  onClick,
  icon,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  count?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 rounded-t-xl px-4 py-2.5 text-xs font-semibold transition-all border-b-2",
        active
          ? "border-primary bg-card text-primary shadow-xs"
          : "border-transparent text-muted-foreground hover:bg-card/50 hover:text-foreground",
      )}
    >
      {icon}
      <span>{label}</span>
      {count != null ? (
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[10px] font-bold",
            active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
          )}
        >
          {count}
        </span>
      ) : null}
    </button>
  );
}

// ---------------- Merged Tab 1: Overview & Pitch Section ----------------

function OverviewAndPitchSection({
  proposal,
  tantouEditor,
  canEdit,
  canResubmit,
  onResubmit,
  latestVersion,
  advancedOpen,
  onToggleAdvanced,
}: {
  proposal: SeriesProposal;
  tantouEditor?: TantouEditor | null;
  canEdit: boolean;
  canResubmit: boolean;
  onResubmit: () => void;
  latestVersion: number;
  advancedOpen: boolean;
  onToggleAdvanced: () => void;
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Left Column (2 cols): Pitch Dossier */}
      <div className="space-y-6 lg:col-span-2">
        <SectionCard title="Editorial Pitch Dossier" icon={<Sparkles className="size-4 text-primary" />}>
          {proposal.logline ? (
            <div className="relative mb-5 overflow-hidden rounded-xl border border-primary/20 bg-primary/5 p-4 text-foreground/90">
              <div className="absolute top-0 left-0 h-full w-1.5 bg-primary" />
              <p className="text-xs font-bold uppercase tracking-wider text-primary mb-1">
                Core Logline
              </p>
              <p className="text-sm font-medium leading-relaxed text-foreground">
                {proposal.logline}
              </p>
            </div>
          ) : null}

          {proposal.hook ? (
            <div className="mb-5 space-y-1">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Commercial Hook / Unique Selling Point
              </h4>
              <p className="text-xs leading-relaxed text-foreground/90 bg-muted/30 p-3 rounded-lg border border-border/50">
                {proposal.hook}
              </p>
            </div>
          ) : null}

          <div className="space-y-4">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                Synopsis
              </h4>
              <p className="whitespace-pre-wrap text-xs leading-relaxed text-foreground/90 bg-card p-4 rounded-xl border border-border/70 shadow-2xs">
                {proposal.synopsis || "No synopsis provided."}
              </p>
            </div>

            {proposal.mainCharacters ? (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Character Profiles & Dynamics
                </h4>
                <div className="whitespace-pre-wrap text-xs leading-relaxed text-foreground/90 bg-card p-4 rounded-xl border border-border/70 shadow-2xs">
                  {proposal.mainCharacters}
                </div>
              </div>
            ) : null}
          </div>

          {/* Advanced Production Details Accordion */}
          {hasAdvancedDetails(proposal.advanced) ? (
            <div className="mt-5 border-t border-border/70 pt-4">
              <button
                type="button"
                onClick={onToggleAdvanced}
                className="flex w-full items-center justify-between text-xs font-semibold text-foreground hover:text-primary transition-colors"
              >
                <span className="flex items-center gap-1.5">
                  <Layers className="size-3.5 text-primary" /> Advanced Production & World Specs
                </span>
                {advancedOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
              </button>

              {advancedOpen ? (
                <div className="mt-3 grid gap-3 text-xs md:grid-cols-2">
                  <AdvBox label="World Setting" value={proposal.advanced?.worldSetting} />
                  <AdvBox label="Series Direction" value={proposal.advanced?.seriesDirection} />
                  <AdvBox label="Production Plan" value={proposal.advanced?.productionPlan} />
                  <AdvBox label="Assistant Requirements" value={proposal.advanced?.assistantNeeds} />
                  <AdvBox label="Comparable Titles" value={proposal.advanced?.comparableTitles} />
                  <AdvBox label="AI Tool Disclosures" value={proposal.advanced?.aiDisclosure} />
                </div>
              ) : null}
            </div>
          ) : null}
        </SectionCard>
      </div>

      {/* Right Column (1 col): Proposal Status & Feedback Feed */}
      <div className="space-y-6 lg:col-span-1">
        <ProposalOverviewCard
          proposal={proposal}
          tantouEditor={tantouEditor}
          canEdit={canEdit}
          canResubmit={canResubmit}
          onResubmit={onResubmit}
          latestVersion={latestVersion}
        />
        <FeedbackFeedCard proposal={proposal} />
      </div>
    </div>
  );
}

// ---------------- Section Container ----------------

function SectionCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border/80 bg-card p-5 shadow-2xs transition-all md:p-6">
      <div className="mb-4 flex items-center justify-between gap-2 border-b border-border/50 pb-3">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="text-sm font-bold text-foreground">{title}</h3>
        </div>
      </div>
      {children}
    </section>
  );
}

function AdvBox({ label, value }: { label: string; value?: string }) {
  if (!value || !value.trim()) return null;
  return (
    <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
      <span className="text-[11px] font-bold text-muted-foreground">{label}</span>
      <p className="mt-1 text-xs text-foreground/90 leading-normal">{value}</p>
    </div>
  );
}

function hasAdvancedDetails(adv?: Record<string, string>): boolean {
  if (!adv) return false;
  return Object.values(adv).some((v) => v && String(v).trim().length > 0);
}

// ---------------- Proposal Overview & Status ----------------

function ProposalOverviewCard({
  proposal,
  tantouEditor,
  canEdit,
  canResubmit,
  onResubmit,
  latestVersion,
}: {
  proposal: SeriesProposal;
  tantouEditor?: TantouEditor | null;
  canEdit: boolean;
  canResubmit: boolean;
  onResubmit: () => void;
  latestVersion: number;
}) {
  const submitEvents = (proposal.history ?? []).filter((h) => h.type === "SUBMIT" || h.type === "RESUBMIT");
  const lastSubmit = submitEvents[submitEvents.length - 1];
  const editorName = tantouEditor?.userName ?? proposal.assignedEditorName;
  const alertMsg = STATUS_ALERT[proposal.status];

  return (
    <SectionCard title="Proposal Overview & Status" icon={<ShieldCheck className="size-4 text-emerald-500" />}>
      <div className="space-y-4">
        {/* Status Badge & Version */}
        <div className="flex items-center justify-between rounded-xl bg-muted/40 p-3 border border-border/60">
          <span className="text-xs text-muted-foreground font-medium">Status</span>
          <div className="flex items-center gap-1.5">
            <ProposalStatusPill status={proposal.status} />
            <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
              v{latestVersion}.0
            </span>
          </div>
        </div>

        {/* Metadata Details */}
        <div className="space-y-2.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Assigned Editor:</span>
            <span className="font-semibold text-foreground">
              {editorName ? (
                <span className="inline-flex items-center gap-1.5">
                  <span className="inline-flex size-5 items-center justify-center rounded-full bg-primary/10 text-[9px] font-bold uppercase text-primary">
                    {editorName.slice(0, 2).toUpperCase()}
                  </span>
                  {editorName}
                </span>
              ) : (
                "Unassigned"
              )}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Submission Date:</span>
            <span className="font-semibold text-foreground">
              {lastSubmit ? formatDate(lastSubmit.createdAt) : "Not submitted"}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Last Updated:</span>
            <span className="font-semibold text-foreground">{formatDate(proposal.updatedAt)}</span>
          </div>

          <div className="flex items-start justify-between gap-2 border-t border-border/50 pt-2.5">
            <span className="text-muted-foreground shrink-0">Genres:</span>
            <span className="font-semibold text-foreground text-right">
              {proposal.genres.join(", ") || "—"}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Target Audience:</span>
            <span className="font-semibold text-foreground">
              {AUDIENCE_LABEL[proposal.targetAudience] ?? proposal.targetAudience}
            </span>
          </div>
        </div>

        {alertMsg ? (
          <div className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-300">
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <span>{alertMsg}</span>
          </div>
        ) : null}

        {/* Primary Action Buttons */}
        <div className="flex flex-col gap-2 pt-2 border-t border-border/50">
          {canEdit ? (
            <Link
              to="/app/submissions/$id"
              params={{ id: proposal.id }}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground shadow-2xs transition-all hover:bg-primary/90"
            >
              <Pencil className="size-3.5" /> Edit Proposal Content
            </Link>
          ) : null}
          {canResubmit ? (
            <button
              type="button"
              onClick={onResubmit}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold hover:bg-muted shadow-2xs transition-all"
            >
              <Upload className="size-3.5 text-primary" /> Resubmit Revision
            </button>
          ) : null}
          <Link
            to="/app/submissions/$id"
            params={{ id: proposal.id }}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold hover:bg-muted shadow-2xs transition-all"
          >
            <Eye className="size-3.5" /> View Submissions Dossier
          </Link>
        </div>
      </div>
    </SectionCard>
  );
}

const STATUS_ALERT: Partial<Record<ProposalStatus, string>> = {
  CHANGES_REQUESTED: "Editor requested revisions on your storyboard/manuscript.",
  REJECTED: "Proposal has been rejected by Editorial. Review feedback below.",
  DRAFT: "Draft created. Complete details and submit to Editor.",
};

// ---------------- Feedback Feed ----------------

type FeedbackEntry = {
  id: string;
  source: "EDITOR" | "BOARD";
  authorName: string;
  createdAt: string;
  body: string;
};

function buildFeedbackEntries(proposal: SeriesProposal): FeedbackEntry[] {
  const requestedChanges = proposal.requestedChanges ?? [];
  const votes = proposal.votes ?? [];

  const fromEditor = requestedChanges.map((r) => ({
    id: `r-${r.id}`,
    source: "EDITOR" as const,
    authorName: r.editorName,
    createdAt: r.createdAt,
    body:
      r.comment ||
      (r.items ?? [])
        .map((it) => it.text)
        .filter(Boolean)
        .join(" · ") ||
      "Editor requested changes.",
  }));

  const fromBoard = votes
    .filter((v) => v && v.comment && v.comment.trim())
    .map((v) => ({
      id: `b-${v.voterId}-${v.createdAt}`,
      source: "BOARD" as const,
      authorName: v.voterName,
      createdAt: v.createdAt,
      body: v.comment!,
    }));

  return [...fromEditor, ...fromBoard].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

function FeedbackFeedCard({ proposal }: { proposal: SeriesProposal }) {
  const entries = buildFeedbackEntries(proposal);

  return (
    <SectionCard title="Editorial & Board Feedback" icon={<MessageSquare className="size-4 text-blue-500" />}>
      {entries.length === 0 ? (
        <p className="text-xs text-muted-foreground py-2">No feedback from Editor or Board yet.</p>
      ) : (
        <div className="space-y-3">
          {entries.map((e) => (
            <div
              key={e.id}
              className="rounded-xl border border-border/70 bg-card p-3.5 shadow-2xs space-y-1.5"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="inline-flex items-center gap-1.5">
                  <span
                    className={cn(
                      "rounded-md px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider",
                      e.source === "EDITOR"
                        ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                        : "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20",
                    )}
                  >
                    {e.source}
                  </span>
                  <span className="font-semibold text-foreground">{e.authorName}</span>
                </span>
                <span className="text-[11px] text-muted-foreground">{formatDate(e.createdAt)}</span>
              </div>
              <p className="text-xs text-foreground/90 leading-relaxed whitespace-pre-wrap">{e.body}</p>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}

// ---------------- Creative Materials Section ----------------

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
    label: "Sample Manuscript",
    kindLabel: "Manuscript",
    required: true,
    manuscripts: true,
  },
  {
    key: "character",
    label: "Character Sheet",
    kindLabel: "Character Sheet",
    materialKind: "character",
  },
  {
    key: "reference",
    label: "Reference Materials",
    kindLabel: "Reference",
    materialKind: "reference",
  },
];

function CreativeMaterialsSection({
  proposal,
  onPreview,
}: {
  proposal: SeriesProposal;
  onPreview: (item: PreviewItemDef) => void;
}) {
  const manuscripts = proposal.manuscripts ?? [];
  const materials = proposal.materials ?? [];
  const latestVersion = manuscripts.reduce((m, v) => Math.max(m, v.version), 1);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead className="text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border/60">
          <tr>
            <th className="px-3 py-2.5">Asset Type</th>
            <th className="px-3 py-2.5">File Name</th>
            <th className="px-3 py-2.5">Version</th>
            <th className="px-3 py-2.5">Uploaded</th>
            <th className="px-3 py-2.5 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/50">
          {MATERIAL_ROWS.map((def) => {
            const items = def.manuscripts
              ? manuscripts
                .slice()
                .sort((a, b) => b.version - a.version)
                .map((m) => ({
                  id: m.id,
                  name: m.fileName,
                  version: m.version,
                  uploadedAt: m.uploadedAt,
                  url: m.fileUrl,
                  fileKey: m.fileKey ?? (m as unknown as { file?: { key?: string } }).file?.key,
                  isLatest: m.version === latestVersion,
                  kindLabel: def.kindLabel,
                }))
              : materials
                .filter((m) => m.kind === def.materialKind)
                .map((m) => ({
                  id: m.id,
                  name: m.fileName,
                  version: undefined as number | undefined,
                  uploadedAt: m.uploadedAt,
                  url: m.fileUrl,
                  fileKey: m.fileKey,
                  isLatest: false,
                  kindLabel: def.kindLabel,
                }));

            if (items.length === 0) {
              return (
                <tr key={def.key} className="hover:bg-muted/30">
                  <td className="px-3 py-3 font-semibold text-foreground">
                    {def.label}
                    {def.required ? (
                      <span className="ml-1.5 text-[10px] font-bold text-rose-500">(Required)</span>
                    ) : null}
                  </td>
                  <td className="px-3 py-3 text-muted-foreground italic" colSpan={3}>
                    Not uploaded
                  </td>
                  <td className="px-3 py-3 text-right text-muted-foreground">—</td>
                </tr>
              );
            }

            return items.map((it, idx) => (
              <tr key={it.id} className="hover:bg-muted/30">
                <td className="px-3 py-3 align-top">
                  {idx === 0 ? (
                    <div>
                      <span className="font-semibold text-foreground">{def.label}</span>
                      {def.required ? (
                        <span className="ml-1.5 text-[10px] font-bold text-rose-500">(Required)</span>
                      ) : null}
                    </div>
                  ) : null}
                </td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2">
                    <FileText className="size-3.5 shrink-0 text-primary" />
                    <span className="font-medium text-foreground">{it.name}</span>
                  </div>
                </td>
                <td className="px-3 py-3">
                  {it.version != null ? (
                    <span
                      className={cn(
                        "inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-bold",
                        it.isLatest
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : "border-border bg-muted text-muted-foreground",
                      )}
                    >
                      v{it.version}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                <td className="px-3 py-3 text-muted-foreground">{formatDate(it.uploadedAt)}</td>
                <td className="px-3 py-3 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        onPreview({
                          fileName: it.name,
                          fileKey: it.fileKey,
                          fileUrl: it.url,
                          version: it.version,
                          kindLabel: it.kindLabel,
                        })
                      }
                      className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-2.5 py-1 text-[11px] font-semibold text-foreground hover:bg-muted shadow-2xs transition-all"
                    >
                      <Eye className="size-3 text-primary" /> View Preview
                    </button>
                    <MaterialDownloadLink
                      fileKey={it.fileKey}
                      fallbackUrl={it.url}
                      fileName={it.name}
                      className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-2.5 py-1 text-[11px] font-semibold text-foreground hover:bg-muted shadow-2xs transition-all"
                    >
                      <Download className="size-3" /> Download
                    </MaterialDownloadLink>
                  </div>
                </td>
              </tr>
            ));
          })}
        </tbody>
      </table>
    </div>
  );
}

// ---------------- Version History Section ----------------

function VersionHistorySection({
  proposal,
  onPreview,
}: {
  proposal: SeriesProposal;
  onPreview: (item: PreviewItemDef) => void;
}) {
  const manuscripts = proposal.manuscripts ?? [];
  const baseVersions = manuscripts.slice().sort((a, b) => b.version - a.version);

  const {
    sorted: versions,
    sortKey,
    sortDirection,
    toggleSort,
  } = useSortableData(
    baseVersions,
    {
      version: (v) => v.version,
      uploadedAt: (v) => new Date(v.uploadedAt),
    },
    { key: "version", direction: "desc" },
  );

  return (
    <div>
      {versions.length === 0 ? (
        <p className="text-xs text-muted-foreground py-4 text-center">No version history records found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="text-left text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border/60">
              <tr>
                <th className="px-3 py-2.5">
                  <SortableHeader
                    label="Version"
                    sortKey="version"
                    activeSortKey={sortKey}
                    direction={sortDirection}
                    onSort={toggleSort}
                  />
                </th>
                <th className="px-3 py-2.5">File Name</th>
                <th className="px-3 py-2.5">File Size</th>
                <th className="px-3 py-2.5">
                  <SortableHeader
                    label="Uploaded Date"
                    sortKey="uploadedAt"
                    activeSortKey={sortKey}
                    direction={sortDirection}
                    onSort={toggleSort}
                  />
                </th>
                <th className="px-3 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {versions.map((m) => (
                <tr key={m.id} className="hover:bg-muted/30">
                  <td className="px-3 py-3">
                    <span className="font-bold text-foreground">v{m.version}</span>
                  </td>
                  <td className="px-3 py-3 font-medium text-foreground">{m.fileName}</td>
                  <td className="px-3 py-3 text-muted-foreground">
                    {m.sizeKB ? `${Math.round(m.sizeKB)} KB` : "—"}
                  </td>
                  <td className="px-3 py-3 text-muted-foreground">{formatDate(m.uploadedAt)}</td>
                  <td className="px-3 py-3 text-right">
                    <button
                      type="button"
                      onClick={() =>
                        onPreview({
                          fileName: m.fileName,
                          fileKey: m.fileKey ?? (m as unknown as { file?: { key?: string } }).file?.key,
                          fileUrl: m.fileUrl,
                          version: m.version,
                          kindLabel: "Sample Manuscript",
                        })
                      }
                      className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-2.5 py-1 text-[11px] font-semibold text-foreground hover:bg-muted shadow-2xs transition-all"
                    >
                      <Eye className="size-3 text-primary" /> View Manuscript
                    </button>
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

// ---------------- File Preview Modal Dialog ----------------

function FilePreviewDialog({
  item,
  open,
  onClose,
}: {
  item: PreviewItemDef | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!item) return null;

  const isImage =
    Boolean(item.fileName.match(/\.(png|jpg|jpeg|webp|gif|svg)$/i)) ||
    Boolean(item.fileUrl?.match(/\.(png|jpg|jpeg|webp|gif|svg)$/i));
  const isPdf =
    Boolean(item.fileName.match(/\.pdf$/i)) || Boolean(item.fileUrl?.match(/\.pdf$/i));

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl overflow-hidden rounded-2xl border border-border bg-card p-0 shadow-xl">
        <DialogHeader className="border-b border-border/60 bg-muted/30 px-6 py-4 pr-12">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <FileText className="size-4 text-primary" />
              <DialogTitle className="text-sm font-bold text-foreground">
                {item.fileName}
              </DialogTitle>
              {item.version != null ? (
                <span className="rounded-md border border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                  v{item.version}
                </span>
              ) : null}
            </div>
            <MaterialDownloadLink
              fileKey={item.fileKey}
              fallbackUrl={item.fileUrl}
              fileName={item.fileName}
              className="mr-6 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-2xs hover:bg-primary/90"
            >
              <Download className="size-3.5" /> Download File
            </MaterialDownloadLink>
          </div>
        </DialogHeader>

        <div className="flex min-h-[380px] max-h-[75vh] w-full flex-col items-center justify-center overflow-auto bg-muted/10 p-6">
          {isImage ? (
            <ResolvedImage
              fileKey={item.fileKey}
              fallbackUrl={item.fileUrl}
              alt={item.fileName}
              className="max-h-[65vh] w-auto max-w-full rounded-lg object-contain shadow-md"
              fallback={
                <div className="flex flex-col items-center gap-2 text-center text-xs text-muted-foreground">
                  <FileText className="size-8 opacity-40 text-primary" />
                  <p>Image preview unavailable for this sample asset.</p>
                </div>
              }
            />
          ) : isPdf && isRenderableFileUrl(item.fileUrl) ? (
            <iframe
              src={item.fileUrl!}
              title={item.fileName}
              className="h-[60vh] w-full rounded-lg border border-border shadow-xs"
            />
          ) : (
            <div className="flex max-w-md flex-col items-center text-center space-y-3 p-8 rounded-xl border border-border/80 bg-card shadow-2xs">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <FileText className="size-7" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-foreground">{item.fileName}</h4>
                {item.kindLabel ? (
                  <p className="text-xs text-muted-foreground font-medium">{item.kindLabel}</p>
                ) : null}
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                This document is part of the project proposal assets. Click download above to view or save full manuscript contents.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
