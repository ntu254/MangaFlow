import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { extractErrorMessage } from "@/shared/api";
import { chaptersApi, type CreateChapterInput } from "../api/chapters";
import { invalidateChapterPages, invalidateSeries, qk } from "./keys";

export function useChapterPages(chapterId: string | undefined) {
  return useQuery({
    queryKey: qk.chapters.pages(chapterId),
    queryFn: () => chaptersApi.getChapterPages(chapterId!),
    enabled: !!chapterId,
  });
}

export function useCreateChapter(seriesId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateChapterInput) => chaptersApi.createChapter(seriesId, input),
    onSuccess: () => {
      invalidateSeries(qc, seriesId);
      toast.success("Chapter created successfully");
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });
}

export function useDeleteChapter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (chapterId: string) => chaptersApi.deleteChapter(chapterId),
    onSuccess: (_, chapterId) => {
      invalidateChapterPages(qc, chapterId);
      invalidateSeries(qc);
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });
}

export function useArchiveChapter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (chapterId: string) => chaptersApi.archiveChapter(chapterId),
    onSuccess: (_, chapterId) => {
      invalidateChapterPages(qc, chapterId);
      invalidateSeries(qc);
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });
}

export function useDeletePage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ chapterId, pageId }: { chapterId: string; pageId: string }) =>
      chaptersApi.deletePage(chapterId, pageId),
    onSuccess: (_, { chapterId }) => {
      invalidateChapterPages(qc, chapterId);
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });
}

export function useReplacePage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      chapterId,
      pageId,
      originalFileAssetId,
    }: {
      chapterId: string;
      pageId: string;
      originalFileAssetId: string;
    }) => chaptersApi.replacePage(chapterId, pageId, originalFileAssetId),
    onSuccess: (_, { chapterId }) => {
      invalidateChapterPages(qc, chapterId);
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });
}

export function useChapterReadiness(chapterId: string | undefined) {
  return useQuery({
    queryKey: ["chapter-readiness", chapterId],
    queryFn: () => chaptersApi.getChapterReadiness(chapterId!),
    enabled: !!chapterId,
  });
}

export function useMarkChapterReady() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (chapterId: string) => chaptersApi.markChapterReady(chapterId),
    onSuccess: (_, chapterId) => {
      qc.invalidateQueries({ queryKey: ["chapter-readiness", chapterId] });
      qc.invalidateQueries({ queryKey: ["series"] });
      qc.invalidateQueries({ queryKey: ["chapter-pages", chapterId] });
      toast.success("Chapter marked as ready for publication!");
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });
}

export function useSendChapterToEditor(seriesId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (chapterId: string) => chaptersApi.sendChapterToEditor(chapterId),
    onSuccess: (_, chapterId) => {
      invalidateChapterPages(qc, chapterId);
      if (seriesId) invalidateSeries(qc, seriesId);
      qc.invalidateQueries({ queryKey: qk.editor.finalReviewQueue(seriesId) });
      qc.invalidateQueries({ queryKey: qk.editor.managedSeries() });
      toast.success("Chapter sent to Editor review");
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });
}
