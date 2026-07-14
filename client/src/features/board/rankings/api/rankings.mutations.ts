import { useMutation, useQueryClient } from "@tanstack/react-query";
import { boardApi } from "@/shared/api/services";

export const rankingKeys = {
  all: ["rankings"] as const,
};

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
  csvData: string;
  rows?: RankingImportRow[];
  source?: string;
  period?: string;
  fileName?: string;
}

export function useImportRankingsMutation() {
  const queryClient = useQueryClient();

  return useMutation<RankingImportResult, Error, RankingImportInput>({
    mutationFn: (body) => boardApi.importRankings(body) as Promise<RankingImportResult>,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rankingKeys.all });
    },
  });
}
