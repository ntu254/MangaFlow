import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { boardApi, type BoardFinalizeInput, type BoardTieBreakInput, type BoardVoteInput } from "@/features/reviews/services/board.api"

export function useBoardQueue() {
  return useQuery({
    queryKey: ["board", "queue"],
    queryFn: async () => {
      const { data } = await boardApi.queue()
      return data.data
    },
  })
}

export function useBoardActions(seriesId: string | undefined) {
  const queryClient = useQueryClient()
  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ["board"] })
    if (seriesId) await queryClient.invalidateQueries({ queryKey: ["series", seriesId] })
  }

  const vote = useMutation({
    mutationFn: (input: BoardVoteInput) => boardApi.vote(seriesId!, input),
    onSuccess: () => {
      toast.success("Vote recorded")
      void invalidate()
    },
    onError: () => toast.error("Failed to record vote"),
  })

  const finalize = useMutation({
    mutationFn: (input: BoardFinalizeInput) => boardApi.finalize(seriesId!, input),
    onSuccess: () => {
      toast.success("Decision finalized")
      void invalidate()
    },
    onError: () => toast.error("Failed to finalize decision"),
  })

  const tieBreak = useMutation({
    mutationFn: (input: BoardTieBreakInput) => boardApi.tieBreak(seriesId!, input),
    onSuccess: () => {
      toast.success("Tie-break finalized")
      void invalidate()
    },
    onError: () => toast.error("Failed to finalize tie-break"),
  })

  return { vote, finalize, tieBreak }
}
