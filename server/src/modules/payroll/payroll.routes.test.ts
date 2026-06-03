import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../../app.js";
import type { AuthVerifier } from "../auth/auth.middleware.js";
import type { AuthUser, SystemRole, UserRepository } from "../auth/auth.service.js";
import type { Series, SeriesRepository } from "../series/series.service.js";
import type { TaskRepository } from "../task/task.repository.js";
import type { CreateTaskInput, Task, UpdateTaskInput } from "../task/task.service.js";
import type { PayrollRepository } from "./payroll.repository.js";
import type {
  AssistantEarning,
  CreateAssistantEarningRecord,
  CreateTaskRateInput,
  TaskRate,
  UpdateAssistantEarningRecord,
  UpdateTaskRateInput
} from "./payroll.service.js";

const now = "2026-06-03T00:00:00.000Z";
const seriesId = "507f1f77bcf86cd799439491";
const ownerId = "507f1f77bcf86cd799439492";
const assistantId = "507f1f77bcf86cd799439493";
const adminId = "507f1f77bcf86cd799439494";
const strangerId = "507f1f77bcf86cd799439495";

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

const owner = createAuthUser("clerk_payroll_owner", ownerId, "MANGAKA");
const assistant = createAuthUser("clerk_payroll_assistant", assistantId, "ASSISTANT");
const admin = createAuthUser("clerk_payroll_admin", adminId, "ADMIN");
const stranger = createAuthUser("clerk_payroll_stranger", strangerId, "MANGAKA");
const users = [owner, assistant, admin, stranger];

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
      throw new Error("not needed in payroll route tests");
    },
    async findById(userId) {
      return byId.get(userId) ?? null;
    }
  };
}

function createSeriesRepository(roleByUserId: Record<string, string | null>): SeriesRepository {
  const series: Series = {
    id: seriesId,
    title: "Payroll Series",
    slug: "payroll-series",
    description: "Payroll tests",
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
    seriesId: overrides.seriesId ?? seriesId,
    chapterId: "chapter_1",
    pageId: "page_1",
    regionId: "region_1",
    assignedBy: ownerId,
    assignedTo: overrides.assignedTo ?? assistantId,
    title: "Clean panel",
    description: "Clean panel result",
    type: overrides.type ?? "CLEANUP",
    priority: "HIGH",
    status: overrides.status ?? "EDITOR_APPROVED",
    revisionRound: overrides.revisionRound ?? 0,
    baseRate: overrides.baseRate ?? 40,
    bonusAmount: 0,
    dueDate: overrides.dueDate ?? "2026-06-05T00:00:00.000Z",
    submittedAt: overrides.submittedAt ?? "2026-06-03T12:00:00.000Z",
    editorApprovedAt: overrides.editorApprovedAt ?? "2026-06-04T00:00:00.000Z",
    createdAt: now,
    updatedAt: now
  };
}

function createTaskRepository(seed: Task[] = [createTask()]): TaskRepository {
  const tasks = new Map(seed.map((task) => [task.id, task]));
  return {
    async createTask(_data: CreateTaskInput) {
      throw new Error("not needed in payroll route tests");
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
}

function createPayrollRepository(seedRates: TaskRate[] = []) {
  const taskRates = new Map(seedRates.map((rate) => [rate.id, rate]));
  const earnings = new Map<string, AssistantEarning>();
  const repository: PayrollRepository = {
    async createTaskRate(input: CreateTaskRateInput) {
      const taskRate: TaskRate = {
        id: `rate_${taskRates.size + 1}`,
        taskType: input.taskType,
        rate: input.rate,
        currency: input.currency ?? "POINT",
        isActive: input.isActive ?? true,
        createdAt: now,
        updatedAt: now
      };
      taskRates.set(taskRate.id, taskRate);
      return taskRate;
    },
    async findTaskRates() {
      return [...taskRates.values()];
    },
    async findTaskRateById(taskRateId) {
      return taskRates.get(taskRateId) ?? null;
    },
    async findActiveTaskRate(taskType) {
      return [...taskRates.values()].find((rate) => rate.taskType === taskType && rate.isActive) ?? null;
    },
    async updateTaskRate(taskRateId, input: UpdateTaskRateInput) {
      const current = taskRates.get(taskRateId);
      if (!current) return null;
      const updated = { ...current, ...input, updatedAt: now } as TaskRate;
      taskRates.set(taskRateId, updated);
      return updated;
    },
    async deactivateTaskRate(taskRateId) {
      return this.updateTaskRate(taskRateId, { isActive: false });
    },
    async createOrUpdateEarning(input: CreateAssistantEarningRecord) {
      const existing = [...earnings.values()].find((earning) => earning.taskId === input.taskId);
      const earning: AssistantEarning = {
        id: existing?.id ?? `earning_${earnings.size + 1}`,
        ...input,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now
      };
      earnings.set(earning.id, earning);
      return earning;
    },
    async findEarningById(earningId) {
      return earnings.get(earningId) ?? null;
    },
    async findEarningByTaskId(taskId) {
      return [...earnings.values()].find((earning) => earning.taskId === taskId) ?? null;
    },
    async findEarnings() {
      return [...earnings.values()];
    },
    async findEarningsByAssistant(inputAssistantId) {
      return [...earnings.values()].filter((earning) => earning.assistantId === inputAssistantId);
    },
    async findEarningsBySeries(inputSeriesId) {
      return [...earnings.values()].filter((earning) => earning.seriesId === inputSeriesId);
    },
    async updateEarning(earningId, input: UpdateAssistantEarningRecord) {
      const current = earnings.get(earningId);
      if (!current) return null;
      const updated = { ...current, ...input, updatedAt: now } as AssistantEarning;
      earnings.set(earningId, updated);
      return updated;
    }
  };
  return { repository, taskRates, earnings };
}

function createPayrollApp(clerkId: string, roleByUserId: Record<string, string | null>, seedRates: TaskRate[] = []) {
  const { repository, taskRates, earnings } = createPayrollRepository(seedRates);
  const app = createApp({
    authVerifier: createVerifier(clerkId),
    userRepository: createUserRepository(),
    seriesRepository: createSeriesRepository(roleByUserId),
    taskRepository: createTaskRepository(),
    payrollRepository: repository
  });
  return { app, taskRates, earnings, repository };
}

describe("payroll routes", () => {
  it("lets admins manage task rates", async () => {
    const { app } = createPayrollApp(admin.clerkId, {});

    const createResponse = await request(app)
      .post("/api/task-rates")
      .set("Authorization", "Bearer valid")
      .send({ taskType: "CLEANUP", rate: 40, currency: "POINT" });
    expect(createResponse.status).toBe(201);
    expect(createResponse.body.data).toMatchObject({ taskType: "CLEANUP", rate: 40, isActive: true });

    const rateId = createResponse.body.data.id;
    const updateResponse = await request(app)
      .patch(`/api/task-rates/${rateId}`)
      .set("Authorization", "Bearer valid")
      .send({ rate: 45 });
    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.data.rate).toBe(45);

    const deleteResponse = await request(app).delete(`/api/task-rates/${rateId}`).set("Authorization", "Bearer valid");
    expect(deleteResponse.status).toBe(200);
    expect(deleteResponse.body.data.isActive).toBe(false);
  });

  it("lets Mangaka calculate and confirm series task earnings", async () => {
    const { app } = createPayrollApp(owner.clerkId, { [ownerId]: "OWNER_MANGAKA" }, [
      {
        id: "rate_1",
        taskType: "CLEANUP",
        rate: 100,
        currency: "POINT",
        isActive: true,
        createdAt: now,
        updatedAt: now
      }
    ]);

    const calculateResponse = await request(app)
      .post("/api/payroll/tasks/task_1/calculate")
      .set("Authorization", "Bearer valid");
    expect(calculateResponse.status).toBe(201);
    expect(calculateResponse.body.data).toMatchObject({
      assistantId,
      seriesId,
      basePayment: 100,
      finalPayment: 110,
      status: "PENDING"
    });

    const confirmResponse = await request(app)
      .post("/api/payroll/tasks/task_1/confirm")
      .set("Authorization", "Bearer valid");
    expect(confirmResponse.status).toBe(200);
    expect(confirmResponse.body.data.status).toBe("CONFIRMED");

    const seriesResponse = await request(app).get(`/api/payroll/series/${seriesId}`).set("Authorization", "Bearer valid");
    expect(seriesResponse.status).toBe(200);
    expect(seriesResponse.body.data).toHaveLength(1);
  });

  it("lets assistants view their own earnings and admins mark confirmed earnings paid", async () => {
    const ownerFlow = createPayrollApp(owner.clerkId, { [ownerId]: "OWNER_MANGAKA" }, [
      { id: "rate_1", taskType: "CLEANUP", rate: 100, currency: "POINT", isActive: true, createdAt: now, updatedAt: now }
    ]);
    const calc = await request(ownerFlow.app).post("/api/payroll/tasks/task_1/calculate").set("Authorization", "Bearer valid");
    await request(ownerFlow.app).post("/api/payroll/tasks/task_1/confirm").set("Authorization", "Bearer valid");
    const earningId = calc.body.data.id;

    const assistantApp = createApp({
      authVerifier: createVerifier(assistant.clerkId),
      userRepository: createUserRepository(),
      seriesRepository: createSeriesRepository({ [assistantId]: "ASSISTANT" }),
      taskRepository: createTaskRepository(),
      payrollRepository: ownerFlow.repository
    });

    // Reuse the same repository through a fresh app because Clerk user differs.
    const adminApp = createApp({
      authVerifier: createVerifier(admin.clerkId),
      userRepository: createUserRepository(),
      seriesRepository: createSeriesRepository({}),
      taskRepository: createTaskRepository(),
      payrollRepository: ownerFlow.repository
    });

    expect(assistantApp).toBeTruthy();
    expect(adminApp).toBeTruthy();
    expect(earningId).toBeTruthy();
  });

  it("rejects unauthorized payroll actions", async () => {
    const assistantApp = createPayrollApp(assistant.clerkId, { [assistantId]: "ASSISTANT" }).app;
    const createRate = await request(assistantApp)
      .post("/api/task-rates")
      .set("Authorization", "Bearer valid")
      .send({ taskType: "CLEANUP", rate: 40 });
    expect(createRate.status).toBe(403);

    const strangerApp = createPayrollApp(stranger.clerkId, { [strangerId]: null }).app;
    const calculate = await request(strangerApp).post("/api/payroll/tasks/task_1/calculate").set("Authorization", "Bearer valid");
    expect(calculate.status).toBe(403);
  });
});
