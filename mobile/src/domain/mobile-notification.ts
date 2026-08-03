import { z } from "zod"

// Contract for the authenticated notification feed. `actionUrl` is deliberately
// not part of this shape: mobile has no approved destination contract for every
// notification kind, so the value is never carried into the UI as a link or a
// navigation command.
const timestampSchema = z
  .union([z.string(), z.date()])
  .nullish()
  .transform((value) => {
    if (!value) return null
    return value instanceof Date ? value.toISOString() : value
  })

export const mobileNotificationSchema = z.object({
  id: z.string(),
  kind: z.string(),
  title: z.string(),
  message: z.string(),
  priority: z
    .enum(["LOW", "NORMAL", "HIGH"])
    .nullish()
    .transform((value) => value ?? "NORMAL"),
  createdAt: timestampSchema,
  readAt: timestampSchema,
})

export const mobileNotificationListSchema = z.array(mobileNotificationSchema)

export type MobileNotification = z.infer<typeof mobileNotificationSchema>
export type MobileNotificationPriority = MobileNotification["priority"]

export function isUnread(notification: MobileNotification): boolean {
  return notification.readAt === null
}

export function unreadNotificationCount(notifications: MobileNotification[]): number {
  return notifications.filter(isUnread).length
}

const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

// Relative time for recent items, calendar date for anything older, so a row
// never shows a raw timestamp.
export function formatNotificationTime(iso: string | null, now: number = Date.now()): string {
  if (!iso) return "—"
  const at = Date.parse(iso)
  if (Number.isNaN(at)) return "—"

  const elapsed = now - at
  if (elapsed < MINUTE) return "Just now"
  if (elapsed < HOUR) return `${Math.floor(elapsed / MINUTE)}m ago`
  if (elapsed < DAY) return `${Math.floor(elapsed / HOUR)}h ago`
  if (elapsed < 7 * DAY) return `${Math.floor(elapsed / DAY)}d ago`
  return new Date(at).toISOString().slice(0, 10)
}

export function notificationKindLabel(kind: string): string {
  return kind.replace(/[._-]/g, " ").toUpperCase()
}
