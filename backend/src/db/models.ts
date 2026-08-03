import mongoose, { Schema } from "mongoose";
import type {
  Role,
  ProposalStatus,
  ChapterStatus,
  PageStatus,
  VoteDecision,
  StudioTaskStatus,
  SubmissionStatus,
  SubmissionReviewStage,
  RankingSource,
  RankingImportStatus,
  NotificationAudienceType,
  NotificationPriority,
  RegionLockStatus,
  CommentTargetType,
  SeriesVisibility,
} from "../types.js";
import { looseSchema } from "./schema.js";
import { PublicationModel } from "./models/publication.model.js";
export type { PublicationRecord } from "./models/publication.model.js";
import { EarningItemModel, EarningModel } from "./models/earning.model.js";
export type {
  EarningItemRecord,
  EarningRecord,
} from "./models/earning.model.js";
import { RateTableModel } from "./models/rate-table.model.js";
export type {
  RateTableRecord,
  RateTableStatus,
} from "./models/rate-table.model.js";

/* ------------------------------------------------------------------ */
/*  User                                                                */
/* ------------------------------------------------------------------ */

export type UserRecord = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  isChair?: boolean;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
};

const userSchema = looseSchema({
  name: { type: String, required: true },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  passwordHash: { type: String, required: true },
  role: {
    type: String,
    required: true,
    enum: ["ADMIN", "MANGAKA", "ASSISTANT", "EDITOR", "BOARD"],
    index: true,
  },
  active: { type: Boolean, default: true, index: true },
  isChair: { type: Boolean, default: false },
});
userSchema.index(
  { isChair: 1 },
  {
    unique: true,
    name: "one_active_board_chair",
    partialFilterExpression: { role: "BOARD", active: true, isChair: true },
  },
);

/* ------------------------------------------------------------------ */
/*  RefreshSession                                                      */
/* ------------------------------------------------------------------ */

export type RefreshSessionRecord = {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  revokedAt?: Date;
  userAgent?: string;
  ip?: string;
};

const refreshSessionSchema = looseSchema({
  userId: { type: String, required: true, index: true },
  tokenHash: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true },
  revokedAt: { type: Date },
  userAgent: { type: String },
  ip: { type: String },
});

/* ------------------------------------------------------------------ */
/*  Audit                                                               */
/* ------------------------------------------------------------------ */

export type AuditEntryRecord = {
  id: string;
  actorId: string;
  actorRole: string;
  action: string;
  entityType: string;
  entityId: string;
  /** State before the action. */
  before?: Record<string, unknown>;
  /** State after the action. */
  after?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  requestId?: string;
  correlationId?: string;
  ip?: string;
  userAgent?: string;
  createdAt: Date;
};

const auditSchema = looseSchema({
  actorId: { type: String, required: true, index: true },
  actorRole: { type: String, required: true },
  action: { type: String, required: true, index: true },
  entityType: { type: String, required: true, index: true },
  entityId: { type: String, required: true, index: true },
  before: { type: Schema.Types.Mixed },
  after: { type: Schema.Types.Mixed },
  metadata: { type: Schema.Types.Mixed },
  requestId: { type: String },
  correlationId: { type: String, index: true },
  ip: { type: String },
  userAgent: { type: String },
  createdAt: { type: Date, default: Date.now, index: true },
});

/* ------------------------------------------------------------------ */
/*  OutboxEvent                                                        */
/* ------------------------------------------------------------------ */

export type OutboxEventRecord = {
  id: string;
  type: string;
  aggregateType: string;
  aggregateId: string;
  payload?: Record<string, unknown>;
  status?: "PENDING" | "PROCESSING" | "SENT" | "FAILED" | "DEAD_LETTER";
  attempts?: number;
  nextAttemptAt?: Date;
  lastError?: string;
  processedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};

const outboxEventSchema = looseSchema({
  type: { type: String, required: true, index: true },
  aggregateType: { type: String, required: true, index: true },
  aggregateId: { type: String, required: true, index: true },
  payload: { type: Schema.Types.Mixed },
  status: {
    type: String,
    enum: ["PENDING", "PROCESSING", "SENT", "FAILED", "DEAD_LETTER"],
    default: "PENDING",
    index: true,
  },
  attempts: { type: Number, default: 0 },
  nextAttemptAt: { type: Date, index: true },
  lastError: { type: String },
  processedAt: { type: Date, index: true },
});
outboxEventSchema.index({ status: 1, nextAttemptAt: 1, createdAt: 1 });

/* ------------------------------------------------------------------ */
/*  Notification                                                        */
/* ------------------------------------------------------------------ */

export type NotificationRecord = {
  id: string;
  userId: string;
  /** @deprecated use audienceType + audienceRole for broadcasts */
  kind: string;
  title: string;
  message: string;
  audienceType?: NotificationAudienceType;
  audienceRole?: string;
  createdById?: string;
  createdByName?: string;
  sentAt?: Date;
  priority?: NotificationPriority;
  actionUrl?: string;
  batchId?: string;
  readAt?: Date;
  createdAt: Date;
};

const notificationSchema = looseSchema({
  userId: { type: String, required: true, index: true },
  kind: { type: String, required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  audienceType: {
    type: String,
    enum: ["USER", "ROLE", "ALL"],
    default: "USER",
  },
  audienceRole: { type: String },
  createdById: { type: String },
  createdByName: { type: String },
  sentAt: { type: Date },
  priority: {
    type: String,
    enum: ["LOW", "NORMAL", "HIGH"],
    default: "NORMAL",
  },
  actionUrl: { type: String },
  batchId: { type: String, index: true },
  readAt: { type: Date },
  createdAt: { type: Date, default: Date.now, index: true },
});

/* ------------------------------------------------------------------ */
/*  Proposal                                                            */
/* ------------------------------------------------------------------ */

export type ProposalVoteEmbedded = {
  /** @deprecated use ProposalVoteModel (proposalvotes collection) as source of truth */
  voterId?: string;
  voterName?: string;
  /** legacy field */
  memberId?: string;
  /** legacy field */
  memberName?: string;
  decision: VoteDecision;
  comment?: string;
  votedAt?: Date;
  createdAt?: Date;
  weight?: number;
  isChair?: boolean;
};

export type ProposalHistoryEntry = {
  id?: string;
  action: string;
  actorId: string;
  actorName: string;
  actorRole?: string;
  type?: string;
  fromStatus?: string;
  toStatus?: string;
  comment?: string;
  timestamp?: Date;
  createdAt?: Date;
  details?: Record<string, unknown>;
};

export type ProposalRecord = {
  id: string;
  slug: string;
  title: string;
  authorId: string;
  authorName: string;
  synopsis: string;
  logline?: string;
  genres?: string[];
  targetAudience?: string;
  requestedPublicationType?: string;
  /** Board's chosen publication cadence at finalize-approve (WEEKLY|MONTHLY). */
  boardApprovedPublicationType?: string;
  chaptersPlanned?: number;
  coverUrl?: string;
  coverFileKey?: string;
  sampleChapterUrl?: string;
  status: ProposalStatus;
  /**
   * @deprecated Denormalized cache only. Source of truth is `proposalvotes` collection.
   */
  votes: ProposalVoteEmbedded[];
  history: ProposalHistoryEntry[];
  manuscripts?: Record<string, unknown>[];
  materials?: Record<string, unknown>[];
  requestedChanges?: Record<string, unknown>[];
  revisionRound?: number;
  assignedEditorId?: string;
  assignedEditorName?: string;
  claimedByEditorId?: string | null;
  claimedByEditorName?: string | null;
  claimedAt?: Date | null;
  reviewStartedAt?: Date | null;
  editorialChecklist?: {
    hook: boolean;
    characterMotivation: boolean;
    audienceFit: boolean;
    storyboardFlow: boolean;
    manuscriptQuality: boolean;
    serializePotential: boolean;
    completedById?: string;
    completedByName?: string;
    updatedAt?: Date;
  };
  editorDecisionNote?: string | null;
  editorForwardedAt?: Date | null;
  /** Set when Mangaka submits */
  submittedAt?: Date;
  /** Set when Board/Editor approves */
  approvedAt?: Date;
  approvedById?: string;
  /** Set when Editor/Admin rejects */
  rejectedAt?: Date;
  rejectedById?: string;
  /** Set when Mangaka withdraws */
  withdrawnAt?: Date;
  withdrawnById?: string;
  /** Soft-delete / archive */
  archivedAt?: Date;
  archivedById?: string;
  archiveReason?: string;
  createdAt: Date;
  updatedAt: Date;
};

const proposalSchema = looseSchema({
  slug: { type: String },
  title: { type: String },
  authorId: { type: String, index: true },
  authorName: { type: String },
  synopsis: { type: String, default: "" },
  logline: { type: String },
  genres: [{ type: String }],
  targetAudience: { type: String },
  requestedPublicationType: { type: String },
  boardApprovedPublicationType: { type: String },
  chaptersPlanned: { type: Number },
  coverUrl: { type: String },
  coverFileKey: { type: String },
  sampleChapterUrl: { type: String },
  status: { type: String, required: true, default: "DRAFT", index: true },
  /** @deprecated — source of truth is proposalvotes collection */
  votes: [Schema.Types.Mixed],
  history: [Schema.Types.Mixed],
  manuscripts: [Schema.Types.Mixed],
  materials: [Schema.Types.Mixed],
  requestedChanges: [Schema.Types.Mixed],
  revisionRound: { type: Number, default: 0 },
  assignedEditorId: { type: String, index: true },
  assignedEditorName: { type: String },
  claimedByEditorId: { type: String, index: true },
  claimedByEditorName: { type: String },
  // Changed from String → Date
  claimedAt: { type: Date },
  reviewStartedAt: { type: Date },
  editorialChecklist: { type: Schema.Types.Mixed },
  editorDecisionNote: { type: String },
  editorForwardedAt: { type: Date },
  // New lifecycle timestamps
  submittedAt: { type: Date },
  approvedAt: { type: Date },
  approvedById: { type: String },
  rejectedAt: { type: Date },
  rejectedById: { type: String },
  withdrawnAt: { type: Date },
  withdrawnById: { type: String },
  archivedAt: { type: Date },
  archivedById: { type: String },
  archiveReason: { type: String },
});

// Compound indexes for common query patterns
proposalSchema.index({ slug: 1 }, { unique: true, sparse: true });
proposalSchema.index({ authorId: 1, status: 1 });
proposalSchema.index({ assignedEditorId: 1, status: 1 });
proposalSchema.index({ claimedByEditorId: 1, status: 1 });
proposalSchema.index({ status: 1, createdAt: -1 });

/* ------------------------------------------------------------------ */
/*  ProposalVote (new collection — source of truth for all votes)      */
/* ------------------------------------------------------------------ */

export type ProposalVoteRecord = {
  id: string;
  sessionId?: string;
  proposalId: string;
  voterId: string;
  voterName: string;
  voterRole: string;
  decision: VoteDecision;
  comment?: string;
  votedAt: Date;
  weight?: number;
  createdAt: Date;
  updatedAt: Date;
};

const proposalVoteSchema = looseSchema({
  sessionId: { type: String, index: true },
  proposalId: { type: String, required: true, index: true },
  voterId: { type: String, required: true, index: true },
  voterName: { type: String, required: true },
  voterRole: { type: String, required: true },
  decision: {
    type: String,
    required: true,
    enum: ["APPROVE", "REJECT"],
  },
  comment: { type: String },
  votedAt: { type: Date, required: true, default: Date.now },
  weight: { type: Number, default: 1 },
});

// Unique: one vote per voter per proposal per session
proposalVoteSchema.index(
  { sessionId: 1, proposalId: 1, voterId: 1 },
  { unique: true, sparse: true },
);
proposalVoteSchema.index({ proposalId: 1, decision: 1 });
proposalVoteSchema.index({ voterId: 1, votedAt: -1 });
proposalVoteSchema.index({ sessionId: 1, proposalId: 1 });

/* ------------------------------------------------------------------ */
/*  Series                                                              */
/* ------------------------------------------------------------------ */

export type SeriesRecord = {
  id: string;
  slug: string;
  title: string;
  synopsis?: string;
  genres?: string[];
  coverUrl?: string;
  coverFileKey?: string;
  status: string;
  publicationType?: "WEEKLY" | "MONTHLY";
  cadence?: string;
  startDate?: string;
  targetChapters?: number;
  authorId: string;
  authorName: string;
  editorId?: string;
  editorName?: string;
  /**
   * @deprecated Denormalized cache. Use `seriesmembers` collection as source of truth.
   */
  assistantIds?: string[];
  proposalId?: string;
  /** Explicit reference to originating proposal */
  sourceProposalId?: string;
  sourceProposalVersionId?: string;
  visibility?: SeriesVisibility;
  publishedAt?: Date;
  archivedAt?: Date;
  archivedById?: string;
  archiveReason?: string;
  deletedAt?: Date;
  deletedById?: string;
  deleteReason?: string;
  createdAt: Date;
  updatedAt: Date;
};

const seriesSchema = looseSchema({
  slug: { type: String },
  title: { type: String },
  synopsis: { type: String },
  genres: [{ type: String }],
  coverUrl: { type: String },
  coverFileKey: { type: String },
  status: { type: String, default: "PLANNING", index: true },
  publicationType: { type: String, enum: ["WEEKLY", "MONTHLY"], index: true },
  cadence: { type: String },
  startDate: { type: String },
  targetChapters: { type: Number },
  authorId: { type: String, required: true, index: true },
  authorName: { type: String },
  editorId: { type: String, index: true },
  editorName: { type: String },
  /** @deprecated use seriesmembers */
  assistantIds: [{ type: String }],
  proposalId: { type: String },
  sourceProposalId: { type: String },
  sourceProposalVersionId: { type: String, index: true },
  visibility: {
    type: String,
    enum: ["PRIVATE", "PUBLIC", "UNLISTED"],
    default: "PRIVATE",
  },
  publishedAt: { type: Date },
  archivedAt: { type: Date },
  archivedById: { type: String },
  archiveReason: { type: String },
  deletedAt: { type: Date },
  deletedById: { type: String },
  deleteReason: { type: String },
});

seriesSchema.index({ slug: 1 }, { unique: true, sparse: true });
seriesSchema.index({ sourceProposalId: 1 }, { unique: true, sparse: true });
seriesSchema.index({ authorId: 1, status: 1 });
seriesSchema.index({ editorId: 1, status: 1 });
seriesSchema.index({ visibility: 1, status: 1 });

/* ------------------------------------------------------------------ */
/*  Chapter                                                             */
/* ------------------------------------------------------------------ */

export type ChapterPage = {
  id: string;
  pageNumber: number;
  index?: number;
  status?: PageStatus;
  imageUrl?: string;
  imageWidth?: number;
  imageHeight?: number;
  fileName?: string;
  fileUrl?: string;
  fileKey?: string;
  mimeType?: string;
  sizeKB?: number;
  uploadedAt?: Date;
  metadata?: Record<string, unknown>;
};

export type ChapterHistoryEntry = {
  id?: string;
  action?: string;
  type?: string;
  actorId: string;
  actorName: string;
  actorRole?: string;
  fromStatus?: string;
  toStatus?: string;
  comment?: string;
  timestamp?: Date;
  createdAt?: Date;
  details?: Record<string, unknown>;
};

export type ChapterRecord = {
  id: string;
  seriesId: string;
  number: number;
  title: string;
  status: ChapterStatus;
  assigneeId?: string;
  assigneeName?: string;
  pages: ChapterPage[];
  reviewNotes?: Record<string, unknown>[];
  revisionRound?: number;
  history: ChapterHistoryEntry[];
  draftDueAt?: Date;
  reviewDueAt?: Date;
  scheduledAt?: Date;
  publishedAt?: Date;
  // New lifecycle fields
  readyForPublicationAt?: Date;
  readyByEditorId?: string;
  scheduledById?: string;
  publishedById?: string;
  createdAt: Date;
  updatedAt: Date;
};

const chapterSchema = looseSchema({
  seriesId: { type: String, required: true, index: true },
  number: { type: Number, required: true },
  title: { type: String },
  status: {
    type: String,
    default: "PLANNED",
    // Canonical chapter statuses only. Legacy values are converted by
    // scripts/migrate-chapter-status-canonical.ts before this enum is enforced.
    enum: [
      "PLANNED",
      "IN_PRODUCTION",
      "TANTOU_REVIEW",
      "REVISION_REQUIRED",
      "READY_FOR_PUBLICATION",
      // Scheduling lives on Publication.status, never on the chapter.
      "PUBLISHED",
    ],
    index: true,
  },
  assigneeId: { type: String, index: true },
  assigneeName: { type: String },
  pages: [Schema.Types.Mixed],
  reviewNotes: [Schema.Types.Mixed],
  revisionRound: { type: Number, default: 0 },
  history: [Schema.Types.Mixed],
  draftDueAt: { type: Date },
  reviewDueAt: { type: Date },
  scheduledAt: { type: Date, index: true },
  publishedAt: { type: Date, index: true },
  readyForPublicationAt: { type: Date },
  readyByEditorId: { type: String },
  scheduledById: { type: String },
  publishedById: { type: String },
});

// Business rule: unique chapter number within a series
chapterSchema.index({ seriesId: 1, number: 1 }, { unique: true });
chapterSchema.index({ seriesId: 1, status: 1 });

/* ------------------------------------------------------------------ */
/*  StudioRegion                                                        */
/* ------------------------------------------------------------------ */

export type StudioRegionRecord = {
  id: string;
  chapterId: string;
  pageId?: string;
  seriesId?: string;
  type?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  label?: string;
  status?: string;
  /** Task currently assigned to this region (persists across lock/unlock; distinct from activeTaskId which tracks locking only) */
  taskId?: string;
  /** Active task that currently owns this region */
  activeTaskId?: string;
  lockedByTaskId?: string;
  lockedAt?: Date;
  lockStatus?: RegionLockStatus;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
};

const studioRegionSchema = looseSchema({
  chapterId: { type: String, required: true, index: true },
  pageId: { type: String, index: true },
  seriesId: { type: String, index: true },
  type: { type: String },
  x: { type: Number },
  y: { type: Number },
  width: { type: Number },
  height: { type: Number },
  label: { type: String },
  status: {
    type: String,
    enum: [
      "DETECTED",
      "CONFIRMED",
      "ASSIGNED",
      "IN_PROGRESS",
      "SUBMITTED",
      "REVISION_REQUIRED",
      "APPROVED",
      "DONE",
      "DISCARDED",
    ],
  },
  taskId: { type: String, index: true },
  activeTaskId: { type: String, index: true },
  lockedByTaskId: { type: String, index: true },
  lockedAt: { type: Date },
  lockStatus: {
    type: String,
    enum: ["UNLOCKED", "LOCKED"],
    default: "UNLOCKED",
  },
  metadata: { type: Schema.Types.Mixed },
});

studioRegionSchema.index({ chapterId: 1, pageId: 1 });
studioRegionSchema.index({ seriesId: 1, status: 1 });

/* ------------------------------------------------------------------ */
/*  StudioTask                                                          */
/* ------------------------------------------------------------------ */

export type StudioTaskRecord = {
  id: string;
  chapterId?: string;
  pageId?: string;
  seriesId?: string;
  /** New task contract: every new assignment targets exactly one page. */
  targetScope?: "PAGE" | "REGION";
  /** True while the page has an active assignment in the new page-level flow. */
  pageTaskActive?: boolean;
  /** @deprecated Regions are annotation/coordinate references, not task units. */
  regionId?: string;
  title?: string;
  description?: string;
  type?: string;
  priority?: string;
  dueAt?: Date;
  assigneeId?: string;
  assigneeName?: string;
  assignmentStatus?: "UNASSIGNED" | "PENDING" | "ACCEPTED" | "REJECTED";
  assignmentAcceptedAt?: Date;
  assignmentAcceptedById?: string;
  assignmentRejectedAt?: Date;
  assignmentRejectedById?: string;
  assignmentRejectedReason?: string;
  reassigned?: boolean;
  reassignedFromId?: string;
  reassignedFromName?: string;
  reassignedToId?: string;
  reassignedToName?: string;
  reassignedAt?: Date;
  reassignmentReason?: string;
  status: StudioTaskStatus;
  currentSubmissionId?: string;
  isRequired?: boolean;
  workUnitType?: string;
  rateCode?: string;
  rateVersion?: number;
  quantity?: number;
  rateSnapshot?: number;
  estimatedAmount?: number;
  currency?: string;
  instructions?: string;
  metadata?: Record<string, unknown>;
  // Lifecycle timestamps
  startedAt?: Date;
  submittedAt?: Date;
  mangakaReviewedAt?: Date;
  mangakaReviewedById?: string;
  editorReviewedAt?: Date;
  editorReviewedById?: string;
  completedAt?: Date;
  cancelledAt?: Date;
  cancelledById?: string;
  cancelReason?: string;
  createdAt: Date;
  updatedAt: Date;
};

const studioTaskSchema = looseSchema({
  chapterId: { type: String, index: true },
  pageId: { type: String },
  seriesId: { type: String, index: true },
  targetScope: { type: String, enum: ["PAGE", "REGION"] },
  pageTaskActive: { type: Boolean, index: true },
  // @deprecated Kept only for reading/migrating legacy region-scoped tasks.
  regionId: { type: String },
  title: { type: String },
  description: { type: String },
  type: { type: String },
  priority: { type: String, default: "normal" },
  dueAt: { type: Date, index: true },
  assigneeId: { type: String, index: true },
  assigneeName: { type: String },
  // Legacy tasks without this field are treated as ACCEPTED by the workflow service.
  assignmentStatus: {
    type: String,
    enum: ["UNASSIGNED", "PENDING", "ACCEPTED", "REJECTED"],
    default: "ACCEPTED",
    index: true,
  },
  assignmentAcceptedAt: { type: Date },
  assignmentAcceptedById: { type: String },
  assignmentRejectedAt: { type: Date },
  assignmentRejectedById: { type: String },
  assignmentRejectedReason: { type: String },
  reassigned: { type: Boolean },
  reassignedFromId: { type: String },
  reassignedFromName: { type: String },
  reassignedToId: { type: String },
  reassignedToName: { type: String },
  reassignedAt: { type: Date },
  reassignmentReason: { type: String },
  status: {
    type: String,
    default: "TODO",
    enum: [
      "TODO",
      "IN_PROGRESS",
      "SUBMITTED",
      "REVISION_REQUESTED",
      "MANGAKA_REVIEWING",
      "MANGAKA_REVISION_REQUESTED",
      "MANGAKA_APPROVED",
      "EDITOR_REVIEWING",
      "EDITOR_REVISION_REQUESTED",
      "EDITOR_APPROVED",
      "REJECTED",
      "CANCELLED",
      // Legacy values kept temporarily for backward compat during migration.
      // New writes must use EDITOR_APPROVED (not COMPLETED) and TODO (not OPEN).
      // @deprecated
      "OPEN",
      "COMPLETED",
      "REVISION_REQUESTED",
    ],
    index: true,
  },
  currentSubmissionId: { type: String, index: true },
  isRequired: { type: Boolean, default: true, index: true },
  workUnitType: { type: String },
  rateCode: { type: String, uppercase: true, index: true },
  rateVersion: { type: Number },
  quantity: { type: Number },
  rateSnapshot: { type: Number },
  estimatedAmount: { type: Number },
  currency: { type: String, default: "VND" },
  instructions: { type: String },
  metadata: { type: Schema.Types.Mixed },
  startedAt: { type: Date },
  submittedAt: { type: Date },
  mangakaReviewedAt: { type: Date },
  mangakaReviewedById: { type: String },
  editorReviewedAt: { type: Date },
  editorReviewedById: { type: String },
  completedAt: { type: Date },
  cancelledAt: { type: Date },
  cancelledById: { type: String },
  cancelReason: { type: String },
});

studioTaskSchema.index({ assigneeId: 1, assignmentStatus: 1, status: 1 });
studioTaskSchema.index({ chapterId: 1, status: 1 });
studioTaskSchema.index({ regionId: 1, status: 1 });
studioTaskSchema.index(
  { pageId: 1 },
  {
    unique: true,
    name: "studio_task_one_active_page_assignment",
    partialFilterExpression: { pageTaskActive: true, pageId: { $exists: true } },
  },
);
studioTaskSchema.index({ priority: 1, status: 1 });
studioTaskSchema.index({ chapterId: 1, isRequired: 1, status: 1 });

/* ------------------------------------------------------------------ */
/*  StudioComment                                                       */
/* ------------------------------------------------------------------ */

export type StudioCommentRecord = {
  id: string;
  seriesId?: string;
  chapterId?: string;
  pageId?: string;
  regionId?: string;
  taskId?: string;
  /** Structured target reference */
  targetType?: CommentTargetType;
  targetId?: string;
  targetVersionId?: string;
  parentCommentId?: string;
  authorId: string;
  authorName: string;
  authorRole?: string;
  /** Primary content field */
  body?: string;
  /** @deprecated use body */
  text?: string;
  status?: string;
  /** Primary blocking flag */
  isBlocking?: boolean;
  createdAt: Date;
  updatedAt: Date;
};

const studioCommentSchema = looseSchema({
  seriesId: { type: String, index: true },
  chapterId: { type: String, index: true },
  pageId: { type: String },
  regionId: { type: String },
  taskId: { type: String, index: true },
  targetType: {
    type: String,
    enum: ["CHAPTER", "PAGE", "REGION", "TASK", "SUBMISSION"],
  },
  targetId: { type: String },
  targetVersionId: { type: String },
  parentCommentId: { type: String, index: true },
  authorId: { type: String, required: true, index: true },
  authorName: { type: String, required: true },
  authorRole: { type: String, index: true },
  /** Primary field */
  body: { type: String },
  /** @deprecated map to body */
  text: { type: String },
  status: {
    type: String,
    default: "OPEN",
    enum: ["OPEN", "ADDRESSED", "RESOLVED", "REOPENED"],
  },
  /** Primary field */
  isBlocking: { type: Boolean, default: false },
});

studioCommentSchema.index({ targetType: 1, targetId: 1 });

/* ------------------------------------------------------------------ */
/*  Submission                                                          */
/* ------------------------------------------------------------------ */

export type SubmissionRecord = {
  id: string;
  taskId?: string;
  chapterId?: string;
  assistantId?: string;
  assistantName?: string;
  submittedBy?: Record<string, unknown>;
  submittedAt?: Date;
  version?: number;
  submissionVersion?: number;
  versionLabel?: string;
  idempotencyKey?: string;
  requestFingerprint?: string;
  seriesId?: string;
  pageId?: string;
  pageVersionId?: string;
  regionId?: string;
  status: SubmissionStatus;
  reviewStage?: SubmissionReviewStage;
  reviewRound?: number;
  // Mangaka review
  mangakaDecision?: string;
  mangakaNote?: string;
  mangakaReviewedById?: string;
  mangakaReviewedAt?: Date;
  // Editor review
  editorDecision?: string;
  editorNote?: string;
  editorReviewedById?: string;
  editorReviewedAt?: Date;
  // Legacy single-reviewer fields (kept for backward compat)
  resultText?: string;
  imageUrl?: string;
  fileKey?: string;
  fileName?: string;
  fileUrl?: string;
  fileSizeKB?: number;
  mimeType?: string;
  /** @deprecated use editorNote / mangakaNote */
  reviewerNote?: string;
  /** @deprecated use editorReviewedById / mangakaReviewedById */
  reviewedById?: string;
  /** @deprecated use editorReviewedAt / mangakaReviewedAt */
  reviewedAt?: Date;
  /** @deprecated use editorReviewedById */
  reviewedByName?: string;
  createdAt: Date;
  updatedAt: Date;
};

const submissionSchema = looseSchema({
  taskId: { type: String, index: true },
  chapterId: { type: String, index: true },
  assistantId: { type: String, index: true },
  assistantName: { type: String },
  submittedBy: { type: Schema.Types.Mixed },
  submittedAt: { type: Date, index: true },
  version: { type: Number, default: 1 },
  submissionVersion: { type: Number },
  versionLabel: { type: String },
  idempotencyKey: { type: String },
  requestFingerprint: { type: String },
  seriesId: { type: String, index: true },
  pageId: { type: String, index: true },
  pageVersionId: { type: String },
  regionId: { type: String, index: true },
  status: {
    type: String,
    default: "PENDING",
    enum: [
      "PENDING",
      "SUBMITTED",
      "MANGAKA_APPROVED",
      "REVISION_REQUESTED",
      "MANGAKA_REVISION_REQUESTED",
      "EDITOR_APPROVED",
      "EDITOR_REVISION_REQUESTED",
      "REJECTED",
      "SUPERSEDED",
      // Legacy — kept during migration
      "APPROVED",
      "REVISION_REQUESTED",
    ],
    index: true,
  },
  reviewStage: {
    type: String,
    enum: ["MANGAKA_REVIEW", "EDITOR_REVIEW", "FINAL"],
    default: "MANGAKA_REVIEW",
  },
  reviewRound: { type: Number, default: 0 },
  mangakaDecision: { type: String },
  mangakaNote: { type: String },
  mangakaReviewedById: { type: String },
  mangakaReviewedAt: { type: Date },
  editorDecision: { type: String },
  editorNote: { type: String },
  editorReviewedById: { type: String },
  editorReviewedAt: { type: Date },
  resultText: { type: String },
  imageUrl: { type: String },
  fileKey: { type: String },
  fileName: { type: String },
  fileUrl: { type: String },
  fileSizeKB: { type: Number },
  mimeType: { type: String },
  /** @deprecated */
  reviewerNote: { type: String },
  /** @deprecated */
  reviewedById: { type: String },
  /** @deprecated */
  reviewedByName: { type: String },
  /** @deprecated */
  reviewedAt: { type: Date },
});

submissionSchema.index(
  { taskId: 1, version: 1 },
  { unique: true, sparse: true },
);
submissionSchema.index(
  { taskId: 1, submissionVersion: 1 },
  { unique: true, sparse: true },
);
submissionSchema.index(
  { taskId: 1, idempotencyKey: 1 },
  {
    unique: true,
    partialFilterExpression: { idempotencyKey: { $type: "string" } },
  },
);
submissionSchema.index({ taskId: 1, status: 1 });
submissionSchema.index({ assistantId: 1, submittedAt: -1 });

/* ------------------------------------------------------------------ */
/*  Material                                                            */
/* ------------------------------------------------------------------ */

export type MaterialVersion = {
  id: string;
  version: number;
  fileKey: string;
  url: string;
  thumbnailUrl?: string;
  mimeType?: string;
  size?: number;
  note?: string;
  metadata?: Record<string, unknown>;
  uploadedById: string;
  uploadedByName: string;
  uploadedAt: Date;
};

export type MaterialRecord = {
  id: string;
  seriesId?: string;
  chapterId?: string;
  pageId?: string;
  proposalId?: string;
  /** Structured scope of ownership */
  scope?: "PROPOSAL" | "SERIES" | "CHAPTER" | "PAGE";
  ownerType?: string;
  ownerId?: string;
  title: string;
  /** Source of truth for material kind */
  kind?: string;
  /** @deprecated use kind */
  type?: string;
  category?: string;
  description?: string;
  tags?: string[];
  fileKey?: string;
  url?: string;
  thumbnailUrl?: string;
  mimeType?: string;
  metadata?: Record<string, unknown>;
  currentVersion?: number;
  versions: MaterialVersion[];
  createdAt: Date;
  updatedAt: Date;
};

const materialSchema = looseSchema({
  seriesId: { type: String, index: true },
  chapterId: { type: String, index: true },
  pageId: { type: String },
  proposalId: { type: String, index: true },
  scope: { type: String, enum: ["PROPOSAL", "SERIES", "CHAPTER", "PAGE"] },
  ownerType: { type: String },
  ownerId: { type: String },
  title: { type: String },
  /** Source of truth */
  kind: { type: String },
  /** @deprecated use kind */
  type: { type: String },
  category: { type: String },
  description: { type: String },
  tags: [{ type: String }],
  fileKey: { type: String },
  url: { type: String },
  thumbnailUrl: { type: String },
  mimeType: { type: String },
  metadata: { type: Schema.Types.Mixed },
  currentVersion: { type: Number, default: 1 },
  versions: [Schema.Types.Mixed],
});

/* ------------------------------------------------------------------ */
/*  VotingSession                                                       */
/* ------------------------------------------------------------------ */

export type VotingSessionRecord = {
  id: string;
  title: string;
  mode?: string;
  status:
    | "DRAFT"
    | "OPEN"
    | "TIED"
    | "FINALIZED"
    | "NO_QUORUM"
    | "CANCELLED"
    | "TIE_BREAK_REQUIRED";
  version?: number;
  result?: "APPROVED" | "REJECTED" | null;
  targetType?: "PROPOSAL";
  proposalId?: string;
  proposalVersionId?: string;
  reVoteOfSessionId?: string;
  proposalIds: string[];
  eligibleVoterIds?: string[];
  quorum?: number;
  chairId?: string;
  tieBreakerId?: string;
  finalizedById?: string;
  finalizedAt?: Date;
  rules?: {
    approveThreshold?: number;
    rejectThreshold?: number;
  };
  createdById: string;
  createdByName: string;
  openedAt?: Date;
  scheduledFor?: Date;
  closesAt?: Date;
  closedAt?: Date;
  cancelledAt?: Date;
  outcomes?: {
    proposalId: string;
    decision?: string;
    approveCount?: number;
    rejectCount?: number;
    finalReason?: string;
  }[];
  notes?: Record<string, unknown>[];
  createdAt: Date;
  updatedAt: Date;
};

const votingSessionSchema = looseSchema({
  title: { type: String, required: true },
  mode: { type: String },
  status: { type: String, default: "DRAFT", index: true },
  version: { type: Number, default: 1 },
  result: {
    type: String,
    enum: ["APPROVED", "REJECTED", null],
    default: null,
    index: true,
  },
  targetType: {
    type: String,
    enum: ["PROPOSAL"],
    default: "PROPOSAL",
    index: true,
  },
  proposalId: { type: String, index: true },
  proposalVersionId: { type: String, index: true },
  reVoteOfSessionId: { type: String },
  proposalIds: [{ type: String }],
  eligibleVoterIds: [{ type: String }],
  quorum: { type: Number, min: 1 },
  chairId: { type: String },
  tieBreakerId: { type: String },
  finalizedById: { type: String },
  finalizedAt: { type: Date },
  rules: {
    approveThreshold: { type: Number },
    rejectThreshold: { type: Number },
  },
  createdById: { type: String, required: true, index: true },
  createdByName: { type: String },
  openedAt: { type: Date },
  scheduledFor: { type: Date },
  closesAt: { type: Date },
  closedAt: { type: Date },
  cancelledAt: { type: Date },
  outcomes: [Schema.Types.Mixed],
  notes: [Schema.Types.Mixed],
});
votingSessionSchema.index({ targetType: 1, proposalId: 1, status: 1 });
votingSessionSchema.index({ proposalId: 1, proposalVersionId: 1 });
votingSessionSchema.index({ proposalId: 1, reVoteOfSessionId: 1 });
votingSessionSchema.index(
  { targetType: 1, proposalId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      targetType: "PROPOSAL",
      proposalId: { $type: "string" },
      status: { $in: ["DRAFT", "OPEN", "TIE_BREAK_REQUIRED"] },
    },
  },
);

/* ------------------------------------------------------------------ */
/*  BoardDecision                                                       */
/* ------------------------------------------------------------------ */

export type BoardDecisionRecord = {
  id: string;
  votingSessionId: string;
  proposalId: string;
  proposalVersionId: string;
  result: "APPROVED" | "REJECTED";
  eligibleVoterSnapshot?: string[];
  quorumSnapshot?: number;
  tallySnapshot?: Record<string, unknown>;
  decidedBy?: Record<string, unknown>;
  decidedAt: Date;
  publicationCadence?: string;
  reason?: string;
  createdAt: Date;
  updatedAt: Date;
};

const boardDecisionSchema = looseSchema({
  votingSessionId: { type: String, required: true, unique: true, index: true },
  proposalId: { type: String, required: true, index: true },
  proposalVersionId: { type: String, required: true, index: true },
  result: {
    type: String,
    required: true,
    enum: ["APPROVED", "REJECTED"],
    index: true,
  },
  eligibleVoterSnapshot: [{ type: String }],
  quorumSnapshot: { type: Number },
  tallySnapshot: { type: Schema.Types.Mixed },
  decidedBy: { type: Schema.Types.Mixed },
  decidedAt: { type: Date, required: true, index: true },
  publicationCadence: { type: String },
  reason: { type: String },
});

/* ------------------------------------------------------------------ */
/*  ProposalVersion                                                     */
/* ------------------------------------------------------------------ */

export type ProposalVersionRecord = {
  id: string;
  proposalId: string;
  proposalVersionId: string;
  versionNumber?: number;
  status: "DRAFT" | "FROZEN" | "SUPERSEDED";
  source: "PROPOSAL" | "VOTING_SESSION" | "MIGRATION";
  snapshot: Record<string, unknown>;
  frozenById?: string;
  frozenAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};

const proposalVersionSchema = looseSchema({
  proposalId: { type: String, required: true, index: true },
  proposalVersionId: { type: String, required: true, index: true },
  versionNumber: { type: Number },
  status: {
    type: String,
    enum: ["DRAFT", "FROZEN", "SUPERSEDED"],
    default: "FROZEN",
    index: true,
  },
  source: {
    type: String,
    enum: ["PROPOSAL", "VOTING_SESSION", "MIGRATION"],
    default: "PROPOSAL",
    index: true,
  },
  snapshot: { type: Schema.Types.Mixed },
  frozenById: { type: String },
  frozenAt: { type: Date },
});
proposalVersionSchema.index(
  { proposalId: 1, proposalVersionId: 1 },
  { unique: true },
);

/* ------------------------------------------------------------------ */
/*  ChapterReview                                                       */
/* ------------------------------------------------------------------ */

export type ChapterReviewRecord = {
  id: string;
  chapterId: string;
  seriesId: string;
  chapterVersionId: string;
  pageVersionIds: { pageId: string; pageVersionId: string }[];
  status:
    | "OPEN"
    | "APPROVED"
    | "REVISION_REQUESTED"
    | "REJECTED"
    | "STALE"
    | "INVALIDATED";
  createdById: string;
  createdAt: Date;
  decidedById?: string;
  decidedAt?: Date;
  decisionAction?: string;
  snapshot: Record<string, unknown>;
  updatedAt: Date;
};

const chapterReviewSchema = looseSchema({
  chapterId: { type: String, required: true, index: true },
  seriesId: { type: String, required: true, index: true },
  chapterVersionId: { type: String, required: true, index: true },
  pageVersionIds: [Schema.Types.Mixed],
  status: {
    type: String,
    enum: [
      "OPEN",
      "APPROVED",
      "REVISION_REQUESTED",
      "REJECTED",
      "STALE",
      "INVALIDATED",
    ],
    default: "OPEN",
    index: true,
  },
  createdById: { type: String, required: true, index: true },
  decidedById: { type: String },
  decidedAt: { type: Date },
  decisionAction: { type: String },
  snapshot: { type: Schema.Types.Mixed },
});
chapterReviewSchema.index(
  { chapterId: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: { status: "OPEN" },
  },
);

/* ------------------------------------------------------------------ */
/*  Ranking                                                             */
/* ------------------------------------------------------------------ */

export type RankingRecord = {
  id: string;
  seriesId: string;
  seriesTitle: string;
  period: string;
  readerScore?: number;
  voteCount?: number;
  finalScore?: number;
  rank?: number;
  previousRank?: number;
  movement?: number;
  status?: string;
  atRisk?: boolean;
  source?: RankingSource;
  importBatchId?: string;
  importedById?: string;
  importedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};

const rankingSchema = looseSchema({
  seriesId: { type: String, required: true, index: true },
  seriesTitle: { type: String },
  period: { type: String, required: true, index: true },
  readerScore: { type: Number },
  voteCount: { type: Number },
  finalScore: { type: Number },
  rank: { type: Number },
  previousRank: { type: Number },
  movement: { type: Number },
  status: { type: String, default: "DRAFT" },
  atRisk: { type: Boolean, default: false },
  source: {
    type: String,
    enum: ["MANUAL", "CSV_IMPORT", "API"],
    default: "MANUAL",
  },
  importBatchId: { type: String, index: true },
  importedById: { type: String },
  importedAt: { type: Date },
});

rankingSchema.index({ period: 1, seriesId: 1 }, { unique: true });
rankingSchema.index({ period: 1, rank: 1 });

/* ------------------------------------------------------------------ */
/*  RankingImport (new collection)                                      */
/* ------------------------------------------------------------------ */

export type RankingImportRecord = {
  id: string;
  period: string;
  sourceFileKey?: string;
  sourceFileName?: string;
  importedById: string;
  importedByName: string;
  status: RankingImportStatus;
  totalRows?: number;
  successRows?: number;
  failedRows?: number;
  errors?: Record<string, unknown>[];
  importedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};

const rankingImportSchema = looseSchema({
  period: { type: String, required: true, index: true },
  sourceFileKey: { type: String },
  sourceFileName: { type: String },
  importedById: { type: String, required: true, index: true },
  importedByName: { type: String },
  status: {
    type: String,
    required: true,
    enum: ["PENDING", "VALIDATED", "IMPORTED", "FAILED"],
    default: "PENDING",
    index: true,
  },
  totalRows: { type: Number },
  successRows: { type: Number },
  failedRows: { type: Number },
  errors: [Schema.Types.Mixed],
  importedAt: { type: Date },
});

rankingImportSchema.index({ period: 1, status: 1 });
rankingImportSchema.index({ importedById: 1, createdAt: -1 });

/*  AiProcessing                                                        */
/* ------------------------------------------------------------------ */

export type AiProcessingRecord = {
  id: string;
  action: string;
  actorId: string;
  fileName: string;
  mimeType: string;
  size: number;
  upstreamStatus: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
};

const aiProcessingSchema = looseSchema({
  action: { type: String, required: true, index: true },
  actorId: { type: String, required: true, index: true },
  fileName: { type: String },
  mimeType: { type: String },
  size: { type: Number },
  upstreamStatus: { type: String },
  metadata: { type: Schema.Types.Mixed },
});

/* ------------------------------------------------------------------ */
/*  SeriesMember                                                        */
/* ------------------------------------------------------------------ */

export type SeriesMemberRecord = {
  id: string;
  seriesId: string;
  userId: string;
  role: string;
  scope?: string;
  status: string;
  assignedChapterIds?: string[];
  assignedTaskIds?: string[];
  createdAt: Date;
  updatedAt: Date;
};

const seriesMemberSchema = looseSchema({
  seriesId: { type: String, required: true, index: true },
  userId: { type: String, required: true, index: true },
  role: { type: String, required: true },
  scope: { type: String },
  status: { type: String, default: "active", index: true },
  assignedChapterIds: [{ type: String }],
  assignedTaskIds: [{ type: String }],
});

// Unique membership per series per user per role
seriesMemberSchema.index({ seriesId: 1, userId: 1, role: 1 }, { unique: true });
// Tantou is a single active assignment per Series. Keep the invariant in the
// database as well as in the service so concurrent assignments cannot create
// two active Editors.
seriesMemberSchema.index(
  { seriesId: 1, role: 1, status: 1 },
  {
    unique: true,
    name: "one_active_tantou_per_series",
    partialFilterExpression: { role: "editor", status: "active" },
  },
);

/* ------------------------------------------------------------------ */
/*  SeriesInvite                                                       */
/* ------------------------------------------------------------------ */

const seriesInviteSchema = looseSchema({
  seriesId: { type: String, required: true, index: true },
  userId: { type: String, required: true, index: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  role: { type: String, enum: ["assistant"], default: "assistant" },
  scope: { type: String, default: "Full chapter" },
  invitedById: { type: String, required: true },
  status: {
    type: String,
    enum: ["PENDING", "ACCEPTED", "DECLINED", "REVOKED", "EXPIRED"],
    default: "PENDING",
    index: true,
  },
  acceptedAt: { type: Date },
  declinedAt: { type: Date },
  expiresAt: { type: Date },
});
seriesInviteSchema.index({ seriesId: 1, userId: 1, status: 1 });

/* ------------------------------------------------------------------ */
/*  Model exports                                                       */
/* ------------------------------------------------------------------ */

export const UserModel = mongoose.model<any>("User", userSchema);
export const RefreshSessionModel = mongoose.model<any>(
  "RefreshSession",
  refreshSessionSchema,
);
export const ProposalModel = mongoose.model<any>("Proposal", proposalSchema);
export const ProposalVoteModel = mongoose.model<any>(
  "ProposalVote",
  proposalVoteSchema,
);
export const SeriesModel = mongoose.model<any>("Series", seriesSchema);
export const ChapterModel = mongoose.model<any>("Chapter", chapterSchema);
export { PublicationModel };
export const StudioRegionModel = mongoose.model<any>(
  "StudioRegion",
  studioRegionSchema,
);
export const StudioTaskModel = mongoose.model<any>(
  "StudioTask",
  studioTaskSchema,
);
export const StudioCommentModel = mongoose.model<any>(
  "StudioComment",
  studioCommentSchema,
);
export const SubmissionModel = mongoose.model<any>(
  "Submission",
  submissionSchema,
);
export const MaterialModel = mongoose.model<any>("Material", materialSchema);
export const VotingSessionModel = mongoose.model<any>(
  "VotingSession",
  votingSessionSchema,
);
export const BoardDecisionModel = mongoose.model<any>(
  "BoardDecision",
  boardDecisionSchema,
);
export const ProposalVersionModel = mongoose.model<any>(
  "ProposalVersion",
  proposalVersionSchema,
);
export const ChapterReviewModel = mongoose.model<any>(
  "ChapterReview",
  chapterReviewSchema,
);
export const NotificationModel = mongoose.model<any>(
  "Notification",
  notificationSchema,
);
export const AuditEntryModel = mongoose.model<any>("AuditEntry", auditSchema);
export const OutboxEventModel = mongoose.model<any>(
  "OutboxEvent",
  outboxEventSchema,
);
export const RankingModel = mongoose.model<any>("Ranking", rankingSchema);
export const RankingImportModel = mongoose.model<any>(
  "RankingImport",
  rankingImportSchema,
);
export { EarningItemModel, EarningModel };
export { RateTableModel };
export const AiProcessingModel = mongoose.model<any>(
  "AiProcessing",
  aiProcessingSchema,
);
export const SeriesMemberModel = mongoose.model<any>(
  "SeriesMember",
  seriesMemberSchema,
);
export const SeriesInviteModel = mongoose.model<any>(
  "SeriesInvite",
  seriesInviteSchema,
);

export const allMutableModels = [
  UserModel,
  RefreshSessionModel,
  ProposalModel,
  ProposalVoteModel,
  SeriesModel,
  ChapterModel,
  PublicationModel,
  StudioRegionModel,
  StudioTaskModel,
  StudioCommentModel,
  SubmissionModel,
  MaterialModel,
  VotingSessionModel,
  BoardDecisionModel,
  ProposalVersionModel,
  ChapterReviewModel,
  NotificationModel,
  AuditEntryModel,
  OutboxEventModel,
  RankingModel,
  RankingImportModel,
  EarningModel,
  EarningItemModel,
  RateTableModel,
  AiProcessingModel,
  SeriesMemberModel,
  SeriesInviteModel,
] as const;

export function stripMongo<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
