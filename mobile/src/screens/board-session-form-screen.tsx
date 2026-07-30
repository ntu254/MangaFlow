import { useState } from "react"
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { WorkflowDetailLayout } from "@/components/workflow-detail-layout"
import { createBoardSession } from "@/services/board-mobile-data-source"
import { mobileInboxKeys } from "@/services/mobile-inbox-data-source"
import { MobileApiError } from "@/services/mobile-api-error"
import { colors, radius, spacing, typography } from "@/design/tokens"

function errorMessage(error: unknown): string {
  if (error instanceof MobileApiError || error instanceof Error) return error.message
  return "Could not create the session."
}

// Chair-only: open a new voting session for a forwarded proposal. The
// electorate and quorum are decided server-side.
export function BoardSessionFormScreen({ onCreated }: { onCreated?: () => void }) {
  const queryClient = useQueryClient()
  const [proposalId, setProposalId] = useState("")
  const [title, setTitle] = useState("")
  const [localError, setLocalError] = useState<string | null>(null)

  const create = useMutation({
    mutationFn: () => createBoardSession({ proposalId: proposalId.trim(), title: title.trim() || undefined }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: mobileInboxKeys.role("board") })
      onCreated?.()
    },
    onError: (error) => setLocalError(errorMessage(error)),
  })

  const submit = () => {
    if (proposalId.trim().length === 0) {
      setLocalError("A proposal id is required to open a session.")
      return
    }
    setLocalError(null)
    create.mutate()
  }

  return (
    <WorkflowDetailLayout title="Open a voting session" subtitle="Chair only">
      <View style={styles.card}>
        <Text style={styles.label}>Proposal id</Text>
        <TextInput
          accessibilityLabel="Proposal id"
          placeholder="p-004"
          autoCapitalize="none"
          value={proposalId}
          onChangeText={setProposalId}
          style={styles.input}
        />
        <Text style={styles.label}>Title (optional)</Text>
        <TextInput
          accessibilityLabel="Session title"
          placeholder="Weekly slate"
          value={title}
          onChangeText={setTitle}
          style={styles.input}
        />
        {localError ? <Text style={styles.error}>{localError}</Text> : null}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Create session"
          disabled={create.isPending}
          onPress={submit}
          style={[styles.button, create.isPending && styles.disabled]}
        >
          <Text style={styles.buttonText}>{create.isPending ? "Creating…" : "Create session"}</Text>
        </Pressable>
      </View>
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
  error: { color: colors.danger, fontSize: typography.body },
  button: {
    minHeight: 44,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  disabled: { opacity: 0.6 },
  buttonText: { color: colors.surface, fontWeight: "700", fontSize: typography.body },
})
