import { useMemo, useState } from "react"
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native"
import {
  MFBadge,
  MFDetailList,
  MFEmptyState,
  MFHero,
  MFMetricStrip,
  MFTimeline,
  SectionTitle,
} from "@/components/mf"
import { WorkflowState } from "@/components/workflow-state"
import { useBoardRankings } from "@/hooks/use-board-rankings"
import type { BoardRankingItem } from "@/services/board-mobile-data-source"
import { colors, radius, spacing, typography } from "@/design/tokens"

export function BoardRankingScreen({
  onOpenAtRisk,
}: {
  onOpenAtRisk?: (item: BoardRankingItem) => void
}) {
  const rankings = useBoardRankings()
  const [search, setSearch] = useState("")
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const items = useMemo(() => {
    const value = search.trim().toLocaleLowerCase()
    if (!value) return rankings.data?.items ?? []
    return (rankings.data?.items ?? []).filter((item) =>
      item.seriesTitle.toLocaleLowerCase().includes(value),
    )
  }, [rankings.data?.items, search])

  const selected = items.find((item) => item.id === selectedId) ?? items[0] ?? null

  if (rankings.isLoading && !rankings.data) return <WorkflowState kind="loading" />
  if (rankings.error && !rankings.data) {
    return (
      <WorkflowState
        kind="error"
        context="the ranking snapshot"
        error={rankings.error}
        onRetry={() => void rankings.refetch()}
      />
    )
  }

  return (
    <>
      <MFHero
        role="board"
        title="Ranking"
        subtitle="Read-only backend ranking insight. Import remains on web."
      />
      <MFMetricStrip items={[
        { id: "rows", label: "Ranked", value: String(rankings.data?.items.length ?? 0), tone: "primary", icon: "bar-chart-2" },
        { id: "risk", label: "At Risk", value: String((rankings.data?.items ?? []).filter((item) => item.atRisk).length), tone: "danger", icon: "alert-triangle" },
        { id: "source", label: "Formula", value: "Backend", tone: "success", icon: "shield-check" },
      ]} />
      <TextInput
        accessibilityLabel="Search rankings"
        placeholder="Search series"
        placeholderTextColor={colors.outline}
        value={search}
        onChangeText={setSearch}
        style={styles.search}
      />
      <SectionTitle title="Ranking results" />
      <View style={styles.stack}>
        {items.length ? items.map((item) => (
          <Pressable
            key={item.id}
            accessibilityRole="button"
            accessibilityLabel={`Open ${item.seriesTitle} ranking`}
            accessibilityState={{ selected: selected?.id === item.id }}
            onPress={() => setSelectedId(item.id)}
            style={[styles.row, selected?.id === item.id && styles.rowSelected]}
          >
            <View style={styles.rowMain}>
              <Text style={styles.title}>{item.seriesTitle}</Text>
              <Text style={styles.meta}>
                Rank {item.rank ?? "—"} · Reader score {item.readerScore ?? "—"} · Final {item.finalScore ?? "—"}
              </Text>
            </View>
            <MFBadge tone={item.atRisk ? "danger" : "success"}>
              {item.atRisk ? "AT RISK" : item.status ?? "RANKED"}
            </MFBadge>
          </Pressable>
        )) : (
          <MFEmptyState
            title="No ranking rows"
            subtitle="The backend has no ranking values matching this search."
            icon="bar-chart-2"
          />
        )}
      </View>

      {selected ? (
        <>
          <SectionTitle title="Ranking insight" />
          <MFDetailList items={[
            {
              id: "movement",
              label: "Rank movement",
              value: movementText(selected),
              tone: movementTone(selected),
              icon: movementTone(selected) === "danger" ? "alert-triangle" : "check-circle",
            },
            {
              id: "reader",
              label: "Reader score",
              value: selected.readerScore == null ? "Not supplied" : `${selected.readerScore}. Backend value; mobile does not recalculate.`,
              tone: selected.readerScore != null && selected.readerScore >= 7 ? "success" : "warning",
              icon: "bar-chart-2",
            },
            {
              id: "final",
              label: "Final score",
              value: selected.finalScore == null ? "Not supplied" : `${selected.finalScore}. Ranking formula remains backend-owned.`,
              tone: "neutral",
              icon: "shield-check",
            },
          ]} />
          <MFTimeline items={[
            {
              id: "source",
              title: "Server ranking snapshot",
              subtitle: `Generated ${formatDate(rankings.data?.generatedAt)}.`,
              tone: "primary",
              icon: "bar-chart-2",
            },
            {
              id: "risk",
              title: selected.atRisk
                ? selected.decisionStatus === "DECIDED"
                  ? "Board decision recorded"
                  : "Manual Board review required"
                : "No at-risk action",
              subtitle: selected.atRisk
                ? selected.decisionStatus === "DECIDED"
                  ? `Decision: ${selected.decision ?? "recorded"}.`
                  : "Cancellation is never automatic. The Board Chair must confirm a backend action."
                : "This row is read-only on mobile.",
              tone: selected.atRisk ? "danger" : "success",
              icon: selected.atRisk ? "alert-triangle" : "check-circle",
            },
          ]} />
          {selected.atRisk && selected.decisionStatus !== "DECIDED" && onOpenAtRisk ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Review at-risk decision for ${selected.seriesTitle}`}
              onPress={() => onOpenAtRisk(selected)}
              style={styles.action}
            >
              <Text style={styles.actionText}>Review at-risk decision</Text>
            </Pressable>
          ) : null}
        </>
      ) : null}
    </>
  )
}

function movementText(item: BoardRankingItem): string {
  if (item.rank == null || item.previousRank == null) return "No previous rank supplied"
  const movement = item.previousRank - item.rank
  if (movement > 0) return `Up ${movement} places`
  if (movement < 0) return `Down ${Math.abs(movement)} places`
  return "No rank movement"
}

function movementTone(item: BoardRankingItem): "success" | "danger" | "neutral" {
  if (item.rank == null || item.previousRank == null) return "neutral"
  return item.previousRank - item.rank >= 0 ? "success" : "danger"
}

function formatDate(value?: string): string {
  if (!value) return "unknown time"
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString()
}

const styles = StyleSheet.create({
  search: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    color: colors.text,
    fontSize: typography.body,
    paddingHorizontal: spacing.md,
  },
  stack: { gap: spacing.sm },
  row: {
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  rowSelected: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  rowMain: { flex: 1, minWidth: 0 },
  title: { color: colors.text, fontSize: typography.body, fontWeight: "800" },
  meta: { color: colors.textMuted, fontSize: typography.label, marginTop: 3 },
  action: {
    minHeight: 44,
    borderRadius: radius.full,
    backgroundColor: colors.dangerSoft,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.md,
  },
  actionText: { color: colors.danger, fontSize: typography.body, fontWeight: "800" },
})
