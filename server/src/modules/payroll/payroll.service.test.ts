import { describe, expect, it } from "vitest";
import type { SeriesRepository } from "../series/series.service.js";
import type { TaskRepository } from "../task/task.repository.js";
import type { CreateTaskInput, Task, UpdateTaskInput } from "../task/task.service.js";
import type { PayrollRepository } from "./payroll.repository.js";
import {
  createPayrollService,
  type AssistantEarning,
  type CreateAssistantEarningRecord,
  type CreateTaskRateInput,
  type TaskRate,
  type UpdateAssistantEarningRecord,
  type UpdateTaskRateInput
} from "./payroll.service.js";

const now = "2026-06-03T00:00:00.000Z";
const dueDate = "2026-06-05T00:00:00.000Z";

function createTask(overrides: Partial<Task> = {}): Task {
  return {
    id: overrides.id ?? "task_1",
    seriesId: overrides.seriesId ?? "series_1",
    chapterId: "chapter_1",
    pageId: "page_1",
    regionId: "region_1",
    assignedBy: "mangaka_1",
    assignedTo: "assistant_1",
    title: "Clean panel",
    description: "Clean panel result",
    type: overrides.type ?? "CLEANUP",
    priority: "HIGH",
    status: overrides.status ?? "EDITOR_APPROVED",
    revisionRound: overrides.revisionRound ?? 0,
    baseRate: overrides.baseRate ?? 40,
    bonusAmount: 0,
    dueDate: overrides.dueDate ?? dueDate,
    submittedAt: overrides.submittedAt ?? "2026-06-03T12:00:00.000Z",
    editorApprovedAt: overrides.editorApprovedAt ?? "2026-06-04T00:00:00.000Z",
    createdAt: now,
    updatedAt: now
  };
}

function createRepositories(seedTasks: Task[] = [createTask()], seedRates: TaskRate[] = []) {
  const tasks = new Map(seedTasks.map((task) => [task.id, task]));
  const taskRates = new Map(seedRates.map((rate) => [rate.id, rate]));
  const earnings = new Map<string, AssistantEarning>();

  const taskRepository: TaskRepository = {
    async createTask(_data: CreateTaskInput) {
      throw new Error("not needed in payroll service tests");
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

  const payrollRepository: PayrollRepository = {
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
    async findEarningsByAssistant(assistantId) {
      return [...earnings.values()].filter((earning) => earning.assistantId === assistantId);
    },
    async findEarningsBySeries(seriesId) {
      return [...earnings.values()].filter((earning) => earning.seriesId === seriesId);
    },
    async updateEarning(earningId, input: UpdateAssistantEarningRecord) {
      const current = earnings.get(earningId);
      if (!current) return null;
      const updated = { ...current, ...input, updatedAt: now } as AssistantEarning;
      earnings.set(earningId, updated);
      return updated;
    }
  };

  const seriesRepository: SeriesRepository = {
    async createSeries() {
      throw new Error("not needed");
    },
    async findSeriesById() {
      return null;
    },
    async findSeriesBySlug() {
      return null;
    },
    async listSeriesForUser() {
      return [];
    },
    async updateSeries() {
      return null;
    },
    async deleteSeries() {
      return false;
    },
    async getSeriesMemberRole() {
      return "OWNER_MANGAKA";
    }
  };

  return { taskRepository, payrollRepository, seriesRepository, taskRates, earnings };
}

describe("payroll service", () => {
  it("creates task rates and calculates early bonus earnings from active rates", async () => {
    const { taskRepository, payrollRepository, seriesRepository } = createRepositories(
      [createTask()],
      [
        {
          id: "rate_1",
          taskType: "CLEANUP",
          rate: 100,
          currency: "POINT",
          isActive: true,
          createdAt: now,
          updatedAt: now
        }
      ]
    );
    const service = createPayrollService(payrollRepository, taskRepository, seriesRepository);

    const earning = await service.calculateTaskEarning("task_1");
    expect(earning).toMatchObject({
      assistantId: "assistant_1",
      taskType: "CLEANUP",
      basePayment: 100,
      bonusRate: 0.1,
      bonusAmount: 10,
      penaltyAmount: 0,
      finalPayment: 110,
      timingStatus: "EARLY",
      status: "PENDING"
    });
  });

  it("calculates late-within-24h penalty and falls back to task baseRate", async () => {
    const { taskRepository, payrollRepository, seriesRepository } = createRepositories([
      createTask({
        submittedAt: "2026-06-05T12:00:00.000Z",
        baseRate: 80
      })
    ]);
    const service = createPayrollService(payrollRepository, taskRepository, seriesRepository);

    const earning = await service.calculateTaskEarning("task_1");
    expect(earning).toMatchObject({
      basePayment: 80,
      bonusRate: -0.05,
      bonusAmount: 0,
      penaltyAmount: 4,
      finalPayment: 76,
      timingStatus: "LATE_WITHIN_24H"
    });
  });

  it("blocks rejected or unapproved tasks", async () => {
    const rejected = createRepositories([createTask({ status: "REJECTED" })]);
    const rejectedService = createPayrollService(rejected.payrollRepository, rejected.taskRepository, rejected.seriesRepository);
    await expect(rejectedService.calculateTaskEarning("task_1")).rejects.toMatchObject({ code: "REJECTED_TASK" });

    const todo = createRepositories([createTask({ status: "TODO" })]);
    const todoService = createPayrollService(todo.payrollRepository, todo.taskRepository, todo.seriesRepository);
    await expect(todoService.calculateTaskEarning("task_1")).rejects.toMatchObject({ code: "TASK_NOT_APPROVED" });
  });

  it("confirms pending earnings and lets admins mark confirmed earnings paid", async () => {
    const { taskRepository, payrollRepository, seriesRepository } = createRepositories();
    const service = createPayrollService(payrollRepository, taskRepository, seriesRepository);
    const calculated = await service.calculateTaskEarning("task_1");

    const confirmed = await service.confirmTaskEarning("task_1");
    expect(confirmed.status).toBe("CONFIRMED");

    const paid = await service.markPaid(calculated.id);
    expect(paid.status).toBe("PAID");
    await expect(service.markPaid(calculated.id)).rejects.toMatchObject({ code: "INVALID_EARNING_STATUS" });
  });

  it("updates and deactivates task rates", async () => {
    const { taskRepository, payrollRepository, seriesRepository } = createRepositories();
    const service = createPayrollService(payrollRepository, taskRepository, seriesRepository);

    const rate = await service.createTaskRate({ taskType: "INKING", rate: 80 });
    expect(rate.currency).toBe("POINT");

    const updated = await service.updateTaskRate(rate.id, { rate: 90, currency: "USD" });
    expect(updated).toMatchObject({ rate: 90, currency: "USD" });

    const deactivated = await service.deactivateTaskRate(rate.id);
    expect(deactivated.isActive).toBe(false);
  });
});
