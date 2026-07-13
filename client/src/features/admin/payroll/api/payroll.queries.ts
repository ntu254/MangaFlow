import { useQuery } from "@tanstack/react-query";
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
