import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../../app.js";
import type { AuthVerifier } from "../auth/auth.middleware.js";
import type { AuthUser, SystemRole, UserRepository } from "../auth/auth.service.js";
import type { Series, SeriesRepository } from "../series/series.service.js";
import type { TaskRepository } from "../task/task.repository.js";
import type { CreateTaskInput, Task, UpdateTaskInput } from "../task/task.service.js";
import type { SubmissionRepository } from "./submission.repository.js";
import type { CreateSubmissionRecord, Submission } from "./submission.service.js";

const now = "2026-06-03T00:00:00.000Z";
const seriesId = "507f1f77bcf86cd799439391";
const chapterId = "507f1f77bcf86cd799439392";
const pageId = "507f1f77bcf86cd799439393";
const ownerId = "507f1f77bcf86cd799439394";
const editorId = "507f1f77bcf86cd799439395";
const assistantId = "507f1f77bcf86cd799439396";
const strangerId = "507f1f77bcf86cd799439397";
const adminId = "507f1f77bcf86cd799439398";

function createAuthUser(clerkId: string, id: string, systemRole: SystemRole): AuthUser {
  return {
    id,
    clerkId,
    email: `${clerkId}@example.com`,
    fullName: clerkId,
    avatarUrl: null,
    systemRole,
    requestedSystemRole: null,
    status: "ACTIVE",
    createdAt: now,
    updatedAt: now
  };
}

const owner = createAuthUser("clerk_submission_owner", ownerId, "MANGAKA");
const editor = createAuthUser("clerk_submission_editor", editorId, "EDITOR");
const assistant = createAuthUser("clerk_submission_assistant", assistantId, "ASSISTANT");
const stranger = createAuthUser("clerk_submission_stranger", strangerId, "MANGAKA");
const admin = createAuthUser("clerk_submission_admin", adminId, "ADMIN");
const users = [owner, editor, assistant, stranger, admin];

function createVerifier(clerkId: string): AuthVerifier {
  return {
    async verify() {
      return { clerkId, email: `${clerkId}@example.com`, fullName: clerkId, avatarUrl: null };
    }
  };
}

function createUserRepository(): UserRepository {
  const byClerkId = new Map(users.map((user) => [user.clerkId, user]));
  const byId = new Map(users.map((user) => [user.id, user]));
  return {
    async findByClerkId(clerkId) {
      return byClerkId.get(clerkId) ?? null;
    },
    async upsertFromClerk(profile) {
      const existing = byClerkId.get(profile.clerkId);
      if (existing) return existing;
      const created = createAuthUser(profile.clerkId, `user_${profile.clerkId}`, "MANGAKA");
      byClerkId.set(profile.clerkId, created);
      byId.set(created.id, created);
      return created;
    },
    async updateOnboarding() {
      throw new Error("not needed in submission route tests");
    },
    async findById(userId) {
      return byId.get(userId) ?? null;
    }
  };
}

function createSeriesRepository(roleByUserId: Record<string, string | null>): SeriesRepository {
  const series: Series = {
    id: seriesId,
    title: "Submission Series",
    slug: "submission-series",
    description: "Submission tests",
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

function createTask(overrides: Partial<Task> = {}): Task {
  return {
    id: overrides.id ?? "task_1",
    seriesId,
    chapterId,
    pageId,
    regionId: "region_1",
    assignedBy: overrides.assignedBy ?? ownerId,
    assignedTo: overrides.assignedTo ?? assistantId,
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

function createTaskRepository(seed: Task[] = [createTask()]) {
  const tasks = new Map(seed.map((task) => [task.id, task]));
  const repository: TaskRepository = {
    async createTask(data: CreateTaskInput) {
      const task = createTask({ id: `task_${tasks.size + 1}`, ...data });
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
      const updated = { ...current, ...data, updatedAt: now } as Task;
      tasks.set(taskId, updated);
      return updated;
    },
    async deleteTask(taskId) {
      return tasks.delete(taskId);
    }
  };
  return { repository, tasks };
}

function createSubmission(overrides: Partial<Submission> = {}): Submission {
  return {
    id: overrides.id ?? "submission_1",
    taskId: overrides.taskId ?? "task_1",
    submittedBy: overrides.submittedBy ?? assistantId,
    fileUrl: overrides.fileUrl ?? "storage://tasks/task_1/submissions/v1/result.png",
    previewUrl: overrides.previewUrl,
    note: overrides.note,
    version: overrides.version ?? 1,
    status: overrides.status ?? "PENDING_MANGAKA_REVIEW",
    createdAt: now,
    updatedAt: now
  };
}

function createSubmissionRepository(seed: Submission[] = []) {
  const submissions = new Map(seed.map((submission) => [submission.id, submission]));
  const repository: SubmissionRepository = {
    async createSubmission(data: CreateSubmissionRecord) {
      const submission = createSubmission({ id: `submission_${submissions.size + 1}`, ...data });
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
  return { repository, submissions };
}

function createSubmissionApp(
  clerkId: string,
  roleByUserId: Record<string, string | null>,
  seedTasks: Task[] = [createTask()],
  seedSubmissions: Submission[] = []
) {
  const { repository: taskRepository, tasks } = createTaskRepository(seedTasks);
  const { repository: submissionRepository, submissions } = createSubmissionRepository(seedSubmissions);
  const app = createApp({
    authVerifier: createVerifier(clerkId),
    userRepository: createUserRepository(),
    seriesRepository: createSeriesRepository(roleByUserId),
    taskRepository,
    submissionRepository
  });
  return { app, tasks, submissions };
}

describe("submission routes", () => {
  it("lets assigned assistants create versioned submissions and list them by task", async () => {
    const { app, tasks, submissions } = createSubmissionApp(
      assistant.clerkId,
      { [assistantId]: "ASSISTANT", [ownerId]: "OWNER_MANGAKA" },
      [createTask({ id: "task_1", status: "IN_PROGRESS" })],
      [createSubmission({ id: "submission_existing", version: 1 })]
    );

    const createResponse = await request(app)
      .post("/api/tasks/task_1/submissions")
      .set("Authorization", "Bearer valid")
      .send({
        fileUrl: "storage://tasks/task_1/submissions/v2/result.png",
        previewUrl: "https://cdn.example.com/submission-preview.png",
        note: "Ready for review"
      });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.data).toMatchObject({
      taskId: "task_1",
      submittedBy: assistantId,
      version: 2,
      status: "PENDING_MANGAKA_REVIEW"
    });
    expect(tasks.get("task_1")?.status).toBe("SUBMITTED");
    expect(submissions.size).toBe(2);

    const listResponse = await request(app)
      .get("/api/tasks/task_1/submissions")
      .set("Authorization", "Bearer valid");
    expect(listResponse.status).toBe(200);
    expect(listResponse.body.data).toHaveLength(2);
  });

  it("lets series members and admins read visible submissions", async () => {
    const seed = [createSubmission({ id: "submission_1" })];
    const ownerApp = createSubmissionApp(owner.clerkId, { [ownerId]: "OWNER_MANGAKA" }, [createTask()], seed).app;
    const ownerList = await request(ownerApp).get("/api/submissions").set("Authorization", "Bearer valid");
    expect(ownerList.status).toBe(200);
    expect(ownerList.body.data).toHaveLength(1);

    const editorApp = createSubmissionApp(editor.clerkId, { [editorId]: "EDITOR" }, [createTask()], seed).app;
    const detail = await request(editorApp).get("/api/submissions/submission_1").set("Authorization", "Bearer valid");
    expect(detail.status).toBe(200);
    expect(detail.body.data.id).toBe("submission_1");

    const adminApp = createSubmissionApp(admin.clerkId, {}, [createTask()], seed).app;
    const adminList = await request(adminApp).get("/api/submissions").set("Authorization", "Bearer valid");
    expect(adminList.status).toBe(200);
    expect(adminList.body.data).toHaveLength(1);
  });

  it("rejects non-assigned creators, non-members, and invalid task statuses", async () => {
    const ownerApp = createSubmissionApp(owner.clerkId, { [ownerId]: "OWNER_MANGAKA" }).app;
    const ownerCreate = await request(ownerApp)
      .post("/api/tasks/task_1/submissions")
      .set("Authorization", "Bearer valid")
      .send({ fileUrl: "storage://tasks/task_1/submissions/v1/result.png" });
    expect(ownerCreate.status).toBe(403);

    const strangerApp = createSubmissionApp(stranger.clerkId, { [strangerId]: null }, [createTask()], [createSubmission()]).app;
    const strangerRead = await request(strangerApp).get("/api/submissions/submission_1").set("Authorization", "Bearer valid");
    expect(strangerRead.status).toBe(403);

    const todoApp = createSubmissionApp(
      assistant.clerkId,
      { [assistantId]: "ASSISTANT" },
      [createTask({ status: "TODO" })]
    ).app;
    const todoCreate = await request(todoApp)
      .post("/api/tasks/task_1/submissions")
      .set("Authorization", "Bearer valid")
      .send({ fileUrl: "storage://tasks/task_1/submissions/v1/result.png" });
    expect(todoCreate.status).toBe(400);
    expect(todoCreate.body.code).toBe("INVALID_TASK_STATUS");
  });
});
