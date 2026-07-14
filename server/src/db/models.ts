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
  EarningStatus,
  EarningItemStatus,
  PublicationStatus,
  RankingSource,
  RankingImportStatus,
  NotificationAudienceType,
  NotificationPriority,
  RegionLockStatus,
  CommentTargetType,
  SeriesVisibility,
} from "../types.js";

/* ------------------------------------------------------------------ */
/*  Base helpers                                                        */
/* ------------------------------------------------------------------ */

const looseOptions = {
  strict: false,
  minimize: false,
  timestamps: true,
  versionKey: false,
  suppressReservedKeysWarning: true,
  toJSON: {
    transform: (_doc: unknown, ret: Record<string, unknown>) => {
      delete ret._id;
      return ret;
    },
  },
} as const;

function looseSchema(extra: Record<string, unknown> = {}) {
  return new Schema(
    {
      id: { type: String, required: true, unique: true, index: true },
      ...extra,
    },
    looseOptions,
  ) as Schema<any>;
}

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
  isEditorInChief?: boolean;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
};

const userSchema = looseSchema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role: {
    type: String,
    required: true,
    enum: ["ADMIN", "MANGAKA", "ASSISTANT", "EDITOR", "BOARD"],
    index: true,
  },
  active: { type: Boolean, default: true, index: true },
  isChair: { type: Boolean, default: false },
  isEditorInChief: { type: Boolean, default: false },
});

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
  archivedAt?: Date;
  createdAt: Date;
};

const notificationSchema = looseSchema({
  userId: { type: String, required: true, index: true },
  kind: { type: String, required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  audienceType: { type: String, enum: ["USER", "ROLE", "ALL"], default: "USER" },
  audienceRole: { type: String },
  createdById: { type: String },
  createdByName: { type: String },
  sentAt: { type: Date },
  priority: { type: String, enum: ["LOW", "NORMAL", "HIGH"], default: "NORMAL" },
  actionUrl: { type: String },
  batchId: { type: String, index: true },
  readAt: { type: Date },
  archivedAt: { type: Date },
  createdAt: { type: Date, default: Date.now, index: true },
});

/* ------------------------------------------------------------------ */
/*  Proposal                                                            */
/* ------------------------------------------------------------------ */

export type ProposalVoteEmbedded = {
  /** @deprecated use ProposalVoteModel (proposalvotes collection) as source of truth */
  voterId?: string;
  voterName?: string;
  /** @deprecated use voterId */
  memberId?: string;
  /** @deprecated use voterName */
  memberName?: string;
  decision: VoteDecision;
  comment?: string;
  votedAt?: Date;
  createdAt?: Date;
  weight?: number;
  isChair?: boolean;
  isEditorInChief?: boolean;
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
  decision: { type: String, required: true, enum: ["APPROVE", "REJECT", "ABSTAIN"] },
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
seriesSchema.index({ proposalId: 1 }, { unique: true, sparse: true });
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
  archivedAt?: Date;
  archivedById?: string;
  archiveReason?: string;
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
    enum: [
      "IN_PRODUCTION",
      "PLANNED",
      "DRAFTING",
      "ASSISTANT_WORKING",
      "MANGAKA_REVIEW",
      "EDITOR_REVIEW",
      "REVISION",
      "EDITOR_APPROVED",
      "READY_FOR_PUBLICATION",
      "SCHEDULED",
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
  archivedAt: { type: Date },
  archivedById: { type: String },
  archiveReason: { type: String },
});

// Business rule: unique chapter number within a series
chapterSchema.index({ seriesId: 1, number: 1 }, { unique: true });
chapterSchema.index({ seriesId: 1, status: 1 });

/* ------------------------------------------------------------------ */
/*  Publication                                                        */
/* ------------------------------------------------------------------ */

export type PublicationRecord = {
  id: string;
  seriesId: string;
  chapterId: string;
  status: PublicationStatus;
  scheduledAt?: Date;
  publishedAt?: Date;
  scheduledById?: string;
  publishedById?: string;
  createdAt: Date;
  updatedAt: Date;
};

const publicationSchema = looseSchema({
  seriesId: { type: String, required: true, index: true },
  chapterId: { type: String, required: true, unique: true, index: true },
  status: {
    type: String,
    required: true,
    enum: ["DRAFT", "SCHEDULED", "PUBLISHED", "CANCELLED"],
    default: "DRAFT",
    index: true,
  },
  scheduledAt: { type: Date, index: true },
  publishedAt: { type: Date, index: true },
  scheduledById: { type: String },
  publishedById: { type: String },
});

publicationSchema.index({ status: 1, scheduledAt: 1 });
publicationSchema.index({ seriesId: 1, status: 1 });

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
  status: { type: String },
  activeTaskId: { type: String, index: true },
  lockedByTaskId: { type: String, index: true },
  lockedAt: { type: Date },
  lockStatus: {
    type: String,
    enum: ["UNLOCKED", "LOCKED", "RELEASED"],
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
  regionId?: string;
  title?: string;
  description?: string;
  type?: string;
  priority?: string;
  dueAt?: Date;
  assigneeId?: string;
  assigneeName?: string;
  status: StudioTaskStatus;
  blocked?: boolean;
  blockedReason?: string;
  blockedBy?: string;
  instructions?: string;
  referenceFiles?: Record<string, unknown>[];
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
  regionId: { type: String },
  title: { type: String },
  description: { type: String },
  type: { type: String },
  priority: { type: String, default: "normal" },
  dueAt: { type: Date, index: true },
  assigneeId: { type: String, index: true },
  assigneeName: { type: String },
  status: {
    type: String,
    default: "TODO",
    enum: [
      "TODO",
      "IN_PROGRESS",
      "SUBMITTED",
      "MANGAKA_REVIEWING",
      "MANGAKA_REVISION_REQUESTED",
      "MANGAKA_APPROVED",
      "EDITOR_REVIEWING",
      "EDITOR_REVISION_REQUESTED",
      "EDITOR_APPROVED",
      "REJECTED",
      "CANCELLED",
    ],
    index: true,
  },
  blocked: { type: Boolean, default: false },
  blockedReason: { type: String },
  blockedBy: { type: String },
  instructions: { type: String },
  referenceFiles: [Schema.Types.Mixed],
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

studioTaskSchema.index({ assigneeId: 1, status: 1 });
studioTaskSchema.index({ chapterId: 1, status: 1 });
studioTaskSchema.index({ regionId: 1, status: 1 });
studioTaskSchema.index({ priority: 1, status: 1 });

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
  authorId: string;
  authorName: string;
  /** Primary content field */
  body?: string;
  /** @deprecated use body */
  text?: string;
  status?: string;
  /** Primary blocking flag */
  isBlocking?: boolean;
  /** @deprecated use isBlocking */
  blocking?: boolean;
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
  authorId: { type: String, required: true, index: true },
  authorName: { type: String, required: true },
  /** Primary field */
  body: { type: String },
  /** @deprecated map to body */
  text: { type: String },
  status: { type: String, default: "OPEN", enum: ["OPEN", "FIXED", "RESOLVED"] },
  /** Primary field */
  isBlocking: { type: Boolean, default: false },
  /** @deprecated map to isBlocking */
  blocking: { type: Boolean, default: false },
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
  versionLabel?: string;
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
  // Denormalized reviewer snapshot fields retained for existing review screens.
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
  versionLabel: { type: String },
  status: {
    type: String,
    default: "PENDING",
    enum: [
      "DRAFT",
      "PENDING",
      "SUBMITTED",
      "MANGAKA_APPROVED",
      "MANGAKA_REVISION_REQUESTED",
      "EDITOR_APPROVED",
      "EDITOR_REVISION_REQUESTED",
      "REJECTED",
      "SUPERSEDED",
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

submissionSchema.index({ taskId: 1, version: 1 }, { unique: true, sparse: true });
submissionSchema.index({ taskId: 1, status: 1 });
submissionSchema.index({ assistantId: 1, submittedAt: -1 });

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
  source: { type: String, enum: ["MANUAL", "CSV_IMPORT", "API"], default: "MANUAL" },
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

// ------------------------------------------------------------------
// At-risk report
// ------------------------------------------------------------------

const atRiskReportSchema = looseSchema({
  seriesId: { type: String, required: true, index: true },
  editorId: { type: String, required: true, index: true },
  editorName: { type: String },
  rankingSummary: { type: String, required: true },
  recommendation: { type: String, required: true },
  notes: { type: String },
  status: { type: String, enum: ["SUBMITTED"], default: "SUBMITTED", index: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});
atRiskReportSchema.index({ seriesId: 1, status: 1, createdAt: -1 });

/* ------------------------------------------------------------------ */
/*  Earning                                                             */
/* ------------------------------------------------------------------ */

export type EarningRecord = {
  id: string;
  assistantId: string;
  period: string;
  subtotal?: number;
  amount: number;
  currency: string;
  status: EarningStatus;
  createdAt: Date;
  updatedAt: Date;
};

const earningSchema = looseSchema({
  assistantId: { type: String, required: true, index: true },
  period: { type: String, required: true, index: true },
  tasksCount: { type: Number, default: 0 },
  subtotal: { type: Number, default: 0 },
  amount: { type: Number, required: true, default: 0 },
  currency: { type: String, default: "VND" },
  status: {
    type: String,
    required: true,
    enum: ["PENDING"],
    default: "PENDING",
    index: true,
  },
});

earningSchema.index({ assistantId: 1, period: 1 }, { unique: true });

/* ------------------------------------------------------------------ */
/*  EarningItem (new collection — traces earnings back to tasks)        */
/* ------------------------------------------------------------------ */

export type EarningItemRecord = {
  id: string;
  earningId: string;
  assistantId: string;
  taskId?: string;
  submissionId?: string;
  seriesId?: string;
  chapterId?: string;
  taskType?: string;
  rate?: number;
  amount: number;
  currency: string;
  status: EarningItemStatus;
  approvedById?: string;
  approvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};

const earningItemSchema = looseSchema({
  earningId: { type: String, required: true, index: true },
  assistantId: { type: String, required: true, index: true },
  taskId: { type: String },
  submissionId: { type: String, index: true },
  seriesId: { type: String, index: true },
  chapterId: { type: String, index: true },
  taskType: { type: String },
  period: { type: String, index: true },
  rate: { type: Number },
  amount: { type: Number, required: true, default: 0 },
  currency: { type: String, default: "VND" },
  status: {
    type: String,
    required: true,
    enum: ["APPROVED"],
    default: "APPROVED",
    index: true,
  },
  approvedById: { type: String },
  approvedAt: { type: Date },
});

// One earning item per task (a task can only be paid once)
earningItemSchema.index({ taskId: 1 }, { unique: true, sparse: true });
// Monthly rollup lookups by assistant + period.
earningItemSchema.index({ assistantId: 1, period: 1 });

/* ------------------------------------------------------------------ */
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

/* ------------------------------------------------------------------ */
/*  Model exports                                                       */
/* ------------------------------------------------------------------ */

export const UserModel = mongoose.model<any>("User", userSchema);
export const RefreshSessionModel = mongoose.model<any>("RefreshSession", refreshSessionSchema);
export const ProposalModel = mongoose.model<any>("Proposal", proposalSchema);
export const ProposalVoteModel = mongoose.model<any>("ProposalVote", proposalVoteSchema);
export const SeriesModel = mongoose.model<any>("Series", seriesSchema);
export const ChapterModel = mongoose.model<any>("Chapter", chapterSchema);
export const PublicationModel = mongoose.model<any>("Publication", publicationSchema);
export const StudioRegionModel = mongoose.model<any>("StudioRegion", studioRegionSchema);
export const StudioTaskModel = mongoose.model<any>("StudioTask", studioTaskSchema);
export const StudioCommentModel = mongoose.model<any>("StudioComment", studioCommentSchema);
export const SubmissionModel = mongoose.model<any>("Submission", submissionSchema);
export const NotificationModel = mongoose.model<any>("Notification", notificationSchema);
export const AuditEntryModel = mongoose.model<any>("AuditEntry", auditSchema);
export const RankingModel = mongoose.model<any>("Ranking", rankingSchema);
export const RankingImportModel = mongoose.model<any>("RankingImport", rankingImportSchema);
export const AtRiskReportModel = mongoose.model<any>("AtRiskReport", atRiskReportSchema);
export const EarningModel = mongoose.model<any>("Earning", earningSchema);
export const EarningItemModel = mongoose.model<any>("EarningItem", earningItemSchema);
export const AiProcessingModel = mongoose.model<any>("AiProcessing", aiProcessingSchema);
export const SeriesMemberModel = mongoose.model<any>("SeriesMember", seriesMemberSchema);

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
  NotificationModel,
  AuditEntryModel,
  RankingModel,
  RankingImportModel,
  AtRiskReportModel,
  EarningModel,
  EarningItemModel,
  AiProcessingModel,
  SeriesMemberModel,
] as const;

export function stripMongo<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
