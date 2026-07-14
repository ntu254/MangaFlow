import type { Chapter, ProductionSeries } from "@/entities/series/model/series-types";
import { chapterKeys, seriesKeys } from "@/entities/series/model/series-types";
import { apiRequest, hasApiTokens, type ApiListEnvelope } from "@/shared/api/client";
import { seriesApi, type ChaptersListMeta } from "@/shared/api/services";
import { useAuth } from "@/shared/auth";
import type { TableState } from "@/shared/table";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";

export type SendEditorReviewResult = {
  chapter: Chapter;
  pages: Chapter["pages"];
  nextStatus: "EDITOR_REVIEW";
  flow: "ASSISTANT_TASK" | "DIRECT";
  message: string;
};

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

export function useMyChaptersListQuery(tableState: TableState) {
  const user = useAuth((s) => s.user);
  const canLoadMyChapters =
    user?.role === "admin" ||
    user?.role === "editor" ||
    user?.role === "mangaka" ||
    user?.role === "assistant";

  return useQuery<ApiListEnvelope<Chapter, ChaptersListMeta>>({
    queryKey: [...chapterKeys.all, "list", tableState],
    queryFn: () =>
      seriesApi.myChaptersList(tableState) as Promise<ApiListEnvelope<Chapter, ChaptersListMeta>>,
    enabled: !!user && hasApiTokens() && canLoadMyChapters,
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

export function useChaptersForSeriesQuery(seriesIds: string[]) {
  const sortedIds = useMemo(() => [...new Set(seriesIds.filter(Boolean))].sort(), [seriesIds]);
  return useQuery<Chapter[]>({
    queryKey: seriesKeys.chaptersBundle(sortedIds),
    queryFn: async () => {
      const groups = await Promise.all(
        sortedIds.map((seriesId) =>
          apiRequest<Chapter[]>(`/series/${seriesId}/chapters?pageSize=100`),
        ),
      );
      return groups.flat();
    },
    enabled: sortedIds.length > 0,
    staleTime: 60000,
  });
}

export function useChapterQuery(chapterId: string) {
  return useQuery<Chapter, Error>({
    queryKey: chapterKeys.detail(chapterId),
    queryFn: () => apiRequest<Chapter>(`/chapters/${chapterId}`),
    enabled: !!chapterId,
    staleTime: 60000,
  });
}

export function useChapterActionMutation(chapterId: string, seriesId?: string) {
  const queryClient = useQueryClient();
  return useMutation<Chapter, Error, { action: string; payload?: unknown }>({
    mutationFn: ({ action, payload }) =>
      apiRequest<Chapter>(`/chapters/${chapterId}/actions/${action}`, {
        method: "POST",
        body: payload,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chapterKeys.detail(chapterId) });
      queryClient.invalidateQueries({ queryKey: chapterKeys.readiness(chapterId) });
      if (seriesId) {
        queryClient.invalidateQueries({ queryKey: seriesKeys.chapters(seriesId) });
      }
    },
  });
}

export function useSendChapterToEditorReviewMutation(chapterId: string, seriesId?: string) {
  const queryClient = useQueryClient();
  return useMutation<SendEditorReviewResult, Error, void>({
    mutationFn: () =>
      apiRequest<SendEditorReviewResult>(`/studio/chapters/${chapterId}/send-editor-review`, {
        method: "POST",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chapterKeys.detail(chapterId) });
      queryClient.invalidateQueries({ queryKey: chapterKeys.readiness(chapterId) });
      queryClient.invalidateQueries({ queryKey: ["submissions", "editorReviewQueue"] });
      if (seriesId) {
        queryClient.invalidateQueries({ queryKey: seriesKeys.chapters(seriesId) });
      }
    },
  });
}
