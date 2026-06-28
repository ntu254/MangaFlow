import { useEffect, useState } from "react";
import {
  Sparkles,
  Layers,
  Brain,
  MessageSquare,
  X,
  Check,
  ChevronLeft,
  ChevronRight,
  Info,
  Calendar,
  User,
  AlertCircle,
  Plus,
  Trash2,
  Loader2,
  Eraser,
} from "lucide-react";
import type { Region, AIResult, Task } from "@/entities";
import { useStudioStore } from "./useStudioStore";
import { staff, findStaff } from "@/entities";
import { toast } from "sonner";
import { useRole } from "@/shared/lib/role";
import {
  useAcceptAISuggestion,
  useRejectAISuggestion,
  useRunAISegmentation,
  useRunAITextWhitening,
  usePageStudio,
} from "@/shared/queries/usePageStudio";
import { useDeleteRegion } from "@/shared/queries/useRegions";
import {
  useTaskComments,
  useCreateComment,
  useMarkCommentFixed,
  useVerifyCommentFixed,
  useResolveComment,
  useReopenComment,
} from "@/shared/queries/useComments";
import type { CommentVisibility } from "@/shared/api/comments";
import { AssistantTaskWorkPanel } from "./AssistantTaskWorkPanel";

interface Props {
  regions: Region[];
  results?: AIResult[];
  pageId: string;
  readOnly?: boolean;
  assistantTask?: Task;
  originalFileAssetId?: string;
  workingFileAssetId?: string;
}

const STATUS_COLOR: Record<string, string> = {
  created: "text-violet-400 bg-violet-400/10 border-violet-400/20",
  "ai-suggested": "text-sky-400 bg-sky-400/10 border-sky-400/20",
  accepted: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  rejected: "text-zinc-500 bg-zinc-500/10 border-zinc-500/20",
  "linked-to-task": "text-amber-400 bg-amber-400/10 border-amber-400/20",
};

function getSuggestionPayload(region?: Region) {
  if (!region) return null;
  if (region.aiResultId && typeof region.aiSuggestionIndex === "number") {
    return {
      aiResultId: region.aiResultId,
      suggestionIndex: region.aiSuggestionIndex,
    };
  }

  const match = region.id.match(/^(.+):suggestion:(\d+)$/);
  if (!match) return null;
  return {
    aiResultId: match[1],
    suggestionIndex: Number(match[2]),
  };
}

export function InspectorDrawer({
  regions,
  results = [],
  pageId,
  readOnly = false,
  assistantTask,
  originalFileAssetId,
  workingFileAssetId,
}: Props) {
  const {
    selectedRegionId,
    setSelectedRegionId,
    activeTab,
    setActiveTab,
    isInspectorCollapsed,
    setInspectorCollapsed,
    regionTasks,
  } = useStudioStore();

  const selectedRegion = regions.find((r) => r.id === selectedRegionId);

  // useDeleteRegion hook
  const { mutate: deleteRegion, isPending: isDeleting } = useDeleteRegion(pageId);
  const { mutate: detectBubbles, isPending: isDetectingBubbles } = useRunAISegmentation(pageId);
  const { mutate: whitenText, isPending: isWhiteningText } = useRunAITextWhitening(pageId);
  const { mutate: acceptSuggestion, isPending: isAcceptingSuggestion } =
    useAcceptAISuggestion(pageId);
  const { mutate: rejectSuggestion, isPending: isRejectingSuggestion } =
    useRejectAISuggestion(pageId);

  const hasActiveTask = selectedRegion ? !!regionTasks[selectedRegion.id] : false;
  const isAISuggestion =
    selectedRegion?.status === "ai-suggested" || selectedRegion?.id.includes(":suggestion:");
  const isSuggestionMutationPending = isAcceptingSuggestion || isRejectingSuggestion;

  const getSelectedSuggestionPayload = () => {
    return getSuggestionPayload(selectedRegion);
  };

  const handleAcceptSuggestion = () => {
    const payload = getSelectedSuggestionPayload();
    if (!payload) return;
    acceptSuggestion(payload, {
      onSuccess: () => setSelectedRegionId(null),
    });
  };

  const handleRejectSuggestion = () => {
    const payload = getSelectedSuggestionPayload();
    if (!payload) return;
    rejectSuggestion(payload, {
      onSuccess: () => setSelectedRegionId(null),
    });
  };

  const handleDeleteRegion = () => {
    if (!selectedRegion) return;
    if (isAISuggestion) {
      handleRejectSuggestion();
      return;
    }
    deleteRegion(selectedRegion.id, {
      onSuccess: () => setSelectedRegionId(null),
    });
  };

  const { data: studioData } = usePageStudio(pageId);
  const pageTasks = studioData?.tasks ?? [];
  const seriesId = studioData?.chapter?.seriesId;
  const chapterId = studioData?.chapter?.id ?? studioData?.page?.chapterId;

  const { role } = useRole();
  const [selectedTaskId, setSelectedTaskId] = useState<string>("");
  const [isBlocking, setIsBlocking] = useState(true);
  const [visibility, setVisibility] = useState<CommentVisibility>("PUBLIC_TO_ASSISTANT");
  const [newComment, setNewComment] = useState("");

  const selectedRegionTask = selectedRegion ? regionTasks[selectedRegion.id] : undefined;
  const activeTaskId = selectedTaskId || assistantTask?.id || selectedRegionTask?.taskId || pageTasks[0]?.id || "";

  useEffect(() => {
    if (assistantTask?.id) {
      setSelectedTaskId(assistantTask.id);
    } else if (selectedRegionTask?.taskId) {
      setSelectedTaskId(selectedRegionTask.taskId);
    }
  }, [assistantTask?.id, selectedRegionTask?.taskId]);

  const { data: dbComments = [], isLoading: isCommentsLoading } = useTaskComments(activeTaskId);

  const createComment = useCreateComment({ taskId: activeTaskId });
  const markFixed = useMarkCommentFixed(activeTaskId);
  const verifyFixed = useVerifyCommentFixed(activeTaskId);
  const resolve = useResolveComment(activeTaskId);
  const reopen = useReopenComment(activeTaskId);

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !activeTaskId || !seriesId) return;

    createComment.mutate(
      {
        seriesId,
        chapterId,
        pageId,
        regionId: selectedRegion?.id || undefined,
        taskId: activeTaskId,
        body: newComment.trim(),
        isBlocking,
        visibility,
      },
      {
        onSuccess: () => {
          toast.success("Comment posted.");
          setNewComment("");
        },
      }
    );
  };

  const handleTabClick = (tab: typeof activeTab) => {
    if (activeTab === tab && !isInspectorCollapsed) {
      // Toggle collapse if clicking the active tab again
      setInspectorCollapsed(true);
    } else {
      setActiveTab(tab);
      setInspectorCollapsed(false);
    }
  };

  const tabsConfig = [
    { id: "inspect" as const, icon: Info, label: "Inspect" },
    { id: "layers" as const, icon: Layers, label: "Layers" },
    ...(!readOnly ? [{ id: "ai" as const, icon: Brain, label: "AI Tools" }] : []),
    ...(!readOnly ? [{ id: "comments" as const, icon: MessageSquare, label: "Comments" }] : []),
  ];

  useEffect(() => {
    if (readOnly && activeTab !== "inspect" && activeTab !== "layers") {
      setActiveTab("inspect");
    }
  }, [activeTab, readOnly, setActiveTab]);

  return (
    <div className="flex h-full shrink-0 border-l border-border bg-background overflow-hidden select-none transition-all duration-300">
      {/* ── Content Drawer (Left Side of expanded panel, next to canvas) ──────────────── */}
      {!isInspectorCollapsed && (
        <div className="w-72 flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
          {/* Header */}
          <div className="flex h-11 shrink-0 items-center justify-between border-b border-border px-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-foreground/50">
              {tabsConfig.find((t) => t.id === activeTab)?.label}
            </span>
            <button
              onClick={() => setInspectorCollapsed(true)}
              className="flex h-6 w-6 items-center justify-center rounded-md hover:bg-foreground/5 text-foreground/30 hover:text-foreground/60 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* ── TAB: INSPECT ── */}
          {activeTab === "inspect" && (
            <div className="flex-1 overflow-y-auto scrollbar-hide p-4 space-y-4">
              {assistantTask && (
                <AssistantTaskWorkPanel
                  task={assistantTask}
                  pageId={pageId}
                  originalFileAssetId={originalFileAssetId}
                  workingFileAssetId={workingFileAssetId}
                />
              )}
              {selectedRegion ? (
                <div className="space-y-4">
                  {/* Region Properties Card */}
                  <div className="rounded-xl border border-border bg-card p-3.5 space-y-3 shadow-md">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[12px] font-extrabold text-foreground uppercase tracking-wide">
                        {selectedRegion.type}
                      </span>
                      <span
                        className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider ${
                          STATUS_COLOR[selectedRegion.status] ?? ""
                        }`}
                      >
                        {selectedRegion.status}
                      </span>
                    </div>

                    {!readOnly && isAISuggestion && (
                      <div className="grid grid-cols-2 gap-2 border-t border-border pt-3">
                        <button
                          onClick={handleAcceptSuggestion}
                          disabled={isSuggestionMutationPending}
                          className="flex items-center justify-center gap-1 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-2 py-2 text-[10px] font-bold uppercase tracking-wider text-emerald-400 transition-colors hover:bg-emerald-500/15 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isAcceptingSuggestion ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Check className="h-3.5 w-3.5" />
                          )}
                          Accept
                        </button>
                        <button
                          onClick={handleRejectSuggestion}
                          disabled={isSuggestionMutationPending}
                          className="flex items-center justify-center gap-1 rounded-lg border border-rose-500/20 bg-rose-500/10 px-2 py-2 text-[10px] font-bold uppercase tracking-wider text-rose-400 transition-colors hover:bg-rose-500/15 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isRejectingSuggestion ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <X className="h-3.5 w-3.5" />
                          )}
                          Reject
                        </button>
                      </div>
                    )}

                    {!readOnly && (
                      <div className="flex justify-end pt-1 border-t border-border mt-3 group relative">
                        <button
                          onClick={handleDeleteRegion}
                          disabled={
                            isDeleting ||
                            isSuggestionMutationPending ||
                            (!isAISuggestion && hasActiveTask)
                          }
                          className="flex items-center gap-1 text-[10px] font-bold text-rose-500 hover:text-rose-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors uppercase tracking-wider"
                        >
                          {isDeleting || isRejectingSuggestion ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                          {isAISuggestion
                            ? isRejectingSuggestion
                              ? "Removing..."
                              : "Remove Suggestion"
                            : isDeleting
                              ? "Deleting..."
                              : "Delete Region"}
                        </button>
                        {!isAISuggestion && hasActiveTask && (
                          <div className="absolute bottom-full right-0 mb-1 hidden w-48 rounded bg-zinc-800 px-2 py-1 text-center text-[10px] text-white group-hover:block">
                            This region has active tasks. Cancel or finish those tasks before
                            deleting.
                          </div>
                        )}
                      </div>
                    )}

                    {/* Coordinates */}
                    <div className="grid grid-cols-2 gap-2 border-t border-border pt-3 text-[10px] text-foreground/40 font-mono">
                      <div>
                        x:{" "}
                        <span className="text-foreground/70">
                          {selectedRegion.coords.x.toFixed(3)}
                        </span>
                      </div>
                      <div>
                        y:{" "}
                        <span className="text-foreground/70">
                          {selectedRegion.coords.y.toFixed(3)}
                        </span>
                      </div>
                      <div>
                        w:{" "}
                        <span className="text-foreground/70">
                          {selectedRegion.coords.w.toFixed(3)}
                        </span>
                      </div>
                      <div>
                        h:{" "}
                        <span className="text-foreground/70">
                          {selectedRegion.coords.h.toFixed(3)}
                        </span>
                      </div>
                    </div>

                    {/* AI Accept / Reject Actions omitted for basic scope */}
                  </div>

                  {/* Associated Task Card */}
                  <div className="rounded-xl border border-border bg-card p-3.5 space-y-3.5 shadow-md">
                    <div className="text-[10px] font-extrabold uppercase tracking-widest text-foreground/35">
                      Production Task
                    </div>

                    {regionTasks[selectedRegion.id] ? (
                      <div className="space-y-2.5 text-[11px]">
                        <div className="flex items-center gap-2 border-b border-border pb-2 text-foreground/80 font-bold text-xs">
                          <span className="h-2 w-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
                          {regionTasks[selectedRegion.id].taskType}
                        </div>

                        <div className="flex justify-between items-center text-foreground/50">
                          <span className="flex items-center gap-1">
                            <User className="h-3.5 w-3.5" /> Assignee:
                          </span>
                          <span className="font-semibold text-foreground/85">
                            {regionTasks[selectedRegion.id].assigneeName ??
                              findStaff(regionTasks[selectedRegion.id].assigneeId)?.name ??
                              "Assigned assistant"}
                          </span>
                        </div>

                        {regionTasks[selectedRegion.id].status && (
                          <div className="flex justify-between items-center text-foreground/50">
                            <span className="flex items-center gap-1">
                              <Info className="h-3.5 w-3.5" /> Status:
                            </span>
                            <span className="font-semibold capitalize text-foreground/85">
                              {regionTasks[selectedRegion.id].status?.replace(/-/g, " ")}
                            </span>
                          </div>
                        )}

                        <div className="flex justify-between items-center text-foreground/50">
                          <span className="flex items-center gap-1">
                            <AlertCircle className="h-3.5 w-3.5" /> Priority:
                          </span>
                          <span
                            className={`font-semibold capitalize ${
                              regionTasks[selectedRegion.id].priority === "high"
                                ? "text-red-400"
                                : regionTasks[selectedRegion.id].priority === "medium"
                                  ? "text-amber-400"
                                  : "text-blue-400"
                            }`}
                          >
                            {regionTasks[selectedRegion.id].priority}
                          </span>
                        </div>

                        <div className="flex justify-between items-center text-foreground/50">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" /> Due Date:
                          </span>
                          <span className="font-semibold text-foreground/85">
                            {regionTasks[selectedRegion.id].dueDate}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4 space-y-3">
                        <div className="text-foreground/30 text-[11px]">
                          No task assigned to this region yet.
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center text-foreground/30">
                  <Info className="h-8 w-8 text-foreground/10 mb-2" />
                  <p className="text-[11px] font-medium leading-relaxed px-4">
                    {readOnly
                      ? "Select an assigned region overlay to inspect the task scope."
                      : "Select a region overlay on the canvas to inspect details and assign tasks."}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ── TAB: LAYERS ── */}
          {activeTab === "layers" && (
            <div className="flex-1 overflow-y-auto scrollbar-hide p-4 space-y-3">
              <div className="text-[10px] font-bold uppercase tracking-widest text-foreground/30 mb-1">
                Canvas Layers ({regions.length})
              </div>
              <div className="space-y-1">
                {regions.length === 0 && (
                  <div className="py-8 text-center text-[11px] text-foreground/20">
                    No layers yet. Draw with Rect / Bubble tools.
                  </div>
                )}
                {regions.map((r, idx) => {
                  const idxStr = r.id.slice(-2).replace("_", "");
                  const isSelected = r.id === selectedRegionId;
                  const hasTask = !!regionTasks[r.id];
                  return (
                    <button
                      key={r.id}
                      onClick={() => setSelectedRegionId(r.id === selectedRegionId ? null : r.id)}
                      className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left transition-colors border ${
                        isSelected
                          ? "bg-foreground/8 border-border text-foreground ring-1 ring-foreground/10"
                          : "bg-transparent border-transparent text-foreground/60 hover:bg-foreground/[0.03]"
                      }`}
                    >
                      <span className="font-mono text-[11px] font-semibold uppercase flex items-center gap-1.5">
                        <Layers className="h-3 w-3 text-foreground/30" />
                        {r.type} #{idxStr || idx + 1}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {hasTask && <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />}
                        <span
                          className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider ${
                            STATUS_COLOR[r.status] ?? ""
                          }`}
                        >
                          {r.status === "ai-suggested" ? "AI" : r.status}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── TAB: AI ── */}
          {activeTab === "ai" && (
            <div className="flex-1 overflow-y-auto scrollbar-hide p-4 space-y-4">
              <div className="space-y-3">
                <section className="rounded-xl border border-sky-500/20 bg-sky-500/5 p-3">
                  <div className="flex items-start gap-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-500/15 text-sky-300">
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-sky-300">
                        Detect bubbles
                      </div>
                      <p className="mt-1 text-[10px] leading-relaxed text-foreground/45">
                        Find speech bubbles and show AI suggestion boxes on the canvas.
                      </p>
                      <button
                        onClick={() => detectBubbles()}
                        disabled={isDetectingBubbles || isWhiteningText}
                        className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-sky-600 px-3 py-2 text-[11px] font-bold text-white transition-all hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isDetectingBubbles ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Sparkles className="h-3.5 w-3.5" />
                        )}
                        {isDetectingBubbles ? "Detecting..." : "Detect bubbles"}
                      </button>
                    </div>
                  </div>
                </section>

                <section className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
                  <div className="flex items-start gap-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-300">
                      <Eraser className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-300">
                        Whiten text
                      </div>
                      <p className="mt-1 text-[10px] leading-relaxed text-foreground/45">
                        Remove bubble text by generating a whitened working image.
                      </p>
                      <button
                        onClick={() => whitenText()}
                        disabled={isWhiteningText || isDetectingBubbles}
                        className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-[11px] font-bold text-white transition-all hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isWhiteningText ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Eraser className="h-3.5 w-3.5" />
                        )}
                        {isWhiteningText ? "Whitening..." : "Whiten text"}
                      </button>
                    </div>
                  </div>
                </section>
              </div>

              <div className="text-[10px] font-bold uppercase tracking-widest text-foreground/30 mb-1 pt-2">
                Segmentation Runs ({results.length})
              </div>

              <div className="space-y-2">
                {results.length === 0 && (
                  <div className="py-8 text-center text-[11px] text-foreground/20">
                    No AI runs logs yet.
                  </div>
                )}
                {results.map((r) => (
                  <div key={r.id} className="rounded-xl border border-border bg-card p-3">
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-[10px] font-bold uppercase ${
                          r.status === "completed"
                            ? "text-emerald-400"
                            : r.status === "failed"
                              ? "text-rose-400"
                              : "text-amber-400"
                        }`}
                      >
                        {r.status}
                      </span>
                      <span className="text-[9px] text-foreground/30">{r.at}</span>
                    </div>
                    <div className="mt-1.5 text-[10px] text-foreground/40">
                      {r.suggestionsCount} suggestions · {r.acceptedCount} accepted
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── TAB: COMMENTS ── */}
          {activeTab === "comments" && (
            <div className="flex-1 flex flex-col overflow-hidden">
              {pageTasks.length > 0 ? (
                <>
                  {pageTasks.length > 1 && (
                    <div className="px-4 pt-3 shrink-0 flex flex-col gap-1">
                      <label className="text-[9px] font-bold uppercase tracking-wider text-foreground/45">
                        Select Task Thread
                      </label>
                      <select
                        value={activeTaskId}
                        onChange={(e) => {
                          setSelectedTaskId(e.target.value);
                          setVisibility("PUBLIC_TO_ASSISTANT");
                        }}
                        className="h-8 w-full rounded-md border border-border bg-background px-2 text-[10px] focus:outline-none focus:ring-1 focus:ring-foreground/20"
                      >
                        {pageTasks.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.title || `${t.type}`}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Comments List */}
                  <div className="flex-1 overflow-y-auto scrollbar-hide p-4 space-y-3">
                    {isCommentsLoading ? (
                      <div className="flex h-32 items-center justify-center text-foreground/40 text-[10px]">
                        <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" /> Loading comments...
                      </div>
                    ) : dbComments.length === 0 ? (
                      <div className="py-8 text-center text-[10px] text-foreground/30 italic">
                        No comments on this task yet.
                      </div>
                    ) : (
                      dbComments.map((comment) => {
                        const author = typeof comment.authorId === "object" ? comment.authorId : null;
                        const authorName = author?.name || "User";
                        const authorRole = author?.role || "Team";
                        const dateStr = new Date(comment.createdAt).toLocaleString();
                        const isUnresolvedBlocking = comment.isBlocking && comment.status !== "RESOLVED";

                        return (
                          <div
                            key={comment.id}
                            className={`flex flex-col gap-1 rounded-xl border p-3 text-[11px] text-foreground/70 ${
                              isUnresolvedBlocking
                                ? "border-amber-500/30 bg-amber-500/[0.02]"
                                : "border-border bg-card"
                            }`}
                          >
                            <div className="flex justify-between items-center text-[10px]">
                              <span className="font-bold text-foreground/80">
                                {authorName}
                                <span className="ml-1.5 rounded bg-foreground/5 border border-border px-1 py-0.5 text-[8px] uppercase font-black text-foreground/50">
                                  {authorRole}
                                </span>
                              </span>
                              <span className="text-foreground/25">{dateStr}</span>
                            </div>
                            <p className="mt-1 leading-relaxed text-foreground/60 break-words">{comment.body}</p>

                            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-1.5 mt-1.5">
                              <div className="flex items-center gap-1 text-[9px] font-bold text-foreground/50">
                                {comment.isBlocking && (
                                  <span className="inline-flex items-center gap-0.5 text-amber-600 bg-amber-500/10 px-1 rounded uppercase tracking-wider text-[8px]">
                                    <AlertCircle className="h-2 w-2" /> Blocking
                                  </span>
                                )}
                                <span className="uppercase text-[8px] bg-foreground/10 px-1 rounded">
                                  {comment.status}
                                </span>
                              </div>

                              <div className="flex gap-1">
                                {comment.status === "OPEN" && role === "assistant" && (
                                  <button
                                    onClick={() => markFixed.mutate(comment.id)}
                                    disabled={markFixed.isPending}
                                    className="rounded bg-sky-500/10 hover:bg-sky-500/20 px-1.5 py-0.5 text-[9px] font-bold text-sky-600 dark:text-sky-400"
                                  >
                                    Mark Fixed
                                  </button>
                                )}
                                {comment.status === "FIXED" && role === "mangaka" && (
                                  <button
                                    onClick={() => verifyFixed.mutate(comment.id)}
                                    disabled={verifyFixed.isPending}
                                    className="rounded bg-blue-500/10 hover:bg-blue-500/20 px-1.5 py-0.5 text-[9px] font-bold text-blue-600 dark:text-blue-400"
                                  >
                                    Verify Fix
                                  </button>
                                )}
                                {["OPEN", "FIXED", "VERIFIED", "REOPENED"].includes(comment.status) &&
                                  (role === "editor" || role === "admin") && (
                                    <button
                                      onClick={() => resolve.mutate(comment.id)}
                                      disabled={resolve.isPending}
                                      className="rounded bg-emerald-500/10 hover:bg-emerald-500/20 px-1.5 py-0.5 text-[9px] font-bold text-emerald-600 dark:text-emerald-400"
                                    >
                                      Resolve
                                    </button>
                                  )}
                                {comment.status === "RESOLVED" &&
                                  (role === "mangaka" || role === "editor" || role === "admin") && (
                                    <button
                                      onClick={() => reopen.mutate(comment.id)}
                                      disabled={reopen.isPending}
                                      className="rounded bg-amber-500/10 hover:bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-bold text-amber-600 dark:text-amber-400"
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

                  {/* Input form */}
                  <form
                    onSubmit={handlePostComment}
                    className="p-3 border-t border-border bg-card flex flex-col gap-2 shrink-0"
                  >
                    <div className="flex items-center justify-between text-[9px] text-foreground/55">
                      <label className="flex items-center gap-1 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={isBlocking}
                          onChange={(e) => setIsBlocking(e.target.checked)}
                          className="rounded border-border text-blue-600 focus:ring-0"
                        />
                        Blocking Comment
                      </label>

                      {(role === "editor" || role === "admin" || role === "mangaka") && (
                        <select
                          value={visibility}
                          onChange={(e) => setVisibility(e.target.value as CommentVisibility)}
                          className="border-0 bg-transparent py-0 pr-6 pl-0 text-[9px] text-foreground/60 focus:ring-0 focus:outline-none"
                        >
                          <option value="PUBLIC_TO_ASSISTANT">Visible to Assistant</option>
                          <option value="MANGAKA_EDITOR_ONLY">Mangaka & Editor Only</option>
                          {role !== "mangaka" && (
                            <option value="EDITOR_INTERNAL">Editor Internal</option>
                          )}
                        </select>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Add comment..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-[11px] text-foreground focus:outline-none focus:border-foreground/20 font-medium"
                      />
                      <button
                        type="submit"
                        disabled={createComment.isPending}
                        className="h-7 w-7 rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-sm shrink-0 transition-colors disabled:opacity-50"
                      >
                        {createComment.isPending ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Plus className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center p-6 text-center text-[10px] text-foreground/45">
                  No tasks created yet for this page. Create tasks first to discuss.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Tab Rail (Always visible on the right edge) ────────────────── */}
      <div className="w-12 border-l border-border bg-background flex flex-col items-center py-4 gap-4">
        {/* Toggle Collapse Button */}
        <button
          onClick={() => setInspectorCollapsed(!isInspectorCollapsed)}
          className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-foreground/5 text-foreground/40 hover:text-foreground/80 transition-colors"
          title={isInspectorCollapsed ? "Expand panel" : "Collapse panel"}
        >
          {isInspectorCollapsed ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>

        <div className="h-px w-6 bg-border" />

        {/* Tab Items */}
        {tabsConfig.map((t) => {
          const isActive = activeTab === t.id && !isInspectorCollapsed;
          return (
            <button
              key={t.id}
              onClick={() => handleTabClick(t.id)}
              className={`group relative flex h-8.5 w-8.5 items-center justify-center rounded-lg transition-all ${
                isActive
                  ? "bg-foreground/10 text-foreground shadow-inner"
                  : "text-foreground/40 hover:bg-foreground/5 hover:text-foreground/70"
              }`}
              title={t.label}
            >
              <t.icon className="h-4.5 w-4.5" />
              {t.id === "ai" && results.some((r) => r.status === "pending") && (
                <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-sky-400 animate-ping" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
