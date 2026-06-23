import { AppError } from "../../../shared/errors/AppError.js";
import {
  updateSubmissionStatus,
  updateTaskReviewState,
  updateTaskStatusForSubmission,
} from "../submission.repository.js";
import type { SubmissionActor } from "../policies/submission-access.policy.js";
import { assertSubmissionSeriesMember } from "../policies/submission-access.policy.js";
import {
  assertEditorApprovalState,
  assertMangakaApprovalState,
  assertMangakaRejectState,
  assertEditorRejectState,
  assertRevisionFeedback,
} from "../guards/submission-transition.guard.js";
import { getSubmissionWithTask } from "./submission.shared.js";
import { Task } from "../../task/task.model.js";
import { syncFinishedTaskTarget } from "../../task/services/task-target-state.js";

async function triggerEarningCandidate(taskId: string) {
  try {
    const { calculateTaskEarningService } =
      await import("../../payroll/services/payroll-calculate.service.js");
    const task = await Task.findById(taskId);
    if (!task) return;
    await calculateTaskEarningService(taskId, {
      userId: String(task.assignedBy),
      role: "ADMIN",
    });
  } catch {
    // Non-fatal: earning can be manually re-triggered via payroll routes
  }
}

export interface ReviewInput {
  submissionId: string;
  actor: SubmissionActor;
  reviewerNote?: string;
}

export async function mangakaApproveSubmissionService(input: ReviewInput) {
  const { submission, task } = await getSubmissionWithTask(input.submissionId);
  await assertSubmissionSeriesMember(String(task.seriesId), input.actor, [
    "MANGAKA",
  ]);
  assertMangakaApprovalState(submission.status, task.status);

  const updated = await updateSubmissionStatus(
    input.submissionId,
    "MANGAKA_APPROVED",
    input.reviewerNote,
  );
  await updateTaskStatusForSubmission(String(task._id), "MANGAKA_APPROVED");
  await syncFinishedTaskTarget(task);
  // Preserve revision audit metadata (revisionRound, revisionRequestedByRole, etc.) on approval
  return updated;
}

export async function editorApproveSubmissionService(input: ReviewInput) {
  const { submission, task } = await getSubmissionWithTask(input.submissionId);
  await assertSubmissionSeriesMember(String(task.seriesId), input.actor, [
    "EDITOR",
  ]);
  assertEditorApprovalState(submission.status, task.status);

  const updated = await updateSubmissionStatus(
    input.submissionId,
    "EDITOR_APPROVED",
    input.reviewerNote,
  );
  await updateTaskStatusForSubmission(String(task._id), "EDITOR_APPROVED");
  await syncFinishedTaskTarget(task);
  // Preserve revision audit metadata (revisionRound, revisionRequestedByRole, etc.) on approval

  void triggerEarningCandidate(String(task._id));

  return updated;
}

export async function requestSubmissionRevisionService(input: ReviewInput) {
  const { submission, task } = await getSubmissionWithTask(input.submissionId);

  assertRevisionFeedback(input.reviewerNote);

  let revisionRole: "MANGAKA" | "EDITOR";

  if (submission.status === "SUBMITTED") {
    await assertSubmissionSeriesMember(String(task.seriesId), input.actor, [
      "MANGAKA",
    ]);
    revisionRole = "MANGAKA";
  } else if (submission.status === "MANGAKA_APPROVED") {
    await assertSubmissionSeriesMember(String(task.seriesId), input.actor, [
      "EDITOR",
    ]);
    revisionRole = "EDITOR";
  } else {
    throw new AppError("Revision can be requested only during review", 409);
  }

  const updated = await updateSubmissionStatus(
    input.submissionId,
    "REVISION_REQUESTED",
    input.reviewerNote,
  );
  await updateTaskStatusForSubmission(String(task._id), "REVISION_REQUESTED");
  await updateTaskReviewState(String(task._id), {
    revisionRequestedByRole: revisionRole,
    revisionRequestedByUserId: input.actor.userId,
    revisionRequestedAt: new Date(),
  });
  return updated;
}

export async function rejectSubmissionService(input: ReviewInput) {
  const { submission, task } = await getSubmissionWithTask(input.submissionId);
  await assertSubmissionSeriesMember(String(task.seriesId), input.actor, [
    "MANGAKA",
  ]);
  assertMangakaRejectState(submission.status, task.status);

  if (!input.reviewerNote?.trim()) {
    throw new AppError("Mangaka rejection requires a reason", 400);
  }

  const updated = await updateSubmissionStatus(
    input.submissionId,
    "REJECTED",
    input.reviewerNote,
  );
  await updateTaskStatusForSubmission(String(task._id), "REJECTED");
  await syncFinishedTaskTarget(task);

  // If earning was already created for this task (e.g. from a previous approval cycle), void it
  try {
    const { getEarningByTaskId, updateEarningStatus } =
      await import("../../payroll/payroll.repository.js");
    const existingEarning = await getEarningByTaskId(String(task._id));
    if (existingEarning && existingEarning.status === "PENDING") {
      await updateEarningStatus(String(existingEarning._id), "VOID");
    }
  } catch {
    // Non-fatal: payroll cleanup is best-effort
  }

  return updated;
}

export async function editorRejectSubmissionService(input: ReviewInput) {
  const { submission, task } = await getSubmissionWithTask(input.submissionId);
  await assertSubmissionSeriesMember(String(task.seriesId), input.actor, [
    "EDITOR",
  ]);
  assertEditorRejectState(submission.status, task.status);

  if (!input.reviewerNote?.trim()) {
    throw new AppError("Editor rejection requires a reason", 400);
  }

  const updated = await updateSubmissionStatus(
    input.submissionId,
    "REJECTED",
    input.reviewerNote,
  );
  await updateTaskStatusForSubmission(String(task._id), "REJECTED");
  await syncFinishedTaskTarget(task);

  // If earning was already created for this task (e.g. from a previous approval cycle), void it
  try {
    const { getEarningByTaskId, updateEarningStatus } =
      await import("../../payroll/payroll.repository.js");
    const existingEarning = await getEarningByTaskId(String(task._id));
    if (existingEarning && existingEarning.status === "PENDING") {
      await updateEarningStatus(String(existingEarning._id), "VOID");
    }
  } catch {
    // Non-fatal: payroll cleanup is best-effort
  }

  return updated;
}
