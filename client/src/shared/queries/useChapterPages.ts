import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { extractErrorMessage } from "@/shared/api";
import { chaptersApi } from "../api/chapters";

export function useChapterPages(chapterId: string | undefined) {
  return useQuery({
    queryKey: ["chapter-pages", chapterId],
    queryFn: () => chaptersApi.getChapterPages(chapterId!),
    enabled: !!chapterId,
  });
}

export function useDeleteChapter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (chapterId: string) => chaptersApi.deleteChapter(chapterId),
    onSuccess: (_, chapterId) => {
      qc.invalidateQueries({ queryKey: ["chapter-pages", chapterId] });
      qc.invalidateQueries({ queryKey: ["series"] });
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });
}

export function useCancelChapter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (chapterId: string) => chaptersApi.cancelChapter(chapterId),
    onSuccess: (_, chapterId) => {
      qc.invalidateQueries({ queryKey: ["chapter-pages", chapterId] });
      qc.invalidateQueries({ queryKey: ["series"] });
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
      qc.invalidateQueries({ queryKey: ["chapter-pages", chapterId] });
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });
}

export function useReplacePage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ chapterId, pageId, originalFileAssetId }: { chapterId: string; pageId: string; originalFileAssetId: string }) => 
      chaptersApi.replacePage(chapterId, pageId, originalFileAssetId),
    onSuccess: (_, { chapterId }) => {
      qc.invalidateQueries({ queryKey: ["chapter-pages", chapterId] });
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });
}
