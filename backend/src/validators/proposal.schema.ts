import { z } from "zod";

// ---------------------------------------------------------------------------
// Enums (mirror types.ts for runtime validation)
// ---------------------------------------------------------------------------

export const PROPOSAL_STATUSES = [
  "DRAFT",
  "SUBMITTED",
  "PENDING_EDITOR",
  "EDITOR_REVIEWING",
  "CHANGES_REQUESTED",
  "RESUBMITTED",
  "PENDING_BOARD",
  "BOARD_VOTING",
  "TIE_BREAK",
  "APPROVED",
  "REJECTED",
  "WITHDRAWN",
  "ARCHIVED",
] as const;

export const CHAPTER_STATUSES = [
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
  "ARCHIVED",
  // Legacy values kept for backward compat
  "IN_REVIEW",
  "APPROVED",
] as const;

export const TASK_STATUSES = [
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
] as const;

export const SUBMISSION_STATUSES = [
  "PENDING",
  "MANGAKA_APPROVED",
  "MANGAKA_REVISION_REQUESTED",
  "EDITOR_APPROVED",
  "EDITOR_REVISION_REQUESTED",
  "REJECTED",
  "SUPERSEDED",
] as const;

export const SUBMISSION_REVIEW_STAGES = ["MANGAKA_REVIEW", "EDITOR_REVIEW", "FINAL"] as const;

export const VOTE_DECISIONS = ["APPROVE", "REJECT", "ABSTAIN"] as const;

export const CHAPTER_ACTIONS = [
  "START_DRAFT",
  "START_ASSISTANT_WORK",
  "SUBMIT_REVIEW",
  "REQUEST_REVISION",
  "RESUBMIT",
  "EDITOR_APPROVE",
  "MARK_READY",
  "SCHEDULE",
  "PUBLISH",
  "REASSIGN",
  "ARCHIVE",
] as const;

export const PROPOSAL_ACTIONS = [
  "SUBMIT",
  "WITHDRAW",
  "EDIT",
  "CLAIM",
  "RELEASE_CLAIM",
  "REASSIGN_CLAIM",
  "REQUEST_CHANGES",
  "RESUBMIT",
  "FORWARD",
  "REJECT",
  "RECALL",
  "VOTE",
  "FORCE_STATUS",
  "ARCHIVE",
] as const;

// ---------------------------------------------------------------------------
// Proposal schemas
// ---------------------------------------------------------------------------

export const createProposalSchema = z
  .object({
    title: z.string().min(1).max(200).optional(),
    slug: z.string().max(100).optional(),
    authorId: z.string().optional(),
    authorName: z.string().optional(),
    synopsis: z.string().max(5000).optional(),
    logline: z.string().max(500).optional(),
    genres: z.array(z.string()).optional(),
    targetAudience: z.string().optional(),
    requestedPublicationType: z.string().optional(),
    chaptersPlanned: z.number().int().min(1).max(500).optional(),
    coverUrl: z.string().optional(),
    coverFileKey: z.string().optional(),
    sampleChapterUrl: z.string().optional(),
    manuscripts: z.array(z.any()).optional(),
    materials: z.array(z.any()).optional(),
    hook: z.string().optional(),
    mainCharacters: z.string().optional(),
    originalWorkConfirmed: z.boolean().optional(),
    submissionNote: z.string().optional(),
    advanced: z.any().optional(),
  })
  .strict();

export const patchProposalSchema = z
  .object({
    title: z.string().min(1).max(200).optional(),
    slug: z.string().max(100).optional(),
    synopsis: z.string().max(5000).optional(),
    logline: z.string().max(500).optional(),
    genres: z.array(z.string()).optional(),
    targetAudience: z.string().optional(),
    requestedPublicationType: z.string().optional(),
    chaptersPlanned: z.number().int().min(1).max(500).optional(),
    coverUrl: z.string().optional(),
    coverFileKey: z.string().optional(),
    sampleChapterUrl: z.string().optional(),
    manuscripts: z.array(z.any()).optional(),
    materials: z.array(z.any()).optional(),
    hook: z.string().optional(),
    mainCharacters: z.string().optional(),
    originalWorkConfirmed: z.boolean().optional(),
    submissionNote: z.string().optional(),
    advanced: z.any().optional(),
  })
  .strict();

export const proposalActionSchema = z.object({
  action: z.enum(PROPOSAL_ACTIONS),
  comment: z.string().max(5000).optional(),
  note: z.string().max(5000).optional(),
  revisionReason: z.string().max(5000).optional(),
  feedbackSummary: z.string().max(5000).optional(),
  editorRecommendation: z.string().max(5000).optional(),
  rejectReason: z.string().max(5000).optional(),
  forceStatus: z.enum(PROPOSAL_STATUSES).optional(),
  editorId: z.string().optional(),
  editorName: z.string().optional(),
  sessionId: z.string().optional(),
  voteDecision: z.enum(VOTE_DECISIONS).optional(),
  value: z.enum(VOTE_DECISIONS).optional(),
  decision: z.enum(VOTE_DECISIONS).optional(),
  reason: z.string().max(2000).optional(),
  archiveReason: z.string().max(2000).optional(),
  fileName: z.string().optional(),
  fileType: z.string().optional(),
  sizeKB: z.number().optional(),
  // EDIT action fields
  title: z.string().min(1).max(200).optional(),
  slug: z.string().max(100).optional(),
  synopsis: z.string().max(5000).optional(),
  logline: z.string().max(500).optional(),
  genres: z.array(z.string()).optional(),
  targetAudience: z.string().optional(),
  requestedPublicationType: z.string().optional(),
  chaptersPlanned: z.number().int().min(1).max(500).optional(),
  coverUrl: z.string().optional(),
  coverFileKey: z.string().optional(),
  sampleChapterUrl: z.string().optional(),
  manuscripts: z.array(z.any()).optional(),
  materials: z.array(z.any()).optional(),
  hook: z.string().optional(),
  mainCharacters: z.string().optional(),
  originalWorkConfirmed: z.boolean().optional(),
  submissionNote: z.string().optional(),
  advanced: z.any().optional(),
});
