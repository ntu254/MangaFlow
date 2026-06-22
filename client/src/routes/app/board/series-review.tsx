import { createFileRoute, Link } from "@tanstack/react-router";
import {
  CalendarClock,
  ClipboardCheck,
  Download,
  Eye,
  FileText,
  Layers,
  MessageSquare,
  UserRound,
  Vote,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { EmptyState } from "@/layouts/AppShell";
import { AuditTimeline } from "@/shared/ui/site/AuditTimeline";
import type { BoardQueueItem } from "@/shared/api/board";
import { manuscriptsApi } from "@/shared/api/manuscripts";
import type { Series } from "@/shared/api/series";
import { useBoardReviewQueue } from "@/shared/queries/useBoardReview";
import { useSeriesSummary } from "@/shared/queries/useSeries";
import {
  boardFlowSteps,
  DecisionPortalShell,
  DecisionTimeline,
  PortalCard,
  PortalLoadingRows,
  PortalPill,
} from "@/features/board/components/DecisionPortal";
import { FilePreviewModal } from "@/features/board/components/FilePreviewModal";

export const Route = createFileRoute("/app/board/series-review")({
  component: BoardReviewQueue,
});

type SummaryFile = {
  id: string;
  originalName?: string;
  mimeType?: string;
  assetType?: string;
  size?: number;
  status?: string;
  createdAt?: string;
};

type SummaryManuscript = {
  id: string;
  version: number;
  status: string;
  reviewNote?: string;
  createdAt?: string;
  updatedAt?: string;
  file?: SummaryFile | null;
  uploadedBy?: { name?: string; email?: string } | null;
};

type SeriesSummary = {
  series?: Series;
  owner?: { name?: string; email?: string } | null;
  manuscripts?: SummaryManuscript[];
  currentManuscript?: SummaryManuscript | null;
  files?: SummaryFile[];
};

function BoardReviewQueue() {
  const { data: queue = [], error, isLoading } = useBoardReviewQueue();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [openingFileId, setOpeningFileId] = useState<string | null>(null);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState("");
  const [previewType, setPreviewType] = useState("");

  useEffect(() => {
    if (!selectedId && queue.length > 0) setSelectedId(queue[0].id);
    if (selectedId && queue.length > 0 && !queue.some((item) => item.id === selectedId)) {
      setSelectedId(queue[0].id);
    }
  }, [queue, selectedId]);

  const selectedItem = useMemo(
    () => queue.find((item) => item.id === selectedId) ?? queue[0],
    [queue, selectedId],
  );
  const selectedSeriesId = selectedItem?.id ?? "";
  const {
    data: summary,
    error: summaryError,
    isLoading: isSummaryLoading,
  } = useSeriesSummary(selectedSeriesId);

  async function openFile(fileId: string, mode: "preview" | "download") {
    if (!selectedSeriesId) return;
    try {
      setOpeningFileId(fileId);
      const { downloadUrl } = await manuscriptsApi.getDownloadUrl(selectedSeriesId, fileId);
      if (mode === "preview") {
        const currentSummary = summary as SeriesSummary | undefined;
        const filesList = currentSummary?.files ?? [];
        const fileObj =
          filesList.find((file) => file.id === fileId) ||
          currentSummary?.manuscripts
            ?.map((manuscript) => manuscript.file ?? undefined)
            .find((file): file is SummaryFile => file?.id === fileId);

        setPreviewUrl(downloadUrl);
        setPreviewName(fileObj?.originalName || "File Preview");
        setPreviewType(fileObj?.mimeType || "");
        setPreviewOpen(true);
        return;
      }
      const anchor = document.createElement("a");
      anchor.href = downloadUrl;
      anchor.download = "";
      anchor.click();
    } catch {
      toast.error("Unable to open manuscript file.");
    } finally {
      setOpeningFileId(null);
    }
  }

  return (
    <DecisionPortalShell
      active="/app/board/series-review"
      title="Review workspace"
      description="Inspect submitted proposal drafts, manuscript versions, supporting files, quorum status, and the vote mix before opening a decision panel."
      actions={
        <Link
          to="/app/board/voting-sessions"
          className="inline-flex h-9 items-center gap-2 rounded-md border border-border px-3 text-sm font-medium transition hover:bg-foreground/5 active:translate-y-px"
        >
          <Vote className="h-4 w-4" /> Voting sessions
        </Link>
      }
    >
      <DecisionTimeline steps={boardFlowSteps} activeStep={1} />

      {isLoading ? (
        <PortalCard title="Submitted series" description="Loading Board review queue.">
          <PortalLoadingRows count={4} />
        </PortalCard>
      ) : error ? (
        <PortalCard title="Submitted series" description="Board queue could not be loaded.">
          <div className="px-4 py-8 text-sm text-destructive">
            Unable to load Board queue. Check that your account has BOARD permission.
          </div>
        </PortalCard>
      ) : queue.length === 0 ? (
        <PortalCard title="Submitted series" description="No series are waiting for Board review.">
          <EmptyState
            title="Nothing to review"
            hint="New proposals appear here once an Editor forwards them to Board review."
            icon={ClipboardCheck}
          />
        </PortalCard>
      ) : (
        <section className="grid gap-5 2xl:grid-cols-[360px_minmax(0,1fr)_320px]">
          <PortalCard
            title="Submitted series"
            description="Select a proposal to inspect the same draft and manuscript evidence Mangaka submitted."
          >
            <div className="divide-y divide-border">
              {queue.map((item) => (
                <QueueItemButton
                  key={item.id}
                  item={item}
                  selected={item.id === selectedItem?.id}
                  loadedVersion={
                    item.id === selectedItem?.id && summary?.currentManuscript
                      ? `v${summary.currentManuscript.version}`
                      : undefined
                  }
                  onSelect={() => setSelectedId(item.id)}
                />
              ))}
            </div>
          </PortalCard>

          <ReviewPreviewPanel
            item={selectedItem}
            summary={summary as SeriesSummary | undefined}
            isLoading={isSummaryLoading}
            error={summaryError}
            openingFileId={openingFileId}
            onOpenFile={openFile}
          />
        </section>
      )}

      <FilePreviewModal
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        fileUrl={previewUrl}
        fileName={previewName}
        fileType={previewType}
      />
    </DecisionPortalShell>
  );
}

function QueueItemButton({
  item,
  selected,
  loadedVersion,
  onSelect,
}: {
  item: BoardQueueItem;
  selected: boolean;
  loadedVersion?: string;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full px-4 py-3 text-left transition ${
        selected ? "bg-primary/10" : "hover:bg-foreground/5"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-foreground">{item.seriesTitle}</div>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <PortalPill tone="primary">{item.seriesStatus}</PortalPill>
            <PortalPill tone={item.canFinalize ? "success" : "neutral"}>
              {item.voteCount}/{item.quorum} quorum
            </PortalPill>
            <PortalPill>{loadedVersion ?? "manuscript"}</PortalPill>
          </div>
        </div>
        <span className="rounded-md border border-border px-2 py-1 text-[11px] font-medium text-muted-foreground">
          Review
        </span>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[11px] text-muted-foreground">
        <VoteCount label="Approve" value={item.voteSummary.APPROVE} />
        <VoteCount label="Reject" value={item.voteSummary.REJECT} />
        <VoteCount label="Revision" value={item.voteSummary.NEEDS_REVISION} />
      </div>
    </button>
  );
}

function VoteCount({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md bg-background px-2 py-1.5">
      <div className="font-mono text-sm font-semibold text-foreground">{value}</div>
      <div>{label}</div>
    </div>
  );
}

function ReviewPreviewPanel({
  item,
  summary,
  isLoading,
  error,
  openingFileId,
  onOpenFile,
}: {
  item?: BoardQueueItem;
  summary?: SeriesSummary;
  isLoading: boolean;
  error: unknown;
  openingFileId: string | null;
  onOpenFile: (fileId: string, mode: "preview" | "download") => void;
}) {
  if (!item) return null;

  if (isLoading) {
    return (
      <PortalCard title="Proposal and manuscript preview" description="Loading series summary.">
        <div className="space-y-4 p-5">
          <div className="h-10 animate-pulse rounded-md bg-foreground/5" />
          <div className="grid gap-3 md:grid-cols-3">
            <div className="h-28 animate-pulse rounded-md bg-foreground/5" />
            <div className="h-28 animate-pulse rounded-md bg-foreground/5" />
            <div className="h-28 animate-pulse rounded-md bg-foreground/5" />
          </div>
          <div className="h-44 animate-pulse rounded-md bg-foreground/5" />
        </div>
      </PortalCard>
    );
  }

  if (error || !summary?.series) {
    return (
      <PortalCard
        title="Proposal and manuscript preview"
        description="The selected series summary could not be loaded."
      >
        <div className="p-5 text-sm text-destructive">
          Unable to load proposal draft or manuscript files for {item.seriesTitle}.
        </div>
      </PortalCard>
    );
  }

  const series = summary.series;
  const manuscripts = summary.manuscripts ?? [];
  const files = summary.files ?? [];
  const manuscriptFiles = files.filter(
    (file) => normalizeAssetType(file.assetType) === "manuscript",
  );
  const supportingFiles = files.filter(
    (file) => normalizeAssetType(file.assetType) !== "manuscript",
  );
  const evidenceReady = Boolean(series.synopsis && summary.currentManuscript);

  return (
    <>
      <div className="space-y-5">
        <PortalCard
          title="Proposal draft"
          description="Read-only Board view of the proposal fields submitted by the Mangaka."
        >
          <div className="space-y-5 p-5">
            <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                  {series.title}
                </h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                  {series.logline || series.synopsis || "No proposal summary provided."}
                </p>
              </div>
              <div className="rounded-md border border-border bg-background p-3">
                <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  <Layers className="h-3.5 w-3.5" /> Current manuscript
                </div>
                <div className="mt-2 text-lg font-semibold">
                  {summary.currentManuscript
                    ? `Version ${summary.currentManuscript.version}`
                    : "No manuscript"}
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {summary.currentManuscript ? (
                    <PortalPill tone="primary">{summary.currentManuscript.status}</PortalPill>
                  ) : (
                    <span className="text-xs text-muted-foreground">No version available.</span>
                  )}
                </div>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <InfoBlock title="Synopsis" value={series.synopsis} />
              <InfoBlock title="Premise" value={series.premise} />
              <InfoBlock title="Characters" value={series.characters} />
              <InfoBlock title="Conflict" value={series.conflict} />
              <InfoBlock title="Target audience" value={series.targetAudience} />
              <InfoBlock
                title="Cadence"
                value={series.requestedPublicationType || series.publicationType}
              />
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <SignalBlock
                icon={UserRound}
                label="Owner"
                value={summary.owner?.name ?? series.ownerId}
              />
              <SignalBlock
                icon={CalendarClock}
                label="Updated"
                value={formatDate(series.updatedAt)}
              />
              <SignalBlock
                icon={ClipboardCheck}
                label="Genres and tags"
                value={[...(series.genres ?? []), ...(series.tags ?? [])].join(", ") || "None"}
              />
            </div>
          </div>
        </PortalCard>

        <PortalCard
          title="Manuscript versions"
          description="Read-only version history visible to Board before voting."
        >
          {manuscripts.length ? (
            <div className="divide-y divide-border">
              {manuscripts.map((manuscript) => (
                <div
                  key={manuscript.id}
                  className="grid gap-3 px-4 py-3 md:grid-cols-[1fr_auto] md:items-center"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold">Version {manuscript.version}</span>
                      <PortalPill
                        tone={manuscript.status === "REVISION_REQUESTED" ? "warn" : "primary"}
                      >
                        {manuscript.status}
                      </PortalPill>
                      {summary.currentManuscript?.id === manuscript.id ? (
                        <PortalPill tone="success">Current</PortalPill>
                      ) : null}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      Updated {formatDate(manuscript.updatedAt || manuscript.createdAt)}
                      {manuscript.uploadedBy?.name ? ` by ${manuscript.uploadedBy.name}` : ""}
                    </div>
                    {manuscript.reviewNote ? (
                      <div className="mt-2 rounded-md bg-foreground/5 px-3 py-2 text-xs leading-5 text-muted-foreground">
                        {manuscript.reviewNote}
                      </div>
                    ) : null}
                  </div>
                  {manuscript.file?.id ? (
                    <FileActions
                      file={manuscript.file}
                      openingFileId={openingFileId}
                      onOpenFile={onOpenFile}
                    />
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-5 text-sm text-muted-foreground">No manuscript versions found.</div>
          )}
        </PortalCard>

        <div className="grid gap-5 lg:grid-cols-2">
          <FileGroup
            title="Manuscript files"
            files={manuscriptFiles}
            openingFileId={openingFileId}
            onOpenFile={onOpenFile}
          />
          <FileGroup
            title="Supporting materials"
            files={supportingFiles}
            openingFileId={openingFileId}
            onOpenFile={onOpenFile}
          />
        </div>
      </div>

      <DecisionSidePanel item={item} summary={summary} evidenceReady={evidenceReady} />
    </>
  );
}

function DecisionSidePanel({
  item,
  summary,
  evidenceReady,
}: {
  item: BoardQueueItem;
  summary: SeriesSummary;
  evidenceReady: boolean;
}) {
  const files = summary.files ?? [];
  const missingCount = files.filter((file) => file.status === "MISSING").length;
  const totalVotes =
    item.voteSummary.APPROVE + item.voteSummary.REJECT + item.voteSummary.NEEDS_REVISION;

  return (
    <aside className="space-y-5">
      <PortalCard
        title="Decision panel"
        description="Board acts on the whole proposal and manuscript package."
        action={
          <Link
            to="/app/board/series/$id/vote"
            params={{ id: item.id }}
            className="inline-flex h-8 items-center gap-2 rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground transition active:translate-y-px"
          >
            <Vote className="h-3.5 w-3.5" /> Vote
          </Link>
        }
      >
        <div className="space-y-3 p-4">
          <DecisionCheck
            label="Proposal draft"
            ready={Boolean(summary.series?.synopsis)}
            detail={summary.series?.synopsis ? "Synopsis available" : "Missing synopsis"}
          />
          <DecisionCheck
            label="Manuscript package"
            ready={Boolean(summary.currentManuscript)}
            detail={
              summary.currentManuscript
                ? `Version ${summary.currentManuscript.version}`
                : "No current manuscript"
            }
          />
          <DecisionCheck
            label="File access"
            ready={missingCount === 0}
            detail={
              missingCount === 0 ? `${files.length} files available` : `${missingCount} missing`
            }
          />
          <DecisionCheck
            label="Vote readiness"
            ready={evidenceReady}
            detail={evidenceReady ? "Ready for Board vote" : "Review evidence first"}
          />
        </div>
      </PortalCard>

      <PortalCard title="Vote mix" description="Current Board signal for this case.">
        <div className="space-y-3 p-4">
          <VoteBar label="Approve" value={item.voteSummary.APPROVE} total={totalVotes} />
          <VoteBar label="Reject" value={item.voteSummary.REJECT} total={totalVotes} />
          <VoteBar
            label="Needs revision"
            value={item.voteSummary.NEEDS_REVISION}
            total={totalVotes}
          />
          <div className="border-t border-border pt-3 text-xs text-muted-foreground">
            Quorum: {item.voteCount}/{item.quorum}. Eligible Board members:{" "}
            {item.eligibleBoardCount}.
          </div>
        </div>
      </PortalCard>

      <PortalCard title="Reviewer handoff" description="What this workspace is for.">
        <div className="space-y-3 p-4 text-sm text-muted-foreground">
          <div className="flex gap-2">
            <MessageSquare className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              Use this page to inspect the Mangaka draft and manuscript evidence. Use the voting
              panel only when you are ready to record a Board decision.
            </p>
          </div>
        </div>
      </PortalCard>

      <AuditTimeline entity="series" entityId={item.id} limit={6} />
    </aside>
  );
}

function DecisionCheck({
  label,
  ready,
  detail,
}: {
  label: string;
  ready: boolean;
  detail: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-background px-3 py-2">
      <div className="min-w-0">
        <div className="text-sm font-medium">{label}</div>
        <div className="truncate text-xs text-muted-foreground">{detail}</div>
      </div>
      <PortalPill tone={ready ? "success" : "warn"}>{ready ? "Ready" : "Check"}</PortalPill>
    </div>
  );
}

function VoteBar({ label, value, total }: { label: string; value: number; total: number }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="font-medium text-foreground">{label}</span>
        <span className="font-mono text-muted-foreground">{value}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-sm bg-foreground/5">
        <div className="h-full rounded-sm bg-primary" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function InfoBlock({ title, value }: { title: string; value?: string }) {
  return (
    <div className="rounded-md border border-border bg-background p-3">
      <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {title}
      </div>
      <p className="mt-2 line-clamp-5 text-sm leading-6 text-muted-foreground">
        {value || "Not provided."}
      </p>
    </div>
  );
}

function SignalBlock({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof UserRound;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-md border border-border bg-background p-3">
      <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      <div className="mt-2 truncate text-sm font-medium text-foreground">{value}</div>
    </div>
  );
}

function FileGroup({
  title,
  files,
  openingFileId,
  onOpenFile,
}: {
  title: string;
  files: SummaryFile[];
  openingFileId: string | null;
  onOpenFile: (fileId: string, mode: "preview" | "download") => void;
}) {
  return (
    <PortalCard title={title} description="Preview or download read-only submitted files.">
      <div className="divide-y divide-border">
        {files.length ? (
          files.map((file) => (
            <div
              key={file.id}
              className="grid gap-3 px-4 py-3 sm:grid-cols-[1fr_auto] sm:items-center"
            >
              <FileIdentity file={file} />
              <FileActions file={file} openingFileId={openingFileId} onOpenFile={onOpenFile} />
            </div>
          ))
        ) : (
          <div className="p-5 text-sm text-muted-foreground">No files available.</div>
        )}
      </div>
    </PortalCard>
  );
}

function FileIdentity({ file }: { file: SummaryFile }) {
  return (
    <div className="min-w-0">
      <div className="flex min-w-0 items-center gap-2">
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${
            file.status === "MISSING"
              ? "bg-destructive/10 text-destructive"
              : "bg-foreground/5 text-muted-foreground"
          }`}
        >
          <FileText className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <div className="truncate text-sm font-medium">{file.originalName || file.id}</div>
          <div className="text-xs text-muted-foreground">
            {formatAssetType(file.assetType)} / {formatSize(file.size)}
          </div>
        </div>
      </div>
    </div>
  );
}

function FileActions({
  file,
  openingFileId,
  onOpenFile,
}: {
  file: SummaryFile;
  openingFileId: string | null;
  onOpenFile: (fileId: string, mode: "preview" | "download") => void;
}) {
  const disabled = file.status === "MISSING" || openingFileId === file.id;
  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => onOpenFile(file.id, "preview")}
        disabled={disabled}
        className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border px-2.5 text-xs font-medium transition hover:bg-foreground/5 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Eye className="h-3.5 w-3.5" /> Preview
      </button>
      <button
        type="button"
        onClick={() => onOpenFile(file.id, "download")}
        disabled={disabled}
        className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border px-2.5 text-xs font-medium transition hover:bg-foreground/5 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Download className="h-3.5 w-3.5" /> Download
      </button>
    </div>
  );
}

function normalizeAssetType(value?: string) {
  return (value || "other").toLowerCase();
}

function formatAssetType(value?: string) {
  return normalizeAssetType(value).replaceAll("_", " ");
}

function formatSize(value?: number) {
  if (!value) return "0 MB";
  return String(Math.round((value / 1024 / 1024) * 10) / 10) + " MB";
}

function formatDate(value?: string) {
  if (!value) return "Unknown";
  return new Date(value).toLocaleDateString();
}
