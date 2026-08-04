import type { Role, User } from "@/shared/auth";
import type { Chapter, ProductionSeries } from "@/entities/series/model/series-types";
import type {
  StudioComment,
  StudioRegion,
  StudioTask,
  StudioTool,
} from "@/entities/series/model/studio-types";

export type StudioRoleMode = "mangaka" | "assistant" | "editor" | "board" | "admin";

export type StudioPermissionSet = {
  mode: StudioRoleMode;
  title: string;
  summary: string;
  leftPanelTitle: string;
  taskPanelTitle: string;
  canEnterStudio: boolean;
  canViewPages: boolean;
  canViewRegions: boolean;
  canViewTasks: boolean;
  canViewComments: boolean;
  canUploadPages: boolean;
  canCreateRegion: boolean;
  canEditRegion: boolean;
  canDeleteRegion: boolean;
  canMergeRegion: boolean;
  canSplitRegion: boolean;
  canCreateTask: boolean;
  canAssignTask: boolean;
  canReassignTask: boolean;
  canCancelTask: boolean;
  canReopenTask: boolean;
  canSubmitTask: boolean;
  canReviewSubmission: boolean;
  canCreateComment: boolean;
  canResolveComment: boolean;
  canReopenComment: boolean;
  canUploadWorkingFiles: boolean;
  canUploadStoryboard: boolean;
  canUploadManuscript: boolean;
  canUploadReferences: boolean;
  canUploadCharacterSheets: boolean;
  allowedTools: StudioTool[];
  visibleLayerKinds: Array<"region" | "task" | "comment">;
};

const VIEWER_TOOLS: StudioTool[] = ["select", "pan"];

export function getStudioPermissions(user: User, series: ProductionSeries): StudioPermissionSet {
  const role = user.role;
  const ownsSeries = series.authorId === user.id;
  const assignedToSeries = series.assistantIds.includes(user.id);
  const assignedEditor = series.editorId === user.id;

  if (role === "mangaka") {
    return {
      mode: "mangaka",
      title: "Mangaka production owner",
      summary: ownsSeries
        ? "Full production control inside this owned series."
        : "Mangaka view is limited because this series is not owned by you.",
      leftPanelTitle: "Chapters / Pages / Regions",
      taskPanelTitle: "Inspector / Comments / Task detail",
      canEnterStudio: ownsSeries,
      canViewPages: ownsSeries,
      canViewRegions: ownsSeries,
      canViewTasks: ownsSeries,
      canViewComments: ownsSeries,
      canUploadPages: ownsSeries,
      canCreateRegion: ownsSeries,
      canEditRegion: ownsSeries,
      canDeleteRegion: ownsSeries,
      canMergeRegion: ownsSeries,
      canSplitRegion: ownsSeries,
      canCreateTask: ownsSeries,
      canAssignTask: ownsSeries,
      canReassignTask: ownsSeries,
      canCancelTask: ownsSeries,
      canReopenTask: ownsSeries,
      canSubmitTask: false,
      canReviewSubmission: ownsSeries,
      canCreateComment: ownsSeries,
      canResolveComment: false,
      canReopenComment: false,
      canUploadWorkingFiles: false,
      canUploadStoryboard: ownsSeries,
      canUploadManuscript: ownsSeries,
      canUploadReferences: ownsSeries,
      canUploadCharacterSheets: ownsSeries,
      allowedTools: ["select", "pan", "draw-region", "comment"],
      visibleLayerKinds: ["region", "task", "comment"],
    };
  }

  if (role === "assistant") {
    return {
      mode: "assistant",
      title: "Assistant task scope",
      summary: assignedToSeries
        ? "Only assigned pages, regions, comments, and tasks are visible."
        : "No assigned work is available in this series.",
      leftPanelTitle: "My Assigned Pages",
      taskPanelTitle: "Task Instructions / Comments",
      canEnterStudio: assignedToSeries,
      canViewPages: assignedToSeries,
      canViewRegions: assignedToSeries,
      canViewTasks: assignedToSeries,
      canViewComments: assignedToSeries,
      canUploadPages: false,
      canCreateRegion: false,
      canEditRegion: false,
      canDeleteRegion: false,
      canMergeRegion: false,
      canSplitRegion: false,
      canCreateTask: false,
      canAssignTask: false,
      canReassignTask: false,
      canCancelTask: false,
      canReopenTask: false,
      canSubmitTask: assignedToSeries,
      canReviewSubmission: false,
      canCreateComment: assignedToSeries,
      canResolveComment: false,
      canReopenComment: false,
      canUploadWorkingFiles: assignedToSeries,
      canUploadStoryboard: false,
      canUploadManuscript: false,
      canUploadReferences: assignedToSeries, // Can upload references
      canUploadCharacterSheets: false,
      allowedTools: ["select", "pan", "comment"],
      visibleLayerKinds: ["region", "task", "comment"],
    };
  }

  if (role === "editor") {
    return {
      mode: "editor",
      title: "Editor review mode",
      summary: assignedEditor
        ? "Read-only production canvas with review actions and comments."
        : "Editor access is limited to assigned series review.",
      leftPanelTitle: "Review Queue / Pages",
      taskPanelTitle: "Review Panel / Comments",
      canEnterStudio: assignedEditor,
      canViewPages: assignedEditor,
      canViewRegions: assignedEditor,
      canViewTasks: assignedEditor,
      canViewComments: assignedEditor,
      canUploadPages: false,
      canCreateRegion: false,
      canEditRegion: false,
      canDeleteRegion: false,
      canMergeRegion: false,
      canSplitRegion: false,
      canCreateTask: false,
      canAssignTask: false,
      canReassignTask: false,
      canCancelTask: false,
      canReopenTask: false,
      canSubmitTask: false,
      canReviewSubmission: assignedEditor,
      canCreateComment: assignedEditor,
      canResolveComment: assignedEditor,
      canReopenComment: assignedEditor,
      canUploadWorkingFiles: false,
      canUploadStoryboard: false,
      canUploadManuscript: false,
      canUploadReferences: false,
      canUploadCharacterSheets: false,
      allowedTools: ["select", "pan", "comment"],
      visibleLayerKinds: ["region", "task", "comment"],
    };
  }

  if (role === "board") {
    return {
      mode: "board",
      title: "Board sample viewer",
      summary: "Read-only viewer for samples. Production workflow controls are hidden.",
      leftPanelTitle: "Samples",
      taskPanelTitle: "Viewer Notes",
      canEnterStudio: true,
      canViewPages: true,
      canViewRegions: false,
      canViewTasks: false,
      canViewComments: true,
      canUploadPages: false,
      canCreateRegion: false,
      canEditRegion: false,
      canDeleteRegion: false,
      canMergeRegion: false,
      canSplitRegion: false,
      canCreateTask: false,
      canAssignTask: false,
      canReassignTask: false,
      canCancelTask: false,
      canReopenTask: false,
      canSubmitTask: false,
      canReviewSubmission: false,
      canCreateComment: false,
      canResolveComment: false,
      canReopenComment: false,
      canUploadWorkingFiles: false,
      canUploadStoryboard: false,
      canUploadManuscript: false,
      canUploadReferences: false,
      canUploadCharacterSheets: false,
      allowedTools: VIEWER_TOOLS,
      visibleLayerKinds: ["comment"],
    };
  }

  return {
    mode: "admin",
    title: "Admin boundary",
    summary: "Production content is outside the Admin account-management scope.",
    leftPanelTitle: "Unavailable",
    taskPanelTitle: "Unavailable",
    canEnterStudio: false,
    canViewPages: false,
    canViewRegions: false,
    canViewTasks: false,
    canViewComments: false,
    canUploadPages: false,
    canCreateRegion: false,
    canEditRegion: false,
    canDeleteRegion: false,
    canMergeRegion: false,
    canSplitRegion: false,
    canCreateTask: false,
    canAssignTask: false,
    canReassignTask: false,
    canCancelTask: false,
    canReopenTask: false,
    canSubmitTask: false,
    canReviewSubmission: false,
    canCreateComment: false,
    canResolveComment: false,
    canReopenComment: false,
    canUploadWorkingFiles: false,
    canUploadStoryboard: false,
    canUploadManuscript: false,
    canUploadReferences: false,
    canUploadCharacterSheets: false,
    allowedTools: [],
    visibleLayerKinds: [],
  };
}

export function isStudioToolAllowed(permissions: StudioPermissionSet, tool: StudioTool) {
  return permissions.allowedTools.includes(tool);
}

export function filterStudioChaptersForRole(
  chapters: Chapter[],
  tasks: StudioTask[],
  permissions: StudioPermissionSet,
  userId: string,
) {
  if (permissions.mode !== "assistant") return chapters;
  const assignedPageIds = new Set(
    chapters.flatMap((chapter) =>
      chapter.pages
        .filter((page) => page.pageAssignment?.assistantId === userId)
        .map((page) => page.id),
    ),
  );
  tasks.filter((t) => t.assigneeId === userId).forEach((task) => assignedPageIds.add(task.pageId));
  return chapters
    .map((chapter) => ({
      ...chapter,
      pages: chapter.pages.filter((page) => assignedPageIds.has(page.id)),
    }))
    .filter((chapter) => chapter.pages.length > 0);
}

export function filterStudioRegionsForRole(
  regions: StudioRegion[],
  tasks: StudioTask[],
  permissions: StudioPermissionSet,
  userId: string,
) {
  if (!permissions.canViewRegions) return [];
  if (permissions.mode !== "assistant") return regions;
  const assignedRegionIds = new Set(
    tasks.filter((task) => task.assigneeId === userId).map((task) => task.id),
  );
  return regions.filter(
    (region) =>
      region.taskId ? assignedRegionIds.has(region.taskId) : false,
  );
}

export function filterStudioTasksForRole(
  tasks: StudioTask[],
  permissions: StudioPermissionSet,
  userId: string,
) {
  if (!permissions.canViewTasks) return [];
  if (permissions.mode !== "assistant") return tasks;
  return tasks.filter((task) => task.assigneeId === userId);
}

export function filterStudioCommentsForRole(
  comments: StudioComment[],
  visibleTasks: StudioTask[],
  permissions: StudioPermissionSet,
) {
  if (!permissions.canViewComments) return [];
  if (permissions.mode !== "assistant") return comments;
  const pageIds = new Set(visibleTasks.map((task) => task.pageId));
  const taskIds = new Set(visibleTasks.map((task) => task.id));
  return comments.filter(
    (comment) =>
      pageIds.has(comment.pageId) ||
      (comment.taskId ? taskIds.has(comment.taskId) : false) ||
      (comment.regionId ? pageIds.has(comment.pageId) : false),
  );
}

export function canResolveStudioComment(
  comment: StudioComment,
  permissions: StudioPermissionSet,
  userId: string,
) {
  if (!permissions.canResolveComment) return false;
  if (permissions.mode !== "editor") return false;
  if (
    !comment.isBlocking ||
    (comment.authorRole?.toUpperCase() !== "EDITOR" && comment.authorId !== userId)
  )
    return false;
  return true;
}
