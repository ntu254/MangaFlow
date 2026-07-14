import type { Chapter, ProductionSeries } from "@/entities/series/model/series-types";
import type { StudioComment, StudioRegion, StudioTask } from "@/entities/series/model/studio-types";
import type { AssistantSubmission } from "@/entities/submission/model/assistant-types";
import type { AssistantEarning } from "@/entities/submission/model/assistant-types";
import { apiRequest, hasApiTokens } from "@/shared/api/client";
import { assistantEarningsApi, notificationsApi } from "@/shared/api/services";
import { useAuth } from "@/shared/auth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";

type StudioTaskFilters = {
  seriesId?: string;
  chapterId?: string;
  pageId?: string;
  regionId?: string;
  assigneeId?: string;
  status?: string;
};

type StudioRegionFilters = {
  pageId?: string;
  chapterId?: string;
  seriesId?: string;
};

type StudioCommentFilters = {
  seriesId?: string;
  chapterId?: string;
  pageId?: string;
  regionId?: string;
  taskId?: string;
};

type SubmissionFilters = {
  assistantId?: string;
  taskId?: string;
  status?: string;
};

export type { MaterialItem, MaterialVersionItem } from "@/entities/series/model/series-types";
import type { MaterialItem } from "@/entities/series/model/series-types";

export type NotificationRecord = {
  id: string;
  userId: string;
  kind: string;
  title?: string;
  message: string;
  link?: string;
  proposalId?: string;
  createdAt: string;
  readAt?: string;
  archivedAt?: string;
};

const seriesKeys = {
  all: ["series"] as const,
  mine: () => [...seriesKeys.all, "mine"] as const,
  detail: (seriesId: string) => [...seriesKeys.all, "detail", seriesId] as const,
  chapters: (seriesId: string) => [...seriesKeys.all, "detail", seriesId, "chapters"] as const,
  chaptersBundle: (seriesIds: string[]) =>
    [...seriesKeys.all, "chaptersBundle", [...seriesIds].sort()] as const,
};

const chapterKeys = {
  all: ["chapters"] as const,
  detail: (chapterId: string) => [...chapterKeys.all, "detail", chapterId] as const,
  readiness: (chapterId: string) => [...chapterKeys.detail(chapterId), "readiness"] as const,
};

const studioKeys = {
  all: ["studio"] as const,
  regions: (filters: StudioRegionFilters) => [...studioKeys.all, "regions", filters] as const,
  tasks: (filters: StudioTaskFilters) => [...studioKeys.all, "tasks", filters] as const,
  task: (taskId: string) => [...studioKeys.all, "task", taskId] as const,
  comments: (filters: StudioCommentFilters) => [...studioKeys.all, "comments", filters] as const,
  taskComments: (taskId: string) => [...studioKeys.all, "comments", "task", taskId] as const,
};

const submissionKeys = {
  all: ["submissions"] as const,
  list: (filters?: SubmissionFilters) => ["submissions", "list", filters ?? {}] as const,
  task: (taskId: string) => ["submissions", "task", taskId] as const,
};

const materialKeys = {
  series: (seriesId: string) => ["materials", "series", seriesId] as const,
};

const notificationKeys = {
  all: ["notifications"] as const,
  list: () => [...notificationKeys.all, "list"] as const,
};

function buildQuery(filters: Record<string, string | undefined>) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

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
    case "SUBMITTED":
    case "IN_REVIEW":
      return "SUBMITTED";
    case "REVISION_REQUESTED":
    case "MANGAKA_REVISION_REQUESTED":
    case "EDITOR_REVISION_REQUESTED":
      return "REVISION_REQUESTED";
    case "MANGAKA_APPROVED":
      return "MANGAKA_APPROVED";
    case "EDITOR_APPROVED":
      return "EDITOR_APPROVED";
    case "APPROVED":
      return "APPROVED";
    case "REJECTED":
      return "REJECTED";
    default:
      return "DRAFT";
  }
}

export function useMySeriesQuery() {
  return useQuery<ProductionSeries[]>({
    queryKey: seriesKeys.mine(),
    queryFn: () => apiRequest<ProductionSeries[]>("/series?mine=true"),
    staleTime: 60000,
  });
}

export function useSeriesDetailQuery(seriesId: string) {
  return useQuery<ProductionSeries>({
    queryKey: seriesKeys.detail(seriesId),
    queryFn: () => apiRequest<ProductionSeries>(`/series/${seriesId}`),
    enabled: !!seriesId,
    staleTime: 60000,
  });
}

export function useMyChaptersQuery() {
  const user = useAuth((s) => s.user);
  const canLoadMyChapters =
    user?.role === "admin" ||
    user?.role === "editor" ||
    user?.role === "mangaka" ||
    user?.role === "assistant";

  return useQuery<Chapter[]>({
    queryKey: chapterKeys.all,
    queryFn: () => apiRequest<Chapter[]>("/chapters?mine=true&pageSize=100"),
    enabled: !!user && hasApiTokens() && canLoadMyChapters,
    staleTime: 60000,
  });
}

export function useChapterDetailQuery(chapterId: string) {
  return useQuery<Chapter>({
    queryKey: chapterKeys.detail(chapterId),
    queryFn: () => apiRequest<Chapter>(`/chapters/${chapterId}`),
    enabled: !!chapterId,
    staleTime: 60000,
  });
}

export function useChaptersForSeriesQuery(seriesIds: string[]) {
  const sortedIds = useMemo(() => [...new Set(seriesIds.filter(Boolean))].sort(), [seriesIds]);
  return useQuery<Chapter[]>({
    queryKey: seriesKeys.chaptersBundle(sortedIds),
    queryFn: async () => {
      const groups = await Promise.all(
        sortedIds.map((seriesId) => apiRequest<Chapter[]>(`/series/${seriesId}/chapters?pageSize=100`)),
      );
      return groups.flat();
    },
    enabled: sortedIds.length > 0,
    staleTime: 60000,
  });
}

export function useStudioRegionsQuery(filters: StudioRegionFilters, enabled = true) {
  const qs = buildQuery({ ...filters, pageSize: "100" });
  return useQuery<StudioRegion[]>({
    queryKey: studioKeys.regions(filters),
    queryFn: () => apiRequest<StudioRegion[]>(`/studio/regions${qs}`),
    enabled,
    staleTime: 30000,
  });
}

export function useStudioTasksQuery(filters: StudioTaskFilters) {
  const qs = buildQuery({ ...filters, pageSize: "100" });
  return useQuery<StudioTask[]>({
    queryKey: studioKeys.tasks(filters),
    queryFn: () => apiRequest<StudioTask[]>(`/studio/tasks${qs}`),
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
      queryClient.invalidateQueries({ queryKey: studioKeys.task(taskId) });
      queryClient.invalidateQueries({ queryKey: studioKeys.all });
      if (variables.chapterId) {
        queryClient.invalidateQueries({
          queryKey: chapterKeys.readiness(variables.chapterId),
        });
      }
    },
  });
}

export function useCommentsQuery(filters: StudioCommentFilters) {
  const qs = buildQuery({ ...filters, pageSize: "100" });
  return useQuery<StudioComment[]>({
    queryKey: studioKeys.comments(filters),
    queryFn: () => apiRequest<StudioComment[]>(`/comments${qs}`),
    staleTime: 30000,
  });
}

export function useTaskCommentsQuery(taskId: string) {
  return useQuery<StudioComment[]>({
    queryKey: studioKeys.taskComments(taskId),
    queryFn: () => apiRequest<StudioComment[]>(`/comments/task/${taskId}`),
    enabled: !!taskId,
    staleTime: 30000,
  });
}

export function useUpdateCommentMutation() {
  const queryClient = useQueryClient();
  return useMutation<
    StudioComment,
    Error,
    { commentId: string; patch: Partial<StudioComment>; chapterId?: string; pageId?: string }
  >({
    mutationFn: ({ commentId, patch }) =>
      apiRequest<StudioComment>(`/comments/${commentId}`, { method: "PATCH", body: patch }),
    onSuccess: (_data, variables) => {
      if (variables.chapterId) {
        queryClient.invalidateQueries({
          queryKey: studioKeys.comments({ chapterId: variables.chapterId }),
        });
      }
      if (variables.pageId) {
        queryClient.invalidateQueries({
          queryKey: studioKeys.comments({ pageId: variables.pageId }),
        });
      }
    },
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

export function useTaskSubmissionsQuery(taskId: string) {
  return useQuery<AssistantSubmission[]>({
    queryKey: submissionKeys.task(taskId),
    queryFn: async () => {
      const raw = await apiRequest<Record<string, unknown>[]>(`/tasks/${taskId}/submissions`);
      return raw.map(mapSubmissionRecord);
    },
    enabled: !!taskId,
    staleTime: 30000,
  });
}

export function useSubmissionsQuery(filters: SubmissionFilters) {
  const qs = buildQuery({ ...filters, pageSize: "100" });
  return useQuery<AssistantSubmission[]>({
    queryKey: submissionKeys.list(filters),
    queryFn: async () => {
      const raw = await apiRequest<Record<string, unknown>[]>(`/submissions${qs}`);
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
      regionId?: string;
      fileKey?: string;
      fileName?: string;
      fileUrl?: string;
      fileSizeKB?: number;
      mimeType?: string;
      imageUrl?: string;
      notes?: string;
      intent?: "DRAFT" | "SUBMIT";
      version?: number;
      status?: "DRAFT" | "SUBMITTED";
    }
  >({
    mutationFn: (body) =>
      apiRequest<Record<string, unknown>>("/submissions", {
        method: "POST",
        body,
      }).then(mapSubmissionRecord),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: submissionKeys.all });
      if (variables.taskId) {
        queryClient.invalidateQueries({
          queryKey: submissionKeys.task(variables.taskId),
        });
      }
    },
  });
}

export function useNotificationsQuery() {
  const user = useAuth((s) => s.user);

  return useQuery<NotificationRecord[]>({
    queryKey: notificationKeys.list(),
    queryFn: async () => {
      const res = (await notificationsApi.list()) as {
        success: boolean;
        data: NotificationRecord[];
      };
      return res.data ?? [];
    },
    staleTime: 60000,
    enabled: !!user && hasApiTokens(),
    refetchOnWindowFocus: true,
    refetchInterval: 60000,
    retry: 1,
  });
}

export function useMarkReadMutation() {
  const queryClient = useQueryClient();
  return useMutation<unknown, Error, string>({
    mutationFn: (id) => notificationsApi.read(id) as Promise<unknown>,
    onSuccess: () => {
      queryClient.setQueryData<NotificationRecord[]>(notificationKeys.list(), (old) =>
        old?.map((n) => (n.readAt ? n : { ...n, readAt: new Date().toISOString() })),
      );
    },
  });
}

export function useMarkAllReadMutation() {
  const queryClient = useQueryClient();
  return useMutation<
    { successIds: string[]; failureIds: string[]; errorCount: number },
    Error,
    { notificationIds: string[] }
  >({
    mutationFn: async ({ notificationIds }) => {
      const results = await Promise.allSettled(
        notificationIds.map((id) => notificationsApi.read(id)),
      );
      const successIds: string[] = [];
      const failureIds: string[] = [];

      results.forEach((result, index) => {
        const id = notificationIds[index];
        if (result.status === "fulfilled") {
          successIds.push(id);
        } else {
          failureIds.push(id);
        }
      });

      return {
        successIds,
        failureIds,
        errorCount: failureIds.length,
      };
    },
    onSuccess: ({ successIds }) => {
      queryClient.setQueryData<NotificationRecord[]>(notificationKeys.list(), (old) =>
        old?.map((n) =>
          successIds.includes(n.id) && !n.readAt ? { ...n, readAt: new Date().toISOString() } : n,
        ),
      );
    },
  });
}

export function mapNotificationError(err: unknown): string {
  if (err instanceof Error) {
    if (err.message.includes("NOT_FOUND")) return "Notification not found.";
    if (err.message.includes("FORBIDDEN"))
      return "You do not have permission to perform this action.";
    return err.message;
  }
  return "An unknown error occurred.";
}

export function useAssistantEarningsQuery() {
  return useQuery<AssistantEarning[], Error>({
    queryKey: ["assistant", "earnings"],
    queryFn: () => assistantEarningsApi.list() as Promise<AssistantEarning[]>,
  });
}
