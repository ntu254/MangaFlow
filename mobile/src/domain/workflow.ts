import type { IconName } from "@/design/icons"

export type Role = "board" | "editor"

export type Tone = "primary" | "success" | "warning" | "danger" | "neutral"

export interface MetricItem {
  id: string
  label: string
  value: string
  tone: Tone
  icon: IconName
  subtitle?: string
  actionLabel?: string
}

export interface QueueItem {
  id: string
  title: string
  subtitle: string
  value?: string
  tone: Tone
  icon?: IconName
}

export interface SeriesCard {
  id: string
  title: string
  subtitle: string
  meta: string
  status: string
  tone: Tone
  progress?: string
  progressValue?: number
  coverTone: "violet" | "red" | "blue" | "dark" | "warm" | "mono"
  tags?: string[]
}

export interface ActivityItem {
  id: string
  title: string
  time: string
  tone: Tone
  icon?: IconName
}

export interface CommentItem {
  id: string
  title: string
  body: string
  owner: string
  status: string
  tone: Tone
  action: string
  page: string
  coverTone: SeriesCard["coverTone"]
}

export type SeriesStatus =
  | "DRAFT"
  | "EDITOR_REVIEW"
  | "REVISION_REQUESTED"
  | "BOARD_REVIEW"
  | "APPROVED"
  | "ONGOING"
  | "AT_RISK"
  | "REJECTED"
  | "CANCELLED"
  | "COMPLETED"

export type ManuscriptStatus = "DRAFT" | "SUBMITTED" | "EDITOR_REVIEW" | "REVISION_REQUESTED" | "APPROVED_TO_BOARD" | "REJECTED"

export type TaskStatus = "TODO" | "IN_PROGRESS" | "SUBMITTED" | "MANGAKA_APPROVED" | "EDITOR_APPROVED" | "REVISION_REQUESTED" | "REJECTED"

export type SubmissionStatus = "SUBMITTED" | "MANGAKA_APPROVED" | "EDITOR_APPROVED" | "REVISION_REQUESTED" | "REJECTED"

export type CommentStatus = "OPEN" | "FIXED_BY_ASSISTANT" | "VERIFIED_BY_MANGAKA" | "RESOLVED_BY_EDITOR"

export type BoardVoteValue = "APPROVE" | "REJECT" | "NEEDS_REVISION"

export type BoardDecisionStatus = "PENDING" | "APPROVED" | "REJECTED" | "NEEDS_REVISION" | "TIE_BREAK_REQUIRED" | "FINALIZED"

export type RankingStatus = "DRAFT" | "IMPORTED" | "REVIEWED" | "FINALIZED" | "WARNING" | "AT_RISK"

export type AtRiskDecision = "CONTINUE" | "WARNING" | "REQUEST_IMPROVEMENT_PLAN" | "CANCEL"

export type EditorProposalAction = "request-revision" | "reject" | "forward-to-board"

export type EditorFinalApprovalAction = "request-revision" | "add-comment" | "editor-approve"

export interface EditorManuscriptReviewItem extends SeriesCard {
  manuscriptStatus: ManuscriptStatus
  seriesStatus: SeriesStatus
  version: string
  editorRecommendation: string
  decisionActions: EditorProposalAction[]
}

export interface EditorSubmissionReviewItem extends SeriesCard {
  taskId?: string
  chapterId?: string
  chapterStatus?: string
  taskPriority?: string
  taskDueDate?: string
  taskStatus: TaskStatus
  submissionStatus: SubmissionStatus
  assistantName: string
  mangakaNote: string
  linkedCommentCount: number
  decisionActions: EditorFinalApprovalAction[]
}

export interface EditorReadinessCheck {
  id: string
  title: string
  passed: boolean
  reason: string
}

export interface EditorReadinessResult {
  chapterId?: string
  chapterStatus?: string
  chapterTitle: string
  overallPassed: boolean
  checks: EditorReadinessCheck[]
  source: "PublicationReadinessService"
}

export interface BoardVoteSummary {
  approve: number
  reject: number
  needsRevision: number
  pending: number
  eligible: number
}

export interface BoardSeriesReviewItem extends SeriesCard {
  seriesStatus: "BOARD_REVIEW"
  decisionStatus: BoardDecisionStatus
  publicationType: "WEEKLY" | "MONTHLY"
  voteSummary: BoardVoteSummary
  voteOptions: BoardVoteValue[]
}

export interface BoardRankingItem extends SeriesCard {
  rankingStatus: RankingStatus
  rank: number
  previousRank: number
  voteCount: number
  readerScore: number
  finalScore: number
}

export interface BoardAtRiskCase extends SeriesCard {
  seriesStatus: "AT_RISK"
  rankingStatus: "AT_RISK" | "WARNING"
  availableDecisions: AtRiskDecision[]
  supportNote: string
  requiresConfirmation: true
}

export interface BoardDecisionHistoryItem {
  id: string
  title: string
  decision: BoardVoteValue | AtRiskDecision
  status: BoardDecisionStatus | "AT_RISK_ACTION_RECORDED"
  time: string
  immutable: true
}
