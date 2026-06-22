import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  CheckCircle2,
  ClipboardList,
  Download,
  FileText,
  Layers,
  Tags,
  Vote,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AuditTimeline } from "@/shared/ui/site/AuditTimeline";
import { useRole } from "@/shared/lib/role";
import { canBoardVote } from "@/shared/lib/permissions";
import { manuscriptsApi } from "@/shared/api/manuscripts";
import { seriesApi, type PublicationType, type Series } from "@/shared/api/series";
import { useSeriesSummary } from "@/shared/queries/useSeries";
import {
  useBoardReviewQueue,
  useCastBoardVote,
  useFinalizeBoardDecision,
  useTieBreakBoardDecision,
} from "@/shared/queries/useBoardReview";
import type { BoardVoteSummary, BoardVoteValue } from "@/shared/api/board";
import {
  boardFlowSteps,
  DecisionPortalShell,
  DecisionTimeline,
  PortalCard,
  PortalMetric,
  PortalNotice,
  PortalPill,
} from "@/features/board/components/DecisionPortal";
import { FilePreviewModal } from "@/features/board/components/FilePreviewModal";

export const Route = createFileRoute("/app/board/series/$id/vote")({
  component: BoardVotePage,
});

type SummaryFile = {
  id: string;
  originalName?: string;
  mimeType?: string;
  assetType?: string;
  size?: number;
  status?: string;
};

type SeriesSummary = {
  series?: Series;
  owner?: { name?: string } | null;
  files?: SummaryFile[];
  currentManuscript?: {
    version: number;
    status: string;
    file?: SummaryFile | null;
  } | null;
  boardReview?: { status?: string } | null;
};

const voteOptions: Array<{ label: string; value: BoardVoteValue }> = [
  { label: "Approve", value: "APPROVE" },
  { label: "Reject", value: "REJECT" },
  { label: "Needs revision", value: "NEEDS_REVISION" },
];

function pluralityVote(summary?: BoardVoteSummary): BoardVoteValue | "TIE_BREAK_REQUIRED" | null {
  if (!summary) return null;
  const entries = Object.entries(summary) as Array<[BoardVoteValue, number]>;
  const max = Math.max(...entries.map(([, count]) => count));
  if (max <= 0) return null;
  const winners = entries.filter(([, count]) => count === max);
  return winners.length === 1 ? winners[0][0] : "TIE_BREAK_REQUIRED";
}

function BoardVotePage() {
  const { id } = Route.useParams();
  const router = useRouter();
  const { role } = useRole();
  const { data: series, isLoading: isSeriesLoading } = useQuery({
    queryKey: ["series", id],
    queryFn: () => seriesApi.get(id),
  });
  const { data: queue = [] } = useBoardReviewQueue();
  const queueItem = useMemo(() => queue.find((item) => item.id === id), [queue, id]);
  const { data: summary, isLoading: isSummaryLoading } = useSeriesSummary(id);

  const castVoteMutation = useCastBoardVote(id);
  const finalizeMutation = useFinalizeBoardDecision(id);
  const tieBreakMutation = useTieBreakBoardDecision(id);

  const [vote, setVote] = useState<BoardVoteValue>("APPROVE");
  const [pubType, setPubType] = useState<PublicationType>("WEEKLY");
  const [comment, setComment] = useState("");
  const [isChair, setIsChair] = useState(false);
  const [openingFileId, setOpeningFileId] = useState<string | null>(null);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState("");
  const [previewType, setPreviewType] = useState("");

  if (isSeriesLoading || !series) {
    return (
      <div className="p-8 text-center text-sm text-muted-foreground">Loading Board review...</div>
    );
  }

  const previewSeries = summary?.series ?? series;
  const perm = canBoardVote(role, series);
  const isTieBreak = queueItem?.decisionStatus === "TIE_BREAK_REQUIRED";
  const boardResult = isTieBreak ? vote : pluralityVote(queueItem?.voteSummary);
  const isSubmitting =
    castVoteMutation.isPending || finalizeMutation.isPending || tieBreakMutation.isPending;

  async function openSummaryFile(fileId: string) {
    try {
      setOpeningFileId(fileId);
      const { downloadUrl } = await manuscriptsApi.getDownloadUrl(id, fileId);

      const filesList = summary?.files ?? [];
      const fileObj =
        filesList.find((file) => file.id === fileId) ||
        (summary?.currentManuscript?.file?.id === fileId ? summary.currentManuscript.file : null);

      setPreviewUrl(downloadUrl);
      setPreviewName(fileObj?.originalName || "File Preview");
      setPreviewType(fileObj?.mimeType || "");
      setPreviewOpen(true);
    } catch {
      toast.error("Unable to open file preview.");
    } finally {
      setOpeningFileId(null);
    }
  }

  async function castVote() {
    if (!perm.allowed) return toast.error(perm.reason);
    const note = comment.trim();
    if (!note) return toast.error("Add a comment.");
    await castVoteMutation.mutateAsync({ value: vote, note });
    setComment("");
  }

  async function finalize() {
    if (!perm.allowed) return toast.error(perm.reason);
    if (!isTieBreak && !queueItem?.canFinalize)
      return toast.error("Not enough Board votes to finalize.");
    if (boardResult === "APPROVE" && !pubType)
      return toast.error("Approve requires publicationType.");

    const payload = {
      publicationType: boardResult === "APPROVE" ? pubType : undefined,
      note: comment.trim() || undefined,
    };

    if (isTieBreak) {
      await tieBreakMutation.mutateAsync({ value: vote, ...payload });
    } else {
      await finalizeMutation.mutateAsync(payload);
    }

    router.navigate({ to: "/app/board/series-review" });
  }

  return (
    <DecisionPortalShell
      active="/app/board/voting-sessions"
      title={series.title}
      eyebrow="Voting panel"
      description={
        <Link
          to="/app/board/series-review"
          className="inline-flex items-center gap-2 text-primary underline-offset-2 hover:underline"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to review workspace
        </Link>
      }
    >
      <DecisionTimeline steps={boardFlowSteps} activeStep={2} />

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_0.42fr]">
        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <PortalMetric
              icon={Vote}
              label="Quorum"
              value={queueItem ? `${queueItem.voteCount}/${queueItem.quorum}` : "0/0"}
              hint="Submitted Board votes"
            />
            <PortalMetric
              icon={ClipboardList}
              label="Current result"
              value={boardResult ?? "Pending"}
              hint={queueItem?.decisionStatus ?? "No active session"}
            />
            <PortalMetric
              icon={CheckCircle2}
              label="Eligible"
              value={String(queueItem?.eligibleBoardCount ?? 0)}
              hint="Board members"
            />
          </div>

          {isSummaryLoading ? (
            <PortalCard
              title="Series preview"
              description="Loading proposal and manuscript evidence."
            >
              <div className="space-y-3 p-5">
                <div className="h-8 animate-pulse rounded-md bg-foreground/5" />
                <div className="h-24 animate-pulse rounded-md bg-foreground/5" />
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="h-32 animate-pulse rounded-md bg-foreground/5" />
                  <div className="h-32 animate-pulse rounded-md bg-foreground/5" />
                </div>
              </div>
            </PortalCard>
          ) : (
            <SeriesPreviewPanel
              series={previewSeries}
              summary={summary}
              queueItem={queueItem}
              onOpenFile={openSummaryFile}
              openingFileId={openingFileId}
            />
          )}

          <PortalCard title="Cast vote" description="Submit your Board vote with a decision note.">
            {!perm.allowed && (
              <div className="p-5 pb-0">
                <PortalNotice>{perm.reason}</PortalNotice>
              </div>
            )}
            <div className="space-y-4 p-5">
              <div className="flex flex-wrap gap-2">
                {voteOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setVote(option.value)}
                    className={`h-9 rounded-md px-3 text-xs font-semibold transition active:translate-y-px ${
                      vote === option.value
                        ? "bg-primary text-primary-foreground"
                        : "border border-border hover:bg-foreground/5"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              {vote === "APPROVE" && (
                <div>
                  <label className="mb-2 block text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    Publication type
                  </label>
                  <div className="flex gap-2">
                    {(["WEEKLY", "MONTHLY"] as const).map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setPubType(value)}
                        className={`h-8 rounded-md px-3 text-xs font-semibold transition active:translate-y-px ${
                          pubType === value
                            ? "bg-primary text-primary-foreground"
                            : "border border-border hover:bg-foreground/5"
                        }`}
                      >
                        {value}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <textarea
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                placeholder="Decision note, evidence, or revision reason..."
                rows={4}
                className="w-full rounded-md border border-border bg-background p-3 text-sm outline-none focus:border-primary/60"
              />

              <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={isChair}
                    onChange={(event) => setIsChair(event.target.checked)}
                  />
                  Acting as Board Chair
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={castVote}
                    disabled={!perm.allowed || isSubmitting}
                    className="h-9 rounded-md border border-border px-3 text-xs font-semibold transition hover:bg-foreground/5 disabled:opacity-50"
                  >
                    Cast vote
                  </button>
                  <button
                    type="button"
                    onClick={finalize}
                    disabled={
                      !perm.allowed ||
                      !isChair ||
                      isSubmitting ||
                      (!queueItem?.canFinalize && !isTieBreak)
                    }
                    className="h-9 rounded-md bg-primary px-4 text-xs font-semibold text-primary-foreground disabled:opacity-50"
                  >
                    {isTieBreak ? "Tie-break as Chair" : "Finalize as Chair"}
                  </button>
                </div>
              </div>
            </div>
          </PortalCard>
        </div>

        <div className="space-y-5">
          <PortalCard title="Vote ledger" description="Live Board decision count.">
            {queueItem ? (
              <div className="space-y-3 p-4 text-sm">
                <VoteLine label="Approve" value={queueItem.voteSummary.APPROVE} />
                <VoteLine label="Reject" value={queueItem.voteSummary.REJECT} />
                <VoteLine label="Needs revision" value={queueItem.voteSummary.NEEDS_REVISION} />
                <div className="border-t border-border pt-3 text-xs text-muted-foreground">
                  Eligible Board members: {queueItem.eligibleBoardCount}
                </div>
              </div>
            ) : (
              <div className="p-4 text-xs text-muted-foreground">
                No active Board session summary.
              </div>
            )}
          </PortalCard>
          <AuditTimeline entity="series" entityId={series.id} limit={10} />
        </div>
      </section>

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

function VoteLine({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between rounded-md bg-foreground/5 px-3 py-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono text-sm font-semibold">{value}</span>
    </div>
  );
}

function SeriesPreviewPanel({
  series,
  summary,
  queueItem,
  onOpenFile,
  openingFileId,
}: {
  series: Series;
  summary?: SeriesSummary;
  queueItem?: { canFinalize: boolean; decisionStatus: string };
  onOpenFile: (fileId: string) => void;
  openingFileId: string | null;
}) {
  const currentManuscript = summary?.currentManuscript;
  const files: SummaryFile[] = Array.isArray(summary?.files) ? summary.files : [];
  const manuscriptFiles = files.filter((file) => file.assetType === "manuscript");
  const supportingFiles = files.filter((file) => file.assetType !== "manuscript").slice(0, 6);
  const visibleFiles = manuscriptFiles.length ? manuscriptFiles : files.slice(0, 4);

  return (
    <PortalCard
      title="Series preview"
      description="Review the same proposal and manuscript context the Mangaka submitted before casting a Board vote."
      action={
        <div className="flex flex-wrap gap-2">
          <PortalPill tone="primary">{series.status}</PortalPill>
          {queueItem ? (
            <PortalPill tone={queueItem.canFinalize ? "success" : "neutral"}>
              {queueItem.decisionStatus}
            </PortalPill>
          ) : null}
        </div>
      }
    >
      <div className="space-y-5 p-5">
        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            <div>
              <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Proposal
              </div>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
                {series.title}
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {series.logline || series.synopsis || "No proposal summary provided."}
              </p>
            </div>
            <InfoGrid
              rows={[
                ["Target", series.targetAudience || "Unassigned"],
                [
                  "Requested cadence",
                  series.requestedPublicationType || series.publicationType || "Unassigned",
                ],
                ["Genres", formatList(series.genres)],
                ["Tags", formatList(series.tags)],
              ]}
            />
          </div>

          <div className="rounded-md border border-border bg-background p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  Current manuscript
                </div>
                <div className="mt-1 text-lg font-semibold">
                  {currentManuscript ? "Version " + currentManuscript.version : "No manuscript"}
                </div>
              </div>
              <Layers className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {currentManuscript ? (
                <>
                  <PortalPill tone="primary">{currentManuscript.status}</PortalPill>
                  {currentManuscript.file?.originalName ? (
                    <PortalPill>{currentManuscript.file.originalName}</PortalPill>
                  ) : null}
                </>
              ) : (
                <span className="text-sm text-muted-foreground">
                  No manuscript version available.
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <TextSection title="Synopsis" value={series.synopsis} />
          <TextSection title="Premise" value={series.premise} />
          <TextSection title="Characters" value={series.characters} />
          <TextSection title="Conflict" value={series.conflict} />
          <TextSection title="Owner" value={summary?.owner?.name || series.ownerId} />
          <TextSection
            title="Board signal"
            value={summary?.boardReview?.status || queueItem?.decisionStatus}
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <FileList
            title="Manuscript files"
            files={visibleFiles}
            onOpenFile={onOpenFile}
            openingFileId={openingFileId}
          />
          <FileList
            title="Supporting materials"
            files={supportingFiles}
            onOpenFile={onOpenFile}
            openingFileId={openingFileId}
          />
        </div>
      </div>
    </PortalCard>
  );
}

function InfoGrid({ rows }: { rows: Array<[string, string]> }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {rows.map(([label, value]) => (
        <div key={label} className="rounded-md border border-border bg-background px-3 py-2">
          <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            <Tags className="h-3.5 w-3.5" /> {label}
          </div>
          <div className="mt-1 text-sm font-medium text-foreground">{value}</div>
        </div>
      ))}
    </div>
  );
}

function TextSection({ title, value }: { title: string; value?: string }) {
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

function FileList({
  title,
  files,
  onOpenFile,
  openingFileId,
}: {
  title: string;
  files: SummaryFile[];
  onOpenFile: (fileId: string) => void;
  openingFileId: string | null;
}) {
  return (
    <div className="rounded-md border border-border bg-background">
      <div className="flex items-center gap-2 border-b border-border px-3 py-2 text-sm font-semibold">
        <FileText className="h-4 w-4 text-muted-foreground" /> {title}
      </div>
      <div className="divide-y divide-border">
        {files.length ? (
          files.map((file) => (
            <button
              key={file.id}
              type="button"
              onClick={() => onOpenFile(file.id)}
              disabled={file.status === "MISSING" || openingFileId === file.id}
              className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm transition hover:bg-foreground/5 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="min-w-0">
                <span className="block truncate font-medium">{file.originalName || file.id}</span>
                <span className="text-xs text-muted-foreground">
                  {file.assetType || "file"} / {formatSize(file.size)}
                </span>
              </span>
              <Download className="h-4 w-4 shrink-0 text-muted-foreground" />
            </button>
          ))
        ) : (
          <div className="px-3 py-8 text-sm text-muted-foreground">No files available.</div>
        )}
      </div>
    </div>
  );
}

function formatList(value?: string[]) {
  return value?.length ? value.join(", ") : "None";
}

function formatSize(value?: number) {
  if (!value) return "0 MB";
  return String(Math.round((value / 1024 / 1024) * 10) / 10) + " MB";
}
