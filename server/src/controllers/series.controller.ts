import { asyncRoute, created, ok, AppError } from "../lib/http.js";
import {
  SeriesModel,
  ChapterModel,
  PublicationModel,
  StudioCommentModel,
  StudioTaskModel,
  SubmissionModel,
  SeriesMemberModel,
  AuditEntryModel,
  UserModel,
} from "../db/models.js";
import { id, nowIso } from "../domain/ids.js";
import { audit } from "../services/audit.service.js";
import {
  applyChapterAction,
  chapterReadiness,
  findChapterBlockingComments,
  seriesProposalSummary,
} from "../services/workflow.service.js";
import { paginationFromQuery, requireActor, slugify, validateAction } from "./helpers.js";
import {
  parseBody,
  pickAllowedFields,
  rejectProtectedFields,
  rejectStatusOverride,
  sanitizePatch,
} from "../validators/common.js";
import { patchSeriesSchema } from "../validators/series.schema.js";
import {
  createChapterSchema,
  patchChapterSchema,
} from "../validators/chapter.schema.js";
import {
  addMemberSchema,
  inviteAssistantSchema,
  updateMemberSchema,
} from "../validators/team.schema.js";
import type { AuthedRequest, ChapterAction } from "../types.js";
import { CHAPTER_ACTIONS } from "../types.js";
import {
  assertCanReadChapter,
  assertCanReadGovernanceSeries,
  assertCanReadProductionSeries,
  readableProductionSeriesIds,
  scopedChapterFilterForActor,
  scopedProductionSeriesFilter,
} from "../services/mvp-access.service.js";
import {
  buildPagination,
  combineMongoFilters,
  listFiltersToMongo,
  listSearchToMongo,
  listSortToMongo,
  parseListQuery,
} from "../shared/contracts/list-contract.js";

function seriesSlug(input: string, fallback: string) {
  return slugify(input) || fallback;
}

async function assertMangakaOwnsSeries(req: AuthedRequest, seriesId: string) {
  const actor = requireActor(req);
  const series = (await SeriesModel.findOne({ id: seriesId }).lean()) as any;
  if (!series) throw new AppError(404, "Series not found.", "SERIES_NOT_FOUND");
  if (actor.role !== "MANGAKA" || series.authorId !== actor.id) {
    throw new AppError(
      403,
      "Only the owning Mangaka can modify this Series production data.",
      "MANGAKA_OWNER_REQUIRED",
    );
  }
  return series;
}

async function assertMangakaOwnsChapter(req: AuthedRequest, chapterId: string) {
  const chapter = (await ChapterModel.findOne({ id: chapterId }).lean()) as any;
  if (!chapter) throw new AppError(404, "Chapter not found.", "CHAPTER_NOT_FOUND");
  await assertMangakaOwnsSeries(req, String(chapter.seriesId));
  return chapter;
}

const SERIES_LIST_CONFIG = {
  searchable: ["title", "authorName", "editorName", "synopsis"] as const,
  sortable: ["title", "status", "publicationType", "updatedAt", "createdAt"] as const,
  filterable: {
    title: "text",
    status: "select",
    publicationType: "select",
    authorId: "select",
    editorId: "select",
    createdAt: "dateRange",
    updatedAt: "dateRange",
  } as const,
  defaultSort: { field: "updatedAt", dir: "desc" } as const,
  maxPageSize: 100,
};

function summarizeSeries(series: any[]) {
  const byStatus = series.reduce<Record<string, number>>((acc, item) => {
    const status = String(item.status ?? "UNKNOWN");
    acc[status] = (acc[status] ?? 0) + 1;
    return acc;
  }, {});

  return {
    total: series.length,
    byStatus,
  };
}

const CHAPTER_LIST_CONFIG = {
  searchable: ["title", "assigneeName", "summary"] as const,
  sortable: ["number", "title", "status", "updatedAt", "createdAt", "draftDueAt", "reviewDueAt"] as const,
  filterable: {
    title: "text",
    seriesId: "select",
    status: "select",
    assigneeId: "select",
    draftDueAt: "dateRange",
    reviewDueAt: "dateRange",
    scheduledAt: "dateRange",
    publishedAt: "dateRange",
  } as const,
  defaultSort: { field: "updatedAt", dir: "desc" } as const,
  maxPageSize: 100,
};

function summarizeChapters(chapters: any[]) {
  const byStatus = chapters.reduce<Record<string, number>>((acc, chapter) => {
    const status = String(chapter.status ?? "UNKNOWN");
    acc[status] = (acc[status] ?? 0) + 1;
    return acc;
  }, {});

  return {
    total: chapters.length,
    byStatus,
  };
}

export const listSeries = asyncRoute(async (req: AuthedRequest, res) => {
  const actor = requireActor(req);
  const mine = req.query.mine === "true";
  const query = parseListQuery(req, SERIES_LIST_CONFIG);

  const readableSeriesIds = await readableProductionSeriesIds(actor);
  let filter: Record<string, any> = scopedProductionSeriesFilter(readableSeriesIds);

  if (mine) {
    if (actor.role === "MANGAKA") {
      filter = { $and: [filter, { authorId: actor.id }] };
    } else if (actor.role === "EDITOR") {
      filter = { $and: [filter, { editorId: actor.id }] };
    } else if (actor.role === "ASSISTANT") {
      filter = scopedProductionSeriesFilter(readableSeriesIds);
    }
  }

  filter = combineMongoFilters(
    filter,
    listSearchToMongo(query.q, ["title", "authorName", "editorName", "synopsis"]),
    listFiltersToMongo(query.filters),
  );
  const sort = Object.keys(listSortToMongo(query.sort)).length
    ? listSortToMongo(query.sort)
    : { updatedAt: -1 as const };

  const [series, total] = await Promise.all([
    SeriesModel.find(filter)
      .sort(sort)
      .skip((query.page - 1) * query.pageSize)
      .limit(query.pageSize)
      .lean(),
    SeriesModel.countDocuments(filter),
  ]);
  const repaired = await Promise.all(
    series.map(async (item: any) => {
      if (item.slug) return item;
      const slug = seriesSlug(String(item.title ?? item.id ?? "series"), String(item.id));
      await SeriesModel.updateOne({ id: item.id }, { $set: { slug, updatedAt: nowIso() } });
      return { ...item, slug };
    }),
  );

  return res.status(200).json({
    success: true,
    data: repaired,
    pagination: buildPagination(query, total),
    meta: {
      q: query.q,
      sort: query.sort,
      filters: query.filters,
      summary: summarizeSeries(repaired),
    },
  });
});

export const getSeries = asyncRoute(async (req: AuthedRequest, res) => {
  const actor = requireActor(req);
  const series = await assertCanReadProductionSeries(actor, String(req.params.id));
  ok(res, series);
});

export const patchSeries = asyncRoute(async (req: AuthedRequest, res) => {
  await assertMangakaOwnsSeries(req, String(req.params.id));
  const body = parseBody(patchSeriesSchema, req);
  const allowedFields = [
    "title",
    "slug",
    "synopsis",
    "genres",
    "coverUrl",
    "coverFileKey",
    "startDate",
    "targetChapters",
  ];
  const patch = sanitizePatch(body as Record<string, unknown>, allowedFields);
  const series = await SeriesModel.findOneAndUpdate(
    { id: String(req.params.id) },
    { $set: { ...patch, updatedAt: nowIso() } },
    { returnDocument: "after" },
  ).lean();
  if (!series) throw new AppError(404, "Series not found.", "SERIES_NOT_FOUND");
  await audit(req, "series.update", "series", String(req.params.id));
  ok(res, series);
});

export const seriesLifecycleAction = asyncRoute(async (req: AuthedRequest, res) => {
  const seriesId = String(req.params.id);
  const series = await SeriesModel.findOne({ id: seriesId }).lean();
  if (!series) throw new AppError(404, "Series not found.", "SERIES_NOT_FOUND");
  throw new AppError(
    403,
    "Series lifecycle changes are handled by Board at-risk decisions after a submitted Tantou report.",
    "BOARD_AT_RISK_DECISION_REQUIRED",
  );
});

export const deleteSeries = asyncRoute(async (req: AuthedRequest, res) => {
  const seriesId = String(req.params.id);
  const series = await SeriesModel.findOne({ id: seriesId }).lean();
  if (!series) throw new AppError(404, "Series not found.", "SERIES_NOT_FOUND");
  throw new AppError(
    403,
    "Series deletion/cancellation is handled by Board at-risk decisions after a submitted Tantou report.",
    "BOARD_AT_RISK_DECISION_REQUIRED",
  );
});

export const listSeriesChapters = asyncRoute(async (req: AuthedRequest, res) => {
  await assertCanReadProductionSeries(requireActor(req), String(req.params.id));
  const query = parseListQuery(req, {
    ...CHAPTER_LIST_CONFIG,
    defaultSort: { field: "number", dir: "asc" },
  });
  const filter = combineMongoFilters(
    { seriesId: String(req.params.id) },
    listSearchToMongo(query.q, ["title", "assigneeName", "summary"]),
    listFiltersToMongo(query.filters),
  );
  const sort = Object.keys(listSortToMongo(query.sort)).length
    ? listSortToMongo(query.sort)
    : { number: 1 as const };
  const [chapters, total] = await Promise.all([
    ChapterModel.find(filter)
      .sort(sort)
      .skip((query.page - 1) * query.pageSize)
      .limit(query.pageSize)
      .lean(),
    ChapterModel.countDocuments(filter),
  ]);
  const enriched = await attachPublications(chapters);
  return res.status(200).json({
    success: true,
    data: enriched,
    pagination: buildPagination(query, total),
    meta: {
      q: query.q,
      sort: query.sort,
      filters: query.filters,
      summary: summarizeChapters(enriched),
    },
  });
});

async function attachPublications(chapters: any[]) {
  const ids = chapters.map((chapter: any) => chapter.id);
  const publications = await PublicationModel.find({ chapterId: { $in: ids } }).lean();
  const byChapter = new Map(publications.map((publication: any) => [publication.chapterId, publication]));
  return chapters.map((chapter: any) => {
    const publication = byChapter.get(chapter.id);
    return {
      ...chapter,
      publication,
      scheduledAt: publication?.scheduledAt ?? chapter.scheduledAt,
      publishedAt: publication?.publishedAt ?? chapter.publishedAt,
    };
  });
}

export const getSeriesSummary = asyncRoute(async (req: AuthedRequest, res) => {
  const actor = requireActor(req);
  if (actor.role === "BOARD") {
    await assertCanReadGovernanceSeries(actor, String(req.params.seriesId));
  } else {
    await assertCanReadProductionSeries(actor, String(req.params.seriesId));
  }
  ok(res, await seriesProposalSummary(String(req.params.seriesId)));
});

export const getSeriesActivity = asyncRoute(async (req: AuthedRequest, res) => {
  const seriesId = String(req.params.seriesId);
  await assertCanReadProductionSeries(requireActor(req), seriesId);

  const chapters = await ChapterModel.find({ seriesId }).select({ id: 1 }).lean();
  const chapterIds = chapters.map((chapter: any) => chapter.id);

  const entries = await AuditEntryModel.find({
    $or: [
      { entityType: "series", entityId: seriesId },
      { entityType: "chapter", entityId: { $in: chapterIds } },
      { entityType: "studio_task", "metadata.seriesId": seriesId },
      { entityType: "submission", "metadata.seriesId": seriesId },
    ],
  })
    .sort({ createdAt: -1 })
    .limit(25)
    .lean();

  ok(res, entries);
});

// Team Members
export const listMembers = asyncRoute(async (req: AuthedRequest, res) => {
  const seriesId = String(req.params.seriesId);
  await assertCanReadProductionSeries(requireActor(req), seriesId);
  const members = await SeriesMemberModel.find({ seriesId }).lean();
  ok(res, members);
});

export const addMember = asyncRoute(async (req: AuthedRequest, res) => {
  const seriesId = String(req.params.seriesId);
  await assertMangakaOwnsSeries(req, seriesId);
  const body = parseBody(addMemberSchema, req);
  if (String(body.role) !== "assistant") {
    throw new AppError(400, "Only Assistant members can be managed in the MVP.", "INVALID_MEMBER_ROLE");
  }
  const allowedFields = [
    "userId",
    "role",
    "scope",
    "status",
    "assignedChapterIds",
    "assignedTaskIds",
  ];
  const patch = pickAllowedFields(body as Record<string, unknown>, allowedFields);
  const newMember = await SeriesMemberModel.create({
    id: body.id ?? id("sm"),
    seriesId,
    ...patch,
    assignedChapterIds: Array.isArray(patch.assignedChapterIds) ? patch.assignedChapterIds : [],
    assignedTaskIds: Array.isArray(patch.assignedTaskIds) ? patch.assignedTaskIds : [],
    createdAt: nowIso(),
    updatedAt: nowIso(),
  });
  if (String(patch.role) === "assistant") {
    await SeriesModel.updateOne(
      { id: seriesId },
      { $addToSet: { assistantIds: body.userId }, $set: { updatedAt: nowIso() } },
    );
  }
  await audit(req, "series.member_add", "series", seriesId, { userId: body.userId });
  created(res, newMember);
});

export const updateMember = asyncRoute(async (req: AuthedRequest, res) => {
  const memberId = String(req.params.memberId);
  const seriesId = String(req.params.seriesId);
  await assertMangakaOwnsSeries(req, seriesId);
  const body = parseBody(updateMemberSchema, req);
  const allowedFields = [
    "role",
    "scope",
    "status",
    "assignedChapterIds",
    "assignedTaskIds",
    "metadata",
  ];
  const patch = pickAllowedFields(body as Record<string, unknown>, allowedFields);
  const updated = await SeriesMemberModel.findOneAndUpdate(
    { id: memberId, seriesId },
    { $set: { ...patch, updatedAt: nowIso() } },
    { returnDocument: "after" },
  ).lean();
  if (!updated) throw new AppError(404, "Member not found.", "MEMBER_NOT_FOUND");
  await audit(req, "series.member_update", "series", seriesId, { memberId });
  ok(res, updated);
});

export const removeMember = asyncRoute(async (req: AuthedRequest, res) => {
  const memberId = String(req.params.memberId);
  const seriesId = String(req.params.seriesId);
  await assertMangakaOwnsSeries(req, seriesId);
  const deleted = await SeriesMemberModel.findOneAndDelete({ id: memberId, seriesId }).lean();
  if (!deleted) throw new AppError(404, "Member not found.", "MEMBER_NOT_FOUND");
  if (String((deleted as any).role) === "assistant") {
    await SeriesModel.updateOne(
      { id: seriesId },
      { $pull: { assistantIds: (deleted as any).userId }, $set: { updatedAt: nowIso() } },
    );
  }
  await audit(req, "series.member_remove", "series", seriesId, { memberId });
  ok(res, { id: memberId });
});

export const inviteAssistant = asyncRoute(async (req: AuthedRequest, res) => {
  const seriesId = String(req.params.seriesId);
  const body = parseBody(inviteAssistantSchema, req);

  await assertMangakaOwnsSeries(req, seriesId);

  const user = await UserModel.findOne({ email: body.email }).lean();
  if (!user) {
    throw new AppError(404, "No user with that email.", "USER_NOT_FOUND");
  }
  if ((user as any).role !== "ASSISTANT") {
    throw new AppError(409, "User is not an assistant.", "USER_NOT_ASSISTANT");
  }
  if ((user as any).active === false) {
    throw new AppError(409, "User is inactive.", "USER_INACTIVE");
  }

  const existing = await SeriesMemberModel.findOne({
    seriesId,
    userId: (user as any).id,
  }).lean();
  if (existing) {
    throw new AppError(409, "Assistant is already a member.", "ALREADY_MEMBER");
  }

  const newMember = await SeriesMemberModel.create({
    id: id("sm"),
    seriesId,
    userId: (user as any).id,
    role: "assistant",
    scope: body.scope ?? "Full chapter",
    status: "active",
    assignedChapterIds: [],
    assignedTaskIds: [],
    createdAt: nowIso(),
    updatedAt: nowIso(),
  });
  await SeriesModel.updateOne(
    { id: seriesId },
    { $addToSet: { assistantIds: (user as any).id }, $set: { updatedAt: nowIso() } },
  );
  await audit(req, "series.assistant_invite", "series", seriesId, {
    userId: (user as any).id,
    email: body.email,
  });
  created(res, newMember);
});

// Chapters (standalone)
export const getChapter = asyncRoute(async (req: AuthedRequest, res) => {
  const chapter = await assertCanReadChapter(requireActor(req), String(req.params.chapterId));
  ok(res, (await attachPublications([chapter]))[0]);
});

export const patchChapter = asyncRoute(async (req: AuthedRequest, res) => {
  await assertMangakaOwnsChapter(req, String(req.params.chapterId));
  const body = parseBody(patchChapterSchema, req);
  const allowedFields = [
    "title",
    "number",
    "summary",
    "draftDueAt",
    "reviewDueAt",
    "metadata",
  ];
  const patch = sanitizePatch(body as Record<string, unknown>, allowedFields);
  ok(
    res,
    await ChapterModel.findOneAndUpdate(
      { id: String(req.params.chapterId) },
      { $set: { ...patch, updatedAt: nowIso() } },
      { returnDocument: "after" },
    ).lean(),
  );
});

export const chapterAction = asyncRoute(async (req: AuthedRequest, res) =>
  ok(
    res,
    await applyChapterAction(
      req,
      String(req.params.chapterId),
      validateAction(String(req.params.action), CHAPTER_ACTIONS),
      req.body,
    ),
  ),
);

export const listChapters = asyncRoute(async (req: AuthedRequest, res) => {
  const user = req.actor!;
  const query = parseListQuery(req, CHAPTER_LIST_CONFIG);
  const filter: Record<string, unknown> = {};
  if (req.query.mine === "true") {
    if (user.role === "MANGAKA" || user.role === "ASSISTANT") {
      filter.assigneeId = user.id;
      filter.status = { $in: ["PLANNED", "DRAFTING", "REVISION"] };
    } else if (user.role === "EDITOR" || user.role === "ADMIN") {
      filter.status = {
        $in: ["EDITOR_REVIEW", "EDITOR_APPROVED", "READY_FOR_PUBLICATION", "PUBLISHED"],
      };
    }
  }
  if (req.query.seriesId) filter.seriesId = String(req.query.seriesId);
  const scopedFilter = await scopedChapterFilterForActor(
    user,
    combineMongoFilters(
      filter,
      listSearchToMongo(query.q, ["title", "assigneeName", "summary"]),
      listFiltersToMongo(query.filters),
    ),
  );
  const sort = Object.keys(listSortToMongo(query.sort)).length
    ? listSortToMongo(query.sort)
    : { updatedAt: -1 as const };
  const [chapters, total] = await Promise.all([
    ChapterModel.find(scopedFilter)
      .sort(sort)
      .skip((query.page - 1) * query.pageSize)
      .limit(query.pageSize)
      .lean(),
    ChapterModel.countDocuments(scopedFilter),
  ]);
  const enriched = await attachPublications(chapters);
  return res.status(200).json({
    success: true,
    data: enriched,
    pagination: buildPagination(query, total),
    meta: {
      q: query.q,
      sort: query.sort,
      filters: query.filters,
      summary: summarizeChapters(enriched),
    },
  });
});

export const getChapterPages = asyncRoute(async (req: AuthedRequest, res) => {
  const chapter = await assertCanReadChapter(requireActor(req), String(req.params.chapterId));
  ok(res, (chapter as any).pages ?? []);
});

export const getChapterReadiness = asyncRoute(async (req: AuthedRequest, res) => {
  const chapterId = String(req.params.chapterId);
  const chapter = await assertCanReadChapter(requireActor(req), chapterId);
  const [tasks, submissions] = await Promise.all([
    StudioTaskModel.find({ chapterId }).lean(),
    SubmissionModel.find({ chapterId }).lean(),
  ]);
  const comments = await findChapterBlockingComments(chapter, tasks, submissions);
  ok(res, chapterReadiness(chapter, comments, tasks, submissions));
});

