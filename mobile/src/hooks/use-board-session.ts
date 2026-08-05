import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  castBoardVote,
  closeBoardSession,
  getBoardSessionDetail,
  updateBoardSession,
  type BoardSessionDetail,
  type BoardVoteValue,
} from "@/services/board-mobile-data-source"
import { mobileInboxKeys } from "@/services/mobile-inbox-data-source"
import { getReviewFiles } from "@/services/mobile-file-review"

export const boardSessionKeys = {
  all: ["board"] as const,
  list: ["board", "sessions", "list"] as const,
  pendingProposals: ["board", "sessions", "pending-proposals"] as const,
  detail: (id: string) => ["board", "session", id] as const,
  reviewFiles: (proposalId: string) => ["board", "proposal", proposalId, "review-files"] as const,
}

export function useBoardSession(
  sessionId: string,
  getDetail: (id: string) => Promise<BoardSessionDetail> = getBoardSessionDetail,
) {
  const queryClient = useQueryClient()

  const detail = useQuery({
    queryKey: boardSessionKeys.detail(sessionId),
    queryFn: () => getDetail(sessionId),
  })

  // Board reviews the frozen proposal manuscript/attachments only — never
  // chapter, page, task, or submission files. The review context is the
  // session's proposal, so this can only load once the session detail
  // resolves a proposalId.
  const proposalId = detail.data?.session.proposalId ?? null
  const reviewFiles = useQuery({
    queryKey: boardSessionKeys.reviewFiles(proposalId ?? ""),
    queryFn: () => getReviewFiles("proposal", proposalId as string),
    enabled: proposalId !== null,
  })

  const invalidate = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: boardSessionKeys.all }),
      queryClient.invalidateQueries({ queryKey: mobileInboxKeys.role("board") }),
    ])
  }

  const vote = useMutation({
    mutationFn: (input: {
      proposalId: string
      value: BoardVoteValue
      expectedVersion: number
      note?: string
    }) =>
      castBoardVote({ ...input, sessionId }),
    onSuccess: invalidate,
  })
  const close = useMutation({
    mutationFn: (input: {
      expectedVersion: number
      note?: string
      publicationType?: "WEEKLY" | "MONTHLY"
    }) =>
      closeBoardSession(sessionId, input),
    onSuccess: invalidate,
  })
  const update = useMutation({
    mutationFn: (input: {
      expectedVersion: number
      title?: string
      scheduledFor?: string | null
      closesAt?: string | null
    }) => updateBoardSession(sessionId, input),
    onSuccess: invalidate,
  })

  return { detail, vote, close, update, reviewFiles }
}
