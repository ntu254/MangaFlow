// Enums
export type UserRole = "ADMIN" | "MANGAKA" | "ASSISTANT" | "EDITOR" | "BOARD";
export type UserStatus = "ACTIVE" | "SUSPENDED";
export type SeriesStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "EDITOR_REVIEW"
  | "REVISION_REQUESTED"
  | "BOARD_REVIEW"
  | "APPROVED"
  | "ONGOING"
  | "AT_RISK"
  | "CANCELLED"
  | "COMPLETED"
  | "REJECTED";
export type ManuscriptStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "EDITOR_REVIEW"
  | "REVISION_REQUESTED"
  | "APPROVED"
  | "REJECTED";
export type ChapterStatus =
  | "DRAFT"
  | "IN_PRODUCTION"
  | "READY_FOR_PUBLICATION"
  | "PUBLISHED";
export type PageStatus = "PENDING" | "UPLOADED" | "PROCESSING" | "READY";
export type TaskStatus =
  | "TODO"
  | "IN_PROGRESS"
  | "SUBMITTED"
  | "REVISION_REQUESTED"
  | "MANGAKA_APPROVED"
  | "EDITOR_APPROVED"
  | "REJECTED";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
export type SubmissionStatus =
  | "PENDING_MANGAKA_REVIEW"
  | "REVISION_REQUESTED"
  | "MANGAKA_APPROVED"
  | "EDITOR_APPROVED"
  | "REJECTED";
export type CommentStatus =
  | "OPEN"
  | "FIXED_BY_ASSISTANT"
  | "VERIFIED_BY_MANGAKA"
  | "RESOLVED_BY_EDITOR";
export type BoardVoteOption = "APPROVE" | "REJECT" | "NEEDS_REVISION";
export type BoardDecisionType =
  | "APPROVED"
  | "REJECTED"
  | "NEEDS_REVISION"
  | "CONTINUE"
  | "WARNING"
  | "REQUEST_IMPROVEMENT_PLAN"
  | "CANCEL";
export type RankingStatus = "NORMAL" | "WARNING" | "AT_RISK";
export type EarningStatus = "PENDING" | "CONFIRMED" | "PAID";
export type PublicationType = "WEEKLY" | "MONTHLY";
export type TaskCurrency = "POINT" | "VND";
export type SeriesMemberRole = "OWNER_MANGAKA" | "CO_MANGAKA" | "ASSISTANT";
export type SeriesMemberStatus = "ACTIVE" | "INACTIVE";
export type SeriesMemberAccessScope = "FULL" | "TASK_ONLY";

// Core Entities
export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}
export interface Series {
  _id: string;
  title: string;
  description: string;
  genre: string[];
  targetAudience: string;
  publicationType: PublicationType;
  tags?: string[];
  coverDraft?: string;
  status: SeriesStatus;
  ownerId: string;
  owner?: User;
  createdAt: string;
  updatedAt: string;
}
export interface SeriesMember {
  _id: string;
  seriesId: string;
  userId: string;
  user?: User;
  role: SeriesMemberRole;
  status: SeriesMemberStatus;
  accessScope: SeriesMemberAccessScope;
  createdAt: string;
}
export interface Manuscript {
  _id: string;
  seriesId: string;
  version: number;
  status: ManuscriptStatus;
  files: FileAsset[];
  editorNote?: string;
  createdAt: string;
  updatedAt: string;
}
export interface Chapter {
  _id: string;
  seriesId: string;
  series?: Series;
  chapterNumber: number;
  title?: string;
  status: ChapterStatus;
  pageCount: number;
  createdAt: string;
  updatedAt: string;
}
export interface Page {
  _id: string;
  chapterId: string;
  pageNumber: number;
  status: PageStatus;
  originalUrl?: string;
  previewUrl?: string;
  thumbnailUrl?: string;
  aiCopyUrl?: string;
  createdAt: string;
}
export interface FileAsset {
  _id: string;
  url: string;
  filename: string;
  mimeType: string;
  size: number;
  createdAt: string;
}
export interface Region {
  _id: string;
  pageId: string;
  label?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  createdAt: string;
}
export interface TaskType {
  _id: string;
  name: string;
  code: string;
  description?: string;
  defaultRate: number;
  currency: TaskCurrency;
  isActive: boolean;
  allowRegionTask: boolean;
  allowPageTask: boolean;
  requiresFileSubmission: boolean;
  requiresTextSubmission: boolean;
  sortOrder?: number;
}
export interface Task {
  _id: string;
  title: string;
  description: string;
  taskTypeId: string;
  taskType?: TaskType;
  seriesId: string;
  chapterId: string;
  pageId: string;
  page?: Page;
  regionId?: string;
  region?: Region;
  assignedTo: string;
  assignedUser?: User;
  assignedBy: string;
  assignedByUser?: User;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string;
  baseRate: number;
  currency: TaskCurrency;
  contextPageIds?: string[];
  referenceFiles?: FileAsset[];
  note?: string;
  revisionRound: number;
  createdAt: string;
  updatedAt: string;
}
export interface Submission {
  _id: string;
  taskId: string;
  assistantId: string;
  assistant?: User;
  status: SubmissionStatus;
  resultFiles?: FileAsset[];
  textContent?: string;
  note?: string;
  version: number;
  createdAt: string;
}
export interface Comment {
  _id: string;
  pageId?: string;
  taskId?: string;
  authorId: string;
  author?: User;
  content: string;
  status: CommentStatus;
  x?: number;
  y?: number;
  createdAt: string;
  updatedAt: string;
}
export interface BoardMember {
  _id: string;
  userId: string;
  user?: User;
  isChair: boolean;
  joinedAt: string;
}
export interface BoardVote {
  _id: string;
  seriesId: string;
  boardMemberId: string;
  boardMember?: BoardMember;
  vote: BoardVoteOption;
  comment?: string;
  createdAt: string;
}
export interface BoardDecision {
  _id: string;
  seriesId: string;
  decision: BoardDecisionType;
  reason?: string;
  decidedBy: string;
  createdAt: string;
}
export interface Ranking {
  _id: string;
  seriesId: string;
  series?: Series;
  period: string;
  voteCount: number;
  readerScore: number;
  normalizedReaderScore: number;
  finalScore: number;
  rank: number;
  previousRank?: number;
  status: RankingStatus;
  createdAt: string;
}
export interface AssistantEarning {
  _id: string;
  taskId: string;
  task?: Task;
  assistantId: string;
  assistant?: User;
  basePayment: number;
  bonusRate: number;
  revisionFee: number;
  finalPayment: number;
  currency: TaskCurrency;
  status: EarningStatus;
  confirmedBy?: string;
  confirmedAt?: string;
  createdAt: string;
}
export interface Notification {
  _id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  link?: string;
  createdAt: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}
export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}
