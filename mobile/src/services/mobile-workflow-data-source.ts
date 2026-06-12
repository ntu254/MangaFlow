import { atRiskTitles, boardDecisionHistory, boardHome, boardRankings, boardSeries } from "@/data/board"
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
