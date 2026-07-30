import { mobileApi } from "@/services/mobile-api-client"

// Editor detail reads and canonical proposal decisions. Detail shapes mirror
// the backend mobile-editor-detail projections; mutations call the canonical
// proposal action endpoint so backend permissions and transitions stay owned
// server-side.

export interface EditorProposalActionDescriptor {
  action: string
  enabled: boolean
  disabledReason: string | null
  requiresConfirmation: boolean
  requiresReason: boolean
}

export interface EditorProposalDetail {
  proposal: {
    id: string
    title: string
    status: string
    synopsis: string
    logline: string
    targetAudience: string | null
    genres: string[]
    requestedPublicationType: "WEEKLY" | "MONTHLY"
  }
  claim: {
    claimedByEditorId: string | null
    claimedByEditorName: string | null
    claimedByMe: boolean
  }
  currentManuscript: { id: string; version: number; status: string } | null
  version: number | null
  history: Array<{
    id: string
    type: string
    fromStatus: string | null
    toStatus: string | null
    actorName: string | null
    comment: string | null
    createdAt: string | null
  }>
  actions: EditorProposalActionDescriptor[]
}

export function getEditorProposalDetail(proposalId: string): Promise<EditorProposalDetail> {
  return mobileApi.request<EditorProposalDetail>(`/editor/proposals/${proposalId}/detail`)
}

function proposalAction(proposalId: string, action: string, body?: unknown): Promise<void> {
  return mobileApi.request<void>(`/proposals/${proposalId}/actions/${action}`, {
    method: "POST",
    body: JSON.stringify(body ?? {}),
  })
}

export function claimEditorProposal(proposalId: string): Promise<void> {
  return proposalAction(proposalId, "CLAIM")
}

export function requestEditorProposalChanges(
  proposalId: string,
  input: { comment: string },
): Promise<void> {
  return proposalAction(proposalId, "REQUEST_CHANGES", input)
}

export function rejectEditorProposal(proposalId: string, input: { reason: string }): Promise<void> {
  return proposalAction(proposalId, "REJECT", { comment: input.reason })
}

export function forwardEditorProposal(
  proposalId: string,
  input: {
    editorRecommendation: string
    feasibilityNote: string
    suggestedPublicationType: "WEEKLY" | "MONTHLY"
  },
): Promise<void> {
  return proposalAction(proposalId, "FORWARD", input)
}
