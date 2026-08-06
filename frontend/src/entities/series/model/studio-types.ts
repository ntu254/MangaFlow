export { UNSUPPORTED_MVP } from "@/shared/config/ui-copy";
export type StudioTool = "select" | "pan" | "draw-region" | "comment";

export type RegionType =
  | "background"
  | "character"
  | "speech_bubble"
  | "effect"
  | "lettering"
  | "clean_line"
  | "correction"
  | "other";

export const REGION_TYPE_LABEL: Record<RegionType, string> = {
  background: "Background",
  character: "Character",
  speech_bubble: "Speech Bubble",
  effect: "Effect",
  lettering: "Lettering",
  clean_line: "Clean Line",
  correction: "Correction",
  other: "Other",
};

export type RegionStatus =
  | "DETECTED"
  | "CONFIRMED"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "SUBMITTED"
  | "REVISION_REQUIRED"
  | "APPROVED"
  | "DONE"
  | "DISCARDED";

export const REGION_STATUS_COLOR: Record<RegionStatus, string> = {
  DETECTED: "#a78bfa",
  CONFIRMED: "#60a5fa",
  ASSIGNED: "#38bdf8",
  IN_PROGRESS: "#f59e0b",
  SUBMITTED: "#0ea5e9",
  REVISION_REQUIRED: "#f43f5e",
  APPROVED: "#10b981",
  DONE: "#059669",
  DISCARDED: "#9ca3af",
};

export const REGION_STATUS_BADGE: Record<RegionStatus, string> = {
  DETECTED: "bg-violet-100 text-violet-800 border-violet-300",
  CONFIRMED: "bg-blue-100 text-blue-800 border-blue-300",
  ASSIGNED: "bg-sky-100 text-sky-800 border-sky-300",
  IN_PROGRESS: "bg-amber-100 text-amber-900 border-amber-300",
  SUBMITTED: "bg-cyan-100 text-cyan-900 border-cyan-300",
  REVISION_REQUIRED: "bg-rose-100 text-rose-900 border-rose-300",
  APPROVED: "bg-emerald-100 text-emerald-900 border-emerald-300",
  DONE: "bg-emerald-200 text-emerald-900 border-emerald-400",
  DISCARDED: "bg-zinc-200 text-zinc-700 border-zinc-300",
};

export type StudioRegion = {
  id: string;
  pageId: string;
  chapterId: string;
  type: RegionType;
  x: number;
  y: number;
  width: number;
  height: number;
  status: RegionStatus;
  taskId?: string;
  label?: string;
  hidden?: boolean;
  locked?: boolean;
  metadata?: {
    source?: string;
    kind?: string;
    processingId?: string;
    confidence?: number;
    hasMask?: boolean;
    [key: string]: unknown;
  };
};

// Sprint 1.3 — terminal task lifecycle is now
//   TODO → IN_PROGRESS → SUBMITTED → MANGAKA_APPROVED → EDITOR_APPROVED → COMPLETED
// Only REJECTED / CANCELLED short-circuit; MANGAKA_APPROVED alone is no longer
// terminal because the editor still has to confirm the submission before
// earnings get cut and the page can be reassigned.
export type StudioTaskStatus =
  | "TODO"
  | "IN_PROGRESS"
  | "SUBMITTED"
  | "REVISION_REQUESTED"
  | "MANGAKA_APPROVED"
  | "EDITOR_APPROVED"
  | "COMPLETED"
  | "REJECTED"
  | "CANCELLED";

export type TaskAssignmentStatus = "UNASSIGNED" | "PENDING" | "ACCEPTED" | "REJECTED";
export type PageAssignmentStatus = "PENDING" | "ACCEPTED" | "RELEASED" | "REJECTED";
export type PageAssignment = {
  assistantId: string;
  assistantName: string;
  status: PageAssignmentStatus;
  assignedAt: string;
  acceptedAt?: string;
  releasedAt?: string;
  rejectedReason?: string;
};

export type PageAssignmentInboxItem = {
  pageId: string;
  pageNumber: number;
  chapterId: string;
  chapterNumber: number;
  chapterTitle: string;
  seriesId: string;
  seriesTitle: string;
  mangakaId: string;
  mangakaName: string;
  assignedAt: string;
  openTaskCount: number;
};

export const TASK_STATUS_BADGE: Record<StudioTaskStatus, string> = {
  TODO: "bg-zinc-200 text-zinc-800 border-zinc-300",
  IN_PROGRESS: "bg-amber-100 text-amber-900 border-amber-300",
  SUBMITTED: "bg-cyan-100 text-cyan-900 border-cyan-300",
  REVISION_REQUESTED: "bg-amber-100 text-amber-900 border-amber-300",
  MANGAKA_APPROVED: "bg-emerald-100 text-emerald-900 border-emerald-300",
  EDITOR_APPROVED: "bg-emerald-200 text-emerald-950 border-emerald-400",
  COMPLETED: "bg-emerald-300 text-emerald-950 border-emerald-500",
  REJECTED: "bg-rose-100 text-rose-900 border-rose-300",
  CANCELLED: "bg-rose-100 text-rose-800 border-rose-300",
};

/**
 * A task blocks a new task from being created on the same region until it
 * reaches a true terminal status (REJECTED / CANCELLED / COMPLETED).
 *
 * Sprint 1.3 — `MANGAKA_APPROVED` is now treated as ACTIVE because the
 * editor still has to confirm the submission. This is the same set of
 * statuses the backend considers "in flight" in
 * `page-assignment.service.ts → PAGE_TASK_TERMINAL_STATUSES`.
 */
export function isTaskActive(status: StudioTaskStatus): boolean {
  return !["REJECTED", "CANCELLED", "COMPLETED"].includes(status);
}

/**
 * True only when the task has reached a terminal state and the page
 * can be reassigned to a new assistant. Mirrors the backend guard in
 * `assertPageAssignmentReleaseable`.
 */
export function isTaskTerminal(status: StudioTaskStatus): boolean {
  return ["REJECTED", "CANCELLED", "COMPLETED"].includes(status);
}

export type StudioTask = {
  id: string;
  seriesId?: string;
  chapterId: string;
  pageId: string;
  /** @deprecated compatibility field; page assignment is authoritative. */
  pageTaskActive?: boolean;
  title: string;
  type: RegionType;
  assigneeId: string;
  assigneeName: string;
  assignmentStatus?: TaskAssignmentStatus;
  assignmentRejectedReason?: string;
  assignmentRejectedAt?: string;
  dueAt: string;
  priority: "low" | "normal" | "high";
  instructions: string;
  rateCode?: string;
  rateVersion?: number;
  rateSnapshot?: number;
  estimatedAmount?: number;
  currency?: string;
  status: StudioTaskStatus;
  createdAt: string;
  hidden?: boolean;
  locked?: boolean;
  waitingFor?: string;
  reassigned?: boolean;
  reassignedFromId?: string;
  reassignedFromName?: string;
  reassignedToId?: string;
  reassignedToName?: string;
  reassignedAt?: string;
  reassignmentReason?: string;
  cancelled?: boolean;
  cancelledAt?: string;
};

export type StudioComment = {
  id: string;
  chapterId: string;
  pageId: string;
  regionId?: string;
  taskId?: string;
  targetType?: "CHAPTER" | "PAGE" | "REGION" | "TASK" | "SUBMISSION";
  targetId?: string;
  parentCommentId?: string;
  authorId: string;
  authorName: string;
  /** Primary content field (V2) */
  body: string;
  /** @deprecated use body */
  text?: string;
  x?: number;
  y?: number;
  /** Primary blocking flag (V2) */
  isBlocking: boolean;
  status: "OPEN" | "ADDRESSED" | "RESOLVED" | "REOPENED";
  authorRole?: string;
  createdAt: string;
  hidden?: boolean;
  locked?: boolean;
};

export type StudioSelection =
  | { kind: "none" }
  | { kind: "page"; pageId: string }
  | { kind: "region"; regionId: string }
  | { kind: "task"; taskId: string }
  | { kind: "comment"; commentId: string };
