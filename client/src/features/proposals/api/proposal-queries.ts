import type { SeriesProposal } from "@/entities/proposal/model/proposal-types";
import type { ProductionSeries } from "@/entities/series/model/series-types";
import { apiRequest, type ApiListEnvelope } from "@/shared/api/client";
import { proposalsApi, type ProposalsListMeta } from "@/shared/api/services";
import type { TableState } from "@/shared/table";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const proposalKeys = {
  all: ["proposals"] as const,
  list: (filters?: Record<string, unknown>) => ["proposals", "list", filters ?? {}] as const,
  detail: (proposalId: string) => ["proposals", "detail", proposalId] as const,
  bySeries: (seriesId: string, proposalId?: string) =>
    ["proposals", "bySeries", seriesId, proposalId ?? null] as const,
};

const seriesQueryKeys = {
  mine: ["series", "mine"] as const,
  detail: (seriesId: string) => ["series", "detail", seriesId] as const,
};

const submissionQueryKeys = {
  editorReviewQueue: ["submissions", "editorReviewQueue"] as const,
};

export function useProposalsQuery(filters?: {
  status?: string;
  assignedEditorId?: string;
  authorId?: string;
}) {
  return useQuery<SeriesProposal[]>({
    queryKey: proposalKeys.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.status) params.set("status", filters.status);
      const qs = params.toString();
      const proposals = await apiRequest<SeriesProposal[]>(`/proposals${qs ? `?${qs}` : ""}`);
      return proposals.filter((proposal) => {
        if (filters?.status && proposal.status !== filters.status) return false;
        if (filters?.assignedEditorId && proposal.assignedEditorId !== filters.assignedEditorId) {
          return false;
        }
        if (filters?.authorId && proposal.authorId !== filters.authorId) return false;
        return true;
      });
    },
    staleTime: 30000,
  });
}

export function useProposalsListQuery(tableState: TableState, enabled = true) {
  return useQuery<ApiListEnvelope<SeriesProposal, ProposalsListMeta>>({
    queryKey: proposalKeys.list({ tableState }),
    queryFn: () =>
      proposalsApi.listContract(tableState) as Promise<
        ApiListEnvelope<SeriesProposal, ProposalsListMeta>
      >,
    enabled,
    staleTime: 30000,
  });
}

export function useProposalQuery(proposalId: string) {
  return useQuery<SeriesProposal>({
    queryKey: proposalKeys.detail(proposalId),
    queryFn: () => apiRequest<SeriesProposal>(`/proposals/${proposalId}`),
    enabled: !!proposalId,
    staleTime: 30000,
  });
}

export function useSeriesProposalQuery(series?: ProductionSeries) {
  const proposalId = series?.proposalId;
  return useQuery<SeriesProposal | null>({
    queryKey: proposalKeys.bySeries(series?.id ?? "pending", proposalId),
    queryFn: () => (proposalId ? apiRequest<SeriesProposal>(`/proposals/${proposalId}`) : null),
    enabled: !!proposalId,
    staleTime: 30000,
  });
}

export function useCreateProposalMutation() {
  const queryClient = useQueryClient();
  return useMutation<SeriesProposal, Error, Record<string, unknown>>({
    mutationFn: (body) => apiRequest<SeriesProposal>("/proposals", { method: "POST", body }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: proposalKeys.all });
      queryClient.invalidateQueries({ queryKey: seriesQueryKeys.mine });
    },
  });
}

export function useUpdateProposalMutation(proposalId?: string, seriesId?: string) {
  const queryClient = useQueryClient();
  return useMutation<SeriesProposal, Error, Record<string, unknown> & { id?: string }>({
    mutationFn: (variables) => {
      const { id: varId, ...body } = variables;
      const activeId = varId || proposalId;
      if (!activeId) throw new Error("Proposal ID is required for update.");
      return apiRequest<SeriesProposal>(`/proposals/${activeId}`, { method: "PATCH", body });
    },
    onSuccess: (_data, variables) => {
      const activeId = variables.id || proposalId;
      if (activeId) {
        queryClient.invalidateQueries({ queryKey: proposalKeys.detail(activeId) });
      }
      queryClient.invalidateQueries({ queryKey: proposalKeys.all });
      if (seriesId) {
        queryClient.invalidateQueries({ queryKey: seriesQueryKeys.detail(seriesId) });
      }
    },
  });
}

export function useProposalActionMutation(proposalId?: string, seriesId?: string) {
  const queryClient = useQueryClient();
  return useMutation<
    SeriesProposal,
    Error,
    { action: string; payload?: Record<string, unknown>; id?: string }
  >({
    mutationFn: ({ action, payload, id: varId }) => {
      const activeId = varId || proposalId;
      if (!activeId) throw new Error("Proposal ID is required for action.");
      return apiRequest<SeriesProposal>(`/proposals/${activeId}/actions/${action}`, {
        method: "POST",
        body: payload ?? {},
      });
    },
    onSuccess: (_data, variables) => {
      const activeId = variables.id || proposalId;
      if (activeId) {
        queryClient.invalidateQueries({ queryKey: proposalKeys.detail(activeId) });
      }
      queryClient.invalidateQueries({ queryKey: proposalKeys.all });
      queryClient.invalidateQueries({ queryKey: submissionQueryKeys.editorReviewQueue });
      if (variables.action === "FORWARD") {
        queryClient.invalidateQueries({ queryKey: ["board", "queue"] });
      }
      if (seriesId) {
        queryClient.invalidateQueries({ queryKey: seriesQueryKeys.detail(seriesId) });
      }
    },
  });
}

export function useClaimProposalReviewMutation(proposalId: string) {
  return useProposalActionMutation(proposalId);
}

export function useRequestProposalRevisionMutation(proposalId: string) {
  return useProposalActionMutation(proposalId);
}

export function useRejectProposalMutation(proposalId: string) {
  return useProposalActionMutation(proposalId);
}

export function useForwardProposalToBoardMutation(proposalId: string) {
  return useProposalActionMutation(proposalId);
}

export function useDeleteProposalMutation(seriesId?: string) {
  const queryClient = useQueryClient();
  return useMutation<{ id: string }, Error, string>({
    mutationFn: (proposalId) =>
      apiRequest<{ id: string }>(`/proposals/${proposalId}`, { method: "DELETE" }),
    onSuccess: (_data, proposalId) => {
      queryClient.invalidateQueries({ queryKey: proposalKeys.detail(proposalId) });
      queryClient.invalidateQueries({ queryKey: proposalKeys.all });
      if (seriesId) {
        queryClient.invalidateQueries({ queryKey: seriesQueryKeys.detail(seriesId) });
      }
    },
  });
}
