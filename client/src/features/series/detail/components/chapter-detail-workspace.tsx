import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  Upload,
  Send,
  PenTool,
  MoreHorizontal,
  ClipboardCheck,
  Calendar,
  RefreshCw,
  Trash2,
  UserPlus,
  Download,
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
  useSendChapterToEditorReviewMutation,
  mapApiError,
} from "../../api/series-queries";
import { uploadFileToR2 } from "@/shared/lib/r2-upload";
import { allowedChapterActions, checkChapterAction } from "../model/chapter-machine";
import { CHAPTER_ACTION_LABEL } from "@/entities/series/model/series-types";

const UNSUPPORTED = "Not supported in the MVP";

function computeNextAction(
  chapter: Chapter,
  ready: boolean,
): { label: string; tone: "info" | "warn" | "success" } | null {
  const unresolved = chapter.reviewNotes.filter((n) => !n.resolved);
  if (chapter.status === "PUBLISHED") return null;
  if (chapter.status === "SCHEDULED")
    return { label: `Scheduled ${formatDate(chapter.scheduledAt)}`, tone: "info" };
  if (chapter.status === "EDITOR_APPROVED" || chapter.status === "READY_FOR_PUBLICATION")
    return { label: "Ready — schedule or publish", tone: "success" };
  if (chapter.status === "EDITOR_REVIEW")
    return { label: "Waiting for editor review", tone: "info" };
  if (chapter.status === "REVISION")
    return {
      label: unresolved.length
        ? `Resolve ${unresolved.length} blocking note(s)`
        : "Resubmit when ready",
      tone: "warn",
    };
  if (ready && chapter.status === "DRAFTING")
    return { label: "Ready — send to editor review", tone: "success" };
  if (!chapter.pages.length) return { label: "Upload draft pages to begin", tone: "warn" };
  if (unresolved.length)
    return { label: `Resolve ${unresolved.length} blocking note(s)`, tone: "warn" };
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
  const fileRef = useRef<HTMLInputElement>(null);

  const unresolvedNotes = chapter.reviewNotes.filter((n) => !n.resolved);
  const activeTasks = unresolvedNotes.slice(0, 5);
  const recentAudit = audit.slice(0, 5);

  const hasPages = chapter.pages.length > 0;
  const hasAssignee = Boolean(chapter.assigneeId);
  const hasDeadline = Boolean(chapter.draftDueAt || chapter.reviewDueAt);
  const noBlocking = chapter.reviewNotes.every((n) => n.resolved);
  const ready = hasPages && hasAssignee && hasDeadline && noBlocking;

  const isMangakaOwner = user.role === "mangaka" && user.id === series.authorId;
  const canUpload =
    isMangakaOwner &&
    (chapter.status === "DRAFTING" ||
      chapter.status === "REVISION" ||
      chapter.status === "PLANNED");
  const submitCheck = checkChapterAction("SUBMIT_REVIEW", user, chapter, series);
  const submissionReadinessKeys = new Set([
    "allPagesUploaded",
    "allTasksApproved",
    "allSubmissionsApproved",
    "allCommentsResolved",
  ]);
  const knownSubmissionBlocker = reviewReadiness?.items.some(
    (item) => submissionReadinessKeys.has(item.key) && !item.passed,
  );
  const canSubmit = submitCheck.ok && !knownSubmissionBlocker;
  const submitDisabledReason =
    submitCheck.reason ??
    reviewReadiness?.items.find((item) => submissionReadinessKeys.has(item.key) && !item.passed)
      ?.reason;

  const nextAction = useMemo(() => computeNextAction(chapter, ready), [chapter, ready]);

  const allowedActions = useMemo(() => {
    if (!user) return [];
    return allowedChapterActions(user, chapter, series);
  }, [user, chapter, series]);

  const submitReview = async () => {
    if (!canSubmit) {
      toast.error(submitDisabledReason ?? "Chapter is not ready for Editor Review.");
      return;
    }
    try {
      await sendEditorReviewMutation.mutateAsync();
      toast.success("Sent to Editor Review.");
    } catch (e) {
      toast.error(mapApiError(e));
    }
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || !user) return;
    const valid = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (valid.length === 0) {
      toast.error("Choose an image file.");
      return;
    }
    try {
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
      toast.success(`Upload ${valid.length} page(s) completed.`);
    } catch (e) {
      toast.error(mapApiError(e));
    }
  };

  const handleAction = async (action: string) => {
    try {
      await chapterActionMutation.mutateAsync({ action: action as never });
      toast.success(
        `${CHAPTER_ACTION_LABEL[action as keyof typeof CHAPTER_ACTION_LABEL] ?? action} completed.`,
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
              <h2 className="font-serif text-xl">
                Chapter {String(chapter.number).padStart(3, "0")}
              </h2>
              <ChapterStatusPill status={chapter.status} />
              <span className="text-xs text-muted-foreground">{chapter.pages.length} pages</span>
            </div>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{chapter.title}</p>
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
            <span>
              <span className="font-semibold text-foreground">Assignee:</span>{" "}
              {chapter.assigneeName || "—"}
            </span>
            <span>
              <span className="font-semibold text-foreground">Deadline:</span>{" "}
              {formatDate(chapter.draftDueAt ?? chapter.reviewDueAt ?? chapter.scheduledAt) || "—"}
            </span>
            <span>
              <span className="font-semibold text-foreground">Updated:</span>{" "}
              {formatDateTime(chapter.updatedAt)}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => canEnterStudio && onOpenStudio?.()}
              disabled={!canEnterStudio || !onOpenStudio}
              title={canEnterStudio ? "Open Studio canvas" : "You do not have access to Studio."}
              className="inline-flex items-center gap-1 rounded border border-border bg-background px-2.5 py-1.5 text-[11px] font-semibold hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
            >
              <PenTool className="size-3" /> Studio
            </button>
            <button
              onClick={() => canUpload && fileRef.current?.click()}
              disabled={!canUpload}
              title={canUpload ? "Upload pages" : UNSUPPORTED}
              className="inline-flex items-center gap-1 rounded border border-border bg-background px-2.5 py-1.5 text-[11px] font-semibold hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Upload className="size-3" /> Upload
            </button>
            <button
              onClick={submitReview}
              disabled={sendEditorReviewMutation.isPending}
              aria-disabled={!canSubmit}
              title={canSubmit ? "Send to Editor Review" : (submitDisabledReason ?? UNSUPPORTED)}
              className={`inline-flex items-center gap-1 rounded px-2.5 py-1.5 text-[11px] font-semibold disabled:cursor-not-allowed disabled:opacity-40 ${
                canSubmit
                  ? "bg-foreground text-background hover:bg-foreground/90"
                  : "bg-foreground/40 text-background hover:bg-foreground/50"
              }`}
            >
              <Send className="size-3" /> Send to Editor Review
            </button>

            {/* More menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="inline-flex items-center justify-center rounded border border-border bg-background p-1.5 hover:bg-muted">
                  <MoreHorizontal className="size-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {allowedActions
                  .filter((action) => action !== "SUBMIT_REVIEW" && action !== "RESUBMIT")
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
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* ── Compact Readiness Bar ── */}
      <ChapterReadiness chapter={chapter} flat compact />

      {/* ── Main Workspace: 2-column ── */}
      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        {/* Left: Pages Grid */}
        <div id="chapter-pages" className="rounded-md border border-border bg-card p-4">
          <ChapterPagesPreview chapter={chapter} canUpload={canUpload} expanded compact />
        </div>

        {/* Right: Sticky Inspector */}
        <div className="space-y-3 lg:sticky lg:top-4 lg:self-start">
          {/* Next Action */}
          {nextAction && (
            <div
              className={`rounded-md border p-3 text-xs font-semibold ${NEXT_TONEClasses[nextAction.tone]}`}
            >
              {nextAction.label}
            </div>
          )}

          {/* Chapter Summary */}
          <div className="rounded-md border border-border bg-card p-3">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Chapter summary
            </p>
            <dl className="space-y-1 text-xs">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Status</dt>
                <dd>
                  <ChapterStatusPill status={chapter.status} />
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Pages</dt>
                <dd className="font-semibold">{chapter.pages.length}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Revision round</dt>
                <dd className="font-semibold">{chapter.revisionRound}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Review notes</dt>
                <dd className="font-semibold">{chapter.reviewNotes.length}</dd>
              </div>
            </dl>
          </div>

          {/* Active Tasks */}
          <div className="rounded-md border border-border bg-card p-3">
            <div className="mb-2 flex items-center justify-between">
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
              <p className="text-[11px] text-muted-foreground">None task pending.</p>
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
                      <p className="truncate text-[11px] font-semibold">{n.text}</p>
                      <p className="truncate text-[9px] text-muted-foreground">
                        {n.authorName} · {n.authorRole}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Pending Submissions */}
          <div className="rounded-md border border-border bg-card p-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Recent activity
              </p>
              {recentAudit.length > 0 && (
                <span className="text-[10px] text-muted-foreground">{recentAudit.length} new</span>
              )}
            </div>
            {recentAudit.length === 0 ? (
              <p className="text-[11px] text-muted-foreground">No recent activity.</p>
            ) : (
              <ul className="space-y-1.5">
                {recentAudit.map((a) => (
                  <li
                    key={a.id}
                    className="flex items-start gap-2 rounded border border-border bg-background px-2 py-1.5"
                  >
                    <div className="grid size-5 shrink-0 place-items-center rounded-full bg-muted text-[8px] font-bold">
                      {a.actorName.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[11px]">
                        <span className="font-semibold">{a.actorName}</span>{" "}
                        <span className="text-muted-foreground">{a.action}</span>
                      </p>
                      <p className="truncate text-[9px] text-muted-foreground">
                        {a.detail ?? formatDateTime(a.createdAt)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Review Notes */}
          <div id="chapter-review-notes" className="rounded-md border border-border bg-card p-3">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Review notes
            </p>
            {chapter.reviewNotes.length === 0 ? (
              <p className="text-[11px] text-muted-foreground">No notes yet.</p>
            ) : (
              <ul className="space-y-1.5">
                {chapter.reviewNotes.map((n) => (
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
                    <p className="whitespace-pre-line">{n.text}</p>
                    {n.resolved && <p className="mt-0.5 text-[10px] text-emerald-700">Resolved</p>}
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
