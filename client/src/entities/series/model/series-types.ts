import type { Role } from "@/shared/auth";
import type { PageStatus } from "@/shared/constants/status-constants";
import type { SupportingMaterial } from "@/entities/proposal/model/proposal-types";

export type ProductionSeriesStatus = "PLANNING" | "ONGOING" | "HIATUS" | "COMPLETED" | "ARCHIVED";

export type ChapterCadence = "weekly" | "monthly";
export type SeriesPublicationType = "WEEKLY" | "MONTHLY";

export type ChapterStatus =
  | "IN_PRODUCTION"
  | "PLANNED"
  | "DRAFTING"
  | "ASSISTANT_WORKING"
  | "MANGAKA_REVIEW"
  | "EDITOR_REVIEW"
  | "REVISION"
  | "EDITOR_APPROVED"
  | "READY_FOR_PUBLICATION"
  | "SCHEDULED"
  | "PUBLISHED"
  | "ARCHIVED"
  // Legacy values — do not use in new writes
  // @deprecated migrate via migrate-schema-v2.ts
  | "IN_REVIEW"
  | "APPROVED";

export type ChapterAction =
  | "START_DRAFT"
  | "START_ASSISTANT_WORK"
  | "SUBMIT_REVIEW"
  | "REQUEST_REVISION"
  | "REJECT"
  | "RESUBMIT"
  | "EDITOR_APPROVE"
  | "MARK_READY"
  | "SCHEDULE"
  | "POSTPONE"
  | "PUBLISH"
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
  PLANNING: "Planning",
  ONGOING: "Ongoing",
  HIATUS: "Hiatus",
  COMPLETED: "Completed",
  ARCHIVED: "Archived",
};

export const CHAPTER_STATUS_LABEL: Record<ChapterStatus, string> = {
  IN_PRODUCTION: "In Production",
  PLANNED: "Planned",
  DRAFTING: "Drafting",
  ASSISTANT_WORKING: "Assistant Working",
  MANGAKA_REVIEW: "Mangaka Review",
  EDITOR_REVIEW: "Editor Review",
  REVISION: "Revision",
  EDITOR_APPROVED: "Editor Approved",
  READY_FOR_PUBLICATION: "Ready for Publication",
  SCHEDULED: "Scheduled",
  PUBLISHED: "Published",
  ARCHIVED: "Archived",
  // Legacy
  IN_REVIEW: "In Review",
  APPROVED: "Approved",
};

export const CHAPTER_ACTION_LABEL: Record<ChapterAction, string> = {
  START_DRAFT: "Start drafting",
  START_ASSISTANT_WORK: "Start production",
  SUBMIT_REVIEW: "Submit review",
  REQUEST_REVISION: "Changes requested",
  REJECT: "Reject",
  RESUBMIT: "Resubmit",
  EDITOR_APPROVE: "Editor approve",
  APPROVE: "Approve",
  MARK_READY: "Mark ready",
  SCHEDULE: "Schedule",
  POSTPONE: "Postpone",
  PUBLISH: "Publish now",
  REASSIGN: "Change assignee",
};

export const CADENCE_LABEL: Record<ChapterCadence, string> = {
  weekly: "Weekly",
  monthly: "Monthly",
};

export const CHAPTER_STATUS_FLOW: ChapterStatus[] = [
  "IN_PRODUCTION",
  "PLANNED",
  "DRAFTING",
  "ASSISTANT_WORKING",
  "MANGAKA_REVIEW",
  "EDITOR_REVIEW",
  "REVISION",
  "EDITOR_APPROVED",
  "READY_FOR_PUBLICATION",
  "PUBLISHED",
];

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
}

export const seriesKeys = {
  all: ["series"] as const,
  mine: () => [...seriesKeys.all, "mine"] as const,
  detail: (seriesId: string) => [...seriesKeys.all, "detail", seriesId] as const,
  chapters: (seriesId: string) => [...seriesKeys.detail(seriesId), "chapters"] as const,
  chaptersBundle: (seriesIds: string[]) =>
    [...seriesKeys.all, "chaptersBundle", [...seriesIds].sort()] as const,
  members: (seriesId: string) => [...seriesKeys.detail(seriesId), "members"] as const,
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
};

export const studioKeys = {
  all: ["studio"] as const,
  regions: (filters: { pageId?: string; chapterId?: string; seriesId?: string }) =>
    [...studioKeys.all, "regions", filters] as const,
  tasks: (filters: {
    seriesId?: string;
    chapterId?: string;
    pageId?: string;
    regionId?: string;
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
};

export const taskKeys = {
  all: ["studio-tasks"] as const,
  detail: (taskId: string) => [...taskKeys.all, "detail", taskId] as const,
};
