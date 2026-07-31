import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  cancelBoardSession,
  castBoardVote,
  closeBoardSession,
  getBoardSessionDetail,
  updateBoardSession,
  type BoardSessionDetail,
  type BoardVoteValue,
} from "@/services/board-mobile-data-source"
import { mobileInboxKeys } from "@/services/mobile-inbox-data-source"

export const boardSessionKeys = {
  all: ["board", "sessions"] as const,
  list: ["board", "sessions", "list"] as const,
  pendingProposals: ["board", "sessions", "pending-proposals"] as const,
  detail: (id: string) => ["board", "session", id] as const,
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

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["board"] })
    void queryClient.invalidateQueries({ queryKey: mobileInboxKeys.role("board") })
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
  const cancel = useMutation({
    mutationFn: () => cancelBoardSession(sessionId),
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

  return { detail, vote, close, cancel, update }
}
