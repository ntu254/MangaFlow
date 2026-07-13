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
  MaterialModel,
  UserModel,
} from "../db/models.js";
import { id, nowIso } from "../domain/ids.js";
import { audit } from "../services/audit.service.js";
import { presignR2Download, presignR2Upload } from "../services/r2.service.js";
import { createDisplayUrl, createLocalUploadUrl } from "../services/file-access.service.js";
import { assertFileKeyVisible } from "../services/studio-access.service.js";
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
import { createSeriesSchema, patchSeriesSchema } from "../validators/series.schema.js";
import {
  createChapterSchema,
  patchChapterSchema,
  createPageSchema,
  patchPageSchema,
} from "../validators/chapter.schema.js";
import {
  addMemberSchema,
  inviteAssistantSchema,
  updateMemberSchema,
} from "../validators/team.schema.js";
import type { AuthedRequest, ChapterAction } from "../types.js";
import { CHAPTER_ACTIONS } from "../types.js";

const PUBLIC_SERIES_STATUSES = new Set(["ONGOING", "COMPLETED", "PUBLISHED", "PUBLIC"]);
const ALLOWED_UPLOAD_CONTENT_TYPES = new Set([
  "application/pdf",
  "application/zip",
  "application/x-zip-compressed",
  "application/octet-stream",
]);

function isAllowedUploadContentType(contentType?: string) {
  if (!contentType) return true;
  return contentType.startsWith("image/") || ALLOWED_UPLOAD_CONTENT_TYPES.has(contentType);
}

function seriesSlug(input: string, fallback: string) {
  return slugify(input) || fallback;
}

async function seriesHasRelatedData(seriesId: string) {
  const [publishedChapters, submissions, tasks, audits] = await Promise.all([
    ChapterModel.countDocuments({ seriesId, status: "PUBLISHED" }),
    SubmissionModel.countDocuments({ seriesId }),
    StudioTaskModel.countDocuments({ seriesId }),
    AuditEntryModel.countDocuments({ entityId: seriesId }),
  ]);
  return publishedChapters > 0 || submissions > 0 || tasks > 0 || audits > 0;
}

export const listSeries = asyncRoute(async (req: AuthedRequest, res) => {
  const actor = requireActor(req);
  const mine = req.query.mine === "true";

  let filter: Record<string, any> = {};
  if (actor.role === "MANGAKA") {
    filter.authorId = actor.id;
  } else if (actor.role === "EDITOR") {
    filter.editorId = actor.id;
  } else if (actor.role === "ASSISTANT") {
    const memberships = await SeriesMemberModel.find({ userId: actor.id, status: "active" }).lean();
    const seriesIds = memberships.map((m: any) => m.seriesId);
    filter.id = { $in: seriesIds };
  }

  if (mine) {
    if (actor.role === "MANGAKA") {
      filter.authorId = actor.id;
    } else if (actor.role === "EDITOR") {
      filter.editorId = actor.id;
    } else if (actor.role === "ASSISTANT") {
      const memberships = await SeriesMemberModel.find({
        userId: actor.id,
        status: "active",
      }).lean();
      const seriesIds = memberships.map((m: any) => m.seriesId);
      filter.id = { $in: seriesIds };
    }
  }

  const { page, limit, skip } = paginationFromQuery(req);
  const [series, total] = await Promise.all([
    SeriesModel.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(limit).lean(),
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
    pagination: {
      page,
      pageSize: limit,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  });
});

export const createSeries = asyncRoute(async (req: AuthedRequest, res) => {
  const actor = requireActor(req);
  const now = nowIso();
  const body = parseBody(createSeriesSchema, req);
  rejectProtectedFields(body as Record<string, unknown>);

  // A manually created Series may be given a Tantou editor up front, but it must
  // be a real, active EDITOR — never a hardcoded seed account. When none is
  // supplied the Series starts without a Tantou and the Board assigns one later
  // (flowchart node K); the name is taken from the account, not client input.
  let editorId: string | undefined;
  let editorName: string | undefined;
  if (body.editorId) {
    const editor = (await UserModel.findOne({ id: body.editorId, active: true }).lean()) as any;
    if (!editor) throw new AppError(404, "Editor not found or inactive.", "EDITOR_NOT_FOUND");
    if (editor.role !== "EDITOR") {
      throw new AppError(400, "Assigned Tantou must be an active Editor.", "INVALID_TANTOU_EDITOR");
    }
    editorId = String(editor.id);
    editorName = String(editor.name ?? "");
  }

  const seriesId = id("s");
  const series = await SeriesModel.create({
    id: seriesId,
    slug: seriesSlug(body.slug ?? body.title ?? "series", seriesId),
    title: body.title ?? "Untitled series",
    synopsis: body.synopsis ?? "",
    genres: Array.isArray(body.genres) ? body.genres : [],
    coverUrl: body.coverUrl ?? "",
    coverFileKey: body.coverFileKey,
    status: body.status ?? "PLANNING",
    cadence: body.cadence ?? "monthly",
    startDate: body.startDate ?? now,
    targetChapters: Number(body.targetChapters ?? 12),
    authorId: body.authorId ?? actor.id,
    authorName: body.authorName ?? actor.name,
    ...(editorId ? { editorId, editorName } : {}),
    assistantIds: Array.isArray(body.assistantIds) ? body.assistantIds : [],
    proposalId: body.proposalId,
    createdAt: now,
    updatedAt: now,
  });
  await audit(req, "series.create", "series", (series as any).id);
  created(res, series);
});

export const getSeries = asyncRoute(async (req: AuthedRequest, res) => {
  const series = await SeriesModel.findOne({ id: String(req.params.id) }).lean();
  if (!series) throw new AppError(404, "Series not found.", "SERIES_NOT_FOUND");
  ok(res, series);
});

export const patchSeries = asyncRoute(async (req: AuthedRequest, res) => {
  const body = parseBody(patchSeriesSchema, req);
  const allowedFields = [
    "title",
    "slug",
    "synopsis",
    "genres",
    "coverUrl",
    "coverFileKey",
    "cadence",
    "startDate",
    "targetChapters",
    "editorId",
    "editorName",
    "assistantIds",
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
  const actor = requireActor(req);
  const seriesId = String(req.params.id);
  const action = String(req.params.action).toUpperCase();
  const series = await SeriesModel.findOne({ id: seriesId }).lean();
  if (!series) throw new AppError(404, "Series not found.", "SERIES_NOT_FOUND");

  if (actor.role === "MANGAKA" && PUBLIC_SERIES_STATUSES.has(String((series as any).status))) {
    throw new AppError(403, "Mangaka cannot archive or unpublish public series.", "FORBIDDEN");
  }
  if (!["ADMIN", "EDITOR"].includes(actor.role)) {
    throw new AppError(403, "Editor or Admin permission is required.", "FORBIDDEN");
  }

  const status = action === "UNPUBLISH" ? "HIATUS" : action === "ARCHIVE" ? "ARCHIVED" : null;
  if (!status) throw new AppError(400, "Unknown series lifecycle action.", "INVALID_ACTION");
  const patch: Record<string, unknown> = { status, updatedAt: nowIso() };
  if (action === "ARCHIVE") patch.archivedAt = nowIso();
  if (action === "UNPUBLISH") patch.unpublishedAt = nowIso();

  const updated = await SeriesModel.findOneAndUpdate(
    { id: seriesId },
    { $set: patch },
    { returnDocument: "after" },
  ).lean();
  await audit(req, `series.${action.toLowerCase()}`, "series", seriesId, {
    previousStatus: (series as any).status,
    nextStatus: status,
  });
  ok(res, updated);
});

export const deleteSeries = asyncRoute(async (req: AuthedRequest, res) => {
  const actor = requireActor(req);
  const seriesId = String(req.params.id);
  const series = await SeriesModel.findOne({ id: seriesId }).lean();
  if (!series) throw new AppError(404, "Series not found.", "SERIES_NOT_FOUND");

  const isPublic = PUBLIC_SERIES_STATUSES.has(String((series as any).status));
  if (actor.role !== "ADMIN" && (isPublic || actor.role !== "MANGAKA")) {
    throw new AppError(403, "You do not have permission to delete this series.", "FORBIDDEN");
  }
  if (actor.role === "MANGAKA" && (series as any).authorId !== actor.id) {
    throw new AppError(403, "Only the owning Mangaka can delete a safe draft series.", "FORBIDDEN");
  }

  const hasRelatedData = await seriesHasRelatedData(seriesId);

  if (isPublic || hasRelatedData) {
    const archived = await SeriesModel.findOneAndUpdate(
      { id: seriesId },
      {
        $set: {
          status: "ARCHIVED",
          archivedAt: nowIso(),
          deletedAt: nowIso(),
          updatedAt: nowIso(),
        },
      },
      { returnDocument: "after" },
    ).lean();
    await audit(req, "series.archive", "series", seriesId, {
      previousStatus: (series as any).status,
      hasRelatedData,
    });
    ok(res, archived);
    return;
  }

  const softDeleted = await SeriesModel.findOneAndUpdate(
    { id: seriesId },
    {
      $set: {
        deletedAt: nowIso(),
        updatedAt: nowIso(),
      },
    },
    { returnDocument: "after" },
  ).lean();
  await audit(req, "series.soft_delete", "series", seriesId, {
    previousStatus: (series as any).status,
  });
  ok(res, softDeleted);
});

export const listSeriesChapters = asyncRoute(async (req: AuthedRequest, res) => {
  const filter = { seriesId: String(req.params.id) };
  const { page, limit, skip } = paginationFromQuery(req);
  const [chapters, total] = await Promise.all([
    ChapterModel.find(filter).sort({ number: 1 }).skip(skip).limit(limit).lean(),
    ChapterModel.countDocuments(filter),
  ]);
  const enriched = await attachPublications(chapters);
  return res.status(200).json({
    success: true,
    data: enriched,
    pagination: {
      page,
      pageSize: limit,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
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

export const createSeriesChapter = asyncRoute(async (req: AuthedRequest, res) => {
  const now = nowIso();
  const seriesId = String(req.params.id);
  const body = parseBody(createChapterSchema, req);
  rejectProtectedFields(body as Record<string, unknown>);

  // A cancelled or paused Series cannot accept new chapters (flowchart AS/AT).
  const series = (await SeriesModel.findOne({ id: seriesId }).lean()) as any;
  if (!series) throw new AppError(404, "Series not found.", "SERIES_NOT_FOUND");
  if (["CANCELLED", "HIATUS", "COMPLETED"].includes(String(series.status))) {
    throw new AppError(
      409,
      `Cannot create a chapter for a ${String(series.status).toLowerCase()} series.`,
      "SERIES_NOT_PRODUCIBLE",
    );
  }

  const chapter = await ChapterModel.create({
    id: id("ch"),
    seriesId,
    number: Number(body.number ?? 1),
    title: body.title ?? "Untitled chapter",
    status: "PLANNED",
    assigneeId: body.assigneeId ?? req.actor?.id,
    assigneeName: body.assigneeName ?? req.actor?.name,
    draftDueAt: body.draftDueAt ? new Date(body.draftDueAt) : undefined,
    reviewDueAt: body.reviewDueAt ? new Date(body.reviewDueAt) : undefined,
    plannedAt: body.plannedAt ? new Date(body.plannedAt) : undefined,
    pages: [],
    reviewNotes: [],
    revisionRound: 0,
    history: [],
    createdAt: now,
    updatedAt: now,
  });
  await audit(req, "chapter.create", "chapter", (chapter as any).id);
  created(res, chapter);
});

export const getSeriesSummary = asyncRoute(async (req: AuthedRequest, res) =>
  ok(res, await seriesProposalSummary(String(req.params.seriesId))),
);

export const getSeriesActivity = asyncRoute(async (req: AuthedRequest, res) => {
  const seriesId = String(req.params.seriesId);
  const series = await SeriesModel.findOne({ id: seriesId }).lean();
  if (!series) throw new AppError(404, "Series not found.", "SERIES_NOT_FOUND");

  const chapters = await ChapterModel.find({ seriesId }).select({ id: 1 }).lean();
  const chapterIds = chapters.map((chapter: any) => chapter.id);

  const entries = await AuditEntryModel.find({
    $or: [
      { entityType: "series", entityId: seriesId },
      { entityType: "chapter", entityId: { $in: chapterIds } },
      { entityType: "studio_task", "metadata.seriesId": seriesId },
      { entityType: "submission", "metadata.seriesId": seriesId },
      { entityType: "material", "metadata.seriesId": seriesId },
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
  const members = await SeriesMemberModel.find({ seriesId }).lean();
  ok(res, members);
});

export const addMember = asyncRoute(async (req: AuthedRequest, res) => {
  const seriesId = String(req.params.seriesId);
  const body = parseBody(addMemberSchema, req);
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
  const actor = requireActor(req);
  const seriesId = String(req.params.seriesId);
  const body = parseBody(inviteAssistantSchema, req);

  const series = await SeriesModel.findOne({ id: seriesId }).lean();
  if (!series) throw new AppError(404, "Series not found.", "SERIES_NOT_FOUND");

  const isAdmin = actor.role === "ADMIN";
  const isEditor = actor.role === "EDITOR";
  const isOwner = actor.role === "MANGAKA" && (series as any).authorId === actor.id;
  if (!isAdmin && !isEditor && !isOwner) {
    throw new AppError(
      403,
      "Only the series owner can invite assistants.",
      "MANGAKA_OWNER_REQUIRED",
    );
  }

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
  const chapter = await ChapterModel.findOne({ id: String(req.params.chapterId) }).lean();
  if (!chapter) throw new AppError(404, "Chapter not found.", "CHAPTER_NOT_FOUND");
  ok(res, (await attachPublications([chapter]))[0]);
});

export const patchChapter = asyncRoute(async (req: AuthedRequest, res) => {
  const body = parseBody(patchChapterSchema, req);
  const allowedFields = [
    "title",
    "number",
    "summary",
    "draftDueAt",
    "reviewDueAt",
    "scheduledAt",
    "publishedAt",
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
  const { page, limit, skip } = paginationFromQuery(req);
  const [chapters, total] = await Promise.all([
    ChapterModel.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(limit).lean(),
    ChapterModel.countDocuments(filter),
  ]);
  const enriched = await attachPublications(chapters);
  return res.status(200).json({
    success: true,
    data: enriched,
    pagination: {
      page,
      pageSize: limit,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  });
});

export const getChapterPages = asyncRoute(async (req: AuthedRequest, res) => {
  const chapter = await ChapterModel.findOne({ id: String(req.params.chapterId) }).lean();
  if (!chapter) throw new AppError(404, "Chapter not found.", "CHAPTER_NOT_FOUND");
  ok(res, (chapter as any).pages ?? []);
});

export const getChapterReadiness = asyncRoute(async (req: AuthedRequest, res) => {
  const chapterId = String(req.params.chapterId);
  const chapter = await ChapterModel.findOne({ id: chapterId }).lean();
  if (!chapter) throw new AppError(404, "Chapter not found.", "CHAPTER_NOT_FOUND");
  const pageIds = ((chapter as any).pages ?? []).map((page: any) => page.id);
  const [tasks, submissions, materials] = await Promise.all([
    StudioTaskModel.find({ chapterId }).lean(),
    SubmissionModel.find({ chapterId }).lean(),
    MaterialModel.find({
      $and: [
        { $or: [{ chapterId }, { pageId: { $in: pageIds } }] },
        {
          $or: [{ fileKey: { $exists: true, $ne: "" } }, { url: { $exists: true, $ne: "" } }],
        },
      ],
    }).lean(),
  ]);
  const comments = await findChapterBlockingComments(chapter, tasks, submissions);
  ok(res, chapterReadiness(chapter, comments, tasks, submissions, materials));
});

export const createChapterPage = asyncRoute(async (req: AuthedRequest, res) => {
  const chapterId = String(req.params.chapterId);
  const chapter = await ChapterModel.findOne({ id: chapterId });
  if (!chapter) throw new AppError(404, "Chapter not found.", "CHAPTER_NOT_FOUND");

  const body = parseBody(createPageSchema, req);
  const hasPageAsset = Boolean(body.fileKey || body.fileUrl || body.imageUrl);
  const newPage = {
    id: body.id ?? id("pg"),
    pageNumber: Number(body.pageNumber ?? ((chapter as any).pages?.length ?? 0) + 1),
    status: body.status ?? (hasPageAsset ? "UPLOADED" : "PENDING_UPLOAD"),
    imageUrl: body.imageUrl ?? body.fileUrl ?? "metadata://r2/placeholder-page.png",
    fileKey: body.fileKey,
    fileName: body.fileName,
    fileUrl: body.fileUrl ?? body.imageUrl,
    sizeKB: body.sizeKB,
    mimeType: body.mimeType,
    imageWidth: body.imageWidth,
    imageHeight: body.imageHeight,
    uploadedAt: nowIso(),
  };

  await ChapterModel.updateOne(
    { id: chapterId },
    { $push: { pages: newPage }, $set: { updatedAt: nowIso() } },
  );

  created(res, newPage);
});

export const updatePage = asyncRoute(async (req: AuthedRequest, res) => {
  const pageId = String(req.params.pageId);
  const chapter = await ChapterModel.findOne({ "pages.id": pageId });
  if (!chapter) throw new AppError(404, "Page not found.", "PAGE_NOT_FOUND");

  const body = parseBody(patchPageSchema, req);
  const pages = (chapter as any).pages.map((p: any) => {
    if (p.id === pageId) {
      return { ...p, ...body, updatedAt: nowIso() };
    }
    return p;
  });

  await ChapterModel.updateOne({ id: chapter.id }, { $set: { pages, updatedAt: nowIso() } });
  const updatedPage = pages.find((p: any) => p.id === pageId);
  ok(res, updatedPage);
});

export const deletePage = asyncRoute(async (req: AuthedRequest, res) => {
  const pageId = String(req.params.pageId);
  const chapter = await ChapterModel.findOne({ "pages.id": pageId });
  if (!chapter) throw new AppError(404, "Page not found.", "PAGE_NOT_FOUND");

  await ChapterModel.updateOne(
    { id: chapter.id },
    { $pull: { pages: { id: pageId } }, $set: { updatedAt: nowIso() } },
  );
  ok(res, { id: pageId });
});

export const presignUpload = asyncRoute(async (req: AuthedRequest, res) => {
  const fileName = String(req.body.fileName ?? "page.png");
  const contentType =
    typeof req.body.contentType === "string"
      ? req.body.contentType
      : typeof req.body.fileType === "string"
        ? req.body.fileType
        : undefined;
  if (!isAllowedUploadContentType(contentType)) {
    throw new AppError(
      400,
      "Only image, PDF, and ZIP uploads are supported.",
      "UNSUPPORTED_FILE_TYPE",
    );
  }
  const folder = typeof req.body.folder === "string" ? req.body.folder : undefined;
  const signed = await presignR2Upload({ fileName, contentType, folder });
  if (signed.storage === "metadata-only" || process.env.VITEST) {
    ok(res, {
      ...signed,
      uploadUrl: createLocalUploadUrl(signed.key, contentType, fileName),
      downloadUrl: createDisplayUrl(signed.key, fileName).url,
      persistent: true,
      storage: "local" as const,
    });
    return;
  }
  ok(res, signed);
});

export const presignDownload = asyncRoute(async (req: AuthedRequest, res) => {
  const actor = requireActor(req);
  const key = req.body.key;
  if (!key) throw new AppError(400, "key is required.", "VALIDATION_ERROR");
  await assertFileKeyVisible(actor, String(key));
  ok(res, await presignR2Download(String(key)));
});

export const displayUrl = asyncRoute(async (req: AuthedRequest, res) => {
  const actor = requireActor(req);
  const key = req.body.key;
  if (!key) throw new AppError(400, "key is required.", "VALIDATION_ERROR");
  await assertFileKeyVisible(actor, String(key));
  ok(
    res,
    createDisplayUrl(
      String(key),
      typeof req.body.fileName === "string" ? req.body.fileName : undefined,
    ),
  );
});
