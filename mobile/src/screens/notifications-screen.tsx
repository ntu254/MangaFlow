import { useState } from "react"
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native"
import { WorkflowState } from "@/components/workflow-state"
import { useMobileNotifications } from "@/hooks/use-mobile-notifications"
import { NOTIFICATION_CONTEXT } from "@/services/mobile-notification-data-source"
import {
  formatNotificationTime,
  isUnread,
  notificationKindLabel,
  type MobileNotification,
} from "@/domain/mobile-notification"
import { colors, radius, spacing, typography } from "@/design/tokens"

const PRIORITY_TONE: Record<MobileNotification["priority"], string> = {
  HIGH: colors.danger,
  NORMAL: colors.primary,
  LOW: colors.outline,
}

function failureMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  return "Could not mark this notification as read."
}

// Read-only notification feed for the authenticated Editor or Board member.
// Opening the tab never marks anything read — each read is an explicit tap.
export function NotificationsScreen({
  list,
  markRead,
}: {
  list?: () => Promise<MobileNotification[]>
  markRead?: (id: string) => Promise<MobileNotification>
} = {}) {
  const { notifications, markAsRead, unreadCount } = useMobileNotifications({ list, markRead })
  const [failedId, setFailedId] = useState<string | null>(null)
  const [failure, setFailure] = useState<string | null>(null)

  const items = notifications.data ?? []

  if (notifications.isLoading && !notifications.data) {
    return <WorkflowState kind="loading" label="Loading your notifications…" />
  }
  if (notifications.error && !notifications.data) {
    return (
      <WorkflowState
        kind="error"
        context={NOTIFICATION_CONTEXT}
        error={notifications.error}
        onRetry={() => void notifications.refetch()}
      />
    )
  }

  const requestRead = (id: string) => {
    setFailedId(null)
    setFailure(null)
    markAsRead.mutate(id, {
      onError: (error) => {
        // The notification stays unread; the user can retry the same read.
        setFailedId(id)
        setFailure(failureMessage(error))
      },
    })
  }

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={notifications.isRefetching}
          onRefresh={() => void notifications.refetch()}
        />
      }
    >
      <View style={styles.header}>
        <Text accessibilityRole="header" style={styles.title}>
          Notifications
        </Text>
        <Text style={styles.subtitle}>
          {unreadCount === 0 ? "All caught up." : `${unreadCount} unread`}
        </Text>
      </View>

      {items.length === 0 ? (
        <WorkflowState
          kind="empty"
          title="No notifications yet."
          description="Workflow updates addressed to your account appear here."
        />
      ) : (
        items.map((notification) => (
          <NotificationRow
            key={notification.id}
            notification={notification}
            busy={markAsRead.isPending && markAsRead.variables === notification.id}
            failure={failedId === notification.id ? failure : null}
            onRead={() => requestRead(notification.id)}
          />
        ))
      )}
    </ScrollView>
  )
}

function NotificationRow({
  notification,
  busy,
  failure,
  onRead,
}: {
  notification: MobileNotification
  busy: boolean
  failure: string | null
  onRead: () => void
}) {
  const unread = isUnread(notification)

  return (
    <View style={[styles.card, unread && styles.cardUnread]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${notification.title}, ${unread ? "unread" : "read"}`}
        accessibilityState={{ disabled: !unread || busy }}
        disabled={!unread || busy}
        onPress={onRead}
        style={styles.row}
      >
        <View style={styles.rowHeader}>
          {unread ? <View style={styles.unreadDot} /> : null}
          <Text style={styles.cardTitle}>{notification.title}</Text>
          <Text style={styles.time}>{formatNotificationTime(notification.createdAt)}</Text>
        </View>
        <Text style={styles.message}>{notification.message}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.kind}>{notificationKindLabel(notification.kind)}</Text>
          <Text style={[styles.priority, { color: PRIORITY_TONE[notification.priority] }]}>
            {notification.priority}
          </Text>
          <Text style={styles.state}>
            {busy ? "Marking as read…" : unread ? "Tap to mark as read" : "Read"}
          </Text>
        </View>
      </Pressable>
      {failure ? (
        <View style={styles.failure}>
          <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.failureText}>
            {failure}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Retry marking ${notification.title} as read`}
            onPress={onRead}
            style={styles.retry}
          >
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  content: { padding: spacing.md, gap: spacing.sm, flexGrow: 1 },
  header: { gap: 2 },
  title: { fontSize: typography.title, fontWeight: "800", color: colors.text },
  subtitle: { fontSize: typography.label, color: colors.textMuted, fontWeight: "700" },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  cardUnread: { borderColor: colors.primary, backgroundColor: colors.surfaceLow },
  row: { minHeight: 44, padding: spacing.md, gap: spacing.xs },
  rowHeader: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  unreadDot: { width: 8, height: 8, borderRadius: radius.full, backgroundColor: colors.primary },
  cardTitle: { flex: 1, fontSize: typography.body, fontWeight: "800", color: colors.text },
  time: { fontSize: typography.label, color: colors.outline },
  message: { fontSize: typography.body, color: colors.textMuted, lineHeight: 21 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, flexWrap: "wrap" },
  kind: {
    fontSize: typography.label,
    fontWeight: "800",
    color: colors.textMuted,
    backgroundColor: colors.surfaceContainer,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  priority: { fontSize: typography.label, fontWeight: "900" },
  state: { fontSize: typography.label, color: colors.outline },
  failure: {
    borderTopWidth: 1,
    borderTopColor: colors.outlineVariant,
    padding: spacing.md,
    gap: spacing.sm,
  },
  failureText: { color: colors.danger, fontSize: typography.label, fontWeight: "700" },
  retry: {
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  retryText: { color: colors.primary, fontWeight: "800", fontSize: typography.label },
})
