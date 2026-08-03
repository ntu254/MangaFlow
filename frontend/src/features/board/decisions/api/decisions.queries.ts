import { useQuery } from "@tanstack/react-query";
import { boardApi } from "@/shared/api/services";
import { boardKeys } from "../../api/board-queries";

export interface BoardDecisionHistoryRow {
  id: string;
  type: string;
  title: string;
  status: string;
  date?: string;
  href?: string;
}

export function useBoardDecisionHistoryQuery() {
  return useQuery<BoardDecisionHistoryRow[], Error>({
    // Fallback to queue if decisions doesn't exist on boardKeys, or define it
    queryKey: boardKeys.decisions(),
    queryFn: () => boardApi.decisionHistory() as Promise<BoardDecisionHistoryRow[]>,
    staleTime: 30000,
  });
}
