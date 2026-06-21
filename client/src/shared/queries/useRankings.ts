import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { extractErrorMessage, rankingsApi, type ImportRankingInput } from "@/shared/api";

export function useRankings() {
  return useQuery({
    queryKey: ["rankings"],
    queryFn: rankingsApi.list,
  });
}

export function useImportRanking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ImportRankingInput) => rankingsApi.import(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rankings"] });
      toast.success("Reader vote data saved");
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });
}

export function useFinalizeRanking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (rankingId: string) => rankingsApi.finalize(rankingId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rankings"] });
      toast.success("Ranking finalized");
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });
}
