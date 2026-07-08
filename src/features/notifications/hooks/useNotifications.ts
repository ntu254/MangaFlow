import { useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/shared/lib/supabase";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { notificationsService, type InboxNotification } from "../services/notifications.service";

export function useNotifications() {
  const { user } = useAuth();
  const userId = user?.id ?? "";
  const queryClient = useQueryClient();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // --- Query: Inbox list ---
  const {
    data: inbox = [],
    isLoading,
  } = useQuery<InboxNotification[]>({
    queryKey: ["notification-inbox", userId],
    queryFn: () => notificationsService.getInbox(userId),
    enabled: !!userId,
    staleTime: 30_000,
  });

  const unreadCount = inbox.filter((n) => !n.is_read).length;

  // --- Realtime subscription ---
  useEffect(() => {
    if (!userId) return;

    // Cleanup bất kỳ channel cũ
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase
      .channel(`notification-inbox:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notification_inbox",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          // Invalidate query để fetch inbox mới nhất
          queryClient.invalidateQueries({ queryKey: ["notification-inbox", userId] });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notification_inbox",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["notification-inbox", userId] });
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [userId, queryClient]);

  // --- Mutation: Mark one as read ---
  const markAsReadMutation = useMutation({
    mutationFn: ({ inboxId, notificationId }: { inboxId: string; notificationId: string }) =>
      notificationsService.markAsRead(inboxId, userId, notificationId),
    onMutate: async ({ inboxId }) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ["notification-inbox", userId] });
      const prev = queryClient.getQueryData<InboxNotification[]>(["notification-inbox", userId]);
      queryClient.setQueryData<InboxNotification[]>(["notification-inbox", userId], (old = []) =>
        old.map((n) =>
          n.id === inboxId ? { ...n, is_read: true, read_at: new Date().toISOString() } : n
        )
      );
      return { prev };
    },
    onError: (_err, _vars, context) => {
      if (context?.prev) {
        queryClient.setQueryData(["notification-inbox", userId], context.prev);
      }
    },
  });

  // --- Mutation: Mark all as read ---
  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationsService.markAllAsRead(userId),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["notification-inbox", userId] });
      const prev = queryClient.getQueryData<InboxNotification[]>(["notification-inbox", userId]);
      queryClient.setQueryData<InboxNotification[]>(["notification-inbox", userId], (old = []) =>
        old.map((n) => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
      );
      return { prev };
    },
    onError: (_err, _vars, context) => {
      if (context?.prev) {
        queryClient.setQueryData(["notification-inbox", userId], context.prev);
      }
    },
  });

  return {
    inbox,
    unreadCount,
    isLoading,
    markAsRead: (inboxId: string, notificationId: string) =>
      markAsReadMutation.mutate({ inboxId, notificationId }),
    markAllAsRead: () => markAllAsReadMutation.mutate(),
  };
}
