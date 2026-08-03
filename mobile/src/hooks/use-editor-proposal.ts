import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  claimEditorProposal,
  forwardEditorProposal,
  getEditorProposalDetail,
  rejectEditorProposal,
  requestEditorProposalChanges,
  updateEditorProposalChecklist,
  type EditorialChecklist,
  type EditorProposalDetail,
} from "@/services/editor-mobile-data-source"
import { mobileInboxKeys } from "@/services/mobile-inbox-data-source"
import { getReviewFiles } from "@/services/mobile-file-review"

export const editorProposalKeys = {
  detail: (id: string) => ["editor", "proposal", id] as const,
  reviewFiles: (id: string) => ["editor", "proposal", id, "review-files"] as const,
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

  // The current proposal manuscript and visible proposal attachments only —
  // never chapter/submission files from this screen.
  const reviewFiles = useQuery({
    queryKey: editorProposalKeys.reviewFiles(proposalId),
    queryFn: () => getReviewFiles("proposal", proposalId),
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
    }) => forwardEditorProposal(proposalId, input),
    onSuccess: invalidate,
  })
  const updateChecklist = useMutation({
    mutationFn: (checklist: EditorialChecklist) => updateEditorProposalChecklist(proposalId, checklist),
    onSuccess: invalidate,
  })

  return { detail, claim, requestChanges, reject, forward, updateChecklist, reviewFiles }
}
