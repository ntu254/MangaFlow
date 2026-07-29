import type { StudioTask } from "@/entities/series/model/studio-types";

export type TaskStudioSubmissionMode =
  | "NOT_STARTED"
  | "WORKING"
  | "AWAITING_REVIEW"
  | "REVISION_REQUIRED"
  | "CLOSED";

export type TaskStudioSubmissionState = {
  mode: TaskStudioSubmissionMode;
  canSubmit: boolean;
  defaultTab: "submit" | "feedback" | "history";
};

type SubmissionStateInput = {
  status: string;
};

const REVISION_TASK_STATUSES = new Set([
  "REVISION_REQUESTED",
  "MANGAKA_REVISION_REQUESTED",
  "EDITOR_REVISION_REQUESTED",
]);

const CLOSED_TASK_STATUSES = new Set([
  "MANGAKA_APPROVED",
  "EDITOR_APPROVED",
  "REJECTED",
  "CANCELLED",
]);

const ACTIVE_REVIEW_SUBMISSION_STATUSES = new Set([
  "PENDING",
  "SUBMITTED",
  "MANGAKA_REVIEWING",
  "EDITOR_REVIEWING",
]);

const CLOSED_SUBMISSION_STATUSES = new Set(["APPROVED", "MANGAKA_APPROVED", "EDITOR_APPROVED"]);

export function deriveTaskStudioSubmissionState(
  task: StudioTask,
  submissions: SubmissionStateInput[],
): TaskStudioSubmissionState {
  if (REVISION_TASK_STATUSES.has(task.status)) {
    return {
      mode: "REVISION_REQUIRED",
      canSubmit: false,
      defaultTab: "feedback",
    };
  }

  if (
    CLOSED_TASK_STATUSES.has(task.status) ||
    submissions.some((submission) => CLOSED_SUBMISSION_STATUSES.has(submission.status))
  ) {
    return {
      mode: "CLOSED",
      canSubmit: false,
      defaultTab: submissions.length > 0 ? "history" : "feedback",
    };
  }

  if (
    task.status === "SUBMITTED" ||
    task.status === "MANGAKA_REVIEWING" ||
    task.status === "EDITOR_REVIEWING" ||
    submissions.some((submission) => ACTIVE_REVIEW_SUBMISSION_STATUSES.has(submission.status))
  ) {
    return {
      mode: "AWAITING_REVIEW",
      canSubmit: false,
      defaultTab: "history",
    };
  }

  if (task.status === "IN_PROGRESS") {
    return {
      mode: "WORKING",
      canSubmit: true,
      defaultTab: "submit",
    };
  }

  return {
    mode: "NOT_STARTED",
    canSubmit: false,
    defaultTab: "submit",
  };
}
