import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { seriesApi, type CreateSeriesInput, type UpdateSeriesInput } from "@/shared/api/series";
import { extractErrorMessage } from "@/shared/api";

export function useCreateSeries() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateSeriesInput) => seriesApi.create(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["series"] });
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });
}

export function useUpdateSeries() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateSeriesInput }) =>
      seriesApi.update(id, input),
    onSuccess: (s) => {
      qc.invalidateQueries({ queryKey: ["series"] });
      qc.invalidateQueries({ queryKey: ["series", s.id] });
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });
}

export function useSubmitSeries() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, editorNote }: { id: string; editorNote?: string }) =>
      seriesApi.submitForReview(id, editorNote),
    onSuccess: (s) => {
      qc.invalidateQueries({ queryKey: ["series"] });
      qc.invalidateQueries({ queryKey: ["series", s.id] });
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });
}

export function useSeriesSummary(id: string) {
  return useQuery({
    queryKey: ["series", id, "summary"],
    queryFn: () => seriesApi.getSummary(id),
    enabled: !!id,
  });
}

export function useDeleteDraftSeries() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => seriesApi.deleteDraft(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ["series"] });
      qc.invalidateQueries({ queryKey: ["series", id] });
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });
}

export function useWithdrawSeriesProposal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => seriesApi.withdraw(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ["series"] });
      qc.invalidateQueries({ queryKey: ["series", id] });
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });
}

export function useCancelSeries() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => seriesApi.cancel(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ["series"] });
      qc.invalidateQueries({ queryKey: ["series", id] });
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });
}

export function useHardDeleteSeries() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => seriesApi.hardDelete(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ["series"] });
      qc.invalidateQueries({ queryKey: ["series", id] });
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });
}

export function useUpdateSeriesMember(seriesId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ memberId, status }: { memberId: string; status: string }) =>
      seriesApi.updateMember(seriesId, memberId, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["series", seriesId] });
      toast.success("Team member updated successfully");
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });
}

export function useRemoveSeriesMember(seriesId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (memberId: string) => seriesApi.removeMember(seriesId, memberId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["series", seriesId] });
      toast.success("Team member removed successfully");
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });
}
