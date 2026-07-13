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
  ProposalModel,
} from "../db/models.js";
import { id, nowIso } from "../domain/ids.js";
import { audit } from "../services/audit.service.js";
import { presignR2Download, presignR2Upload } from "../services/r2.service.js";
import { createDisplayUrl, createLocalUploadUrl } from "../services/file-access.service.js";
import { assertFileKeyVisible } from "../services/studio-access.service.js";
import {
  assertCanReadChapter,
  assertCanReadPage,
  assertCanReadSeries,
  readableSeriesIdsForActor,
  scopedChapterIdsForActor,
} from "../services/mvp-access.service.js";
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
  sanitizePatch,
} from "../validators/common.js";
import { patchSeriesSchema } from "../validators/series.schema.js";
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
import type { AuthedRequest } from "../types.js";
import { CHAPTER_ACTIONS } from "../types.js";

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

async function assertMangakaOwnsPage(req: AuthedRequest, pageId: string) {
  const chapter = (await ChapterModel.findOne({ "pages.id": pageId }).lean()) as any;
  if (!chapter) throw new AppError(404, "Page not found.", "PAGE_NOT_FOUND");
  await assertMangakaOwnsSeries(req, String(chapter.seriesId));
  return chapter;
}

async function assertCanReadSummary(req: AuthedRequest, id: string) {
  const actor = requireActor(req);
  const series = await SeriesModel.findOne({ id }).select({ id: 1 }).lean();
  if (series) {
    await assertCanReadSeries(actor, id, { allowBoardGovernance: true });
    return;
  }

  const proposal = (await ProposalModel.findOne({ id }).lean()) as any;
  if (!proposal) throw new AppError(404, "Resource not found.", "NOT_FOUND");
  const boardVisibleStatuses = new Set([
    "PENDING_BOARD",
    "BOARD_VOTING",
    "TIE_BREAK",
    "APPROVED",
    "REJECTED",
  ]);
  const allowed =
    (actor.role === "MANGAKA" && proposal.authorId === actor.id) ||
    actor.role === "EDITOR" ||
    (actor.role === "BOARD" && boardVisibleStatuses.has(String(proposal.status)));
  if (!allowed) throw new AppError(404, "Resource not found.", "NOT_FOUND");
}

export const listSeries = asyncRoute(async (req: AuthedRequest, res) => {
  const actor = requireActor(req);
  const seriesIds = await readableSeriesIdsForActor(actor);
  const filter: Record<string, any> = { id: { $in: seriesIds } };

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
  throw new AppError(
    403,
    "Series are created only after the Board approves a Proposal with a Tantou Editor and publication type.",
    "SERIES_CREATION_WORKFLOW_REQUIRED",
  );
});

export const getSeries = asyncRoute(async (req: AuthedRequest, res) => {
  ok(res, await assertCanReadSeries(requireActor(req), String(req.params.id)));
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
  await assertCanReadSeries(requireActor(req), String(req.params.id));
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
  if (req.actor?.role !== "MANGAKA" || series.authorId !== req.actor.id) {
    throw new AppError(403, "Only the series Mangaka can create chapters.", "MANGAKA_OWNER_REQUIRED");
  }
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

export const getSeriesSummary = asyncRoute(async (req: AuthedRequest, res) => {
  const summaryId = String(req.params.seriesId);
  await assertCanReadSummary(req, summaryId);
  ok(res, await seriesProposalSummary(summaryId));
});

export const getSeriesActivity = asyncRoute(async (req: AuthedRequest, res) => {
  const seriesId = String(req.params.seriesId);
  await assertCanReadSeries(requireActor(req), seriesId);

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
  await assertCanReadSeries(requireActor(req), seriesId);
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
  const requestedSeriesId = req.query.seriesId ? String(req.query.seriesId) : undefined;
  const readableChapterIds = await scopedChapterIdsForActor(user, requestedSeriesId);
  const filter: Record<string, unknown> = { id: { $in: readableChapterIds } };
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

export const createChapterPage = asyncRoute(async (req: AuthedRequest, res) => {
  const chapterId = String(req.params.chapterId);
  const chapter = await ChapterModel.findOne({ id: chapterId });
  if (!chapter) throw new AppError(404, "Chapter not found.", "CHAPTER_NOT_FOUND");
  const series = (await SeriesModel.findOne({ id: (chapter as any).seriesId }).lean()) as any;
  if (req.actor?.role !== "MANGAKA" || series?.authorId !== req.actor.id) {
    throw new AppError(403, "Only the series Mangaka can create pages.", "MANGAKA_OWNER_REQUIRED");
  }

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
  const chapter = await assertMangakaOwnsPage(req, pageId);

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
  const chapter = await assertMangakaOwnsPage(req, pageId);

  await ChapterModel.updateOne(
    { id: chapter.id },
    { $pull: { pages: { id: pageId } }, $set: { updatedAt: nowIso() } },
  );
  ok(res, { id: pageId });
});

export const getPage = asyncRoute(async (req: AuthedRequest, res) => {
  const { page } = await assertCanReadPage(requireActor(req), String(req.params.pageId));
  ok(res, page);
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
