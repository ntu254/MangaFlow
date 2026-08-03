import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  getMobileNotifications,
  markMobileNotificationRead,
  mobileNotificationKeys,
} from "@/services/mobile-notification-data-source"
import type { MobileNotification, MobileNotificationPage } from "@/domain/mobile-notification"

// The data-source calls are injectable so tests and demo mode never reach fetch.
export function useMobileNotifications({
  enabled = true,
  list = getMobileNotifications,
  markRead = markMobileNotificationRead,
}: {
  enabled?: boolean
  list?: (page: number) => Promise<MobileNotificationPage>
  markRead?: (id: string) => Promise<MobileNotification>
} = {}) {
  const queryClient = useQueryClient()

  const notifications = useInfiniteQuery({
    queryKey: mobileNotificationKeys.list(),
    queryFn: ({ pageParam }) => list(pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
    enabled,
  })

  const markAsRead = useMutation({
    mutationFn: markRead,
    // A successful read refreshes the list and, with it, the unread badge. A
    // failure leaves the notification unread and surfaces a retryable error.
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: mobileNotificationKeys.all })
    },
  })

  return {
    notifications,
    markAsRead,
    items: notifications.data?.pages.flatMap((page) => page.items) ?? [],
    unreadCount: notifications.data?.pages[0]?.unreadTotal ?? 0,
    fetchNextPage: notifications.fetchNextPage,
    hasNextPage: notifications.hasNextPage,
  }
}
