import { useQuery } from "@tanstack/react-query"
import {
  getBoardDecisionHistory,
  getBoardRankings,
} from "@/services/board-mobile-data-source"

export const boardReadKeys = {
  rankings: ["board", "rankings"] as const,
  history: ["board", "history"] as const,
}

export function useBoardRankings() {
  return useQuery({
    queryKey: boardReadKeys.rankings,
    queryFn: getBoardRankings,
  })
}

export function useBoardDecisionHistory() {
  return useQuery({
    queryKey: boardReadKeys.history,
    queryFn: getBoardDecisionHistory,
  })
}
