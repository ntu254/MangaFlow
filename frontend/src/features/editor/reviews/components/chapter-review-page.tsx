import { useMemo, useState } from "react";
import { Link, useParams } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/shared/auth";
import {
  useChapterActionMutation,
  useChapterQuery,
  useChapterReviewsQuery,
  useCommentsQuery,
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
import { getDeadlineRisk, getPublicationReadiness } from "../../model/editor-access";
import { EmptyState } from "@/shared/ui/empty-state";
import { ReviewPagesSidebar } from "./review-pages-sidebar";
import { ChapterReviewViewer } from "./chapter-review-viewer";
import { ReviewSummaryPanel } from "./review-summary-panel";
import { ChapterReviewTimeline } from "./review-progress-timeline";
import { isBlocking, statsForComments } from "./review-helpers";

export function ChapterReviewPage() {
  const { chapterId } = useParams({ from: "/app/editor/chapters/$chapterId/review" });
  const user = useAuth((s) => s.user);
  const { data: chapter, isLoading } = useChapterQuery(chapterId);
  const { data: chapterReviews = [] } = useChapterReviewsQuery(chapterId);
  const { data: series } = useSeriesDetailQuery(chapter?.seriesId ?? "");
  const { data: comments = [] } = useCommentsQuery({ chapterId });
  const { data: regions = [] } = useStudioRegionsQuery({ chapterId });
  const { data: tasks = [] } = useStudioTasksQuery({ chapterId });
  const chapterAction = useChapterActionMutation(chapterId, chapter?.seriesId);
  const taskAction = useTaskEditorActionMutation(chapterId);
  const resolveCommentMutation = useResolveCommentMutation();
  const reopenCommentMutation = useReopenCommentMutation();

  const [selectedPageId, setSelectedPageId] = useState("");
  const [showAnnotations, setShowAnnotations] = useState(true);
  const [zoom, setZoom] = useState(1);

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
        <EmptyState title="Loading chapter" />
      </div>
    );
  }

  if (!chapter || !series) {
    return (
      <div className="p-10">
        <EmptyState title="Chapter not found" />
      </div>
    );
  }

  const isTantouReview = chapter.status === "TANTOU_REVIEW";
  const canApprove = isTantouReview && blockingCount === 0;
  const canRevise = isTantouReview;
  const canVerifyBlockingComments = user?.role === "editor" && series.editorId === user.id;
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
      toast.error("Only the assigned Tantou can verify comments.");
      return;
    }
    resolveCommentMutation.mutate(commentVariables(comment), {
      onSuccess: () => toast.success("Comment verified as RESOLVED."),
      onError: (error) => toast.error(mapApiError(error)),
    });
  }

  function reopenComment(comment: (typeof comments)[number]) {
    if (!canVerifyBlockingComments) {
      toast.error("Only the assigned Tantou can reopen comments.");
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
          toast.success(action === "EDITOR_APPROVE" ? "Chapter approved." : "Revision requested."),
        onError: () => toast.error("Failed to update chapter."),
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

  return (
    <div className="-mx-6 -my-6 flex h-[calc(100vh-3.5rem)] flex-col bg-background lg:-mx-10 lg:-my-10">
      <header className="flex items-center gap-3 border-b border-border bg-card/60 px-4 py-2.5">
        <Link
          to="/app/editor/review"
          className="inline-flex items-center gap-1 text-xs font-medium text-[var(--admin-faint)] hover:text-[var(--admin-ink)]"
        >
          <ArrowLeft className="size-3.5" /> Review Queue
        </Link>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)_360px]">
        <aside className="hidden min-h-0 flex-col border-r border-border bg-card/40 lg:flex">
          <ReviewPagesSidebar
            pages={pages}
            commentsByPage={commentsByPage}
            selectedPageId={activePageId}
            onSelectPage={setSelectedPageId}
          />
        </aside>

        <main className="flex min-h-0 flex-col px-3 pt-3">
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
            zoom={zoom}
            onZoom={setZoom}
            onPrev={() => pages[activeIndex - 1] && setSelectedPageId(pages[activeIndex - 1].id)}
            onNext={() => pages[activeIndex + 1] && setSelectedPageId(pages[activeIndex + 1].id)}
          />
        </main>

        <aside className="hidden min-h-0 flex-col border-l border-border bg-card/40 lg:flex">
          <ReviewSummaryPanel
            stats={chapterStats}
            readiness={readiness}
            page={activePage}
            tasks={tasks}
            pageComments={pageComments}
            chapterReviews={chapterReviews}
            regionLabel={(regionId) => (regionId ? regionLabelMap.get(regionId) : undefined)}
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
      </div>

      <footer className="border-t border-border bg-card/60 px-4 py-3">
        <ChapterReviewTimeline chapter={chapter} />
      </footer>
    </div>
  );
}
