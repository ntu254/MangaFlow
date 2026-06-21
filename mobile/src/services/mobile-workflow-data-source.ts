import { atRiskTitles, boardDecisionHistory, boardHome, boardRankings, boardSeries } from "@/data/board"
import { getMobileApiBaseUrl } from "@/services/mobile-api-config"
import {
  commentActivity,
  commentMetrics,
  editorHome,
  editorReadinessResult,
  finalApprovals,
  manuscripts,
  productionComments,
} from "@/data/editor"
import type {
  BoardAtRiskCase,
  BoardDecisionHistoryItem,
  BoardRankingItem,
  BoardSeriesReviewItem,
  EditorManuscriptReviewItem,
  EditorReadinessResult,
  EditorSubmissionReviewItem,
  MetricItem,
  QueueItem,
  ActivityItem,
  AtRiskDecision,
  BoardVoteValue,
  CommentItem,
  CommentStatus,
  SeriesProposalSummary,
  Tone,
} from "@/domain/workflow"

export interface EditorHomePayload {
  actions: MetricItem[]
  queues: QueueItem[]
  activity: ActivityItem[]
  priorityChapter: EditorManuscriptReviewItem
  readiness: EditorReadinessResult
}

export interface EditorCommentsPayload {
  metrics: MetricItem[]
  comments: CommentItem[]
  activity: ActivityItem[]
}

export interface BoardHomePayload {
  metrics: MetricItem[]
  decisionCards: MetricItem[]
  queues: QueueItem[]
  priorityReview: BoardSeriesReviewItem
  activity: ActivityItem[]
}

export interface EditorProposalRevisionInput {
  revisionReason: string
  feedbackSummary: string
}

export interface EditorForwardInput {
  editorRecommendation: string
  feasibilityNote: string
  suggestedPublicationType: "WEEKLY" | "MONTHLY"
}

export interface EditorRejectInput {
  rejectReason: string
}

export interface EditorCreateCommentInput {
  seriesId: string
  chapterId?: string
  pageId?: string
  taskId?: string
  submissionId?: string
  body: string
  isBlocking?: boolean
}

export interface BoardVoteInput {
  value: BoardVoteValue
  note?: string
}

export interface BoardTieBreakInput extends BoardVoteInput {
  publicationType?: "WEEKLY" | "MONTHLY"
}

export interface BoardFinalizeDecisionInput {
  decision?: "APPROVED" | "REJECTED" | "NEEDS_REVISION"
  publicationType?: "WEEKLY" | "MONTHLY"
  note?: string
}

export interface BoardAtRiskDecisionInput {
  decision: AtRiskDecision
  note?: string
}

export interface MobileWorkflowDataSource {
  startEditorProposalReview(seriesId: string): Promise<void>
  requestEditorProposalRevision(seriesId: string, input: EditorProposalRevisionInput): Promise<void>
  rejectEditorProposal(seriesId: string, input: EditorRejectInput): Promise<void>
  forwardEditorProposalToBoard(seriesId: string, input: EditorForwardInput): Promise<void>
  requestEditorSubmissionRevision(submissionId: string, reviewerNote: string): Promise<void>
  editorApproveSubmission(submissionId: string, reviewerNote: string): Promise<void>
  createEditorComment(input: EditorCreateCommentInput): Promise<void>
  resolveEditorComment(commentId: string): Promise<void>
  reopenEditorComment(commentId: string): Promise<void>
  castBoardVote(seriesId: string, input: BoardVoteInput): Promise<void>
  finalizeBoardDecision(seriesId: string, input: BoardFinalizeDecisionInput): Promise<void>
  tieBreakBoardDecision(seriesId: string, input: BoardTieBreakInput): Promise<void>
  createBoardAtRiskDecision(seriesId: string, input: BoardAtRiskDecisionInput): Promise<void>
  getEditorHome(): Promise<EditorHomePayload>
  getEditorManuscripts(): Promise<EditorManuscriptReviewItem[]>
  getEditorSubmissions(): Promise<EditorSubmissionReviewItem[]>
  getEditorComments(): Promise<EditorCommentsPayload>
  getEditorReadiness(): Promise<EditorReadinessResult>
  getSeriesProposalSummary(seriesId: string, role: MobileApiRole): Promise<SeriesProposalSummary>
  getBoardHome(): Promise<BoardHomePayload>
  getBoardSeriesReviews(): Promise<BoardSeriesReviewItem[]>
  getBoardTieBreaks(): Promise<BoardSeriesReviewItem[]>
  getBoardRankings(): Promise<BoardRankingItem[]>
  getBoardAtRiskCases(): Promise<BoardAtRiskCase[]>
  getBoardDecisionHistory(): Promise<BoardDecisionHistoryItem[]>
}

function resolveMock<T>(payload: T): Promise<T> {
  return Promise.resolve(payload)
}

interface ApiEnvelope<T> {
  success: boolean
  data: T
  message?: string
}

export type MobileApiRole = "editor" | "board"

const EDITOR_EMAIL = process.env.EXPO_PUBLIC_EDITOR_EMAIL ?? "editor@mangaflow.local"
const EDITOR_PASSWORD = process.env.EXPO_PUBLIC_EDITOR_PASSWORD ?? "editor@mangaflow.local"
const BOARD_EMAIL = process.env.EXPO_PUBLIC_BOARD_EMAIL ?? "board@mangaflow.local"
const BOARD_PASSWORD = process.env.EXPO_PUBLIC_BOARD_PASSWORD ?? "board@mangaflow.local"

const tokenCache: Partial<Record<MobileApiRole, string>> = {}

export function setMobileWorkflowAuthToken(role: MobileApiRole, accessToken: string | null) {
  if (accessToken) {
    tokenCache[role] = accessToken
    return
  }

  delete tokenCache[role]
}

export function clearMobileWorkflowAuthTokens() {
  delete tokenCache.editor
  delete tokenCache.board
}

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? value as T[] : []
}

function itemId(value: any, fallback: string): string {
  return String(value?.id ?? value?._id ?? fallback)
}

function maybeId(value: any): string | undefined {
  if (typeof value === "string" && value.trim()) return value
  const id = value?.id ?? value?._id
  return typeof id === "string" && id.trim() ? id : undefined
}

function text(value: unknown, fallback = "Unknown"): string {
  return typeof value === "string" && value.trim() ? value : fallback
}

function numberText(value: unknown, fallback = "0"): string {
  return typeof value === "number" ? String(value) : fallback
}

function fileSizeText(value: unknown): string {
  return typeof value === "number" && Number.isFinite(value) ? `${Math.max(1, Math.round(value / 1024))} KB` : "Metadata only"
}

function publicationType(value: unknown): "WEEKLY" | "MONTHLY" {
  return value === "WEEKLY" ? "WEEKLY" : "MONTHLY"
}

function toneForStatus(status: string | undefined): Tone {
  if (status === "APPROVED" || status === "EDITOR_APPROVED" || status === "MANGAKA_APPROVED" || status === "FINALIZED") return "success"
  if (status === "AT_RISK" || status === "REJECTED" || status === "CANCELLED") return "danger"
  if (status === "REVISION_REQUESTED" || status === "TIE_BREAK_REQUIRED" || status === "NEEDS_REVISION") return "warning"
  return "primary"
}

function boardDecisionStatus(status: string | undefined): BoardSeriesReviewItem["decisionStatus"] {
  if (status === "APPROVED" || status === "REJECTED" || status === "NEEDS_REVISION" || status === "TIE_BREAK_REQUIRED" || status === "FINALIZED") {
    return status
  }
  return "PENDING"
}

function commentStatus(status: string | undefined): CommentStatus {
  if (status === "RESOLVED" || status === "REOPENED") return status
  return "OPEN"
}

function commentStatusLabel(status: CommentStatus): string {
  if (status === "RESOLVED") return "Resolved"
  if (status === "REOPENED") return "Reopened"
  return "Open"
}

function commentTone(status: CommentStatus, blocking: boolean): Tone {
  if (status === "RESOLVED") return "neutral"
  if (status === "REOPENED") return "warning"
  return blocking ? "danger" : "primary"
}

function commentAction(status: CommentStatus): string {
  if (status === "RESOLVED") return "Reopen"
  if (status === "REOPENED") return "Resolve"
  return "Review"
}

function readinessTitle(key: string): string {
  const labels: Record<string, string> = {
    allPagesUploaded: "All pages uploaded",
    allTasksApproved: "All tasks approved",
    allSubmissionsApproved: "All submissions approved",
    allCommentsResolved: "All comments resolved",
    editorFinalApprovalExists: "Editor final approval exists",
    publicationDateExists: "Publication date exists",
  }
  return labels[key] ?? key.replace(/([A-Z])/g, " $1").replace(/^./, (value) => value.toUpperCase())
}

function summaryFromCard(card?: EditorManuscriptReviewItem | BoardSeriesReviewItem): SeriesProposalSummary {
  return {
    seriesId: card?.id ?? "mock-series",
    title: card?.title ?? "Series proposal",
    status: "seriesStatus" in (card ?? {}) ? (card as EditorManuscriptReviewItem | BoardSeriesReviewItem).seriesStatus : "EDITOR_REVIEW",
    synopsis: card?.subtitle ?? "Proposal details are available when the live summary API responds.",
    logline: card?.meta ?? "Metadata only preview.",
    premise: "Mobile summary fallback keeps review context visible without granting file access.",
    characters: "Read-only mobile detail.",
    conflict: "Read-only mobile detail.",
    targetAudience: "General audience",
    requestedPublicationType: publicationType("requestedPublicationType" in (card ?? {}) ? (card as EditorManuscriptReviewItem).requestedPublicationType : (card as BoardSeriesReviewItem | undefined)?.publicationType),
    genres: card?.tags ?? [],
    tags: card?.tags ?? [],
    currentManuscript: {
      id: `${card?.id ?? "mock"}-manuscript`,
      version: "version" in (card ?? {}) ? (card as EditorManuscriptReviewItem).version : "API",
      status: "manuscriptStatus" in (card ?? {}) ? (card as EditorManuscriptReviewItem).manuscriptStatus : "FORWARDED_TO_BOARD",
      fileName: "Signed file access not requested on mobile",
      fileType: "metadata",
      fileSize: "metadata only",
    },
    boardReview: "decisionStatus" in (card ?? {}) ? {
      status: (card as BoardSeriesReviewItem).decisionStatus,
      result: (card as BoardSeriesReviewItem).decisionStatus,
      voteCount: `${(card as BoardSeriesReviewItem).voteSummary.eligible - (card as BoardSeriesReviewItem).voteSummary.pending}`,
    } : undefined,
  }
}

function mapSeriesProposalSummary(summary: any, fallbackId: string): SeriesProposalSummary {
  const series = summary?.series ?? summary ?? {}
  const manuscript = summary?.currentManuscript ?? asArray<any>(summary?.manuscripts)[0]
  const file = manuscript?.file ?? {}
  const boardReview = summary?.boardReview

  return {
    seriesId: itemId(series, fallbackId),
    title: text(series?.title, "Untitled proposal"),
    status: text(series?.status, "EDITOR_REVIEW"),
    synopsis: text(series?.synopsis, "No synopsis provided."),
    logline: text(series?.logline, "No logline provided."),
    premise: text(series?.premise, "No premise provided."),
    characters: text(series?.characters, "No character notes provided."),
    conflict: text(series?.conflict, "No conflict notes provided."),
    targetAudience: text(series?.targetAudience, "Audience not specified"),
    requestedPublicationType: publicationType(series?.requestedPublicationType ?? series?.publicationType),
    genres: asArray<string>(series?.genres),
    tags: asArray<string>(series?.tags),
    currentManuscript: manuscript ? {
      id: itemId(manuscript, `${fallbackId}-manuscript`),
      version: text(manuscript?.version === undefined ? undefined : `v${manuscript.version}`, "v1"),
      status: text(manuscript?.status, "SUBMITTED"),
      fileName: text(file?.originalName, "Signed file access not requested on mobile"),
      fileType: text(file?.mimeType, "metadata"),
      fileSize: fileSizeText(file?.size),
    } : undefined,
    boardReview: boardReview ? {
      status: text(boardReview?.status, "PENDING"),
      result: text(boardReview?.result, "PENDING"),
      voteCount: numberText(boardReview?.voteCount, "0"),
    } : undefined,
  }
}

async function apiMutate(path: string, role: MobileApiRole, body: Record<string, unknown>): Promise<void> {
  const token = await getToken(role)
  const response = await fetch(`${getMobileApiBaseUrl()}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    let message = `Request failed with ${response.status}`
    try {
      const envelope = await response.json() as { message?: string }
      if (envelope?.message) message = envelope.message
    } catch {
      // keep default status message
    }
    throw new Error(message)
  }
}

async function apiRequest<T>(path: string, role: MobileApiRole, init?: RequestInit): Promise<T> {
  const token = await getToken(role)
  const response = await fetch(`${getMobileApiBaseUrl()}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
  })

  if (!response.ok) {
    throw new Error(`Mobile API ${path} failed with ${response.status}`)
  }

  const envelope = await response.json() as ApiEnvelope<T>
  return envelope.data
}

async function getToken(role: MobileApiRole): Promise<string> {
  if (tokenCache[role]) return tokenCache[role] as string

  const email = role === "editor" ? EDITOR_EMAIL : BOARD_EMAIL
  const password = role === "editor" ? EDITOR_PASSWORD : BOARD_PASSWORD
  const response = await fetch(`${getMobileApiBaseUrl()}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-mangaflow-e2e": "true",
    },
    body: JSON.stringify({ email, password }),
  })

  if (!response.ok) {
    throw new Error(`Mobile ${role} login failed with ${response.status}`)
  }

  const envelope = await response.json() as ApiEnvelope<{ accessToken: string }>
  tokenCache[role] = envelope.data.accessToken
  return envelope.data.accessToken
}

function fallbackDataSource(primary: MobileWorkflowDataSource, fallback: MobileWorkflowDataSource): MobileWorkflowDataSource {
  return {
    // Mutations call the live endpoint directly and surface real errors; no silent mock fallback.
    startEditorProposalReview: (seriesId) => primary.startEditorProposalReview(seriesId),
    requestEditorProposalRevision: (seriesId, input) => primary.requestEditorProposalRevision(seriesId, input),
    rejectEditorProposal: (seriesId, input) => primary.rejectEditorProposal(seriesId, input),
    forwardEditorProposalToBoard: (seriesId, input) => primary.forwardEditorProposalToBoard(seriesId, input),
    requestEditorSubmissionRevision: (submissionId, note) => primary.requestEditorSubmissionRevision(submissionId, note),
    editorApproveSubmission: (submissionId, note) => primary.editorApproveSubmission(submissionId, note),
    createEditorComment: (input) => primary.createEditorComment(input),
    resolveEditorComment: (commentId) => primary.resolveEditorComment(commentId),
    reopenEditorComment: (commentId) => primary.reopenEditorComment(commentId),
    castBoardVote: (seriesId, input) => primary.castBoardVote(seriesId, input),
    finalizeBoardDecision: (seriesId, input) => primary.finalizeBoardDecision(seriesId, input),
    tieBreakBoardDecision: (seriesId, input) => primary.tieBreakBoardDecision(seriesId, input),
    createBoardAtRiskDecision: (seriesId, input) => primary.createBoardAtRiskDecision(seriesId, input),
    getEditorHome: async () => primary.getEditorHome().catch(() => fallback.getEditorHome()),
    getEditorManuscripts: async () => primary.getEditorManuscripts().catch(() => fallback.getEditorManuscripts()),
    getEditorSubmissions: async () => primary.getEditorSubmissions().catch(() => fallback.getEditorSubmissions()),
    getEditorComments: async () => primary.getEditorComments().catch(() => fallback.getEditorComments()),
    getEditorReadiness: async () => primary.getEditorReadiness().catch(() => fallback.getEditorReadiness()),
    getSeriesProposalSummary: async (seriesId, role) => primary.getSeriesProposalSummary(seriesId, role).catch(() => fallback.getSeriesProposalSummary(seriesId, role)),
    getBoardHome: async () => primary.getBoardHome().catch(() => fallback.getBoardHome()),
    getBoardSeriesReviews: async () => primary.getBoardSeriesReviews().catch(() => fallback.getBoardSeriesReviews()),
    getBoardTieBreaks: async () => primary.getBoardTieBreaks().catch(() => fallback.getBoardTieBreaks()),
    getBoardRankings: async () => primary.getBoardRankings().catch(() => fallback.getBoardRankings()),
    getBoardAtRiskCases: async () => primary.getBoardAtRiskCases().catch(() => fallback.getBoardAtRiskCases()),
    getBoardDecisionHistory: async () => primary.getBoardDecisionHistory().catch(() => fallback.getBoardDecisionHistory()),
  }
}

export const mockMobileWorkflowDataSource: MobileWorkflowDataSource = {
  startEditorProposalReview: async () => undefined,
  requestEditorProposalRevision: async () => undefined,
  rejectEditorProposal: async () => undefined,
  forwardEditorProposalToBoard: async () => undefined,
  requestEditorSubmissionRevision: async () => undefined,
  editorApproveSubmission: async () => undefined,
  createEditorComment: async () => undefined,
  resolveEditorComment: async () => undefined,
  reopenEditorComment: async () => undefined,
  castBoardVote: async () => undefined,
  finalizeBoardDecision: async () => undefined,
  tieBreakBoardDecision: async () => undefined,
  createBoardAtRiskDecision: async () => undefined,
  getEditorHome: () => resolveMock(editorHome),
  getEditorManuscripts: () => resolveMock(manuscripts),
  getEditorSubmissions: () => resolveMock(finalApprovals),
  getEditorComments: () => resolveMock({ metrics: commentMetrics, comments: productionComments, activity: commentActivity }),
  getEditorReadiness: () => resolveMock(editorReadinessResult),
  getSeriesProposalSummary: async (seriesId, role) => {
    const card = role === "editor"
      ? manuscripts.find((item) => item.id === seriesId) ?? manuscripts[0]
      : boardSeries.find((item) => item.id === seriesId) ?? boardSeries[0]
    return summaryFromCard(card)
  },
  getBoardHome: () => resolveMock(boardHome),
  getBoardSeriesReviews: () => resolveMock(boardSeries),
  getBoardTieBreaks: () => resolveMock(boardSeries.filter((item) => item.decisionStatus === "TIE_BREAK_REQUIRED")),
  getBoardRankings: () => resolveMock(boardRankings),
  getBoardAtRiskCases: () => resolveMock(atRiskTitles),
  getBoardDecisionHistory: () => resolveMock(boardDecisionHistory),
}

export const apiMobileWorkflowDataSource: MobileWorkflowDataSource = {
  startEditorProposalReview: async (seriesId) => {
    await apiMutate(`/editor/series/${seriesId}/start-review`, "editor", {})
  },

  requestEditorProposalRevision: async (seriesId, input) => {
    await apiMutate(`/editor/series/${seriesId}/request-revision`, "editor", {
      revisionReason: input.revisionReason,
      feedbackSummary: input.feedbackSummary,
    })
  },

  rejectEditorProposal: async (seriesId, input) => {
    await apiMutate(`/editor/series/${seriesId}/reject`, "editor", {
      rejectReason: input.rejectReason,
    })
  },

  forwardEditorProposalToBoard: async (seriesId, input) => {
    await apiMutate(`/editor/series/${seriesId}/forward-to-board`, "editor", {
      editorRecommendation: input.editorRecommendation,
      feasibilityNote: input.feasibilityNote,
      suggestedPublicationType: input.suggestedPublicationType,
    })
  },

  requestEditorSubmissionRevision: async (submissionId, reviewerNote) => {
    await apiMutate(`/submissions/${submissionId}/request-revision`, "editor", { reviewerNote })
  },

  editorApproveSubmission: async (submissionId, reviewerNote) => {
    await apiMutate(`/submissions/${submissionId}/editor-approve`, "editor", { reviewerNote })
  },

  createEditorComment: async (input) => {
    await apiMutate("/comments", "editor", {
      seriesId: input.seriesId,
      chapterId: input.chapterId,
      pageId: input.pageId,
      taskId: input.taskId,
      submissionId: input.submissionId,
      body: input.body,
      isBlocking: input.isBlocking ?? true,
    })
  },

  resolveEditorComment: async (commentId) => {
    await apiMutate(`/comments/${commentId}/resolve`, "editor", {})
  },

  reopenEditorComment: async (commentId) => {
    await apiMutate(`/comments/${commentId}/reopen`, "editor", {})
  },

  castBoardVote: async (seriesId, input) => {
    await apiMutate(`/board/series/${seriesId}/votes`, "board", {
      value: input.value,
      note: input.note,
    })
  },

  finalizeBoardDecision: async (seriesId, input) => {
    await apiMutate(`/board/series/${seriesId}/decisions/finalize`, "board", {
      decision: input.decision,
      publicationType: input.publicationType,
      note: input.note,
    })
  },

  tieBreakBoardDecision: async (seriesId, input) => {
    await apiMutate(`/board/series/${seriesId}/decisions/tie-break`, "board", {
      value: input.value,
      publicationType: input.value === "APPROVE" ? input.publicationType : undefined,
      note: input.note,
    })
  },

  createBoardAtRiskDecision: async (seriesId, input) => {
    await apiMutate(`/board/series/${seriesId}/at-risk-decisions`, "board", {
      decision: input.decision,
      note: input.note,
    })
  },

  getEditorHome: async () => {
    const [summary, manuscriptItems, submissionItems, readiness] = await Promise.all([
      apiRequest<any>("/dashboard/editor/summary", "editor"),
      apiMobileWorkflowDataSource.getEditorManuscripts(),
      apiMobileWorkflowDataSource.getEditorSubmissions(),
      apiMobileWorkflowDataSource.getEditorReadiness(),
    ])
    // Prefer the live review-queue lengths so Home counts match the lists the editor can open.
    const manuscriptsCount = manuscriptItems.length || summary?.reviewQueue?.manuscripts || 0
    const finalCount = submissionItems.length || summary?.reviewQueue?.productions || 0

    const actions: MetricItem[] = [
      { id: "manuscripts", label: "Review manuscripts", value: numberText(manuscriptsCount), tone: "primary", icon: "file-text", subtitle: "Live editor review queue", actionLabel: "Review now" },
      { id: "approvals", label: "Final approve submissions", value: numberText(finalCount), tone: "success", icon: "check-circle", subtitle: "Mangaka-approved work", actionLabel: "Approve now" },
      { id: "comments", label: "Resolve comments", value: commentMetrics[0]?.value ?? "0", tone: "warning", icon: "message-circle", subtitle: "Loaded through API-ready boundary", actionLabel: "Resolve now" },
      { id: "blocked", label: "Check blocked chapters", value: readiness.overallPassed ? "0" : "1", tone: readiness.overallPassed ? "success" : "danger", icon: "lock", subtitle: "Backend readiness result", actionLabel: "Check now" },
    ]

    const queues: QueueItem[] = [
      { id: "manuscripts", title: "Manuscripts Waiting", subtitle: "Initial proposals awaiting editor decision", value: numberText(manuscriptsCount), tone: "primary", icon: "file-text" },
      { id: "final", title: "Final Approval Queue", subtitle: "Submissions already approved by Mangaka", value: numberText(finalCount), tone: "success", icon: "shield-check" },
      { id: "comments", title: "Comments Boundary", subtitle: "Comments load per task once selected", value: "API", tone: "warning", icon: "message-square" },
      { id: "readiness", title: "Readiness Alerts", subtitle: "Backend checklist returned blockers", value: readiness.overallPassed ? "0" : "1", tone: readiness.overallPassed ? "success" : "danger", icon: readiness.overallPassed ? "check-circle" : "alert-triangle" },
    ]

    return {
      actions,
      queues,
      activity: asArray<any>(summary?.recentActivity).map((item, index) => ({
        id: itemId(item, `editor-activity-${index}`),
        title: text(item?.label ?? item?.title, "Editor API activity"),
        time: text(item?.time ?? item?.createdAt, "Live"),
        tone: "primary",
        icon: "file-text",
      })),
      priorityChapter: manuscriptItems[0] ?? manuscripts[0],
      readiness,
    }
  },

  getEditorManuscripts: async () => {
    const items = await apiRequest<any[]>("/editor/manuscripts/review-queue", "editor")
    return asArray<any>(items).map((item, index) => {
      const series = item?.series ?? item
      const manuscript = item?.manuscript ?? {}
      const status = text(series?.status, "EDITOR_REVIEW")
      return {
        id: itemId(series, `editor-series-${index}`),
        title: text(series?.title, "Untitled series"),
        subtitle: asArray<string>(series?.genres).join(" / ") || text(series?.targetAudience, "Proposal"),
        meta: `Version ${manuscript?.version ?? 1}`,
        status: status === "REVISION_REQUESTED" ? "Revision Uploaded" : "Waiting Review",
        tone: toneForStatus(status),
        coverTone: index % 2 === 0 ? "dark" : "violet",
        tags: asArray<string>(series?.genres),
        manuscriptStatus: "SUBMITTED",
        seriesStatus: status === "REVISION_REQUESTED" ? "REVISION_REQUESTED" : "EDITOR_REVIEW",
        version: String(manuscript?.version ?? 1),
        requestedPublicationType: publicationType(series?.requestedPublicationType ?? series?.publicationType),
        editorRecommendation: text(manuscript?.editorRecommendation ?? series?.synopsis, "Review proposal before forwarding to Board."),
        decisionActions: ["start-review", "request-revision", "reject", "forward-to-board"],
      } satisfies EditorManuscriptReviewItem
    })
  },

  getEditorSubmissions: async () => {
    const items = await apiRequest<any[]>("/submissions/review-queue", "editor")
    return Promise.all(asArray<any>(items).map(async (item, index) => {
      const task = item?.taskId ?? item?.task ?? {}
      const chapter = task?.chapterId ?? item?.chapterId ?? {}
      const taskId = typeof task === "string" ? task : itemId(task, "")
      const chapterId = typeof chapter === "string" ? chapter : itemId(chapter, "")
      const [taskDetail, chapterDetail, pageItems] = await Promise.all([
        taskId ? apiRequest<any>(`/tasks/${taskId}`, "editor").catch(() => task) : Promise.resolve(task),
        chapterId ? apiRequest<any>(`/chapters/${chapterId}`, "editor").catch(() => chapter) : Promise.resolve(chapter),
        chapterId ? apiRequest<any[]>(`/chapters/${chapterId}/pages`, "editor").catch(() => []) : Promise.resolve([]),
      ])
      const firstPage = asArray<any>(pageItems)[0]
      const status = text(item?.status, "MANGAKA_APPROVED")
      return {
        id: itemId(item, `editor-submission-${index}`),
        seriesId: maybeId(taskDetail?.seriesId) ?? maybeId(task?.seriesId) ?? maybeId(chapterDetail?.seriesId),
        taskId,
        chapterId,
        pageId: maybeId(taskDetail?.pageId) ?? maybeId(firstPage),
        pageCount: asArray<any>(pageItems).length,
        chapterStatus: text(chapterDetail?.status, ""),
        taskPriority: text(taskDetail?.priority, ""),
        taskDueDate: text(taskDetail?.dueDate, ""),
        title: text(taskDetail?.title ?? task?.title, `Submission ${index + 1}`),
        subtitle: text(chapterDetail?.title ?? chapter?.title ?? task?.seriesId?.title, "Production task"),
        meta: `Assistant: ${text(item?.submittedBy?.name ?? task?.assignedTo?.name, "Assigned assistant")}`,
        status: status === "EDITOR_APPROVED" ? "Approved Today" : "Waiting",
        tone: toneForStatus(status),
        coverTone: "mono",
        taskStatus: taskDetail?.status === "EDITOR_APPROVED" ? "EDITOR_APPROVED" : status === "EDITOR_APPROVED" ? "EDITOR_APPROVED" : "MANGAKA_APPROVED",
        submissionStatus: status === "EDITOR_APPROVED" ? "EDITOR_APPROVED" : "MANGAKA_APPROVED",
        assistantName: text(item?.submittedBy?.name ?? task?.assignedTo?.name, "Assigned assistant"),
        mangakaNote: text(item?.reviewerNote ?? item?.resultText, "Mangaka approved; editor final check needed."),
        linkedCommentCount: 0,
        decisionActions: status === "EDITOR_APPROVED" ? [] : ["request-revision", "add-comment", "editor-approve"],
      } satisfies EditorSubmissionReviewItem
    }))
  },

  getEditorComments: async () => {
    const submissions = await apiMobileWorkflowDataSource.getEditorSubmissions()
    const firstTaskId = submissions.find((item) => item.taskId)?.taskId
    if (!firstTaskId) {
      return {
        metrics: commentMetrics,
        comments: productionComments,
        activity: commentActivity,
      }
    }

    const items = await apiRequest<any[]>(`/comments/task/${firstTaskId}`, "editor")
    const comments = asArray<any>(items).map((item, index) => {
      const canonicalStatus = commentStatus(item?.status)
      const blocking = Boolean(item?.isBlocking)
      const tone = commentTone(canonicalStatus, blocking)
      const author = item?.authorId ?? {}
      return {
        id: itemId(item, `comment-${index}`),
        title: text(item?.chapterId?.title ?? item?.taskId?.title, `Task comment ${index + 1}`),
        body: text(item?.body, "Production feedback comment."),
        owner: text(author?.name ?? author?.role, "Production reviewer"),
        status: commentStatusLabel(canonicalStatus),
        canonicalStatus,
        tone,
        action: commentAction(canonicalStatus),
        page: text(item?.pageId?.pageNumber ?? item?.pageId?.index, "API"),
        coverTone: "mono",
        blocking,
      } satisfies CommentItem & { canonicalStatus: CommentStatus; blocking: boolean }
    })

    const open = comments.filter((item) => item.canonicalStatus === "OPEN").length
    const reopened = comments.filter((item) => item.canonicalStatus === "REOPENED").length
    const blocking = comments.filter((item) => item.blocking && item.canonicalStatus !== "RESOLVED").length
    const resolved = comments.filter((item) => item.canonicalStatus === "RESOLVED").length

    return {
      metrics: [
        { id: "open", label: "Open", value: String(open), tone: open > 0 ? "primary" : "success", icon: "message-square" },
        { id: "reopened", label: "Reopened", value: String(reopened), tone: reopened > 0 ? "warning" : "neutral", icon: "check-circle" },
        { id: "blocking", label: "Blocking", value: String(blocking), tone: blocking > 0 ? "danger" : "success", icon: "alert-triangle" },
        { id: "resolved", label: "Resolved", value: String(resolved), tone: "neutral", icon: "calendar" },
      ],
      comments,
      activity: comments.slice(0, 3).map((item) => ({
        id: `${item.id}-activity`,
        title: `${item.status}: ${item.title}`,
        time: "Live API",
        tone: item.tone,
        icon: item.tone === "danger" ? "alert-triangle" : "message-circle",
      })),
    }
  },

  getEditorReadiness: async () => {
    const submissions = await apiMobileWorkflowDataSource.getEditorSubmissions()
    const context = submissions.find((item) => item.chapterId)
    if (!context?.chapterId) return editorReadinessResult

    const readiness = await apiRequest<any>(`/chapters/${context.chapterId}/readiness`, "editor")
    return {
      chapterId: text(readiness?.chapterId, context.chapterId),
      chapterStatus: text(readiness?.chapterStatus, "UNKNOWN"),
      chapterTitle: context.subtitle,
      overallPassed: Boolean(readiness?.ready),
      source: "PublicationReadinessService",
      checks: asArray<any>(readiness?.items).map((item, index) => ({
        id: text(item?.key, `readiness-${index}`),
        title: readinessTitle(text(item?.key, `Readiness ${index + 1}`)),
        passed: Boolean(item?.passed),
        reason: text(item?.reason, "Backend readiness check returned no reason."),
      })),
    } satisfies EditorReadinessResult
  },

  getSeriesProposalSummary: async (seriesId, role) => {
    const summary = await apiRequest<any>(`/series/${seriesId}/summary`, role)
    return mapSeriesProposalSummary(summary, seriesId)
  },

  getBoardHome: async () => {
    const [summary, seriesReviews, atRiskCases] = await Promise.all([
      apiRequest<any>("/dashboard/board/summary", "board"),
      apiMobileWorkflowDataSource.getBoardSeriesReviews(),
      apiMobileWorkflowDataSource.getBoardAtRiskCases(),
    ])
    // Prefer live queue lengths so Home counts match the lists the board can open.
    const pendingVotes = seriesReviews.length || summary?.boardQueue?.pendingVotes || 0
    const atRiskReviews = atRiskCases.length || summary?.boardQueue?.atRiskReviews || 0

    const metrics: MetricItem[] = [
      { id: "waiting", label: "Waiting", value: numberText(pendingVotes), tone: "primary", icon: "file-text" },
      { id: "tie", label: "Tie-break", value: numberText(seriesReviews.filter((item) => item.decisionStatus === "TIE_BREAK_REQUIRED").length), tone: "warning", icon: "scale-balance" },
      { id: "risk", label: "At-risk", value: numberText(atRiskReviews), tone: "danger", icon: "alert-triangle" },
    ]

    return {
      metrics,
      decisionCards: [
        { id: "vote", label: "Vote on series", value: numberText(pendingVotes), tone: "primary", icon: "check-circle", subtitle: "BOARD_REVIEW proposals", actionLabel: "Open votes" },
        { id: "tie", label: "Tie-break required", value: numberText(seriesReviews.filter((item) => item.decisionStatus === "TIE_BREAK_REQUIRED").length), tone: "warning", icon: "scale-balance", subtitle: "Board Chair only", actionLabel: "Resolve now" },
        { id: "risk", label: "Review at-risk titles", value: numberText(atRiskReviews), tone: "danger", icon: "alert-triangle", subtitle: "Manual decision required", actionLabel: "Check risk" },
        { id: "ranking", label: "Finalize ranking", value: "API", tone: "primary", icon: "bar-chart-2", subtitle: "Reader score 1-10", actionLabel: "View ranking" },
      ],
      queues: [
        { id: "series", title: "Series Waiting Review", subtitle: "Proposals forwarded by Tantou Editors", value: numberText(pendingVotes), tone: "primary", icon: "file-text" },
        { id: "tie", title: "Tie-break Decisions", subtitle: "Requires Board Chair separate action", value: numberText(seriesReviews.filter((item) => item.decisionStatus === "TIE_BREAK_REQUIRED").length), tone: "warning", icon: "scale-balance" },
        { id: "risk", title: "At-risk Cases", subtitle: "No auto-cancel; Board decides manually", value: numberText(atRiskReviews), tone: "danger", icon: "alert-triangle" },
        { id: "ranking", title: "Ranking Cycle", subtitle: "Ranking API is available", value: "API", tone: "primary", icon: "bar-chart-2" },
      ],
      priorityReview: seriesReviews[0] ?? boardSeries[0],
      activity: boardHome.activity,
    }
  },

  getBoardSeriesReviews: async () => {
    const items = await apiRequest<any[]>("/board/queue", "board")
    return asArray<any>(items).filter((item) => item.seriesStatus === "BOARD_REVIEW").map((item, index) => {
      const summary = item?.voteSummary ?? {}
      const eligible = typeof item?.eligibleBoardCount === "number" ? Math.max(item.eligibleBoardCount, 1) : typeof item?.voteCount === "number" ? Math.max(item.voteCount, 1) : 1
      const quorum = typeof item?.quorum === "number" ? item.quorum : Math.ceil(eligible / 2)
      const submitted = Number(summary.APPROVE ?? summary.approve ?? 0) + Number(summary.REJECT ?? summary.reject ?? 0) + Number(summary.NEEDS_REVISION ?? summary.needsRevision ?? 0)
      return {
        id: itemId(item, `board-series-${index}`),
        title: text(item?.seriesTitle, "Untitled series"),
        subtitle: text(item?.requestedPublicationType ?? item?.publicationType, "Publication review"),
        meta: `Proposed: ${text(item?.requestedPublicationType ?? item?.publicationType, "MONTHLY")}`,
        status: boardDecisionStatus(item?.decisionStatus) === "TIE_BREAK_REQUIRED" ? "Tie-break" : "Board Review",
        tone: toneForStatus(item?.decisionStatus),
        progress: `${submitted} / ${eligible} votes submitted`,
        progressValue: submitted / eligible,
        coverTone: index % 2 === 0 ? "violet" : "blue",
        tags: [text(item?.requestedPublicationType ?? item?.publicationType, "MONTHLY")],
        seriesStatus: "BOARD_REVIEW",
        decisionStatus: boardDecisionStatus(item?.decisionStatus),
        publicationType: item?.publicationType === "WEEKLY" || item?.requestedPublicationType === "WEEKLY" ? "WEEKLY" : "MONTHLY",
        voteSummary: {
          approve: Number(summary.APPROVE ?? summary.approve ?? 0),
          reject: Number(summary.REJECT ?? summary.reject ?? 0),
          needsRevision: Number(summary.NEEDS_REVISION ?? summary.needsRevision ?? 0),
          pending: Math.max(eligible - submitted, 0),
          eligible,
          quorum,
          canFinalize: Boolean(item?.canFinalize),
        },
        voteOptions: ["APPROVE", "REJECT", "NEEDS_REVISION"],
      } satisfies BoardSeriesReviewItem
    })
  },

  getBoardTieBreaks: async () => {
    const items = await apiMobileWorkflowDataSource.getBoardSeriesReviews()
    return items.filter((item) => item.decisionStatus === "TIE_BREAK_REQUIRED")
  },

  getBoardRankings: async () => {
    const items = await apiRequest<any[]>("/rankings", "board")
    return asArray<any>(items).map((item, index) => ({
      id: itemId(item, `ranking-${index}`),
      title: text(item?.seriesId?.title ?? item?.seriesTitle, "Series ranking"),
      subtitle: `Period ${text(item?.period, "current")}`,
      meta: `Reader score ${item?.readerScore ?? "n/a"}`,
      status: text(item?.status, "DRAFT"),
      tone: toneForStatus(item?.status),
      coverTone: index % 2 === 0 ? "dark" : "red",
      rankingStatus: item?.status === "FINALIZED" ? "FINALIZED" : item?.status === "SUBMITTED" ? "REVIEWED" : "DRAFT",
      rank: index + 1,
      previousRank: index + 2,
      voteCount: Number(item?.voteCount ?? 0),
      readerScore: Number(item?.readerScore ?? 0),
      finalScore: Number(item?.finalScore ?? 0),
    } satisfies BoardRankingItem))
  },

  getBoardAtRiskCases: async () => {
    const items = await apiRequest<any[]>("/board/queue", "board")
    return asArray<any>(items).filter((item) => item.seriesStatus === "AT_RISK").map((item, index) => ({
      id: itemId(item, `risk-${index}`),
      title: text(item?.seriesTitle, "At-risk series"),
      subtitle: "Board manual decision required",
      meta: text(item?.updatedAt, "Live API"),
      status: "At Risk",
      tone: "danger",
      coverTone: index % 2 === 0 ? "dark" : "red",
      seriesStatus: "AT_RISK",
      rankingStatus: "AT_RISK",
      availableDecisions: ["CONTINUE", "WARNING", "CANCEL", "COMPLETE"],
      supportNote: "Backend marks this title at risk; mobile does not auto-cancel.",
      requiresConfirmation: true,
    } satisfies BoardAtRiskCase))
  },

  getBoardDecisionHistory: async () => {
    const reviews = await apiMobileWorkflowDataSource.getBoardSeriesReviews()
    const rankings = await apiMobileWorkflowDataSource.getBoardRankings()
    return [
      ...reviews.filter((item) => item.decisionStatus !== "PENDING").map((item) => ({
        id: `${item.id}-decision`,
        title: item.title,
        decision: item.decisionStatus === "APPROVED" ? "APPROVE" : item.decisionStatus === "REJECTED" ? "REJECT" : "NEEDS_REVISION",
        status: item.decisionStatus === "TIE_BREAK_REQUIRED" ? "TIE_BREAK_REQUIRED" : "FINALIZED",
        time: "Live API",
        immutable: true,
      } satisfies BoardDecisionHistoryItem)),
      ...rankings.slice(0, 2).map((item) => ({
        id: `${item.id}-ranking`,
        title: `${item.title} ranking`,
        decision: "CONTINUE",
        status: "AT_RISK_ACTION_RECORDED",
        time: "Live API",
        immutable: true,
      } satisfies BoardDecisionHistoryItem)),
    ]
  },
}

export const mobileWorkflowDataSource: MobileWorkflowDataSource = fallbackDataSource(apiMobileWorkflowDataSource, mockMobileWorkflowDataSource)
