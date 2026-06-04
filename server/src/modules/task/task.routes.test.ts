import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../../app.js";
import type { AuthVerifier } from "../auth/auth.middleware.js";
import type { AuthUser, SystemRole, UserRepository } from "../auth/auth.service.js";
import type { ChapterRepository } from "../chapter/chapter.repository.js";
import type { Chapter } from "../chapter/chapter.service.js";
import type { PageRepository } from "../page/page.repository.js";
import type { Page } from "../page/page.service.js";
import type { RegionRepository } from "../region/region.repository.js";
import type { CreateRegionInput, Region, UpdateRegionInput } from "../region/region.service.js";
import type { Series, SeriesRepository } from "../series/series.service.js";
import type { TaskRepository } from "./task.repository.js";
import type { CreateTaskInput, Task, UpdateTaskInput } from "./task.service.js";

const now = "2026-06-03T00:00:00.000Z";
const seriesId = "507f1f77bcf86cd799439291";
const chapterId = "507f1f77bcf86cd799439292";
const pageId = "507f1f77bcf86cd799439293";
const ownerId = "507f1f77bcf86cd799439294";
const editorId = "507f1f77bcf86cd799439295";
const assistantId = "507f1f77bcf86cd799439296";
const strangerId = "507f1f77bcf86cd799439297";

function createAuthUser(id: string, systemRole: SystemRole): AuthUser {
  return {
    id,
    email: `${id}@example.com`,
    fullName: id,
    avatarUrl: null,
    systemRole,
    status: "ACTIVE",
    createdAt: now,
    updatedAt: now
  };
}

const owner = createAuthUser(ownerId, "MANGAKA");
const editor = createAuthUser(editorId, "EDITOR");
const assistant = createAuthUser(assistantId, "ASSISTANT");
const stranger = createAuthUser(strangerId, "MANGAKA");
const users = [owner, editor, assistant, stranger];

function createVerifier(id: string, systemRole: SystemRole | null = null): AuthVerifier {
  return {
    async verify() {
      return { sub: id, systemRole, status: "ACTIVE" as const };
    },
    async verifyWithProfile() {
      return { sub: id, email: `${id}@example.com`, fullName: id, avatarUrl: null };
    }
  };
}

function createUserRepository(): UserRepository {
  const byId = new Map(users.map((user) => [user.id, user]));

  return {
    async findById(userId) {
      return byId.get(userId) ?? null;
    },
    async updateOnboarding() {
      throw new Error("not needed in task route tests");
    }
  };
}

function createSeriesRepository(roleByUserId: Record<string, string | null>): SeriesRepository {
  const series: Series = {
    id: seriesId,
    title: "Task Series",
    slug: "task-series",
    description: "Task tests",
    genre: [],
    coverUrl: null,
    ownerId,
    status: "DRAFT",
    publicationType: "WEEKLY",
    createdAt: now,
    updatedAt: now
  };

  return {
    async createSeries() {
      return series;
    },
    async findSeriesById() {
      return series;
    },
    async findSeriesBySlug() {
      return series;
    },
    async listSeriesForUser(userId) {
      return roleByUserId[userId] ? [series] : [];
    },
    async updateSeries() {
      return series;
    },
    async deleteSeries() {
      return false;
    },
    async getSeriesMemberRole(inputSeriesId, userId) {
      if (inputSeriesId !== seriesId) return null;
      return roleByUserId[userId] ?? null;
    }
  };
}

function createChapterRepository(): ChapterRepository {
  const chapter: Chapter = {
    id: chapterId,
    seriesId,
    title: "Task Chapter",
    chapterNumber: 1,
    status: "DRAFT",
    createdAt: now,
    updatedAt: now
  };
  return {
    async createChapter() {
      return chapter;
    },
    async findChaptersBySeries() {
      return [chapter];
    },
    async findById(inputChapterId) {
      return inputChapterId === chapterId ? chapter : null;
    },
    async updateChapter() {
      return chapter;
    },
    async deleteChapter() {
      return false;
    }
  };
}

function createPageRepository(): PageRepository {
  const page: Page = {
    id: pageId,
    chapterId,
    pageNumber: 1,
    originalFileUrl: "storage://task-page.png",
    width: 1200,
    height: 1600,
    currentVersion: 1,
    status: "UPLOADED",
    createdAt: now,
    updatedAt: now
  };
  return {
    async createPage() {
      return page;
    },
    async findPagesByChapter() {
      return [page];
    },
    async findById(inputPageId) {
      return inputPageId === pageId ? page : null;
    },
    async updatePage() {
      return page;
    },
    async deletePage() {
      return false;
    }
  };
}

function createRegion(overrides: Partial<Region> = {}): Region {
  return {
    id: overrides.id ?? "region_1",
    pageId,
    taskId: overrides.taskId,
    type: overrides.type ?? "BUBBLE",
    source: overrides.source ?? "MANUAL",
    shape: overrides.shape ?? "RECTANGLE",
    x: 0.1,
    y: 0.2,
    width: 0.3,
    height: 0.4,
    confidence: overrides.confidence,
    createdBy: ownerId,
    createdAt: now,
    updatedAt: now
  };
}

function createRegionRepository(seed: Region[] = [createRegion()]): RegionRepository {
  const regions = new Map(seed.map((region) => [region.id, region]));
  return {
    async createRegion(data: CreateRegionInput) {
      const region = createRegion({ id: `region_${regions.size + 1}`, ...data });
      regions.set(region.id, region);
      return region;
    },
    async findByPage(inputPageId) {
      return [...regions.values()].filter((region) => region.pageId === inputPageId);
    },
    async findById(regionId) {
      return regions.get(regionId) ?? null;
    },
    async updateRegion(regionId, data: UpdateRegionInput) {
      const current = regions.get(regionId);
      if (!current) return null;
      const updated = { ...current, ...data, updatedAt: now } as Region;
      if (data.taskId === null) updated.taskId = undefined;
      regions.set(regionId, updated);
      return updated;
    },
    async deleteRegion(regionId) {
      return regions.delete(regionId);
    }
  };
}

function createTask(overrides: Partial<Task> = {}): Task {
  return {
    id: overrides.id ?? "task_1",
    seriesId,
    chapterId,
    pageId,
    regionId: overrides.regionId,
    assignedBy: overrides.assignedBy ?? ownerId,
    assignedTo: overrides.assignedTo ?? assistantId,
    title: overrides.title ?? "Clean speech bubble",
    description: overrides.description ?? "Remove text inside bubble and keep border clean",
    type: overrides.type ?? "CLEANUP",
    priority: overrides.priority ?? "HIGH",
    status: overrides.status ?? "TODO",
    revisionRound: 0,
    baseRate: overrides.baseRate ?? 40,
    bonusAmount: overrides.bonusAmount ?? 0,
    dueDate: overrides.dueDate,
    createdAt: now,
    updatedAt: now
  };
}

function createTaskRepository(seed: Task[] = []) {
  const tasks = new Map(seed.map((task) => [task.id, task]));
  const repository: TaskRepository = {
    async createTask(data: CreateTaskInput) {
      const task = createTask({
        id: `task_${tasks.size + 1}`,
        ...data,
        priority: data.priority ?? "MEDIUM",
        status: "TODO",
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

function createTaskApp(userId: string, roleByUserId: Record<string, string | null>, seed: Task[] = []) {
  const { repository, tasks } = createTaskRepository(seed);
  const user = users.find(u => u.id === userId);
  const app = createApp({
    authVerifier: createVerifier(userId, user?.systemRole ?? null),
    userRepository: createUserRepository(),
    seriesRepository: createSeriesRepository(roleByUserId),
    chapterRepository: createChapterRepository(),
    pageRepository: createPageRepository(),
    regionRepository: createRegionRepository(),
    taskRepository: repository
  });
  return { app, tasks };
}

describe("task routes", () => {
  it("lets owner Mangaka create, list, update, fetch, and delete a task", async () => {
    const { app, tasks } = createTaskApp(owner.id, {
      [ownerId]: "OWNER_MANGAKA",
      [assistantId]: "ASSISTANT"
    });

    const createResponse = await request(app)
      .post("/api/tasks")
      .set("Authorization", "Bearer valid")
      .send({
        pageId,
        regionId: "region_1",
        assignedTo: assistantId,
        title: "Clean speech bubble",
        description: "Remove text inside bubble and keep border clean",
        type: "CLEANUP",
        priority: "HIGH",
        baseRate: 40
      });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.data).toMatchObject({
      seriesId,
      chapterId,
      pageId,
      regionId: "region_1",
      assignedBy: ownerId,
      assignedTo: assistantId,
      status: "TODO"
    });

    const taskId = createResponse.body.data.id;
    const listResponse = await request(app).get("/api/tasks").set("Authorization", "Bearer valid");
    expect(listResponse.status).toBe(200);
    expect(listResponse.body.data).toHaveLength(1);

    const detailResponse = await request(app).get(`/api/tasks/${taskId}`).set("Authorization", "Bearer valid");
    expect(detailResponse.status).toBe(200);

    const updateResponse = await request(app)
      .patch(`/api/tasks/${taskId}`)
      .set("Authorization", "Bearer valid")
      .send({ priority: "URGENT" });
    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.data.priority).toBe("URGENT");

    const deleteResponse = await request(app).delete(`/api/tasks/${taskId}`).set("Authorization", "Bearer valid");
    expect(deleteResponse.status).toBe(200);
    expect(deleteResponse.body.data.deleted).toBe(true);
    expect(tasks.has(taskId)).toBe(false);
  });

  it("lets assigned assistants list, fetch, and start their tasks only", async () => {
    const seed = [createTask({ id: "task_assigned", assignedTo: assistantId })];
    const { app } = createTaskApp(assistant.id, { [assistantId]: "ASSISTANT" }, seed);

    const listResponse = await request(app).get("/api/tasks").set("Authorization", "Bearer valid");
    expect(listResponse.status).toBe(200);
    expect(listResponse.body.data).toHaveLength(1);

    const startResponse = await request(app).post("/api/tasks/task_assigned/start").set("Authorization", "Bearer valid");
    expect(startResponse.status).toBe(200);
    expect(startResponse.body.data.status).toBe("IN_PROGRESS");
  });

  it("allows assigned editors to create tasks and region create-task maps bubble to OTHER", async () => {
    const { app } = createTaskApp(editor.id, {
      [editorId]: "EDITOR",
      [assistantId]: "ASSISTANT"
    });

    const response = await request(app)
      .post("/api/regions/region_1/create-task")
      .set("Authorization", "Bearer valid")
      .send({
        assignedTo: assistantId,
        title: "Handle bubble cleanup",
        description: "Clean and prepare the bubble area",
        priority: "MEDIUM"
      });

    expect(response.status).toBe(201);
    expect(response.body.data).toMatchObject({
      regionId: "region_1",
      type: "OTHER",
      assignedBy: editorId
    });
  });

  it("rejects non-members and invalid assistant assignees", async () => {
    const strangerApp = createTaskApp(stranger.id, { [strangerId]: null }).app;
    const forbiddenResponse = await request(strangerApp)
      .post("/api/tasks")
      .set("Authorization", "Bearer valid")
      .send({
        pageId,
        assignedTo: assistantId,
        title: "Blocked",
        description: "Blocked",
        type: "CLEANUP"
      });
    expect(forbiddenResponse.status).toBe(403);

    const ownerApp = createTaskApp(owner.id, { [ownerId]: "OWNER_MANGAKA" }).app;
    const invalidAssigneeResponse = await request(ownerApp)
      .post("/api/tasks")
      .set("Authorization", "Bearer valid")
      .send({
        pageId,
        assignedTo: ownerId,
        title: "Bad assignee",
        description: "Cannot assign to Mangaka",
        type: "CLEANUP"
      });
    expect(invalidAssigneeResponse.status).toBe(400);
    expect(invalidAssigneeResponse.body.code).toBe("INVALID_ASSIGNEE");
  });
});

