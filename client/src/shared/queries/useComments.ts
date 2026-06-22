import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { commentsApi, type CreateCommentInput } from "@/shared/api/comments";
import { qk } from "./keys";

export function useTaskComments(taskId: string) {
  return useQuery({
    queryKey: qk.comments.byTask(taskId),
    queryFn: () => commentsApi.listByTask(taskId),
    enabled: Boolean(taskId),
  });
}

export function useCreateComment(options?: { taskId?: string }) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCommentInput) => commentsApi.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.comments.root });
      if (options?.taskId) {
        queryClient.invalidateQueries({ queryKey: qk.comments.byTask(options.taskId) });
      }
    },
  });
}

export function useMarkCommentFixed(taskId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => commentsApi.markFixed(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.comments.root });
      if (taskId) {
        queryClient.invalidateQueries({ queryKey: qk.comments.byTask(taskId) });
      }
    },
  });
}

export function useVerifyCommentFixed(taskId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => commentsApi.verifyFixed(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.comments.root });
      if (taskId) {
        queryClient.invalidateQueries({ queryKey: qk.comments.byTask(taskId) });
      }
    },
  });
}

export function useResolveComment(taskId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => commentsApi.resolve(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.comments.root });
      if (taskId) {
        queryClient.invalidateQueries({ queryKey: qk.comments.byTask(taskId) });
      }
    },
  });
}

export function useReopenComment(taskId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => commentsApi.reopen(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.comments.root });
      if (taskId) {
        queryClient.invalidateQueries({ queryKey: qk.comments.byTask(taskId) });
      }
    },
  });
}
