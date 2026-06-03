import { useAuth } from "@clerk/react";
import {
  ArrowLeft,
  BriefcaseBusiness,
  Crosshair,
  MessageSquare,
  Loader2,
  MousePointer2,
  RefreshCw,
  Save,
  Trash
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getPage, type Page } from "@/features/page/api/page";
import { CommentPanel } from "@/features/comment/components/CommentPanel";
import {
  createAnnotation,
  deleteAnnotation,
  listAnnotations,
  updateAnnotation,
  type Annotation
} from "@/features/annotation/api/annotation";
import {
  createRegion,
  deleteRegion,
  listRegions,
  regionTypes,
  type Region,
  type RegionType
} from "@/features/region/api/region";
import {
  createTaskFromRegion,
  deleteTask,
  listTasks,
  taskPriorities,
  taskTypes,
  type Task,
  type TaskPriority,
  type TaskType
} from "@/features/task/api/task";
import {
  createNormalizedRegionBox,
  regionBoxToStyle,
  type NormalizedRegionBox,
  type Point
} from "@/features/region/lib/region-workspace";

type WorkspaceToolMode = "REGION" | "ANNOTATION";

const regionColorByType: Record<RegionType, string> = {
  BACKGROUND: "#9065d5",
  INKING: "#2f243a",
  SCREENTONE: "#ffc95e",
  CLEANUP: "#ff7196",
  EFFECT: "#ff9971",
  BUBBLE: "#e560bc",
  OTHER: "#5f5270"
};

type LoadState =
  | { status: "loading" }
  | { status: "ready"; page: Page; regions: Region[]; annotations: Annotation[]; tasks: Task[] }
  | { status: "error"; message: string };

function RegionOverlay({
  region,
  selected,
  onSelect
}: {
  region: Region;
  selected: boolean;
  onSelect: (region: Region) => void;
}) {
  const color = regionColorByType[region.type];

  return (
    <button
      type="button"
      aria-label={`${region.type} region`}
      className="absolute rounded-[3px] border-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
      style={{
        ...regionBoxToStyle(region),
        borderColor: color,
        backgroundColor: selected ? `${color}40` : `${color}20`,
        boxShadow: selected ? `0 0 0 2px white, 0 0 0 5px ${color}` : "0 8px 20px rgba(47,36,58,0.12)"
      }}
      onClick={(event) => {
        event.stopPropagation();
        onSelect(region);
      }}
    >
      <span
        className="absolute left-1 top-1 rounded-sm px-1.5 py-0.5 text-[10px] font-semibold text-white shadow-sm"
        style={{ backgroundColor: color }}
      >
        {region.type}
      </span>
    </button>
  );
}

function AnnotationOverlay({
  annotation,
  selected,
  onSelect
}: {
  annotation: Annotation;
  selected: boolean;
  onSelect: (annotation: Annotation) => void;
}) {
  const color = annotation.status === "RESOLVED" ? "#8a7a99" : "#ff7196";

  return (
    <button
      type="button"
      aria-label={`${annotation.status.toLowerCase()} annotation`}
      className="absolute rounded-[3px] border-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
      style={{
        ...regionBoxToStyle(annotation),
        borderColor: color,
        backgroundColor: selected ? `${color}35` : `${color}18`,
        boxShadow: selected ? `0 0 0 2px white, 0 0 0 5px ${color}` : "0 8px 20px rgba(47,36,58,0.10)"
      }}
      onClick={(event) => {
        event.stopPropagation();
        onSelect(annotation);
      }}
    >
      <span
        className="absolute right-1 top-1 rounded-sm px-1.5 py-0.5 text-[10px] font-semibold text-white shadow-sm"
        style={{ backgroundColor: color }}
      >
        {annotation.status}
      </span>
    </button>
  );
}

function EmptyWorkspaceState({ chapterId }: { chapterId?: string }) {
  return (
    <div className="container max-w-5xl py-8">
      <div className="rounded-lg border bg-card p-6">
        <h1 className="text-2xl font-semibold tracking-tight">Page workspace unavailable</h1>
        <p className="mt-2 text-sm text-muted-foreground">The requested page could not be loaded.</p>
        {chapterId ? (
          <Link to={`/app/mangaka/chapters/${chapterId}/pages`} className="mt-4 inline-flex">
            <Button variant="outline">
              <ArrowLeft /> Back to pages
            </Button>
          </Link>
        ) : null}
      </div>
    </div>
  );
}

export function PageWorkspacePage() {
  const { pageId } = useParams<{ pageId: string }>();
  const { getToken } = useAuth();
  const canvasRef = useRef<HTMLDivElement>(null);

  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [toolMode, setToolMode] = useState<WorkspaceToolMode>("REGION");
  const [selectedType, setSelectedType] = useState<RegionType>("BUBBLE");
  const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null);
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null);
  const [annotationComment, setAnnotationComment] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskAssigneeId, setTaskAssigneeId] = useState("");
  const [taskType, setTaskType] = useState<TaskType>("OTHER");
  const [taskPriority, setTaskPriority] = useState<TaskPriority>("MEDIUM");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [taskBaseRate, setTaskBaseRate] = useState("0");
  const [taskBonusAmount, setTaskBonusAmount] = useState("0");
  const [draftBox, setDraftBox] = useState<NormalizedRegionBox | null>(null);
  const [dragStart, setDragStart] = useState<Point | null>(null);
  const [saving, setSaving] = useState(false);
  const [assigningTask, setAssigningTask] = useState(false);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<{ id: string; systemRole: string } | null>(null);

  const loadWorkspace = useCallback(async () => {
    if (!pageId) return;

    try {
      setState({ status: "loading" });
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");

      const [page, regions, annotations, allTasks, userResponse] = await Promise.all([
        getPage(token, pageId),
        listRegions(token, pageId),
        listAnnotations(token, pageId),
        listTasks(token),
        fetch(`${import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000/api"}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }).then(res => res.json().catch(() => ({ success: false })))
      ]);

      if (userResponse && userResponse.success && userResponse.data) {
        setCurrentUser(userResponse.data.user);
      }

      setState({ status: "ready", page, regions, annotations, tasks: allTasks.filter((task) => task.pageId === pageId) });
      setSelectedRegionId(regions[0]?.id ?? null);
      setSelectedAnnotationId(annotations[0]?.id ?? null);
    } catch (error) {
      setState({
        status: "error",
        message: error instanceof Error ? error.message : "Failed to load page workspace"
      });
    }
  }, [getToken, pageId]);

  useEffect(() => {
    void loadWorkspace();
  }, [loadWorkspace]);

  function getCanvasRect() {
    return canvasRef.current?.getBoundingClientRect() ?? null;
  }

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (state.status !== "ready") return;
    const rect = getCanvasRect();
    if (!rect) return;

    const start = { clientX: event.clientX, clientY: event.clientY };
    setDragStart(start);
    setDraftBox(null);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!dragStart) return;
    const rect = getCanvasRect();
    if (!rect) return;

    const nextBox = createNormalizedRegionBox(
      dragStart,
      { clientX: event.clientX, clientY: event.clientY },
      rect,
      0
    );
    setDraftBox(nextBox);
  }

  function handlePointerUp(event: React.PointerEvent<HTMLDivElement>) {
    if (!dragStart) return;
    const rect = getCanvasRect();
    if (rect) {
      setDraftBox(
        createNormalizedRegionBox(
          dragStart,
          { clientX: event.clientX, clientY: event.clientY },
          rect
        )
      );
    }
    setDragStart(null);
    event.currentTarget.releasePointerCapture(event.pointerId);
  }

  async function handleSaveDraft() {
    if (state.status !== "ready" || !pageId || !draftBox) return;

    try {
      setSaving(true);
      setActionError(null);
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      if (toolMode === "ANNOTATION") {
        const annotation = await createAnnotation(token, pageId, {
          ...draftBox,
          regionId: selectedRegionId ?? undefined,
          comment: annotationComment.trim() || undefined
        });
        setState({
          status: "ready",
          page: state.page,
          regions: state.regions,
          annotations: [annotation, ...state.annotations],
          tasks: state.tasks
        });
        setSelectedAnnotationId(annotation.id);
        setAnnotationComment("");
        setDraftBox(null);
        return;
      }

      const region = await createRegion(token, pageId, { type: selectedType, ...draftBox });
      setState({
        status: "ready",
        page: state.page,
        regions: [region, ...state.regions],
        annotations: state.annotations,
        tasks: state.tasks
      });
      setSelectedRegionId(region.id);
      setDraftBox(null);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Failed to save region");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteRegion(regionId: string) {
    if (state.status !== "ready") return;
    const confirmed = window.confirm("Delete this region?");
    if (!confirmed) return;

    try {
      setActionError(null);
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      await deleteRegion(token, regionId);
      const remaining = state.regions.filter((region) => region.id !== regionId);
      setState({ status: "ready", page: state.page, regions: remaining, annotations: state.annotations, tasks: state.tasks });
      setSelectedRegionId(remaining[0]?.id ?? null);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Failed to delete region");
    }
  }

  async function handleUpdateAnnotationStatus(annotationId: string, status: "OPEN" | "RESOLVED") {
    if (state.status !== "ready") return;

    try {
      setActionError(null);
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      const updated = await updateAnnotation(token, annotationId, { status });
      setState({
        status: "ready",
        page: state.page,
        regions: state.regions,
        annotations: state.annotations.map((annotation) => (annotation.id === annotationId ? updated : annotation)),
        tasks: state.tasks
      });
      setSelectedAnnotationId(updated.id);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Failed to update annotation");
    }
  }

  async function handleDeleteAnnotation(annotationId: string) {
    if (state.status !== "ready") return;
    const confirmed = window.confirm("Delete this annotation?");
    if (!confirmed) return;

    try {
      setActionError(null);
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      await deleteAnnotation(token, annotationId);
      const remaining = state.annotations.filter((annotation) => annotation.id !== annotationId);
      setState({ status: "ready", page: state.page, regions: state.regions, annotations: remaining, tasks: state.tasks });
      setSelectedAnnotationId(remaining[0]?.id ?? null);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Failed to delete annotation");
    }
  }

  async function handleCreateRegionTask() {
    if (state.status !== "ready" || !selectedRegion) return;

    try {
      setAssigningTask(true);
      setActionError(null);
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      const task = await createTaskFromRegion(token, selectedRegion.id, {
        assignedTo: taskAssigneeId.trim(),
        title: taskTitle.trim(),
        description: taskDescription.trim(),
        type: taskType,
        priority: taskPriority,
        dueDate: taskDueDate || undefined,
        baseRate: Number(taskBaseRate || 0),
        bonusAmount: Number(taskBonusAmount || 0)
      });
      setState({
        status: "ready",
        page: state.page,
        regions: state.regions,
        annotations: state.annotations,
        tasks: [task, ...state.tasks.filter((item) => item.id !== task.id)]
      });
      setTaskTitle("");
      setTaskDescription("");
      setTaskDueDate("");
      setTaskBaseRate("0");
      setTaskBonusAmount("0");
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Failed to create task");
    } finally {
      setAssigningTask(false);
    }
  }

  async function handleDeleteTask(taskId: string) {
    if (state.status !== "ready") return;
    const confirmed = window.confirm("Delete this task?");
    if (!confirmed) return;

    try {
      setDeletingTaskId(taskId);
      setActionError(null);
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      await deleteTask(token, taskId);
      setState({
        status: "ready",
        page: state.page,
        regions: state.regions,
        annotations: state.annotations,
        tasks: state.tasks.filter((task) => task.id !== taskId)
      });
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Failed to delete task");
    } finally {
      setDeletingTaskId(null);
    }
  }

  if (state.status === "loading") {
    return (
      <div className="container max-w-7xl py-8">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Loading page workspace
        </div>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="container max-w-5xl py-8">
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {state.message}
        </div>
      </div>
    );
  }

  if (!state.page) {
    return <EmptyWorkspaceState />;
  }

  const { page, regions, annotations, tasks } = state;
  const selectedRegion = regions.find((region) => region.id === selectedRegionId) ?? null;
  const selectedAnnotation = annotations.find((annotation) => annotation.id === selectedAnnotationId) ?? null;
  const imageUrl = page.processedFileUrl ?? page.previewUrl ?? page.originalFileUrl;
  const selectedRegionTasks = selectedRegion ? tasks.filter((task) => task.regionId === selectedRegion.id) : [];

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-[#fff9fb]">
      <div className="mx-auto grid max-w-7xl gap-5 px-4 py-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section className="min-w-0">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Link
                to={`/app/mangaka/chapters/${page.chapterId}/pages`}
                className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
              >
                <ArrowLeft className="size-4" /> Back to chapter pages
              </Link>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[#2f243a]">
                Page {page.pageNumber} Workspace
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{page.status}</Badge>
              <Button variant="outline" onClick={() => void loadWorkspace()}>
                <RefreshCw /> Refresh
              </Button>
            </div>
          </div>

          <div className="rounded-lg border border-[#eadff6] bg-[#f7f3ff] p-3 shadow-sm">
            <div
              ref={canvasRef}
              className="relative mx-auto aspect-[3/4] max-h-[calc(100vh-11rem)] touch-none select-none overflow-hidden rounded-md bg-white shadow-inner"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={() => {
                setDragStart(null);
              }}
            >
              <img
                src={imageUrl}
                alt={`Page ${page.pageNumber}`}
                className="h-full w-full object-contain"
                draggable={false}
              />

              <div className="absolute inset-0">
                {regions.map((region) => (
                  <RegionOverlay
                    key={region.id}
                    region={region}
                    selected={region.id === selectedRegionId}
                    onSelect={(nextRegion) => setSelectedRegionId(nextRegion.id)}
                  />
                ))}

                {annotations.map((annotation) => (
                  <AnnotationOverlay
                    key={annotation.id}
                    annotation={annotation}
                    selected={annotation.id === selectedAnnotationId}
                    onSelect={(nextAnnotation) => setSelectedAnnotationId(nextAnnotation.id)}
                  />
                ))}

                {draftBox ? (
                  <div
                    className="absolute rounded-[3px] border-2 border-dashed border-[#9065d5] bg-[#9065d5]/20"
                    style={regionBoxToStyle(draftBox)}
                  >
                    <span className="absolute left-1 top-1 rounded-sm bg-[#9065d5] px-1.5 py-0.5 text-[10px] font-semibold text-white">
                      Draft
                    </span>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </section>

        <aside className="grid content-start gap-4">
          <Tabs defaultValue="workspace" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="workspace">Workspace</TabsTrigger>
              <TabsTrigger value="comments">Comments</TabsTrigger>
            </TabsList>

            <TabsContent value="workspace" className="space-y-4 outline-none">
              <section className="rounded-lg border border-[#eadff6] bg-white p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-[#f8f1ff] p-2 text-[#9065d5]">
                    {toolMode === "REGION" ? <Crosshair className="size-5" /> : <MessageSquare className="size-5" />}
                  </div>
                  <div>
                    <h2 className="text-base font-semibold tracking-tight">Workspace tool</h2>
                    <p className="mt-1 text-sm leading-5 text-muted-foreground">
                      Drag across the page to create a region or review annotation.
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={toolMode === "REGION" ? "default" : "outline"}
                    onClick={() => {
                      setToolMode("REGION");
                      setDraftBox(null);
                    }}
                  >
                    <Crosshair /> Region
                  </Button>
                  <Button
                    type="button"
                    variant={toolMode === "ANNOTATION" ? "default" : "outline"}
                    onClick={() => {
                      setToolMode("ANNOTATION");
                      setDraftBox(null);
                    }}
                  >
                    <MessageSquare /> Annotation
                  </Button>
                </div>

                {toolMode === "REGION" ? (
                <div className="mt-4 grid gap-2">
                  <span className="text-xs font-semibold uppercase text-muted-foreground">Type</span>
                  <div className="grid grid-cols-2 gap-2">
                    {regionTypes.map((type) => (
                      <Button
                        key={type}
                        type="button"
                        size="sm"
                        variant={selectedType === type ? "default" : "outline"}
                        onClick={() => setSelectedType(type)}
                        className="justify-start"
                      >
                        <span
                          className="size-2 rounded-full"
                          style={{ backgroundColor: regionColorByType[type] }}
                          aria-hidden="true"
                        />
                        {type}
                      </Button>
                    ))}
                  </div>
                </div>
                ) : (
                  <div className="mt-4 grid gap-2">
                    <span className="text-xs font-semibold uppercase text-muted-foreground">Review comment</span>
                    <textarea
                      value={annotationComment}
                      onChange={(event) => setAnnotationComment(event.target.value)}
                      className="min-h-24 rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                      placeholder="Dialogue bubble needs revision"
                      maxLength={1000}
                    />
                    <p className="text-xs text-muted-foreground">
                      New annotations can optionally link to the selected Region.
                    </p>
                  </div>
                )}

                <div className="mt-4 rounded-md border bg-muted/30 p-3 text-xs text-muted-foreground">
                  {draftBox ? (
                    <dl className="grid grid-cols-2 gap-x-3 gap-y-1">
                      <dt>x</dt>
                      <dd className="text-right text-foreground">{draftBox.x}</dd>
                      <dt>y</dt>
                      <dd className="text-right text-foreground">{draftBox.y}</dd>
                      <dt>width</dt>
                      <dd className="text-right text-foreground">{draftBox.width}</dd>
                      <dt>height</dt>
                      <dd className="text-right text-foreground">{draftBox.height}</dd>
                    </dl>
                  ) : (
                    <div className="flex items-center gap-2">
                      <MousePointer2 className="size-4" />
                      No draft region selected
                    </div>
                  )}
                </div>

                {actionError ? (
                  <div className="mt-3 rounded-md border border-destructive/30 bg-destructive/10 p-2 text-xs text-destructive">
                    {actionError}
                  </div>
                ) : null}

                <div className="mt-4 flex gap-2">
                  <Button onClick={() => void handleSaveDraft()} disabled={!draftBox || saving}>
                    {saving ? <Loader2 className="animate-spin" /> : <Save />}
                    Save {toolMode === "REGION" ? "region" : "annotation"}
                  </Button>
                  <Button variant="outline" onClick={() => setDraftBox(null)} disabled={!draftBox || saving}>
                    Clear
                  </Button>
                </div>
              </section>

              <section className="rounded-lg border border-[#eadff6] bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-base font-semibold tracking-tight">Regions</h2>
                  <Badge variant="secondary">{regions.length}</Badge>
                </div>

                {regions.length === 0 ? (
                  <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                    No regions yet. Drag on the page to create the first one.
                  </p>
                ) : (
                  <div className="grid gap-2">
                    {regions.map((region) => {
                      const isSelected = selectedRegion?.id === region.id;
                      return (
                        <div
                          key={region.id}
                          className={`rounded-md border p-3 transition-colors ${
                            isSelected ? "border-[#9065d5] bg-[#f8f1ff]" : "bg-white"
                          }`}
                        >
                          <button
                            type="button"
                            className="flex w-full items-center justify-between text-left"
                            onClick={() => setSelectedRegionId(region.id)}
                          >
                            <span className="flex items-center gap-2 text-sm font-medium">
                              <span
                                className="size-2 rounded-full"
                                style={{ backgroundColor: regionColorByType[region.type] }}
                                aria-hidden="true"
                              />
                              {region.type}
                            </span>
                            <Badge variant={region.source === "AI" ? "default" : "outline"}>{region.source}</Badge>
                          </button>
                          <div className="mt-2 grid grid-cols-4 gap-1 text-[11px] text-muted-foreground">
                            <span>x {region.x}</span>
                            <span>y {region.y}</span>
                            <span>w {region.width}</span>
                            <span>h {region.height}</span>
                          </div>
                          <Button
                            className="mt-3 w-full"
                            size="sm"
                            variant="destructive"
                            onClick={() => void handleDeleteRegion(region.id)}
                          >
                            <Trash /> Delete
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

              <section className="rounded-lg border border-[#eadff6] bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-base font-semibold tracking-tight">Tasks</h2>
                  <Badge variant="secondary">{tasks.length}</Badge>
                </div>

                <div className="rounded-md border bg-muted/30 p-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <BriefcaseBusiness className="size-4" />
                    {selectedRegion ? `Assign selected ${selectedRegion.type} region` : "Select a region before assigning work"}
                  </div>
                </div>

                <div className="mt-4 grid gap-3">
                  <label className="grid gap-1 text-xs font-semibold uppercase text-muted-foreground">
                    Assistant user id
                    <input
                      value={taskAssigneeId}
                      onChange={(event) => setTaskAssigneeId(event.target.value)}
                      className="rounded-lg border border-input bg-background px-3 py-2 text-sm font-normal normal-case text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                      placeholder="507f1f77bcf86cd799439296"
                    />
                  </label>

                  <label className="grid gap-1 text-xs font-semibold uppercase text-muted-foreground">
                    Title
                    <input
                      value={taskTitle}
                      onChange={(event) => setTaskTitle(event.target.value)}
                      className="rounded-lg border border-input bg-background px-3 py-2 text-sm font-normal normal-case text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                      placeholder="Ink selected panel"
                      maxLength={160}
                    />
                  </label>

                  <label className="grid gap-1 text-xs font-semibold uppercase text-muted-foreground">
                    Description
                    <textarea
                      value={taskDescription}
                      onChange={(event) => setTaskDescription(event.target.value)}
                      className="min-h-20 rounded-lg border border-input bg-background px-3 py-2 text-sm font-normal normal-case text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                      placeholder="Clean edges and prepare final ink layer"
                      maxLength={1000}
                    />
                  </label>

                  <div className="grid grid-cols-2 gap-2">
                    <label className="grid gap-1 text-xs font-semibold uppercase text-muted-foreground">
                      Type
                      <select
                        value={taskType}
                        onChange={(event) => setTaskType(event.target.value as TaskType)}
                        className="rounded-lg border border-input bg-background px-2 py-2 text-sm font-normal normal-case text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                      >
                        {taskTypes.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="grid gap-1 text-xs font-semibold uppercase text-muted-foreground">
                      Priority
                      <select
                        value={taskPriority}
                        onChange={(event) => setTaskPriority(event.target.value as TaskPriority)}
                        className="rounded-lg border border-input bg-background px-2 py-2 text-sm font-normal normal-case text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                      >
                        {taskPriorities.map((priority) => (
                          <option key={priority} value={priority}>
                            {priority}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <label className="grid gap-1 text-xs font-semibold uppercase text-muted-foreground">
                    Due date
                    <input
                      type="date"
                      value={taskDueDate}
                      onChange={(event) => setTaskDueDate(event.target.value)}
                      className="rounded-lg border border-input bg-background px-3 py-2 text-sm font-normal normal-case text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                    />
                  </label>

                  <div className="grid grid-cols-2 gap-2">
                    <label className="grid gap-1 text-xs font-semibold uppercase text-muted-foreground">
                      Base rate
                      <input
                        type="number"
                        min="0"
                        value={taskBaseRate}
                        onChange={(event) => setTaskBaseRate(event.target.value)}
                        className="rounded-lg border border-input bg-background px-3 py-2 text-sm font-normal normal-case text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                      />
                    </label>
                    <label className="grid gap-1 text-xs font-semibold uppercase text-muted-foreground">
                      Bonus
                      <input
                        type="number"
                        min="0"
                        value={taskBonusAmount}
                        onChange={(event) => setTaskBonusAmount(event.target.value)}
                        className="rounded-lg border border-input bg-background px-3 py-2 text-sm font-normal normal-case text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                      />
                    </label>
                  </div>

                  <Button
                    onClick={() => void handleCreateRegionTask()}
                    disabled={
                      !selectedRegion ||
                      assigningTask ||
                      !taskAssigneeId.trim() ||
                      !taskTitle.trim() ||
                      !taskDescription.trim()
                    }
                  >
                    {assigningTask ? <Loader2 className="animate-spin" /> : <Save />}
                    Assign task
                  </Button>
                </div>

                <div className="mt-4 grid gap-2">
                  {tasks.length === 0 ? (
                    <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                      No tasks created for this page yet.
                    </p>
                  ) : (
                    tasks.map((task) => {
                      const isSelectedRegionTask = selectedRegionTasks.some((item) => item.id === task.id);
                      return (
                        <div
                          key={task.id}
                          className={`rounded-md border p-3 transition-colors ${
                            isSelectedRegionTask ? "border-[#9065d5] bg-[#f8f1ff]" : "bg-white"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h3 className="text-sm font-medium text-[#2f243a]">{task.title}</h3>
                              <p className="mt-1 text-xs text-muted-foreground">{task.assignedTo}</p>
                            </div>
                            <Badge variant={task.status === "TODO" ? "outline" : "secondary"}>{task.status}</Badge>
                          </div>
                          <p className="mt-2 text-sm text-muted-foreground">{task.description}</p>
                          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                            <span>{task.type}</span>
                            <span>{task.priority}</span>
                            {task.dueDate ? <span>Due {new Date(task.dueDate).toLocaleDateString()}</span> : null}
                            {task.regionId ? <span>Region {task.regionId}</span> : null}
                          </div>
                          <Button
                            className="mt-3 w-full"
                            size="sm"
                            variant="destructive"
                            onClick={() => void handleDeleteTask(task.id)}
                            disabled={deletingTaskId === task.id}
                          >
                            {deletingTaskId === task.id ? <Loader2 className="animate-spin" /> : <Trash />}
                            Delete
                          </Button>
                        </div>
                      );
                    })
                  )}
                </div>
              </section>

              <section className="rounded-lg border border-[#eadff6] bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-base font-semibold tracking-tight">Annotations</h2>
                  <Badge variant="secondary">{annotations.length}</Badge>
                </div>

                {annotations.length === 0 ? (
                  <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                    No annotations yet. Switch to Annotation mode and drag on the page.
                  </p>
                ) : (
                  <div className="grid gap-2">
                    {annotations.map((annotation) => {
                      const isSelected = selectedAnnotation?.id === annotation.id;
                      return (
                        <div
                          key={annotation.id}
                          className={`rounded-md border p-3 transition-colors ${
                            isSelected ? "border-[#ff7196] bg-[#fff3f8]" : "bg-white"
                          }`}
                        >
                          <button
                            type="button"
                            className="flex w-full items-center justify-between text-left"
                            onClick={() => setSelectedAnnotationId(annotation.id)}
                          >
                            <span className="flex items-center gap-2 text-sm font-medium">
                              <span
                                className="size-2 rounded-full"
                                style={{ backgroundColor: annotation.status === "RESOLVED" ? "#8a7a99" : "#ff7196" }}
                                aria-hidden="true"
                              />
                              Annotation
                            </span>
                            <Badge variant={annotation.status === "RESOLVED" ? "secondary" : "outline"}>
                              {annotation.status}
                            </Badge>
                          </button>
                          <p className="mt-2 text-sm text-muted-foreground">
                            {annotation.comment || "No comment"}
                          </p>
                          {annotation.regionId ? (
                            <p className="mt-1 text-[11px] text-muted-foreground">Linked region: {annotation.regionId}</p>
                          ) : null}
                          <div className="mt-2 grid grid-cols-4 gap-1 text-[11px] text-muted-foreground">
                            <span>x {annotation.x}</span>
                            <span>y {annotation.y}</span>
                            <span>w {annotation.width}</span>
                            <span>h {annotation.height}</span>
                          </div>
                          <div className="mt-3 grid grid-cols-2 gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                void handleUpdateAnnotationStatus(
                                  annotation.id,
                                  annotation.status === "RESOLVED" ? "OPEN" : "RESOLVED"
                                )
                              }
                            >
                              {annotation.status === "RESOLVED" ? "Reopen" : "Resolve"}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => void handleDeleteAnnotation(annotation.id)}
                            >
                              <Trash /> Delete
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            </TabsContent>

            <TabsContent value="comments" className="outline-none">
              <section className="rounded-lg border border-[#eadff6] bg-white p-4 shadow-sm">
                <Tabs defaultValue="page" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-4 bg-[#f1ebf8]">
                    <TabsTrigger value="page">Page</TabsTrigger>
                    <TabsTrigger value="annotation" disabled={!selectedAnnotationId}>
                      Annotation
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="page" className="outline-none">
                    {pageId && (
                      <CommentPanel
                        targetType="PAGE"
                        targetId={pageId}
                        pageId={pageId}
                        currentUser={currentUser}
                      />
                    )}
                  </TabsContent>

                  <TabsContent value="annotation" className="outline-none">
                    {pageId && selectedAnnotationId ? (
                      <CommentPanel
                        targetType="PAGE"
                        targetId={pageId}
                        pageId={pageId}
                        annotationId={selectedAnnotationId}
                        currentUser={currentUser}
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Select an annotation on the page to view/post comments.
                      </p>
                    )}
                  </TabsContent>
                </Tabs>
              </section>
            </TabsContent>
          </Tabs>
        </aside>
      </div>
    </div>
  );
}
