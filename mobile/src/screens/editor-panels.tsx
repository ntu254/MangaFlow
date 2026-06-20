import {
  MFButton,
  MFDetailList,
  MFTimeline,
  SectionTitle,
} from "@/components/mf"
import type { EditorCommentItem } from "@/data/editor"
import type { EditorReadinessResult } from "@/domain/workflow"
import { Text } from "react-native"
import { colors, spacing } from "@/design/tokens"

export function EditorCommentDetailPanel({
  item,
  onResolve,
  onReopen,
  busy = false,
  errorText,
}: {
  item: EditorCommentItem
  onResolve?: () => void
  onReopen?: () => void
  busy?: boolean
  errorText?: string | null
}) {
  const canResolve = item.canonicalStatus === "VERIFIED_BY_MANGAKA"
  const canReopen = item.canonicalStatus === "FIXED_BY_ASSISTANT" || item.canonicalStatus === "VERIFIED_BY_MANGAKA"

  return (
    <>
      <SectionTitle title="Comment detail" />
      <MFDetailList items={[
        { id: "status", label: "Canonical status", value: item.canonicalStatus, tone: item.tone, icon: item.tone === "danger" ? "alert-triangle" : "message-circle" },
        { id: "owner", label: "Owner", value: item.owner, tone: "primary", icon: "circle-user" },
        { id: "page", label: "Page target", value: `Page ${item.page}. Mobile preview does not grant signed file access.`, tone: "neutral", icon: "file-text" },
        { id: "blocker", label: "Publication blocker", value: item.blocking ? "Blocks publication until RESOLVED_BY_EDITOR." : "Not currently blocking publication.", tone: item.blocking ? "danger" : "success", icon: item.blocking ? "lock" : "check-circle" },
      ]} />
      <MFTimeline items={[
        { id: "open", title: "OPEN", subtitle: "Editor issue is visible in the production review queue.", tone: "primary", icon: "message-square" },
        { id: "fixed", title: "FIXED_BY_ASSISTANT", subtitle: "Assistant may mark fix complete from assigned task context only.", tone: item.canonicalStatus === "OPEN" ? "neutral" : "success", icon: "check-circle" },
        { id: "verified", title: "VERIFIED_BY_MANGAKA", subtitle: "Mangaka verifies internally before Editor can resolve.", tone: item.canonicalStatus === "VERIFIED_BY_MANGAKA" || item.canonicalStatus === "RESOLVED_BY_EDITOR" ? "success" : "neutral", icon: "shield-check" },
        { id: "resolved", title: "RESOLVED_BY_EDITOR", subtitle: "Only this status clears the publication blocker.", tone: item.canonicalStatus === "RESOLVED_BY_EDITOR" ? "success" : "warning", icon: "check" },
      ]} />
      {canResolve && onResolve ? (
        <MFButton tone="success" variant="soft" onPress={onResolve} disabled={busy}>{busy ? "Resolving..." : "Resolve comment"}</MFButton>
      ) : null}
      {canReopen && onReopen ? (
        <MFButton tone="warning" variant="soft" onPress={onReopen} disabled={busy}>{busy ? "Reopening..." : "Reopen comment"}</MFButton>
      ) : null}
      {errorText ? <Text style={{ color: colors.danger, fontSize: 12, marginTop: spacing.xs }}>{errorText}</Text> : null}
    </>
  )
}

export function EditorReadinessEvidencePanel({ readiness }: { readiness: EditorReadinessResult }) {
  return (
    <>
      <SectionTitle title="Readiness evidence" />
      <MFDetailList items={[
        { id: "source", label: "Source", value: readiness.source, tone: "primary", icon: "shield-check" },
        { id: "blocking", label: "Blocking checks", value: `${readiness.checks.filter((check) => !check.passed).length} blockers returned by backend-owned result`, tone: readiness.overallPassed ? "success" : "danger", icon: "alert-triangle" },
        { id: "chapter", label: "Chapter", value: readiness.chapterTitle, tone: "neutral", icon: "file-text" },
      ]} />
      <MFTimeline items={readiness.checks.map((check) => ({
        id: check.id,
        title: check.title,
        subtitle: check.reason,
        tone: check.passed ? "success" : "danger",
        icon: check.passed ? "check-circle" : "alert-triangle",
      }))} />
    </>
  )
}
