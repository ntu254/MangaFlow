import type { Task, TaskRepository } from "../task/index.js";
import type { SubmissionRepository } from "./submission.repository.js";
import type { SubmissionStatus } from "./submission.model.js";

export type Submission = {
  id: string;
  taskId: string;
  submittedBy: string;
  fileUrl: string;
  previewUrl?: string;
  note?: string;
  version: number;
  status: SubmissionStatus;
  createdAt: string;
  updatedAt: string;
};

export type CreateSubmissionInput = {
  taskId: string;
  submittedBy: string;
  fileUrl: string;
  previewUrl?: string;
  note?: string;
};

export type CreateSubmissionRecord = CreateSubmissionInput & {
  version: number;
  status: SubmissionStatus;
};

export class SubmissionServiceError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode = 400
  ) {
    super(message);
  }
}

const submittableTaskStatuses = new Set<Task["status"]>(["IN_PROGRESS", "REVISION_REQUESTED"]);

function assertNonEmpty(value: string | undefined, code: string, message: string, max = 2000) {
  const trimmed = value?.trim();
  if (!trimmed) {
    throw new SubmissionServiceError(code, message);
  }
  if (trimmed.length > max) {
    throw new SubmissionServiceError(code, `${message} (${max} characters max)`);
  }
  return trimmed;
}

function normalizeOptionalText(value: string | undefined, field: string, max = 2000) {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  if (trimmed.length > max) {
    throw new SubmissionServiceError("INVALID_TEXT", `${field} must be ${max} characters or less`);
  }
  return trimmed;
}

function assertUrl(value: string | undefined, code: string, message: string) {
  const trimmed = assertNonEmpty(value, code, message, 2000);
  if (!/^(https?:\/\/|storage:\/\/|r2:\/\/)/.test(trimmed)) {
    throw new SubmissionServiceError(code, message);
  }
  return trimmed;
}

export function createSubmissionService(repository: SubmissionRepository, taskRepository: TaskRepository) {
  return {
    async listAll() {
      return repository.findAll();
    },

    async listForSubmitter(userId: string) {
      return repository.findBySubmittedBy(userId);
    },

    async listForTask(taskId: string) {
      return repository.findByTaskId(taskId);
    },

    async getById(submissionId: string) {
      const submission = await repository.findById(submissionId);
      if (!submission) {
        throw new SubmissionServiceError("NOT_FOUND", "Submission not found", 404);
      }
      return submission;
    },

    async createSubmission(input: CreateSubmissionInput) {
      if (!input.taskId) throw new SubmissionServiceError("INVALID_TASK", "Task id is required");
      if (!input.submittedBy) throw new SubmissionServiceError("INVALID_SUBMITTER", "Submitted by user id is required");

      const task = await taskRepository.findById(input.taskId);
      if (!task) {
        throw new SubmissionServiceError("TASK_NOT_FOUND", "Task not found", 404);
      }
      if (task.assignedTo !== input.submittedBy) {
        throw new SubmissionServiceError("FORBIDDEN", "Only the assigned assistant can submit this task", 403);
      }
      if (!submittableTaskStatuses.has(task.status)) {
        throw new SubmissionServiceError("INVALID_TASK_STATUS", "Only in-progress or revision-requested tasks can be submitted");
      }

      const version = (await repository.getLatestVersionForTask(input.taskId)) + 1;
      const submission = await repository.createSubmission({
        taskId: input.taskId,
        submittedBy: input.submittedBy,
        fileUrl: assertUrl(input.fileUrl, "INVALID_FILE_URL", "Submission fileUrl is required"),
        previewUrl: input.previewUrl ? assertUrl(input.previewUrl, "INVALID_PREVIEW_URL", "Submission previewUrl is invalid") : undefined,
        note: normalizeOptionalText(input.note, "Submission note"),
        version,
        status: "PENDING_MANGAKA_REVIEW"
      });

      await taskRepository.updateTask(input.taskId, {
        status: "SUBMITTED",
        submittedAt: new Date().toISOString()
      });

      return submission;
    }
  };
}

export type SubmissionService = ReturnType<typeof createSubmissionService>;
