import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  GripVertical,
  ListChecks,
  Lock,
  LockOpen,
  MessageSquare,
  Square,
  ClipboardList,
} from "lucide-react";
import type { Chapter } from "@/entities/series/model/series-types";
import type {
  StudioComment,
  StudioRegion,
  StudioSelection,
  StudioTask,
} from "@/entities/series/model/studio-types";
import { REGION_TYPE_LABEL } from "@/entities/series/model/studio-types";
import type { StudioPermissionSet } from "../../model/studio-permissions";
import { useEditorReviewQueueQuery } from "../../../api/series-queries";
import { chapterPageLabel } from "@/entities/chapter/model/chapter-pages";
import { ResolvedImage } from "@/shared/ui";

type LayerKind = "region" | "task" | "comment";
type DrawerTab = "ai-detect" | "tasks" | "comments";

type Props = {
  chapters: Chapter[];
  chapter: Chapter | undefined;
  onChapterChange: (id: string) => void;
  selectedPageId: string | undefined;
  onSelectPage: (id: string) => void;
  regions: StudioRegion[];
  tasks: StudioTask[];
  comments: StudioComment[];
  selection: StudioSelection;
  onSelect: (sel: StudioSelection) => void;
  onToggleHidden: (kind: LayerKind, id: string, hidden: boolean) => void;
  onToggleLocked: (kind: LayerKind, id: string, locked: boolean) => void;
  onBulkHidden: (kind: LayerKind, pageId: string, hidden: boolean) => void;
  onBulkLocked: (kind: LayerKind, pageId: string, locked: boolean) => void;
  onReorder: (kind: LayerKind, pageId: string, fromId: string, toId: string) => void;
  permissions: StudioPermissionSet;
};

export function PageLayersPanel({
  chapters,
  chapter,
  onChapterChange,
  selectedPageId,
  onSelectPage,
  regions,
  tasks,
  comments,
  selection,
  onSelect,
  onToggleHidden,
  onToggleLocked,
  onBulkHidden,
  onBulkLocked,
  onReorder,
  permissions,
}: Props) {
  const PAGE_SIZE = 9;
  const totalPages = chapter?.pages.length ?? 0;
  const [pageGridIndex, setPageGridIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<DrawerTab>("ai-detect");

  const { data: reviewQueue = [] } = useEditorReviewQueueQuery({
    enabled: permissions.mode === "editor",
  });

  useEffect(() => {
    setPageGridIndex(0);
  }, [chapter?.id]);

  useEffect(() => {
    if (selection.kind === "region") setActiveTab("tasks");
    else if (selection.kind === "task") setActiveTab("tasks");
    else if (selection.kind === "comment") setActiveTab("comments");
  }, [selection]);

  useEffect(() => {
    if (!chapter || !selectedPageId) return;
    const idx = chapter.pages.findIndex((p) => p.id === selectedPageId);
    if (idx < 0) return;
    const target = Math.floor(idx / PAGE_SIZE);
    setPageGridIndex((cur) => (cur === target ? cur : target));
  }, [chapter, selectedPageId]);

  const maxGridIndex = Math.max(0, Math.ceil(totalPages / PAGE_SIZE) - 1);
  const safeGridIndex = Math.min(pageGridIndex, maxGridIndex);
  const start = safeGridIndex * PAGE_SIZE;
  const visiblePages = useMemo(
    () => chapter?.pages.slice(start, start + PAGE_SIZE) ?? [],
    [chapter, start],
  );

  return (
    <aside className="flex h-full w-[224px] flex-shrink-0 flex-col border-r border-border bg-card">
      <div className="flex max-h-[46vh] flex-shrink-0 flex-col border-b border-border">
        {permissions.mode === "editor" && (
          <div className="border-b border-border px-2 py-1.5 flex-shrink-0 bg-muted/20">
            <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-rose-600 mb-1">
              <ClipboardList className="h-3.5 w-3.5" /> Review Queue ({reviewQueue.length})
            </p>
            {reviewQueue.length === 0 ? (
              <p className="text-[9px] text-muted-foreground italic px-1">Queue is empty.</p>
            ) : (
              <div className="max-h-[14vh] overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                {reviewQueue.map((sub) => {
                  const linkedTask = tasks.find((t) => t.id === sub.taskId);
                  const isSelected = selection.kind === "task" && selection.taskId === sub.taskId;
                  return (
                    <button
                      key={sub.id}
                      onClick={() => {
                        if (linkedTask) {
                          onChapterChange(linkedTask.chapterId);
                          onSelectPage(linkedTask.pageId);
                          onSelect({ kind: "task", taskId: linkedTask.id });
                        } else {
                          if (sub.chapterId) onChapterChange(sub.chapterId);
                          onSelect({ kind: "task", taskId: sub.taskId });
                        }
                      }}
                      className={`w-full text-left rounded px-1.5 py-0.5 text-[9.5px] transition truncate block ${
                        isSelected
                          ? "bg-rose-100 text-rose-900 font-semibold border-l-2 border-rose-500 pl-1"
                          : "hover:bg-muted text-foreground"
                      }`}
                    >
                      {linkedTask?.title || `Task ${sub.taskId.slice(0, 8)}`}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <div className="flex flex-shrink-0 items-center justify-between gap-1.5 px-2 py-1.5">
          <p className="text-[10px] font-semibold text-muted-foreground">
            {permissions.leftPanelTitle}
          </p>
          {permissions.mode !== "assistant" && (
            <select
              value={chapter?.id ?? ""}
              onChange={(e) => onChapterChange(e.target.value)}
              className="h-6 max-w-[120px] truncate rounded border border-border bg-background px-1 text-[10px]"
            >
              {chapters.length === 0 ? <option value="">-</option> : null}
              {chapters.map((c) => (
                <option key={c.id} value={c.id}>
                  Ch.{String(c.number).padStart(3, "0")} - {c.title}
                </option>
              ))}
            </select>
          )}
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {chapter ? (
            chapter.pages.length === 0 ? (
              <p className="px-3 py-6 text-center text-xs text-muted-foreground">
                No pages available in this scope.
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-1.5 p-2">
                {visiblePages.map((p) => {
                  const pageRegions = regions.filter((r) => r.pageId === p.id);
                  const taskCount = tasks.filter((t) => t.pageId === p.id).length;
                  const cmt = comments.filter((c) => c.pageId === p.id).length;
                  const locked = pageRegions.some(
                    (r) => r.taskId && r.status !== "DONE" && r.status !== "APPROVED",
                  );
                  const selected = selectedPageId === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => onSelectPage(p.id)}
                      className={`relative flex flex-col rounded border text-left transition ${
                        selected
                          ? "border-foreground ring-2 ring-foreground"
                          : "border-border hover:border-foreground/40"
                      }`}
                    >
                      <div className="relative aspect-[3/4] overflow-hidden rounded-t bg-muted">
                        {p.fileKey || p.fileUrl || p.imageUrl ? (
                          <ResolvedImage
                            fileKey={p.fileKey}
                            fallbackUrl={p.fileUrl ?? p.imageUrl}
                            alt=""
                            className="h-full w-full object-cover"
                            fallback={
                              <div className="flex h-full items-center justify-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                P.{chapterPageLabel(p)}
                              </div>
                            }
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                            P.{chapterPageLabel(p)}
                          </div>
                        )}
                        {locked ? (
                          <span className="absolute right-1 top-1 rounded bg-foreground/85 p-1 text-background">
                            <Lock className="h-3 w-3" />
                          </span>
                        ) : null}
                      </div>
                      <div className="px-1 py-1 leading-tight">
                        <p className="text-[9px] font-bold">P.{chapterPageLabel(p)}</p>
                        <p className="flex items-center gap-1 text-[8.5px] text-muted-foreground">
                          <span className="inline-flex items-center gap-0.5">
                            <ListChecks className="h-2 w-2" /> {taskCount}
                          </span>
                          <span className="inline-flex items-center gap-0.5">
                            <MessageSquare className="h-2 w-2" /> {cmt}
                          </span>
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )
          ) : (
            <p className="px-3 py-6 text-center text-xs text-muted-foreground">
              No chapter selected.
            </p>
          )}
        </div>
        {totalPages > 0 ? (
          <div className="flex flex-shrink-0 items-center justify-between gap-1.5 border-t border-border px-2 py-1 text-[10px] text-muted-foreground">
            <span>
              {start + 1}-{Math.min(start + PAGE_SIZE, totalPages)}/{totalPages}
            </span>
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => setPageGridIndex((i) => Math.max(0, i - 1))}
                disabled={safeGridIndex === 0}
                className="flex h-5 w-5 items-center justify-center rounded border border-border bg-background text-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Previous pages"
              >
                <ChevronLeft className="h-3 w-3" />
              </button>
              <button
                type="button"
                onClick={() => setPageGridIndex((i) => Math.min(maxGridIndex, i + 1))}
                disabled={safeGridIndex >= maxGridIndex}
                className="flex h-5 w-5 items-center justify-center rounded border border-border bg-background text-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Next pages"
              >
                <ChevronRight className="h-3 w-3" />
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <div className="flex min-h-0 flex-1 flex-col border-t border-border">
        <div className="flex flex-shrink-0 border-b border-border">
          {(
            [
              {
                key: "ai-detect" as const,
                label: "AI Detect",
                count: regions.filter(
                  (r) =>
                    r.pageId === selectedPageId &&
                    r.metadata?.source === "ai" &&
                    r.status !== "DISCARDED",
                ).length,
              },
              {
                key: "tasks" as const,
                label: "Tasks",
                count: tasks.filter((t) => t.pageId === selectedPageId).length,
              },
              {
                key: "comments" as const,
                label: "Comments",
                count: comments.filter((c) => c.pageId === selectedPageId).length,
              },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 px-2 py-1.5 text-[10px] font-semibold transition-colors ${
                activeTab === tab.key
                  ? "border-b-2 border-foreground text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
              <span className="ml-1 text-[9px] text-muted-foreground">{tab.count}</span>
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto pb-2">
          {activeTab === "ai-detect" &&
          permissions.visibleLayerKinds.includes("region") &&
          permissions.mode !== "assistant" &&
          permissions.mode !== "board" ? (
            <LayerGroup
              kind="region"
              label="AI Detect"
              icon={<Square className="h-3 w-3" />}
              items={regions.filter(
                (r) =>
                  r.pageId === selectedPageId &&
                  r.metadata?.source === "ai" &&
                  r.status !== "DISCARDED",
              )}
              selectedPageId={selectedPageId}
              editable={permissions.canEditRegion}
              selection={selection}
              onSelect={onSelect}
              onToggleHidden={onToggleHidden}
              onToggleLocked={onToggleLocked}
              onBulkHidden={onBulkHidden}
              onBulkLocked={onBulkLocked}
              onReorder={onReorder}
            />
          ) : null}
          {activeTab === "tasks" &&
          permissions.visibleLayerKinds.includes("task") &&
          permissions.mode !== "board" ? (
            <LayerGroup
              kind="task"
              label={permissions.mode === "assistant" ? "My Tasks" : "Tasks"}
              icon={<ListChecks className="h-3 w-3" />}
              items={tasks.filter((t) => t.pageId === selectedPageId)}
              selectedPageId={selectedPageId}
              editable={permissions.canAssignTask || permissions.canReassignTask}
              selection={selection}
              onSelect={onSelect}
              onToggleHidden={onToggleHidden}
              onToggleLocked={onToggleLocked}
              onBulkHidden={onBulkHidden}
              onBulkLocked={onBulkLocked}
              onReorder={onReorder}
            />
          ) : null}
          {activeTab === "comments" &&
          permissions.visibleLayerKinds.includes("comment") &&
          permissions.mode !== "assistant" ? (
            <LayerGroup
              kind="comment"
              label="Comments"
              icon={<MessageSquare className="h-3 w-3" />}
              items={comments.filter((c) => c.pageId === selectedPageId)}
              selectedPageId={selectedPageId}
              editable={permissions.canResolveComment}
              selection={selection}
              onSelect={onSelect}
              onToggleHidden={onToggleHidden}
              onToggleLocked={onToggleLocked}
              onBulkHidden={onBulkHidden}
              onBulkLocked={onBulkLocked}
              onReorder={onReorder}
            />
          ) : null}
          {activeTab === "comments" &&
          comments.filter((c) => c.pageId === selectedPageId).length === 0 ? (
            <p className="px-3 py-6 text-center text-[11px] text-muted-foreground">
              No comments yet
            </p>
          ) : null}
          {permissions.visibleLayerKinds.length === 0 ||
          (permissions.mode === "board" &&
            activeTab === "comments" &&
            comments.filter((c) => c.pageId === selectedPageId).length === 0) ? (
            <p className="px-3 py-6 text-center text-xs text-muted-foreground">
              Production layers are hidden for this role.
            </p>
          ) : null}
        </div>
      </div>
    </aside>
  );
}

type LayerItem = StudioRegion | StudioTask | StudioComment;

function LayerGroup({
  kind,
  label,
  icon,
  items,
  selectedPageId,
  editable,
  selection,
  onSelect,
  onToggleHidden,
  onToggleLocked,
  onBulkHidden,
  onBulkLocked,
  onReorder,
}: {
  kind: LayerKind;
  label: string;
  icon: React.ReactNode;
  items: LayerItem[];
  selectedPageId: string | undefined;
  editable: boolean;
  selection: StudioSelection;
  onSelect: (sel: StudioSelection) => void;
  onToggleHidden: (kind: LayerKind, id: string, hidden: boolean) => void;
  onToggleLocked: (kind: LayerKind, id: string, locked: boolean) => void;
  onBulkHidden: (kind: LayerKind, pageId: string, hidden: boolean) => void;
  onBulkLocked: (kind: LayerKind, pageId: string, locked: boolean) => void;
  onReorder: (kind: LayerKind, pageId: string, fromId: string, toId: string) => void;
}) {
  const [open, setOpen] = useState(true);
  const allHidden = items.length > 0 && items.every((x) => x.hidden);
  const allLocked = items.length > 0 && items.every((x) => x.locked);
  const disabled = !selectedPageId || items.length === 0;

  return (
    <div className="border-t border-border first:border-t-0">
      <div className="flex w-full items-center gap-1 px-2 py-1 text-[10px] font-semibold text-foreground hover:bg-muted">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex flex-1 items-center gap-1.5 text-left"
        >
          {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          {icon}
          <span>{label}</span>
          <span className="ml-1 text-[10px] font-semibold text-muted-foreground">
            {items.length}
          </span>
        </button>
        {editable ? (
          <>
            <button
              type="button"
              disabled={disabled}
              onClick={() => selectedPageId && onBulkHidden(kind, selectedPageId, !allHidden)}
              className="flex h-4 w-4 items-center justify-center rounded text-muted-foreground hover:bg-foreground/10 disabled:opacity-30"
              aria-label={allHidden ? `Show all ${label}` : `Hide all ${label}`}
            >
              {allHidden ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={() => selectedPageId && onBulkLocked(kind, selectedPageId, !allLocked)}
              className="flex h-4 w-4 items-center justify-center rounded text-muted-foreground hover:bg-foreground/10 disabled:opacity-30"
              aria-label={allLocked ? `Unlock all ${label}` : `Lock all ${label}`}
            >
              {allLocked ? <Lock className="h-3 w-3" /> : <LockOpen className="h-3 w-3" />}
            </button>
          </>
        ) : null}
      </div>
      {open ? (
        <div className="pb-1">
          {items.map((item, index) => (
            <LayerRow
              key={item.id}
              id={item.id}
              text={layerText(kind, item, index)}
              active={isActive(kind, item.id, selection)}
              hidden={!!item.hidden}
              locked={!!item.locked}
              editable={editable}
              onClick={() => onSelect(selectionFor(kind, item.id))}
              onToggleHidden={(hidden) => onToggleHidden(kind, item.id, hidden)}
              onToggleLocked={(locked) => onToggleLocked(kind, item.id, locked)}
              onReorder={(fromId) =>
                selectedPageId && onReorder(kind, selectedPageId, fromId, item.id)
              }
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function LayerRow({
  id,
  text,
  active,
  hidden,
  locked,
  editable,
  onClick,
  onToggleHidden,
  onToggleLocked,
  onReorder,
}: {
  id: string;
  text: string;
  active: boolean;
  hidden: boolean;
  locked: boolean;
  editable: boolean;
  onClick: () => void;
  onToggleHidden: (hidden: boolean) => void;
  onToggleLocked: (locked: boolean) => void;
  onReorder: (fromId: string) => void;
}) {
  const [dragOver, setDragOver] = useState(false);
  const rafRef = useRef<number | null>(null);
  const setDragOverThrottled = (v: boolean) => {
    if (rafRef.current != null) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      setDragOver(v);
    });
  };

  useEffect(
    () => () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    },
    [],
  );

  return (
    <div
      draggable={editable && !locked}
      onDragStart={(e) => {
        if (!editable || locked) {
          e.preventDefault();
          return;
        }
        e.dataTransfer.setData("text/x-layer-id", id);
        e.dataTransfer.effectAllowed = "move";
      }}
      onDragOver={(e) => {
        if (editable && e.dataTransfer.types.includes("text/x-layer-id")) {
          e.preventDefault();
          e.dataTransfer.dropEffect = "move";
          if (!dragOver) setDragOverThrottled(true);
        }
      }}
      onDragLeave={() => setDragOverThrottled(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        if (!editable) return;
        const fromId = e.dataTransfer.getData("text/x-layer-id");
        if (fromId && fromId !== id) onReorder(fromId);
      }}
      className={`group flex w-full items-center gap-1 px-1.5 py-0.5 text-left text-[10.5px] ${
        active ? "bg-foreground text-background" : "text-foreground/80 hover:bg-muted"
      } ${dragOver ? "outline outline-1 outline-foreground" : ""} ${hidden ? "opacity-50" : ""}`}
    >
      <GripVertical
        className={`h-3 w-3 flex-shrink-0 ${
          !editable || locked ? "cursor-not-allowed opacity-40" : "cursor-grab"
        } ${active ? "text-background/70" : "text-muted-foreground"}`}
      />
      {editable ? (
        <>
          <button
            type="button"
            disabled={locked}
            onClick={(e) => {
              e.stopPropagation();
              onToggleHidden(!hidden);
            }}
            className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded hover:bg-foreground/10 ${
              active ? "text-background" : "text-muted-foreground"
            } disabled:opacity-40 disabled:hover:bg-transparent`}
            aria-label={hidden ? "Show layer" : "Hide layer"}
          >
            {hidden ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleLocked(!locked);
            }}
            className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded hover:bg-foreground/10 ${
              active ? "text-background" : "text-muted-foreground"
            }`}
            aria-label={locked ? "Unlock layer" : "Lock layer"}
          >
            {locked ? <Lock className="h-3 w-3" /> : <LockOpen className="h-3 w-3" />}
          </button>
        </>
      ) : null}
      <button type="button" onClick={onClick} className="min-w-0 flex-1 truncate text-left">
        {text}
      </button>
    </div>
  );
}

function selectionFor(kind: LayerKind, id: string): StudioSelection {
  if (kind === "region") return { kind: "region", regionId: id };
  if (kind === "task") return { kind: "task", taskId: id };
  return { kind: "comment", commentId: id };
}

function isActive(kind: LayerKind, id: string, selection: StudioSelection) {
  if (kind === "region") return selection.kind === "region" && selection.regionId === id;
  if (kind === "task") return selection.kind === "task" && selection.taskId === id;
  return selection.kind === "comment" && selection.commentId === id;
}

function layerText(kind: LayerKind, item: LayerItem, index: number) {
  if (kind === "region") {
    // The Regions group only holds AI-detected, not-yet-assigned regions.
    const region = item as StudioRegion;
    return `AI Detected · ${REGION_TYPE_LABEL[region.type]}`;
  }
  if (kind === "task") {
    // A task represents the region assigned to it — shown by the task name.
    const task = item as StudioTask;
    return task.title;
  }
  const comment = item as StudioComment;
  return `#${index + 1} - ${comment.isBlocking ? "Blocking" : comment.status}`;
}
