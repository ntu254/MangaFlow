import { useState } from "react"
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native"
import { MobileApiError } from "@/services/mobile-api-error"
import { actionLabel } from "@/components/workflow-action-bar"
import { colors, radius, spacing, typography } from "@/design/tokens"

export interface MobileCommentActionDescriptor {
  action: string
  enabled: boolean
  disabledReason: string | null
  requiresConfirmation: boolean
  requiresReason: boolean
}

export interface MobileComment {
  id: string
  author: string
  status: string
  isBlocking: boolean
  targetLabel: string
  body: string
  actions: MobileCommentActionDescriptor[]
  replies?: Array<{ id: string; author: string; body: string }>
}

function replyErrorMessage(error: unknown): string {
  if (error instanceof MobileApiError && error.status === 409) {
    return "This workflow changed. Refreshing current comment."
  }
  if (error instanceof MobileApiError || error instanceof Error) return error.message
  return "Could not send reply. Please try again."
}

// A single blocking-comment thread. Each comment announces author, status,
// blocker state, and target; only backend-enabled actions are pressable, and a
// reply draft is preserved across a failed send (e.g. a 409).
export function CommentThread({
  comment,
  onResolve,
  onReopen,
  onReply,
}: {
  comment: MobileComment
  onResolve?: (id: string) => void
  onReopen?: (id: string) => void
  onReply?: (id: string, body: string) => Promise<void>
}) {
  const [reply, setReply] = useState("")
  const [replyMessage, setReplyMessage] = useState<string | null>(null)
  const [sending, setSending] = useState(false)

  const send = async () => {
    if (!onReply || reply.trim().length === 0) return
    setSending(true)
    try {
      await onReply(comment.id, reply.trim())
      setReply("")
      setReplyMessage(null)
    } catch (error) {
      // Keep the draft so the Tantou does not retype after a conflict.
      setReplyMessage(replyErrorMessage(error))
    } finally {
      setSending(false)
    }
  }

  return (
    <View
      accessibilityLabel={`Comment by ${comment.author}, ${comment.status}, ${
        comment.isBlocking ? "blocking" : "non-blocking"
      }, on ${comment.targetLabel}`}
      style={styles.card}
    >
      <Text style={styles.meta}>
        {comment.author} · {comment.status}
        {comment.isBlocking ? " · Blocking" : ""} · {comment.targetLabel}
      </Text>
      <Text style={styles.body}>{comment.body}</Text>

      {(comment.replies ?? []).map((item) => (
        <View key={item.id} style={styles.replyRow}>
          <Text style={styles.replyMeta}>{item.author}</Text>
          <Text style={styles.body}>{item.body}</Text>
        </View>
      ))}

      <View style={styles.actionRow}>
        {comment.actions.map((descriptor) => {
          const label = actionLabel(descriptor.action)
          const onPress =
            descriptor.action === "COMMENT_RESOLVE"
              ? () => onResolve?.(comment.id)
              : descriptor.action === "COMMENT_REOPEN"
                ? () => onReopen?.(comment.id)
                : () => {}
          return (
            <View key={descriptor.action} style={styles.actionSlot}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={label}
                accessibilityState={{ disabled: !descriptor.enabled }}
                disabled={!descriptor.enabled}
                onPress={onPress}
                style={[styles.actionButton, !descriptor.enabled && styles.actionDisabled]}
              >
                <Text style={styles.actionText}>{label}</Text>
              </Pressable>
              {!descriptor.enabled && descriptor.disabledReason ? (
                <Text style={styles.reason}>{descriptor.disabledReason}</Text>
              ) : null}
            </View>
          )
        })}
      </View>

      {onReply ? (
        <View style={styles.replyComposer}>
          <TextInput
            accessibilityLabel="Reply"
            placeholder="Reply"
            value={reply}
            onChangeText={setReply}
            multiline
            style={styles.input}
          />
          {replyMessage ? <Text style={styles.message}>{replyMessage}</Text> : null}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Send reply"
            disabled={sending}
            onPress={send}
            style={[styles.sendButton, sending && styles.actionDisabled]}
          >
            <Text style={styles.actionText}>{sending ? "Sending…" : "Send reply"}</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    padding: spacing.md,
    gap: spacing.xs,
  },
  meta: { fontSize: typography.label, fontWeight: "800", color: colors.textMuted },
  body: { fontSize: typography.body, color: colors.text },
  replyRow: { paddingLeft: spacing.md, gap: 2 },
  replyMeta: { fontSize: typography.label, fontWeight: "700", color: colors.textMuted },
  actionRow: { flexDirection: "row", gap: spacing.sm, flexWrap: "wrap", marginTop: spacing.xs },
  actionSlot: { gap: 2 },
  actionButton: {
    minHeight: 44,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  actionDisabled: { backgroundColor: colors.surfaceContainer },
  actionText: { color: colors.surface, fontWeight: "700", fontSize: typography.body },
  reason: { color: colors.textMuted, fontSize: typography.label },
  message: { color: colors.warning, fontSize: typography.label, fontWeight: "700" },
  replyComposer: { gap: spacing.xs, marginTop: spacing.xs },
  input: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: radius.md,
    padding: spacing.sm,
    fontSize: typography.body,
    color: colors.text,
    textAlignVertical: "top",
  },
  sendButton: {
    minHeight: 44,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
})
