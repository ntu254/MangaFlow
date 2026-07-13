import { asyncRoute, created, ok } from "../../../lib/http.js";
import type { AuthedRequest } from "../../../types.js";
import { parseBody } from "../../../validators/common.js";
import { createStudioTaskSchema, patchStudioTaskSchema } from "../../../validators/studio.schema.js";
import {
  createTask as createTaskCommand,
  getTaskDetail as getTaskDetailQuery,
  patchTask as patchTaskCommand,
  patchTaskByBody,
  runTaskAction,
} from "../application/task-production.service.js";

export const createTask = asyncRoute(async (req: AuthedRequest, res) => {
  const body = parseBody(createStudioTaskSchema, req);
  created(res, await createTaskCommand(req, body));
});

export const patchTasks = asyncRoute(async (req: AuthedRequest, res) => {
  ok(res, await patchTaskByBody(req, req.body));
});

export const patchTask = asyncRoute(async (req: AuthedRequest, res) => {
  const body = parseBody(patchStudioTaskSchema, req);
  ok(res, await patchTaskCommand(req, String(req.params.id), body));
});

export const getTaskDetail = asyncRoute(async (req: AuthedRequest, res) => {
  ok(res, await getTaskDetailQuery(req, String(req.params.taskId)));
});

export const getTaskDetailAlias = getTaskDetail;

export const taskAction = asyncRoute(async (req: AuthedRequest, res) => {
  ok(res, await runTaskAction(req, String(req.params.taskId), String(req.params.action), req.body));
});
