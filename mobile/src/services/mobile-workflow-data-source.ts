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
  CommentItem,
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

export interface MobileWorkflowDataSource {
  getEditorHome(): Promise<EditorHomePayload>
  getEditorManuscripts(): Promise<EditorManuscriptReviewItem[]>
  getEditorSubmissions(): Promise<EditorSubmissionReviewItem[]>
  getEditorComments(): Promise<EditorCommentsPayload>
  getEditorReadiness(): Promise<EditorReadinessResult>
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

type MobileApiRole = "editor" | "board"

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

function text(value: unknown, fallback = "Unknown"): string {
  return typeof value === "string" && value.trim() ? value : fallback
}

function numberText(value: unknown, fallback = "0"): string {
  return typeof value === "number" ? String(value) : fallback
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
    getEditorHome: async () => primary.getEditorHome().catch(() => fallback.getEditorHome()),
    getEditorManuscripts: async () => primary.getEditorManuscripts().catch(() => fallback.getEditorManuscripts()),
    getEditorSubmissions: async () => primary.getEditorSubmissions().catch(() => fallback.getEditorSubmissions()),
    getEditorComments: async () => primary.getEditorComments().catch(() => fallback.getEditorComments()),
    getEditorReadiness: async () => primary.getEditorReadiness().catch(() => fallback.getEditorReadiness()),
    getBoardHome: async () => primary.getBoardHome().catch(() => fallback.getBoardHome()),
    getBoardSeriesReviews: async () => primary.getBoardSeriesReviews().catch(() => fallback.getBoardSeriesReviews()),
    getBoardTieBreaks: async () => primary.getBoardTieBreaks().catch(() => fallback.getBoardTieBreaks()),
    getBoardRankings: async () => primary.getBoardRankings().catch(() => fallback.getBoardRankings()),
    getBoardAtRiskCases: async () => primary.getBoardAtRiskCases().catch(() => fallback.getBoardAtRiskCases()),
    getBoardDecisionHistory: async () => primary.getBoardDecisionHistory().catch(() => fallback.getBoardDecisionHistory()),
  }
}

export const mockMobileWorkflowDataSource: MobileWorkflowDataSource = {
  getEditorHome: () => resolveMock(editorHome),
  getEditorManuscripts: () => resolveMock(manuscripts),
  getEditorSubmissions: () => resolveMock(finalApprovals),
  getEditorComments: () => resolveMock({ metrics: commentMetrics, comments: productionComments, activity: commentActivity }),
  getEditorReadiness: () => resolveMock(editorReadinessResult),
  getBoardHome: () => resolveMock(boardHome),
  getBoardSeriesReviews: () => resolveMock(boardSeries),
  getBoardTieBreaks: () => resolveMock(boardSeries.filter((item) => item.decisionStatus === "TIE_BREAK_REQUIRED")),
  getBoardRankings: () => resolveMock(boardRankings),
  getBoardAtRiskCases: () => resolveMock(atRiskTitles),
  getBoardDecisionHistory: () => resolveMock(boardDecisionHistory),
}

export const apiMobileWorkflowDataSource: MobileWorkflowDataSource = {
  getEditorHome: async () => {
    const summary: any = await apiRequest("/dashboard/editor/summary", "editor")
    const manuscriptsCount = summary?.reviewQueue?.manuscripts ?? manuscripts.length
    const finalCount = summary?.reviewQueue?.productions ?? finalApprovals.length
    const readiness = await apiMobileWorkflowDataSource.getEditorReadiness()

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
      priorityChapter: (await apiMobileWorkflowDataSource.getEditorManuscripts())[0] ?? manuscripts[0],
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
        manuscriptStatus: "EDITOR_REVIEW",
        seriesStatus: status === "REVISION_REQUESTED" ? "REVISION_REQUESTED" : "EDITOR_REVIEW",
        version: String(manuscript?.version ?? 1),
        editorRecommendation: text(manuscript?.editorRecommendation ?? series?.synopsis, "Review proposal before forwarding to Board."),
        decisionActions: ["request-revision", "reject", "forward-to-board"],
      } satisfies EditorManuscriptReviewItem
    })
  },

  getEditorSubmissions: async () => {
    const items = await apiRequest<any[]>("/submissions/review-queue", "editor")
    return asArray<any>(items).map((item, index) => {
      const task = item?.taskId ?? item?.task ?? {}
      const status = text(item?.status, "MANGAKA_APPROVED")
      return {
        id: itemId(item, `editor-submission-${index}`),
        title: text(task?.title, `Submission ${index + 1}`),
        subtitle: text(task?.chapterId?.title ?? task?.seriesId?.title, "Production task"),
        meta: `Assistant: ${text(item?.submittedBy?.name ?? task?.assignedTo?.name, "Assigned assistant")}`,
        status: status === "EDITOR_APPROVED" ? "Approved Today" : "Waiting",
        tone: toneForStatus(status),
        coverTone: "mono",
        taskStatus: status === "EDITOR_APPROVED" ? "EDITOR_APPROVED" : "MANGAKA_APPROVED",
        submissionStatus: status === "EDITOR_APPROVED" ? "EDITOR_APPROVED" : "MANGAKA_APPROVED",
        assistantName: text(item?.submittedBy?.name ?? task?.assignedTo?.name, "Assigned assistant"),
        mangakaNote: text(item?.reviewerNote ?? item?.resultText, "Mangaka approved; editor final check needed."),
        linkedCommentCount: 0,
        decisionActions: status === "EDITOR_APPROVED" ? [] : ["request-revision", "add-comment", "editor-approve"],
      } satisfies EditorSubmissionReviewItem
    })
  },

  getEditorComments: async () => {
    const submissions = await apiMobileWorkflowDataSource.getEditorSubmissions()
    const firstTaskId = submissions[0]?.id
    const comments = firstTaskId ? [] : []
    return {
      metrics: commentMetrics,
      comments,
      activity: commentActivity,
    }
  },

  getEditorReadiness: async () => {
    const fallback = editorReadinessResult
    return fallback
  },

  getBoardHome: async () => {
    const summary: any = await apiRequest("/dashboard/board/summary", "board")
    const pendingVotes = summary?.boardQueue?.pendingVotes ?? boardSeries.length
    const atRiskReviews = summary?.boardQueue?.atRiskReviews ?? atRiskTitles.length
    const seriesReviews = await apiMobileWorkflowDataSource.getBoardSeriesReviews()

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
      const eligible = typeof item?.voteCount === "number" ? Math.max(item.voteCount, 1) : 1
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
      availableDecisions: ["CONTINUE", "WARNING", "REQUEST_IMPROVEMENT_PLAN", "CANCEL"],
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
