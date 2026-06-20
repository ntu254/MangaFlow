import type { Role } from "@/shared/lib/role";

export type ChapterPerms = {
  canViewFull: boolean; // full Production Overview
  canUploadPages: boolean;
  canManagePages: boolean; // reorder/delete (still subject to active-task guard)
  canCreateTasks: boolean;
  canApproveMangakaStep: boolean;
  canApproveEditorStep: boolean;
  canMarkReady: boolean;
  canComposeComment: boolean;
};

export function chapterPermissions(role: Role): ChapterPerms {
  switch (role) {
    case "mangaka":
      return {
        canViewFull: true,
        canUploadPages: true,
        canManagePages: true,
        canCreateTasks: true,
        canApproveMangakaStep: true,
        canApproveEditorStep: false,
        canMarkReady: false,
        canComposeComment: true,
      };
    case "editor":
      return {
        canViewFull: true,
        canUploadPages: true,
        canManagePages: true,
        canCreateTasks: true,
        canApproveMangakaStep: false,
        canApproveEditorStep: true,
        canMarkReady: true,
        canComposeComment: true,
      };
    case "admin":
      return {
        canViewFull: true,
        canUploadPages: true,
        canManagePages: true,
        canCreateTasks: true,
        canApproveMangakaStep: false,
        canApproveEditorStep: true,
        canMarkReady: true,
        canComposeComment: true,
      };
    default:
      return {
        canViewFull: false,
        canUploadPages: false,
        canManagePages: false,
        canCreateTasks: false,
        canApproveMangakaStep: false,
        canApproveEditorStep: false,
        canMarkReady: false,
        canComposeComment: false,
      };
  }
}
