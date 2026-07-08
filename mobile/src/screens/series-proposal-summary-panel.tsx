import { Text, View, StyleSheet } from "react-native"
import { MFBadge, MFCard, MFDetailList, MFEmptyState } from "@/components/mf"
import type { SeriesProposalSummary, Tone } from "@/domain/workflow"
import { colors, spacing } from "@/design/tokens"

export function SeriesProposalSummaryPanel({
  summary,
  loading,
  role,
}: {
  summary: SeriesProposalSummary | null
  loading: boolean
  role: "editor" | "board"
}) {
  if (loading) {
    return (
      <MFCard>
        <Text style={styles.kicker}>Live proposal summary</Text>
        <Text style={styles.muted}>Loading read-only series summary from GET /api/series/:seriesId/summary...</Text>
      </MFCard>
    )
  }

  if (!summary) {
    return (
      <MFEmptyState
        title="No proposal summary"
        subtitle="The review queue is still usable; summary details appear when the live read endpoint responds."
        icon="file-text"
      />
    )
  }

  const manuscript = summary.currentManuscript
  const tags = [...summary.genres, ...summary.tags.filter((tag) => !summary.genres.includes(tag))]

  return (
    <>
      <MFCard>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.kicker}>Live proposal summary</Text>
            <Text style={styles.title}>{summary.title}</Text>
          </View>
          <MFBadge tone={statusTone(summary.status)}>{summary.status}</MFBadge>
        </View>
        <Text style={styles.body}>{summary.logline}</Text>
        <View style={styles.tagRow}>
          <MFBadge tone="primary">{summary.requestedPublicationType}</MFBadge>
          {tags.slice(0, 4).map((tag) => <MFBadge key={tag} tone="neutral">{tag}</MFBadge>)}
        </View>
        <Text style={styles.muted}>Mobile reads proposal context only. It does not request signed manuscript download URLs.</Text>
      </MFCard>

      <MFDetailList items={[
        { id: "synopsis", label: "Synopsis", value: summary.synopsis, tone: "primary", icon: "file-text" },
        { id: "premise", label: "Premise", value: summary.premise, tone: "neutral", icon: "file-text" },
        { id: "characters", label: "Characters", value: summary.characters, tone: "neutral", icon: "circle-user" },
        { id: "conflict", label: "Conflict", value: summary.conflict, tone: "warning", icon: "alert-circle" },
        { id: "audience", label: "Target audience", value: summary.targetAudience, tone: "success", icon: "user" },
      ]} />

      <MFDetailList items={[
        {
          id: "manuscript",
          label: "Current manuscript",
          value: manuscript ? `${manuscript.version} / ${manuscript.status}` : "No manuscript metadata returned",
          tone: manuscript ? "primary" : "warning",
          icon: "file-check",
        },
        {
          id: "file",
          label: "File metadata",
          value: manuscript ? `${manuscript.fileName} / ${manuscript.fileType} / ${manuscript.fileSize}` : "Signed file access skipped on mobile",
          tone: "neutral",
          icon: "file-text",
        },
        {
          id: "board",
          label: role === "board" ? "Board decision" : "Board handoff",
          value: summary.boardReview ? `${summary.boardReview.status} / ${summary.boardReview.result} / ${summary.boardReview.voteCount} votes` : "No Board decision yet",
          tone: summary.boardReview ? statusTone(summary.boardReview.status) : "neutral",
          icon: "scale-balance",
        },
      ]} />
    </>
  )
}

function statusTone(status: string): Tone {
  if (status === "APPROVED" || status === "FINALIZED") return "success"
  if (status === "REJECTED" || status === "CANCELLED") return "danger"
  if (status === "REVISION_REQUESTED" || status === "NEEDS_REVISION" || status === "TIE_BREAK_REQUIRED") return "warning"
  return "primary"
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", flexWrap: "wrap", alignItems: "flex-start", justifyContent: "space-between", gap: spacing.sm },
  headerText: { flex: 1, minWidth: 180 },
  kicker: { color: colors.primary, fontSize: 12, fontWeight: "900", textTransform: "uppercase", letterSpacing: 0.8 },
  title: { color: colors.text, fontSize: 19, lineHeight: 24, fontWeight: "900", marginTop: 3 },
  body: { color: colors.text, fontSize: 13, lineHeight: 20, marginTop: spacing.sm },
  muted: { color: colors.textMuted, fontSize: 12, lineHeight: 17, marginTop: spacing.sm },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, marginTop: spacing.sm },
})
