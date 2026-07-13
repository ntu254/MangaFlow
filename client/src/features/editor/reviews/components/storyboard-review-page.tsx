import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/shared/auth";
import {
  useChapterActionMutation,
  useChapterQuery,
  useCommentsQuery,
  useCreateCommentMutation,
  useSeriesDetailQuery,
} from "@/entities/series";
import { formatDateTime } from "@/shared/lib/format-date";
import { EmptyState } from "@/shared/ui/empty-state";
import { DecisionActions } from "@/shared/ui/decision-actions";
import { ReviewStatusPill } from "@/entities/submission";

const COMMENT_TYPES = [
  "Pacing",
  "Dialogue",
  "Panel layout",
  "Character motivation",
  "Scene transition",
  "Art direction",
  "Blocking",
] as const;

export function StoryboardReviewPage() {
  const { storyboardId } = useParams({ from: "/app/editor/storyboards/$storyboardId/review" });
  const user = useAuth((s) => s.user);
  const { data: chapter, isLoading } = useChapterQuery(storyboardId);
  const { data: series } = useSeriesDetailQuery(chapter?.seriesId ?? "");
  const chapterAction = useChapterActionMutation(storyboardId, chapter?.seriesId);
  const { data: comments = [] } = useCommentsQuery({ chapterId: storyboardId });
  const createCommentMutation = useCreateCommentMutation();
  const pages = useMemo(() => chapter?.pages ?? [], [chapter?.pages]);

  const [activePageId, setActivePageId] = useState("");
  const [commentType, setCommentType] = useState<(typeof COMMENT_TYPES)[number]>("Pacing");
  const [commentText, setCommentText] = useState("");
  const [blocking, setBlocking] = useState(false);

  useEffect(() => {
    if (!activePageId && pages[0]?.id) setActivePageId(pages[0].id);
  }, [activePageId, pages]);

  const pageComments = useMemo(
    () => comments.filter((c) => c.pageId === activePageId),
    [comments, activePageId],
  );

  if (isLoading) {
    return (
      <div className="p-10">
        <EmptyState title="Loading storyboard" />
      </div>
    );
  }

  if (!chapter || !series) {
    return (
      <div className="p-10">
        <EmptyState title="Storyboard not found" />
      </div>
    );
  }

  const submit = () => {
    if (!user || !commentText.trim()) return;
    createCommentMutation.mutate({
      chapterId: chapter.id,
      pageId: activePageId || "",
      text: `[${commentType}] ${commentText.trim()}`,
      blocking,
    });
    setCommentText("");
    setBlocking(false);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-4 p-6">
      <Link
        to="/app/editor/review"
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3" /> Review Queue
      </Link>

      <header className="rounded-md border border-border bg-card p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Storyboard review
            </p>
            <h1 className="mt-1 font-serif text-2xl">
              {series.title} - Ch.{chapter.number} {chapter.title}
            </h1>
          </div>
          <ReviewStatusPill status={chapter.status} />
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-[180px_1fr_320px]">
        <aside className="space-y-1.5 rounded-md border border-border bg-card p-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Pages
          </p>
          {pages.length === 0 ? (
            <p className="text-xs text-muted-foreground">No pages yet</p>
          ) : (
            pages.map((p) => {
              const cnt = comments.filter((c) => c.pageId === p.id).length;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setActivePageId(p.id)}
                  className={`flex w-full items-center justify-between rounded px-2 py-1.5 text-xs ${
                    activePageId === p.id ? "bg-foreground text-background" : "hover:bg-muted"
                  }`}
                >
                  <span>Page {String(p.index).padStart(2, "0")}</span>
                  {cnt > 0 ? <span className="text-[10px]">{cnt}</span> : null}
                </button>
              );
            })
          )}
        </aside>

        <section className="flex min-h-[400px] items-center justify-center rounded-md border border-border bg-muted/30">
          <div className="text-center text-sm text-muted-foreground">
            <p className="font-serif text-lg">Storyboard preview</p>
            <p className="mt-1 text-xs">
              Page {pages.find((p) => p.id === activePageId)?.index ?? "—"}
            </p>
          </div>
        </section>

        <aside className="space-y-3 rounded-md border border-border bg-card p-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Comments
          </p>
          <div className="space-y-2">
            <select
              value={commentType}
              onChange={(e) => setCommentType(e.target.value as (typeof COMMENT_TYPES)[number])}
              className="w-full rounded border border-border bg-background px-2 py-1 text-xs"
            >
              {COMMENT_TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              rows={3}
              placeholder="Add feedback..."
              className="w-full rounded border border-border bg-background p-2 text-xs"
            />
            <label className="flex items-center gap-1.5 text-[11px]">
              <input
                type="checkbox"
                checked={blocking}
                onChange={(e) => setBlocking(e.target.checked)}
              />
              Mark blocking
            </label>
            <button
              type="button"
              onClick={submit}
              disabled={createCommentMutation.isPending || !commentText.trim()}
              className="w-full rounded bg-foreground px-2 py-1.5 text-xs font-semibold text-background hover:opacity-90 disabled:opacity-40"
            >
              Add comment
            </button>
          </div>

          <ul className="space-y-1.5 border-t border-border pt-2">
            {pageComments.length === 0 ? (
              <p className="text-xs text-muted-foreground">No comments yet</p>
            ) : (
              pageComments.map((c) => (
                <li
                  key={c.id}
                  className={`rounded border p-2 text-[11px] ${
                    c.blocking
                      ? "border-rose-300 bg-rose-50 text-rose-900"
                      : "border-border bg-background"
                  }`}
                >
                  <p className="font-semibold">{c.authorName}</p>
                  <p>{c.text}</p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">
                    {formatDateTime(c.createdAt)}
                  </p>
                </li>
              ))
            )}
          </ul>

          <div className="border-t border-border pt-3">
            <DecisionActions
              actions={[
                {
                  key: "approve",
                  label: "Approve",
                  variant: "primary",
                  supported: chapter.status === "EDITOR_REVIEW",
                  onAct: () => user && chapterAction.mutate({ action: "EDITOR_APPROVE" }),
                },
                {
                  key: "revise",
                  label: "Request Revision",
                  variant: "warn",
                  requiresReason: true,
                  supported: chapter.status === "EDITOR_REVIEW",
                  onAct: (reason?: string) =>
                    user &&
                    chapterAction.mutate({
                      action: "REQUEST_REVISION",
                      payload: { comment: reason },
                    }),
                },
                {
                  key: "reject",
                  label: "Reject",
                  variant: "danger",
                  requiresReason: true,
                  supported: false,
                },
              ]}
            />
          </div>
        </aside>
      </div>
    </div>
  );
}
