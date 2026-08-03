import type { IconName } from "@/design/icons";

export type Role = "board" | "editor";

export type Tone = "primary" | "success" | "warning" | "danger" | "neutral";

export interface MetricItem {
  id: string;
  label: string;
  value: string;
  tone: Tone;
  icon: IconName;
  subtitle?: string;
  actionLabel?: string;
}

export interface QueueItem {
  id: string;
  title: string;
  subtitle: string;
  value?: string;
  tone: Tone;
  icon?: IconName;
}

export interface SeriesCard {
  id: string;
  title: string;
  subtitle: string;
  meta: string;
  status: string;
  tone: Tone;
  progress?: string;
  progressValue?: number;
  coverTone: "violet" | "red" | "blue" | "dark" | "warm" | "mono";
  tags?: string[];
}

export interface ActivityItem {
  id: string;
  title: string;
  time: string;
  tone: Tone;
  icon?: IconName;
}

export interface CommentItem {
  id: string;
  title: string;
  body: string;
  owner: string;
  status: string;
  isBlocking?: boolean;
  tone: Tone;
  action: string;
  page: string;
  coverTone: SeriesCard["coverTone"];
}

export type SeriesStatus =
  | "DRAFT"
  | "EDITOR_REVIEW"
  | "REVISION_REQUESTED"
  | "BOARD_REVIEW"
  | "ONGOING"
  | "AT_RISK"
  | "CANCELLED"
  | "COMPLETED"
  | "ARCHIVED"
  | "REJECTED"
  | "WITHDRAWN";

export type TaskStatus =
  | "TODO"
  | "IN_PROGRESS"
  | "SUBMITTED"
  | "REVISION_REQUESTED"
  | "MANGAKA_APPROVED"
  | "REJECTED"
  | "CANCELLED";

export type SubmissionStatus =
  | "PENDING"
  | "MANGAKA_APPROVED"
  | "REVISION_REQUESTED"
  | "SUPERSEDED"
  | "REJECTED";

export type CommentStatus = "OPEN" | "ADDRESSED" | "RESOLVED" | "REOPENED";

export type BoardVoteValue = "APPROVE" | "REJECT";

export type BoardDecisionStatus =
  | "DRAFT"
  | "OPEN"
  | "CLOSED"
  | "TIE_BREAK_REQUIRED"
  | "FINALIZED"
  | "NO_QUORUM"
  | "CANCELLED"
  | "APPROVED"
  | "REJECTED"
  | "PENDING"
  | "NEEDS_REVISION";

export type RankingStatus =
  "DRAFT" | "IMPORTED" | "REVIEWED" | "FINALIZED" | "WARNING" | "AT_RISK";

export type AtRiskDecision =
  "CONTINUE" | "WARNING" | "REQUEST_IMPROVEMENT_PLAN" | "CANCEL";

export type EditorProposalAction =
  "start-review" | "request-revision" | "reject" | "forward-to-board";

export type EditorFinalApprovalAction = "add-comment";

export interface SeriesProposalSummary {
  seriesId: string;
  title: string;
  status: SeriesStatus | string;
  synopsis: string;
  logline: string;
  premise: string;
  characters: string;
  conflict: string;
  targetAudience: string;
  requestedPublicationType: "WEEKLY" | "MONTHLY";
  genres: string[];
  tags: string[];
  currentManuscript?: {
    id: string;
    version: string;
    fileName: string;
    fileType: string;
    fileSize: string;
  };
  boardReview?: {
    status: string;
    result: string;
    voteCount: string;
  };
}

export interface EditorProposalReviewItem extends SeriesCard {
  seriesStatus: SeriesStatus;
  version: string;
  requestedPublicationType: "WEEKLY" | "MONTHLY";
  editorRecommendation: string;
  decisionActions: EditorProposalAction[];
}

export interface EditorSubmissionReviewItem extends SeriesCard {
  seriesId?: string;
  taskId?: string;
  chapterId?: string;
  pageId?: string;
  pageCount?: number;
  chapterStatus?: string;
  taskPriority?: string;
  taskDueDate?: string;
  taskStatus: TaskStatus;
  submissionStatus: SubmissionStatus;
  assistantName: string;
  mangakaNote: string;
  linkedCommentCount: number;
  decisionActions: EditorFinalApprovalAction[];
}

export interface EditorReadinessCheck {
  id: string;
  title: string;
  passed: boolean;
  reason: string;
}

export interface EditorReadinessResult {
  chapterId?: string;
  chapterStatus?: string;
  chapterTitle: string;
  overallPassed: boolean;
  checks: EditorReadinessCheck[];
  source: "PublicationReadinessService";
}

export interface BoardVoteSummary {
  approve: number;
  reject: number;
  pending: number;
  eligible: number;
  quorum?: number;
  canFinalize?: boolean;
}

export interface BoardSeriesReviewItem extends SeriesCard {
  seriesStatus: "BOARD_REVIEW";
  sessionId?: string;
  proposalVersionId?: string;
  decisionStatus: BoardDecisionStatus;
  publicationType: "WEEKLY" | "MONTHLY";
  voteSummary: BoardVoteSummary;
  voteOptions: BoardVoteValue[];
}

export interface BoardRankingItem extends SeriesCard {
  rankingStatus: RankingStatus;
  rank: number;
  previousRank: number;
  voteCount: number;
  readerScore: number;
  finalScore: number;
}

export interface BoardAtRiskCase extends SeriesCard {
  seriesStatus: "AT_RISK";
  rankingStatus: "AT_RISK" | "WARNING";
  availableDecisions: AtRiskDecision[];
  supportNote: string;
  requiresConfirmation: true;
}

export interface BoardDecisionHistoryItem {
  id: string;
  title: string;
  decision: BoardVoteValue | AtRiskDecision;
  status: BoardDecisionStatus | "AT_RISK_ACTION_RECORDED";
  time: string;
  immutable: true;
}
