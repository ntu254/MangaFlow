import type { StudioTaskStatus } from "@/entities/series/model/studio-types";

export type TaskStatusLabelKey = StudioTaskStatus | "COMPLETED" | "OPEN" | "REVISION_REQUESTED";

export type {
  AssistantAccessScope,
  AssistantEarning,
  AssistantSubmission,
  EarningStatus,
  SubmissionStatus,
} from "@/entities/submission/model/assistant-types";
export {
  ASSISTANT_SCOPE_LABEL,
  NOTIFICATION_KIND_LABEL,
  SUBMISSION_STATUS_BADGE,
  SUBMISSION_STATUS_LABEL,
} from "@/entities/submission/model/assistant-types";

export const TASK_STATUS_LABEL: Record<TaskStatusLabelKey, string> = {
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  SUBMITTED: "Submitted",
  MANGAKA_REVIEWING: "Mangaka Reviewing",
  MANGAKA_REVISION_REQUESTED: "Revision Requested",
  MANGAKA_APPROVED: "Mangaka Approved",
  EDITOR_REVIEWING: "Editor Reviewing",
  EDITOR_REVISION_REQUESTED: "Editor Revision Requested",
  EDITOR_APPROVED: "Editor Approved",
  REJECTED: "Rejected",
  CANCELLED: "Cancelled",
  COMPLETED: "Completed",
  OPEN: "To Do",
  REVISION_REQUESTED: "Revision Requested",
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
