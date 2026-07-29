import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { rateTableApi } from "@/shared/api/rate-table";
import type {
  CreateRateTableRequest,
  PatchRateTableRequest,
  RateTableEntry,
} from "@/shared/api/rate-table";
import { adminKeys } from "../../_shared/api/admin-queries";

export function useAdminRateTableQuery(options: { enabled?: boolean } = {}) {
  return useQuery<RateTableEntry[]>({
    queryKey: adminKeys.rateTable(),
    queryFn: () => rateTableApi.list() as Promise<RateTableEntry[]>,
    enabled: options.enabled ?? true,
  });
}

export function useCreateRateTableMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateRateTableRequest) => rateTableApi.create(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.rateTable() });
      queryClient.invalidateQueries({ queryKey: adminKeys.activeRates() });
    },
  });
}

export function usePatchRateTableMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: PatchRateTableRequest }) =>
      rateTableApi.patch(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.rateTable() });
      queryClient.invalidateQueries({ queryKey: adminKeys.activeRates() });
    },
  });
}
