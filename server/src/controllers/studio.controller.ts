import { asyncRoute, created, ok, AppError } from "../lib/http.js";
import {
  ChapterModel,
  SeriesModel,
  StudioRegionModel,
  StudioTaskModel,
  StudioCommentModel,
  UserModel,
} from "../db/models.js";
import { id, nowIso } from "../domain/ids.js";
import { audit, notify } from "../services/audit.service.js";
import {
  applyTaskAction,
  sendChapterToEditorReview,
  taskDetail,
} from "../services/workflow.service.js";
import {
  requireActor,
  filterFromQuery,
  createLoose,
  patchById,
  paginated,
  validateAction,
} from "./helpers.js";
import { parseBody, sanitizePatch } from "../validators/common.js";
import {
  createRegionSchema,
  patchRegionSchema,
  createStudioTaskSchema,
  patchStudioTaskSchema,
  createCommentSchema,
  patchCommentSchema,
} from "../validators/studio.schema.js";
import { TASK_ACTIONS } from "../types.js";
import type { AuthedRequest } from "../types.js";

function rejectWorkflowStatusPatch(body: unknown) {
  if (body && typeof body === "object" && ("status" in body || "state" in body)) {
    throw new AppError(
      400,
      "Status cannot be changed directly. Use the appropriate action endpoint.",
      "VALIDATION_ERROR",
    );
  }
}

async function resolveStudioSeries(input: {
  seriesId?: string;
  chapterId?: string;
  pageId?: string;
}) {
  if (input.seriesId) return SeriesModel.findOne({ id: input.seriesId }).lean();
  if (input.chapterId) {
    const chapter = await ChapterModel.findOne({ id: input.chapterId }).lean();
    return chapter ? SeriesModel.findOne({ id: (chapter as any).seriesId }).lean() : null;
  }
  if (input.pageId) {
    const chapter = await ChapterModel.findOne({ "pages.id": input.pageId }).lean();
    return chapter ? SeriesModel.findOne({ id: (chapter as any).seriesId }).lean() : null;
  }
  return null;
}

async function assertCanManageStudio(req: AuthedRequest, input: {
  seriesId?: string;
  chapterId?: string;
  pageId?: string;
}) {
  const actor = requireActor(req);
  const series = await resolveStudioSeries(input);
  if (!series) throw new AppError(404, "Series not found for this Studio record.", "SERIES_NOT_FOUND");
  const allowed = actor.role === "MANGAKA" && (series as any).authorId === actor.id;
  if (!allowed) {
    throw new AppError(
      403,
      "Only the owning Mangaka can manage production regions and tasks.",
      "MANGAKA_OWNER_REQUIRED",
    );
  }
}

async function assertTaskAssignee(series: any, assigneeId: string | undefined) {
  if (!assigneeId) throw new AppError(400, "assigneeId is required.", "VALIDATION_ERROR");
  const assistant = await UserModel.findOne({ id: assigneeId, role: "ASSISTANT", active: true }).lean();
  if (!assistant) throw new AppError(400, "Task assignee must be an active Assistant.", "INVALID_ASSIGNEE");
  if (!Array.isArray(series.assistantIds) || !series.assistantIds.includes(assigneeId)) {
    throw new AppError(403, "Assistant is not assigned to this series.", "ASSISTANT_NOT_IN_SERIES");
  }
  return assistant as any;
}

// Regions
export const listRegions = asyncRoute(async (req: AuthedRequest, res) =>
  paginated(req, res, StudioRegionModel, filterFromQuery(req), { updatedAt: -1 }),
);
export const createRegion = asyncRoute(async (req: AuthedRequest, res) => {
  const body = parseBody(createRegionSchema, req);
  await assertCanManageStudio(req, body);
  created(res, await createLoose(req, StudioRegionModel, "region", "studio_region.create"));
});
export const patchRegions = asyncRoute(async (req: AuthedRequest, res) => {
  rejectWorkflowStatusPatch(req.body);
  const id = String(req.body?.id ?? req.body?.regionId ?? "");
  if (!id) throw new AppError(400, "regionId or id is required.", "VALIDATION_ERROR");
  const region = await StudioRegionModel.findOne({ id }).lean();
  if (!region) throw new AppError(404, "Region not found.", "REGION_NOT_FOUND");
  await assertCanManageStudio(req, region as any);
  const patch = sanitizePatch(req.body ?? {}, ["type", "x", "y", "width", "height", "label", "metadata"], {
    rejectStatus: false,
  });
  ok(res, await patchById(req, StudioRegionModel, id, "studio_region.update", patch));
});
export const patchRegion = asyncRoute(async (req: AuthedRequest, res) => {
  const body = parseBody(patchRegionSchema, req);
  rejectWorkflowStatusPatch(body);
  const allowedFields = [
    "type",
    "x",
    "y",
    "width",
    "height",
    "label",
    "metadata",
  ];
  const patch = sanitizePatch(body as Record<string, unknown>, allowedFields, {
    rejectStatus: false,
  });
  const region = await StudioRegionModel.findOne({ id: String(req.params.id) }).lean();
  if (!region) throw new AppError(404, "Region not found.", "REGION_NOT_FOUND");
  await assertCanManageStudio(req, region as any);
  ok(
    res,
    await patchById(req, StudioRegionModel, String(req.params.id), "studio_region.update", patch),
  );
});
export const deleteRegion = asyncRoute(async (req: AuthedRequest, res) => {
  const id = String(req.params.id);
  const region = await StudioRegionModel.findOne({ id }).lean();
  if (!region) throw new AppError(404, "Region not found.", "REGION_NOT_FOUND");
  await assertCanManageStudio(req, region as any);
  await StudioRegionModel.deleteOne({ id });
  await audit(req, "studio_region.delete", "region", id);
  ok(res, { id });
});

// Tasks
export const listTasks = asyncRoute(async (req: AuthedRequest, res) => {
  const filter = filterFromQuery(req);
  if (req.actor?.role === "ASSISTANT") {
    filter.assigneeId = req.actor.id;
  }
  await paginated(req, res, StudioTaskModel, filter, { updatedAt: -1 });
});
export const createTask = asyncRoute(async (req: AuthedRequest, res) => {
  const body = parseBody(createStudioTaskSchema, req);
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
  await notify(
    assistant.id,
    "task.assigned",
    `You were assigned to ${task.title ?? "a production task"}.`,
    "Task assigned",
  );
  created(res, task);
});
export const patchTasks = asyncRoute(async (req: AuthedRequest, res) => {
  rejectWorkflowStatusPatch(req.body);
  const id = String(req.body?.id ?? req.body?.taskId ?? "");
  if (!id) throw new AppError(400, "taskId or id is required.", "VALIDATION_ERROR");
  const task = await StudioTaskModel.findOne({ id }).lean();
  if (!task) throw new AppError(404, "Task not found.", "TASK_NOT_FOUND");
  await assertCanManageStudio(req, task as any);
  const patch = sanitizePatch(req.body ?? {}, ["title", "description", "instructions", "type", "priority", "dueAt", "metadata"]);
  ok(res, await patchById(req, StudioTaskModel, id, "studio_task.update", patch));
});
export const patchTask = asyncRoute(async (req: AuthedRequest, res) => {
  const body = parseBody(patchStudioTaskSchema, req);
  const allowedFields = [
    "title",
    "description",
    "type",
    "priority",
    "dueAt",
    "metadata",
  ];
  const patch = sanitizePatch(body as Record<string, unknown>, allowedFields);
  const task = await StudioTaskModel.findOne({ id: String(req.params.id) }).lean();
  if (!task) throw new AppError(404, "Task not found.", "TASK_NOT_FOUND");
  await assertCanManageStudio(req, task as any);
  ok(
    res,
    await patchById(req, StudioTaskModel, String(req.params.id), "studio_task.update", patch),
  );
});
export const getTaskDetail = asyncRoute(async (req: AuthedRequest, res) =>
  ok(res, await taskDetail(req, String(req.params.taskId))),
);
export const getTaskDetailAlias = asyncRoute(async (req: AuthedRequest, res) =>
  ok(res, await taskDetail(req, String(req.params.taskId))),
);
export const taskAction = asyncRoute(async (req: AuthedRequest, res) =>
  ok(
    res,
    await applyTaskAction(
      req,
      String(req.params.taskId),
      validateAction(String(req.params.action), TASK_ACTIONS),
      req.body,
    ),
  ),
);
export const sendEditorReview = asyncRoute(async (req: AuthedRequest, res) =>
  ok(res, await sendChapterToEditorReview(req, String(req.params.chapterId))),
);

// Comments
export const listComments = asyncRoute(async (req: AuthedRequest, res) =>
  paginated(req, res, StudioCommentModel, filterFromQuery(req), { createdAt: -1 }),
);
export const createComment = asyncRoute(async (req: AuthedRequest, res) => {
  const actor = requireActor(req);
  const body = parseBody(createCommentSchema, req);
  const comment = await StudioCommentModel.create({
    id: id("cmt"),
    ...body,
    authorId: actor.id,
    authorName: actor.name,
    text: body.text ?? body.body,
    body: body.body ?? body.text,
    status: body.status ?? "OPEN",
    createdAt: nowIso(),
  });
  await audit(req, "comment.create", "comment", (comment as any).id);
  created(res, comment);
});
export const patchComment = asyncRoute(async (req: AuthedRequest, res) => {
  const body = parseBody(patchCommentSchema, req);
  const allowedFields = ["text", "body", "type", "severity", "isBlocking", "metadata"];
  const patch = sanitizePatch(body as Record<string, unknown>, allowedFields, {
    rejectStatus: false,
  });
  ok(
    res,
    await patchById(req, StudioCommentModel, String(req.params.commentId), "comment.update", patch),
  );
});
export const resolveComment = asyncRoute(async (req: AuthedRequest, res) =>
  ok(
    res,
    await patchById(req, StudioCommentModel, String(req.params.commentId), "comment.resolved", {
      status: "RESOLVED",
    }),
  ),
);
export const reopenComment = asyncRoute(async (req: AuthedRequest, res) =>
  ok(
    res,
    await patchById(req, StudioCommentModel, String(req.params.commentId), "comment.reopened", {
      status: "REOPENED",
    }),
  ),
);
export const listTaskComments = asyncRoute(async (req: AuthedRequest, res) =>
  ok(
    res,
    await StudioCommentModel.find({ taskId: String(req.params.taskId) })
      .sort({ createdAt: -1 })
      .lean(),
  ),
);
