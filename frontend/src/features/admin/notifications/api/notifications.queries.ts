import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/shared/api/services";
import { adminKeys } from "../../_shared/api/admin-queries";

export type ManagedNotification = {
  id: string;
  userId: string;
  kind: string;
  title: string;
  message: string;
  audienceType?: "USER" | "ROLE" | "ALL";
  audienceRole?: string;
  priority?: "LOW" | "NORMAL" | "HIGH";
  actionUrl?: string;
  batchId?: string;
  createdByName?: string;
  sentAt?: string;
  readAt?: string;
  createdAt: string;
};

export type DeleteManagedNotificationResult = {
  id: string;
  batchId?: string;
  deletedCount: number;
};

export function useAdminNotificationsQuery(options: { enabled?: boolean } = {}) {
  return useQuery<ManagedNotification[]>({
    queryKey: adminKeys.notifications(),
    queryFn: () => adminApi.notifications() as Promise<ManagedNotification[]>,
    enabled: options.enabled ?? true,
    staleTime: 30000,
  });
}

export function useAdminNotificationDeleteMutation() {
  const queryClient = useQueryClient();
  return useMutation<DeleteManagedNotificationResult, Error, string>({
    mutationFn: (notificationId) =>
      adminApi.deleteNotification(notificationId) as Promise<DeleteManagedNotificationResult>,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.notifications() });
    },
  });
}
