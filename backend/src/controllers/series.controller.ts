import { asyncRoute, created, ok, AppError } from "../lib/http.js";
import { env } from "../config/env.js";
import {
  SeriesModel,
  ChapterModel,
  ChapterReviewModel,
  PublicationModel,
  StudioCommentModel,
  StudioTaskModel,
  SubmissionModel,
  SeriesMemberModel,
  SeriesInviteModel,
  AuditEntryModel,
  MaterialModel,
  UserModel,
  ProposalModel,
} from "../db/models.js";
import { id, nowIso } from "../domain/ids.js";
import { audit } from "../services/audit.service.js";
import { presignR2Download, presignR2Upload } from "../services/r2.service.js";
import { createDisplayUrl, createLocalUploadUrl } from "../services/file-access.service.js";
import { assertFileKeyVisible, assertFileAccess } from "../services/studio-access.service.js";
import {
  assertCanMutateChapterById,
  assertCanMutateChapter,
  assertCanMutateChapterContent,
  assertCanMutateSeries,
  assertCanMutateSeriesById,
  assertCanMutateStudioPage,
  assertCanMutatePageContent,
  assertCanReadProposal,
  assertCanReadChapter,
  assertCanReadChapterById,
  assertCanReadSeries,
  assertCanReadSeriesById,
  assertChapterAcceptsPages,
  actorSeriesScopeFilter,
  mergeScope,
} from "../services/authorization.service.js";
import { applyChapterAction, seriesProposalSummary } from "../services/workflow.service.js";
import { chapterReadiness } from "../services/chapter-readiness.service.js";
import { findChapterBlockingComments } from "../services/chapter-review.service.js";
import { findAssistantAssignmentBlockers } from "../services/assignment-workload.service.js";
import { runWorkflowTransaction } from "../services/workflow-support.service.js";
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
  createPageSchema,
  patchPageSchema,
  reorderPagesSchema,
} from "../validators/chapter.schema.js";
import { presignDownloadSchema, displayUrlSchema } from "../validators/file.schema.js";
import {
  inviteAssistantSchema,
  updateMemberSchema,
} from "../validators/team.schema.js";
import type { AuthedRequest, ChapterAction, RequestActor } from "../types.js";
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

async function productionScopeForChapters(actor: RequestActor) {
  if (actor.role === "ASSISTANT") {
    return { assigneeId: actor.id };
  }
  const seriesScope = await actorSeriesScopeFilter(actor, "read");
  const series = await SeriesModel.find(seriesScope).select({ id: 1 }).lean();
  return { seriesId: { $in: series.map((item: any) => item.id) } };
}

export const listSeries = asyncRoute(async (req: AuthedRequest, res) => {
  const actor = requireActor(req);
  const mine = req.query.mine === "true";

  let filter: Record<string, any> = await actorSeriesScopeFilter(actor, "read");
  if (actor.role === "MANGAKA") {
    filter.authorId = actor.id;
  } else if (actor.role === "ASSISTANT") {
    const memberships = await SeriesMemberModel.find({ userId: actor.id, status: "active" }).lean();
    const seriesIds = memberships.map((m: any) => m.seriesId);
    filter.id = { $in: seriesIds };
  }

  if (mine) {
    if (actor.role === "MANGAKA") {
      filter.authorId = actor.id;
    } else if (actor.role === "ASSISTANT") {
      const memberships = await SeriesMemberModel.find({
        userId: actor.id,
        status: "active",
      }).lean();
      const seriesIds = memberships.map((m: any) => m.seriesId);
      filter.id = { $in: seriesIds };
    }
  }

  // `deletedAt` is retained only for legacy soft-deleted records. Those records
  // must stay out of normal production views so they cannot look actionable.
  filter.deletedAt = { $exists: false };

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

export const getSeries = asyncRoute(async (req: AuthedRequest, res) => {
  const actor = requireActor(req);
  const series = await assertCanReadSeriesById(actor, String(req.params.id));
  ok(res, series);
});

export const patchSeries = asyncRoute(async (req: AuthedRequest, res) => {
  const actor = requireActor(req);
  await assertCanMutateSeriesById(actor, String(req.params.id));
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
  await assertCanMutateSeries(actor, series);

  const isOwner = actor.role === "MANGAKA" && (series as any).authorId === actor.id;
  const isAssignedTantou = actor.role === "EDITOR" && (series as any).editorId === actor.id;

  if (action === "START_PRODUCTION") {
    if (!isOwner && !isAssignedTantou) {
      if (actor.role === "MANGAKA") {
        throw new AppError(
          403,
          "Only the owning Mangaka can start production.",
          "MANGAKA_OWNER_REQUIRED",
        );
      }
      throw new AppError(
        403,
        "Only the assigned Tantou can start production.",
        "TANTOU_ASSIGNMENT_REQUIRED",
      );
    }
    if (!["PRE_PRODUCTION", "PLANNING"].includes(String((series as any).status))) {
      throw new AppError(409, "Series is not ready to start production.", "INVALID_TRANSITION");
    }
    // Board approval is mandatory: a Series with no source proposal, or one whose
    // proposal is not APPROVED, can never enter production. The linkage must exist
    // so it cannot be bypassed by simply omitting proposalId at creation time.
    const sourceProposalId = (series as any).sourceProposalId ?? (series as any).proposalId;
    if (!sourceProposalId) {
      throw new AppError(
        409,
        "Series must originate from a Board-approved proposal before production starts.",
        "PROPOSAL_NOT_APPROVED",
      );
    }
    const sourceProposal = await ProposalModel.findOne({
      id: sourceProposalId,
      status: "APPROVED",
    }).lean();
    if (!sourceProposal) {
      throw new AppError(
        409,
        "Series must originate from a Board-approved proposal before production starts.",
        "PROPOSAL_NOT_APPROVED",
      );
    }
    const updated = await SeriesModel.findOneAndUpdate(
      { id: seriesId, status: (series as any).status },
      { $set: { status: "ONGOING", startedAt: nowIso(), updatedAt: nowIso() } },
      { returnDocument: "after" },
    ).lean();
    if (!updated) throw new AppError(409, "Series changed while starting production.", "CONFLICT");
    await audit(req, "series.start_production", "series", seriesId, {
      previousStatus: (series as any).status,
      nextStatus: "ONGOING",
    });
    ok(res, updated);
    return;
  }

  const isPublic = PUBLIC_SERIES_STATUSES.has(String((series as any).status));
  const currentStatus = String((series as any).status);

  if (action === "ARCHIVE" || action === "UNPUBLISH") {
    throw new AppError(
      403,
      "Active series can only be cancelled by the Board through an At-risk CANCEL decision.",
      "BOARD_AT_RISK_REQUIRED",
    );
  }

  if (action === "UNPUBLISH") {
    if (!["ONGOING", "PUBLISHED", "PUBLIC"].includes(currentStatus)) {
      throw new AppError(
        409,
        `Cannot unpublish a series from ${currentStatus}.`,
        "INVALID_TRANSITION",
      );
    }
    if (!isAssignedTantou) {
      throw new AppError(
        403,
        "Only the assigned Tantou can unpublish this series.",
        "TANTOU_ASSIGNMENT_REQUIRED",
      );
    }
  } else if (action === "ARCHIVE") {
    if (currentStatus === "ARCHIVED") {
      throw new AppError(409, "Series is already archived.", "INVALID_TRANSITION");
    }
    if (!["PLANNING", "PRE_PRODUCTION", "ONGOING", "PUBLISHED", "PUBLIC"].includes(currentStatus)) {
      throw new AppError(
        409,
        `Cannot archive a series from ${currentStatus}.`,
        "INVALID_TRANSITION",
      );
    }
    if (isPublic) {
      if (!isAssignedTantou) {
        throw new AppError(
          403,
          "Only the assigned Tantou can archive a published series.",
          "TANTOU_ASSIGNMENT_REQUIRED",
        );
      }
    } else if (!isOwner && !isAssignedTantou) {
      if (actor.role === "MANGAKA") {
        throw new AppError(
          403,
          "Only the owning Mangaka can archive this series.",
          "MANGAKA_OWNER_REQUIRED",
        );
      }
      throw new AppError(
        403,
        "Only the assigned Tantou can archive this series.",
        "TANTOU_ASSIGNMENT_REQUIRED",
      );
    }
  }

  const status = action === "UNPUBLISH" ? "HIATUS" : action === "ARCHIVE" ? "ARCHIVED" : null;
  if (!status) throw new AppError(400, "Unknown series lifecycle action.", "INVALID_ACTION");
  const patch: Record<string, unknown> = {
    status,
    visibility: "UNLISTED",
    updatedAt: nowIso(),
  };
  if (action === "ARCHIVE") patch.archivedAt = nowIso();
  if (action === "UNPUBLISH") patch.unpublishedAt = nowIso();

  // Sprint 2.5 (PUB-001): cancelling scheduled publications on archive is the
  // canonical guarantee that the publication runner will never push content
  // for an archived series. We cancel before the status flip to keep the
  // decision recoverable for audit, then patch Series inside the same logical
  // step so an archive that fails on the Series write does not orphan the
  // cancellation.
  let cancelledPublications = 0;
  if (action === "ARCHIVE") {
    const cancelResult = await PublicationModel.updateMany(
      { seriesId, status: { $in: ["DRAFT", "SCHEDULED"] } },
      {
        $set: {
          status: "CANCELLED",
          cancelledReason: "Series archived",
          updatedAt: nowIso(),
        },
      },
    );
    cancelledPublications = Number(cancelResult.modifiedCount ?? 0);
  }

  const updated = await SeriesModel.findOneAndUpdate(
    { id: seriesId, status: currentStatus },
    { $set: patch },
    { returnDocument: "after" },
  ).lean();
  if (!updated) throw new AppError(409, "Series changed while applying lifecycle action.", "CONFLICT");
  await audit(req, `series.${action.toLowerCase()}`, "series", seriesId, {
    previousStatus: (series as any).status,
    nextStatus: status,
    cancelledPublications,
  });
  ok(res, { ...updated, cancelledPublications });
});

export const listSeriesChapters = asyncRoute(async (req: AuthedRequest, res) => {
  const actor = requireActor(req);
  await assertCanReadSeriesById(actor, String(req.params.id));
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
  const byChapter = new Map(
    publications.map((publication: any) => [publication.chapterId, publication]),
  );
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
  const actor = requireActor(req);
  const series = await assertCanMutateSeriesById(actor, String(req.params.id));
  const now = nowIso();
  const body = parseBody(createChapterSchema, req);
  rejectProtectedFields(body as Record<string, unknown>);
  const chapter = await (ChapterModel as any).create({
    id: id("ch"),
    seriesId: String(req.params.id),
    number: Number(body.number ?? 1),
    title: body.title ?? "Untitled chapter",
    targetPages: Number(body.targetPages ?? 20),
    status: "PLANNED",
    // A chapter belongs to the series' Mangaka. Assistant assignment happens
    // later on StudioTask records, at page/region level.
    assigneeId: (series as any).authorId,
    assigneeName: (series as any).authorName,
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
  const actor = requireActor(req);
  const targetId = String(req.params.seriesId);
  const proposal = await ProposalModel.findOne({ id: targetId }).lean();
  if (proposal) {
    await assertCanReadProposal(actor, proposal);
  } else {
    await assertCanReadSeriesById(actor, targetId);
  }
  ok(res, await seriesProposalSummary(targetId));
});

export const getSeriesActivity = asyncRoute(async (req: AuthedRequest, res) => {
  const actor = requireActor(req);
  const seriesId = String(req.params.seriesId);
  const series = await SeriesModel.findOne({ id: seriesId }).lean();
  if (!series) throw new AppError(404, "Series not found.", "SERIES_NOT_FOUND");
  await assertCanReadSeries(actor, series);

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
  const actor = requireActor(req);
  const seriesId = String(req.params.seriesId);
  await assertCanReadSeriesById(actor, seriesId);
  const members = await SeriesMemberModel.find({ seriesId }).lean();
  const userIds = [...new Set(members.map((member: any) => String(member.userId)))];
  const users = await UserModel.find({ id: { $in: userIds } })
    .select({ id: 1, name: 1, email: 1, role: 1, active: 1 })
    .lean();
  const usersById = new Map(users.map((user: any) => [String(user.id), user]));
  ok(
    res,
    members.map((member: any) => {
      const user = usersById.get(String(member.userId));
      return {
        ...member,
        userName: user?.name ?? null,
        userEmail: user?.email ?? null,
        userRole: user?.role ?? null,
        userActive: user?.active !== false,
      };
    }),
  );
});

export const addMember = asyncRoute(async (req: AuthedRequest, res) => {
  throw new AppError(
    410,
    "Direct team membership creation is retired. Create an invite and let the Assistant accept it.",
    "INVITE_ACCEPTANCE_REQUIRED",
  );
});

export const updateMember = asyncRoute(async (req: AuthedRequest, res) => {
  const actor = requireActor(req);
  const memberId = String(req.params.memberId);
  const seriesId = String(req.params.seriesId);
  await assertCanMutateSeriesById(actor, seriesId);
  const body = parseBody(updateMemberSchema, req);
  const allowedFields = [
    "scope",
    "assignedChapterIds",
    "assignedTaskIds",
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
  const actor = requireActor(req);
  const memberId = String(req.params.memberId);
  const seriesId = String(req.params.seriesId);
  await assertCanMutateSeriesById(actor, seriesId);
  const member = await SeriesMemberModel.findOne({ id: memberId, seriesId }).lean();
  if (!member) throw new AppError(404, "Member not found.", "MEMBER_NOT_FOUND");
  if (String((member as any).role) === "assistant") {
    const blockers = await findAssistantAssignmentBlockers(
      seriesId,
      String((member as any).userId),
    );
    if (blockers.length > 0) {
      throw new AppError(
        409,
        "Assistant has active assignments that must be reassigned or cancelled first.",
        "ACTIVE_ASSIGNMENTS_EXIST",
        { blockers },
      );
    }
  }
  const deleted = await SeriesMemberModel.findOneAndDelete({ id: memberId, seriesId }).lean();
  if (String((deleted as any)?.role) === "assistant") {
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
  await assertCanMutateSeries(actor, series);

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
    role: "assistant",
    status: "active",
  }).lean();
  if (existing) {
    throw new AppError(409, "Assistant is already a member.", "ALREADY_MEMBER");
  }

  const pending = await SeriesInviteModel.findOne({
    seriesId,
    userId: (user as any).id,
    status: "PENDING",
  }).lean();
  if (pending) throw new AppError(409, "Assistant already has a pending invite.", "INVITE_PENDING");

  const invite = await SeriesInviteModel.create({
    id: id("invite"),
    seriesId,
    userId: (user as any).id,
    email: body.email,
    role: "assistant",
    scope: body.scope ?? "Full chapter",
    invitedById: actor.id,
    status: "PENDING",
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    createdAt: nowIso(),
    updatedAt: nowIso(),
  });
  await audit(req, "series.assistant_invite", "series", seriesId, {
    userId: (user as any).id,
    email: body.email,
  });
  created(res, invite);
});

export const listSeriesInvites = asyncRoute(async (req: AuthedRequest, res) => {
  const actor = requireActor(req);
  const seriesId = typeof req.params.seriesId === "string" ? req.params.seriesId : undefined;
  if (seriesId) {
    await assertCanReadSeriesById(actor, seriesId);
    ok(res, await SeriesInviteModel.find({ seriesId }).sort({ createdAt: -1 }).lean());
    return;
  }
  // Assistant's own pending invites — enrich with series title + inviter name
  const raw = await SeriesInviteModel.find({
    userId: actor.id,
    status: "PENDING",
    $or: [{ expiresAt: { $exists: false } }, { expiresAt: { $gt: new Date() } }],
  })
    .sort({ createdAt: -1 })
    .lean();

  if (raw.length === 0) {
    ok(res, []);
    return;
  }

  const seriesIds = [...new Set(raw.map((inv: any) => inv.seriesId))];
  const inviterIds = [...new Set(raw.map((inv: any) => inv.invitedById))];

  const [seriesDocs, inviterDocs] = await Promise.all([
    SeriesModel.find({ id: { $in: seriesIds } }, { id: 1, title: 1 }).lean(),
    UserModel.find({ id: { $in: inviterIds } }, { id: 1, name: 1 }).lean(),
  ]);

  const titleMap = new Map(seriesDocs.map((s: any) => [s.id, s.title]));
  const nameMap = new Map(inviterDocs.map((u: any) => [u.id, u.name]));

  const enriched = raw.map((inv: any) => ({
    ...inv,
    seriesTitle: titleMap.get(inv.seriesId) ?? undefined,
    inviterName: nameMap.get(inv.invitedById) ?? undefined,
  }));

  ok(res, enriched);
});


export const acceptSeriesInvite = asyncRoute(async (req: AuthedRequest, res) => {
  const actor = requireActor(req);
  if (actor.role !== "ASSISTANT") throw new AppError(403, "Only an Assistant can accept this invite.", "FORBIDDEN");
  const inviteId = String(req.params.inviteId);
  const invite = await SeriesInviteModel.findOne({ id: inviteId, userId: actor.id, status: "PENDING" }).lean();
  if (!invite) throw new AppError(404, "Pending invite not found.", "INVITE_NOT_FOUND");
  if ((invite as any).expiresAt && new Date((invite as any).expiresAt).getTime() <= Date.now()) {
    await SeriesInviteModel.updateOne(
      { id: inviteId, status: "PENDING" },
      { $set: { status: "EXPIRED", updatedAt: new Date() } },
    );
    throw new AppError(409, "This invite has expired.", "INVITE_EXPIRED");
  }
  const user = (await UserModel.findOne({ id: actor.id }).lean()) as any;
  if (!user || user.role !== "ASSISTANT" || user.active === false) {
    throw new AppError(409, "Assistant account is inactive.", "USER_INACTIVE");
  }
  const now = nowIso();
  const member = await runWorkflowTransaction(async (session) => {
    const series = (await SeriesModel.findOne({ id: (invite as any).seriesId })
      .session(session)
      .lean()) as any;
    if (!series || series.deletedAt || String(series.status) === "ARCHIVED") {
      throw new AppError(
        409,
        "This series is no longer accepting team members.",
        "SERIES_NOT_ACCEPTING_MEMBERS",
      );
    }

    const current = await SeriesInviteModel.findOneAndUpdate(
      {
        id: inviteId,
        userId: actor.id,
        status: "PENDING",
        $or: [{ expiresAt: { $exists: false } }, { expiresAt: { $gt: new Date() } }],
      },
      { $set: { status: "ACCEPTED", acceptedAt: new Date(), updatedAt: new Date() } },
      { returnDocument: "after", session },
    ).lean();
    if (!current) throw new AppError(409, "Invite was already processed.", "INVITE_ALREADY_PROCESSED");
    const existingMember = await SeriesMemberModel.findOne({
      seriesId: (invite as any).seriesId,
      userId: actor.id,
      role: "assistant",
    }).session(session).lean();
    let acceptedMember: any;
    if (existingMember) {
      acceptedMember = await SeriesMemberModel.findOneAndUpdate(
        { id: (existingMember as any).id },
        { $set: { status: "active", scope: (invite as any).scope, updatedAt: now } },
        { returnDocument: "after", session },
      ).lean();
    } else {
      const [createdMember] = await SeriesMemberModel.create([{
        id: id("sm"),
        seriesId: (invite as any).seriesId,
        userId: actor.id,
        role: "assistant",
        scope: (invite as any).scope,
        status: "active",
        assignedChapterIds: [],
        assignedTaskIds: [],
        createdAt: now,
        updatedAt: now,
      }], { session });
      acceptedMember = createdMember.toObject();
    }
    const seriesUpdate = await SeriesModel.updateOne(
      { id: (invite as any).seriesId },
      { $addToSet: { assistantIds: actor.id }, $set: { updatedAt: now } },
      { session },
    );
    if (seriesUpdate.matchedCount !== 1) {
      throw new AppError(
        409,
        "This series is no longer accepting team members.",
        "SERIES_NOT_ACCEPTING_MEMBERS",
      );
    }
    return acceptedMember;
  });
  await audit(req, "series.assistant_invite_accept", "series", String((invite as any).seriesId), {
    inviteId,
    userId: actor.id,
  });
  created(res, member);
});

export const declineSeriesInvite = asyncRoute(async (req: AuthedRequest, res) => {
  const actor = requireActor(req);
  if (actor.role !== "ASSISTANT") throw new AppError(403, "Only an Assistant can decline this invite.", "FORBIDDEN");
  const updated = await SeriesInviteModel.findOneAndUpdate(
    { id: String(req.params.inviteId), userId: actor.id, status: "PENDING" },
    { $set: { status: "DECLINED", declinedAt: new Date(), updatedAt: new Date() } },
    { returnDocument: "after" },
  ).lean();
  if (!updated) throw new AppError(404, "Pending invite not found.", "INVITE_NOT_FOUND");
  await audit(req, "series.assistant_invite_decline", "series", String((updated as any).seriesId), {
    inviteId: String(req.params.inviteId),
  });
  ok(res, updated);
});

// Chapters (standalone)
export const getChapter = asyncRoute(async (req: AuthedRequest, res) => {
  const actor = requireActor(req);
  const chapter = await assertCanReadChapterById(actor, String(req.params.chapterId));
  ok(res, (await attachPublications([chapter]))[0]);
});

export const patchChapter = asyncRoute(async (req: AuthedRequest, res) => {
  const actor = requireActor(req);
  await assertCanMutateChapterById(actor, String(req.params.chapterId));
  const body = parseBody(patchChapterSchema, req);
  const allowedFields = [
    "title",
    "number",
    "targetPages",
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
      filter.status = { $in: ["PLANNED", "IN_PRODUCTION", "REVISION_REQUIRED"] };
    } else if (user.role === "EDITOR") {
      filter.status = {
        $in: ["TANTOU_REVIEW", "READY_FOR_PUBLICATION", "PUBLISHED"],
      };
    }
  }
  if (req.query.seriesId) filter.seriesId = String(req.query.seriesId);
  const scopedFilter = mergeScope(filter, await productionScopeForChapters(user));
  const { page, limit, skip } = paginationFromQuery(req);
  const [chapters, total] = await Promise.all([
    ChapterModel.find(scopedFilter).sort({ updatedAt: -1 }).skip(skip).limit(limit).lean(),
    ChapterModel.countDocuments(scopedFilter),
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
  const actor = requireActor(req);
  const chapter = await assertCanReadChapterById(actor, String(req.params.chapterId));
  ok(res, (chapter as any).pages ?? []);
});

export const getChapterReadiness = asyncRoute(async (req: AuthedRequest, res) => {
  const actor = requireActor(req);
  const chapterId = String(req.params.chapterId);
  const chapter = await ChapterModel.findOne({ id: chapterId }).lean();
  if (!chapter) throw new AppError(404, "Chapter not found.", "CHAPTER_NOT_FOUND");
  await assertCanReadChapter(actor, chapter);
  const [tasks, submissions] = await Promise.all([
    StudioTaskModel.find({ chapterId }).lean(),
    SubmissionModel.find({ chapterId }).lean(),
  ]);
  const comments = await findChapterBlockingComments(chapter, tasks, submissions, ["RESOLVED"]);
  ok(res, chapterReadiness(chapter, comments, tasks, submissions));
});

export const listChapterReviews = asyncRoute(async (req: AuthedRequest, res) => {
  const actor = requireActor(req);
  const chapterId = String(req.params.chapterId);
  const chapter = await ChapterModel.findOne({ id: chapterId }).lean();
  if (!chapter) throw new AppError(404, "Chapter not found.", "CHAPTER_NOT_FOUND");
  await assertCanReadChapter(actor, chapter);
  const reviews = await ChapterReviewModel.find({ chapterId }).sort({ createdAt: -1 }).lean();
  ok(res, reviews);
});

export const createChapterPage = asyncRoute(async (req: AuthedRequest, res) => {
  const actor = requireActor(req);
  const chapterId = String(req.params.chapterId);
  const chapter = await ChapterModel.findOne({ id: chapterId });
  if (!chapter) throw new AppError(404, "Chapter not found.", "CHAPTER_NOT_FOUND");
  await assertCanMutateChapterContent(actor, chapter);
  // Workflow integrity: only chapters in IN_PRODUCTION or REVISION_REQUIRED
  // accept pages. To create the first page on a PLANNED chapter, the client
  // must call POST /api/chapters/:id/actions with action=START_DRAFT first,
  // which routes through applyChapterAction and produces audit + outbox.
  assertChapterAcceptsPages(chapter);

  const body = parseBody(createPageSchema, req);
  rejectStatusOverride(body as Record<string, unknown>);
  const hasPageAsset = Boolean(body.fileKey || body.fileUrl || body.imageUrl);
  const newPage = {
    id: body.id ?? id("pg"),
    pageNumber: Number(body.pageNumber ?? ((chapter as any).pages?.length ?? 0) + 1),
    status: hasPageAsset ? "UPLOADED" : "PENDING_UPLOAD",
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

  const pageCreate = await ChapterModel.updateOne(
    { id: chapterId, status: { $in: ["IN_PRODUCTION", "REVISION_REQUIRED"] } },
    {
      $push: { pages: newPage },
      $set: { updatedAt: nowIso() },
    },
  );
  if (pageCreate.matchedCount !== 1) {
    throw new AppError(
      409,
      "Chapter status changed while creating the page. Refresh and retry.",
      "CHAPTER_STATE_CONFLICT",
    );
  }

  await audit(req, "chapter.page.created", "chapter", chapterId, {
    pageId: newPage.id,
    pageNumber: newPage.pageNumber,
  });
  created(res, newPage);
});

export const updatePage = asyncRoute(async (req: AuthedRequest, res) => {
  const actor = requireActor(req);
  const pageId = String(req.params.pageId);
  const chapter = await ChapterModel.findOne({ "pages.id": pageId });
  if (!chapter) throw new AppError(404, "Page not found.", "PAGE_NOT_FOUND");
  await assertCanMutatePageContent(actor, pageId);

  const body = parseBody(patchPageSchema, req);
  rejectStatusOverride(body as Record<string, unknown>);
  const hasReplacementAsset = Boolean(body.fileKey || body.fileUrl || body.imageUrl);
  const now = nowIso();
  const pages = (chapter as any).pages.map((p: any) => {
    if (p.id === pageId) {
      return {
        ...p,
        ...body,
        ...(hasReplacementAsset ? { status: "UPLOADED", uploadedAt: now } : {}),
        updatedAt: now,
      };
    }
    return p;
  });

  const pageUpdate = await ChapterModel.updateOne(
    { id: chapter.id, status: { $in: ["PLANNED", "IN_PRODUCTION", "REVISION_REQUIRED"] } },
    { $set: { pages, updatedAt: now } },
  );
  if (pageUpdate.matchedCount !== 1) {
    throw new AppError(409, "Chapter content is locked while Tantou review is active.", "CHAPTER_REVIEW_LOCKED");
  }
  const updatedPage = pages.find((p: any) => p.id === pageId);
  ok(res, updatedPage);
});

export const reorderChapterPages = asyncRoute(async (req: AuthedRequest, res) => {
  const actor = requireActor(req);
  const chapterId = String(req.params.chapterId);
  const chapter = await ChapterModel.findOne({ id: chapterId });
  if (!chapter) throw new AppError(404, "Chapter not found.", "CHAPTER_NOT_FOUND");
  await assertCanMutateChapterContent(actor, chapter);

  const { orderedPageIds } = parseBody(reorderPagesSchema, req);
  const currentPages = (chapter as any).pages ?? [];
  const uniqueIds = new Set(orderedPageIds);
  const currentIds = new Set(currentPages.map((page: any) => String(page.id)));
  if (
    uniqueIds.size !== orderedPageIds.length ||
    uniqueIds.size !== currentIds.size ||
    orderedPageIds.some((pageId) => !currentIds.has(pageId))
  ) {
    throw new AppError(
      400,
      "orderedPageIds must contain every Chapter page exactly once.",
      "INVALID_PAGE_ORDER",
    );
  }

  const byId = new Map<string, Record<string, unknown>>(
    currentPages.map((page: Record<string, unknown>) => [String(page.id), page]),
  );
  const now = nowIso();
  const pages = orderedPageIds.map((pageId, position) => ({
    ...byId.get(pageId),
    index: position + 1,
    pageNumber: position + 1,
    updatedAt: now,
  }));
  const reorderUpdate = await ChapterModel.updateOne(
    { id: chapterId, status: { $in: ["PLANNED", "IN_PRODUCTION", "REVISION_REQUIRED"] } },
    { $set: { pages, updatedAt: now } },
  );
  if (reorderUpdate.matchedCount !== 1) {
    throw new AppError(409, "Chapter content is locked while Tantou review is active.", "CHAPTER_REVIEW_LOCKED");
  }
  await audit(req, "CHAPTER_PAGES_REORDERED", "chapter", chapterId, { orderedPageIds });
  ok(res, pages);
});

export const deletePage = asyncRoute(async (req: AuthedRequest, res) => {
  const actor = requireActor(req);
  const pageId = String(req.params.pageId);
  const chapter = await ChapterModel.findOne({ "pages.id": pageId });
  if (!chapter) throw new AppError(404, "Page not found.", "PAGE_NOT_FOUND");
  await assertCanMutatePageContent(actor, pageId);

  const now = nowIso();
  const pages = ((chapter as any).pages ?? [])
    .filter((page: any) => page.id !== pageId)
    .map((page: any, position: number) => ({
      ...page,
      index: position + 1,
      pageNumber: position + 1,
      updatedAt: now,
    }));
  const deleteUpdate = await ChapterModel.updateOne(
    { id: chapter.id, status: { $in: ["PLANNED", "IN_PRODUCTION", "REVISION_REQUIRED"] } },
    { $set: { pages, updatedAt: now } },
  );
  if (deleteUpdate.matchedCount !== 1) {
    throw new AppError(409, "Chapter content is locked while Tantou review is active.", "CHAPTER_REVIEW_LOCKED");
  }
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
  if (signed.storage === "metadata-only" || env.FILE_STORAGE_MODE === "local" || process.env.VITEST) {
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
  const body = parseBody(presignDownloadSchema, req);
  await assertFileAccess(actor, body);
  ok(res, await presignR2Download(body.key));
});

export const displayUrl = asyncRoute(async (req: AuthedRequest, res) => {
  const actor = requireActor(req);
  const body = parseBody(displayUrlSchema, req);
  await assertFileAccess(actor, body);
  ok(res, createDisplayUrl(body.key, body.fileName));
});
