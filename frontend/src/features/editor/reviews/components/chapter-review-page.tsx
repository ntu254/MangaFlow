import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { ArrowLeft, Check, Edit3, PanelLeft, PanelRight, Pin, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/shared/auth";
import {
  useChapterActionMutation,
  useChapterQuery,
  useChapterReviewsQuery,
  useChaptersForSeriesQuery,
  useCommentsQuery,
  useCreateCommentMutation,
  useSeriesDetailQuery,
} from "@/entities/series";
import {
  mapApiError,
  useReopenCommentMutation,
  useResolveCommentMutation,
  useStudioRegionsQuery,
  useStudioTasksQuery,
  useTaskEditorActionMutation,
} from "@/features/series";
import { ReviewStatusPill } from "@/entities/submission";
import { getDeadlineRisk, getPublicationReadiness } from "../../model/editor-access";
import { EmptyState } from "@/shared/ui/empty-state";
import { ReviewPagesSidebar } from "./review-pages-sidebar";
import { ChapterReviewViewer } from "./chapter-review-viewer";
import { ReviewSummaryPanel } from "./review-summary-panel";
import { ChapterReviewTimeline } from "./review-progress-timeline";
import { isBlocking, statsForComments } from "./review-helpers";

export function ChapterReviewPage({ initialAnnotationMode = false }: { initialAnnotationMode?: boolean }) {
  const { chapterId } = useParams({ from: "/app/editor/chapters/$chapterId/review" });
  const navigate = useNavigate();
  const user = useAuth((s) => s.user);
  const { data: chapter, isLoading } = useChapterQuery(chapterId);
  const { data: chapterReviews = [] } = useChapterReviewsQuery(chapterId);
  const { data: series } = useSeriesDetailQuery(chapter?.seriesId ?? "");
  const seriesIds = useMemo(() => (chapter?.seriesId ? [chapter.seriesId] : []), [chapter?.seriesId]);
  const { data: allChapters = [] } = useChaptersForSeriesQuery(seriesIds);
  const { data: comments = [] } = useCommentsQuery({ chapterId });
  const { data: regions = [] } = useStudioRegionsQuery({ chapterId });
  const { data: tasks = [] } = useStudioTasksQuery({ chapterId });
  const chapterAction = useChapterActionMutation(chapterId, chapter?.seriesId);
  const createCommentMutation = useCreateCommentMutation();
  const taskAction = useTaskEditorActionMutation(chapterId);
  const resolveCommentMutation = useResolveCommentMutation();
  const reopenCommentMutation = useReopenCommentMutation();

  const [selectedPageId, setSelectedPageId] = useState("");
  const [showAnnotations, setShowAnnotations] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [showLeftDock, setShowLeftDock] = useState(true);
  const [showRightDock, setShowRightDock] = useState(true);
  const [annotationMode, setAnnotationMode] = useState(initialAnnotationMode);

  const pages = useMemo(
    () => [...(chapter?.pages ?? [])].sort((a, b) => (a.index ?? 0) - (b.index ?? 0)),
    [chapter?.pages],
  );

  const commentsByPage = useMemo(() => {
    const map = new Map<string, typeof comments>();
    for (const c of comments) {
      const list = map.get(c.pageId) ?? [];
      list.push(c);
      map.set(c.pageId, list);
    }
    for (const [, list] of map) {
      list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }
    return map;
  }, [comments]);

  const regionLabelMap = useMemo(() => {
    const map = new Map<string, string>();
    regions.forEach((r, i) =>
      map.set(r.id, r.label ?? `Region ${String.fromCharCode(65 + (i % 26))}`),
    );
    return map;
  }, [regions]);

  const activePageId = selectedPageId || pages[0]?.id || "";
  const activeIndex = Math.max(
    0,
    pages.findIndex((p) => p.id === activePageId),
  );
  const activePage = pages[activeIndex];
  const pageComments = commentsByPage.get(activePageId) ?? [];

  const chapterStats = useMemo(() => statsForComments(comments), [comments]);
  const blockingCount = useMemo(
    () => comments.filter((c) => isBlocking(c) && c.status !== "RESOLVED").length,
    [comments],
  );

  const readiness = useMemo(
    () => (chapter ? getPublicationReadiness({ ...chapter, pages }, comments) : null),
    [chapter, comments, pages],
  );
  const risk = useMemo(() => (chapter ? getDeadlineRisk(chapter) : null), [chapter]);

  if (isLoading) {
    return (
      <div className="p-10">
        <EmptyState title="Loading Canva studio workspace..." />
      </div>
    );
  }

  if (!chapter || !series) {
    return (
      <div className="p-10">
        <EmptyState title="Chapter review dossier not found" />
      </div>
    );
  }

  const isTantouReview = chapter.status === "TANTOU_REVIEW";
  const canApprove = isTantouReview && blockingCount === 0;
  const canRevise = isTantouReview;
  const canVerifyBlockingComments = user?.role === "editor" && series.editorId === user.id;
  const canAnnotate = canVerifyBlockingComments && isTantouReview;
  const isCommentActionPending =
    resolveCommentMutation.isPending || reopenCommentMutation.isPending;

  function commentVariables(comment: (typeof comments)[number]) {
    return {
      commentId: comment.id,
      chapterId: comment.chapterId,
      pageId: comment.pageId,
      taskId: comment.taskId,
    };
  }

  function resolveComment(comment: (typeof comments)[number]) {
    if (!canVerifyBlockingComments) {
      toast.error("Only the assigned Tantou editor can verify comments.");
      return;
    }
    resolveCommentMutation.mutate(commentVariables(comment), {
      onSuccess: () => toast.success("Comment verified as RESOLVED."),
      onError: (error) => toast.error(mapApiError(error)),
    });
  }

  function reopenComment(comment: (typeof comments)[number]) {
    if (!canVerifyBlockingComments) {
      toast.error("Only the assigned Tantou editor can reopen comments.");
      return;
    }
    reopenCommentMutation.mutate(commentVariables(comment), {
      onSuccess: () => toast.success("Comment reopened."),
      onError: (error) => toast.error(mapApiError(error)),
    });
  }

  function runAction(
    action: "EDITOR_APPROVE" | "REQUEST_REVISION" | "REJECT",
    payload?: Record<string, unknown>,
  ) {
    chapterAction.mutate(
      { action, payload },
      {
        onSuccess: () =>
          toast.success(action === "EDITOR_APPROVE" ? "Chapter approved for release." : "Revision requested from author."),
        onError: () => toast.error("Failed to update chapter state."),
      },
    );
  }

  function runTaskAction(taskId: string, action: "EDITOR_APPROVE" | "COMPLETE") {
    taskAction.mutate(
      { taskId, action },
      {
        onSuccess: () =>
          toast.success(
            action === "EDITOR_APPROVE"
              ? "Task approved by editor."
              : "Task completed. Earning recorded.",
          ),
        onError: (error) => toast.error(mapApiError(error)),
      },
    );
  }

  async function createCanvasComment(input: { body: string; isBlocking: boolean; x: number; y: number }) {
    if (!canAnnotate || !activePage || !chapter || !series) {
      toast.error("Only the assigned Tantou can annotate this chapter while it is under review.");
      return false;
    }
    try {
      await createCommentMutation.mutateAsync({
        seriesId: series.id,
        chapterId: chapter.id,
        pageId: activePage.id,
        targetType: "PAGE",
        targetId: activePage.id,
        body: input.body,
        text: input.body,
        isBlocking: input.isBlocking,
        x: input.x,
        y: input.y,
      });
      toast.success(input.isBlocking ? "Blocking feedback pinned to the page." : "Feedback pinned to the page.");
      return true;
    } catch (error) {
      toast.error(mapApiError(error));
      return false;
    }
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col bg-background -m-4 sm:-m-6 lg:-m-10">
      {/* Streamlined Canva Studio Header Bar */}
      <header className="flex items-center justify-between border-b border-border/80 bg-card px-4 py-2 gap-3 shadow-2xs shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <Link
            to="/app/editor/review"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-border/80 bg-background px-2.5 py-1 text-xs font-bold text-foreground hover:bg-muted transition-colors shadow-2xs"
          >
            <ArrowLeft className="size-3.5" /> Queue
          </Link>

          <div className="h-4 w-[1px] bg-border/60 shrink-0 hidden sm:block" />

          {/* Side Dock Toggle Buttons */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => setShowLeftDock(!showLeftDock)}
              title="Toggle Pages Sidebar"
              className={`rounded-lg border px-2 py-1 text-xs font-semibold transition-all cursor-pointer ${
                showLeftDock
                  ? "border-primary/40 bg-primary/[0.08] text-primary"
                  : "border-border/80 bg-background text-muted-foreground hover:text-foreground"
              }`}
            >
              <PanelLeft className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setShowRightDock(!showRightDock)}
              title="Toggle Inspector Sidebar"
              className={`rounded-lg border px-2 py-1 text-xs font-semibold transition-all cursor-pointer ${
                showRightDock
                  ? "border-primary/40 bg-primary/[0.08] text-primary"
                  : "border-border/80 bg-background text-muted-foreground hover:text-foreground"
              }`}
            >
              <PanelRight className="size-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-2 min-w-0">
            <h1 className="font-serif font-bold text-sm text-foreground truncate">
              {series.title} — Ch.{chapter.number}: {chapter.title || `Chapter ${chapter.number}`}
            </h1>

            <ReviewStatusPill status={chapter.status} />

            {blockingCount > 0 && (
              <span className="rounded-full bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 text-[10px] font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1 shrink-0">
                <ShieldAlert className="size-3" /> {blockingCount} Blocking
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            to="/app/editor/chapters/$chapterId/annotate"
            params={{ chapterId }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border/80 bg-background px-2.5 py-1 text-xs font-bold text-foreground hover:bg-muted transition-colors shadow-2xs"
          >
            <Edit3 className="size-3.5" /> Review Canvas
          </Link>

          <button
            type="button"
            disabled={!canAnnotate}
            onClick={() => setAnnotationMode((current) => !current)}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-bold transition-colors shadow-2xs disabled:cursor-not-allowed disabled:opacity-40 ${
              annotationMode
                ? "border-primary/40 bg-primary/[0.08] text-primary"
                : "border-border/80 bg-background text-foreground hover:bg-muted"
            }`}
            title={canAnnotate ? "Pin feedback directly on the current page" : "Available to the assigned Tantou during review"}
          >
            <Pin className="size-3.5" /> {annotationMode ? "Pinning feedback" : "Annotate"}
          </button>

          <button
            type="button"
            disabled={!canApprove || chapterAction.isPending}
            onClick={() => runAction("EDITOR_APPROVE")}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-40 transition-colors shadow-2xs cursor-pointer"
          >
            <Check className="size-3.5" /> Approve
          </button>
        </div>
      </header>

      {/* Main Studio Dynamic Canvas Grid */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* Left Page Dock */}
        {showLeftDock && (
          <aside className="w-[320px] shrink-0 min-h-0 flex flex-col border-r border-border/80 bg-card/40">
            <ReviewPagesSidebar
              currentChapterId={chapterId}
              allChapters={allChapters}
              onSelectChapter={(id) =>
                navigate({
                  to: "/app/editor/chapters/$chapterId/review",
                  params: { chapterId: id },
                })
              }
              pages={pages}
              commentsByPage={commentsByPage}
              selectedPageId={activePageId}
              onSelectPage={setSelectedPageId}
              pageComments={pageComments}
              tasks={tasks}
              canVerifyBlockingComments={canVerifyBlockingComments}
              assignedEditorId={series.editorId}
              isCommentActionPending={isCommentActionPending}
              onResolveComment={resolveComment}
              onReopenComment={reopenComment}
              regionLabel={(regionId) => (regionId ? regionLabelMap.get(regionId) : undefined)}
              taskActionsPending={taskAction.isPending}
              onTaskAction={runTaskAction}
            />
          </aside>
        )}

        {/* Middle Main Canva/Konva Canvas Viewer */}
        <main className="flex-1 min-w-0 flex flex-col p-2 overflow-hidden bg-background">
          <ChapterReviewViewer
            chapter={chapter}
            series={series}
            page={activePage}
            pageComments={pageComments}
            pageIndex={activeIndex}
            pageCount={pages.length}
            risk={risk}
            showAnnotations={showAnnotations}
            onToggleAnnotations={setShowAnnotations}
            annotationMode={annotationMode}
            onToggleAnnotationMode={() => setAnnotationMode((current) => !current)}
            canAnnotate={canAnnotate}
            onCreateAnnotation={createCanvasComment}
            zoom={zoom}
            onZoom={setZoom}
            onPrev={() => pages[activeIndex - 1] && setSelectedPageId(pages[activeIndex - 1].id)}
            onNext={() => pages[activeIndex + 1] && setSelectedPageId(pages[activeIndex + 1].id)}
            pages={pages}
            onSelectPage={setSelectedPageId}
          />
        </main>

        {/* Right Editorial Summary Dock */}
        {showRightDock && (
          <aside className="w-[360px] shrink-0 min-h-0 flex flex-col border-l border-border/80 bg-card/40">
            <ReviewSummaryPanel
              stats={chapterStats}
              readiness={readiness}
              page={activePage}
              tasks={tasks}
              pageComments={pageComments}
              chapterReviews={chapterReviews}
              regionLabel={(regionId?: string) => (regionId ? regionLabelMap.get(regionId) : undefined)}
              canApprove={canApprove && !!user}
              canRevise={canRevise && !!user}
              isPending={chapterAction.isPending}
              canVerifyBlockingComments={canVerifyBlockingComments}
              isCommentActionPending={isCommentActionPending}
              taskActionsPending={taskAction.isPending}
              onTaskAction={runTaskAction}
              onApprove={() => runAction("EDITOR_APPROVE")}
              onRequestRevision={(payload) => runAction("REQUEST_REVISION", payload)}
              onReject={(payload) => runAction("REJECT", payload)}
              onResolveComment={resolveComment}
              onReopenComment={reopenComment}
              assignedEditorId={series.editorId}
            />
          </aside>
        )}
      </div>

      {/* Bottom Footer: Compact Timeline Bar */}
      <footer className="border-t border-border/80 bg-card/80 px-4 py-1.5 shadow-2xs shrink-0">
        <ChapterReviewTimeline chapter={chapter} />
      </footer>
    </div>
  );
}
