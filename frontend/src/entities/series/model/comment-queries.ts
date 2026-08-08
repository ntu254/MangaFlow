import type { StudioComment } from "@/entities/series/model/studio-types";
import { chapterKeys, studioKeys } from "@/entities/series/model/series-types";
import { apiRequest } from "@/shared/api/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useCommentsQuery(filters: {
  seriesId?: string;
  chapterId?: string;
  pageId?: string;
  regionId?: string;
  taskId?: string;
  refetchInterval?: number;
  staleTime?: number;
}) {
  const { refetchInterval, staleTime, ...filterParams } = filters;
  const params = new URLSearchParams();
  if (filterParams.seriesId) params.set("seriesId", filterParams.seriesId);
  if (filterParams.chapterId) params.set("chapterId", filterParams.chapterId);
  if (filterParams.pageId) params.set("pageId", filterParams.pageId);
  if (filterParams.regionId) params.set("regionId", filterParams.regionId);
  if (filterParams.taskId) params.set("taskId", filterParams.taskId);
  const qs = params.toString();
  return useQuery<StudioComment[]>({
    queryKey: studioKeys.comments(filterParams),
    queryFn: () => apiRequest<StudioComment[]>(`/comments${qs ? `?${qs}` : ""}`),
    staleTime: staleTime ?? 30000,
    refetchInterval,
  });
}

export function useCreateCommentMutation() {
  const queryClient = useQueryClient();
  return useMutation<
    StudioComment,
    Error,
    {
      chapterId: string;
      pageId: string;
      regionId?: string;
      taskId?: string;
      seriesId?: string;
      targetType?: "CHAPTER" | "PAGE" | "REGION" | "TASK" | "SUBMISSION";
      targetId?: string;
      body?: string;
      text: string;
      isBlocking?: boolean;
      x?: number;
      y?: number;
    }
  >({
    mutationFn: (body) => apiRequest<StudioComment>("/comments", { method: "POST", body }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: studioKeys.comments({ chapterId: variables.chapterId }),
      });
      queryClient.invalidateQueries({
        queryKey: studioKeys.comments({ pageId: variables.pageId }),
      });
      if (variables.taskId) {
        queryClient.invalidateQueries({
          queryKey: studioKeys.comments({ taskId: variables.taskId }),
        });
      }
      if (variables.regionId) {
        queryClient.invalidateQueries({
          queryKey: studioKeys.comments({ regionId: variables.regionId }),
        });
      }
      if (variables.seriesId) {
        queryClient.invalidateQueries({
          queryKey: studioKeys.comments({ seriesId: variables.seriesId }),
        });
      }
    },
  });
}

export function useReplyCommentMutation() {
  const queryClient = useQueryClient();
  return useMutation<
    StudioComment,
    Error,
    {
      parentCommentId: string;
      body: string;
      chapterId?: string;
      pageId?: string;
      taskId?: string;
    }
  >({
    mutationFn: ({ parentCommentId, body }) =>
      apiRequest<StudioComment>(`/comments/${parentCommentId}/replies`, {
        method: "POST",
        body: { body },
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: studioKeys.all });
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
      if (variables.taskId) {
        queryClient.invalidateQueries({
          queryKey: studioKeys.comments({ taskId: variables.taskId }),
        });
      }
    },
  });
}

export function useAddressCommentMutation() {
  const queryClient = useQueryClient();
  return useMutation<
    StudioComment,
    Error,
    { commentId: string; chapterId?: string; pageId?: string; taskId?: string }
  >({
    mutationFn: ({ commentId }) =>
      apiRequest<StudioComment>(`/comments/${commentId}/address`, {
        method: "POST",
        body: {},
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: studioKeys.all });
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
