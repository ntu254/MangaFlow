import { describe, expect, it } from "vitest";
import type { TaskRepository } from "./task.repository.js";
import { createTaskService, type CreateTaskInput, type Task, type UpdateTaskInput } from "./task.service.js";

const now = "2026-06-03T00:00:00.000Z";

function createTask(overrides: Partial<Task> = {}): Task {
  return {
    id: overrides.id ?? "task_1",
    seriesId: overrides.seriesId ?? "series_1",
    chapterId: overrides.chapterId ?? "chapter_1",
    pageId: overrides.pageId ?? "page_1",
    regionId: overrides.regionId,
    assignedBy: overrides.assignedBy ?? "mangaka_1",
    assignedTo: overrides.assignedTo ?? "assistant_1",
    title: overrides.title ?? "Clean speech bubble",
    description: overrides.description ?? "Remove text inside bubble and keep border clean",
    type: overrides.type ?? "CLEANUP",
    priority: overrides.priority ?? "HIGH",
    status: overrides.status ?? "TODO",
    revisionRound: overrides.revisionRound ?? 0,
    baseRate: overrides.baseRate ?? 40,
    bonusAmount: overrides.bonusAmount ?? 0,
    dueDate: overrides.dueDate,
    submittedAt: overrides.submittedAt,
    mangakaApprovedAt: overrides.mangakaApprovedAt,
    editorApprovedAt: overrides.editorApprovedAt,
    createdAt: now,
    updatedAt: now
  };
}

function createRepository(seed: Task[] = []) {
  const tasks = new Map(seed.map((task) => [task.id, task]));
  const repository: TaskRepository = {
    async createTask(data: CreateTaskInput) {
      const task = createTask({
        id: `task_${tasks.size + 1}`,
        ...data,
        priority: data.priority ?? "MEDIUM",
        status: "TODO",
        revisionRound: 0,
        baseRate: data.baseRate ?? 0,
        bonusAmount: data.bonusAmount ?? 0
      });
      tasks.set(task.id, task);
      return task;
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
      const updated = {
        ...current,
        ...Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined)),
        updatedAt: now
      } as Task;
      if (data.dueDate === null) updated.dueDate = undefined;
      tasks.set(taskId, updated);
      return updated;
    },
    async deleteTask(taskId) {
      return tasks.delete(taskId);
    }
  };
  return { repository, tasks };
}

const validInput: CreateTaskInput = {
  seriesId: "series_1",
  chapterId: "chapter_1",
  pageId: "page_1",
  regionId: "region_1",
  assignedBy: "mangaka_1",
  assignedTo: "assistant_1",
  title: "Clean speech bubble",
  description: "Remove text inside bubble and keep border clean",
  type: "CLEANUP",
  priority: "HIGH",
  baseRate: 40,
  bonusAmount: 5,
  dueDate: "2026-07-01T00:00:00.000Z"
};

describe("task service", () => {
  it("creates tasks with defaults and valid assignment metadata", async () => {
    const { repository } = createRepository();
    const service = createTaskService(repository);

    await expect(service.createTask({ ...validInput, priority: undefined, baseRate: undefined })).resolves.toMatchObject({
      status: "TODO",
      priority: "MEDIUM",
      revisionRound: 0,
      baseRate: 0
    });
  });

  it("rejects invalid task fields", async () => {
    const { repository } = createRepository();
    const service = createTaskService(repository);

    await expect(service.createTask({ ...validInput, title: " " })).rejects.toMatchObject({ code: "INVALID_TITLE" });
    await expect(service.createTask({ ...validInput, type: "BUBBLE" as "CLEANUP" })).rejects.toMatchObject({
      code: "INVALID_TASK_TYPE"
    });
    await expect(service.createTask({ ...validInput, baseRate: -1 })).rejects.toMatchObject({ code: "INVALID_RATE" });
    await expect(service.createTask({ ...validInput, dueDate: "not-a-date" })).rejects.toMatchObject({
      code: "INVALID_DUE_DATE"
    });
  });

  it("starts only assigned TODO tasks and rejects invalid transitions", async () => {
    const { repository } = createRepository([createTask({ id: "task_todo" }), createTask({ id: "task_submitted", status: "SUBMITTED" })]);
    const service = createTaskService(repository);

    await expect(service.startTask("task_todo", "assistant_1")).resolves.toMatchObject({ status: "IN_PROGRESS" });
    await expect(service.startTask("task_todo", "other_assistant")).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(service.startTask("task_submitted", "assistant_1")).rejects.toMatchObject({
      code: "INVALID_STATUS_TRANSITION"
    });
  });

  it("updates metadata and blocks deletion after submitted workflow states", async () => {
    const { repository, tasks } = createRepository([createTask({ id: "task_edit" }), createTask({ id: "task_locked", status: "SUBMITTED" })]);
    const service = createTaskService(repository);

    await expect(service.updateTask("task_edit", { priority: "URGENT", dueDate: null })).resolves.toMatchObject({
      priority: "URGENT",
      dueDate: undefined
    });
    await expect(service.deleteTask("task_locked")).rejects.toMatchObject({ code: "INVALID_STATUS" });
    await expect(service.deleteTask("task_edit")).resolves.toBe(true);
    expect(tasks.has("task_edit")).toBe(false);
  });
});
