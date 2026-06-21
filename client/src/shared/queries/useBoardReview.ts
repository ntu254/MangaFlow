import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  boardApi,
  type AtRiskDecisionInput,
  type CastBoardVoteInput,
  type FinalizeBoardDecisionInput,
  type TieBreakBoardDecisionInput,
} from "@/shared/api/board";
import { extractErrorMessage } from "@/shared/api";

export function useBoardReviewQueue() {
  return useQuery({
    queryKey: ["board", "series-review-queue"],
    queryFn: boardApi.queue,
  });
}

export function useCastBoardVote(seriesId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CastBoardVoteInput) => boardApi.castVote(seriesId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["board", "series-review-queue"] });
      toast.success("Board vote recorded");
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });
}

export function useFinalizeBoardDecision(seriesId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: FinalizeBoardDecisionInput) => boardApi.finalizeDecision(seriesId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["board", "series-review-queue"] });
      qc.invalidateQueries({ queryKey: ["series"] });
      qc.invalidateQueries({ queryKey: ["series", seriesId] });
      qc.invalidateQueries({ queryKey: ["series", seriesId, "summary"] });
      toast.success("Board decision finalized");
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });
}

export function useTieBreakBoardDecision(seriesId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: TieBreakBoardDecisionInput) => boardApi.tieBreak(seriesId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["board", "series-review-queue"] });
      qc.invalidateQueries({ queryKey: ["series"] });
      qc.invalidateQueries({ queryKey: ["series", seriesId] });
      toast.success("Board tie-break finalized");
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });
}

export function useCreateAtRiskDecision(seriesId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: AtRiskDecisionInput) => boardApi.createAtRiskDecision(seriesId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["series"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("At-risk decision recorded");
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });
}
