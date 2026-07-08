import { asyncRoute, created, ok, AppError } from "../lib/http.js";
import { StudioRegionModel, StudioTaskModel, StudioCommentModel } from "../db/models.js";
import { id, nowIso } from "../domain/ids.js";
import { audit } from "../services/audit.service.js";
import {
  applyTaskAction,
  sendChapterToEditorReview,
  taskDetail,
} from "../services/workflow.service.js";
import {
  requireActor,
  filterFromQuery,
  createLoose,
  patchLoose,
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

// Regions
export const listRegions = asyncRoute(async (req: AuthedRequest, res) =>
  paginated(req, res, StudioRegionModel, filterFromQuery(req), { updatedAt: -1 }),
);
export const createRegion = asyncRoute(async (req: AuthedRequest, res) => {
  parseBody(createRegionSchema, req);
  created(res, await createLoose(req, StudioRegionModel, "region", "studio_region.create"));
});
export const patchRegions = asyncRoute(async (req: AuthedRequest, res) => {
  rejectWorkflowStatusPatch(req.body);
  ok(res, await patchLoose(req, StudioRegionModel, "regionId", "studio_region.update"));
});
export const patchRegion = asyncRoute(async (req: AuthedRequest, res) => {
  const body = parseBody(patchRegionSchema, req);
  rejectWorkflowStatusPatch(body);
  const allowedFields = [
    "seriesId",
    "chapterId",
    "pageId",
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
  ok(
    res,
    await patchById(req, StudioRegionModel, String(req.params.id), "studio_region.update", patch),
  );
});
export const deleteRegion = asyncRoute(async (req: AuthedRequest, res) => {
  const id = String(req.params.id);
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
  parseBody(createStudioTaskSchema, req);
  created(res, await createLoose(req, StudioTaskModel, "task", "studio_task.create"));
});
export const patchTasks = asyncRoute(async (req: AuthedRequest, res) =>
  ok(res, await patchLoose(req, StudioTaskModel, "taskId", "studio_task.update")),
);
export const patchTask = asyncRoute(async (req: AuthedRequest, res) => {
  const body = parseBody(patchStudioTaskSchema, req);
  const allowedFields = [
    "seriesId",
    "chapterId",
    "pageId",
    "regionId",
    "assigneeId",
    "title",
    "description",
    "type",
    "priority",
    "dueAt",
    "metadata",
  ];
  const patch = sanitizePatch(body as Record<string, unknown>, allowedFields);
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
