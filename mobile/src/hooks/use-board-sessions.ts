import { useQuery } from "@tanstack/react-query"
import {
  getBoardPendingProposals,
  getBoardSessions,
} from "@/services/board-mobile-data-source"
import { boardSessionKeys } from "@/hooks/use-board-session"

export function useBoardSessions() {
  return useQuery({
    queryKey: boardSessionKeys.list,
    queryFn: getBoardSessions,
  })
}

export function useBoardPendingProposals() {
  return useQuery({
    queryKey: boardSessionKeys.pendingProposals,
    queryFn: getBoardPendingProposals,
  })
}
