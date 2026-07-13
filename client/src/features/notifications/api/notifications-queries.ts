import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { hasApiTokens } from "@/shared/api/client";
import { notificationsApi } from "@/shared/api/services";
import { useAuth } from "@/shared/auth";

export type NotificationRecord = {
  id: string;
  userId: string;
  kind: string;
  title?: string;
  message: string;
  link?: string;
  proposalId?: string;
  createdAt: string;
  readAt?: string;
  archivedAt?: string;
};

const notificationKeys = {
  all: ["notifications"] as const,
  list: () => [...notificationKeys.all, "list"] as const,
};

export function useNotificationsQuery() {
  const user = useAuth((s) => s.user);

  return useQuery<NotificationRecord[]>({
    queryKey: notificationKeys.list(),
    queryFn: async () => {
      const res = (await notificationsApi.list()) as {
        success: boolean;
        data: NotificationRecord[];
      };
      return res.data ?? [];
    },
    staleTime: 60000,
    enabled: !!user && hasApiTokens(),
    refetchOnWindowFocus: true,
    refetchInterval: 60000,
    retry: 1,
  });
}

export function useMarkReadMutation() {
  const queryClient = useQueryClient();
  return useMutation<unknown, Error, string>({
    mutationFn: (id) => notificationsApi.read(id) as Promise<unknown>,
    onSuccess: () => {
      queryClient.setQueryData<NotificationRecord[]>(notificationKeys.list(), (old) =>
        old?.map((n) => (n.readAt ? n : { ...n, readAt: new Date().toISOString() })),
      );
    },
  });
}

export function useArchiveNotificationMutation() {
  const queryClient = useQueryClient();
  return useMutation<unknown, Error, string>({
    mutationFn: (id) => notificationsApi.archive(id) as Promise<unknown>,
    onSuccess: () => {
      queryClient.setQueryData<NotificationRecord[]>(notificationKeys.list(), (old) =>
        old?.map((n) => (n.archivedAt ? n : { ...n, archivedAt: new Date().toISOString() })),
      );
    },
  });
}

export function useMarkAllReadMutation() {
  const queryClient = useQueryClient();
  return useMutation<
    { successIds: string[]; failureIds: string[]; errorCount: number },
    Error,
    { notificationIds: string[] }
  >({
    mutationFn: async ({ notificationIds }) => {
      const results = await Promise.allSettled(
        notificationIds.map((id) => notificationsApi.read(id)),
      );
      const successIds: string[] = [];
      const failureIds: string[] = [];

      results.forEach((result, index) => {
        const id = notificationIds[index];
        if (result.status === "fulfilled") {
          successIds.push(id);
        } else {
          failureIds.push(id);
        }
      });

      return {
        successIds,
        failureIds,
        errorCount: failureIds.length,
      };
    },
    onSuccess: ({ successIds }) => {
      queryClient.setQueryData<NotificationRecord[]>(notificationKeys.list(), (old) =>
        old?.map((n) =>
          successIds.includes(n.id) && !n.readAt ? { ...n, readAt: new Date().toISOString() } : n,
        ),
      );
    },
  });
}

export function useArchiveAllMutation() {
  const queryClient = useQueryClient();
  return useMutation<
    { successIds: string[]; failureIds: string[]; errorCount: number },
    Error,
    { notificationIds: string[] }
  >({
    mutationFn: async ({ notificationIds }) => {
      const results = await Promise.allSettled(
        notificationIds.map((id) => notificationsApi.archive(id)),
      );
      const successIds: string[] = [];
      const failureIds: string[] = [];

      results.forEach((result, index) => {
        const id = notificationIds[index];
        if (result.status === "fulfilled") {
          successIds.push(id);
        } else {
          failureIds.push(id);
        }
      });

      return {
        successIds,
        failureIds,
        errorCount: failureIds.length,
      };
    },
    onSuccess: ({ successIds }) => {
      queryClient.setQueryData<NotificationRecord[]>(notificationKeys.list(), (old) =>
        old?.map((n) =>
          successIds.includes(n.id) && !n.archivedAt
            ? { ...n, archivedAt: new Date().toISOString() }
            : n,
        ),
      );
    },
  });
}

export function mapNotificationError(err: unknown): string {
  if (err instanceof Error) {
    if (err.message.includes("NOT_FOUND")) return "Notification not found.";
    if (err.message.includes("FORBIDDEN"))
      return "You do not have permission to perform this action.";
    return err.message;
  }
  return "An unknown error occurred.";
}
