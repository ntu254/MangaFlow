import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  Check,
  Upload,
  Send,
  PenTool,
  MoreHorizontal,
  ClipboardCheck,
  Calendar,
  RefreshCw,
  Archive,
  Trash2,
  UserPlus,
  Download,
  Play,
  User,
  Clock,
} from "lucide-react";
import { useAuth } from "@/shared/auth";
import type { Chapter, ProductionSeries } from "@/entities/series/model/series-types";
import type { User as AppUser } from "@/shared/auth";
import type { AuditEntry } from "@/entities/audit";
import { ChapterStatusPill } from "@/entities/chapter";
import { ChapterReadiness } from "./chapter-readiness";
import { ChapterPagesPreview } from "./chapter-pages-preview";
import { ReviewNotes } from "./review-notes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDate, formatDateTime } from "@/shared/lib/format-date";
import {
  useUploadPageMutation,
  useChapterActionMutation,
  useChapterReadinessQuery,
  useCommentsQuery,
  useSendChapterToEditorReviewMutation,
  mapApiError,
} from "../../api/series-queries";
import { uploadFileToR2 } from "@/shared/lib/r2-upload";
import { allowedChapterActions, checkChapterAction } from "../model/chapter-machine";
import { CHAPTER_ACTION_LABEL } from "@/entities/series/model/series-types";

const UNSUPPORTED = "Not supported in MVP";

function computeNextAction(
  chapter: Chapter,
  ready: boolean,
  unresolvedNotes: number,
): { label: string; tone: "info" | "warn" | "success" } | null {
  if (chapter.status === "PUBLISHED") return null;
  if (chapter.publication?.status === "SCHEDULED")
    return { label: `Scheduled ${formatDate(chapter.publication.scheduledAt)}`, tone: "info" };
  if (chapter.status === "READY_FOR_PUBLICATION")
    return { label: "Ready — schedule or publish", tone: "success" };
  if (chapter.status === "TANTOU_REVIEW")
    return { label: "Waiting for editor review", tone: "info" };
  if (chapter.status === "REVISION_REQUIRED")
    return {
      label: unresolvedNotes
        ? `Resolve ${unresolvedNotes} blocking note(s)`
        : "Resubmit when ready",
      tone: "warn",
    };
  if (ready && chapter.status === "IN_PRODUCTION")
    return { label: "Ready — send to editor review", tone: "success" };
  if (!chapter.pages.length) return { label: "Upload draft pages to begin", tone: "warn" };
  if (unresolvedNotes)
    return { label: `Resolve ${unresolvedNotes} blocking note(s)`, tone: "warn" };
  if (!chapter.draftDueAt && !chapter.reviewDueAt)
    return { label: "Set draft/review deadline", tone: "warn" };
  return { label: "Continue drafting", tone: "info" };
}

const NEXT_TONEClasses: Record<string, string> = {
  info: "bg-blue-50 text-blue-700 border-blue-200",
  warn: "bg-amber-50 text-amber-700 border-amber-200",
  success: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

export function ChapterDetailWorkspace({
  chapter,
  series,
  audit,
  user,
  onBack,
  canEnterStudio = false,
  onOpenStudio,
}: {
  chapter: Chapter;
  series: ProductionSeries;
  audit: AuditEntry[];
  user: AppUser;
  onBack: () => void;
  canEnterStudio?: boolean;
  onOpenStudio?: () => void;
}) {
  const uploadPageMutation = useUploadPageMutation(chapter.id, series.id);
  const chapterActionMutation = useChapterActionMutation(chapter.id, series.id);
  const sendEditorReviewMutation = useSendChapterToEditorReviewMutation(chapter.id, series.id);
  const { data: reviewReadiness } = useChapterReadinessQuery(chapter.id);
  const { data: comments = [] } = useCommentsQuery({ chapterId: chapter.id });
  const fileRef = useRef<HTMLInputElement>(null);

  const unresolvedNotes = comments.filter(
    (comment) => comment.isBlocking && !["ADDRESSED", "RESOLVED"].includes(comment.status),
  );
  const activeTasks = unresolvedNotes.slice(0, 5);
  const recentAudit = audit.slice(0, 5);

  const ready = reviewReadiness?.ready === true;

  const canUpload =
    user.role === "mangaka" &&
    series.authorId === user.id &&
    (chapter.status === "IN_PRODUCTION" ||
      chapter.status === "REVISION_REQUIRED" ||
      chapter.status === "PLANNED");
  const isResubmission = chapter.status === "REVISION_REQUIRED";
  const reviewAction = isResubmission ? "RESUBMIT" : "SUBMIT_REVIEW";
  const submitCheck = checkChapterAction(reviewAction, user, chapter, series);
  const canSubmit = submitCheck.ok && ready;
  const submitDisabledReason =
    submitCheck.reason ??
    (!reviewReadiness
      ? "Readiness checks are still loading."
      : !ready
        ? "Chapter does not meet the canonical editor-review readiness checks."
        : undefined) ??
    reviewReadiness?.items.find((item) => !item.passed)?.reason;

  const nextAction = useMemo(
    () => computeNextAction(chapter, ready, unresolvedNotes.length),
    [chapter, ready, unresolvedNotes.length],
  );

  const allowedActions = useMemo(() => {
    if (!user) return [];
    return allowedChapterActions(user, chapter, series);
  }, [user, chapter, series]);

  const submitReview = async () => {
    if (!canSubmit) {
      toast.error(
        submitDisabledReason ?? "Chapter does not meet the requirements for Editor Review.",
      );
      return;
    }
    try {
      if (isResubmission) {
        await chapterActionMutation.mutateAsync({ action: "RESUBMIT" });
        toast.success("Resubmit to Editor.");
      } else {
        await sendEditorReviewMutation.mutateAsync();
        toast.success("Sent to Editor Review.");
      }
    } catch (e) {
      toast.error(mapApiError(e));
    }
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || !user) return;
    const valid = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (valid.length === 0) {
      toast.error("Select image files.");
      return;
    }
    try {
      if (chapter.status === "PLANNED") {
        await chapterActionMutation.mutateAsync({ action: "START_DRAFT" as never });
        toast.info("Chapter auto-started draft: PLANNED → IN_PRODUCTION");
      }
      for (let i = 0; i < valid.length; i++) {
        const file = valid[i];
        const uploaded = await uploadFileToR2(file, {
          folder: `chapters/${chapter.id}/pages`,
        });
        await uploadPageMutation.mutateAsync({
          pageNumber: chapter.pages.length + i + 1,
          imageUrl: uploaded.url,
          fileUrl: uploaded.fileUrl,
          fileKey: uploaded.fileKey,
          fileName: uploaded.filename,
          sizeKB: uploaded.sizeKB,
          mimeType: uploaded.mimeType,
        });
      }
      toast.success(`Successfully uploaded ${valid.length} page(s).`);
    } catch (e) {
      toast.error(mapApiError(e));
    }
  };

  const handleAction = async (action: string) => {
    try {
      await chapterActionMutation.mutateAsync({ action: action as never });
      toast.success(
        `${CHAPTER_ACTION_LABEL[action as keyof typeof CHAPTER_ACTION_LABEL] ?? action} completed successfully.`,
      );
    } catch (e) {
      toast.error(mapApiError(e));
    }
  };

  return (
    <div className="space-y-3">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => handleFiles(e.target.files)}
      />

      {/* ── Compact Chapter Toolbar ── */}
      <div className="rounded-md border border-border bg-card p-3">
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1 rounded border border-border bg-background px-2 py-1 text-xs font-semibold hover:bg-muted"
          >
            <ArrowLeft className="size-3" /> Chapters
          </button>

          <div className="h-4 w-px bg-border" />

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-serif text-xl font-bold">
                Chapter {String(chapter.number).padStart(3, "0")}
              </h2>
              <ChapterStatusPill status={chapter.status} />
              <span className="text-xs text-muted-foreground">
                {chapter.pages.length} / {chapter.targetPages ?? 20} pages
              </span>
            </div>
            {chapter.title &&
              chapter.title !== series.title &&
              !chapter.title.startsWith(series.title) && (
                <p className="mt-0.5 truncate text-xs text-muted-foreground">{chapter.title}</p>
              )}
          </div>

          <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
            {chapter.assigneeName && chapter.assigneeName !== series.authorName && (
              <span className="inline-flex items-center gap-1 rounded bg-muted/60 px-2 py-1 font-medium text-foreground/80">
                <User className="size-3 text-muted-foreground" />
                <span className="text-muted-foreground">Assignee:</span> {chapter.assigneeName}
              </span>
            )}
            <span className="inline-flex items-center gap-1 rounded bg-muted/60 px-2 py-1 font-medium text-foreground/80">
              <Calendar className="size-3 text-muted-foreground" />
              <span className="text-muted-foreground">Deadline:</span>{" "}
              {formatDate(chapter.draftDueAt ?? chapter.reviewDueAt ?? chapter.scheduledAt) || "—"}
            </span>
            <span className="inline-flex items-center gap-1 rounded bg-muted/60 px-2 py-1 font-medium text-foreground/80">
              <Clock className="size-3 text-muted-foreground" />
              <span className="text-muted-foreground">Updated:</span>{" "}
              {formatDateTime(chapter.updatedAt)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Smart Dynamic Action Button */}
            {chapter.status === "TANTOU_REVIEW" ? (
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
                <span className="size-2 rounded-full bg-amber-500 animate-pulse" /> Under Editor
                Review
              </span>
            ) : chapter.status === "READY_FOR_PUBLICATION" ? (
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <Check className="size-3.5" /> Ready for Publication
              </span>
            ) : chapter.status === "PUBLISHED" ? (
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400">
                Published
              </span>
            ) : chapter.pages.length === 0 && canUpload ? (
              <button
                onClick={() => fileRef.current?.click()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-xs transition-all hover:bg-primary/90"
              >
                <Upload className="size-3.5" /> Upload Pages
              </button>
            ) : (
              <button
                onClick={submitReview}
                disabled={chapterActionMutation.isPending || sendEditorReviewMutation.isPending}
                aria-disabled={!canSubmit}
                title={
                  canSubmit
                    ? isResubmission
                      ? "Resubmit to Editor"
                      : "Send to Editor Review"
                    : (submitDisabledReason ?? UNSUPPORTED)
                }
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-40 ${
                  canSubmit
                    ? "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90"
                    : "bg-muted text-muted-foreground border border-border"
                }`}
              >
                <Send className="size-3.5" />
                {isResubmission ? "Resubmit to Editor" : "Submit to Editor Review"}
              </button>
            )}

            {/* More menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="inline-flex items-center justify-center rounded border border-border bg-background p-1.5 hover:bg-muted">
                  <MoreHorizontal className="size-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {allowedActions
                  .filter(
                    (action) =>
                      action !== "SUBMIT_REVIEW" &&
                      action !== "RESUBMIT" &&
                      action !== "START_DRAFT",
                  )
                  .map((a) => {
                    const c = checkChapterAction(a, user, chapter, series);
                    const disabledBySelfApproval =
                      a === "EDITOR_APPROVE" && user.id === chapter.assigneeId;
                    return (
                      <DropdownMenuItem
                        key={a}
                        disabled={
                          !c.ok || disabledBySelfApproval || chapterActionMutation.isPending
                        }
                        onClick={() => handleAction(a)}
                      >
                        {CHAPTER_ACTION_LABEL[a]}
                      </DropdownMenuItem>
                    );
                  })}
                {allowedActions.length > 0 && <DropdownMenuSeparator />}
                <DropdownMenuItem disabled>
                  <Download className="size-3.5" /> Download package
                </DropdownMenuItem>
                <DropdownMenuItem disabled>
                  <Archive className="size-3.5" /> Archive
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* ── Main Workspace: 2-column ── */}
      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        {/* Left: Pages Grid */}
        <div id="chapter-pages" className="rounded-md border border-border bg-card p-4">
          <ChapterPagesPreview chapter={chapter} expanded compact />
        </div>

        {/* Right: Sticky Inspector */}
        <div className="space-y-3 lg:sticky lg:top-4 lg:self-start">
          {/* Main Inspector Card */}
          <div className="rounded-md border border-border bg-card p-3 space-y-3">
            {/* Next Action Banner */}
            {nextAction && (
              <div
                className={`rounded border p-2.5 text-xs font-semibold ${NEXT_TONEClasses[nextAction.tone]}`}
              >
                {nextAction.label}
              </div>
            )}

            {/* Summary Metrics */}
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Chapter summary
              </p>
              <dl className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded bg-muted/40 p-2">
                  <dt className="text-[10px] text-muted-foreground">Status</dt>
                  <dd className="mt-0.5 font-semibold">
                    <ChapterStatusPill status={chapter.status} />
                  </dd>
                </div>
                <div className="rounded bg-muted/40 p-2">
                  <dt className="text-[10px] text-muted-foreground">Pages</dt>
                  <dd className="mt-0.5 text-xs font-semibold">
                    {chapter.pages.length} / {chapter.targetPages ?? 20}
                  </dd>
                </div>
                <div className="rounded bg-muted/40 p-2">
                  <dt className="text-[10px] text-muted-foreground">Revision round</dt>
                  <dd className="mt-0.5 text-xs font-semibold">{chapter.revisionRound}</dd>
                </div>
                <div className="rounded bg-muted/40 p-2">
                  <dt className="text-[10px] text-muted-foreground">Review notes</dt>
                  <dd className="mt-0.5 text-xs font-semibold">{comments.length}</dd>
                </div>
              </dl>
            </div>

            {/* Readiness Checklist Section */}
            <div className="border-t border-border/60 pt-2.5">
              <ChapterReadiness chapter={chapter} flat />
            </div>

            {/* Active Tasks Section */}
            <div className="border-t border-border/60 pt-2.5">
              <div className="mb-1.5 flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Active tasks
                </p>
                {activeTasks.length > 0 && (
                  <span className="text-[10px] text-muted-foreground">
                    {activeTasks.length} pending
                  </span>
                )}
              </div>
              {activeTasks.length === 0 ? (
                <p className="text-[11px] text-muted-foreground">No pending tasks.</p>
              ) : (
                <ul className="space-y-1.5">
                  {activeTasks.map((n) => (
                    <li
                      key={n.id}
                      className="flex items-center gap-2 rounded border border-border bg-background px-2 py-1.5"
                    >
                      <div className="grid size-5 shrink-0 place-items-center rounded-full bg-muted text-[8px] font-bold">
                        {n.authorName.charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[11px] font-semibold">{n.text ?? n.body}</p>
                        <p className="truncate text-[9px] text-muted-foreground">
                          {n.authorName} · {n.authorRole}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Review Notes Card */}
          <div
            id="chapter-review-notes"
            className="rounded-md border border-border bg-card p-3 space-y-3"
          >
            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Review notes
            </p>
            {comments.length === 0 ? (
              <p className="text-[11px] text-muted-foreground">No review notes yet.</p>
            ) : (
              <ul className="space-y-1.5">
                {comments.map((n) => (
                  <li
                    key={n.id}
                    className="rounded border border-border bg-background px-2 py-1.5 text-[11px]"
                  >
                    <div className="mb-0.5 flex items-center justify-between text-[9px] text-muted-foreground">
                      <span>
                        {n.authorName} · {n.authorRole}
                      </span>
                      <span>{formatDateTime(n.createdAt)}</span>
                    </div>
                    <p className="whitespace-pre-line">{n.text ?? n.body}</p>
                    {n.status !== "OPEN" && (
                      <p className="mt-0.5 text-[10px] text-emerald-700">{n.status}</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
