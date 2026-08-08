import { useState, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  FileStack,
  Filter,
  Image as ImageIcon,
  Layers,
  Loader2,
  Search,
  Sparkles,
  User,
  XCircle,
} from "lucide-react";
import {
  usePageAssignmentInboxQuery,
  usePageAssignmentActionMutation,
} from "@/features/series/api/series-queries";
import { timeAgo } from "@/shared/lib/format-date";

export function AssistantAssignmentsPage() {
  const { data: assignments = [], isLoading, isError, error } = usePageAssignmentInboxQuery();
  const actionMutation = usePageAssignmentActionMutation();

  const [searchQuery, setSearchQuery] = useState("");
  const [processingPageId, setProcessingPageId] = useState<string | null>(null);
  const [rejectingPageId, setRejectingPageId] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  const filteredAssignments = useMemo(() => {
    if (!searchQuery.trim()) return assignments;
    const q = searchQuery.toLowerCase();
    return assignments.filter(
      (a) =>
        a.seriesTitle?.toLowerCase().includes(q) ||
        a.chapterTitle?.toLowerCase().includes(q) ||
        a.mangakaName?.toLowerCase().includes(q) ||
        `ch.${a.chapterNumber}`.includes(q) ||
        `page ${a.pageNumber}`.includes(q),
    );
  }, [assignments, searchQuery]);

  const totalOpenTasks = useMemo(() => {
    return assignments.reduce((acc, curr) => acc + (curr.openTaskCount || 0), 0);
  }, [assignments]);

  const handleAccept = async (pageId: string, chapterId: string, seriesId: string) => {
    setProcessingPageId(pageId);
    try {
      await actionMutation.mutateAsync({ pageId, action: "ACCEPT", chapterId, seriesId });
      toast.success("Page assignment accepted!", {
        description: "Tasks on this page are now unlocked in your workbench.",
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

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mx-auto max-w-4xl p-6 text-center text-xs text-destructive">
        <p className="font-bold text-sm">Unable to load page assignments.</p>
        <p className="mt-1 text-muted-foreground">
          {error instanceof Error ? error.message : "Backend connection error."}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 border-b border-border/60 pb-5 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <Link
              to="/app/assistant/dashboard"
              className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
            >
              <ArrowLeft className="size-3.5" /> Dashboard
            </Link>
            <span>/</span>
            <span className="text-foreground font-semibold">Page Assignments</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground font-serif flex items-center gap-2.5">
            <FileStack className="size-6 text-primary" />
            Page Assignments Management
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Review and accept page drawing invitations assigned by Mangakas. Accepting unlocks assigned tasks in your workbench.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/app/assistant/tasks"
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-xs hover:opacity-95 transition-all"
          >
            Go to My Tasks <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border/80 bg-card p-4 shadow-2xs flex items-center gap-3.5">
          <div className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary shrink-0">
            <FileStack className="size-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Pending Invitations
            </p>
            <p className="text-2xl font-bold text-foreground mt-0.5">{assignments.length}</p>
          </div>
        </div>

        <div className="rounded-xl border border-border/80 bg-card p-4 shadow-2xs flex items-center gap-3.5">
          <div className="grid size-11 place-items-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
            <Clock className="size-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Requires Action
            </p>
            <p className="text-2xl font-bold text-foreground mt-0.5">
              {assignments.length > 0 ? `${assignments.length} Pages` : "Clean"}
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-border/80 bg-card p-4 shadow-2xs flex items-center gap-3.5">
          <div className="grid size-11 place-items-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shrink-0">
            <Layers className="size-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Associated Tasks
            </p>
            <p className="text-2xl font-bold text-foreground mt-0.5">{totalOpenTasks} Tasks</p>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card border border-border/80 p-3 rounded-xl shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search series, chapter, mangaka..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-border/60 bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto text-xs text-muted-foreground">
          <Filter className="size-3.5" />
          <span>Showing {filteredAssignments.length} of {assignments.length} pending items</span>
        </div>
      </div>

      {/* Assignments List */}
      {filteredAssignments.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/80 bg-card/40 p-12 text-center">
          <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-muted/60 text-muted-foreground mb-3">
            <CheckCircle2 className="size-6 text-emerald-500" />
          </div>
          <h3 className="text-base font-bold text-foreground">No Pending Assignments</h3>
          <p className="mt-1 text-xs text-muted-foreground max-w-md mx-auto">
            {searchQuery
              ? "No page assignments match your search query."
              : "You have responded to all page assignment invitations. New page assignments from Mangakas will appear here."}
          </p>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="mt-4 text-xs font-semibold text-primary hover:underline"
            >
              Clear Search Query
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredAssignments.map((assignment) => {
            const isProcessing = processingPageId === assignment.pageId;
            const isRejecting = rejectingPageId === assignment.pageId;

            return (
              <div
                key={assignment.pageId}
                className="rounded-2xl border border-border/80 bg-card p-5 shadow-2xs space-y-4 transition-all hover:border-primary/40 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="grid size-11 place-items-center rounded-xl bg-indigo-500/10 text-indigo-500 shrink-0">
                        <ImageIcon className="size-5.5" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-serif font-bold text-base text-foreground truncate">
                          {assignment.seriesTitle || `Series ${assignment.seriesId}`}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Ch. {assignment.chapterNumber}
                          {assignment.chapterTitle ? ` · ${assignment.chapterTitle}` : ""}
                          <span className="font-bold text-foreground"> · Page {assignment.pageNumber}</span>
                        </p>
                      </div>
                    </div>

                    <span className="rounded-full bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400 shrink-0">
                      <Clock className="inline size-3 mr-1 -mt-0.5" />
                      Pending
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-muted/60 border border-border/60 px-2.5 py-1 text-xs font-semibold text-foreground">
                      <User className="size-3.5 text-muted-foreground" />
                      Mangaka: {assignment.mangakaName || assignment.mangakaId}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 border border-primary/20 px-2.5 py-1 text-xs font-semibold text-primary">
                      <Layers className="size-3.5" />
                      {assignment.openTaskCount} open drawing task{assignment.openTaskCount === 1 ? "" : "s"}
                    </span>
                    <span className="text-[11px] text-muted-foreground ml-auto">
                      Assigned {timeAgo(assignment.assignedAt)}
                    </span>
                  </div>
                </div>

                {isRejecting ? (
                  <div className="space-y-3 pt-3 border-t border-border/60">
                    <textarea
                      autoFocus
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Please enter a reason for declining this page assignment..."
                      className="w-full min-h-20 rounded-xl border border-border/80 bg-background p-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
                    />
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        disabled={isProcessing}
                        onClick={() => {
                          setRejectingPageId(null);
                          setReason("");
                        }}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-border/80 bg-background px-4 py-2 text-xs font-bold text-muted-foreground transition-all hover:bg-muted hover:text-foreground disabled:opacity-50 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={isProcessing}
                        onClick={() =>
                          handleReject(assignment.pageId, assignment.chapterId, assignment.seriesId)
                        }
                        className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white transition-all hover:opacity-90 shadow-xs disabled:opacity-50 cursor-pointer"
                      >
                        {isProcessing ? (
                          <>
                            <Sparkles className="size-3.5 animate-spin" />
                            Rejecting...
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
                  <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border/60">
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() => {
                        setRejectingPageId(assignment.pageId);
                        setReason("");
                      }}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-border/80 bg-background px-4 py-2 text-xs font-bold text-muted-foreground transition-all hover:bg-muted hover:text-foreground disabled:opacity-50 cursor-pointer"
                    >
                      <XCircle className="size-3.5" />
                      Decline
                    </button>
                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() =>
                        handleAccept(assignment.pageId, assignment.chapterId, assignment.seriesId)
                      }
                      className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2 text-xs font-bold text-primary-foreground transition-all hover:opacity-90 shadow-xs disabled:opacity-50 cursor-pointer"
                    >
                      {isProcessing ? (
                        <>
                          <Sparkles className="size-3.5 animate-spin" />
                          Accepting...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="size-3.5" />
                          Accept Assignment
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
