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
import {
  useAcceptAISuggestion,
  useRejectAISuggestion,
  useRunAISegmentation,
  useRunAITextWhitening,
} from "@/shared/queries/usePageStudio";
import { useDeleteRegion } from "@/shared/queries/useRegions";
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

  // Mock comments state
  const [comments, setComments] = useState([
    {
      id: "1",
      author: "Kei Urana",
      role: "Mangaka",
      content: "Can you adjust the tone work in the first panel?",
      time: "3h ago",
    },
    {
      id: "2",
      author: "Otsu Yoshioka",
      role: "Editor",
      content: "Reviewing this now. Looks mostly correct.",
      time: "1h ago",
    },
  ]);
  const [newComment, setNewComment] = useState("");

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setComments([
      ...comments,
      {
        id: String(Date.now()),
        author: "Otsu Yoshioka",
        role: "Editor",
        content: newComment.trim(),
        time: "Just now",
      },
    ]);
    setNewComment("");
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
                            isDeleting || isSuggestionMutationPending || (!isAISuggestion && hasActiveTask)
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
              {/* Comments List */}
              <div className="flex-1 overflow-y-auto scrollbar-hide p-4 space-y-3">
                {comments.map((c) => (
                  <div
                    key={c.id}
                    className="flex flex-col gap-1 rounded-xl border border-border bg-card p-3 text-[11px] text-foreground/70"
                  >
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="font-bold text-foreground/80">
                        {c.author}
                        <span className="ml-1 text-[8px] font-normal text-foreground/30 uppercase bg-foreground/5 border border-border rounded px-1">
                          {c.role}
                        </span>
                      </span>
                      <span className="text-foreground/25">{c.time}</span>
                    </div>
                    <p className="mt-1 leading-relaxed text-foreground/60">{c.content}</p>
                  </div>
                ))}
              </div>

              {/* Input box */}
              <form
                onSubmit={handlePostComment}
                className="p-3 border-t border-border bg-card flex gap-2 shrink-0"
              >
                <input
                  type="text"
                  placeholder="Add comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-[11px] text-foreground focus:outline-none focus:border-foreground/20 font-medium"
                />
                <button
                  type="submit"
                  className="h-7 w-7 rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-sm shrink-0 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </form>
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
