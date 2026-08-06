import type { Role } from "@/shared/auth";
import type { PageStatus } from "@/shared/constants/status-constants";
import type { SupportingMaterial } from "@/entities/proposal/model/proposal-types";
import type { PageAssignment } from "./studio-types";

export type ProductionSeriesStatus =
  | "PRE_PRODUCTION"
  | "PLANNING"
  | "ONGOING"
  | "HIATUS"
  | "COMPLETED"
  | "ARCHIVED";

export type ChapterCadence = "weekly" | "monthly";
export type SeriesPublicationType = "WEEKLY" | "MONTHLY";

// Canonical chapter lifecycle (aligned with backend):
//   PLANNED → IN_PRODUCTION → TANTOU_REVIEW ⇄ REVISION_REQUIRED
//           → READY_FOR_PUBLICATION → PUBLISHED
// Scheduling is NOT a chapter status: a chapter stays READY_FOR_PUBLICATION
// while its Publication is SCHEDULED. Legacy statuses were retired; backend
// converts existing rows via migrate-chapter-status-canonical.ts.
export type ChapterStatus =
  | "PLANNED"
  | "IN_PRODUCTION"
  | "TANTOU_REVIEW"
  | "REVISION_REQUIRED"
  | "READY_FOR_PUBLICATION"
  | "PUBLISHED";

export type ChapterAction =
  | "START_DRAFT"
  | "START_ASSISTANT_WORK"
  | "SUBMIT_REVIEW"
  | "REQUEST_REVISION"
  | "REJECT"
  | "RESUBMIT"
  | "EDITOR_APPROVE"
  | "SCHEDULE"
  | "POSTPONE"
  | "PUBLISH"
  | "PUBLISH_EARLY"
  | "REASSIGN"
  // Legacy
  | "APPROVE";

export type ChapterPage = {
  id: string;
  index: number;
  pageNumber?: number;
  status?: PageStatus;
  fileName: string;
  fileUrl: string;
  imageUrl?: string;
  fileKey?: string;
  mimeType?: string;
  sizeKB: number;
  uploadedAt: string;
  metadata?: {
    aiWhitened?: {
      fileKey: string;
      fileUrl?: string;
      processingId?: string;
      mimeType?: string;
      generatedAt?: string;
    };
    [key: string]: unknown;
  };
  pageAssignment?: PageAssignment;
};

export type ReviewNote = {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: Role;
  text: string;
  resolved: boolean;
  createdAt: string;
};

export type ChapterEvent = {
  id: string;
  chapterId: string;
  actorId: string;
  actorName: string;
  actorRole: Role;
  type: ChapterAction | "CREATE" | "UPLOAD";
  fromStatus?: ChapterStatus;
  toStatus?: ChapterStatus;
  comment?: string;
  createdAt: string;
};

export type Chapter = {
  id: string;
  seriesId: string;
  number: number;
  title: string;
  targetPages?: number;
  status: ChapterStatus;
  assigneeId: string;
  assigneeName: string;
  plannedAt?: string;
  draftDueAt?: string;
  reviewDueAt?: string;
  scheduledAt?: string;
  publishedAt?: string;
  publication?: {
    id: string;
    seriesId: string;
    chapterId: string;
    status: "DRAFT" | "SCHEDULED" | "PUBLISHED" | "CANCELLED";
    scheduledAt?: string;
    publishedAt?: string;
  };
  pages: ChapterPage[];
  materials?: SupportingMaterial[];
  reviewNotes: ReviewNote[];
  revisionRound: number;
  history: ChapterEvent[];
  createdAt: string;
  updatedAt: string;
};

export type ChapterReview = {
  id: string;
  chapterId: string;
  seriesId: string;
  chapterVersionId: string;
  pageVersionIds: Array<{ pageId: string; pageVersionId: string }>;
  status: "OPEN" | "APPROVED" | "REVISION_REQUESTED" | "REJECTED" | "STALE" | "INVALIDATED";
  createdById: string;
  createdAt: string;
  decidedById?: string;
  decidedAt?: string;
  decisionAction?: string;
  snapshot?: Record<string, unknown>;
  updatedAt: string;
};

export type ProductionSeries = {
  id: string;
  slug: string;
  title: string;
  synopsis: string;
  genres: string[];
  coverUrl: string;
  coverFileKey?: string;
  status: ProductionSeriesStatus;
  publicationType?: SeriesPublicationType;
  cadence: ChapterCadence;
  startDate: string;
  targetChapters: number;
  authorId: string;
  authorName: string;
  editorId: string;
  editorName: string;
  assistantIds: string[];
  proposalId?: string;
  createdAt: string;
  updatedAt: string;
};

export const SERIES_STATUS_LABEL: Record<ProductionSeriesStatus, string> = {
  PRE_PRODUCTION: "Pre-production",
  PLANNING: "Planning",
  ONGOING: "Ongoing",
  HIATUS: "Hiatus",
  COMPLETED: "Completed",
  ARCHIVED: "Archived",
};

export const CHAPTER_STATUS_LABEL: Record<ChapterStatus, string> = {
  PLANNED: "Planned",
  IN_PRODUCTION: "In Production",
  TANTOU_REVIEW: "Tantou Review",
  REVISION_REQUIRED: "Revision Required",
  READY_FOR_PUBLICATION: "Ready for Publication",
  PUBLISHED: "Published",
};

export const CHAPTER_ACTION_LABEL: Record<ChapterAction, string> = {
  START_DRAFT: "Start Draft",
  START_ASSISTANT_WORK: "Start Production",
  SUBMIT_REVIEW: "Submit Review",
  REQUEST_REVISION: "Request Revision",
  REJECT: "Reject",
  RESUBMIT: "Resubmit",
  EDITOR_APPROVE: "Editor Approve",
  APPROVE: "Approve",
  SCHEDULE: "Schedule",
  POSTPONE: "Postpone",
  PUBLISH: "Publish Now",
  PUBLISH_EARLY: "Publish Early",
  REASSIGN: "Reassign",
};

export const CADENCE_LABEL: Record<ChapterCadence, string> = {
  weekly: "Weekly",
  monthly: "Monthly",
};

export const CHAPTER_STATUS_FLOW: ChapterStatus[] = [
  "PLANNED",
  "IN_PRODUCTION",
  "TANTOU_REVIEW",
  "REVISION_REQUIRED",
  "READY_FOR_PUBLICATION",
  "PUBLISHED",
];

// ===================== Series Material Library =====================

export type SeriesMaterialKind =
  | "storyboard"
  | "character"
  | "background"
  | "moodboard"
  | "reference"
  | "sfx"
  | "style_guide"
  | "brush"
  | "other";

export type SeriesMaterialVersion = {
  id: string;
  version: number;
  fileName: string;
  fileUrl: string;
  fileType: string;
  sizeKB: number;
  uploadedById: string;
  uploadedByName: string;
  uploadedAt: string;
  note?: string;
  /** R2 storage key for presigned download resolution (MF-032). */
  fileKey?: string;
};

export type SeriesMaterial = {
  id: string;
  seriesId: string;
  title: string;
  kind: SeriesMaterialKind;
  chapterId?: string;
  tags: string[];
  note?: string;
  currentVersion: number;
  versions: SeriesMaterialVersion[];
  createdAt: string;
  updatedAt: string;
};

export const SERIES_MATERIAL_KIND_LABEL: Record<SeriesMaterialKind, string> = {
  storyboard: "Storyboard / Name",
  character: "Character Sheets",
  background: "Background",
  moodboard: "Moodboard",
  reference: "References",
  sfx: "SFX / Lettering",
  style_guide: "Style Guide",
  brush: "Brush / Tone",
  other: "Other",
};

export interface MaterialVersionItem {
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
  uploadedAt: string;
}

export interface MaterialItem {
  id: string;
  seriesId?: string;
  chapterId?: string;
  title: string;
  kind?: string;
  description?: string;
  tags?: string[];
  fileKey?: string;
  url?: string;
  thumbnailUrl?: string;
  mimeType?: string;
  metadata?: Record<string, unknown>;
  currentVersion?: number;
  versions: MaterialVersionItem[];
  createdAt: string;
  updatedAt: string;
}

export interface SeriesRanking {
  id: string;
  seriesId: string;
  seriesTitle: string;
  period: string;
  readerScore: number;
  voteCount: number;
  finalScore: number;
  status: string;
  atRisk: boolean;
  source?: string;
  metadata?: {
    atRiskDecision?: {
      decision?: string;
      note?: string;
      decidedAt?: string;
      decidedById?: string;
      decidedByName?: string;
    };
  };
}

export const seriesKeys = {
  all: ["series"] as const,
  mine: () => [...seriesKeys.all, "mine"] as const,
  detail: (seriesId: string) => [...seriesKeys.all, "detail", seriesId] as const,
  chapters: (seriesId: string) => [...seriesKeys.detail(seriesId), "chapters"] as const,
  chaptersBundle: (seriesIds: string[]) =>
    [...seriesKeys.all, "chaptersBundle", [...seriesIds].sort()] as const,
  members: (seriesId: string) => [...seriesKeys.detail(seriesId), "members"] as const,
  editor: (seriesId: string) => [...seriesKeys.detail(seriesId), "editor"] as const,
  rankings: (seriesId: string) => [...seriesKeys.detail(seriesId), "rankings"] as const,
  activity: (seriesId: string) => [...seriesKeys.detail(seriesId), "activity"] as const,
  proposal: (seriesId: string) => [...seriesKeys.detail(seriesId), "proposal"] as const,
  rankingsList: () => [...seriesKeys.all, "rankingsList"] as const,
};

export const chapterKeys = {
  all: ["chapters"] as const,
  detail: (chapterId: string) => [...chapterKeys.all, "detail", chapterId] as const,
  pages: (chapterId: string) => [...chapterKeys.detail(chapterId), "pages"] as const,
  readiness: (chapterId: string) => [...chapterKeys.detail(chapterId), "readiness"] as const,
  reviews: (chapterId: string) => [...chapterKeys.detail(chapterId), "reviews"] as const,
};

export const materialKeys = {
  all: ["materials"] as const,
  list: (chapterId: string) => [...materialKeys.all, "chapter", chapterId] as const,
  series: (seriesId: string) => [...materialKeys.all, "series", seriesId] as const,
};

export const studioKeys = {
  all: ["studio"] as const,
  regions: (filters: { pageId?: string; chapterId?: string; seriesId?: string }) =>
    [...studioKeys.all, "regions", filters] as const,
  tasks: (filters: {
    seriesId?: string;
    chapterId?: string;
    pageId?: string;
    assigneeId?: string;
    status?: string;
  }) => [...studioKeys.all, "tasks", filters] as const,
  task: (taskId: string) => [...studioKeys.all, "task", taskId] as const,
  comments: (filters: {
    seriesId?: string;
    chapterId?: string;
    pageId?: string;
    regionId?: string;
    taskId?: string;
  }) => [...studioKeys.all, "comments", filters] as const,
  assignmentInbox: () => [...studioKeys.all, "assignment-inbox"] as const,
};
