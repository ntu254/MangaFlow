import { useMutation, useQueryClient } from "@tanstack/react-query"
import { decideAtRisk, type AtRiskDecisionValue } from "@/services/board-mobile-data-source"
import { mobileInboxKeys } from "@/services/mobile-inbox-data-source"

// At-risk cancellation is a manual Chair decision routed through the validated
// backend service. Success refreshes the Board inbox.
export function useBoardAtRisk(seriesId: string) {
  const queryClient = useQueryClient()
  const decide = useMutation({
    mutationFn: (input: { rankingId: string; decision: AtRiskDecisionValue; note?: string }) =>
      decideAtRisk(seriesId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: mobileInboxKeys.role("board") })
    },
  })
  return { decide }
}
