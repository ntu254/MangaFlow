import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  editorApi,
  type EditorForwardInput,
  type EditorRejectInput,
  type EditorRevisionInput,
} from "@/shared/api/editor";
import { extractErrorMessage } from "@/shared/api";
import { qk } from "./keys";

export function useEditorReviewQueue() {
  return useQuery({
    queryKey: ["editor", "series-review-queue"],
    queryFn: editorApi.reviewQueue,
  });
}

export function useEditorSeriesReview(seriesId: string) {
  return useQuery({
    queryKey: ["editor", "series-review", seriesId],
    queryFn: () => editorApi.getSeriesReview(seriesId),
    enabled: !!seriesId,
  });
}

export function useEditorRequestRevision(seriesId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: EditorRevisionInput) => editorApi.requestRevision(seriesId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["editor", "series-review-queue"] });
      qc.invalidateQueries({ queryKey: ["editor", "series-review", seriesId] });
      qc.invalidateQueries({ queryKey: ["series"] });
      toast.success("Revision requested");
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });
}

export function useEditorRejectSeries(seriesId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: EditorRejectInput) => editorApi.rejectSeries(seriesId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["editor", "series-review-queue"] });
      qc.invalidateQueries({ queryKey: ["editor", "series-review", seriesId] });
      qc.invalidateQueries({ queryKey: ["series"] });
      toast.success("Series rejected");
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });
}

export function useEditorForwardToBoard(seriesId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: EditorForwardInput) => editorApi.forwardToBoard(seriesId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["editor", "series-review-queue"] });
      qc.invalidateQueries({ queryKey: ["editor", "series-review", seriesId] });
      qc.invalidateQueries({ queryKey: ["series"] });
      qc.invalidateQueries({ queryKey: ["board", "series-review-queue"] });
      toast.success("Series forwarded to Board");
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });
}

export function useEditorFinalReviewQueue(seriesId?: string) {
  return useQuery({
    queryKey: qk.editor.finalReviewQueue(seriesId),
    queryFn: () => editorApi.listFinalReviewQueue(seriesId),
  });
}

export function useEditorGetTask(taskId: string) {
  return useQuery({
    queryKey: ["editor", "task", taskId],
    queryFn: () => editorApi.getTask(taskId),
    enabled: !!taskId,
  });
}

export function useEditorManagedSeries() {
  return useQuery({
    queryKey: qk.editor.managedSeries(),
    queryFn: editorApi.managedSeries,
  });
}

export function useEditorProductionProgress() {
  return useQuery({
    queryKey: qk.editor.productionProgress(),
    queryFn: editorApi.productionProgress,
  });
}

export function useEditorRankingRisk() {
  return useQuery({
    queryKey: qk.editor.rankingRisk(),
    queryFn: editorApi.rankingRisk,
  });
}

export function useEditorDecisionHistory() {
  return useQuery({
    queryKey: qk.editor.decisionHistory(),
    queryFn: editorApi.decisionHistory,
  });
}

export function useEditorActivity() {
  return useQuery({
    queryKey: qk.editor.activity(),
    queryFn: editorApi.activity,
  });
}

export function useEditorApproveTaskSubmission(taskId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ submissionId, note }: { submissionId: string; note?: string }) =>
      editorApi.editorApproveSubmission(submissionId, note),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["editor", "final-review-queue"] });
      qc.invalidateQueries({ queryKey: ["editor", "task", taskId] });
      qc.invalidateQueries({ queryKey: ["submissions", "by-task", taskId] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Submission approved by Editor");
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });
}

export function useEditorRejectTaskSubmission(taskId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ submissionId, note }: { submissionId: string; note: string }) =>
      editorApi.editorRejectSubmission(submissionId, note),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["editor", "final-review-queue"] });
      qc.invalidateQueries({ queryKey: ["editor", "task", taskId] });
      qc.invalidateQueries({ queryKey: ["submissions", "by-task", taskId] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Submission rejected by Editor");
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });
}

export function useEditorRequestTaskSubmissionRevision(taskId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ submissionId, note }: { submissionId: string; note: string }) =>
      editorApi.editorRequestSubmissionRevision(submissionId, note),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["editor", "final-review-queue"] });
      qc.invalidateQueries({ queryKey: ["editor", "task", taskId] });
      qc.invalidateQueries({ queryKey: ["submissions", "by-task", taskId] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Revision requested by Editor");
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });
}
