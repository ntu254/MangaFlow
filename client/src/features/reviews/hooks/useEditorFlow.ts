import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { editorApi, type EditorForwardInput, type EditorRejectInput, type EditorRevisionInput } from "@/features/reviews/services/editor.api"
import { submissionApi } from "@/features/reviews/services/submission.api"

export function useEditorReviewQueue() {
  return useQuery({
    queryKey: ["editor", "review-queue"],
    queryFn: async () => {
      const { data } = await editorApi.reviewQueue()
      return data.data
    },
  })
}

export function useEditorPageReviewQueue() {
  return useQuery({
    queryKey: ["editor", "page-review-queue"],
    queryFn: async () => {
      const { data } = await submissionApi.reviewQueue()
      return data.data
    },
  })
}

export function useEditorSeriesReview(seriesId: string | undefined) {
  return useQuery({
    queryKey: ["editor", "series-review", seriesId],
    queryFn: async () => {
      if (!seriesId) throw new Error("Missing series id")
      const { data } = await editorApi.getSeriesReview(seriesId)
      return data.data
    },
    enabled: Boolean(seriesId),
  })
}

export function useEditorPageApprove() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ submissionId, reviewerNote }: { submissionId: string; reviewerNote?: string }) =>
      submissionApi.editorApprove(submissionId, { reviewerNote }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["editor", "page-review-queue"] })
      queryClient.invalidateQueries({ queryKey: ["mangaka", "review-queue"] })
    },
  })
}

export function useEditorPageRequestRevision() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ submissionId, reviewerNote }: { submissionId: string; reviewerNote: string }) =>
      submissionApi.requestRevision(submissionId, reviewerNote),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["editor", "page-review-queue"] })
      queryClient.invalidateQueries({ queryKey: ["mangaka", "review-queue"] })
    },
  })
}

export function useEditorPageReject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ submissionId, reviewerNote }: { submissionId: string; reviewerNote: string }) =>
      submissionApi.editorReject(submissionId, reviewerNote),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["editor", "page-review-queue"] })
      queryClient.invalidateQueries({ queryKey: ["mangaka", "review-queue"] })
    },
  })
}

export function useEditorActions(seriesId: string | undefined) {
  const queryClient = useQueryClient()
  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ["editor"] })
    await queryClient.invalidateQueries({ queryKey: ["board"] })
    if (seriesId) await queryClient.invalidateQueries({ queryKey: ["series", seriesId] })
  }

  const requestRevision = useMutation({
    mutationFn: (input: EditorRevisionInput) => editorApi.requestRevision(seriesId!, input),
    onSuccess: () => {
      toast.success("Revision requested")
      void invalidate()
    },
    onError: () => toast.error("Failed to request revision"),
  })

  const reject = useMutation({
    mutationFn: (input: EditorRejectInput) => editorApi.reject(seriesId!, input),
    onSuccess: () => {
      toast.success("Series rejected")
      void invalidate()
    },
    onError: () => toast.error("Failed to reject series"),
  })

  const forwardToBoard = useMutation({
    mutationFn: (input: EditorForwardInput) => editorApi.forwardToBoard(seriesId!, input),
    onSuccess: () => {
      toast.success("Forwarded to Board")
      void invalidate()
    },
    onError: () => toast.error("Failed to forward to Board"),
  })

  return { requestRevision, reject, forwardToBoard }
}
