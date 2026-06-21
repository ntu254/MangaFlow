import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { submissionsApi, type SubmitTaskSubmissionInput } from "@/shared/api/submissions";
import { qk } from "./keys";

export function useReviewQueue(seriesId?: string) {
  return useQuery({
    queryKey: qk.submissions.reviewQueue(seriesId),
    queryFn: () => submissionsApi.listReviewQueue(seriesId),
  });
}

export function useAllSubmissions() {
  return useQuery({
    queryKey: qk.submissions.root,
    queryFn: submissionsApi.listAll,
  });
}

export function useTaskSubmissions(taskId: string) {
  return useQuery({
    queryKey: qk.submissions.byTask(taskId),
    queryFn: () => submissionsApi.listByTask(taskId),
    enabled: Boolean(taskId),
  });
}

export function useSubmitTaskSubmission(pageId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: SubmitTaskSubmissionInput) => submissionsApi.submitTask(input),
    onSuccess: (_submission, input) => {
      queryClient.invalidateQueries({ queryKey: qk.tasks.root });
      queryClient.invalidateQueries({ queryKey: qk.submissions.byTask(input.taskId) });
      queryClient.invalidateQueries({ queryKey: qk.submissions.root });
      queryClient.invalidateQueries({ queryKey: qk.dashboard.root });
      if (pageId) {
        queryClient.invalidateQueries({ queryKey: qk.pages.studio(pageId) });
      }
    },
  });
}

export function useApproveSubmission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, note }: { id: string; note?: string }) =>
      submissionsApi.mangakaApprove(id, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.dashboard.root });
      queryClient.invalidateQueries({ queryKey: qk.tasks.root });
      queryClient.invalidateQueries({ queryKey: qk.submissions.root });
    },
  });
}

export function useEditorApproveSubmission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, note }: { id: string; note?: string }) =>
      submissionsApi.editorApprove(id, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.dashboard.root });
      queryClient.invalidateQueries({ queryKey: qk.tasks.root });
      queryClient.invalidateQueries({ queryKey: qk.submissions.root });
    },
  });
}

export function useRequestRevision() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, note }: { id: string; note?: string }) =>
      submissionsApi.requestRevision(id, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.dashboard.root });
      queryClient.invalidateQueries({ queryKey: qk.tasks.root });
      queryClient.invalidateQueries({ queryKey: qk.submissions.root });
    },
  });
}
