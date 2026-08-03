import { asyncRoute, ok, created, AppError } from "../lib/http.js";
import { NotificationModel, SeriesModel, RankingModel, RankingImportModel } from "../db/models.js";
import { paginated, patchById, requireActor } from "./helpers.js";
import { id, nowIso } from "../domain/ids.js";
import { audit } from "../services/audit.service.js";
import { parseBody, rejectProtectedFields } from "../validators/common.js";
import { z } from "zod";
import type { AuthedRequest } from "../types.js";

const rankingImportRowSchema = z
  .object({
    seriesId: z.string().min(1).optional(),
    seriesTitle: z.string().min(1).optional(),
    score: z.coerce.number().min(0).max(10).optional(),
    finalScore: z.coerce.number().min(0).max(10).optional(),
    readerScore: z.coerce.number().min(0).max(10).optional(),
    votes: z.coerce.number().int().min(0).optional(),
    voteCount: z.coerce.number().int().min(0).optional(),
    status: z.string().optional(),
    atRisk: z.boolean().optional(),
  })
  .strict();

const rankingImportSchema = z
  .object({
    period: z.string().min(1).max(80),
    source: z.string().min(1).max(80),
    fileName: z.string().min(1).max(240).optional(),
    rows: z.array(rankingImportRowSchema).min(1).max(500),
  })
  .strict();

export const listNotifications = asyncRoute(async (req: AuthedRequest, res) => {
  const actor = requireActor(req);
  await paginated(
    req,
    res,
    NotificationModel,
    { userId: actor.id },
    { createdAt: -1 },
  );
});

export const markRead = asyncRoute(async (req: AuthedRequest, res) => {
  const actor = requireActor(req);
  const notification = await NotificationModel.findOne({ id: String(req.params.id) }).lean();
  if (!notification) throw new AppError(404, "Notification not found.", "NOTIFICATION_NOT_FOUND");
  if ((notification as any).userId !== actor.id) {
    throw new AppError(403, "You do not have permission to modify this notification.", "FORBIDDEN");
  }
  ok(
    res,
    await patchById(req, NotificationModel, String(req.params.id), "notification.read", {
      readAt: new Date(),
    }),
  );
});

export const listRankings = asyncRoute(async (req: AuthedRequest, res) => {
  const actor = requireActor(req);
  let filter: Record<string, any> = {};

  if (actor.role === "MANGAKA") {
    const series = await SeriesModel.find({ authorId: actor.id }).select("id").lean();
    const seriesIds = series.map((s: any) => s.id);
    filter.seriesId = { $in: seriesIds };
  }

  const querySeriesId = req.query.seriesId;
  if (querySeriesId) {
    if (actor.role === "MANGAKA") {
      const series = await SeriesModel.findOne({
        id: String(querySeriesId),
        authorId: actor.id,
      }).lean();
      if (!series) {
        return ok(res, []);
      }
    }
    filter.seriesId = String(querySeriesId);
  }

  await paginated(req, res, RankingModel, filter, { finalScore: -1 });
});

export const listSeriesRankings = asyncRoute(async (req: AuthedRequest, res) => {
  const actor = requireActor(req);
  const seriesId = String(req.params.seriesId);

  if (actor.role === "MANGAKA") {
    const series = await SeriesModel.findOne({ id: seriesId, authorId: actor.id }).lean();
    if (!series) {
      throw new AppError(
        403,
        "You do not have permission to view rankings for this series.",
        "FORBIDDEN",
      );
    }
  }

  const rankings = await RankingModel.find({ seriesId }).sort({ finalScore: -1 }).lean();
  ok(res, rankings);
});

export const importRankings = asyncRoute(async (req: AuthedRequest, res) => {
  const actor = requireActor(req);
  const body = parseBody(rankingImportSchema, req);
  rejectProtectedFields(body as unknown as Record<string, unknown>);

  const batchId = id("rimport");
  const now = nowIso();

  // Create batch record (PENDING)
  await RankingImportModel.create({
    id: batchId,
    period: body.period,
    sourceFileName: body.fileName,
    importedById: actor.id,
    importedByName: actor.name,
    status: "PENDING",
    totalRows: body.rows.length,
    successRows: 0,
    failedRows: 0,
    errors: [],
    createdAt: now,
    updatedAt: now,
  });

  const seriesIds = [...new Set(body.rows.map((row) => row.seriesId).filter(Boolean))] as string[];
  const seriesRows = await SeriesModel.find({ id: { $in: seriesIds } })
    .select("id title")
    .lean();
  const seriesById = new Map(seriesRows.map((series: any) => [String(series.id), series]));

  const imported = [];
  const errors: string[] = [];

  for (const [index, row] of body.rows.entries()) {
    if (!row.seriesId && !row.seriesTitle) {
      errors.push(`rows.${index}: seriesId or seriesTitle is required.`);
      continue;
    }
    const series = row.seriesId ? seriesById.get(row.seriesId) : null;
    if (row.seriesId && !series) {
      errors.push(`rows.${index}: unknown seriesId ${row.seriesId}.`);
      continue;
    }

    const finalScore = row.finalScore ?? row.score ?? row.readerScore ?? 0;
    const readerScore = row.readerScore ?? row.score ?? finalScore;
    const voteCount = row.voteCount ?? row.votes ?? 0;
    const atRisk = row.atRisk ?? (finalScore < 5 || row.status === "AT_RISK");
    const status = row.status ?? (atRisk ? "AT_RISK" : "ACTIVE");
    const seriesId = row.seriesId ?? id("series-ext");
    const seriesTitle = series?.title ?? row.seriesTitle ?? seriesId;

    // Upsert ranking with importBatchId (Strategy A: upsert on period+seriesId)
    const ranking = await RankingModel.findOneAndUpdate(
      { seriesId, period: body.period },
      {
        $set: {
          seriesId,
          seriesTitle,
          period: body.period,
          readerScore,
          voteCount,
          finalScore,
          status,
          atRisk,
          source: body.source,
          importBatchId: batchId,
          importedById: actor.id,
          importedAt: now,
          importedFrom: body.fileName ?? "manual-import",
          updatedAt: now,
        },
        $setOnInsert: {
          id: id("rank"),
          createdAt: now,
        },
      },
      { returnDocument: "after", upsert: true },
    ).lean();
    imported.push(ranking);
  }

  // Update batch record
  const batchStatus = errors.length > 0 && imported.length === 0 ? "FAILED" : "IMPORTED";
  await RankingImportModel.updateOne(
    { id: batchId },
    {
      $set: {
        status: batchStatus,
        successRows: imported.length,
        failedRows: errors.length,
        errors: errors.map((e) => ({ message: e })),
        importedAt: now,
        updatedAt: now,
      },
    },
  );

  if (errors.length > 0 && imported.length === 0) {
    throw new AppError(400, errors.join("; "), "RANKING_IMPORT_INVALID");
  }

  await audit(req, "RANKING_IMPORTED", "ranking_import", batchId, {
    importBatchId: batchId,
    period: body.period,
    totalRows: body.rows.length,
    successRows: imported.length,
    failedRows: errors.length,
    sourceFileName: body.fileName,
  });

  created(res, {
    id: batchId,
    period: body.period,
    source: body.source,
    fileName: body.fileName ?? "manual-import.csv",
    rowCount: body.rows.length,
    imported: imported.length,
    failed: errors.length,
    status: batchStatus,
    rankings: imported,
  });
});
