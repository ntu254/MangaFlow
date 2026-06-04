import { useAuth } from "@/shared/hooks/useAuth";
import {
  ArrowLeft,
  Loader2,
  RefreshCw,
  Save,
  Sparkles
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getPage, editorApprovePage, requestPageRevision, runAIBubbleDetect, runAIBubbleProcess, type Page } from "@/features/page/api/page";
import { getChapter } from "@/features/chapter/api/chapter";
import { fetchSeriesMembers } from "@/features/series/api/series";
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
  type Region,
  type RegionType
} from "@/features/region/api/region";
import {
  createTaskFromRegion,
  deleteTask,
  listTasks,
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
import { RegionOverlay, AnnotationOverlay, regionColorByType } from "../components/RegionOverlay";
import { RegionsTabContent, type WorkspaceToolMode } from "../components/RegionsTabContent";
import { TaskTabContent } from "../components/TaskTabContent";
import { CommentsTabContent } from "../components/CommentsTabContent";
import { AiTabContent } from "../components/AiTabContent";

type LoadState =
  | { status: "loading" }
  | { status: "ready"; page: Page; regions: Region[]; annotations: Annotation[]; tasks: Task[] }
  | { status: "error"; message: string };

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
  const [assistants, setAssistants] = useState<{ id: string; fullName: string; email: string }[]>([]);

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

      const page = await getPage(token, pageId);
      const [regions, annotations, allTasks, userResponse, chapter] = await Promise.all([
        listRegions(token, pageId),
        listAnnotations(token, pageId),
        listTasks(token),
        fetch(`${import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000/api"}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }).then(res => res.json().catch(() => ({ success: false }))),
        getChapter(token, page.chapterId)
      ]);

      if (userResponse && userResponse.success && userResponse.data) {
        setCurrentUser(userResponse.data.user);
      }

      setState({ status: "ready", page, regions, annotations, tasks: allTasks.filter((task) => task.pageId === pageId) });
      setSelectedRegionId(regions[0]?.id ?? null);
      setSelectedAnnotationId(annotations[0]?.id ?? null);

      try {
        const members = await fetchSeriesMembers(token, chapter.seriesId);
        const assistantUsers = members
          .filter((m) => m.userInfo?.systemRole === "ASSISTANT" && m.userInfo)
          .map((m) => ({
            id: m.userInfo!.id,
            fullName: m.userInfo!.fullName,
            email: m.userInfo!.email
          }));
        setAssistants(assistantUsers);
      } catch (err) {
        console.error("Failed to load series assistants", err);
      }
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
                <RegionsTabContent
                  isEditor={isEditor}
                  toolMode={toolMode}
                  setToolMode={setToolMode}
                  selectedType={selectedType}
                  setSelectedType={setSelectedType}
                  annotationComment={annotationComment}
                  setAnnotationComment={setAnnotationComment}
                  draftBox={draftBox}
                  setDraftBox={setDraftBox}
                  saving={saving}
                  handleSaveDraft={handleSaveDraft}
                  regions={regions}
                  filteredRegions={filteredRegions}
                  selectedRegionId={selectedRegionId}
                  setSelectedRegionId={setSelectedRegionId}
                  filterType={filterType}
                  setFilterType={setFilterType}
                  setActiveTab={setActiveTab}
                  setConfirmDelete={(confirm) => {
                    if (confirm) {
                      setConfirmDelete({ type: "region", id: confirm.id });
                    } else {
                      setConfirmDelete(null);
                    }
                  }}
                />
              </TabsContent>

              <TabsContent value="task" className="space-y-4 outline-none m-0">
                <TaskTabContent
                  isEditor={isEditor}
                  selectedRegion={selectedRegion}
                  taskAssigneeId={taskAssigneeId}
                  setTaskAssigneeId={setTaskAssigneeId}
                  assistants={assistants}
                  taskTitle={taskTitle}
                  setTaskTitle={setTaskTitle}
                  taskDescription={taskDescription}
                  setTaskDescription={setTaskDescription}
                  taskType={taskType}
                  setTaskType={setTaskType}
                  taskPriority={taskPriority}
                  setTaskPriority={setTaskPriority}
                  taskDueDate={taskDueDate}
                  setTaskDueDate={setTaskDueDate}
                  taskBaseRate={taskBaseRate}
                  setTaskBaseRate={setTaskBaseRate}
                  taskBonusAmount={taskBonusAmount}
                  setTaskBonusAmount={setTaskBonusAmount}
                  assigningTask={assigningTask}
                  handleCreateRegionTask={handleCreateRegionTask}
                  tasks={tasks}
                  selectedRegionTasks={selectedRegionTasks}
                  deletingTaskId={deletingTaskId}
                  setConfirmDelete={(confirm) => {
                    if (confirm) {
                      setConfirmDelete({ type: "task", id: confirm.id });
                    } else {
                      setConfirmDelete(null);
                    }
                  }}
                />
              </TabsContent>

              <TabsContent value="comments" className="space-y-4 outline-none m-0">
                <CommentsTabContent
                  annotations={annotations}
                  selectedAnnotation={selectedAnnotation}
                  selectedAnnotationId={selectedAnnotationId}
                  setSelectedAnnotationId={setSelectedAnnotationId}
                  handleUpdateAnnotationStatus={handleUpdateAnnotationStatus}
                  setConfirmDelete={(confirm) => {
                    if (confirm) {
                      setConfirmDelete({ type: "annotation", id: confirm.id });
                    } else {
                      setConfirmDelete(null);
                    }
                  }}
                  pageId={pageId}
                  currentUser={currentUser}
                />
              </TabsContent>

              {!isEditor && (
                <TabsContent value="ai" className="space-y-4 outline-none m-0">
                  <AiTabContent
                    aiDetecting={aiDetecting}
                    aiProcessing={aiProcessing}
                    handleAIDetect={handleAIDetect}
                    handleAIProcess={handleAIProcess}
                    aiError={aiError}
                    aiResult={aiResult}
                  />
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
