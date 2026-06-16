import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { submissionApi, type ReviewQueueItem } from "@/features/reviews/services/submission.api"

export function useMangakaReviewQueue() {
  return useQuery({
    queryKey: ["mangaka", "review-queue"],
    queryFn: async () => {
      const res = await submissionApi.reviewQueue()
      return res.data.data.filter((item: ReviewQueueItem) => item.status === "SUBMITTED")
    },
  })
}

export function useMangakaApprove() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      submissionId,
      reviewerNote,
    }: {
      submissionId: string
      reviewerNote?: string
    }) => submissionApi.mangakaApprove(submissionId, { reviewerNote }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mangaka", "review-queue"] })
    },
  })
}

export function useMangakaRequestRevision() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      submissionId,
      reviewerNote,
    }: {
      submissionId: string
      reviewerNote: string
    }) => submissionApi.requestRevision(submissionId, reviewerNote),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mangaka", "review-queue"] })
    },
  })
}

export function useMangakaReject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      submissionId,
      reviewerNote,
    }: {
      submissionId: string
      reviewerNote?: string
    }) => submissionApi.reject(submissionId, { reviewerNote }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mangaka", "review-queue"] })
    },
  })
}
