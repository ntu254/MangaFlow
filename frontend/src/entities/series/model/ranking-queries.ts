import { apiRequest } from "@/shared/api/client";
import { useQuery } from "@tanstack/react-query";
import type { ProductionSeries, SeriesRanking } from "./series-types";
import { seriesKeys } from "./series-types";

export const rankingKeys = {
  all: ["rankings"] as const,
  list: () => [...rankingKeys.all, "list"] as const,
};

export function useMySeriesQuery(enabled = true) {
  return useQuery<ProductionSeries[]>({
    queryKey: seriesKeys.mine(),
    queryFn: () => apiRequest<ProductionSeries[]>("/series?mine=true"),
    enabled,
    staleTime: 60000,
  });
}

export function useRankingsListQuery(enabled = true) {
  return useQuery<SeriesRanking[]>({
    queryKey: rankingKeys.list(),
    queryFn: () => apiRequest<SeriesRanking[]>("/rankings"),
    enabled,
    staleTime: 60000,
  });
}
