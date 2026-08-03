import { useState } from "react"
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { MFBadge, MFEmptyState } from "@/components/mf"
import { WorkflowDetailLayout } from "@/components/workflow-detail-layout"
import { WorkflowState } from "@/components/workflow-state"
import { useBoardPendingProposals } from "@/hooks/use-board-sessions"
import { createBoardSession } from "@/services/board-mobile-data-source"
import { mobileInboxKeys } from "@/services/mobile-inbox-data-source"
import { MobileApiError } from "@/services/mobile-api-error"
import { colors, radius, spacing, typography } from "@/design/tokens"

function errorMessage(error: unknown): string {
  if (error instanceof MobileApiError || error instanceof Error) return error.message
  return "Could not create the session."
}

// Chair-only: choose one backend-eligible proposal. Electorate, quorum, and
// proposal snapshot are frozen by the backend when the round is opened.
export function BoardSessionFormScreen({ onCreated }: { onCreated?: () => void }) {
  const queryClient = useQueryClient()
  const proposals = useBoardPendingProposals()
  const [proposalId, setProposalId] = useState<string | null>(null)
  const [title, setTitle] = useState("Board meeting")
  const [localError, setLocalError] = useState<string | null>(null)

  const create = useMutation({
    mutationFn: () => {
      if (!proposalId) throw new Error("Choose a proposal first.")
      return createBoardSession({
        proposalId,
        title: title.trim() || undefined,
      })
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["board"] })
      void queryClient.invalidateQueries({ queryKey: mobileInboxKeys.role("board") })
      onCreated?.()
    },
    onError: (error) => setLocalError(errorMessage(error)),
  })

  const submit = () => {
    if (!proposalId) {
      setLocalError("Choose one proposal awaiting Board review.")
      return
    }
    setLocalError(null)
    create.mutate()
  }

  return (
    <WorkflowDetailLayout
      title="Open a voting session"
      subtitle="One proposal · backend-owned quorum and electorate"
    >
      <View style={styles.card}>
        <Text style={styles.label}>Session title</Text>
        <TextInput
          accessibilityLabel="Session title"
          placeholder="Board meeting"
          value={title}
          onChangeText={setTitle}
          style={styles.input}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Proposal awaiting Board review</Text>
        {proposals.isLoading && !proposals.data ? (
          <WorkflowState kind="loading" />
        ) : proposals.error && !proposals.data ? (
          <WorkflowState
            kind="error"
            context="proposals awaiting a session"
            error={proposals.error}
            onRetry={() => void proposals.refetch()}
          />
        ) : proposals.data?.length ? (
          <View style={styles.stack}>
            {proposals.data.map((proposal) => {
              const selected = proposal.id === proposalId
              return (
                <Pressable
                  key={proposal.id}
                  accessibilityRole="radio"
                  accessibilityLabel={`Select ${proposal.title}`}
                  accessibilityState={{ selected }}
                  onPress={() => {
                    setLocalError(null)
                    setProposalId(proposal.id)
                  }}
                  style={[styles.proposal, selected && styles.proposalSelected]}
                >
                  <View style={styles.proposalMain}>
                    <Text style={styles.proposalTitle}>{proposal.title}</Text>
                    <Text style={styles.proposalMeta}>
                      {proposal.authorName ?? "Unknown author"} · snapshot {proposal.currentVersion ?? "current"}
                    </Text>
                  </View>
                  <MFBadge tone={selected ? "primary" : "neutral"}>
                    {proposal.requestedPublicationType ?? "PENDING"}
                  </MFBadge>
                </Pressable>
              )
            })}
          </View>
        ) : (
          <MFEmptyState
            title="No eligible proposals"
            subtitle="A Tantou Editor must forward a proposal to PENDING_BOARD first."
            icon="file-check"
          />
        )}
      </View>

      {localError ? <Text accessibilityRole="alert" style={styles.error}>{localError}</Text> : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Create session"
        accessibilityState={{ disabled: create.isPending || !proposalId, busy: create.isPending }}
        disabled={create.isPending || !proposalId}
        onPress={submit}
        style={[styles.button, (create.isPending || !proposalId) && styles.disabled]}
      >
        <Text style={styles.buttonText}>{create.isPending ? "Creating…" : "Create session"}</Text>
      </Pressable>
    </WorkflowDetailLayout>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    padding: spacing.md,
    gap: spacing.sm,
  },
  label: { fontSize: typography.label, fontWeight: "800", color: colors.textMuted },
  input: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: typography.body,
    color: colors.text,
  },
  stack: { gap: spacing.sm },
  proposal: {
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  proposalSelected: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  proposalMain: { flex: 1, minWidth: 0 },
  proposalTitle: { color: colors.text, fontSize: typography.body, fontWeight: "800" },
  proposalMeta: { color: colors.textMuted, fontSize: typography.label, marginTop: 3 },
  error: { color: colors.danger, fontSize: typography.body },
  button: {
    minHeight: 44,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  disabled: { opacity: 0.45 },
  buttonText: { color: colors.surface, fontWeight: "700", fontSize: typography.body },
})
