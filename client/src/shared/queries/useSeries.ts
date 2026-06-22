import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  seriesApi,
  type AddSeriesMemberInput,
  type CreateSeriesInput,
  type UpdateSeriesInput,
} from "@/shared/api/series";
import { extractErrorMessage } from "@/shared/api";
import { invalidateSeries, invalidateSeriesMembers, qk } from "./keys";

export function useCreateSeries() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateSeriesInput) => seriesApi.create(input),
    onSuccess: () => {
      invalidateSeries(qc);
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
      invalidateSeries(qc, s.id);
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
      invalidateSeries(qc, s.id);
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });
}

export function useSeriesSummary(id: string) {
  return useQuery({
    queryKey: qk.series.summary(id),
    queryFn: () => seriesApi.getSummary(id),
    enabled: !!id,
  });
}

export function useSeriesMembers(seriesId: string) {
  return useQuery({
    queryKey: qk.series.members(seriesId),
    queryFn: () => seriesApi.listMembers(seriesId),
    enabled: !!seriesId,
  });
}

export function useMySeriesMemberships() {
  return useQuery({
    queryKey: qk.series.memberships(),
    queryFn: seriesApi.listMyMemberships,
  });
}

export function useAddSeriesMember(seriesId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: AddSeriesMemberInput) => seriesApi.addMember(seriesId, payload),
    onSuccess: () => {
      invalidateSeriesMembers(qc, seriesId);
      toast.success("Team invite sent successfully");
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });
}

export function useDeleteDraftSeries() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => seriesApi.deleteDraft(id),
    onSuccess: (_, id) => {
      invalidateSeries(qc, id);
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });
}

export function useWithdrawSeriesProposal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => seriesApi.withdraw(id),
    onSuccess: (_, id) => {
      invalidateSeries(qc, id);
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });
}

export function useCancelSeries() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => seriesApi.cancel(id),
    onSuccess: (_, id) => {
      invalidateSeries(qc, id);
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });
}

export function useHardDeleteSeries() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => seriesApi.hardDelete(id),
    onSuccess: (_, id) => {
      invalidateSeries(qc, id);
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
      invalidateSeries(qc, seriesId);
      invalidateSeriesMembers(qc, seriesId);
      toast.success("Team member updated successfully");
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });
}

export function useAcceptSeriesMemberInvite(seriesId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (memberId?: string) => seriesApi.acceptMemberInvite(seriesId, memberId),
    onSuccess: () => {
      invalidateSeries(qc, seriesId);
      qc.invalidateQueries({ queryKey: qk.series.memberships() });
      invalidateSeriesMembers(qc, seriesId);
      toast.success("Team invite accepted");
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });
}

export function useRemoveSeriesMember(seriesId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (memberId: string) => seriesApi.removeMember(seriesId, memberId),
    onSuccess: () => {
      invalidateSeries(qc, seriesId);
      invalidateSeriesMembers(qc, seriesId);
      toast.success("Team member removed successfully");
    },
    onError: (err) => toast.error(extractErrorMessage(err)),
  });
}
