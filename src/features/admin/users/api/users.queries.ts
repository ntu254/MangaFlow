import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/shared/api/services";
import { adminKeys, type AdminUser } from "../../_shared";
import { isUnauthorizedApiError } from "@/shared/api/client";

// Local definition to avoid exporting from the monolithic file, preserving its API
function retryAdminQuery(failureCount: number, error: Error) {
  if (isUnauthorizedApiError(error)) return false;
  return failureCount < 2;
}

type AdminQueryOptions = {
  enabled?: boolean;
};

export function useAdminUsersQuery(options: AdminQueryOptions = {}) {
  return useQuery<AdminUser[]>({
    queryKey: adminKeys.users(),
    queryFn: () => adminApi.users() as Promise<AdminUser[]>,
    enabled: options.enabled ?? true,
    retry: retryAdminQuery,
    staleTime: 60000,
  });
}

export function useAdminUserQuery(userId: string) {
  return useQuery<AdminUser>({
    queryKey: adminKeys.user(userId),
    queryFn: () => adminApi.getUser(userId) as Promise<AdminUser>,
    enabled: !!userId,
    staleTime: 60000,
  });
}

export function useAdminUserMutation() {
  const queryClient = useQueryClient();
  return useMutation<AdminUser, Error, { userId: string; patch: Record<string, unknown> }>({
    mutationFn: ({ userId, patch }) => adminApi.updateUser(userId, patch) as Promise<AdminUser>,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.users() });
    },
  });
}

export function useCreateUserMutation() {
  const queryClient = useQueryClient();
  return useMutation<
    AdminUser,
    Error,
    { name: string; email: string; password?: string; role: string }
  >({
    mutationFn: (body) => adminApi.createUser(body) as Promise<AdminUser>,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.users() });
    },
  });
}

export function useDeleteUserMutation() {
  const queryClient = useQueryClient();
  return useMutation<unknown, Error, { userId: string; reason: string }>({
    mutationFn: ({ userId, reason }) => adminApi.deleteUser(userId, reason) as Promise<unknown>,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.users() });
    },
  });
}
