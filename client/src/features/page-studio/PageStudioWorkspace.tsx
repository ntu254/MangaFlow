import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronLeft, FileImage, Info, Keyboard, Loader2 } from "lucide-react";
import type { Region, Task } from "@/entities";
import { useFileObjectUrl } from "@/shared/queries/useFileObjectUrl";
import { useChapterPages } from "@/shared/queries/useChapterPages";
import { usePageStudio } from "@/shared/queries/usePageStudio";
import { BottomPageCarousel } from "./BottomPageCarousel";
import { HeaderToolBar } from "./HeaderToolBar";
import { InspectorDrawer } from "./InspectorDrawer";
import { PageStudioCanvas, IMG_H, IMG_W } from "./PageStudioCanvas";
import { useStudioStore, type RegionTask } from "./useStudioStore";

type ApiErrorLike = {
  message?: string;
  response?: {
    status?: number;
    data?: {
      message?: string;
    };
  };
};

type PageStudioWorkspaceProps = {
  pageId: string;
  seriesId?: string;
  assistantTask?: Task;
  backLabel?: string;
  backTo?: "/app/series/$id" | "/app/assistant/tasks";
  backParams?: { id: string };
  embedded?: boolean;
};

function getFileAssetId(asset: unknown): string | undefined {
  if (!asset) return undefined;
  if (typeof asset === "string") return asset;
  if (typeof asset === "object") {
    const record = asset as { _id?: string; id?: string };
    return record._id ?? record.id;
  }
  return undefined;
}

function getAssignedRegions(regions: Region[], task?: Task) {
  if (!task) return regions;
  if (task.regionId) {
    return regions.filter((region) => region.id === task.regionId);
  }
  return regions.filter(
    (region) => region.status !== "ai-suggested" && region.status !== "rejected",
  );
}

function mapTasksByRegion(tasks: Task[] = []): Record<string, RegionTask> {
  return tasks.reduce<Record<string, RegionTask>>((acc, task) => {
    if (!task.regionId) return acc;
    if (task.status === "cancelled" || task.status === "rejected") return acc;
    if (acc[task.regionId]) return acc;

    acc[task.regionId] = {
      taskId: task.id,
      taskType: task.title ?? task.type,
      assigneeId: task.assigneeId,
      assigneeName: task.assigneeName,
      priority: task.priority ?? "medium",
      dueDate: task.deadline,
      status: task.status,
      title: task.title,
    };
    return acc;
  }, {});
}

function normalizePageStatusForCarousel(status: string) {
  return status.toLowerCase().replace(/_/g, "-");
}

function isObjectId(value?: string): value is string {
  return typeof value === "string" && /^[0-9a-fA-F]{24}$/.test(value);
}

export function PageStudioWorkspace({
  pageId,
  seriesId,
  assistantTask,
  backLabel = "Back to Chapter",
  backTo = "/app/series/$id",
  backParams,
  embedded = false,
}: PageStudioWorkspaceProps) {
  const [showShortcuts, setShowShortcuts] = useState(false);
  const isAssistantWorkspace = Boolean(assistantTask);

  const {
    viewport,
    showRegions,
    setShowRegions,
    compareOriginal,
    setCompareOriginal,
    setActiveTool,
    setSelectedRegionId,
    setActiveTab,
    resetForPage,
    replaceRegionTasks,
  } = useStudioStore();

  const {
    data: studioData,
    isLoading: isLoadingStudio,
    error: studioError,
  } = usePageStudio(pageId);

  const chapterIdForPages = studioData?.chapter?.id ?? studioData?.page?.chapterId;
  const { data: chapterPages = [] } = useChapterPages(
    !isAssistantWorkspace && isObjectId(chapterIdForPages) ? chapterIdForPages : undefined,
  );

  useEffect(() => {
    resetForPage(pageId);
  }, [pageId, resetForPage]);

  useEffect(() => {
    if (!isAssistantWorkspace) return;
    setActiveTool("select");
    setActiveTab("inspect");
    if (assistantTask?.regionId) {
      setSelectedRegionId(assistantTask.regionId);
    }
  }, [
    assistantTask?.regionId,
    isAssistantWorkspace,
    setActiveTab,
    setActiveTool,
    setSelectedRegionId,
  ]);

  useEffect(() => {
    if (!studioData) return;
    replaceRegionTasks(mapTasksByRegion(studioData.tasks));
  }, [replaceRegionTasks, studioData]);

  const shouldLoadPageImages =
    studioData?.page?.status !== "PROCESSING_FAILED" &&
    studioData?.page?.status !== "PENDING" &&
    studioData?.page?.status !== "UPLOADING" &&
    studioData?.page?.status !== "PROCESSING";
  const workingFileAssetId = shouldLoadPageImages
    ? getFileAssetId(studioData?.workingFileAsset)
    : undefined;
  const originalFileAssetId = shouldLoadPageImages
    ? getFileAssetId(studioData?.originalFileAsset)
    : undefined;

  const { data: workingImageUrl, error: workingImageError } = useFileObjectUrl(workingFileAssetId);
  const { data: originalImageUrl } = useFileObjectUrl(originalFileAssetId);
  const frameClass = "h-full min-h-0";

  if (isLoadingStudio) {
    return (
      <div
        suppressHydrationWarning
        className={`flex ${frameClass} w-full items-center justify-center bg-background text-foreground/50`}
      >
        <Loader2 className="mr-2 h-6 w-6 animate-spin" />
        <span className="text-sm font-semibold uppercase tracking-wide">
          Loading Page Studio...
        </span>
      </div>
    );
  }

  if (studioError) {
    const apiError = studioError as ApiErrorLike;
    const status = apiError.response?.status;
    const message =
      status === 403 || status === 401
        ? "You do not have access to this Page Studio."
        : apiError.response?.data?.message || apiError.message || "Failed to load Page Studio.";
    return (
      <div
        suppressHydrationWarning
        className={`flex ${frameClass} w-full items-center justify-center bg-background`}
      >
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-6 text-sm text-rose-400">
          {message}
        </div>
      </div>
    );
  }

  if (!studioData) return null;

  const { page, aiResults } = studioData;
  const effectiveSeriesId = seriesId ?? studioData.chapter?.seriesId;
  const effectiveChapterId = studioData.chapter?.id ?? page.chapterId;
  const visibleRegions = getAssignedRegions(studioData.regions, assistantTask);
  const carouselPages = (chapterPages.length > 0 ? chapterPages : [page]).map((chapterPage) => ({
    id: chapterPage.id,
    chapterId: chapterPage.chapterId,
    order: chapterPage.pageNumber ?? ("order" in chapterPage ? chapterPage.order : 1),
    pageNumber: chapterPage.pageNumber,
    status: normalizePageStatusForCarousel(chapterPage.status) as typeof page.status,
    originalFileAssetId: chapterPage.originalFileAssetId ?? "",
    workingFileAssetId: chapterPage.workingFileAssetId ?? "",
    thumbnailFileAssetId: chapterPage.thumbnailFileAssetId ?? "",
  }));

  if (page.status === "PENDING" || page.status === "UPLOADING" || page.status === "PROCESSING") {
    return (
      <div
        suppressHydrationWarning
        className={`flex ${frameClass} w-full items-center justify-center bg-background`}
      >
        <div className="flex flex-col items-center rounded-xl border border-sky-500/20 bg-sky-500/5 p-8">
          <Loader2 className="mb-4 h-8 w-8 animate-spin text-sky-400" />
          <span className="font-semibold tracking-wide text-sky-400">Processing assets...</span>
        </div>
      </div>
    );
  }

  if (page.status === "PROCESSING_FAILED") {
    return (
      <div
        suppressHydrationWarning
        className={`flex ${frameClass} w-full items-center justify-center bg-background`}
      >
        <div className="max-w-sm rounded-xl border border-rose-500/20 bg-rose-500/5 p-8 text-center">
          <span className="mb-2 block font-bold text-rose-400">Page processing failed.</span>
          <span className="text-sm text-rose-400/80">Retry upload or replace page.</span>
        </div>
      </div>
    );
  }

  if (!workingFileAssetId) {
    return (
      <div
        suppressHydrationWarning
        className={`flex ${frameClass} w-full items-center justify-center bg-background`}
      >
        <div className="max-w-sm rounded-xl border border-amber-500/20 bg-amber-500/5 p-8 text-center">
          <span className="mb-2 block font-bold text-amber-400">Missing working image.</span>
          <span className="text-sm text-amber-400/80">Retry processing or contact admin.</span>
        </div>
      </div>
    );
  }

  if (workingImageError) {
    const apiError = workingImageError as ApiErrorLike;
    const message =
      apiError.response?.data?.message ||
      "Working image file is missing or unavailable. Re-upload this page asset.";
    return (
      <div
        suppressHydrationWarning
        className={`flex ${frameClass} w-full items-center justify-center bg-background`}
      >
        <div className="max-w-sm rounded-xl border border-amber-500/20 bg-amber-500/5 p-8 text-center">
          <span className="mb-2 block font-bold text-amber-400">Working image unavailable.</span>
          <span className="text-sm text-amber-400/80">{message}</span>
        </div>
      </div>
    );
  }

  const zoomPct = Math.round(viewport.scale * 100);
  const defaultBackParams = { id: effectiveSeriesId ?? page.chapterId };

  return (
    <div
      suppressHydrationWarning
      className={`flex ${frameClass} flex-col overflow-hidden bg-background`}
    >
      <div className="relative flex h-12 shrink-0 items-center border-b border-border bg-background px-4">
        <div className="flex min-w-0 items-center gap-3">
          {backTo === "/app/assistant/tasks" ? (
            <Link
              to="/app/assistant/tasks"
              className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] text-foreground/70 transition-colors hover:bg-foreground/5 hover:text-foreground"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              {backLabel}
            </Link>
          ) : (
            <Link
              to="/app/series/$id"
              params={backParams ?? defaultBackParams}
              className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] text-foreground/70 transition-colors hover:bg-foreground/5 hover:text-foreground"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              {backLabel}
            </Link>
          )}

          <span className="h-3.5 w-px bg-border" />

          <div className="flex min-w-0 items-center gap-1.5">
            <FileImage className="h-3.5 w-3.5 shrink-0 text-foreground/60" />
            <span className="text-[12px] font-bold text-foreground">
              Page {page.pageNumber || page.order}
            </span>
            {assistantTask && (
              <span className="ml-1 truncate text-[11px] text-foreground/50">
                {assistantTask.title ?? `${assistantTask.type} task`}
              </span>
            )}
            <span className="ml-1 inline-flex items-center rounded border border-border bg-foreground/5 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-foreground/60">
              {page.status}
            </span>
          </div>
        </div>

        <div className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
          <HeaderToolBar readOnly={isAssistantWorkspace} />
        </div>

        <div className="ml-auto flex items-center gap-3">
          {assistantTask && (
            <span className="rounded border border-amber-500/25 bg-amber-500/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-300">
              Assigned regions only
            </span>
          )}
          <button
            onClick={() => setShowShortcuts((s) => !s)}
            className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] text-foreground/70 transition-colors hover:bg-foreground/5 hover:text-foreground"
          >
            <Keyboard className="h-3.5 w-3.5" />
            Shortcuts
          </button>
        </div>
      </div>

      {showShortcuts && (
        <div className="absolute right-6 top-16 z-50 w-64 rounded-xl border border-border bg-card p-4 text-[11px] text-foreground/60 shadow-2xl">
          <div className="mb-2 flex items-center gap-1.5 font-semibold text-foreground/80">
            <Info className="h-3.5 w-3.5" /> Keyboard Shortcuts
          </div>
          {[
            ["V", "Select tool"],
            ["H", "Pan tool"],
            ["Space + Drag", "Pan"],
            ["Middle drag", "Pan"],
            ["Ctrl + 0", "Fit to screen"],
            ["Ctrl + +/-", "Zoom in/out"],
            ["Wheel", "Zoom at pointer"],
          ].map(([key, desc]) => (
            <div key={key} className="flex justify-between py-0.5">
              <kbd className="rounded bg-foreground/10 px-1.5 py-0.5 font-mono text-[10px] text-foreground/60">
                {key}
              </kbd>
              <span className="text-foreground/40">{desc}</span>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {!isAssistantWorkspace && (
          <BottomPageCarousel pages={carouselPages} currentPageId={pageId} />
        )}
        <div className="flex flex-1 flex-col overflow-hidden border-r border-border">
          <div className="relative flex flex-1 flex-col overflow-hidden">
            <PageStudioCanvas
              regions={visibleRegions}
              pageId={pageId}
              seriesId={effectiveSeriesId}
              chapterId={effectiveChapterId}
              assistants={isAssistantWorkspace ? [] : studioData.collaborators}
              onSelectRegion={(id) => setSelectedRegionId(id)}
              workingImageUrl={workingImageUrl}
              originalImageUrl={originalImageUrl}
              readOnly={isAssistantWorkspace}
            />
          </div>

          <div className="flex h-7 shrink-0 items-center gap-4 border-t border-border bg-background px-4 font-mono text-[10px] text-foreground/35">
            <span>
              Zoom: <span className="text-foreground/60">{zoomPct}%</span>
            </span>
            <span className="h-3 w-px bg-border" />
            <span>
              Pos:{" "}
              <span className="text-foreground/60">
                ({Math.round(viewport.x)}, {Math.round(viewport.y)})
              </span>
            </span>
            <span className="h-3 w-px bg-border" />
            <span>
              Regions: <span className="text-foreground/60">{visibleRegions.length}</span>
            </span>
            <span className="h-3 w-px bg-border" />
            <span>
              Canvas:{" "}
              <span className="text-foreground/60">
                {IMG_W} x {IMG_H}px
              </span>
            </span>
            <span className="h-3 w-px bg-border" />

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowRegions(!showRegions)}
                className={`rounded border px-1.5 py-0.5 text-[8px] font-bold uppercase transition-all ${
                  showRegions
                    ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                    : "border-border bg-foreground/5 text-foreground/45 hover:text-foreground/70"
                }`}
              >
                Regions: {showRegions ? "On" : "Off"}
              </button>
              <button
                onClick={() => setCompareOriginal(!compareOriginal)}
                className={`rounded border px-1.5 py-0.5 text-[8px] font-bold uppercase transition-all ${
                  compareOriginal
                    ? "border-sky-500/20 bg-sky-500/10 text-sky-400"
                    : "border-border bg-foreground/5 text-foreground/45 hover:text-foreground/70"
                }`}
              >
                Compare Sketch: {compareOriginal ? "On" : "Off"}
              </button>
            </div>

            <div className="ml-auto flex items-center gap-3">
              <span className="capitalize text-foreground/30">{page.status}</span>
            </div>
          </div>
        </div>

        <InspectorDrawer
          regions={visibleRegions}
          results={isAssistantWorkspace ? [] : aiResults}
          pageId={pageId}
          readOnly={isAssistantWorkspace}
          assistantTask={assistantTask}
          originalFileAssetId={originalFileAssetId}
          workingFileAssetId={workingFileAssetId}
        />
      </div>
    </div>
  );
}
