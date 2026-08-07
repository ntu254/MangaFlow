import {
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import { apiRequest } from "@/shared/api/client";
import { assistantAiApi } from "@/shared/api/services";
import { useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Chapter, ProductionSeries } from "@/entities/series/model/series-types";
import type { Role, User } from "@/shared/auth";
import { useStudio } from "../model/studio-store";
import {
  mapApiError,
  useAddressCommentMutation,
  useCommentsQuery,
  useCreateCommentMutation,
  useCreateStudioRegionMutation,
  useCreateStudioTaskMutation,
  useAssignPageMutation,
  usePageAssignmentActionMutation,
  useStudioRegionsQuery,
  useStudioTasksQuery,
  useSeriesMembersQuery,
  useActiveRateTableQuery,
  useResolveCommentMutation,
  useReopenCommentMutation,
  useReplyCommentMutation,
  useUploadPageMutation,
  useDeleteStudioRegionMutation,
  useSubmissionReviewMutation,
  useTaskSubmissionsQuery,
  chapterKeys,
  seriesKeys,
  studioKeys,
} from "../../api/series-queries";
import { uploadFileToR2 } from "@/shared/lib/r2-upload";
import { type StudioSelection, type StudioTool } from "@/entities/series/model/studio-types";
import {
  assistantVisiblePageIds,
  canResolveStudioComment,
  filterStudioChaptersForRole,
  filterStudioCommentsForRole,
  filterStudioRegionsForRole,
  filterStudioTasksForRole,
  getStudioPermissions,
  isStudioToolAllowed,
} from "../model/studio-permissions";
import { StudioTopBar } from "./studio/studio-top-bar";
import { PageLayersPanel } from "./studio/page-layers-panel";
import { BottomStudioToolbar } from "./studio/bottom-studio-toolbar";
import { StudioInspector } from "./studio/studio-inspector";
import { CreateTaskDialog } from "./studio/create-task-dialog";
import { toTaskRatePayload } from "../model/task-payload";
import { deriveTaskStudioSubmissionState } from "@/entities/task/model/submission-state";

const KonvaPageCanvas = lazy(() => import("./studio/konva-page-canvas"));

type Props = {
  series: ProductionSeries;
  chapters: Chapter[];
  user: User;
  onBack?: () => void;
  initialChapterId?: string;
  initialPageId?: string;
  initialTaskId?: string;
  initialRegionId?: string;
};

export function StudioTab({
  series,
  chapters,
  user,
  onBack,
  initialChapterId,
  initialPageId,
  initialTaskId,
  initialRegionId,
}: Props) {
  const basePermissions = useMemo(() => getStudioPermissions(user, series), [user, series]);
  const [chapterId, setChapterId] = useState<string | undefined>(
    initialChapterId ?? chapters[0]?.id,
  );
  const [pageId, setPageId] = useState<string | undefined>(initialPageId);
  const [tool, setTool] = useState<StudioTool>("select");
  const [zoom, setZoom] = useState(1);
  const [selection, setSelection] = useState<StudioSelection>({ kind: "none" });
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [panTarget, setPanTarget] = useState<{ x: number; y: number; nonce: number } | null>(null);
  const [highlightCommentId, setHighlightCommentId] = useState<string | null>(null);

  const setRegionHidden = useStudio((s) => s.setRegionHidden);
  const setTaskHidden = useStudio((s) => s.setTaskHidden);
  const setCommentHidden = useStudio((s) => s.setCommentHidden);
  const setRegionLocked = useStudio((s) => s.setRegionLocked);
  const setTaskLocked = useStudio((s) => s.setTaskLocked);
  const setCommentLocked = useStudio((s) => s.setCommentLocked);
  const bulkSetHidden = useStudio((s) => s.bulkSetHidden);
  const bulkSetLocked = useStudio((s) => s.bulkSetLocked);
  const reorderRegionsOnPage = useStudio((s) => s.reorderRegionsOnPage);
  const reorderTasksOnPage = useStudio((s) => s.reorderTasksOnPage);
  const reorderCommentsOnPage = useStudio((s) => s.reorderCommentsOnPage);

  const taskFilters =
    basePermissions.mode === "assistant"
      ? { seriesId: series.id, assigneeId: user.id }
      : { chapterId: chapterId ?? "" };
  const broadRead = ["assistant", "board", "admin"].includes(basePermissions.mode);
  const regionFilters = broadRead ? { seriesId: series.id } : { chapterId: chapterId ?? "" };
  const commentFilters = broadRead ? { seriesId: series.id } : { chapterId: chapterId ?? "" };

  const { data: allRegionsRaw = [] } = useStudioRegionsQuery(regionFilters);
  const { data: allTasksRaw = [], isLoading: tasksLoading } = useStudioTasksQuery(taskFilters);
  const { data: allCommentsRaw = [] } = useCommentsQuery(commentFilters);
  const { data: seriesMembers = [] } = useSeriesMembersQuery(series.id);
  const { data: activeRates = [] } = useActiveRateTableQuery({
    enabled: basePermissions.canCreateTask,
  });
  const hasAssignedTaskScope =
    basePermissions.mode !== "assistant" ||
    allTasksRaw.some((task) => task.assigneeId === user.id) ||
    chapters.some((item) =>
      item.pages.some((candidate) => candidate.pageAssignment?.assistantId === user.id),
    );
  const permissions = useMemo(() => {
    if (
      basePermissions.mode !== "assistant" ||
      basePermissions.canEnterStudio ||
      !hasAssignedTaskScope
    ) {
      return basePermissions;
    }

    return {
      ...basePermissions,
      summary: "Only assigned pages, regions, comments, and tasks are visible.",
      canEnterStudio: true,
      canViewPages: true,
      canViewRegions: true,
      canViewTasks: true,
      canViewComments: true,
      canSubmitTask: true,
      canCreateComment: true,
      canResolveComment: false,
      canUploadWorkingFiles: true,
    };
  }, [basePermissions, hasAssignedTaskScope]);

  const tasks = useMemo(
    () => filterStudioTasksForRole(allTasksRaw, permissions, user.id),
    [allTasksRaw, permissions, user.id],
  );
  const scopedChapters = useMemo(
    () => filterStudioChaptersForRole(chapters, tasks, permissions, user.id),
    [chapters, tasks, permissions, user.id],
  );
  const visiblePageIds = useMemo(
    () => assistantVisiblePageIds(chapters, tasks, user.id),
    [chapters, tasks, user.id],
  );
  const regions = useMemo(
    () => filterStudioRegionsForRole(allRegionsRaw, tasks, permissions, user.id, visiblePageIds),
    [allRegionsRaw, tasks, permissions, user.id, visiblePageIds],
  );
  const comments = useMemo(
    () => filterStudioCommentsForRole(allCommentsRaw, tasks, permissions),
    [allCommentsRaw, tasks, permissions],
  );
  const initialSelectionKey = `${initialTaskId ?? ""}:${initialRegionId ?? ""}`;
  const initialSelectionAppliedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!permissions.canEnterStudio || initialSelectionAppliedRef.current === initialSelectionKey)
      return;

    if (initialTaskId) {
      const task = tasks.find((item) => item.id === initialTaskId);
      if (!task) return;
      setChapterId(task.chapterId);
      setPageId(task.pageId);
      setSelection({ kind: "task", taskId: task.id });
      initialSelectionAppliedRef.current = initialSelectionKey;
      return;
    }

    if (initialRegionId) {
      const region = regions.find((item) => item.id === initialRegionId);
      if (!region) return;
      setChapterId(region.chapterId);
      setPageId(region.pageId);
      setSelection({ kind: "region", regionId: region.id });
      initialSelectionAppliedRef.current = initialSelectionKey;
    }
  }, [
    permissions.canEnterStudio,
    initialSelectionKey,
    initialTaskId,
    initialRegionId,
    tasks,
    regions,
  ]);

  useEffect(() => {
    if (!permissions.canEnterStudio || scopedChapters.length === 0) return;
    if (!chapterId || !scopedChapters.some((c) => c.id === chapterId)) {
      setChapterId(scopedChapters[0]?.id);
      setSelection({ kind: "none" });
    }
  }, [permissions.canEnterStudio, scopedChapters, chapterId]);

  const chapter = useMemo(
    () => scopedChapters.find((c) => c.id === chapterId),
    [scopedChapters, chapterId],
  );
  const page = chapter?.pages.find((p) => p.id === pageId) ?? chapter?.pages[0];

  useEffect(() => {
    if (!chapter) return;
    if (!pageId || !chapter.pages.some((p) => p.id === pageId)) {
      setPageId(chapter.pages[0]?.id);
      setSelection({ kind: "none" });
    }
  }, [chapter, pageId]);

  useEffect(() => {
    if (!isStudioToolAllowed(permissions, tool)) {
      setTool("select");
    }
  }, [permissions, tool]);

  const createRegionMutation = useCreateStudioRegionMutation();
  const createTaskMutation = useCreateStudioTaskMutation();
  const assignPageMutation = useAssignPageMutation();
  const pageAssignmentActionMutation = usePageAssignmentActionMutation();
  const createCommentMutation = useCreateCommentMutation();
  const resolveCommentMutation = useResolveCommentMutation();
  const reopenCommentMutation = useReopenCommentMutation();
  const replyCommentMutation = useReplyCommentMutation();
  const addressCommentMutation = useAddressCommentMutation();
  const uploadPageMutation = useUploadPageMutation(chapterId ?? "", series.id);

  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const deleteRegionMutation = useDeleteStudioRegionMutation();
  const reviewSubmissionMutation = useSubmissionReviewMutation();
  const detectPageBubblesMutation = useMutation({
    mutationFn: (targetPageId: string) => assistantAiApi.detectPageBubbles(targetPageId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: studioKeys.all });
      if (chapter?.id) {
        queryClient.invalidateQueries({ queryKey: chapterKeys.pages(chapter.id) });
      }
      queryClient.invalidateQueries({ queryKey: seriesKeys.chapters(series.id) });
      const firstRegion = data.regions[0] as { id?: string } | undefined;
      if (firstRegion?.id) {
        setSelection({ kind: "region", regionId: firstRegion.id });
      }
    },
  });
  const whitenPageBubblesMutation = useMutation({
    mutationFn: (targetPageId: string) => assistantAiApi.whitenPageBubbles(targetPageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: studioKeys.all });
      if (chapter?.id) {
        queryClient.invalidateQueries({ queryKey: chapterKeys.pages(chapter.id) });
      }
      queryClient.invalidateQueries({ queryKey: seriesKeys.chapters(series.id) });
    },
  });

  const taskActionMutation = useMutation({
    mutationFn: ({
      taskId,
      action,
      payload,
    }: {
      taskId: string;
      action: string;
      payload?: Record<string, unknown>;
    }) =>
      apiRequest<unknown>(`/studio/tasks/${taskId}/actions/${action}`, {
        method: "POST",
        body: payload,
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: studioKeys.all });
      if (variables.taskId) {
        queryClient.invalidateQueries({ queryKey: studioKeys.task(variables.taskId) });
      }
    },
  });

  const handleTaskAction = (taskId: string, action: string, payload?: Record<string, unknown>) => {
    taskActionMutation.mutate(
      { taskId, action, payload },
      {
        onSuccess: () => {
          toast.success(`Task status updated: ${action}`);
        },
        onError: (e) => toast.error(mapApiError(e)),
      },
    );
  };

  const handleReviewSubmission = (
    submissionId: string,
    action: "approve" | "reject" | "request-revision",
    note?: string,
  ) => {
    reviewSubmissionMutation.mutate(
      {
        submissionId,
        action,
        reviewerNote: note,
        chapterId: chapter?.id,
        seriesId: series.id,
        taskId: selection.kind === "task" ? selection.taskId : undefined,
      },
      {
        onSuccess: () => {
          toast.success("Submission review recorded.");
        },
        onError: (e) => toast.error(mapApiError(e)),
      },
    );
  };

  const pageRegions = regions.filter((r) => r.pageId === page?.id);
  const pageTasks = tasks.filter((t) => t.pageId === page?.id);
  const pageComments = comments.filter((c) => c.pageId === page?.id);
  const knownAssigneeNames = useMemo(() => {
    const names = new Map<string, string>();
    tasks.forEach((task) => {
      if (task.assigneeId && task.assigneeName) names.set(task.assigneeId, task.assigneeName);
    });
    return names;
  }, [tasks]);
  const assistantMembers = useMemo<User[]>(
    () =>
      seriesMembers
        .filter(
          (member) =>
            member.role?.toLowerCase() === "assistant" &&
            (member.status ?? "active").toLowerCase() === "active",
        )
        .map((member) => {
          const metadata = (member as { metadata?: Record<string, unknown> }).metadata;
          const displayName =
            (typeof metadata?.userName === "string" && metadata.userName) ||
            knownAssigneeNames.get(member.userId) ||
            member.userId;
          return {
            id: member.userId,
            name: displayName,
            email: typeof metadata?.userEmail === "string" ? metadata.userEmail : "",
            role: "assistant" as Role,
          };
        }),
    [knownAssigneeNames, seriesMembers],
  );

  const selectedRegion =
    selection.kind === "region" ? regions.find((r) => r.id === selection.regionId) : undefined;
  const selectedTask =
    selection.kind === "task" ? tasks.find((t) => t.id === selection.taskId) : undefined;
  const { data: selectedTaskSubmissions = [] } = useTaskSubmissionsQuery(selectedTask?.id ?? "");
  const selectedTaskSubmissionState = selectedTask
    ? deriveTaskStudioSubmissionState(selectedTask, selectedTaskSubmissions)
    : undefined;
  const chapterReviewLocked = chapter?.status === "TANTOU_REVIEW";
  const pageAssignmentReadyForTask =
    Boolean(page?.pageAssignment) &&
    page?.pageAssignment?.status !== "RELEASED" &&
    page?.pageAssignment?.status !== "REJECTED";
  const canCreateTask =
    permissions.canCreateTask && pageAssignmentReadyForTask && !chapterReviewLocked;
  const canSubmitSelectedTask =
    permissions.canSubmitTask &&
    !chapterReviewLocked &&
    selectedTask?.assigneeId === user.id &&
    selectedTaskSubmissionState?.canSubmit === true;
  const submitWorkLabel =
    selectedTaskSubmissionState?.mode === "AWAITING_REVIEW"
      ? "Awaiting Review"
      : selectedTaskSubmissionState?.mode === "REVISION_REQUIRED"
        ? "Reopen to Revise"
        : selectedTaskSubmissionState?.mode === "CLOSED"
          ? "Submission Closed"
          : "Submit Work";
  const canRunPageAi =
    permissions.mode === "mangaka" &&
    series.authorId === user.id &&
    Boolean(page?.fileKey) &&
    !chapterReviewLocked &&
    !detectPageBubblesMutation.isPending &&
    !whitenPageBubblesMutation.isPending;
  const aiBusy = detectPageBubblesMutation.isPending || whitenPageBubblesMutation.isPending;

  const [canvasHost, setCanvasHost] = useState<HTMLDivElement | null>(null);
  const canvasRef = useCallback((el: HTMLDivElement | null) => {
    setCanvasHost(el);
  }, []);
  const [size, setSize] = useState({ w: 800, h: 600 });
  useLayoutEffect(() => {
    if (!canvasHost) return;
    const updateSize = () => {
      const rect = canvasHost.getBoundingClientRect();
      setSize({
        w: Math.max(1, Math.floor(rect.width)),
        h: Math.max(1, Math.floor(rect.height)),
      });
    };
    const ro = new ResizeObserver(() => {
      updateSize();
    });
    ro.observe(canvasHost);
    updateSize();
    return () => {
      ro.disconnect();
    };
  }, [canvasHost]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const triggerUpload = () => {
    if (!permissions.canUploadPages) {
      toast.error("This role cannot upload production pages.");
      return;
    }
    if (!chapter) {
      toast.error("No chapter selected.");
      return;
    }
    fileInputRef.current?.click();
  };

  const onFilesPicked = async (files: FileList | null) => {
    if (!permissions.canUploadPages) {
      toast.error("This role cannot upload production pages.");
      return;
    }
    if (!files || !chapter || !user) return;
    const valid = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (valid.length === 0) {
      toast.error("Select image files.");
      return;
    }
    try {
      for (let i = 0; i < valid.length; i++) {
        const file = valid[i];
        const uploaded = await uploadFileToR2(file, {
          folder: `chapters/${chapter.id}/pages`,
        });
        const createdPage = await uploadPageMutation.mutateAsync({
          pageNumber: chapter.pages.length + i + 1,
          imageUrl: uploaded.url,
          fileUrl: uploaded.fileUrl,
          fileKey: uploaded.fileKey,
          fileName: uploaded.filename,
          sizeKB: uploaded.sizeKB,
          mimeType: uploaded.mimeType,
        });
        setPageId(createdPage.id);
        setSelection({ kind: "page", pageId: createdPage.id });
      }
      toast.success(`Uploaded ${valid.length} page(s).`);
    } catch (e) {
      toast.error(mapApiError(e));
    }
  };

  if (basePermissions.mode === "assistant" && !basePermissions.canEnterStudio && tasksLoading) {
    return <EmptyCenter>Loading assigned Studio scope...</EmptyCenter>;
  }

  if (!permissions.canEnterStudio) {
    return (
      <div className="rounded-md border border-dashed border-border bg-card p-12 text-center text-sm text-muted-foreground">
        <p className="font-semibold text-foreground">Studio access is restricted for this role.</p>
        <p className="mt-1">{permissions.summary}</p>
      </div>
    );
  }

  if (scopedChapters.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-border bg-card p-12 text-center text-sm text-muted-foreground">
        <p className="font-semibold text-foreground">No Studio work is visible in your scope.</p>
        <p className="mt-1">{permissions.summary}</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-background">
      <StudioTopBar
        series={series}
        chapter={chapter}
        page={page}
        regionCount={pageRegions.length}
        taskCount={pageTasks.length}
        commentCount={pageComments.length}
        onUploadPages={triggerUpload}
        onBack={onBack}
        permissions={permissions}
      />

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          onFilesPicked(e.target.files);
          e.target.value = "";
        }}
      />

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <PageLayersPanel
          chapters={scopedChapters}
          chapter={chapter}
          onChapterChange={(id) => setChapterId(id)}
          selectedPageId={page?.id}
          onSelectPage={(id) => {
            setPageId(id);
            setSelection({ kind: "page", pageId: id });
          }}
          regions={regions}
          tasks={tasks}
          comments={comments}
          selection={selection}
          onSelect={setSelection}
          onToggleHidden={(kind, id, hidden) => {
            if (kind === "region" && !permissions.canEditRegion) return;
            if (kind === "task" && !permissions.canAssignTask && !permissions.canReassignTask)
              return;
            if (kind === "comment" && !permissions.canResolveComment) return;
            if (kind === "region") setRegionHidden(id, hidden);
            else if (kind === "task") setTaskHidden(id, hidden);
            else setCommentHidden(id, hidden);
          }}
          onToggleLocked={(kind, id, locked) => {
            if (kind === "region" && !permissions.canEditRegion) return;
            if (kind === "task" && !permissions.canAssignTask && !permissions.canReassignTask)
              return;
            if (kind === "comment" && !permissions.canResolveComment) return;
            if (kind === "region") setRegionLocked(id, locked);
            else if (kind === "task") setTaskLocked(id, locked);
            else setCommentLocked(id, locked);
          }}
          onBulkHidden={(kind, pid, hidden) => bulkSetHidden(kind, pid, hidden)}
          onBulkLocked={(kind, pid, locked) => bulkSetLocked(kind, pid, locked)}
          onReorder={(kind, pageIdArg, fromId, toId) => {
            if (kind === "region" && !permissions.canEditRegion) return;
            if (kind === "task" && !permissions.canAssignTask && !permissions.canReassignTask)
              return;
            if (kind === "comment" && !permissions.canResolveComment) return;
            if (kind === "region") reorderRegionsOnPage(pageIdArg, fromId, toId);
            else if (kind === "task") reorderTasksOnPage(pageIdArg, fromId, toId);
            else reorderCommentsOnPage(pageIdArg, fromId, toId);
          }}
          permissions={permissions}
        />

        <div
          ref={canvasRef}
          className="relative min-h-0 min-w-0 flex-1 overflow-hidden bg-[#f5efe2]"
        >
          {!chapter ? (
            <EmptyCenter>No chapter selected.</EmptyCenter>
          ) : chapter.pages.length === 0 ? (
            <EmptyCenter>No pages are visible in this Studio scope.</EmptyCenter>
          ) : (
            <Suspense fallback={<EmptyCenter>Loading canvas...</EmptyCenter>}>
              <div className="absolute inset-0">
                <KonvaPageCanvas
                  page={page}
                  regions={regions}
                  comments={comments}
                  taskPageIds={new Set(tasks.map((task) => task.pageId))}
                  tool={tool}
                  selection={selection}
                  onSelect={setSelection}
                  onDrawRegion={(rect) => {
                    if (!permissions.canCreateRegion) {
                      toast.error("This role cannot create production regions.");
                      return;
                    }
                    if (!chapter || !page) return;
                    createRegionMutation.mutate(
                      {
                        chapterId: chapter.id,
                        pageId: page.id,
                        seriesId: series.id,
                        type: "other",
                        x: rect.x,
                        y: rect.y,
                        width: rect.width,
                        height: rect.height,
                        label: `Region ${String(pageRegions.length + 1).padStart(2, "0")}`,
                        metadata: {
                          coordinateSpace: "IMAGE_NATURAL",
                          imageWidth: rect.imageWidth,
                          imageHeight: rect.imageHeight,
                        },
                      },
                      {
                        onSuccess: (r) => {
                          setSelection({ kind: "region", regionId: r.id });
                          setTool("select");
                        },
                        onError: (e) => toast.error(mapApiError(e)),
                      },
                    );
                  }}
                  zoom={zoom}
                  onZoomChange={setZoom}
                  containerWidth={size.w}
                  containerHeight={size.h}
                  panTarget={panTarget}
                  highlightCommentId={highlightCommentId}
                  canEditRegions={permissions.canEditRegion}
                  onJumpTo={(x, y, commentId) => {
                    setZoom((z) => Math.max(z, 1.8));
                    setPanTarget({ x, y, nonce: Date.now() });
                    setHighlightCommentId(commentId);
                    window.setTimeout(() => {
                      setHighlightCommentId((cur) => (cur === commentId ? null : cur));
                    }, 2500);
                  }}
                />
              </div>
            </Suspense>
          )}

          <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center">
            <BottomStudioToolbar
              tool={tool}
              onToolChange={setTool}
              zoom={zoom}
              onZoomIn={() => setZoom((z) => Math.min(4, z * 1.15))}
              onZoomOut={() => setZoom((z) => Math.max(0.25, z / 1.15))}
              onFit={() => setZoom(1)}
              permissions={permissions}
              canSubmitWork={canSubmitSelectedTask}
              submitWorkLabel={submitWorkLabel}
              onSubmitWork={() => {
                if (selectedTask) {
                  navigate({
                    to: "/app/assistant/tasks/$taskId/studio",
                    params: { taskId: selectedTask.id },
                  });
                }
              }}
              canRunAi={canRunPageAi}
              aiBusy={aiBusy}
              onDetectBubbles={() => {
                if (!page?.id) {
                  toast.error("No page selected.");
                  return;
                }
                detectPageBubblesMutation.mutate(page.id, {
                  onSuccess: (data) =>
                    toast.success(`AI detected ${data.regions.length} bubble region(s).`),
                  onError: (e) => toast.error(mapApiError(e)),
                });
              }}
              onWhitenBubbles={() => {
                if (!page?.id) {
                  toast.error("No page selected.");
                  return;
                }
                whitenPageBubblesMutation.mutate(page.id, {
                  onSuccess: () => toast.success("AI whitening output is ready."),
                  onError: (e) => toast.error(mapApiError(e)),
                });
              }}
            />
          </div>
        </div>

        <StudioInspector
          chapter={chapter}
          page={page}
          selection={selection}
          regions={regions}
          tasks={tasks}
          comments={comments}
          onSelectTask={(taskId) => setSelection({ kind: "task", taskId })}
          onCreateTask={() => {
            if (!canCreateTask) return;
            setTaskDialogOpen(true);
          }}
          onUploadPages={triggerUpload}
          onAddComment={async (text, blocking) => {
            if (!permissions.canCreateComment) {
              toast.error("This role cannot create production comments.");
              return false;
            }
            if (!chapter || !page) return false;
            const selectedComment =
              selection.kind === "comment"
                ? comments.find((comment) => comment.id === selection.commentId)
                : undefined;
            const target =
              selection.kind === "task" && selectedTask
                ? {
                    targetType: "TASK" as const,
                    targetId: selectedTask.id,
                    taskId: selectedTask.id,
                  }
                : selection.kind === "region" && selectedRegion
                  ? {
                      targetType: "REGION" as const,
                      targetId: selectedRegion.id,
                      regionId: selectedRegion.id,
                    }
                  : selectedComment?.targetType && selectedComment.targetId
                    ? {
                        targetType: selectedComment.targetType as
                          | "TASK"
                          | "REGION"
                          | "PAGE"
                          | "CHAPTER",
                        targetId: selectedComment.targetId,
                        ...(selectedComment.taskId ? { taskId: selectedComment.taskId } : {}),
                        ...(selectedComment.regionId ? { regionId: selectedComment.regionId } : {}),
                      }
                    : {
                        targetType: "PAGE" as const,
                        targetId: page.id,
                      };
            try {
              await createCommentMutation.mutateAsync({
                ...target,
                seriesId: series.id,
                chapterId: chapter.id,
                pageId: page.id,
                body: text,
                text,
                isBlocking: blocking,
              });
              toast.success("Comment added.");
              return true;
            } catch (e) {
              toast.error(mapApiError(e));
              return false;
            }
          }}
          onReplyComment={async (parent, body) => {
            try {
              await replyCommentMutation.mutateAsync({
                parentCommentId: parent.id,
                body,
                chapterId: parent.chapterId,
                pageId: parent.pageId,
                taskId: parent.taskId,
              });
              toast.success("Reply added.");
              return true;
            } catch (error) {
              toast.error(mapApiError(error));
              return false;
            }
          }}
          onDiscardRegion={(id) => {
            if (!permissions.canDeleteRegion) {
              toast.error("This role cannot delete production regions.");
              return;
            }
            deleteRegionMutation.mutate(
              { id, pageId: page?.id, chapterId: chapter?.id },
              {
                onSuccess: () => {
                  setSelection({ kind: "none" });
                  toast.success("Region deleted.");
                },
                onError: (e) => toast.error(mapApiError(e)),
              },
            );
          }}
          onSetCommentStatus={(id, status) => {
            const comment = comments.find((c) => c.id === id);
            if (!comment || !canResolveStudioComment(comment, permissions, user.id)) {
              toast.error("You cannot resolve this comment.");
              return;
            }
            const variables = {
              commentId: id,
              chapterId: comment.chapterId,
              pageId: comment.pageId,
              taskId: comment.taskId,
            };
            const action =
              status === "RESOLVED"
                ? "resolve"
                : status === "OPEN" || status === "REOPENED"
                  ? "reopen"
                  : undefined;
            if (!action) {
              toast.error("This comment status cannot be managed.");
              return;
            }
            const mutation = action === "reopen" ? reopenCommentMutation : resolveCommentMutation;
            mutation.mutate(variables, { onError: (e) => toast.error(mapApiError(e)) });
          }}
          onAddressComment={(id) => {
            const comment = comments.find((c) => c.id === id);
            if (!comment) return;
            addressCommentMutation.mutate(
              {
                commentId: id,
                chapterId: comment.chapterId,
                pageId: comment.pageId,
                taskId: comment.taskId,
              },
              {
                onSuccess: () => toast.success("Comment marked addressed."),
                onError: (e) => toast.error(mapApiError(e)),
              },
            );
          }}
          permissions={permissions}
          canCreateTaskNow={canCreateTask}
          chapterReviewLocked={chapterReviewLocked}
          userId={user.id}
          onTaskAction={handleTaskAction}
          onReviewSubmission={handleReviewSubmission}
          pageAssignment={page?.pageAssignment}
          assistantMembers={assistantMembers}
          pageAssignmentBusy={
            assignPageMutation.isPending || pageAssignmentActionMutation.isPending
          }
          onAssignPage={(assistantId) => {
            if (!page || !chapter) return;
            assignPageMutation.mutate(
              { pageId: page.id, assistantId, chapterId: chapter.id, seriesId: series.id },
              { onError: (error) => toast.error(mapApiError(error)) },
            );
          }}
          onPageAssignmentAction={(action, reason) => {
            if (!page || !chapter) return;
            pageAssignmentActionMutation.mutate(
              { pageId: page.id, action, reason, chapterId: chapter.id, seriesId: series.id },
              { onError: (error) => toast.error(mapApiError(error)) },
            );
          }}
        />
      </div>

      <CreateTaskDialog
        open={taskDialogOpen}
        onOpenChange={setTaskDialogOpen}
        chapter={chapter}
        page={page}
        region={selectedRegion}
        members={assistantMembers}
        pageAssignment={page?.pageAssignment}
        rates={activeRates}
        onSubmit={async (data) => {
          if (!canCreateTask) {
            toast.error(
              chapterReviewLocked
                ? "Chapter content is locked during Tantou review."
                : "A task cannot be created for this page.",
            );
            return false;
          }
          if (!chapter) return false;
          try {
            const created = await createTaskMutation.mutateAsync({
              chapterId: chapter.id,
              pageId: data.pageId,
              seriesId: series.id,
              title: data.title,
              type: data.type,
              ...toTaskRatePayload({ rateCode: data.rateCode, quantity: data.quantity }),
              dueAt: data.dueAt,
              priority: data.priority,
              instructions: data.instructions,
              description: data.instructions,
            });
            setSelection({ kind: "task", taskId: created.id });
            toast.success("Task created.");
            return true;
          } catch (e) {
            toast.error(mapApiError(e));
            return false;
          }
        }}
      />
    </div>
  );
}

function EmptyCenter({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full items-center justify-center p-12 text-center text-sm text-muted-foreground">
      <div className="max-w-md rounded-lg border border-dashed border-border bg-card/60 p-6">
        {children}
      </div>
    </div>
  );
}
