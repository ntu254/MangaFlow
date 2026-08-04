import { Pressable, StyleSheet, Text, View } from "react-native"
import { MFBadge, MFEmptyState, MFHero, MFMetricStrip, SectionTitle } from "@/components/mf"
import { WorkflowState } from "@/components/workflow-state"
import { useBoardSessions } from "@/hooks/use-board-sessions"
import type { BoardSessionSummary } from "@/services/board-mobile-data-source"
import { colors, radius, spacing, typography } from "@/design/tokens"

export function BoardSessionsScreen({
  isChair,
  onSelect,
  onCreate,
}: {
  isChair: boolean
  onSelect: (sessionId: string) => void
  onCreate: () => void
}) {
  const sessions = useBoardSessions()

  if (sessions.isLoading && !sessions.data) return <WorkflowState kind="loading" />
  if (sessions.error && !sessions.data) {
    return (
      <WorkflowState
        kind="error"
        context="voting sessions"
        error={sessions.error}
        onRetry={() => void sessions.refetch()}
      />
    )
  }

  const rows = sessions.data ?? []
  const openCount = rows.filter((session) => session.status === "OPEN").length
  const reVoteCount = rows.filter((session) => Boolean(session.reVoteOfSessionId)).length

  return (
    <>
      <MFHero
        role="board"
        title="Voting sessions"
        subtitle="Live rounds and immutable outcomes from the backend."
      />
      <MFMetricStrip items={[
        { id: "open", label: "Open", value: String(openCount), tone: "primary", icon: "scale-balance" },
        { id: "closed", label: "Closed", value: String(Math.max(rows.length - openCount, 0)), tone: "success", icon: "file-check" },
        { id: "revote", label: "Re-votes", value: String(reVoteCount), tone: "warning", icon: "refresh-cw" },
      ]} />
      <View style={styles.heading}>
        <SectionTitle title="Session list" />
        {isChair ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Create session"
            onPress={onCreate}
            style={styles.create}
          >
            <Text style={styles.createText}>New session</Text>
          </Pressable>
        ) : null}
      </View>
      <View style={styles.stack}>
        {rows.length ? rows.map((session) => (
          <Pressable
            key={session.id}
            accessibilityRole="button"
            accessibilityLabel={`Open session ${session.title}`}
            onPress={() => onSelect(session.id)}
            style={styles.row}
          >
            <View style={styles.rowMain}>
              <Text style={styles.title}>{session.title}</Text>
              <Text style={styles.meta}>
                {session.reVoteOfSessionId ? `Re-vote of ${session.reVoteOfSessionId} · ` : ""}
                {session.proposalId ?? "No proposal"} · v{session.version ?? "—"}
              </Text>
              <Text style={styles.date}>{sessionTime(session)}</Text>
            </View>
            <MFBadge tone={statusTone(session.status)}>{session.status.replaceAll("_", " ")}</MFBadge>
          </Pressable>
        )) : (
          <MFEmptyState
            title="No voting sessions"
            subtitle={isChair
              ? "Create a session when a proposal reaches PENDING_BOARD."
              : "Board voting sessions will appear here."}
            icon="scale-balance"
          />
        )}
      </View>
    </>
  )
}

function sessionTime(session: BoardSessionSummary): string {
  const value = session.closesAt ?? session.scheduledFor ?? session.openedAt
  if (!value) return "No schedule supplied"
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString()
}

function statusTone(status: string): "primary" | "success" | "warning" | "danger" {
  if (status === "OPEN") return "primary"
  if (status === "FINALIZED") return "success"
  if (status === "CANCELLED") return "danger"
  return "warning"
}

const styles = StyleSheet.create({
  heading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  create: {
    minHeight: 40,
    justifyContent: "center",
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
  },
  createText: { color: colors.surface, fontSize: typography.label, fontWeight: "800" },
  stack: { gap: spacing.sm },
  row: {
    minHeight: 76,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  rowMain: { flex: 1, minWidth: 0 },
  title: { color: colors.text, fontSize: typography.body, fontWeight: "800" },
  meta: { color: colors.textMuted, fontSize: typography.label, marginTop: 3 },
  date: { color: colors.outline, fontSize: typography.label, marginTop: 2 },
})
