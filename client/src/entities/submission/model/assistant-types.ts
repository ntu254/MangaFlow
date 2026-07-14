import type { StudioTaskStatus } from "@/entities/series/model/studio-types";

export type AssistantAccessScope = "FULL_SERIES_ASSISTANT" | "TASK_ONLY_ASSISTANT";

export const ASSISTANT_SCOPE_LABEL: Record<AssistantAccessScope, string> = {
  FULL_SERIES_ASSISTANT: "Full series",
  TASK_ONLY_ASSISTANT: "Task only",
};

export type SubmissionStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "PENDING"
  | "REVISION_REQUESTED"
  | "MANGAKA_REVISION_REQUESTED"
  | "EDITOR_REVISION_REQUESTED"
  | "APPROVED"
  | "MANGAKA_APPROVED"
  | "EDITOR_APPROVED"
  | "REJECTED"
  | "SUPERSEDED";

export const SUBMISSION_STATUS_LABEL: Record<SubmissionStatus, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  PENDING: "Pending",
  REVISION_REQUESTED: "Revision",
  MANGAKA_REVISION_REQUESTED: "Mangaka Revision",
  EDITOR_REVISION_REQUESTED: "Editor Revision",
  APPROVED: "Approved",
  MANGAKA_APPROVED: "Mangaka approved",
  EDITOR_APPROVED: "Editor approved",
  REJECTED: "Rejected",
  SUPERSEDED: "Superseded",
};

export const SUBMISSION_STATUS_BADGE: Record<SubmissionStatus, string> = {
  DRAFT: "bg-zinc-200 text-zinc-800",
  SUBMITTED: "bg-cyan-100 text-cyan-900",
  PENDING: "bg-amber-100 text-amber-900",
  REVISION_REQUESTED: "bg-orange-100 text-orange-900",
  MANGAKA_REVISION_REQUESTED: "bg-orange-100 text-orange-900",
  EDITOR_REVISION_REQUESTED: "bg-amber-100 text-amber-900",
  APPROVED: "bg-emerald-100 text-emerald-900",
  MANGAKA_APPROVED: "bg-blue-100 text-blue-900",
  EDITOR_APPROVED: "bg-emerald-200 text-emerald-900",
  REJECTED: "bg-rose-100 text-rose-900",
  SUPERSEDED: "bg-zinc-100 text-zinc-600",
};

export type AssistantSubmission = {
  id: string;
  taskId: string;
  chapterId?: string;
  assistantId: string;
  version: number;
  versionLabel: string;
  fileKey?: string;
  fileName?: string;
  fileUrl?: string;
  fileSizeKB?: number;
  mimeType?: string;
  note?: string;
  status: SubmissionStatus;
  feedback?: string;
  reviewedById?: string;
  reviewedByName?: string;
  reviewedAt?: string;
  submittedAt: string;
};

export type EarningStatus = "PENDING" | "CONFIRMED" | "PAID" | "VOIDED";
export type EarningItemStatus = "PENDING" | "APPROVED" | "VOIDED";

export type AssistantEarningItem = {
  id: string;
  earningId: string;
  assistantId: string;
  taskId?: string;
  submissionId?: string;
  seriesId?: string;
  chapterId?: string;
  taskType?: string;
  period?: string;
  rate?: number;
  amount: number;
  currency: string;
  status: EarningItemStatus;
  approvedAt?: string;
};

export type AssistantEarning = {
  id: string;
  assistantId: string;
  period: string; // YYYY-MM
  month?: string; // legacy fallback
  tasksCount?: number;
  subtotal?: number;
  bonus?: number;
  penalty?: number;
  amount: number;
  currency: string;
  status: EarningStatus;
  items?: AssistantEarningItem[];
};

export type TaskActionKind =
  | "START_WORK"
  | "OPEN_STUDIO"
  | "VIEW_SUBMISSION"
  | "FIX_AND_RESUBMIT"
  | "VIEW_APPROVED"
  | "VIEW_COMPLETED"
  | "VIEW_REASON"
  | "VIEW_ONLY";

export const TASK_ACTION_LABEL: Record<TaskActionKind, string> = {
  START_WORK: "Start Work",
  OPEN_STUDIO: "Open Task Studio",
  VIEW_SUBMISSION: "View Submission",
  FIX_AND_RESUBMIT: "Fix & Resubmit",
  VIEW_APPROVED: "View Approved",
  VIEW_COMPLETED: "View Completed",
  VIEW_REASON: "View Reason",
  VIEW_ONLY: "View Only",
};

export function primaryActionForTaskStatus(status: StudioTaskStatus): TaskActionKind {
  switch (status) {
    case "TODO":
      return "START_WORK";
    case "IN_PROGRESS":
      return "OPEN_STUDIO";
    case "SUBMITTED":
      return "VIEW_SUBMISSION";
    case "MANGAKA_REVISION_REQUESTED":
    case "EDITOR_REVISION_REQUESTED":
      return "FIX_AND_RESUBMIT";
    case "MANGAKA_APPROVED":
    case "EDITOR_APPROVED":
      return "VIEW_APPROVED";
    case "REJECTED":
      return "VIEW_REASON";
    default:
      return "VIEW_ONLY";
  }
}

export type NotificationKind =
  | "TASK_ASSIGNED"
  | "TASK_DUE_SOON"
  | "REVISION_REQUESTED"
  | "SUBMISSION_APPROVED"
  | "SUBMISSION_REJECTED"
  | "COMMENT_REPLIED"
  | "EARNING_CONFIRMED"
  | "EARNING_PAID";

export const NOTIFICATION_KIND_LABEL: Record<NotificationKind, string> = {
  TASK_ASSIGNED: "New task",
  TASK_DUE_SOON: "Due soon",
  REVISION_REQUESTED: "Changes requested",
  SUBMISSION_APPROVED: "Approved",
  SUBMISSION_REJECTED: "Rejected",
  COMMENT_REPLIED: "New reply",
  EARNING_CONFIRMED: "Earning recorded",
  EARNING_PAID: "Earning recorded",
};
