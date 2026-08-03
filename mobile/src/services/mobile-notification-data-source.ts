import { mobileApi } from "@/services/mobile-api-client"
import {
  mobileNotificationListSchema,
  mobileNotificationSchema,
  type MobileNotification,
} from "@/domain/mobile-notification"
import { MobileRequestError, describeRequestFailure } from "@/services/mobile-request-diagnostics"

export const mobileNotificationKeys = {
  all: ["mobile-notifications"] as const,
  list: () => [...mobileNotificationKeys.all, "list"] as const,
}

export const NOTIFICATION_CONTEXT = "your notifications"

// The authenticated feed for the signed-in user. Validated against the shared
// contract and normalized into safe diagnostics on failure, like the inbox.
export async function getMobileNotifications(): Promise<MobileNotification[]> {
  try {
    return mobileNotificationListSchema.parse(await mobileApi.request("/notifications"))
  } catch (error) {
    throw new MobileRequestError(describeRequestFailure(error, NOTIFICATION_CONTEXT))
  }
}

// Explicit per-notification read. Entering the tab never marks anything read.
export async function markMobileNotificationRead(id: string): Promise<MobileNotification> {
  try {
    return mobileNotificationSchema.parse(
      await mobileApi.request(`/notifications/${id}/read`, { method: "POST", body: "{}" }),
    )
  } catch (error) {
    throw new MobileRequestError(describeRequestFailure(error, "this notification"))
  }
}
