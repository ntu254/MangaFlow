import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/shared/api/services";
import { adminKeys, type Earning } from "../../_shared";
import { isUnauthorizedApiError } from "@/shared/api/client";

// Local definition to avoid exporting from the monolithic file
function retryAdminQuery(failureCount: number, error: Error) {
  if (isUnauthorizedApiError(error)) return false;
  return failureCount < 2;
}

type AdminQueryOptions = {
  enabled?: boolean;
};

export function useAdminPayrollQuery(options: AdminQueryOptions = {}) {
  return useQuery<Earning[]>({
    queryKey: adminKeys.payroll(),
    queryFn: () => adminApi.payroll() as Promise<Earning[]>,
    enabled: options.enabled ?? true,
    retry: retryAdminQuery,
    staleTime: 60000,
  });
}

export function useConfirmPayrollMutation() {
  const queryClient = useQueryClient();
  return useMutation<Earning, Error, string>({
    mutationFn: (earningId) => adminApi.confirmPayroll(earningId) as Promise<Earning>,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.payroll() });
    },
  });
}

export function useMarkPaidPayrollMutation() {
  const queryClient = useQueryClient();
  return useMutation<Earning, Error, { earningId: string; reason?: string }>({
    mutationFn: ({ earningId, reason }) =>
      adminApi.markPaidPayroll(earningId, reason) as Promise<Earning>,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.payroll() });
    },
  });
}

export function useVoidPayrollMutation() {
  const queryClient = useQueryClient();
  return useMutation<Earning, Error, { earningId: string; reason: string }>({
    mutationFn: ({ earningId, reason }) =>
      adminApi.voidPayroll(earningId, reason) as Promise<Earning>,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.payroll() });
    },
  });
}

export function useGeneratePayrollMutation() {
  const queryClient = useQueryClient();
  return useMutation<
    Earning[],
    Error,
    { period: string; assistants: string[]; onlyEditorApproved: boolean; excludeLinked: boolean }
  >({
    mutationFn: (body) => adminApi.generatePayroll(body) as Promise<Earning[]>,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.payroll() });
    },
  });
}
