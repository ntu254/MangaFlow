import { useAuth } from "@/shared/hooks/useAuth";
import {
  ArrowLeft,
  BriefcaseBusiness,
  Crosshair,
  MessageSquare,
  Loader2,
  MousePointer2,
  RefreshCw,
  Save,
  Trash,
  Sparkles,
  ScanSearch,
  Eraser
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getPage, editorApprovePage, requestPageRevision, runAIBubbleDetect, runAIBubbleProcess, type Page } from "@/features/page/api/page";
import { CommentPanel } from "@/features/comment/components/CommentPanel";
import { useToast } from "@/shared/components/feedback/Toast";
import { ConfirmDialog } from "@/shared/components/feedback/ConfirmDialog";
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
  const isEditor = window.location.pathname.startsWith("/app/editor");
  const rolePath = isEditor ? "editor" : "mangaka";
  return (
    <div className="container max-w-5xl py-8">
      <div className="rounded-lg border bg-card p-6">
        <h1 className="text-2xl font-semibold tracking-tight">Page workspace unavailable</h1>
        <p className="mt-2 text-sm text-muted-foreground">The requested page could not be loaded.</p>
        {chapterId ? (
          <Link to={`/app/${rolePath}/chapters/${chapterId}/pages`} className="mt-4 inline-flex">
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
  const { toast } = useToast();

  const isEditor = window.location.pathname.startsWith("/app/editor");
  const rolePath = isEditor ? "editor" : "mangaka";

  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [activeTab, setActiveTab] = useState<string>("regions");
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
  const [actionLoading, setActionLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ id: string; systemRole: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ type: "region" | "annotation" | "task"; id: string } | null>(null);
  const [aiDetecting, setAiDetecting] = useState(false);
  const [aiProcessing, setAiProcessing] = useState(false);
  const [aiResult, setAiResult] = useState<{ detectCount?: number; processedUrl?: string } | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<RegionType | "ALL">("ALL");

  async function handleApprovePage() {
    if (!pageId) return;
    try {
      setActionLoading(true);
      setActionError(null);
      const token = await getToken({ template: "mangaflow" });
      if (!token) throw new Error("Not authenticated");
      const updated = await editorApprovePage(token, pageId);
      setState(prev => prev.status === "ready" ? { ...prev, page: updated } : prev);
      toast("Page approved successfully!", "success");
    } catch (err: any) {
      console.error(err);
      setActionError(err.message || "Failed to approve page");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleRequestPageRevision() {
    if (!pageId) return;
    try {
      setActionLoading(true);
      setActionError(null);
      const token = await getToken({ template: "mangaflow" });
      if (!token) throw new Error("Not authenticated");
      const updated = await requestPageRevision(token, pageId);
      setState(prev => prev.status === "ready" ? { ...prev, page: updated } : prev);
      toast("Page revision requested successfully!", "success");
    } catch (err: any) {
      console.error(err);
      setActionError(err.message || "Failed to request page revision");
    } finally {
      setActionLoading(false);
    }
  }


  const loadWorkspace = useCallback(async () => {
    if (!pageId) return;

    try {
      setState({ status: "loading" });
      const token = await getToken({ template: "mangaflow" });
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

  async function handleAIDetect() {
    if (!pageId) return;
    try {
      setAiDetecting(true);
      setAiError(null);
      setAiResult(null);
      const token = await getToken({ template: "mangaflow" });
      if (!token) throw new Error("Not authenticated");
      const result = await runAIBubbleDetect(token, pageId);
      const count: number = result?.data?.count ?? result?.count ?? 0;
      setAiResult({ detectCount: count });
      toast(`AI detected ${count} bubble region${count !== 1 ? "s" : ""}.`, "success");
      // Reload regions to show newly created AI regions
      await loadWorkspace();
    } catch (err: any) {
      console.error(err);
      setAiError(err.message || "AI bubble detection failed");
    } finally {
      setAiDetecting(false);
    }
  }

  async function handleAIProcess() {
    if (!pageId) return;
    try {
      setAiProcessing(true);
      setAiError(null);
      const token = await getToken({ template: "mangaflow" });
      if (!token) throw new Error("Not authenticated");
      const result = await runAIBubbleProcess(token, pageId);
      const processedUrl: string | undefined = result?.data?.processedFileUrl ?? result?.processedFileUrl;
      setAiResult(prev => ({ ...prev, processedUrl }));
      toast("AI bubble whitening complete. Page processed.", "success");
      // Reload workspace so the processedFileUrl is reflected in the canvas
      await loadWorkspace();
    } catch (err: any) {
      console.error(err);
      setAiError(err.message || "AI bubble processing failed");
    } finally {
      setAiProcessing(false);
    }
  }

  function getCanvasRect() {
    return canvasRef.current?.getBoundingClientRect() ?? null;
  }

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (isEditor) return;
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
      const token = await getToken({ template: "mangaflow" });
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

    try {
      setActionError(null);
      const token = await getToken({ template: "mangaflow" });
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
      const token = await getToken({ template: "mangaflow" });
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

    try {
      setActionError(null);
      const token = await getToken({ template: "mangaflow" });
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
      const token = await getToken({ template: "mangaflow" });
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

    try {
      setDeletingTaskId(taskId);
      setActionError(null);
      const token = await getToken({ template: "mangaflow" });
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
  const filteredRegions = regions.filter((region) => filterType === "ALL" || region.type === filterType);

  return (
    <div className="h-[calc(100vh-3.5rem)] min-h-0 bg-[#fff9fb] overflow-hidden flex flex-col">
      {/* Top Header/Actions */}
      <div className="shrink-0 flex items-center justify-between border-b border-[#eadff6] bg-white px-6 py-2.5">
        <div className="flex items-center gap-3 text-xs">
          <Link
            to={`/app/${rolePath}/chapters/${page.chapterId}/pages`}
            className="inline-flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors font-semibold"
          >
            <ArrowLeft className="size-3.5" /> Back
          </Link>
          <span className="text-[#eadff6]">|</span>
          <span className="font-bold text-[#2f243a]">Page {page.pageNumber} Workspace</span>
          <span className="text-[#eadff6]">|</span>
          <span className="text-[#5f5270] font-medium">Zoom 100%</span>
          <span className="text-[#eadff6]">|</span>
          <Badge variant="outline" className="text-[10px] font-medium border-[#eadff6] text-[#5f5270] bg-[#f8f1ff]/50 px-2 py-0.5 h-5">
            {page.status}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          {!isEditor && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => void handleAIDetect()}
                disabled={aiDetecting}
                className="h-8 text-xs border-[#eadff6] text-[#5f5270] hover:bg-[#f8f1ff]"
              >
                {aiDetecting ? <Loader2 className="size-3 animate-spin mr-1.5" /> : <Sparkles className="size-3 mr-1.5" />}
                Run AI
              </Button>
              <Button
                size="sm"
                onClick={() => void handleSaveDraft()}
                disabled={saving || !draftBox}
                className="h-8 text-xs bg-[#9065d5] text-white hover:bg-[#7f55c7]"
              >
                {saving ? <Loader2 className="size-3 animate-spin mr-1.5" /> : <Save className="size-3 mr-1.5" />}
                Save
              </Button>
            </>
          )}

          {isEditor && (
            <>
              <Button 
                variant="destructive" 
                size="sm"
                className="h-8 text-xs"
                onClick={handleRequestPageRevision} 
                disabled={actionLoading}
              >
                Request Revision
              </Button>
              <Button 
                size="sm"
                className="h-8 text-xs bg-[#9065d5] text-white hover:bg-[#7f55c7]"
                onClick={handleApprovePage} 
                disabled={actionLoading}
              >
                Approve Page
              </Button>
            </>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => void loadWorkspace()}
            className="h-8 text-xs border-[#eadff6] text-[#5f5270] hover:bg-[#f8f1ff]"
          >
            <RefreshCw className="size-3" />
          </Button>
        </div>
      </div>

      {/* Main Workspace Frame */}
      <div className="flex-1 min-h-0 flex flex-row overflow-hidden relative">
        {/* Left Canvas Panel */}
        <div className="flex-1 min-w-0 p-6 flex items-center justify-center overflow-y-auto bg-[#fff9fb]">
          <div className="w-full max-w-2xl rounded-xl border border-[#eadff6] bg-[#f7f3ff] p-4 shadow-sm">
            <div
              ref={canvasRef}
              className="relative mx-auto aspect-[3/4] max-h-[calc(100vh-12rem)] touch-none select-none overflow-hidden rounded-md bg-white shadow-inner"
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
        </div>

        {/* Right Sidebar Inspector */}
        <aside className="shrink-0 border-l border-[#eadff6] bg-white flex flex-col w-[360px] h-full min-h-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full h-full flex flex-col min-h-0">
            <div className="shrink-0 border-b border-[#eadff6] p-3 bg-slate-50/30">
              <TabsList className={`grid w-full ${!isEditor ? "grid-cols-4" : "grid-cols-3"}`}>
                <TabsTrigger value="regions">Regions</TabsTrigger>
                <TabsTrigger value="task">Task</TabsTrigger>
                <TabsTrigger value="comments">Comments</TabsTrigger>
                {!isEditor && <TabsTrigger value="ai" id="tab-ai-tools"><Sparkles className="size-3.5 mr-1" />AI</TabsTrigger>}
              </TabsList>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-3 space-y-4">
              <TabsContent value="regions" className="space-y-4 outline-none m-0">
                {!isEditor && (
                  <section className="rounded-lg border border-[#eadff6] bg-white p-3.5 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#2f243a]">Workspace tool</span>
                      <span className="text-[10px] text-muted-foreground">Drag on the page to draw</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant={toolMode === "REGION" ? "default" : "outline"}
                        onClick={() => {
                          setToolMode("REGION");
                          setDraftBox(null);
                        }}
                        className="text-xs h-8 px-2"
                      >
                        <Crosshair className="size-3.5 mr-1" /> Region
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={toolMode === "ANNOTATION" ? "default" : "outline"}
                        onClick={() => {
                          setToolMode("ANNOTATION");
                          setDraftBox(null);
                        }}
                        className="text-xs h-8 px-2"
                      >
                        <MessageSquare className="size-3.5 mr-1" /> Annotation
                      </Button>
                    </div>

                    {toolMode === "REGION" ? (
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Type</span>
                        <div className="flex flex-wrap gap-1">
                          {regionTypes.map((type) => (
                            <Button
                              key={type}
                              type="button"
                              size="xs"
                              variant={selectedType === type ? "default" : "outline"}
                              onClick={() => setSelectedType(type)}
                              className="text-[10px] h-7 px-2 font-medium"
                            >
                              <span
                                className="size-1.5 rounded-full mr-1.5 shrink-0"
                                style={{ backgroundColor: regionColorByType[type] }}
                                aria-hidden="true"
                              />
                              {type}
                            </Button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Review Comment</span>
                        <textarea
                          value={annotationComment}
                          onChange={(event) => setAnnotationComment(event.target.value)}
                          className="w-full min-h-12 rounded-md border border-input bg-background px-2.5 py-1.5 text-xs outline-none transition-colors focus-visible:border-ring"
                          placeholder="Dialogue bubble needs revision"
                          maxLength={1000}
                        />
                      </div>
                    )}

                    {draftBox ? (
                      <div className="rounded-lg border bg-[#f8f1ff]/20 p-2.5 text-xs space-y-2">
                        <div className="flex justify-between items-center text-[10px] font-mono text-[#5f5270]">
                          <span>Draft Coordinates</span>
                          <span>
                            {Math.round(draftBox.x * 1000)}, {Math.round(draftBox.y * 1000)} &middot; {Math.round(draftBox.width * 1000)} &times; {Math.round(draftBox.height * 1000)}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <Button onClick={() => void handleSaveDraft()} disabled={saving} size="xs" className="flex-1 bg-[#9065d5] hover:bg-[#7f55c7] text-[10px] h-7">
                            {saving ? <Loader2 className="animate-spin size-3 mr-1" /> : <Save className="size-3 mr-1" />} Save
                          </Button>
                          <Button variant="outline" size="xs" onClick={() => setDraftBox(null)} disabled={saving} className="flex-1 text-[10px] h-7">
                            Clear
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-md border border-dashed p-2 text-[10px] text-muted-foreground flex items-center justify-center gap-1.5">
                        <MousePointer2 className="size-3" />
                        No draft region selected
                      </div>
                    )}
                  </section>
                )}

                <section className="rounded-lg border border-[#eadff6] bg-white p-3.5 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xs font-bold text-[#2f243a]">Regions</h2>
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">{regions.length}</Badge>
                  </div>

                  {/* Type filters */}
                  <div className="flex items-center gap-1 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-thin">
                    <Button
                      size="xs"
                      variant={filterType === "ALL" ? "default" : "outline"}
                      onClick={() => setFilterType("ALL")}
                      className="text-[10px] h-6 px-2 rounded-full shrink-0 font-medium"
                    >
                      All
                    </Button>
                    {regionTypes.map((type) => (
                      <Button
                        key={type}
                        size="xs"
                        variant={filterType === type ? "default" : "outline"}
                        onClick={() => setFilterType(type)}
                        className="text-[10px] h-6 px-2 rounded-full shrink-0 font-medium"
                      >
                        <span
                          className="size-1 rounded-full mr-1 shrink-0"
                          style={{ backgroundColor: regionColorByType[type] }}
                        />
                        {type}
                      </Button>
                    ))}
                  </div>

                  {filteredRegions.length === 0 ? (
                    <p className="rounded-md border border-dashed p-4 text-xs text-muted-foreground text-center">
                      No regions match this filter.
                    </p>
                  ) : (
                    <div className="grid gap-2">
                      {filteredRegions.map((region) => {
                        const index = regions.findIndex((r) => r.id === region.id);
                        const isSelected = selectedRegion?.id === region.id;
                        return (
                          <div
                            key={region.id}
                            className={`rounded-lg border p-2.5 transition-all ${
                              isSelected ? "border-[#9065d5] bg-[#f8f1ff]/40 shadow-sm" : "border-[#eadff6]/50 bg-white hover:bg-[#fffcfd]"
                            }`}
                          >
                            <button
                              type="button"
                              className="flex w-full items-center justify-between text-left focus:outline-none"
                              onClick={() => setSelectedRegionId(region.id)}
                            >
                              <span className="flex items-center gap-1.5 text-xs font-semibold text-[#2f243a]">
                                <span
                                  className="size-1.5 rounded-full shrink-0"
                                  style={{ backgroundColor: regionColorByType[region.type] }}
                                  aria-hidden="true"
                                />
                                {region.type} #{index + 1}
                                <span className="text-muted-foreground font-normal">&middot; {region.source}</span>
                              </span>
                            </button>

                            {isSelected && (
                              <div className="mt-2 space-y-2">
                                <div className="text-[10px] font-mono text-[#5f5270]">
                                  {Math.round(region.x * 1000)}, {Math.round(region.y * 1000)} &middot; {Math.round(region.width * 1000)} &times; {Math.round(region.height * 1000)}
                                </div>
                                <div className="flex gap-1.5">
                                  <Button
                                    size="xs"
                                    variant="outline"
                                    onClick={() => setActiveTab("task")}
                                    className="text-[10px] h-6 flex-1 bg-white border-[#eadff6] text-[#5f5270] hover:bg-[#f8f1ff] py-0 px-2 font-medium"
                                  >
                                    Assign Task
                                  </Button>
                                  {!isEditor && (
                                    <Button
                                      size="xs"
                                      variant="destructive"
                                      onClick={() => setConfirmDelete({ type: "region", id: region.id })}
                                      className="text-[10px] h-6 px-2 py-0"
                                    >
                                      <Trash className="size-3" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>
              </TabsContent>

              <TabsContent value="task" className="space-y-4 outline-none m-0">
                <section className="rounded-lg border border-[#eadff6] bg-white p-3.5 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xs font-bold text-[#2f243a]">Assign Task</h2>
                  </div>

                  {!isEditor && (
                    <>
                      {selectedRegion ? (
                        <div className="rounded-lg border border-[#eadff6]/60 bg-[#f8f1ff]/10 p-2.5 space-y-1">
                          <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Selected region info</div>
                          <div className="flex items-center gap-1.5 text-xs font-bold text-[#2f243a]">
                            <span
                              className="size-1.5 rounded-full shrink-0"
                              style={{ backgroundColor: regionColorByType[selectedRegion.type] }}
                            />
                            {selectedRegion.type} ({selectedRegion.source})
                          </div>
                          <div className="text-[10px] font-mono text-[#5f5270]">
                            {Math.round(selectedRegion.x * 1000)}, {Math.round(selectedRegion.y * 1000)} &middot; {Math.round(selectedRegion.width * 1000)} &times; {Math.round(selectedRegion.height * 1000)}
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-md border border-dashed p-4 text-xs text-muted-foreground text-center">
                          <BriefcaseBusiness className="size-4 mx-auto mb-1 text-muted-foreground" />
                          Please select a region from the Regions tab to assign a task.
                        </div>
                      )}

                      <div className="grid gap-2.5">
                        <label className="grid gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          Assign assistant
                          <input
                            value={taskAssigneeId}
                            onChange={(event) => setTaskAssigneeId(event.target.value)}
                            disabled={!selectedRegion}
                            className="rounded-md border border-input bg-background px-2.5 py-1.5 text-xs font-normal normal-case text-foreground outline-none focus:border-ring"
                            placeholder="Assistant User ID"
                          />
                        </label>

                        <label className="grid gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          Task title
                          <input
                            value={taskTitle}
                            onChange={(event) => setTaskTitle(event.target.value)}
                            disabled={!selectedRegion}
                            className="rounded-md border border-input bg-background px-2.5 py-1.5 text-xs font-normal normal-case text-foreground outline-none focus:border-ring"
                            placeholder="e.g. Clean selected bubble"
                            maxLength={160}
                          />
                        </label>

                        <label className="grid gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          Description
                          <textarea
                            value={taskDescription}
                            onChange={(event) => setTaskDescription(event.target.value)}
                            disabled={!selectedRegion}
                            className="min-h-12 rounded-md border border-input bg-background px-2.5 py-1.5 text-xs font-normal normal-case text-foreground outline-none focus:border-ring"
                            placeholder="Clean edges and prepare final ink layer"
                            maxLength={1000}
                          />
                        </label>

                        <div className="grid grid-cols-2 gap-2">
                          <label className="grid gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            Type
                            <select
                              value={taskType}
                              onChange={(event) => setTaskType(event.target.value as TaskType)}
                              disabled={!selectedRegion}
                              className="rounded-md border border-input bg-background px-1.5 py-1.5 text-xs font-normal normal-case text-foreground outline-none focus:border-ring"
                            >
                              {taskTypes.map((type) => (
                                <option key={type} value={type}>
                                  {type}
                                </option>
                              ))}
                            </select>
                          </label>

                          <label className="grid gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            Priority
                            <select
                              value={taskPriority}
                              onChange={(event) => setTaskPriority(event.target.value as TaskPriority)}
                              disabled={!selectedRegion}
                              className="rounded-md border border-input bg-background px-1.5 py-1.5 text-xs font-normal normal-case text-foreground outline-none focus:border-ring"
                            >
                              {taskPriorities.map((priority) => (
                                <option key={priority} value={priority}>
                                  {priority}
                                </option>
                              ))}
                            </select>
                          </label>
                        </div>

                        <label className="grid gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          Due date
                          <input
                            type="date"
                            value={taskDueDate}
                            onChange={(event) => setTaskDueDate(event.target.value)}
                            disabled={!selectedRegion}
                            className="rounded-md border border-input bg-background px-2.5 py-1.5 text-xs font-normal normal-case text-foreground outline-none focus:border-ring"
                          />
                        </label>

                        <div className="grid grid-cols-2 gap-2">
                          <label className="grid gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            Base rate
                            <input
                              type="number"
                              min="0"
                              value={taskBaseRate}
                              onChange={(event) => setTaskBaseRate(event.target.value)}
                              disabled={!selectedRegion}
                              className="rounded-md border border-input bg-background px-2.5 py-1.5 text-xs font-normal normal-case text-foreground outline-none focus:border-ring"
                            />
                          </label>
                          <label className="grid gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            Bonus
                            <input
                              type="number"
                              min="0"
                              value={taskBonusAmount}
                              onChange={(event) => setTaskBonusAmount(event.target.value)}
                              disabled={!selectedRegion}
                              className="rounded-md border border-input bg-background px-2.5 py-1.5 text-xs font-normal normal-case text-foreground outline-none focus:border-ring"
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
                          className="mt-2 bg-[#9065d5] text-white hover:bg-[#7f55c7] text-xs h-8"
                        >
                          {assigningTask ? <Loader2 className="animate-spin size-3.5 mr-1" /> : <Save className="size-3.5 mr-1" />}
                          Assign task
                        </Button>
                      </div>
                    </>
                  )}
                </section>

                <section className="rounded-lg border border-[#eadff6] bg-white p-3.5 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xs font-bold text-[#2f243a]">Tasks List</h2>
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">{tasks.length}</Badge>
                  </div>

                  <div className="grid gap-2">
                    {tasks.length === 0 ? (
                      <p className="rounded-md border border-dashed p-4 text-xs text-muted-foreground text-center">
                        No tasks created for this page yet.
                      </p>
                    ) : (
                      tasks.map((task) => {
                        const isSelectedRegionTask = selectedRegionTasks.some((item) => item.id === task.id);
                        return (
                          <div
                            key={task.id}
                            className={`rounded-lg border p-2.5 transition-colors ${
                              isSelectedRegionTask ? "border-[#9065d5] bg-[#f8f1ff]/30" : "bg-white"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h3 className="text-xs font-semibold text-[#2f243a]">{task.title}</h3>
                                <p className="mt-0.5 text-[9px] text-muted-foreground">
                                  {task.assignedToUserInfo?.fullName || task.assignedToUserInfo?.email || task.assignedTo}
                                </p>
                              </div>
                              <Badge variant={task.status === "TODO" ? "outline" : "secondary"} className="text-[9px] px-1.5 py-0 h-4">{task.status}</Badge>
                            </div>
                            <p className="mt-1.5 text-xs text-muted-foreground leading-normal">{task.description}</p>
                            <div className="mt-2 flex flex-wrap gap-x-2 gap-y-0.5 text-[9px] text-[#5f5270] font-medium">
                              <span>{task.type}</span>
                              <span>&middot;</span>
                              <span>{task.priority}</span>
                              {task.dueDate ? (
                                <>
                                  <span>&middot;</span>
                                  <span>Due {new Date(task.dueDate).toLocaleDateString()}</span>
                                </>
                              ) : null}
                            </div>
                            {!isEditor && (
                              <Button
                                className="mt-3 w-full text-xs h-7 py-0"
                                size="sm"
                                variant="destructive"
                                onClick={() => setConfirmDelete({ type: "task", id: task.id })}
                                disabled={deletingTaskId === task.id}
                              >
                                {deletingTaskId === task.id ? <Loader2 className="animate-spin size-3 mr-1" /> : <Trash className="size-3 mr-1" />}
                                Delete
                              </Button>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </section>
              </TabsContent>

              <TabsContent value="comments" className="space-y-4 outline-none m-0">
                <section className="rounded-lg border border-[#eadff6] bg-white p-3.5 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xs font-bold text-[#2f243a]">Review Annotations</h2>
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">{annotations.length}</Badge>
                  </div>

                  {annotations.length === 0 ? (
                    <p className="rounded-md border border-dashed p-4 text-xs text-muted-foreground text-center">
                      No annotations yet.
                    </p>
                  ) : (
                    <div className="grid gap-2">
                      {annotations.map((annotation) => {
                        const isSelected = selectedAnnotation?.id === annotation.id;
                        return (
                          <div
                            key={annotation.id}
                            className={`rounded-lg border p-2.5 transition-colors ${
                              isSelected ? "border-[#ff7196] bg-[#fff3f8]/50" : "bg-white"
                            }`}
                          >
                            <button
                              type="button"
                              className="flex w-full items-center justify-between text-left focus:outline-none"
                              onClick={() => setSelectedAnnotationId(annotation.id)}
                            >
                              <span className="flex items-center gap-1.5 text-xs font-semibold text-[#2f243a]">
                                <span
                                  className="size-1.5 rounded-full"
                                  style={{ backgroundColor: annotation.status === "RESOLVED" ? "#8a7a99" : "#ff7196" }}
                                  aria-hidden="true"
                                />
                                Annotation
                              </span>
                              <Badge variant={annotation.status === "RESOLVED" ? "secondary" : "outline"} className="text-[9px] px-1.5 py-0 h-4">
                                {annotation.status}
                              </Badge>
                            </button>
                            <p className="mt-1.5 text-xs text-[#5f5270] leading-normal">
                              {annotation.comment || "No comment description"}
                            </p>
                            {annotation.regionId ? (
                              <p className="mt-1 text-[9px] text-muted-foreground">Linked region: {annotation.regionId.slice(-4)}</p>
                            ) : null}
                            <div className="mt-1.5 font-mono text-[9px] text-muted-foreground">
                              {Math.round(annotation.x * 1000)}, {Math.round(annotation.y * 1000)} &middot; {Math.round(annotation.width * 1000)} &times; {Math.round(annotation.height * 1000)}
                            </div>
                            <div className="mt-2 grid grid-cols-2 gap-2">
                              <Button
                                size="xs"
                                variant="outline"
                                className="h-6 text-[10px] py-0"
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
                                size="xs"
                                variant="destructive"
                                className="h-6 text-[10px] py-0"
                                onClick={() => setConfirmDelete({ type: "annotation", id: annotation.id })}
                              >
                                <Trash className="size-2.5 mr-1" /> Delete
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>

                <section className="rounded-lg border border-[#eadff6] bg-white p-3.5 shadow-sm">
                  <Tabs defaultValue="page" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-3 bg-[#f1ebf8]">
                      <TabsTrigger value="page" className="text-xs py-1 h-7">Page</TabsTrigger>
                      <TabsTrigger value="annotation" disabled={!selectedAnnotationId} className="text-xs py-1 h-7">
                        Annotation
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="page" className="outline-none m-0">
                      {pageId && (
                        <CommentPanel
                          targetType="PAGE"
                          targetId={pageId}
                          pageId={pageId}
                          currentUser={currentUser}
                        />
                      )}
                    </TabsContent>

                    <TabsContent value="annotation" className="outline-none m-0">
                      {pageId && selectedAnnotationId ? (
                        <CommentPanel
                          targetType="PAGE"
                          targetId={pageId}
                          pageId={pageId}
                          annotationId={selectedAnnotationId}
                          currentUser={currentUser}
                        />
                      ) : (
                        <p className="text-[11px] text-muted-foreground text-center py-4">
                          Select an annotation on the page to view/post comments.
                        </p>
                      )}
                    </TabsContent>
                  </Tabs>
                </section>
              </TabsContent>

              {!isEditor && (
                <TabsContent value="ai" className="space-y-4 outline-none m-0">
                  <section className="rounded-lg border border-[#eadff6] bg-white p-3.5 shadow-sm space-y-3">
                    <div className="flex items-start gap-3 mb-2">
                      <div className="rounded-lg bg-[#f8f1ff] p-2 text-[#9065d5] shrink-0">
                        <Sparkles className="size-5" />
                      </div>
                      <div>
                        <h2 className="text-xs font-bold text-[#2f243a]">AI Bubble Tools</h2>
                        <p className="mt-0.5 text-[10px] leading-normal text-muted-foreground">
                          Auto-detect speech bubbles and whiten them using AI.
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-2">
                      <Button
                        id="btn-ai-detect"
                        className="w-full justify-start gap-2 h-9 text-xs"
                        variant="outline"
                        onClick={() => void handleAIDetect()}
                        disabled={aiDetecting || aiProcessing}
                      >
                        {aiDetecting ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <ScanSearch className="size-4" />
                        )}
                        {aiDetecting ? "Detecting bubbles…" : "Detect Bubbles"}
                      </Button>

                      <Button
                        id="btn-ai-process"
                        className="w-full justify-start gap-2 h-9 text-xs bg-[#9065d5] text-white hover:bg-[#7f55c7]"
                        onClick={() => void handleAIProcess()}
                        disabled={aiDetecting || aiProcessing}
                      >
                        {aiProcessing ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <Eraser className="size-4" />
                        )}
                        {aiProcessing ? "Whitening bubbles…" : "Whiten Bubbles"}
                      </Button>
                    </div>

                    {aiError && (
                      <div className="mt-2 rounded-md border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive">
                        {aiError}
                      </div>
                    )}

                    {aiResult && !aiError && (
                      <div className="mt-2 rounded-md border border-[#eadff6] bg-[#f8f1ff] p-2.5 text-xs text-[#2f243a] space-y-1">
                        {aiResult.detectCount !== undefined && (
                          <p>✓ Detected <strong>{aiResult.detectCount}</strong> bubble region{aiResult.detectCount !== 1 ? "s" : ""}.</p>
                        )}
                        {aiResult.processedUrl && (
                          <p>✓ Processed image ready — canvas updated.</p>
                        )}
                      </div>
                    )}

                    <p className="mt-2 text-[10px] text-muted-foreground leading-normal">
                      <strong>Detect</strong> scans the page and saves bubble regions (source: AI).<br />
                      <strong>Whiten</strong> applies inpainting to produce a clean processed image.
                    </p>
                  </section>
                </TabsContent>
              )}
            </div>
          </Tabs>
        </aside>
      </div>

      <ConfirmDialog
        open={confirmDelete !== null}
        title={`Delete ${confirmDelete?.type === "region" ? "Region" : confirmDelete?.type === "annotation" ? "Annotation" : "Task"}`}
        description={`Are you sure you want to delete this ${confirmDelete?.type}? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
        onConfirm={() => {
          if (!confirmDelete) return;
          if (confirmDelete.type === "region") handleDeleteRegion(confirmDelete.id);
          else if (confirmDelete.type === "annotation") handleDeleteAnnotation(confirmDelete.id);
          else handleDeleteTask(confirmDelete.id);
          setConfirmDelete(null);
        }}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}
