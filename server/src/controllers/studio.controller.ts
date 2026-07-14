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
} from "./helpers.js";
import { parseBody, sanitizePatch } from "../validators/common.js";
import {
  createRegionSchema,
  patchRegionSchema,
  createCommentSchema,
  patchCommentSchema,
} from "../validators/studio.schema.js";
import type { AuthedRequest } from "../types.js";
import type { Response } from "express";
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
import {
  buildPagination,
  combineMongoFilters,
  listFiltersToMongo,
  listSearchToMongo,
  listSortToMongo,
  parseListQuery,
} from "../shared/contracts/list-contract.js";
import type { ListFieldConfig, ListQuery } from "../shared/contracts/list-contract.js";

const REGION_LIST_CONFIG = {
  searchable: ["type", "label"] as const,
  sortable: ["type", "status", "label", "updatedAt", "createdAt"] as const,
  filterable: {
    type: "select",
    status: "select",
    seriesId: "select",
    chapterId: "select",
    pageId: "select",
    taskId: "select",
    activeTaskId: "select",
    label: "text",
    createdAt: "dateRange",
    updatedAt: "dateRange",
  } as const,
  defaultSort: { field: "updatedAt", dir: "desc" } as const,
  maxPageSize: 100,
};

const COMMENT_LIST_CONFIG = {
  searchable: ["body", "text", "authorName", "type", "severity"] as const,
  sortable: ["status", "severity", "type", "createdAt", "updatedAt"] as const,
  filterable: {
    seriesId: "select",
    chapterId: "select",
    pageId: "select",
    regionId: "select",
    taskId: "select",
    authorId: "select",
    status: "select",
    type: "select",
    severity: "select",
    isBlocking: "boolean",
    createdAt: "dateRange",
    updatedAt: "dateRange",
  } as const,
  defaultSort: { field: "createdAt", dir: "desc" } as const,
  maxPageSize: 100,
};

const TASK_LIST_CONFIG = {
  searchable: ["title", "description", "instructions", "type", "assigneeName"] as const,
  sortable: ["title", "status", "priority", "type", "dueAt", "updatedAt", "createdAt"] as const,
  filterable: {
    title: "text",
    status: "select",
    priority: "select",
    type: "select",
    seriesId: "select",
    chapterId: "select",
    pageId: "select",
    regionId: "select",
    assigneeId: "select",
    dueAt: "dateRange",
    createdAt: "dateRange",
    updatedAt: "dateRange",
  } as const,
  defaultSort: { field: "updatedAt", dir: "desc" } as const,
  maxPageSize: 100,
};

function summarizeTasks(tasks: any[]) {
  const byStatus = tasks.reduce<Record<string, number>>((acc, task) => {
    const status = String(task.status ?? "UNKNOWN");
    acc[status] = (acc[status] ?? 0) + 1;
    return acc;
  }, {});

  return {
    total: tasks.length,
    byStatus,
  };
}

function summarizeByField(items: any[], field: string) {
  return items.reduce<Record<string, number>>((acc, item) => {
    const value = String(item[field] ?? "UNKNOWN");
    acc[value] = (acc[value] ?? 0) + 1;
    return acc;
  }, {});
}

async function sendStudioList(
  req: AuthedRequest,
  res: Response,
  model: typeof StudioRegionModel | typeof StudioCommentModel,
  config: ListFieldConfig,
  scope: (base: Record<string, unknown>) => Promise<Record<string, unknown>>,
  summary: (items: any[]) => Record<string, unknown>,
) {
  const query: ListQuery = parseListQuery(req, config);
  const filter = await scope(
    combineMongoFilters(
      filterFromQuery(req),
      listSearchToMongo(query.q, config.searchable),
      listFiltersToMongo(query.filters),
    ),
  );
  const sort = Object.keys(listSortToMongo(query.sort)).length
    ? listSortToMongo(query.sort)
    : { updatedAt: -1 as const };
  const [items, total] = await Promise.all([
    model
      .find(filter)
      .sort(sort)
      .skip((query.page - 1) * query.pageSize)
      .limit(query.pageSize)
      .lean(),
    model.countDocuments(filter),
  ]);
  return res.status(200).json({
    success: true,
    data: items,
    pagination: buildPagination(query, total),
    meta: {
      q: query.q,
      sort: query.sort,
      filters: query.filters,
      summary: summary(items),
    },
  });
}

// Regions
export const listRegions = asyncRoute(async (req: AuthedRequest, res) => {
  const actor = requireActor(req);
  await sendStudioList(
    req,
    res,
    StudioRegionModel,
    REGION_LIST_CONFIG,
    (base) => scopedRegionFilterForActor(actor, base),
    (regions) => ({
      total: regions.length,
      byStatus: summarizeByField(regions, "status"),
      byType: summarizeByField(regions, "type"),
    }),
  );
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
  const actor = requireActor(req);
  const query = parseListQuery(req, TASK_LIST_CONFIG);
  const directFilters = filterFromQuery(req);
  const columnFilters = { ...query.filters };
  if (actor.role === "ASSISTANT") {
    delete directFilters.assigneeId;
    delete directFilters.assistantId;
    delete columnFilters.assigneeId;
    delete columnFilters.assistantId;
  }
  const filter = await scopedTaskFilterForActor(
    actor,
    combineMongoFilters(
      directFilters,
      listSearchToMongo(query.q, TASK_LIST_CONFIG.searchable),
      listFiltersToMongo(columnFilters),
    ),
  );
  const sort = Object.keys(listSortToMongo(query.sort)).length
    ? listSortToMongo(query.sort)
    : { updatedAt: -1 as const };
  const [tasks, total] = await Promise.all([
    StudioTaskModel.find(filter)
      .sort(sort)
      .skip((query.page - 1) * query.pageSize)
      .limit(query.pageSize)
      .lean(),
    StudioTaskModel.countDocuments(filter),
  ]);
  return res.status(200).json({
    success: true,
    data: tasks,
    pagination: buildPagination(query, total),
    meta: {
      q: query.q,
      sort: query.sort,
      filters: columnFilters,
      summary: summarizeTasks(tasks),
    },
  });
});
export const sendEditorReview = asyncRoute(async (req: AuthedRequest, res) =>
  ok(res, await sendChapterToEditorReview(req, String(req.params.chapterId))),
);

// Comments
export const listComments = asyncRoute(async (req: AuthedRequest, res) => {
  const actor = requireActor(req);
  await sendStudioList(
    req,
    res,
    StudioCommentModel,
    COMMENT_LIST_CONFIG,
    (base) => scopedCommentFilterForActor(actor, base),
    (comments) => ({
      total: comments.length,
      byStatus: summarizeByField(comments, "status"),
      blocking: comments.filter((comment: any) => comment.isBlocking || comment.blocking).length,
    }),
  );
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
