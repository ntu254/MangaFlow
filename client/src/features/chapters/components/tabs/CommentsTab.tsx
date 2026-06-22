import { useState, useMemo } from "react";
import { toast } from "sonner";
import type { Task } from "@/entities";
import type { ChapterPerms } from "../../lib/chapterPermissions";
import { useRole } from "@/shared/lib/role";
import {
  useTaskComments,
  useCreateComment,
  useMarkCommentFixed,
  useVerifyCommentFixed,
  useResolveComment,
  useReopenComment,
} from "@/shared/queries/useComments";
import { Loader2, MessageSquare, Send, CheckCircle2, RefreshCw, Eye, AlertCircle } from "lucide-react";
import type { CommentVisibility } from "@/shared/api/comments";

export function CommentsTab({
  tasks,
  perms,
  seriesId,
  chapterId,
}: {
  tasks: Task[];
  perms: ChapterPerms;
  seriesId: string;
  chapterId: string;
}) {
  const { role } = useRole();
  const [selectedTaskId, setSelectedTaskId] = useState<string>("");
  const [text, setText] = useState("");
  const [isBlocking, setIsBlocking] = useState(true);
  const [visibility, setVisibility] = useState<CommentVisibility>("PUBLIC_TO_ASSISTANT");

  // Filter tasks to only those with matching selected taskId
  const activeTaskId = selectedTaskId || tasks[0]?.id || "";

  const { data: comments = [], isLoading: isCommentsLoading, refetch } = useTaskComments(activeTaskId);

  const createComment = useCreateComment({ taskId: activeTaskId });
  const markFixed = useMarkCommentFixed(activeTaskId);
  const verifyFixed = useVerifyCommentFixed(activeTaskId);
  const resolve = useResolveComment(activeTaskId);
  const reopen = useReopenComment(activeTaskId);

  const activeTask = useMemo(() => tasks.find((t) => t.id === activeTaskId), [tasks, activeTaskId]);

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !activeTaskId) return;

    createComment.mutate(
      {
        seriesId,
        chapterId,
        taskId: activeTaskId,
        body: text.trim(),
        isBlocking,
        visibility,
      },
      {
        onSuccess: () => {
          toast.success("Comment posted.");
          setText("");
        },
      }
    );
  };

  if (tasks.length === 0) {
    return (
      <div className="rounded border border-dashed border-foreground/15 p-6 text-center text-[12px] text-foreground/55">
        No tasks created yet for this chapter. Create tasks first to discuss.
      </div>
    );
  }

  // Determine allowed visibilities based on user role
  const visibilitiesList: { value: CommentVisibility; label: string }[] = [
    { value: "PUBLIC_TO_ASSISTANT", label: "Public (Assistant can view)" },
  ];

  if (role === "editor" || role === "admin") {
    visibilitiesList.push(
      { value: "MANGAKA_EDITOR_ONLY", label: "Mangaka & Editor Only" },
      { value: "EDITOR_INTERNAL", label: "Editor Internal (Private)" }
    );
  } else if (role === "mangaka") {
    visibilitiesList.push({ value: "MANGAKA_EDITOR_ONLY", label: "Mangaka & Editor Only" });
  }

  return (
    <div className="space-y-4">
      {/* Task Selector */}
      <div className="flex flex-col gap-1 shrink-0">
        <label className="text-[10px] font-bold uppercase tracking-wider text-foreground/55">
          Select Task Thread
        </label>
        <select
          value={activeTaskId}
          onChange={(e) => {
            setSelectedTaskId(e.target.value);
            // Reset visibility default based on role limits when changing thread
            setVisibility("PUBLIC_TO_ASSISTANT");
          }}
          className="h-9 w-full rounded-md border border-foreground/15 bg-background px-3 text-[12px] focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        >
          {tasks.map((t) => (
            <option key={t.id} value={t.id}>
              {t.title || `${t.type} (${t.pageRange})`}
            </option>
          ))}
        </select>
      </div>

      {activeTask && (
        <div className="rounded-md border border-foreground/10 bg-foreground/[0.015] p-3 text-[12px] flex items-center justify-between">
          <div>
            <div className="font-semibold">{activeTask.title}</div>
            <div className="text-[10px] text-foreground/45 mt-0.5 uppercase tracking-wide">
              {activeTask.type} &bull; {activeTask.pageRange} &bull; {activeTask.assigneeName}
            </div>
          </div>
          <button
            onClick={() => refetch()}
            className="p-1 rounded hover:bg-foreground/5 text-foreground/50 transition-colors"
            title="Refresh comments"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-3 min-h-[150px] max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
        {isCommentsLoading ? (
          <div className="flex h-32 items-center justify-center text-foreground/40 text-[11px]">
            <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading comments...
          </div>
        ) : comments.length === 0 ? (
          <div className="py-8 text-center text-[12px] text-foreground/40 italic">
            No comments on this task yet.
          </div>
        ) : (
          comments.map((comment) => {
            const author = typeof comment.authorId === "object" ? comment.authorId : null;
            const authorName = author?.name || "User";
            const authorRole = author?.role || "Team";
            const dateStr = new Date(comment.createdAt).toLocaleString();

            const isUnresolvedBlocking = comment.isBlocking && comment.status !== "RESOLVED";

            return (
              <div
                key={comment.id}
                className={`rounded-lg border p-3 text-[12px] space-y-2 transition-all ${
                  isUnresolvedBlocking
                    ? "border-amber-500/30 bg-amber-500/[0.02]"
                    : "border-foreground/10 bg-card"
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-bold text-foreground">{authorName}</span>
                    <span className="ml-1.5 rounded bg-foreground/5 border border-foreground/10 px-1 py-0.5 text-[8px] uppercase font-black text-foreground/50">
                      {authorRole}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-foreground/40">
                    <span>{dateStr}</span>
                    {comment.visibility !== "PUBLIC_TO_ASSISTANT" && (
                      <span
                        className="flex items-center gap-0.5 text-indigo-500 dark:text-indigo-400 font-medium"
                        title={`Visibility: ${comment.visibility}`}
                      >
                        <Eye className="h-3 w-3" />
                        {comment.visibility === "EDITOR_INTERNAL" ? "Internal" : "Staff"}
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-foreground/80 leading-relaxed break-words">{comment.body}</p>

                {/* Comment Status & Actions */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-foreground/5 pt-2 mt-2">
                  <div className="flex items-center gap-1 text-[10px] font-bold text-foreground/50">
                    {comment.isBlocking && (
                      <span className="inline-flex items-center gap-0.5 text-amber-600 bg-amber-500/10 px-1 rounded uppercase tracking-wider text-[9px]">
                        <AlertCircle className="h-2.5 w-2.5" /> Blocking
                      </span>
                    )}
                    <span className="uppercase text-[9px] bg-foreground/10 px-1 rounded">
                      {comment.status}
                    </span>
                  </div>

                  <div className="flex gap-1">
                    {/* Action: mark comment fixed (Assistant) */}
                    {comment.status === "OPEN" && role === "assistant" && (
                      <button
                        onClick={() => markFixed.mutate(comment.id)}
                        disabled={markFixed.isPending}
                        className="rounded bg-sky-500/10 hover:bg-sky-500/20 px-2 py-0.5 text-[10px] font-bold text-sky-600 dark:text-sky-400"
                      >
                        Mark Fixed
                      </button>
                    )}

                    {/* Action: verify fixed (Mangaka) */}
                    {comment.status === "FIXED" && role === "mangaka" && (
                      <button
                        onClick={() => verifyFixed.mutate(comment.id)}
                        disabled={verifyFixed.isPending}
                        className="rounded bg-blue-500/10 hover:bg-blue-500/20 px-2 py-0.5 text-[10px] font-bold text-blue-600 dark:text-blue-400"
                      >
                        Verify Fix
                      </button>
                    )}

                    {/* Action: resolve comment (Editor / Admin) */}
                    {["OPEN", "FIXED", "VERIFIED", "REOPENED"].includes(comment.status) &&
                      (role === "editor" || role === "admin") && (
                        <button
                          onClick={() => resolve.mutate(comment.id)}
                          disabled={resolve.isPending}
                          className="rounded bg-emerald-500/10 hover:bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5"
                        >
                          <CheckCircle2 className="h-3 w-3" /> Resolve
                        </button>
                      )}

                    {/* Action: reopen comment (Mangaka / Editor / Admin) */}
                    {comment.status === "RESOLVED" &&
                      (role === "mangaka" || role === "editor" || role === "admin") && (
                        <button
                          onClick={() => reopen.mutate(comment.id)}
                          disabled={reopen.isPending}
                          className="rounded bg-amber-500/10 hover:bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400"
                        >
                          Reopen
                        </button>
                      )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Comment Form */}
      {perms.canComposeComment && (
        <form onSubmit={handlePostComment} className="border-t border-foreground/10 pt-3 space-y-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Write a comment on this task thread…"
            rows={2}
            className="w-full rounded-md border border-foreground/15 bg-background p-2.5 text-[12px] focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-foreground/45"
            disabled={createComment.isPending}
          />
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Visibility & Blocking settings */}
            <div className="flex items-center gap-4 text-[11px] text-foreground/75">
              <label className="flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isBlocking}
                  onChange={(e) => setIsBlocking(e.target.checked)}
                  className="rounded border-foreground/20 text-primary focus:ring-primary h-3.5 w-3.5"
                />
                Blocking Task
              </label>

              {visibilitiesList.length > 1 && (
                <div className="flex items-center gap-1.5">
                  <span className="text-foreground/45 font-semibold">Visibility:</span>
                  <select
                    value={visibility}
                    onChange={(e) => setVisibility(e.target.value as CommentVisibility)}
                    className="h-6 rounded border border-foreground/15 bg-background px-1.5 text-[10px] focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    {visibilitiesList.map((v) => (
                      <option key={v.value} value={v.value}>
                        {v.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={!text.trim() || createComment.isPending}
              className="inline-flex h-8 items-center gap-1 rounded-md bg-primary px-3 text-[12px] font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-40 select-none shadow-sm transition-all"
            >
              {createComment.isPending ? (
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
              ) : (
                <Send className="h-3 w-3 mr-1" />
              )}
              Post
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
