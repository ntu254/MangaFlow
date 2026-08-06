import { useState } from "react";
import { toast } from "sonner";
import {
  CheckCircle2,
  Clock,
  FileStack,
  Image as ImageIcon,
  Sparkles,
  User,
  XCircle,
} from "lucide-react";
import {
  usePageAssignmentInboxQuery,
  usePageAssignmentActionMutation,
} from "@/features/series/api/series-queries";
import { timeAgo } from "@/shared/lib/format-date";

export function PageAssignmentsPanel() {
  const { data: assignments = [], isLoading } = usePageAssignmentInboxQuery();
  const actionMutation = usePageAssignmentActionMutation();
  const [processingPageId, setProcessingPageId] = useState<string | null>(null);
  const [rejectingPageId, setRejectingPageId] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border/80 bg-card/60 p-5 shadow-2xs backdrop-blur-xs space-y-3">
        <div className="flex items-center gap-2">
          <div className="grid size-8 place-items-center rounded-xl bg-primary/10 text-primary">
            <FileStack className="size-4" />
          </div>
          <div className="h-4 w-32 rounded bg-muted/40 animate-pulse" />
        </div>
        <div className="h-20 rounded-xl bg-muted/30 animate-pulse" />
      </div>
    );
  }

  if (assignments.length === 0) return null;

  const handleAccept = async (pageId: string, chapterId: string, seriesId: string) => {
    setProcessingPageId(pageId);
    try {
      await actionMutation.mutateAsync({ pageId, action: "ACCEPT", chapterId, seriesId });
      toast.success("Page accepted.", {
        description: "All open tasks on this page are now unlocked.",
      });
    } catch (err: any) {
      toast.error(err?.message || err?.data?.message || "Failed to accept page assignment.");
    } finally {
      setProcessingPageId(null);
    }
  };

  const handleReject = async (pageId: string, chapterId: string, seriesId: string) => {
    if (!reason.trim()) {
      toast.error("A rejection reason is required.");
      return;
    }
    setProcessingPageId(pageId);
    try {
      await actionMutation.mutateAsync({
        pageId,
        action: "REJECT",
        reason: reason.trim(),
        chapterId,
        seriesId,
      });
      toast.info("Page assignment rejected.");
      setRejectingPageId(null);
      setReason("");
    } catch (err: any) {
      toast.error(err?.message || err?.data?.message || "Failed to reject page assignment.");
    } finally {
      setProcessingPageId(null);
    }
  };

  return (
    <div className="rounded-2xl border border-primary/30 bg-primary/[0.03] p-5 shadow-2xs backdrop-blur-xs space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary">
            <FileStack className="size-4.5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-foreground">Page Assignments</h2>
            <p className="text-[10px] text-muted-foreground">
              {assignments.length} pending page{assignments.length > 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <span className="rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-xs font-bold text-primary tabular-nums animate-pulse">
          {assignments.length} New
        </span>
      </div>

      <div className="space-y-3">
        {assignments.map((assignment) => {
          const isProcessing = processingPageId === assignment.pageId;
          const isRejecting = rejectingPageId === assignment.pageId;

          return (
            <div
              key={assignment.pageId}
              className="rounded-xl border border-border/80 bg-card p-4 shadow-2xs space-y-3 transition-all hover:border-primary/40"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="grid size-10 place-items-center rounded-xl bg-indigo-500/10 text-indigo-500 shrink-0">
                    <ImageIcon className="size-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-serif font-bold text-sm text-foreground truncate">
                      {assignment.seriesTitle || `Series ${assignment.seriesId}`}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Ch. {assignment.chapterNumber}
                      {assignment.chapterTitle ? ` · ${assignment.chapterTitle}` : ""} · Page{" "}
                      {assignment.pageNumber} · {timeAgo(assignment.assignedAt)}
                    </p>
                  </div>
                </div>

                <span className="rounded-full bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 text-[10px] font-bold text-amber-500 shrink-0">
                  <Clock className="inline size-3 mr-0.5 -mt-0.5" />
                  Pending
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-lg bg-muted/60 border border-border/60 px-2.5 py-1 text-[10px] font-bold text-foreground">
                  <User className="size-3 text-muted-foreground" />
                  Mangaka: {assignment.mangakaName || assignment.mangakaId}
                </span>
                <span className="inline-flex items-center gap-1 rounded-lg bg-muted/60 border border-border/60 px-2.5 py-1 text-[10px] font-bold text-foreground">
                  <FileStack className="size-3 text-muted-foreground" />
                  {assignment.openTaskCount} open task{assignment.openTaskCount === 1 ? "" : "s"}
                </span>
              </div>

              {isRejecting ? (
                <div className="space-y-2 pt-1 border-t border-border/60">
                  <textarea
                    autoFocus
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Reason for rejecting this page..."
                    className="w-full min-h-16 rounded-lg border border-border/80 bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
                  />
                  <div className="flex items-center justify-end gap-2.5">
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() => {
                        setRejectingPageId(null);
                        setReason("");
                      }}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-border/80 bg-background px-4 py-2 text-xs font-bold text-muted-foreground transition-all hover:bg-muted hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() =>
                        handleReject(assignment.pageId, assignment.chapterId, assignment.seriesId)
                      }
                      className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white transition-all hover:opacity-90 shadow-xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {isProcessing ? (
                        <>
                          <Sparkles className="size-3.5 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <XCircle className="size-3.5" />
                          Confirm Reject
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-end gap-2.5 pt-1 border-t border-border/60">
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => {
                      setRejectingPageId(assignment.pageId);
                      setReason("");
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-border/80 bg-background px-4 py-2 text-xs font-bold text-muted-foreground transition-all hover:bg-muted hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <XCircle className="size-3.5" />
                    Reject
                  </button>
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() =>
                      handleAccept(assignment.pageId, assignment.chapterId, assignment.seriesId)
                    }
                    className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2 text-xs font-bold text-primary-foreground transition-all hover:opacity-90 shadow-xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isProcessing ? (
                      <>
                        <Sparkles className="size-3.5 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="size-3.5" />
                        Accept Page
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
