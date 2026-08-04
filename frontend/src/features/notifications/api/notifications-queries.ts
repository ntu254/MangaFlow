import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { hasApiTokens } from "@/shared/api/client";
import { notificationsApi } from "@/shared/api/services";
import { useAuth } from "@/shared/auth";
import {
  markNotificationsReadInResponse,
  selectNotificationItems,
  selectUnreadTotal,
  type NotificationListPayload,
} from "../model/notification-list";

export type NotificationRecord = {
  id: string;
  userId: string;
  kind: string;
  title?: string;
  message: string;
  link?: string;
  actionUrl?: string;
  proposalId?: string;
  audienceType?: "USER" | "ROLE" | "ALL";
  audienceRole?: string;
  priority?: "LOW" | "NORMAL" | "HIGH";
  createdById?: string;
  createdByName?: string;
  sentAt?: string;
  batchId?: string;
  createdAt: string;
  readAt?: string;
};

const notificationKeys = {
  all: ["notifications"] as const,
  list: () => [...notificationKeys.all, "list"] as const,
};

type NotificationListCache = NotificationListPayload<NotificationRecord>;

/** Server caps `limit` at 100 (see backend `paginationFromQuery`); ask for the full page. */
const NOTIFICATION_PAGE_LIMIT = 100;

/**
 * Both hooks below share this key on purpose: they read one cache entry through
 * different `select`s, so the unread badge costs no extra request.
 */
function notificationListOptions(enabled: boolean) {
  return {
    queryKey: notificationKeys.list(),
    queryFn: () => notificationsApi.list<NotificationRecord>({ limit: NOTIFICATION_PAGE_LIMIT }),
    staleTime: 60000,
    enabled,
    refetchOnWindowFocus: true,
    refetchInterval: 60000,
    retry: 1,
  };
}

export function useNotificationsQuery() {
  const user = useAuth((s) => s.user);

  return useQuery<NotificationListCache, Error, NotificationRecord[]>({
    ...notificationListOptions(!!user && hasApiTokens()),
    select: selectNotificationItems,
  });
}

/** Authoritative unread count from the server — accurate beyond the loaded page. */
export function useNotificationsUnreadCount(): number {
  const user = useAuth((s) => s.user);

  const { data } = useQuery<NotificationListCache, Error, number>({
    ...notificationListOptions(!!user && hasApiTokens()),
    select: selectUnreadTotal,
  });

  return data ?? 0;
}

export function useMarkReadMutation() {
  const queryClient = useQueryClient();
  return useMutation<unknown, Error, string>({
    mutationFn: (id) => notificationsApi.read(id) as Promise<unknown>,
    onSuccess: (_data, notificationId) => {
      queryClient.setQueryData<NotificationListCache>(notificationKeys.list(), (old) =>
        markNotificationsReadInResponse(old, [notificationId]),
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
      queryClient.setQueryData<NotificationListCache>(notificationKeys.list(), (old) =>
        markNotificationsReadInResponse(old, successIds),
      );
    },
  });
}

export function mapNotificationError(err: unknown): string {
  if (err instanceof Error) {
    if (err.message.includes("NOT_FOUND")) return "Notification not found.";
    if (err.message.includes("FORBIDDEN")) return "You do not have permission for this action.";
    return err.message;
  }
  return "An unknown error occurred.";
}
