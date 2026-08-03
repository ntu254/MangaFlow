import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  claimEditorProposal,
  releaseEditorProposalClaim,
  forwardEditorProposal,
  getEditorProposalDetail,
  rejectEditorProposal,
  requestEditorProposalChanges,
  type EditorProposalDetail,
} from "@/services/editor-mobile-data-source"
import { mobileInboxKeys } from "@/services/mobile-inbox-data-source"

export const editorProposalKeys = {
  detail: (id: string) => ["editor", "proposal", id] as const,
}

export function useEditorProposal(
  proposalId: string,
  getDetail: (id: string) => Promise<EditorProposalDetail> = getEditorProposalDetail,
) {
  const queryClient = useQueryClient()

  const detail = useQuery({
    queryKey: editorProposalKeys.detail(proposalId),
    queryFn: () => getDetail(proposalId),
  })

  // Every decision refreshes both this proposal and the Editor inbox order.
  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: editorProposalKeys.detail(proposalId) })
    void queryClient.invalidateQueries({ queryKey: mobileInboxKeys.role("editor") })
  }

  const claim = useMutation({
    mutationFn: () => claimEditorProposal(proposalId),
    onSuccess: invalidate,
  })
  const releaseClaim = useMutation({
    mutationFn: () => releaseEditorProposalClaim(proposalId),
    onSuccess: invalidate,
  })
  const requestChanges = useMutation({
    mutationFn: (input: { comment: string }) => requestEditorProposalChanges(proposalId, input),
    onSuccess: invalidate,
  })
  const reject = useMutation({
    mutationFn: (input: { reason: string }) => rejectEditorProposal(proposalId, input),
    onSuccess: invalidate,
  })
  const forward = useMutation({
    mutationFn: (input: {
      editorRecommendation: string
      feasibilityNote: string
      suggestedPublicationType: "WEEKLY" | "MONTHLY"
    }) => forwardEditorProposal(proposalId, input),
    onSuccess: invalidate,
  })

  return { detail, claim, releaseClaim, requestChanges, reject, forward }
}
