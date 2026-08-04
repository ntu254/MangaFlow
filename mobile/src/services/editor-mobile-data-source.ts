import { mobileApi } from "@/services/mobile-api-client"
import { z } from "zod"

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

export interface EditorialChecklist {
  hook: boolean
  characterMotivation: boolean
  audienceFit: boolean
  storyboardFlow: boolean
  manuscriptQuality: boolean
  serializePotential: boolean
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
  currentManuscript: { id: string; version: number } | null
  version: number | null
  editorialChecklist: EditorialChecklist | null
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

export function releaseEditorProposalClaim(proposalId: string): Promise<void> {
  return proposalAction(proposalId, "RELEASE_CLAIM")
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
  },
): Promise<void> {
  return proposalAction(proposalId, "FORWARD", input)
}

export function updateEditorProposalChecklist(
  proposalId: string,
  checklist: EditorialChecklist,
): Promise<void> {
  return proposalAction(proposalId, "UPDATE_EDITORIAL_CHECKLIST", { editorialChecklist: checklist })
}

// ---------------------------------------------------------------------------
// Chapter review
// ---------------------------------------------------------------------------

export interface EditorReadiness {
  ready: boolean
  items: Array<{ key: string; passed: boolean; reason: string }>
}

export interface EditorChapterDetail {
  chapter: {
    id: string
    seriesId: string
    title: string
    number: number
    status: string
    version: number | null
  }
  series: {
    id: string
    title: string
    editorId: string | null
    publicationType?: "WEEKLY" | "MONTHLY" | null
    cadence?: string | null
  }
  pages: Array<{ id: string; pageNumber: number | null; status: string; thumbnailFileKey?: string }>
  readiness: EditorReadiness
  blockers: Array<{ id: string; status: string; body: string; targetType: string; targetId: string }>
  evidence: { taskCount: number; currentSubmissionCount: number }
  publication: { status: string; scheduledAt: string | null } | null
  actions: EditorProposalActionDescriptor[]
}

export function getEditorChapterDetail(chapterId: string): Promise<EditorChapterDetail> {
  return mobileApi.request<EditorChapterDetail>(`/editor/chapters/${chapterId}/detail`)
}

function chapterAction(chapterId: string, action: string, body?: unknown): Promise<void> {
  return mobileApi.request<void>(`/chapters/${chapterId}/actions/${action}`, {
    method: "POST",
    body: JSON.stringify(body ?? {}),
  })
}

export function requestChapterRevision(
  chapterId: string,
  input: { comment: string },
): Promise<void> {
  return chapterAction(chapterId, "REQUEST_REVISION", input)
}

export function rejectChapter(chapterId: string, input: { comment: string }): Promise<void> {
  return chapterAction(chapterId, "REJECT", input)
}

export function approveChapter(chapterId: string): Promise<void> {
  return chapterAction(chapterId, "EDITOR_APPROVE")
}

// ---------------------------------------------------------------------------
// Editorial comments
// ---------------------------------------------------------------------------

export interface CreateEditorCommentInput {
  targetType: "CHAPTER" | "PAGE" | "REGION" | "TASK" | "SUBMISSION"
  targetId: string
  body: string
  isBlocking?: boolean
}

export function createEditorComment(input: CreateEditorCommentInput): Promise<void> {
  return mobileApi.request<void>("/comments", { method: "POST", body: JSON.stringify(input) })
}

export function replyEditorComment(commentId: string, input: { body: string }): Promise<void> {
  return mobileApi.request<void>(`/comments/${commentId}/replies`, {
    method: "POST",
    body: JSON.stringify(input),
  })
}

export function resolveEditorComment(commentId: string): Promise<void> {
  return mobileApi.request<void>(`/comments/${commentId}/resolve`, { method: "POST", body: "{}" })
}

export function reopenEditorComment(commentId: string): Promise<void> {
  return mobileApi.request<void>(`/comments/${commentId}/reopen`, { method: "POST", body: "{}" })
}

// ---------------------------------------------------------------------------
// Publication
// ---------------------------------------------------------------------------

export function scheduleChapterPublication(
  chapterId: string,
  input: { scheduledAt: string },
): Promise<void> {
  return chapterAction(chapterId, "SCHEDULE", input)
}

export function postponeChapterPublication(chapterId: string): Promise<void> {
  return chapterAction(chapterId, "POSTPONE")
}

export function publishChapterNow(chapterId: string): Promise<void> {
  return chapterAction(chapterId, "PUBLISH")
}

// ---------------------------------------------------------------------------
// Read-only activity history
// ---------------------------------------------------------------------------

export interface EditorHistoryItem {
  id: string
  action: string
  area: "PROPOSAL" | "CHAPTER" | "COMMENT" | "PUBLICATION"
  entityId: string
  subject: string
  seriesTitle: string | null
  chapterNumber: number | null
  chapterTitle: string | null
  outcome: string | null
  occurredAt: string | null
}

const editorActivitySchema = z.array(z.object({
  id: z.string(),
  action: z.string(),
  area: z.enum(["PROPOSAL", "CHAPTER", "COMMENT", "PUBLICATION"]),
  entityId: z.string(),
  subject: z.string(),
  seriesTitle: z.string().nullable(),
  chapterNumber: z.number().int().positive().nullable(),
  chapterTitle: z.string().nullable(),
  outcome: z.string().nullable(),
  occurredAt: z.string().datetime().nullable(),
}))

export async function getEditorHistory(): Promise<EditorHistoryItem[]> {
  return editorActivitySchema.parse(
    await mobileApi.request(`/editor/activity`),
  )
}
