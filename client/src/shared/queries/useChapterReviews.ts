import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { extractErrorMessage } from "@/shared/api";
import {
  chapterReviewsApi,
  type ChapterReviewDecisionInput,
  type CreateChapterReviewAnnotationInput,
  type PatchChapterReviewAnnotationInput,
} from "@/shared/api/chapterReviews";
import { invalidateSeries, qk } from "./keys";

function chapterIdOf(value: unknown) {
  if (typeof value === "string") return value;
  if (value && typeof value === "object") {
    const record = value as { id?: string; _id?: string };
    return record.id ?? record._id;
  }
  return undefined;
}

export function useChapterVersions(chapterId: string | undefined) {
  return useQuery({
    queryKey: qk.chapterReviews.byChapter(chapterId),
    queryFn: () => chapterReviewsApi.listChapterVersions(chapterId!),
    enabled: !!chapterId,
  });
}

export function useSubmitChapterVersion(seriesId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (chapterId: string) => chapterReviewsApi.submitChapterVersion(chapterId),
    onSuccess: (_, chapterId) => {
      qc.invalidateQueries({ queryKey: qk.chapterReviews.byChapter(chapterId) });
      qc.invalidateQueries({ queryKey: qk.editor.chapterReviewQueue() });
      if (seriesId) invalidateSeries(qc, seriesId);
      toast.success("Chapter version submitted to Editor");
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });
}

export function useEditorChapterReviewQueue() {
  return useQuery({
    queryKey: qk.editor.chapterReviewQueue(),
    queryFn: chapterReviewsApi.listEditorQueue,
  });
}

export function useChapterVersionDetail(versionId: string | undefined) {
  return useQuery({
    queryKey: qk.chapterReviews.detail(versionId),
    queryFn: () => chapterReviewsApi.getVersionDetail(versionId!),
    enabled: !!versionId,
  });
}

export function useApproveChapterVersion(versionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ChapterReviewDecisionInput) => chapterReviewsApi.approve(versionId, input),
    onSuccess: (version) => {
      const chapterId = chapterIdOf(version.chapterId);
      qc.invalidateQueries({ queryKey: qk.chapterReviews.detail(versionId) });
      if (chapterId) qc.invalidateQueries({ queryKey: qk.chapterReviews.byChapter(chapterId) });
      qc.invalidateQueries({ queryKey: qk.editor.chapterReviewQueue() });
      qc.invalidateQueries({ queryKey: qk.series.root });
      toast.success("Chapter version approved and locked");
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });
}

export function useRequestChapterVersionRevision(versionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ChapterReviewDecisionInput) =>
      chapterReviewsApi.requestRevision(versionId, input),
    onSuccess: (version) => {
      const chapterId = chapterIdOf(version.chapterId);
      qc.invalidateQueries({ queryKey: qk.chapterReviews.detail(versionId) });
      if (chapterId) qc.invalidateQueries({ queryKey: qk.chapterReviews.byChapter(chapterId) });
      qc.invalidateQueries({ queryKey: qk.editor.chapterReviewQueue() });
      toast.success("Revision requested");
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });
}

export function useCreateChapterReviewAnnotation(versionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateChapterReviewAnnotationInput) =>
      chapterReviewsApi.createAnnotation(versionId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.chapterReviews.detail(versionId) });
      toast.success("Annotation added");
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });
}

export function usePatchChapterReviewAnnotation(versionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      annotationId,
      input,
    }: {
      annotationId: string;
      input: PatchChapterReviewAnnotationInput;
    }) => chapterReviewsApi.patchAnnotation(annotationId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.chapterReviews.detail(versionId) });
      toast.success("Annotation updated");
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });
}
