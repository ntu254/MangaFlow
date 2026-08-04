import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { boardApi } from "@/shared/api/services";
import { boardKeys } from "../../api/board-queries";
import { rankingKeys } from "@/entities/series";
import { rankingImportInvalidations } from "../../model/mutation-invalidations";

export interface RankingPeriodInfo {
  period: string;
  cadence?: "WEEKLY" | "MONTHLY";
  importedAt?: string;
}

export function useRankingPeriodsQuery() {
  return useQuery<RankingPeriodInfo[]>({
    queryKey: [...rankingKeys.all, "periods"],
    queryFn: () => boardApi.rankingPeriods() as Promise<RankingPeriodInfo[]>,
    staleTime: 30000,
  });
}

export interface RankingImportResult {
  imported: number;
  skipped: number;
  errors: string[];
  fileName?: string;
}

export interface RankingImportRow {
  seriesId?: string;
  seriesTitle?: string;
  score?: number;
  finalScore?: number;
  readerScore?: number;
  votes?: number;
  voteCount?: number;
  status?: string;
  atRisk?: boolean;
}

export interface RankingImportInput {
  rows?: RankingImportRow[];
  source?: string;
  period?: string;
  cadence?: "WEEKLY" | "MONTHLY";
  fileName?: string;
}

export function useImportRankingsMutation() {
  const queryClient = useQueryClient();

  return useMutation<RankingImportResult, Error, RankingImportInput>({
    mutationFn: (body) => boardApi.importRankings(body) as Promise<RankingImportResult>,
    onSuccess: () => {
      // Refresh the ranking list, the At-risk queue, and the board read model
      // so the imported period (and any new at-risk signals) appear immediately.
      for (const key of rankingImportInvalidations()) {
        queryClient.invalidateQueries({ queryKey: key });
      }
    },
  });
}
