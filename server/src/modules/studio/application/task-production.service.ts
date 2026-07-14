import { StudioTaskModel, UserModel } from "../../../db/models.js";
import { id, nowIso } from "../../../domain/ids.js";
import { AppError } from "../../../lib/http.js";
import { audit } from "../../../services/audit.service.js";
import { applyTaskAction } from "../../../services/workflow.service.js";
import { assertCanReadTask } from "../../../services/mvp-access.service.js";
import { patchById, validateAction } from "../../../controllers/helpers.js";
import { sanitizePatch } from "../../../validators/common.js";
import { TASK_ACTIONS } from "../../../types.js";
import type { AuthedRequest } from "../../../types.js";
import {
  assertCanManageStudio,
  rejectWorkflowStatusPatch,
  resolveStudioSeries,
} from "./studio-access.application.js";

async function assertTaskAssignee(series: any, assigneeId: string | undefined) {
  if (!assigneeId) throw new AppError(400, "assigneeId is required.", "VALIDATION_ERROR");
  const assistant = await UserModel.findOne({ id: assigneeId, role: "ASSISTANT", active: true }).lean();
  if (!assistant) throw new AppError(400, "Task assignee must be an active Assistant.", "INVALID_ASSIGNEE");
  if (!Array.isArray(series.assistantIds) || !series.assistantIds.includes(assigneeId)) {
    throw new AppError(403, "Assistant is not assigned to this series.", "ASSISTANT_NOT_IN_SERIES");
  }
  return assistant as any;
}

export async function createTask(req: AuthedRequest, body: any) {
  await assertCanManageStudio(req, body);
  const series = await resolveStudioSeries(body);
  const assistant = await assertTaskAssignee(series as any, body.assigneeId);
  const task = await StudioTaskModel.create({
    id: id("task"),
    ...body,
    seriesId: (series as any).id,
    assigneeId: assistant.id,
    assigneeName: assistant.name,
    status: "TODO",
    createdAt: nowIso(),
    updatedAt: nowIso(),
  });
  await audit(req, "studio_task.create", "task", (task as any).id);
  return task;
}

export async function patchTaskByBody(req: AuthedRequest, body: any) {
  rejectWorkflowStatusPatch(body);
  const taskId = String(body?.id ?? body?.taskId ?? "");
  if (!taskId) throw new AppError(400, "taskId or id is required.", "VALIDATION_ERROR");
  const task = await StudioTaskModel.findOne({ id: taskId }).lean();
  if (!task) throw new AppError(404, "Task not found.", "TASK_NOT_FOUND");
  await assertCanManageStudio(req, task as any);
  const patch = sanitizePatch(body ?? {}, [
    "title",
    "description",
    "instructions",
    "type",
    "priority",
    "dueAt",
    "metadata",
  ]);
  return patchById(req, StudioTaskModel, taskId, "studio_task.update", patch);
}

export async function patchTask(req: AuthedRequest, taskId: string, body: Record<string, unknown>) {
  const allowedFields = [
    "title",
    "description",
    "type",
    "priority",
    "dueAt",
    "metadata",
  ];
  const patch = sanitizePatch(body, allowedFields);
  const task = await StudioTaskModel.findOne({ id: taskId }).lean();
  if (!task) throw new AppError(404, "Task not found.", "TASK_NOT_FOUND");
  await assertCanManageStudio(req, task as any);
  return patchById(req, StudioTaskModel, taskId, "studio_task.update", patch);
}

export function getTaskDetail(req: AuthedRequest, taskId: string) {
  return assertCanReadTask(req.actor!, taskId);
}

export function runTaskAction(req: AuthedRequest, taskId: string, rawAction: string, body: Record<string, unknown>) {
  return applyTaskAction(req, taskId, validateAction(rawAction, TASK_ACTIONS), body);
}
