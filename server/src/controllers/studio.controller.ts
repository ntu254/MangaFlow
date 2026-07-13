import { asyncRoute, created, ok, AppError } from "../lib/http.js";
import {
  ChapterModel,
  SeriesModel,
  StudioRegionModel,
  StudioTaskModel,
  StudioCommentModel,
} from "../db/models.js";
import { id, nowIso } from "../domain/ids.js";
import { audit } from "../services/audit.service.js";
import {
  sendChapterToEditorReview,
} from "../services/workflow.service.js";
import {
  requireActor,
  filterFromQuery,
  createLoose,
  patchById,
  paginated,
} from "./helpers.js";
import { parseBody, sanitizePatch } from "../validators/common.js";
import {
  createRegionSchema,
  patchRegionSchema,
  createCommentSchema,
  patchCommentSchema,
} from "../validators/studio.schema.js";
import type { AuthedRequest } from "../types.js";
import {
  assertCanReadChapter,
  assertCanReadComment,
  assertCanReadPage,
  assertCanReadProductionSeries,
  assertCanReadTask,
  scopedCommentFilterForActor,
  scopedRegionFilterForActor,
  scopedTaskFilterForActor,
} from "../services/mvp-access.service.js";
import {
  assertCanManageStudio,
  rejectWorkflowStatusPatch,
} from "../modules/studio/application/studio-access.application.js";

// Regions
export const listRegions = asyncRoute(async (req: AuthedRequest, res) => {
  const filter = await scopedRegionFilterForActor(requireActor(req), filterFromQuery(req));
  await paginated(req, res, StudioRegionModel, filter, { updatedAt: -1 });
});
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
  const filter = await scopedTaskFilterForActor(requireActor(req), filterFromQuery(req));
  await paginated(req, res, StudioTaskModel, filter, { updatedAt: -1 });
});
export const sendEditorReview = asyncRoute(async (req: AuthedRequest, res) =>
  ok(res, await sendChapterToEditorReview(req, String(req.params.chapterId))),
);

// Comments
export const listComments = asyncRoute(async (req: AuthedRequest, res) => {
  const filter = await scopedCommentFilterForActor(requireActor(req), filterFromQuery(req));
  await paginated(req, res, StudioCommentModel, filter, { createdAt: -1 });
});
export const createComment = asyncRoute(async (req: AuthedRequest, res) => {
  const actor = requireActor(req);
  const body = parseBody(createCommentSchema, req);
  if (body.taskId) await assertCanReadTask(actor, body.taskId);
  else if (body.pageId) await assertCanReadPage(actor, body.pageId);
  else if (body.chapterId) await assertCanReadChapter(actor, body.chapterId);
  else if (body.seriesId) await assertCanReadProductionSeries(actor, body.seriesId);
  else throw new AppError(400, "Comment target is required.", "VALIDATION_ERROR");
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
  await assertCanReadComment(requireActor(req), String(req.params.commentId));
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
  {
    await assertCanReadComment(requireActor(req), String(req.params.commentId));
    ok(
      res,
      await patchById(req, StudioCommentModel, String(req.params.commentId), "comment.resolved", {
        status: "RESOLVED",
      }),
    );
  }
);
export const reopenComment = asyncRoute(async (req: AuthedRequest, res) =>
  {
    await assertCanReadComment(requireActor(req), String(req.params.commentId));
    ok(
      res,
      await patchById(req, StudioCommentModel, String(req.params.commentId), "comment.reopened", {
        status: "REOPENED",
      }),
    );
  }
);
export const listTaskComments = asyncRoute(async (req: AuthedRequest, res) => {
  await assertCanReadTask(requireActor(req), String(req.params.taskId));
  ok(
    res,
    await StudioCommentModel.find({ taskId: String(req.params.taskId) })
      .sort({ createdAt: -1 })
      .lean(),
  );
});
