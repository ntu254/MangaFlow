import {
  ChapterModel,
  MaterialModel,
  ProposalModel,
  SeriesModel,
  StudioTaskModel,
  SubmissionModel,
} from "../db/models.js";
import { AppError } from "../lib/http.js";
import { canReadProposal } from "./authorization.service.js";
import type { RequestActor } from "../types.js";
import { assertChapterContentUnlocked } from "./authorization.service.js";
import type { FileResourceType } from "../validators/file.schema.js";

export type ResolvedStudioPage = {
  chapter: any;
  page: any;
  series: any;
};

async function hasSeriesScope(actor: RequestActor, series: any) {
  if (actor.role === "BOARD") return true;
  if (actor.role === "MANGAKA") return series.authorId === actor.id;
  if (actor.role === "EDITOR") return series.editorId === actor.id;
  if (actor.role === "ASSISTANT") {
    const member = await import("../db/models.js").then(({ SeriesMemberModel }) =>
      SeriesMemberModel.findOne({ seriesId: series.id, userId: actor.id, status: "active" }).lean(),
    );
    return Boolean(member);
  }
  return false;
}

/**
 * Auth-002 — resolve file ownership from a (resourceType, resourceId) tuple
 * instead of brute-force searching every owner collection. The resource is
 * resolved first, the same authorization path used by the matching GET
 * endpoint is invoked, and finally the fileKey is checked to actually belong
 * to that resource. That way the client cannot trick the presigner into
 * returning a URL for an arbitrary file just because the actor happens to
 * be able to read *some* resource on the same Series.
 */
export type FileAccessRequest = {
  key: string;
  resourceType?: FileResourceType;
  resourceId?: string;
};

export async function assertFileAccess(actor: RequestActor, body: FileAccessRequest) {
  if (!body.key) throw new AppError(400, "key is required.", "VALIDATION_ERROR");

  if (!body.resourceType || !body.resourceId) {
    return assertFileKeyVisible(actor, body.key);
  }

  switch (body.resourceType) {
    case "PAGE": {
      const resolved = await resolveStudioPage(body.resourceId);
      const owned =
        resolved.page?.fileKey === body.key ||
        resolved.page?.metadata?.aiWhitened?.fileKey === body.key;
      if (!owned) {
        throw new AppError(403, "File does not belong to the supplied page.", "FORBIDDEN");
      }
      return assertCanReadStudioPage(actor, body.resourceId);
    }
    case "CHAPTER": {
      const chapter = await ChapterModel.findOne({ id: body.resourceId }).lean();
      if (!chapter) throw new AppError(404, "Chapter not found.", "CHAPTER_NOT_FOUND");
      const owns = ((chapter as any).pages ?? []).some(
        (page: any) =>
          page.fileKey === body.key || page.metadata?.aiWhitened?.fileKey === body.key,
      );
      if (!owns) {
        throw new AppError(403, "File does not belong to the supplied chapter.", "FORBIDDEN");
      }
      const { assertCanReadChapter } = await import("./authorization.service.js");
      return assertCanReadChapter(actor, chapter);
    }
    case "SERIES": {
      const series = await SeriesModel.findOne({ id: body.resourceId }).lean();
      if (!series) throw new AppError(404, "Series not found.", "SERIES_NOT_FOUND");
      const owns =
        (series as any).coverFileKey === body.key ||
        (await MaterialModel.exists({
          seriesId: body.resourceId,
          $or: [{ fileKey: body.key }, { "versions.fileKey": body.key }],
        }));
      if (!owns) {
        throw new AppError(403, "File does not belong to the supplied series.", "FORBIDDEN");
      }
      const { assertCanReadSeries } = await import("./authorization.service.js");
      await assertCanReadSeries(actor, series);
      return { chapter: null, page: null, series };
    }
    case "PROPOSAL": {
      const proposal = await ProposalModel.findOne({ id: body.resourceId }).lean();
      if (!proposal) throw new AppError(404, "Proposal not found.", "PROPOSAL_NOT_FOUND");
      const owns =
        (proposal as any).coverFileKey === body.key ||
        ((proposal as any).manuscripts ?? []).some(
          (m: any) =>
            m.fileKey === body.key ||
            m.key === body.key ||
            m.file?.key === body.key,
        ) ||
        ((proposal as any).materials ?? []).some(
          (m: any) =>
            m.fileKey === body.key ||
            m.key === body.key ||
            m.file?.key === body.key ||
            (m.versions ?? []).some(
              (v: any) =>
                v.fileKey === body.key ||
                v.key === body.key ||
                v.file?.key === body.key,
            ),
        );
      if (!owns) {
        throw new AppError(403, "File does not belong to the supplied proposal.", "FORBIDDEN");
      }
      const { assertCanReadProposal } = await import("./authorization.service.js");
      await assertCanReadProposal(actor, proposal);
      return { chapter: null, page: null, series: null };
    }
    case "MATERIAL": {
      const material = (await MaterialModel.findOne({ id: body.resourceId }).lean()) as any;
      if (!material) throw new AppError(404, "Material not found.", "MATERIAL_NOT_FOUND");
      const owns =
        material.fileKey === body.key ||
        (material.versions ?? []).some((v: any) => v.fileKey === body.key);
      if (!owns) {
        throw new AppError(403, "File does not belong to the supplied material.", "FORBIDDEN");
      }
      if (material.pageId) return assertCanReadStudioPage(actor, String(material.pageId));
      if (material.seriesId) {
        const series = await SeriesModel.findOne({ id: String(material.seriesId) }).lean();
        if (series && (await hasSeriesScope(actor, series))) {
          return { chapter: null, page: null, series };
        }
      }
      if (material.chapterId) {
        const chapter = await ChapterModel.findOne({ id: String(material.chapterId) }).lean();
        if (chapter) {
          const { assertCanReadChapter } = await import("./authorization.service.js");
          await assertCanReadChapter(actor, chapter);
        }
      }
      return { chapter: null, page: null, series: null };
    }
    case "SUBMISSION": {
      const submission = (await SubmissionModel.findOne({ id: body.resourceId }).lean()) as any;
      if (!submission) throw new AppError(404, "Submission not found.", "SUBMISSION_NOT_FOUND");
      if (submission.fileKey !== body.key) {
        throw new AppError(
          403,
          "File does not belong to the supplied submission.",
          "FORBIDDEN",
        );
      }
      if (submission.assistantId === actor.id) {
        return { chapter: null, page: null, series: null };
      }
      if (submission.pageId) return assertCanReadStudioPage(actor, String(submission.pageId));
      if (submission.chapterId) {
        const chapter = await ChapterModel.findOne({ id: String(submission.chapterId) }).lean();
        if (chapter) {
          const { assertCanReadChapter } = await import("./authorization.service.js");
          await assertCanReadChapter(actor, chapter);
        }
      }
      return { chapter: null, page: null, series: null };
    }
    default:
      return assertFileKeyVisible(actor, body.key);
  }
}

export async function resolveStudioPage(pageId: string): Promise<ResolvedStudioPage> {
  const chapter = await ChapterModel.findOne({ "pages.id": pageId }).lean();
  if (!chapter) throw new AppError(404, "Page not found.", "PAGE_NOT_FOUND");
  const page = ((chapter as any).pages ?? []).find((item: any) => item.id === pageId);
  const series = await SeriesModel.findOne({ id: (chapter as any).seriesId }).lean();
  if (!series) throw new AppError(404, "Series not found.", "SERIES_NOT_FOUND");
  return { chapter, page, series };
}

export async function assertCanReadStudioPage(actor: RequestActor, pageId: string) {
  const resolved = await resolveStudioPage(pageId);
  const isAssistant = actor.role === "ASSISTANT";

  if (isAssistant) {
    // Workflow integrity (Sprint 1.4): an Assistant can read a page only when
    // they have either a current assignment on it OR an active (non-terminal)
    // task on it. COMPLETED / REJECTED / CANCELLED tasks are not enough — they
    // are historical artefacts and must not silently grant future access to
    // the file presigner. The studio page also keeps a TASK_ONLY scope for
    // assistants whose membership is TASK_ONLY (see SeriesMember.scope);
    // they should never see pages outside their task set.
    const task = await StudioTaskModel.findOne({
      pageId,
      assigneeId: actor.id,
      status: { $nin: ["REJECTED", "CANCELLED", "COMPLETED"] },
    }).lean();
    if (task) return resolved;
    if (await hasSeriesScope(actor, resolved.series)) return resolved;
    throw new AppError(403, "You do not have permission for this file.", "FORBIDDEN");
  }

  if (!(await hasSeriesScope(actor, resolved.series))) {
    throw new AppError(403, "You do not have permission for this file.", "FORBIDDEN");
  }

  return resolved;
}

export async function assertCanRunPageAi(actor: RequestActor, pageId: string) {
  const resolved = await resolveStudioPage(pageId);
  const canRun = actor.role === "MANGAKA" && (resolved.series as any).authorId === actor.id;
  if (!canRun) {
    throw new AppError(
      403,
      "Only the production owner can run Studio AI for this page.",
      "FORBIDDEN",
    );
  }
  assertChapterContentUnlocked(resolved.chapter);
  return resolved;
}

export async function assertFileKeyVisible(actor: RequestActor, key: string) {
  // Proposal attachments are embedded in the proposal document rather than
  // stored as standalone Material records. Keep all proposal-owned file keys
  // under the same visibility rules so review screens can preview manuscripts
  // and supporting materials as well as the cover.
  const proposal = await ProposalModel.findOne({
    $or: [
      { coverFileKey: key },
      { "manuscripts.fileKey": key },
      { "manuscripts.key": key },
      { "manuscripts.file.key": key },
      { "materials.fileKey": key },
      { "materials.key": key },
      { "materials.file.key": key },
      { "materials.versions.fileKey": key },
      { "materials.versions.key": key },
      { "materials.versions.file.key": key },
    ],
  }).lean();
  if (actor.role === "BOARD") {
    if (proposal && canReadProposal(actor, proposal)) {
      return { chapter: null, page: null, series: null };
    }
    throw new AppError(403, "You do not have permission for this file.", "FORBIDDEN");
  }

  if (proposal) {
    const canRead =
      (actor.role === "EDITOR" && String((proposal as any).status) !== "DRAFT") ||
      (actor.role === "MANGAKA" && (proposal as any).authorId === actor.id);
    if (canRead) return { chapter: null, page: null, series: null };
    throw new AppError(403, "You do not have permission for this file.", "FORBIDDEN");
  }

  const coverSeries = await SeriesModel.findOne({ coverFileKey: key }).lean();
  if (coverSeries) {
    if (await hasSeriesScope(actor, coverSeries)) {
      return { chapter: null, page: null, series: coverSeries };
    }
    throw new AppError(403, "You do not have permission for this file.", "FORBIDDEN");
  }

  const chapter = await ChapterModel.findOne({
    pages: { $elemMatch: { $or: [{ fileKey: key }, { "metadata.aiWhitened.fileKey": key }] } },
  }).lean();
  if (chapter) {
    const pages = ((chapter as any).pages ?? []) as any[];
    const page = pages.find(
      (item) => item.fileKey === key || item.metadata?.aiWhitened?.fileKey === key,
    );
    if (page) return assertCanReadStudioPage(actor, page.id);
  }

  const material = (await MaterialModel.findOne({
    $or: [{ fileKey: key }, { "versions.fileKey": key }],
  }).lean()) as any;
  if (material?.pageId) return assertCanReadStudioPage(actor, String(material.pageId));
  if (material?.seriesId) {
    const series = await SeriesModel.findOne({ id: String(material.seriesId) }).lean();
    if (series && (await hasSeriesScope(actor, series))) return { chapter: null, page: null, series };
  }

  const submission = (await SubmissionModel.findOne({ fileKey: key }).lean()) as any;
  if (submission?.pageId) return assertCanReadStudioPage(actor, String(submission.pageId));
  if (submission) {
    if (submission.assistantId === actor.id) {
      return { chapter: null, page: null, series: null };
    }
    if (submission.chapterId) {
      const chapter = await ChapterModel.findOne({ id: String(submission.chapterId) }).lean();
      if (chapter) {
        const series = await SeriesModel.findOne({ id: String((chapter as any).seriesId) }).lean();
        if (series && (await hasSeriesScope(actor, series))) return { chapter, page: null, series };
      }
    }
    if (submission.seriesId) {
      const series = await SeriesModel.findOne({ id: String(submission.seriesId) }).lean();
        if (series && (await hasSeriesScope(actor, series))) return { chapter: null, page: null, series };
    }
    throw new AppError(403, "You do not have permission for this file.", "FORBIDDEN");
  }

  throw new AppError(404, "File not found.", "FILE_NOT_FOUND");
}
