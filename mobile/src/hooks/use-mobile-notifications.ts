import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  getMobileNotifications,
  markMobileNotificationRead,
  mobileNotificationKeys,
} from "@/services/mobile-notification-data-source"
import { unreadNotificationCount, type MobileNotification } from "@/domain/mobile-notification"

// The data-source calls are injectable so tests and demo mode never reach fetch.
export function useMobileNotifications({
  enabled = true,
  list = getMobileNotifications,
  markRead = markMobileNotificationRead,
}: {
  enabled?: boolean
  list?: () => Promise<MobileNotification[]>
  markRead?: (id: string) => Promise<MobileNotification>
} = {}) {
  const queryClient = useQueryClient()

  const notifications = useQuery({
    queryKey: mobileNotificationKeys.list(),
    queryFn: list,
    enabled,
  })

  const markAsRead = useMutation({
    mutationFn: markRead,
    // A successful read refreshes the list and, with it, the unread badge. A
    // failure leaves the notification unread and surfaces a retryable error.
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: mobileNotificationKeys.list() })
    },
  })

  return {
    notifications,
    markAsRead,
    unreadCount: unreadNotificationCount(notifications.data ?? []),
  }
}
