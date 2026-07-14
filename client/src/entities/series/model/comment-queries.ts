import type { StudioComment } from "@/entities/series/model/studio-types";
import { studioKeys } from "@/entities/series/model/series-types";
import { apiRequest, type ApiListEnvelope } from "@/shared/api/client";
import { studioApi, type StudioCommentsListMeta } from "@/shared/api/services";
import type { TableState } from "@/shared/table";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useCommentsQuery(filters: {
  seriesId?: string;
  chapterId?: string;
  pageId?: string;
  regionId?: string;
  taskId?: string;
}) {
  const params = new URLSearchParams();
  if (filters.seriesId) params.set("seriesId", filters.seriesId);
  if (filters.chapterId) params.set("chapterId", filters.chapterId);
  if (filters.pageId) params.set("pageId", filters.pageId);
  if (filters.regionId) params.set("regionId", filters.regionId);
  if (filters.taskId) params.set("taskId", filters.taskId);
  params.set("pageSize", "100");
  const qs = params.toString();
  return useQuery<StudioComment[]>({
    queryKey: studioKeys.comments(filters),
    queryFn: () => apiRequest<StudioComment[]>(`/comments${qs ? `?${qs}` : ""}`),
    staleTime: 30000,
  });
}

export function useCommentsListQuery(tableState: TableState) {
  return useQuery<ApiListEnvelope<StudioComment, StudioCommentsListMeta>>({
    queryKey: [...studioKeys.all, "commentsList", tableState] as const,
    queryFn: () =>
      studioApi.commentsList(tableState) as Promise<
        ApiListEnvelope<StudioComment, StudioCommentsListMeta>
      >,
    staleTime: 30000,
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
      blocking?: boolean;
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
