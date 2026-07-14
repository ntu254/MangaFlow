import { apiRequest, type ApiListEnvelope } from "@/shared/api/client";
import {
  boardApi,
  seriesApi,
  type RankingsListMeta,
  type SeriesListMeta,
} from "@/shared/api/services";
import type { TableState } from "@/shared/table";
import { useQuery } from "@tanstack/react-query";
import type { ProductionSeries, SeriesRanking } from "./series-types";
import { seriesKeys } from "./series-types";

export const rankingKeys = {
  all: ["rankings"] as const,
  list: () => [...rankingKeys.all, "list"] as const,
};

export function useMySeriesQuery() {
  return useQuery<ProductionSeries[]>({
    queryKey: seriesKeys.mine(),
    queryFn: () => apiRequest<ProductionSeries[]>("/series?mine=true"),
    staleTime: 60000,
  });
}

export function useSeriesListQuery(tableState: TableState, options: { mine?: boolean } = {}) {
  return useQuery<ApiListEnvelope<ProductionSeries, SeriesListMeta>>({
    queryKey: [...seriesKeys.all, "list", tableState, options],
    queryFn: () =>
      seriesApi.listContract(tableState, options) as Promise<
        ApiListEnvelope<ProductionSeries, SeriesListMeta>
      >,
    staleTime: 60000,
  });
}

export function useRankingsListQuery() {
  return useQuery<SeriesRanking[]>({
    queryKey: rankingKeys.list(),
    queryFn: () => apiRequest<SeriesRanking[]>("/rankings?pageSize=100"),
    staleTime: 60000,
  });
}

export function useRankingsListContractQuery(tableState: TableState) {
  return useQuery<ApiListEnvelope<SeriesRanking, RankingsListMeta>>({
    queryKey: [...rankingKeys.all, "listContract", tableState] as const,
    queryFn: () =>
      boardApi.rankingsList(tableState) as Promise<
        ApiListEnvelope<SeriesRanking, RankingsListMeta>
      >,
    staleTime: 60000,
  });
}
