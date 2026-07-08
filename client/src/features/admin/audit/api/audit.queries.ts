import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/shared/api/services";
import { adminKeys, type AuditEntry } from "../../_shared";

type AdminQueryOptions = {
  enabled?: boolean;
};

import { isUnauthorizedApiError } from "@/shared/api/client";
function retryAdminQuery(failureCount: number, error: Error) {
  if (isUnauthorizedApiError(error)) return false;
  return failureCount < 2;
}

export function useAdminAuditQuery(
  filters?: { action?: string; actorId?: string },
  options: AdminQueryOptions = {},
) {
  return useQuery<AuditEntry[]>({
    queryKey: adminKeys.audit(filters),
    queryFn: () => adminApi.audit(filters) as Promise<AuditEntry[]>,
    enabled: options.enabled ?? true,
    retry: retryAdminQuery,
    staleTime: 60000,
  });
}
