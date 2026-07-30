import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  castBoardVote,
  getBoardSessionDetail,
  type BoardSessionDetail,
  type BoardVoteValue,
} from "@/services/board-mobile-data-source"
import { mobileInboxKeys } from "@/services/mobile-inbox-data-source"

export const boardSessionKeys = {
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
    void queryClient.invalidateQueries({ queryKey: boardSessionKeys.detail(sessionId) })
    void queryClient.invalidateQueries({ queryKey: mobileInboxKeys.role("board") })
  }

  const vote = useMutation({
    mutationFn: (input: { proposalId: string; value: BoardVoteValue; expectedVersion: number | null }) =>
      castBoardVote({ ...input, sessionId }),
    onSuccess: invalidate,
  })

  return { detail, vote }
}
