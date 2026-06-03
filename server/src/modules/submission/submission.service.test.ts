import { describe, expect, it } from "vitest";
import type { TaskRepository } from "../task/task.repository.js";
import type { Task, UpdateTaskInput } from "../task/task.service.js";
import type { SubmissionRepository } from "./submission.repository.js";
import { createSubmissionService, type CreateSubmissionRecord, type Submission } from "./submission.service.js";

const now = "2026-06-03T00:00:00.000Z";

function createTask(overrides: Partial<Task> = {}): Task {
  return {
    id: overrides.id ?? "task_1",
    seriesId: "series_1",
    chapterId: "chapter_1",
    pageId: "page_1",
    regionId: "region_1",
    assignedBy: "mangaka_1",
    assignedTo: "assistant_1",
    title: "Clean panel",
    description: "Clean panel result",
    type: "CLEANUP",
    priority: "HIGH",
    status: overrides.status ?? "IN_PROGRESS",
    revisionRound: 0,
    baseRate: 100,
    bonusAmount: 0,
    createdAt: now,
    updatedAt: now,
    ...overrides
  };
}

function createSubmission(overrides: Partial<Submission> = {}): Submission {
  return {
    id: overrides.id ?? "submission_1",
    taskId: overrides.taskId ?? "task_1",
    submittedBy: overrides.submittedBy ?? "assistant_1",
    fileUrl: overrides.fileUrl ?? "storage://tasks/task_1/submissions/v1/result.png",
    previewUrl: overrides.previewUrl,
    note: overrides.note,
    version: overrides.version ?? 1,
    status: overrides.status ?? "PENDING_MANGAKA_REVIEW",
    createdAt: now,
    updatedAt: now
  };
}

function createRepositories(seedTasks: Task[] = [createTask()], seedSubmissions: Submission[] = []) {
  const tasks = new Map(seedTasks.map((task) => [task.id, task]));
  const submissions = new Map(seedSubmissions.map((submission) => [submission.id, submission]));

  const taskRepository: TaskRepository = {
    async createTask() {
      throw new Error("not needed in submission service tests");
    },
    async findAll() {
      return [...tasks.values()];
    },
    async findByAssignedTo(userId) {
      return [...tasks.values()].filter((task) => task.assignedTo === userId);
    },
    async findBySeriesIds(seriesIds) {
      return [...tasks.values()].filter((task) => seriesIds.includes(task.seriesId));
    },
    async findById(taskId) {
      return tasks.get(taskId) ?? null;
    },
    async updateTask(taskId, data: UpdateTaskInput) {
      const current = tasks.get(taskId);
      if (!current) return null;
      const updated = { ...current, ...data, updatedAt: now } as Task;
      tasks.set(taskId, updated);
      return updated;
    },
    async deleteTask(taskId) {
      return tasks.delete(taskId);
    }
  };

  const submissionRepository: SubmissionRepository = {
    async createSubmission(data: CreateSubmissionRecord) {
      const submission = createSubmission({
        id: `submission_${submissions.size + 1}`,
        ...data
      });
      submissions.set(submission.id, submission);
      return submission;
    },
    async findAll() {
      return [...submissions.values()];
    },
    async findByTaskId(taskId) {
      return [...submissions.values()].filter((submission) => submission.taskId === taskId);
    },
    async findBySubmittedBy(userId) {
      return [...submissions.values()].filter((submission) => submission.submittedBy === userId);
    },
    async findById(submissionId) {
      return submissions.get(submissionId) ?? null;
    },
    async getLatestVersionForTask(taskId) {
      return Math.max(0, ...[...submissions.values()].filter((submission) => submission.taskId === taskId).map((submission) => submission.version));
    }
  };

  return { taskRepository, submissionRepository, tasks, submissions };
}

describe("submission service", () => {
  it("creates immutable versioned submissions and marks the task submitted", async () => {
    const { taskRepository, submissionRepository, tasks } = createRepositories(
      [createTask()],
      [createSubmission({ id: "submission_existing", version: 1 })]
    );
    const service = createSubmissionService(submissionRepository, taskRepository);

    const submission = await service.createSubmission({
      taskId: "task_1",
      submittedBy: "assistant_1",
      fileUrl: "storage://tasks/task_1/submissions/v2/result.png",
      previewUrl: "https://cdn.example.com/preview.png",
      note: "Ready for review"
    });

    expect(submission).toMatchObject({
      taskId: "task_1",
      submittedBy: "assistant_1",
      version: 2,
      status: "PENDING_MANGAKA_REVIEW",
      note: "Ready for review"
    });
    expect(tasks.get("task_1")?.status).toBe("SUBMITTED");
    expect(tasks.get("task_1")?.submittedAt).toBeTruthy();
  });

  it("validates submitter, task status, and file URL", async () => {
    const ready = createRepositories([createTask()]);
    const readyService = createSubmissionService(ready.submissionRepository, ready.taskRepository);
    await expect(
      readyService.createSubmission({
        taskId: "task_1",
        submittedBy: "other_assistant",
        fileUrl: "storage://tasks/task_1/submissions/v1/result.png"
      })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });

    const todo = createRepositories([createTask({ status: "TODO" })]);
    const todoService = createSubmissionService(todo.submissionRepository, todo.taskRepository);
    await expect(
      todoService.createSubmission({
        taskId: "task_1",
        submittedBy: "assistant_1",
        fileUrl: "storage://tasks/task_1/submissions/v1/result.png"
      })
    ).rejects.toMatchObject({ code: "INVALID_TASK_STATUS" });

    await expect(
      readyService.createSubmission({
        taskId: "task_1",
        submittedBy: "assistant_1",
        fileUrl: "not-a-valid-url"
      })
    ).rejects.toMatchObject({ code: "INVALID_FILE_URL" });
  });

  it("lists submissions by task, submitter, and id", async () => {
    const { taskRepository, submissionRepository } = createRepositories(
      [createTask()],
      [
        createSubmission({ id: "submission_1", taskId: "task_1", submittedBy: "assistant_1" }),
        createSubmission({ id: "submission_2", taskId: "task_2", submittedBy: "assistant_2" })
      ]
    );
    const service = createSubmissionService(submissionRepository, taskRepository);

    await expect(service.listForTask("task_1")).resolves.toHaveLength(1);
    await expect(service.listForSubmitter("assistant_2")).resolves.toHaveLength(1);
    await expect(service.getById("submission_1")).resolves.toMatchObject({ id: "submission_1" });
    await expect(service.getById("missing")).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});
