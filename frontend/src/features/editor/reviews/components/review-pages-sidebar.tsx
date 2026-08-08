import { useState, useMemo, useEffect } from "react";
import { ChevronLeft, ChevronRight, MessageSquare, ListCheck, CheckCircle, RotateCcw, Check, Sparkles } from "lucide-react";
import type { Chapter, ChapterPage } from "@/entities/series/model/series-types";
import type { StudioComment, StudioTask } from "@/entities/series/model/studio-types";
import { ResolvedImage } from "@/shared/ui";
import { chapterPageLabel } from "@/entities/chapter/model/chapter-pages";
import { formatDateTime } from "@/shared/lib/format-date";
import { commentText, commentTone, isTantouBlocking, statusLabel, TONE_DOT, TONE_PILL } from "./review-helpers";

const PAGE_SIZE = 6; // 6 pages per batch (3x2 Grid Matrix)

export function ReviewPagesSidebar({
  currentChapterId,
  allChapters = [],
  onSelectChapter,
  pages,
  commentsByPage,
  selectedPageId,
  onSelectPage,
  pageComments = [],
  tasks = [],
  canVerifyBlockingComments = false,
  assignedEditorId,
  isCommentActionPending = false,
  onResolveComment,
  onReopenComment,
  regionLabel,
  taskActionsPending = false,
  onTaskAction,
}: {
  currentChapterId?: string;
  allChapters?: Chapter[];
  onSelectChapter?: (chapterId: string) => void;
  pages: ChapterPage[];
  commentsByPage: Map<string, StudioComment[]>;
  selectedPageId: string;
  onSelectPage: (pageId: string) => void;
  pageComments?: StudioComment[];
  tasks?: StudioTask[];
  canVerifyBlockingComments?: boolean;
  assignedEditorId?: string;
  isCommentActionPending?: boolean;
  onResolveComment?: (comment: StudioComment) => void;
  onReopenComment?: (comment: StudioComment) => void;
  regionLabel?: (regionId?: string) => string | undefined;
  taskActionsPending?: boolean;
  onTaskAction?: (taskId: string, action: "EDITOR_APPROVE" | "COMPLETE") => void;
}) {
  const [pageBatch, setPageBatch] = useState(1);
  const [activeTab, setActiveTab] = useState<"COMMENTS" | "TASKS">("COMMENTS");

  const totalBatches = useMemo(
    () => Math.max(1, Math.ceil(pages.length / PAGE_SIZE)),
    [pages.length],
  );

  // Auto-switch batch if selected page is outside current batch
  useEffect(() => {
    if (!selectedPageId) return;
    const pageIndex = pages.findIndex((p) => p.id === selectedPageId);
    if (pageIndex >= 0) {
      const targetBatch = Math.floor(pageIndex / PAGE_SIZE) + 1;
      if (targetBatch !== pageBatch) {
        setPageBatch(targetBatch);
      }
    }
  }, [selectedPageId, pages]);

  const pagedPages = useMemo(() => {
    const start = (pageBatch - 1) * PAGE_SIZE;
    return pages.slice(start, start + PAGE_SIZE);
  }, [pages, pageBatch]);

  const pageTasks = useMemo(
    () => tasks.filter((t) => !selectedPageId || t.pageId === selectedPageId),
    [tasks, selectedPageId],
  );

  const activePage = useMemo(
    () => pages.find((p) => p.id === selectedPageId) || pages[0],
    [pages, selectedPageId],
  );

  const pageLabel = activePage ? `P.${chapterPageLabel(activePage)}` : "Page";
  const startRange = pages.length > 0 ? (pageBatch - 1) * PAGE_SIZE + 1 : 0;
  const endRange = Math.min(pageBatch * PAGE_SIZE, pages.length);

  return (
    <div className="flex h-full flex-col bg-card/60 divide-y divide-border/60">
      {/* Top Header: Working Interactive Chapter Selector Dropdown */}
      <div className="flex flex-col gap-1.5 px-3 py-2.5 bg-muted/20">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            Chapters / Pages
          </p>
          <span className="text-[10px] font-bold text-primary">
            {allChapters.length > 0 ? `${allChapters.length} Chs` : ""}
          </span>
        </div>
        <div className="w-full">
          <select
            value={currentChapterId}
            onChange={(e) => {
              const nextId = e.target.value;
              if (nextId && onSelectChapter) {
                onSelectChapter(nextId);
              }
            }}
            className="w-full rounded-lg border border-border/80 bg-background px-2.5 py-1.5 text-xs font-bold text-foreground cursor-pointer shadow-2xs truncate hover:border-primary/50 transition-colors focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {allChapters.map((ch) => (
              <option key={ch.id} value={ch.id}>
                Ch.{String(ch.number).padStart(3, "0")} {ch.title ? `- ${ch.title}` : ""}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Top Section: 3x2 Page Grid Contact Sheet */}
      <div className="p-2.5">
        <div className="grid grid-cols-3 gap-2">
          {pagedPages.map((page) => {
            const pageComms = commentsByPage.get(page.id) ?? [];
            const pageTsks = tasks.filter((t) => t.pageId === page.id);
            const selected = page.id === selectedPageId;
            const label = chapterPageLabel(page);

            return (
              <button
                key={page.id}
                type="button"
                onClick={() => onSelectPage(page.id)}
                className={`group flex flex-col overflow-hidden rounded-xl border transition-all cursor-pointer text-left ${
                  selected
                    ? "border-primary ring-2 ring-primary/40 shadow-xs bg-primary/[0.04]"
                    : "border-border/70 hover:border-primary/50 bg-card hover:shadow-2xs"
                }`}
              >
                {/* Image Frame */}
                <div className="relative aspect-[3/4] w-full overflow-hidden bg-muted/40 border-b border-border/40">
                  <ResolvedImage
                    fileKey={page.fileKey}
                    fallbackUrl={page.fileUrl ?? page.imageUrl}
                    alt={`P.${label}`}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-150"
                    fallback={
                      <div className="flex h-full items-center justify-center text-[9px] font-bold text-muted-foreground">
                        P.{label}
                      </div>
                    }
                  />
                </div>

                {/* Card Info Footer */}
                <div className="p-1.5 bg-card">
                  <p className="text-[11px] font-extrabold text-foreground leading-tight">
                    P.{label}
                  </p>
                  <div className="flex items-center gap-2 pt-0.5 text-[9px] font-semibold text-muted-foreground">
                    <span className="flex items-center gap-0.5">
                      ≡ {pageTsks.length}
                    </span>
                    <span className="flex items-center gap-0.5">
                      💬 {pageComms.length}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Middle Paging Controls Strip */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-muted/30 text-xs">
        <span className="font-semibold text-muted-foreground text-[11px]">
          {startRange}-{endRange}/{pages.length}
        </span>

        <div className="flex items-center gap-1 rounded-md border border-border/60 bg-background p-0.5 shadow-2xs">
          <button
            type="button"
            onClick={() => setPageBatch((b) => Math.max(1, b - 1))}
            disabled={pageBatch <= 1}
            className="grid size-5 place-items-center rounded text-foreground hover:bg-muted disabled:opacity-30 transition-colors cursor-pointer"
            title="Previous Page Batch"
          >
            <ChevronLeft className="size-3" />
          </button>
          <button
            type="button"
            onClick={() => setPageBatch((b) => Math.min(totalBatches, b + 1))}
            disabled={pageBatch >= totalBatches}
            className="grid size-5 place-items-center rounded text-foreground hover:bg-muted disabled:opacity-30 transition-colors cursor-pointer"
            title="Next Page Batch"
          >
            <ChevronRight className="size-3" />
          </button>
        </div>
      </div>

      {/* Lower Section: Tabs Header (Comments | Tasks) */}
      <div className="flex items-center border-b border-border/60 px-2 bg-muted/10 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab("COMMENTS")}
          className={`flex-1 py-2 text-center transition-all cursor-pointer ${
            activeTab === "COMMENTS"
              ? "text-primary border-b-2 border-primary font-bold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Comments <span className="text-[10px] opacity-75">({pageComments.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("TASKS")}
          className={`flex-1 py-2 text-center transition-all cursor-pointer ${
            activeTab === "TASKS"
              ? "text-primary border-b-2 border-primary font-bold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Tasks <span className="text-[10px] opacity-75">({pageTasks.length})</span>
        </button>
      </div>

      {/* Tab Content List Body */}
      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {activeTab === "COMMENTS" && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-foreground">
              <div className="flex items-center gap-1.5">
                <MessageSquare className="size-3.5 text-muted-foreground" />
                <span>Comments ({pageComments.length})</span>
              </div>
              <span className="text-[10px] text-muted-foreground font-semibold">
                {pageLabel}
              </span>
            </div>

            {pageComments.length > 0 ? (
              <div className="space-y-2.5 pt-1">
                {pageComments.map((c, i) => {
                  const tone = commentTone(c);
                  const reg = regionLabel ? regionLabel(c.regionId) : undefined;
                  const canVerify = canVerifyBlockingComments && isTantouBlocking(c, assignedEditorId);

                  return (
                    <div
                      key={c.id}
                      className="rounded-xl border border-border/80 bg-card p-3 space-y-2 shadow-2xs transition-all hover:border-primary/40"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`grid size-5 place-items-center rounded-full text-[10px] font-bold text-white shadow-2xs ${TONE_DOT[tone]}`}
                          >
                            {i + 1}
                          </span>
                          <span className="text-xs font-bold text-foreground">
                            {pageLabel}
                            {reg ? ` · ${reg}` : ""}
                          </span>
                        </div>
                        <span
                          className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold ${TONE_PILL[tone]}`}
                        >
                          {statusLabel(c)}
                        </span>
                      </div>

                      <div className="text-[11px] text-muted-foreground flex items-center justify-between">
                        <span>{c.authorName}</span>
                        <span>{formatDateTime(c.createdAt)}</span>
                      </div>

                      <p className="text-xs text-foreground font-medium bg-muted/30 p-2 rounded-lg border border-border/40">
                        {commentText(c)}
                      </p>

                      {/* Interactive Verification Buttons for Tantou Editor */}
                      {canVerify && (
                        <div className="pt-1 flex flex-wrap items-center gap-1.5 border-t border-border/40">
                          {c.status !== "RESOLVED" ? (
                            <button
                              type="button"
                              disabled={isCommentActionPending}
                              onClick={() => onResolveComment && onResolveComment(c)}
                              className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-emerald-700 disabled:opacity-40 shadow-2xs cursor-pointer transition-colors"
                            >
                              <CheckCircle className="size-3" />
                              {c.status === "ADDRESSED" ? "Verify RESOLVED" : "Mark RESOLVED"}
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled={isCommentActionPending}
                              onClick={() => onReopenComment && onReopenComment(c)}
                              className="inline-flex items-center gap-1 rounded-lg border border-border/80 bg-background px-2.5 py-1 text-[11px] font-bold text-foreground hover:bg-muted disabled:opacity-40 shadow-2xs cursor-pointer transition-colors"
                            >
                              <RotateCcw className="size-3" /> Reopen
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-8 text-center text-xs font-medium text-muted-foreground">
                No comments on {pageLabel} yet
              </div>
            )}
          </div>
        )}

        {activeTab === "TASKS" && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-foreground">
              <div className="flex items-center gap-1.5">
                <ListCheck className="size-3.5 text-muted-foreground" />
                <span>Assistant Tasks ({pageTasks.length})</span>
              </div>
              <span className="text-[10px] text-muted-foreground font-semibold">
                {pageLabel}
              </span>
            </div>

            {pageTasks.length > 0 ? (
              <div className="space-y-2.5 pt-1">
                {pageTasks.map((task) => {
                  const needsApprove = task.status === "MANGAKA_APPROVED";
                  const needsComplete = task.status === "EDITOR_APPROVED";

                  return (
                    <div
                      key={task.id}
                      className="rounded-xl border border-border/80 bg-card p-3 space-y-2 shadow-2xs transition-all hover:border-primary/40"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-bold text-foreground truncate">{task.title}</p>
                        <span className="rounded px-1.5 py-0.5 text-[10px] font-bold bg-muted text-muted-foreground shrink-0 uppercase">
                          {task.status}
                        </span>
                      </div>

                      <p className="text-[11px] text-muted-foreground">
                        {task.assigneeName ? `Assignee: ${task.assigneeName}` : "Unassigned Assistant"}
                      </p>

                      {/* Interactive Task Verification Actions */}
                      {(needsApprove || needsComplete) && onTaskAction && (
                        <div className="pt-1 flex items-center justify-end gap-1.5 border-t border-border/40">
                          {needsApprove ? (
                            <button
                              type="button"
                              disabled={taskActionsPending}
                              onClick={() => onTaskAction(task.id, "EDITOR_APPROVE")}
                              className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-emerald-700 disabled:opacity-40 shadow-2xs cursor-pointer transition-colors"
                            >
                              <Check className="size-3" /> Approve Task
                            </button>
                          ) : needsComplete ? (
                            <button
                              type="button"
                              disabled={taskActionsPending}
                              onClick={() => onTaskAction(task.id, "COMPLETE")}
                              className="inline-flex items-center gap-1 rounded-lg border border-border/80 bg-background px-2.5 py-1 text-[11px] font-bold text-foreground hover:bg-muted disabled:opacity-40 shadow-2xs cursor-pointer transition-colors"
                            >
                              <CheckCircle className="size-3" /> Complete
                            </button>
                          ) : null}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-8 text-center text-xs font-medium text-muted-foreground">
                No assistant tasks for {pageLabel}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
