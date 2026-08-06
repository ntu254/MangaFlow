import type {
  Chapter,
  ChapterPage,
  MaterialItem,
  ProductionSeries,
  SeriesRanking,
} from "@/entities/series/model/series-types";
import {
  seriesKeys,
  chapterKeys,
  materialKeys,
  studioKeys,
} from "@/entities/series/model/series-types";
import type {
  StudioTask as OriginalStudioTask,
  StudioComment,
  StudioRegion,
  PageAssignment,
} from "@/entities/series/model/studio-types";
import type { AssistantSubmission } from "@/entities/submission/model/assistant-types";
import { ApiRequestError, apiRequest, hasApiTokens } from "@/shared/api/client";
import { seriesApi } from "@/shared/api/services";
import { rateTableApi, type RateTableEntry } from "@/shared/api/rate-table";
import { useAuth } from "@/shared/auth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { getCommentManagementRequest } from "../detail/model/comment-actions";
import {
  pageAssignmentInvalidations,
  studioTaskActionInvalidations,
  submissionReviewInvalidations,
} from "../model/mutation-invalidations";
export {
  rankingKeys,
  useMySeriesQuery,
  useRankingsListQuery,
} from "@/entities/series/model/ranking-queries";
export {
  useCommentsQuery,
  useCreateCommentMutation,
  useReplyCommentMutation,
  useAddressCommentMutation,
} from "@/entities/series/model/comment-queries";
export {
  useMyChaptersQuery,
  useSeriesDetailQuery,
  useChaptersForSeriesQuery,
  useChapterQuery,
  useChapterReviewsQuery,
  useChapterActionMutation,
  useSendChapterToEditorReviewMutation,
} from "@/entities/series/model/chapter-queries";
export { seriesKeys } from "@/entities/series/model/series-types";
export {
  chapterKeys,
  materialKeys,
  studioKeys,
} from "@/entities/series/model/series-types";
export type { SeriesRanking } from "@/entities/series/model/series-types";

// Sprint 2 — `accessScope` and `specialization` are the canonical fields
// returned by the backend. `scope` is kept for backward compatibility with
// existing read paths that still key off the legacy free-text value.
// The full enum list is exported from `@/entities/series/model/series-types`.
export interface DbMember {
  id: string;
  seriesId: string;
  userId: string;
  role: string;
  // Canonical: "FULL_SERIES" | "CHAPTER_ONLY" | "TASK_ONLY"
  accessScope?: string;
  // Canonical: "BACKGROUND" | "LINE_ART" | "INKING" | "COLOR" | "LETTERING" | "GENERAL"
  specialization?: "BACKGROUND" | "LINE_ART" | "INKING" | "COLOR" | "LETTERING" | "GENERAL";
  /**
   * @deprecated prefer `accessScope`. Kept for backward compatibility with
   * older API responses that still emit the legacy free-text value
   * ("Full chapter" / "Task only" / "Backgrounds only" / …).
   */
  scope?: string;
  status: string;
  userName?: string | null;
  userEmail?: string | null;
  userRole?: string | null;
  userActive?: boolean;
  createdAt?: string;
}

export interface SeriesActivityEntry {
  id: string;
  actorId: string;
  actorRole: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
  requestId?: string;
  createdAt: string;
}

export const submissionKeys = {
  all: ["submissions"] as const,
  list: (filters?: Record<string, unknown>) => ["submissions", "list", filters ?? {}] as const,
  task: (taskId: string) => ["submissions", "task", taskId] as const,
  detail: (submissionId: string) => ["submissions", "detail", submissionId] as const,
  mangakaReviewQueue: (filters?: Record<string, unknown>) =>
    ["submissions", "mangakaReviewQueue", filters ?? {}] as const,
  editorReviewQueue: () => ["submissions", "editorReviewQueue"] as const,
  byTask: (taskId: string) => ["submissions", "byTask", taskId] as const,
};

export function mapApiError(err: unknown): string {
  if (err instanceof Error) {
    const code = err instanceof ApiRequestError ? err.code : undefined;
    if (code === "SELF_APPROVAL_BLOCKED") return "You cannot approve your own submission.";
    if (code === "CONFLICT")
      return "This item was just claimed by another Editor. Please refresh the queue.";
    if (code === "FORBIDDEN") return "You do not have permission to review this proposal.";
    if (code === "INVALID_TRANSITION") return "The current status does not allow this action.";
    if (code === "PAGE_SOURCE_REQUIRED")
      return "Upload the source page image before assigning assistant work.";
    if (code === "REVIEW_CLAIM_REQUIRED")
      return "Claim this review before updating it or making a decision.";
    if (code === "EDITORIAL_CHECKLIST_INCOMPLETE")
      return "Complete all six editorial criteria before sending this proposal to the Board.";
    if (code === "MANGAKA_OWNER_REQUIRED")
      return "Only the Mangaka owner can send this chapter to editor review.";
    if (code === "TANTOU_ASSIGNMENT_REQUIRED")
      return "Only the assigned Tantou can perform this review action.";
    if (code === "SERIES_NOT_IN_PRODUCTION" || code === "PROPOSAL_NOT_APPROVED")
      return "Series must come from a Board-approved proposal and be in production.";
    if (code === "PAGE_IMAGE_REQUIRED")
      return "Page image is required before sending to editor review.";
    if (code === "TASKS_NOT_MANGAKA_APPROVED" || code === "SUBMISSIONS_NOT_MANGAKA_APPROVED")
      return "All assistant tasks and submissions must be approved by Mangaka first.";
    if (code === "PAGE_ASSIGNMENT_HAS_PENDING_EDITOR_REVIEW")
      return "This page still has tasks waiting for Editor approval — finish the review before reassigning.";
    if (code === "CHAPTER_NOT_IN_PRODUCTION")
      return "Start the chapter draft before uploading pages.";
    if (code === "CHAPTER_LOCKED_FOR_MEMBER_REMOVAL")
      return "This member has active tasks on the series — finish or reassign them first.";
    if (code === "PROPOSAL_ARCHIVE_NOT_ALLOWED")
      return "Active proposals cannot be archived. Withdraw or reject the proposal first.";
    if (code === "BLOCKING_COMMENTS_UNRESOLVED")
      return "Blocking comments must be resolved before editor review.";
    if (code === "NOT_FOUND" || code === "PROPOSAL_NOT_FOUND") return "Proposal not found.";
    if (err instanceof ApiRequestError && err.status >= 500) {
      return err.requestId
        ? `The server could not complete this action. Reference: ${err.requestId}`
        : "The server could not complete this action. Please retry.";
    }
    const msg = err.message;
    if (msg.includes("SELF_APPROVAL_BLOCKED")) return "You cannot approve your own submission.";
    if (msg.includes("CONFLICT"))
      return "This item was just claimed by another Editor. Please refresh the queue.";
    if (msg.includes("FORBIDDEN")) return "You do not have permission to review this proposal.";
    if (msg.includes("INVALID_TRANSITION")) return "The current status does not allow this action.";
    if (msg.includes("NOT_FOUND")) return "Proposal not found.";
    return msg;
  }
  return "An unknown error occurred.";
}

// Queries
export function useChaptersQuery(seriesId: string) {
  return useQuery<Chapter[]>({
    queryKey: seriesKeys.chapters(seriesId),
    queryFn: () => apiRequest<Chapter[]>(`/series/${seriesId}/chapters`),
    enabled: !!seriesId,
    staleTime: 60000,
  });
}

export function useChapterPagesQuery(chapterId: string) {
  return useQuery<ChapterPage[]>({
    queryKey: chapterKeys.pages(chapterId),
    queryFn: () => apiRequest<ChapterPage[]>(`/chapters/${chapterId}/pages`),
    enabled: !!chapterId,
    staleTime: 60000,
  });
}

export type ChapterReadinessResult = {
  chapterId: string;
  chapterStatus: string;
  ready: boolean;
  items: Array<{ key: string; passed: boolean; reason: string }>;
};

export function useChapterReadinessQuery(chapterId: string) {
  return useQuery<ChapterReadinessResult>({
    queryKey: chapterKeys.readiness(chapterId),
    queryFn: () => apiRequest<ChapterReadinessResult>(`/chapters/${chapterId}/readiness`),
    enabled: !!chapterId,
    staleTime: 60000,
  });
}

export interface TantouEditor {
  id: string;
  seriesId: string;
  userId: string;
  role: string;
  scope?: string;
  status: string;
  userName: string;
  userEmail?: string;
  joinedAt?: string;
}

export function useSeriesMembersQuery(seriesId: string) {
  return useQuery<DbMember[]>({
    queryKey: seriesKeys.members(seriesId),
    queryFn: () => apiRequest<DbMember[]>(`/series/${seriesId}/members`),
    enabled: !!seriesId,
    staleTime: 60000,
  });
}

export function useTantouEditorQuery(seriesId: string) {
  return useQuery<TantouEditor | null>({
    queryKey: seriesKeys.editor(seriesId),
    queryFn: () => seriesApi.getEditor(seriesId) as Promise<TantouEditor | null>,
    enabled: !!seriesId,
    staleTime: 60000,
  });
}

export function useSeriesActivityQuery(seriesId: string) {
  return useQuery<SeriesActivityEntry[]>({
    queryKey: seriesKeys.activity(seriesId),
    queryFn: () => apiRequest<SeriesActivityEntry[]>(`/series/${seriesId}/activity`),
    enabled: !!seriesId,
    staleTime: 30000,
  });
}

export function useSeriesLifecycleMutation(seriesId: string) {
  const queryClient = useQueryClient();
  return useMutation<ProductionSeries, Error, "archive" | "unpublish" | "start_production">({
    mutationFn: (action) => seriesApi.action(seriesId, action) as Promise<ProductionSeries>,
    onSuccess: (series) => {
      queryClient.invalidateQueries({ queryKey: seriesKeys.mine() });
      queryClient.invalidateQueries({ queryKey: seriesKeys.detail(series.id) });
      queryClient.invalidateQueries({ queryKey: seriesKeys.activity(series.id) });
    },
  });
}

export function useDeleteSeriesMutation(seriesId: string) {
  const queryClient = useQueryClient();
  return useMutation<ProductionSeries | { id: string; deleted: true }, Error, void>({
    mutationFn: () =>
      seriesApi.delete(seriesId) as Promise<ProductionSeries | { id: string; deleted: true }>,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: seriesKeys.mine() });
      queryClient.invalidateQueries({ queryKey: seriesKeys.detail(seriesId) });
    },
  });
}

export function useRankingsQuery(seriesId: string) {
  return useQuery<SeriesRanking[]>({
    queryKey: seriesKeys.rankings(seriesId),
    // MF-009: backend exposes GET /rankings?seriesId=... not /series/:id/rankings
    queryFn: () =>
      apiRequest<SeriesRanking[]>(`/rankings?seriesId=${encodeURIComponent(seriesId)}`),
    enabled: !!seriesId,
    staleTime: 60000,
  });
}

// Mutations
export function useCreateChapterMutation(seriesId: string) {
  const queryClient = useQueryClient();
  return useMutation<
    Chapter,
    Error,
    {
      number: number;
      title: string;
      targetPages?: number;
      assigneeId?: string;
      assigneeName?: string;
      draftDueAt?: string;
      reviewDueAt?: string;
      plannedAt?: string;
    }
  >({
    mutationFn: (body) =>
      apiRequest<Chapter>(`/series/${seriesId}/chapters`, { method: "POST", body }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: seriesKeys.chapters(seriesId) });
    },
  });
}

export function usePatchChapterMutation(chapterId: string, seriesId?: string) {
  const queryClient = useQueryClient();
  return useMutation<Chapter, Error, Partial<Chapter>>({
    mutationFn: (body) => apiRequest<Chapter>(`/chapters/${chapterId}`, { method: "PATCH", body }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chapterKeys.detail(chapterId) });
      if (seriesId) {
        queryClient.invalidateQueries({ queryKey: seriesKeys.chapters(seriesId) });
      }
    },
  });
}

export function useUploadPageMutation(chapterId: string, seriesId?: string) {
  const queryClient = useQueryClient();
  return useMutation<ChapterPage, Error, Partial<ChapterPage>>({
    mutationFn: (body) =>
      apiRequest<ChapterPage>(`/chapters/${chapterId}/pages`, { method: "POST", body }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chapterKeys.pages(chapterId) });
      queryClient.invalidateQueries({ queryKey: chapterKeys.readiness(chapterId) });
      if (seriesId) {
        queryClient.invalidateQueries({ queryKey: seriesKeys.chapters(seriesId) });
      }
    },
  });
}

export function useUpdatePageMutation(pageId: string, chapterId: string, seriesId?: string) {
  const queryClient = useQueryClient();
  return useMutation<ChapterPage, Error, Partial<ChapterPage>>({
    mutationFn: (body) => apiRequest<ChapterPage>(`/pages/${pageId}`, { method: "PATCH", body }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chapterKeys.detail(chapterId) });
      queryClient.invalidateQueries({ queryKey: chapterKeys.pages(chapterId) });
      queryClient.invalidateQueries({ queryKey: chapterKeys.readiness(chapterId) });
      if (seriesId) {
        queryClient.invalidateQueries({ queryKey: seriesKeys.chapters(seriesId) });
      }
    },
  });
}

export function useReorderPagesMutation(chapterId: string, seriesId?: string) {
  const queryClient = useQueryClient();
  return useMutation<ChapterPage[], Error, string[]>({
    mutationFn: (orderedPageIds) =>
      apiRequest<ChapterPage[]>(`/chapters/${chapterId}/pages/reorder`, {
        method: "PATCH",
        body: { orderedPageIds },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chapterKeys.all });
      queryClient.invalidateQueries({ queryKey: chapterKeys.detail(chapterId) });
      queryClient.invalidateQueries({ queryKey: chapterKeys.pages(chapterId) });
      queryClient.invalidateQueries({ queryKey: chapterKeys.readiness(chapterId) });
      if (seriesId) {
        queryClient.invalidateQueries({ queryKey: seriesKeys.chapters(seriesId) });
      }
    },
  });
}

export function useDeletePageMutation(chapterId: string, seriesId?: string) {
  const queryClient = useQueryClient();
  return useMutation<{ id: string }, Error, string>({
    mutationFn: (pageId) => apiRequest<{ id: string }>(`/pages/${pageId}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chapterKeys.all });
      queryClient.invalidateQueries({ queryKey: chapterKeys.detail(chapterId) });
      queryClient.invalidateQueries({ queryKey: chapterKeys.pages(chapterId) });
      queryClient.invalidateQueries({ queryKey: chapterKeys.readiness(chapterId) });
      if (seriesId) {
        queryClient.invalidateQueries({ queryKey: seriesKeys.chapters(seriesId) });
      }
    },
  });
}

export function useUpdateMemberMutation(seriesId: string, memberId: string) {
  const queryClient = useQueryClient();
  return useMutation<DbMember, Error, Partial<DbMember>>({
    mutationFn: (body) =>
      apiRequest<DbMember>(`/series/${seriesId}/members/${memberId}`, { method: "PATCH", body }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: seriesKeys.members(seriesId) });
    },
  });
}

export function useInviteAssistantMutation(seriesId: string) {
  const queryClient = useQueryClient();
  return useMutation<DbMember, Error, { email: string; scope?: string }>({
    mutationFn: (body) =>
      apiRequest<DbMember>(`/series/${seriesId}/invites`, { method: "POST", body }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: seriesKeys.members(seriesId) });
      queryClient.invalidateQueries({ queryKey: seriesKeys.detail(seriesId) });
    },
  });
}

export function useRemoveMemberMutation(seriesId: string, memberId: string) {
  const queryClient = useQueryClient();
  return useMutation<{ id: string }, Error, void>({
    mutationFn: () =>
      apiRequest<{ id: string }>(`/series/${seriesId}/members/${memberId}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: seriesKeys.members(seriesId) });
      queryClient.invalidateQueries({ queryKey: seriesKeys.detail(seriesId) });
    },
  });
}

export function useAssignEditorMutation(seriesId: string) {
  const queryClient = useQueryClient();
  return useMutation<TantouEditor, Error, { editorId: string }>({
    mutationFn: (body) => seriesApi.assignEditor(seriesId, body) as Promise<TantouEditor>,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: seriesKeys.editor(seriesId) });
      queryClient.invalidateQueries({ queryKey: seriesKeys.members(seriesId) });
      queryClient.invalidateQueries({ queryKey: seriesKeys.detail(seriesId) });
    },
  });
}

export function useRemoveEditorMutation(seriesId: string) {
  const queryClient = useQueryClient();
  return useMutation<{ id: string }, Error, void>({
    mutationFn: () => seriesApi.removeEditor(seriesId) as Promise<{ id: string }>,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: seriesKeys.editor(seriesId) });
      queryClient.invalidateQueries({ queryKey: seriesKeys.members(seriesId) });
      queryClient.invalidateQueries({ queryKey: seriesKeys.detail(seriesId) });
    },
  });
}

export function useTaskActionMutation(taskId: string, chapterId?: string) {
  const queryClient = useQueryClient();
  return useMutation<unknown, Error, { action: string; payload?: unknown }>({
    mutationFn: ({ action, payload }) =>
      apiRequest<unknown>(`/studio/tasks/${taskId}/actions/${action}`, {
        method: "POST",
        body: payload,
      }),
    onSuccess: () => {
      return Promise.all(
        studioTaskActionInvalidations(taskId, chapterId).map((key) =>
          queryClient.invalidateQueries({ queryKey: key as never }),
        ),
      );
    },
  });
}

export function useTaskEditorActionMutation(chapterId?: string) {
  const queryClient = useQueryClient();
  return useMutation<unknown, Error, { taskId: string; action: "EDITOR_APPROVE" | "COMPLETE" }>({
    mutationFn: ({ taskId, action }) =>
      apiRequest<unknown>(`/studio/tasks/${taskId}/actions/${action}`, {
        method: "POST",
      }),
    onSuccess: (_data, variables) => {
      return Promise.all(
        studioTaskActionInvalidations(variables.taskId, chapterId).map((key) =>
          queryClient.invalidateQueries({ queryKey: key as never }),
        ),
      );
    },
  });
}

export function useSubmissionReviewMutation() {
  const queryClient = useQueryClient();
  return useMutation<
    unknown,
    Error,
    {
      submissionId: string;
      action: "approve" | "reject" | "request-revision";
      reviewerNote?: string;
      chapterId?: string;
      seriesId?: string;
      taskId?: string;
    }
  >({
    mutationFn: ({ submissionId, action, reviewerNote }) => {
      return apiRequest<unknown>(`/submissions/${submissionId}/${action}`, {
        method: "POST",
        body: { reviewerNote },
      });
    },
    onSuccess: (_data, variables) => {
      return Promise.all(
        submissionReviewInvalidations(variables).map((key) =>
          queryClient.invalidateQueries({ queryKey: key as never }),
        ),
      );
    },
  });
}

// Material hooks (MF-013 / MF-032)
export type { MaterialItem, MaterialVersionItem } from "@/entities/series/model/series-types";

export function useMaterialsQuery(chapterId: string) {
  return useQuery<MaterialItem[]>({
    queryKey: materialKeys.list(chapterId),
    queryFn: () =>
      apiRequest<MaterialItem[]>(`/materials?chapterId=${encodeURIComponent(chapterId)}`),
    enabled: !!chapterId,
    staleTime: 30000,
  });
}

export function useSeriesMaterialsQuery(seriesId: string) {
  return useQuery<MaterialItem[]>({
    queryKey: materialKeys.series(seriesId),
    queryFn: () =>
      apiRequest<MaterialItem[]>(`/materials?seriesId=${encodeURIComponent(seriesId)}`),
    enabled: !!seriesId,
    staleTime: 30000,
  });
}

export function useCreateMaterialMutation(chapterId: string, seriesId?: string) {
  const queryClient = useQueryClient();
  return useMutation<
    MaterialItem,
    Error,
    {
      title: string;
      kind?: string;
      fileKey?: string;
      url?: string;
      mimeType?: string;
      size?: number;
      tags?: string[];
    }
  >({
    mutationFn: (body) =>
      apiRequest<MaterialItem>("/materials", {
        method: "POST",
        body: { ...body, chapterId, seriesId },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: materialKeys.list(chapterId) });
      if (seriesId) {
        queryClient.invalidateQueries({ queryKey: materialKeys.series(seriesId) });
        queryClient.invalidateQueries({ queryKey: seriesKeys.chapters(seriesId) });
      }
    },
  });
}

// MF-032 — Series Materials Library create/version/update/delete against backend.

export interface CreateSeriesMaterialInput {
  title: string;
  kind?: string;
  chapterId?: string;
  tags?: string[];
  fileKey?: string;
  url?: string;
  mimeType?: string;
  size?: number;
  /** Additional attachment display metadata. */
  metadata?: Record<string, unknown>;
}

export function useCreateSeriesMaterialMutation(seriesId: string) {
  const queryClient = useQueryClient();
  return useMutation<MaterialItem, Error, CreateSeriesMaterialInput>({
    mutationFn: (body) =>
      apiRequest<MaterialItem>("/materials", {
        method: "POST",
        body: { ...body, seriesId },
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: materialKeys.series(seriesId) });
      if (variables.chapterId) {
        queryClient.invalidateQueries({ queryKey: materialKeys.list(variables.chapterId) });
      }
    },
  });
}

export interface AddSeriesMaterialVersionInput {
  materialId: string;
  fileKey: string;
  url: string;
  mimeType?: string;
  size?: number;
  note?: string;
  /** Additional version metadata. */
  metadata?: Record<string, unknown>;
}

export function useAddSeriesMaterialVersionMutation(seriesId: string) {
  const queryClient = useQueryClient();
  return useMutation<MaterialItem, Error, AddSeriesMaterialVersionInput>({
    mutationFn: ({ materialId, ...body }) =>
      apiRequest<MaterialItem>(`/materials/${materialId}/versions`, {
        method: "POST",
        body,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: materialKeys.series(seriesId) });
    },
  });
}

export interface UpdateSeriesMaterialInput {
  materialId: string;
  title?: string;
  tags?: string[];
  chapterId?: string | null;
  metadata?: Record<string, unknown>;
}

export function useUpdateSeriesMaterialMutation(seriesId: string) {
  const queryClient = useQueryClient();
  return useMutation<MaterialItem, Error, UpdateSeriesMaterialInput>({
    mutationFn: ({ materialId, ...patch }) =>
      apiRequest<MaterialItem>(`/materials/${materialId}`, {
        method: "PATCH",
        body: patch,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: materialKeys.series(seriesId) });
    },
  });
}

export function useDeleteSeriesMaterialMutation(seriesId: string) {
  const queryClient = useQueryClient();
  return useMutation<{ id: string }, Error, string>({
    mutationFn: (materialId) =>
      apiRequest<{ id: string }>(`/materials/${materialId}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: materialKeys.series(seriesId) });
    },
  });
}

export function useDeleteMaterialMutation(chapterId: string) {
  const queryClient = useQueryClient();
  return useMutation<{ id: string }, Error, string>({
    mutationFn: (materialId) =>
      apiRequest<{ id: string }>(`/materials/${materialId}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: materialKeys.list(chapterId) });
    },
  });
}

export function useAddMaterialVersionMutation(materialId: string, chapterId: string) {
  const queryClient = useQueryClient();
  return useMutation<
    MaterialItem,
    Error,
    { fileKey: string; url: string; mimeType?: string; size?: number; note?: string }
  >({
    mutationFn: (body) =>
      apiRequest<MaterialItem>(`/materials/${materialId}/versions`, {
        method: "POST",
        body,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: materialKeys.list(chapterId) });
    },
  });
}

// Studio hooks (MF-014)
export function useStudioRegionsQuery(filters: {
  pageId?: string;
  chapterId?: string;
  seriesId?: string;
}) {
  const params = new URLSearchParams();
  if (filters.pageId) params.set("pageId", filters.pageId);
  if (filters.chapterId) params.set("chapterId", filters.chapterId);
  if (filters.seriesId) params.set("seriesId", filters.seriesId);
  const qs = params.toString();
  return useQuery<StudioRegion[]>({
    queryKey: studioKeys.regions(filters),
    queryFn: () => apiRequest<StudioRegion[]>(`/studio/regions${qs ? `?${qs}` : ""}`),
    staleTime: 30000,
  });
}

export function useCreateStudioRegionMutation() {
  const queryClient = useQueryClient();
  return useMutation<
    StudioRegion,
    Error,
    {
      pageId: string;
      chapterId: string;
      seriesId?: string;
      type: string;
      x: number;
      y: number;
      width: number;
      height: number;
      label?: string;
      metadata?: Record<string, unknown>;
    }
  >({
    mutationFn: (body) => apiRequest<StudioRegion>("/studio/regions", { method: "POST", body }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: studioKeys.regions({ pageId: variables.pageId }),
      });
      queryClient.invalidateQueries({
        queryKey: studioKeys.regions({ chapterId: variables.chapterId }),
      });
    },
  });
}

export function useUpdateStudioRegionMutation() {
  const queryClient = useQueryClient();
  return useMutation<
    StudioRegion,
    Error,
    { id: string; patch: Partial<StudioRegion>; pageId?: string; chapterId?: string }
  >({
    mutationFn: ({ id, patch }) =>
      apiRequest<StudioRegion>(`/studio/regions/${id}`, { method: "PATCH", body: patch }),
    onSuccess: (_data, variables) => {
      if (variables.pageId) {
        queryClient.invalidateQueries({
          queryKey: studioKeys.regions({ pageId: variables.pageId }),
        });
      }
      if (variables.chapterId) {
        queryClient.invalidateQueries({
          queryKey: studioKeys.regions({ chapterId: variables.chapterId }),
        });
      }
    },
  });
}

export function useDeleteStudioRegionMutation() {
  const queryClient = useQueryClient();
  return useMutation<{ id: string }, Error, { id: string; pageId?: string; chapterId?: string }>({
    mutationFn: ({ id }) =>
      apiRequest<{ id: string }>(`/studio/regions/${id}`, { method: "DELETE" }),
    onSuccess: (_data, variables) => {
      if (variables.pageId) {
        queryClient.invalidateQueries({
          queryKey: studioKeys.regions({ pageId: variables.pageId }),
        });
      }
      if (variables.chapterId) {
        queryClient.invalidateQueries({
          queryKey: studioKeys.regions({ chapterId: variables.chapterId }),
        });
      }
    },
  });
}

export function useStudioTasksQuery(filters: {
  seriesId?: string;
  chapterId?: string;
  pageId?: string;
  assigneeId?: string;
  status?: string;
}) {
  const params = new URLSearchParams();
  if (filters.seriesId) params.set("seriesId", filters.seriesId);
  if (filters.chapterId) params.set("chapterId", filters.chapterId);
  if (filters.pageId) params.set("pageId", filters.pageId);
  if (filters.assigneeId) params.set("assigneeId", filters.assigneeId);
  if (filters.status) params.set("status", filters.status);
  const qs = params.toString();
  return useQuery<StudioTask[]>({
    queryKey: studioKeys.tasks(filters),
    queryFn: () => apiRequest<StudioTask[]>(`/studio/tasks${qs ? `?${qs}` : ""}`),
    staleTime: 30000,
  });
}

export function useStudioTaskDetailQuery(taskId: string) {
  return useQuery<StudioTask>({
    queryKey: studioKeys.task(taskId),
    queryFn: () => apiRequest<StudioTask>(`/studio/tasks/${taskId}`),
    enabled: !!taskId,
    staleTime: 30000,
  });
}

export function useActiveRateTableQuery(options: { enabled?: boolean } = {}) {
  return useQuery<RateTableEntry[]>({
    queryKey: ["rate-table", "active"],
    queryFn: () => rateTableApi.active() as Promise<RateTableEntry[]>,
    enabled: options.enabled ?? true,
    staleTime: 30000,
  });
}

export function useCreateStudioTaskMutation() {
  const queryClient = useQueryClient();
  return useMutation<
    StudioTask,
    Error,
    {
      chapterId: string;
      pageId: string;
      seriesId?: string;
      title: string;
      type: string;
      rateCode: string;
      quantity?: number;
      dueAt: string;
      priority: string;
      instructions: string;
      description?: string;
      status?: "TODO";
    }
  >({
    mutationFn: (body) => apiRequest<StudioTask>("/studio/tasks", { method: "POST", body }),
    onSuccess: (_data, variables) => {
      return Promise.all([
        queryClient.invalidateQueries({
          queryKey: studioKeys.tasks({ chapterId: variables.chapterId }),
        }),
        queryClient.invalidateQueries({
          queryKey: studioKeys.tasks({ pageId: variables.pageId }),
        }),
        queryClient.invalidateQueries({ queryKey: studioKeys.all }),
      ]);
    },
  });
}

export function useUpdateStudioTaskMutation() {
  const queryClient = useQueryClient();
  return useMutation<
    StudioTask,
    Error,
    { id: string; patch: Partial<StudioTask>; chapterId?: string; pageId?: string }
  >({
    mutationFn: ({ id, patch }) =>
      apiRequest<StudioTask>(`/studio/tasks/${id}`, { method: "PATCH", body: patch }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: studioKeys.task(variables.id) });
      if (variables.chapterId) {
        queryClient.invalidateQueries({
          queryKey: studioKeys.tasks({ chapterId: variables.chapterId }),
        });
      }
      if (variables.pageId) {
        queryClient.invalidateQueries({
          queryKey: studioKeys.tasks({ pageId: variables.pageId }),
        });
      }
    },
  });
}

export function useStudioTaskActionMutation(taskId: string) {
  const queryClient = useQueryClient();
  return useMutation<
    unknown,
    Error,
    { action: string; payload?: unknown; chapterId?: string; pageId?: string }
  >({
    mutationFn: ({ action, payload }) =>
      apiRequest<unknown>(`/studio/tasks/${taskId}/actions/${action}`, {
        method: "POST",
        body: payload,
      }),
    onSuccess: (_data, variables) => {
      const invalidations = [queryClient.invalidateQueries({ queryKey: studioKeys.task(taskId) })];
      if (variables.chapterId) {
        invalidations.push(
          queryClient.invalidateQueries({
            queryKey: chapterKeys.readiness(variables.chapterId),
          }),
        );
      }
      invalidations.push(queryClient.invalidateQueries({ queryKey: studioKeys.all }));
      return Promise.all(invalidations);
    },
  });
}

export function useResolveCommentMutation() {
  const queryClient = useQueryClient();
  return useMutation<
    StudioComment,
    Error,
    { commentId: string; chapterId?: string; pageId?: string; taskId?: string }
  >({
    mutationFn: ({ commentId }) => {
      const request = getCommentManagementRequest(commentId, "OPEN");
      if (!request) throw new Error("Comment cannot be resolved from its current status.");
      return apiRequest<StudioComment>(request.path, {
        method: request.method,
        body: request.body,
      });
    },
    onSuccess: (_data, variables) => {
      if (variables.chapterId) {
        queryClient.invalidateQueries({
          queryKey: studioKeys.comments({ chapterId: variables.chapterId }),
        });
        queryClient.invalidateQueries({
          queryKey: chapterKeys.readiness(variables.chapterId),
        });
      }
      if (variables.pageId) {
        queryClient.invalidateQueries({
          queryKey: studioKeys.comments({ pageId: variables.pageId }),
        });
      }
      if (variables.taskId) {
        queryClient.invalidateQueries({
          queryKey: studioKeys.comments({ taskId: variables.taskId }),
        });
      }
    },
  });
}

export function useReopenCommentMutation() {
  const queryClient = useQueryClient();
  return useMutation<
    StudioComment,
    Error,
    { commentId: string; chapterId?: string; pageId?: string; taskId?: string }
  >({
    mutationFn: ({ commentId }) => {
      const request = getCommentManagementRequest(commentId, "RESOLVED");
      if (!request) throw new Error("Comment cannot be reopened from its current status.");
      return apiRequest<StudioComment>(request.path, {
        method: request.method,
        body: request.body,
      });
    },
    onSuccess: (_data, variables) => {
      if (variables.chapterId) {
        queryClient.invalidateQueries({
          queryKey: studioKeys.comments({ chapterId: variables.chapterId }),
        });
        queryClient.invalidateQueries({
          queryKey: chapterKeys.readiness(variables.chapterId),
        });
      }
      if (variables.pageId) {
        queryClient.invalidateQueries({
          queryKey: studioKeys.comments({ pageId: variables.pageId }),
        });
      }
      if (variables.taskId) {
        queryClient.invalidateQueries({
          queryKey: studioKeys.comments({ taskId: variables.taskId }),
        });
      }
    },
  });
}

// Submission hooks (MF-027)

/** Map backend SubmissionRecord → frontend AssistantSubmission */
function mapSubmissionRecord(raw: Record<string, unknown>): AssistantSubmission {
  const toStr = (v: unknown): string => (typeof v === "string" ? v : "");
  const toNum = (v: unknown): number => (typeof v === "number" ? v : 0);
  const toOptStr = (v: unknown): string | undefined => (typeof v === "string" && v ? v : undefined);
  const toDate = (v: unknown): string => {
    if (!v) return "";
    if (typeof v === "string") return v;
    if (v instanceof Date) return v.toISOString();
    return "";
  };
  return {
    id: toStr(raw.id),
    taskId: toStr(raw.taskId),
    chapterId: toOptStr(raw.chapterId),
    assistantId: toStr(raw.assistantId),
    assistantName: toOptStr(raw.assistantName),
    version: toNum(raw.version) || 1,
    versionLabel: toStr(raw.versionLabel) || `v${toNum(raw.version) || 1}`,
    fileKey: toOptStr(raw.fileKey),
    fileName: toOptStr(raw.fileName) ?? toOptStr(raw.fileKey),
    fileUrl: toOptStr(raw.fileUrl) ?? toOptStr(raw.imageUrl),
    fileSizeKB: typeof raw.fileSizeKB === "number" ? raw.fileSizeKB : undefined,
    mimeType: toOptStr(raw.mimeType),
    note: toOptStr(raw.notes) ?? toOptStr(raw.resultText),
    status: normalizeSubmissionStatus(toStr(raw.status)),
    feedback: toOptStr(raw.reviewerNote),
    reviewedById: toOptStr(raw.reviewedById),
    reviewedByName: toOptStr(raw.reviewedByName),
    reviewedAt: toOptStr(raw.reviewedAt),
    submittedAt: toDate(raw.submittedAt),
  };
}

function normalizeSubmissionStatus(raw: string): AssistantSubmission["status"] {
  switch (raw) {
    case "PENDING":
    case "REVISION_REQUESTED":
      return "REVISION_REQUESTED";
    case "MANGAKA_APPROVED":
      return "MANGAKA_APPROVED";
    case "REJECTED":
      return "REJECTED";
    case "SUPERSEDED":
      return "SUPERSEDED";
    default:
      return "PENDING";
  }
}

export function useAssignPageMutation() {
  const queryClient = useQueryClient();
  return useMutation<PageAssignment, Error, { pageId: string; assistantId: string; chapterId?: string; seriesId?: string }>({
    mutationFn: ({ pageId, assistantId }) =>
      apiRequest<PageAssignment>(`/studio/pages/${pageId}/assignment`, { method: "POST", body: { assistantId } }),
    onSuccess: async (_data, variables) => {
      for (const key of pageAssignmentInvalidations(variables)) {
        await queryClient.invalidateQueries({ queryKey: key as never });
      }
    },
  });
}

export function usePageAssignmentActionMutation() {
  const queryClient = useQueryClient();
  return useMutation<PageAssignment, Error, { pageId: string; action: "ACCEPT" | "REJECT" | "RELEASE"; reason?: string; chapterId?: string; seriesId?: string }>({
    mutationFn: ({ pageId, action, reason }) =>
      apiRequest<PageAssignment>(`/studio/pages/${pageId}/assignment/actions/${action}`, { method: "POST", body: reason ? { reason } : {} }),
    onSuccess: async (_data, variables) => {
      for (const key of pageAssignmentInvalidations(variables)) {
        await queryClient.invalidateQueries({ queryKey: key as never });
      }
    },
  });
}

export function useTaskSubmissionsQuery(taskId: string) {
  return useQuery<AssistantSubmission[]>({
    queryKey: submissionKeys.task(taskId),
    queryFn: async () => {
      const raw = await apiRequest<Record<string, unknown>[]>(`/tasks/${taskId}/submissions`);
      return raw.map(mapSubmissionRecord);
    },
    enabled: !!taskId,
    staleTime: 30000,
    refetchOnMount: "always",
  });
}

export function useSubmissionsQuery(filters: {
  assistantId?: string;
  taskId?: string;
  status?: string;
}) {
  const params = new URLSearchParams();
  if (filters.assistantId) params.set("assistantId", filters.assistantId);
  if (filters.taskId) params.set("taskId", filters.taskId);
  if (filters.status) params.set("status", filters.status);
  const qs = params.toString();
  return useQuery<AssistantSubmission[]>({
    queryKey: submissionKeys.list(filters),
    queryFn: async () => {
      const raw = await apiRequest<Record<string, unknown>[]>(`/submissions${qs ? `?${qs}` : ""}`);
      return raw.map(mapSubmissionRecord);
    },
    staleTime: 30000,
  });
}

export function useCreateSubmissionMutation() {
  const queryClient = useQueryClient();
  return useMutation<
    AssistantSubmission,
    Error,
    {
      taskId: string;
      seriesId?: string;
      chapterId?: string;
      pageId?: string;
      fileKey?: string;
      fileName?: string;
      fileUrl?: string;
      fileSizeKB?: number;
      mimeType?: string;
      imageUrl?: string;
      notes?: string;
      intent?: "DRAFT" | "SUBMIT";
      version?: number;
      status?: "PENDING" | "REVISION_REQUESTED" | "MANGAKA_APPROVED" | "REJECTED" | "SUPERSEDED";
      expectedCurrentSubmissionId?: string | null;
      idempotencyKey?: string;
    }
  >({
    mutationFn: ({ taskId, idempotencyKey, ...body }) =>
      apiRequest<Record<string, unknown>>(`/tasks/${taskId}/submit`, {
        method: "POST",
        body: { ...body, expectedCurrentSubmissionId: body.expectedCurrentSubmissionId ?? null },
        headers: {
          "Idempotency-Key":
            idempotencyKey ??
            (typeof crypto !== "undefined" && "randomUUID" in crypto
              ? crypto.randomUUID()
              : `${taskId}-${Date.now()}`),
        },
      }).then(mapSubmissionRecord),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: submissionKeys.all });
      if (variables.taskId) {
        queryClient.invalidateQueries({
          queryKey: submissionKeys.task(variables.taskId),
        });
        queryClient.invalidateQueries({
          queryKey: studioKeys.task(variables.taskId),
        });
      }
      queryClient.invalidateQueries({ queryKey: studioKeys.all });
    },
  });
}

// MF-028 — Mangaka review queue hooks

export function useMangakaReviewQueueQuery(filters?: { assistantId?: string; taskId?: string }) {
  const params = new URLSearchParams();
  params.set("status", "PENDING");
  if (filters?.assistantId) params.set("assistantId", filters.assistantId);
  if (filters?.taskId) params.set("taskId", filters.taskId);
  const qs = params.toString();
  return useQuery<AssistantSubmission[]>({
    queryKey: submissionKeys.mangakaReviewQueue(filters),
    queryFn: async () => {
      const raw = await apiRequest<Record<string, unknown>[]>(`/submissions${qs ? `?${qs}` : ""}`);
      return raw.map(mapSubmissionRecord);
    },
    staleTime: 30000,
    refetchOnMount: "always",
  });
}

export function useSubmissionQuery(submissionId: string) {
  return useQuery<AssistantSubmission>({
    queryKey: submissionKeys.detail(submissionId),
    queryFn: async () => {
      const raw = await apiRequest<Record<string, unknown>>(`/submissions/${submissionId}`);
      return mapSubmissionRecord(raw);
    },
    enabled: !!submissionId,
    staleTime: 30000,
    refetchOnMount: "always",
  });
}

// MF-029 — Editor review queue

export function useEditorReviewQueueQuery(options: { enabled?: boolean } = {}) {
  return useQuery<AssistantSubmission[]>({
    queryKey: submissionKeys.editorReviewQueue(),
    queryFn: async () => {
      const raw = await apiRequest<Record<string, unknown>[]>("/submissions/review-queue");
      return raw.map(mapSubmissionRecord);
    },
    enabled: options.enabled ?? true,
    staleTime: 30000,
  });
}

// MF-030A — Board queue + voting live hooks

export type StudioTask = OriginalStudioTask;
