import type { TaskRepository } from "./task.repository.js";
import type { TaskPriority, TaskStatus, TaskType } from "./task.model.js";

export type Task = {
  id: string;
  seriesId: string;
  chapterId: string;
  pageId: string;
  regionId?: string;
  assignedBy: string;
  assignedTo: string;
  title: string;
  description: string;
  type: TaskType;
  priority: TaskPriority;
  status: TaskStatus;
  revisionRound: number;
  baseRate: number;
  bonusAmount: number;
  dueDate?: string;
  submittedAt?: string;
  mangakaApprovedAt?: string;
  editorApprovedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateTaskInput = {
  seriesId: string;
  chapterId: string;
  pageId: string;
  regionId?: string;
  assignedBy: string;
  assignedTo: string;
  title: string;
  description: string;
  type: TaskType;
  priority?: TaskPriority;
  baseRate?: number;
  bonusAmount?: number;
  dueDate?: string;
};

export type UpdateTaskInput = {
  assignedTo?: string;
  title?: string;
  description?: string;
  type?: TaskType;
  priority?: TaskPriority;
  baseRate?: number;
  bonusAmount?: number;
  dueDate?: string | null;
  status?: TaskStatus;
  submittedAt?: string;
};

export class TaskServiceError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode = 400
  ) {
    super(message);
  }
}

const taskTypes = new Set<TaskType>(["BACKGROUND", "INKING", "SCREENTONE", "CLEANUP", "EFFECT", "OTHER"]);
const taskPriorities = new Set<TaskPriority>(["LOW", "MEDIUM", "HIGH", "URGENT"]);
const taskStatuses = new Set<TaskStatus>([
  "TODO",
  "IN_PROGRESS",
  "SUBMITTED",
  "REVISION_REQUESTED",
  "MANGAKA_APPROVED",
  "EDITOR_APPROVED",
  "REJECTED"
]);
const deletableStatuses = new Set<TaskStatus>(["TODO", "IN_PROGRESS", "REVISION_REQUESTED"]);

function assertNonEmpty(value: string | undefined, code: string, message: string, max = 240) {
  const trimmed = value?.trim();
  if (!trimmed) {
    throw new TaskServiceError(code, message);
  }
  if (trimmed.length > max) {
    throw new TaskServiceError(code, `${message} (${max} characters max)`);
  }
  return trimmed;
}

function assertEnum<T extends string>(value: T | undefined, allowed: Set<T>, code: string, message: string) {
  if (!value || !allowed.has(value)) {
    throw new TaskServiceError(code, message);
  }
  return value;
}

function normalizeMoney(value: number | undefined, field: string) {
  if (value === undefined) return 0;
  if (!Number.isFinite(value) || value < 0) {
    throw new TaskServiceError("INVALID_RATE", `${field} must be a non-negative number`);
  }
  return value;
}

function normalizeDueDate(value: string | null | undefined) {
  if (value === null || value === undefined || value === "") return value;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new TaskServiceError("INVALID_DUE_DATE", "Due date must be a valid date");
  }
  return date.toISOString();
}

function assertIds(input: Pick<CreateTaskInput, "seriesId" | "chapterId" | "pageId" | "assignedBy" | "assignedTo">) {
  if (!input.seriesId) throw new TaskServiceError("INVALID_SERIES", "Series id is required");
  if (!input.chapterId) throw new TaskServiceError("INVALID_CHAPTER", "Chapter id is required");
  if (!input.pageId) throw new TaskServiceError("INVALID_PAGE", "Page id is required");
  if (!input.assignedBy) throw new TaskServiceError("INVALID_ASSIGNED_BY", "Assigned by user id is required");
  if (!input.assignedTo) throw new TaskServiceError("INVALID_ASSIGNED_TO", "Assigned to user id is required");
}

export function createTaskService(repository: TaskRepository) {
  return {
    async createTask(input: CreateTaskInput) {
      assertIds(input);
      return repository.createTask({
        ...input,
        title: assertNonEmpty(input.title, "INVALID_TITLE", "Task title is required"),
        description: assertNonEmpty(input.description, "INVALID_DESCRIPTION", "Task description is required", 2000),
        type: assertEnum(input.type, taskTypes, "INVALID_TASK_TYPE", "Invalid task type"),
        priority: input.priority ? assertEnum(input.priority, taskPriorities, "INVALID_PRIORITY", "Invalid priority") : "MEDIUM",
        baseRate: normalizeMoney(input.baseRate, "Base rate"),
        bonusAmount: normalizeMoney(input.bonusAmount, "Bonus amount"),
        dueDate: normalizeDueDate(input.dueDate) ?? undefined
      });
    },

    async listForAssistant(userId: string) {
      return repository.findByAssignedTo(userId);
    },

    async listForSeries(seriesIds: string[]) {
      return repository.findBySeriesIds(seriesIds);
    },

    async listAll() {
      return repository.findAll();
    },

    async getById(taskId: string) {
      const task = await repository.findById(taskId);
      if (!task) {
        throw new TaskServiceError("NOT_FOUND", "Task not found", 404);
      }
      return task;
    },

    async updateTask(taskId: string, input: UpdateTaskInput) {
      await this.getById(taskId);
      const update: UpdateTaskInput = {};
      if (input.assignedTo !== undefined) update.assignedTo = input.assignedTo;
      if (input.title !== undefined) update.title = assertNonEmpty(input.title, "INVALID_TITLE", "Task title is required");
      if (input.description !== undefined) update.description = assertNonEmpty(input.description, "INVALID_DESCRIPTION", "Task description is required", 2000);
      if (input.type !== undefined) update.type = assertEnum(input.type, taskTypes, "INVALID_TASK_TYPE", "Invalid task type");
      if (input.priority !== undefined) update.priority = assertEnum(input.priority, taskPriorities, "INVALID_PRIORITY", "Invalid priority");
      if (input.status !== undefined) update.status = assertEnum(input.status, taskStatuses, "INVALID_STATUS", "Invalid task status");
      if (input.baseRate !== undefined) update.baseRate = normalizeMoney(input.baseRate, "Base rate");
      if (input.bonusAmount !== undefined) update.bonusAmount = normalizeMoney(input.bonusAmount, "Bonus amount");
      if (input.dueDate !== undefined) update.dueDate = normalizeDueDate(input.dueDate);
      if (input.submittedAt !== undefined) update.submittedAt = normalizeDueDate(input.submittedAt) ?? undefined;

      const updated = await repository.updateTask(taskId, update);
      if (!updated) {
        throw new TaskServiceError("NOT_FOUND", "Task not found for update", 404);
      }
      return updated;
    },

    async startTask(taskId: string, assistantUserId: string) {
      const task = await this.getById(taskId);
      if (task.assignedTo !== assistantUserId) {
        throw new TaskServiceError("FORBIDDEN", "Only the assigned assistant can start this task", 403);
      }
      if (task.status !== "TODO") {
        throw new TaskServiceError("INVALID_STATUS_TRANSITION", "Only TODO tasks can be started");
      }
      const updated = await repository.updateTask(taskId, { status: "IN_PROGRESS" });
      if (!updated) {
        throw new TaskServiceError("NOT_FOUND", "Task not found for start", 404);
      }
      return updated;
    },

    async deleteTask(taskId: string) {
      const task = await this.getById(taskId);
      if (!deletableStatuses.has(task.status)) {
        throw new TaskServiceError("INVALID_STATUS", "Submitted or reviewed tasks cannot be deleted");
      }
      return repository.deleteTask(taskId);
    }
  };
}

export type TaskService = ReturnType<typeof createTaskService>;
